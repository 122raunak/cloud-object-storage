const axios        = require("axios")
const axiosRetry   = require("axios-retry").default
const { randomUUID } = require("crypto")
const Decimal      = require("decimal.js")
const pLimit       = require("p-limit")
const { pool }     = require("../config/db")
const { redis }    = require("../config/redis")
const ApiError     = require("../utils/ApiError")
const logger       = require("../utils/logger")
const { Queue } = require("bullmq")


const GB = new Decimal(1024).pow(3)  

const calculateCharge = (usage, tier) => {
  const storageGB  = Decimal.max(0, new Decimal(usage.storage_used    || 0).div(GB).minus(tier.free_storage_gb))
  const uploadGB   = Decimal.max(0, new Decimal(usage.bytes_uploaded  || 0).div(GB).minus(tier.free_upload_gb))
  const downloadGB = Decimal.max(0, new Decimal(usage.bytes_downloaded || 0).div(GB).minus(tier.free_download_gb))
  const apiCalls   = Decimal.max(0, new Decimal(usage.api_calls       || 0).minus(tier.free_api_calls))

  const storage_charge  = storageGB.mul(tier.storage_price)
  const upload_charge   = uploadGB.mul(tier.upload_price)
  const download_charge = downloadGB.mul(tier.download_price)
  const api_charge      = apiCalls.div(1000).mul(tier.api_call_price)
  const total_amount    = storage_charge.plus(upload_charge).plus(download_charge).plus(api_charge)

  // Return strings — NUMERIC columns in Postgres accept them and preserve precision.
  return {
    storage_charge:  storage_charge.toFixed(4),
    upload_charge:   upload_charge.toFixed(4),
    download_charge: download_charge.toFixed(4),
    api_charge:      api_charge.toFixed(4),
    total_amount:    total_amount.toFixed(4),
  }
}

const billingEventsQueue = new Queue("billing-events", {
  connection: {
    host: process.env.REDIS_HOST,
    port: parseInt(process.env.REDIS_PORT, 10),
    maxRetriesPerRequest: null,
  },
})


axiosRetry(axios, {
  retries:        3,
  retryDelay:     axiosRetry.exponentialDelay,    
  retryCondition: (err) =>
    axiosRetry.isNetworkOrIdempotentRequestError(err) ||
    (err?.response?.status >= 500),
  onRetry: (retryCount, err, config) => {
    logger.warn({ retryCount, url: config.url, status: err?.response?.status },
      "Retrying metering HTTP call")
  },
})

// ─── Metering calls ───────────────────────────────────────────────────────────

const serviceHeaders = {
  "x-user-id":   "billing-service",
  "x-user-role": "service",
}

const fetchMonthlyUsage = async (userId, year, month) => {
  const response = await axios.get(
    `${process.env.METERING_SERVICE_URL}/api/v1/metering/usage/${userId}/monthly`,
    { headers: serviceHeaders, params: { months: 1 }, timeout: 10000 }
  )

  const summaries = response.data?.data || []
  const summary   = summaries[0] || null

  if (!summary) {
    logger.warn({ userId, year, month },
      "No usage summary returned from metering — generating $0 invoice")
  }

  return summary
}

const fetchCurrentUsage = async (userId) => {
  const response = await axios.get(
    `${process.env.METERING_SERVICE_URL}/api/v1/metering/usage/${userId}`,
    { headers: serviceHeaders, timeout: 10000 }
  )
  return response.data?.data || null
}

// ─── Tier resolution ──────────────────────────────────────────────────────────

const getUserTier = async (userId) => {
  const { rows } = await pool.query(
    `SELECT pt.*
     FROM   pricing_tiers pt
     JOIN   user_plans up ON up.tier_id = pt.id
     WHERE  up.user_id = $1`,
    [userId]
  )
  if (rows.length > 0) return rows[0]

  // Fall back to the lowest tier (Free)
  const { rows: fallback } = await pool.query(
    `SELECT * FROM pricing_tiers ORDER BY id ASC LIMIT 1`
  )
  if (fallback.length === 0) throw new ApiError(500, "No pricing tiers configured — run initDB seed")
  return fallback[0]
}

// ─── Service class ────────────────────────────────────────────────────────────

class BillingService {

  // ── Plans ──────────────────────────────────────────────────────────────────

  async listPlans() {
    const { rows } = await pool.query(
      `SELECT * FROM pricing_tiers ORDER BY id ASC`
    )
    return rows
  }

  async assignPlan(userId, tierId) {
    const { rows: tierRows } = await pool.query(
      `SELECT id FROM pricing_tiers WHERE id = $1`,
      [tierId]
    )
    if (tierRows.length === 0) throw new ApiError(404, `Pricing tier ${tierId} not found`)

    const { rows } = await pool.query(
      `INSERT INTO user_plans (user_id, tier_id, started_at, updated_at)
       VALUES ($1, $2, NOW(), NOW())
       ON CONFLICT (user_id)
       DO UPDATE SET tier_id = EXCLUDED.tier_id, updated_at = NOW()
       RETURNING *`,
      [userId, tierId]
    )
    return rows[0]
  }

  // ── Invoices ───────────────────────────────────────────────────────────────

  async listInvoices(userId, { status, limit, offset }) {
    const params = [userId]
    let where = "WHERE user_id = $1"

    if (status) {
      params.push(status)
      where += ` AND status = $${params.length}`
    }

    const limitIdx  = params.push(limit)
    const offsetIdx = params.push(offset)

    const { rows } = await pool.query(
      `SELECT *, COUNT(*) OVER() AS total_count
       FROM   invoices
       ${where}
       ORDER  BY period_start DESC
       LIMIT  $${limitIdx} OFFSET $${offsetIdx}`,
      params
    )

    const total = parseInt(rows[0]?.total_count || 0, 10)

    // Strip internal column before returning to client
    const invoices = rows.map(({ total_count, ...rest }) => rest)

    return { invoices, total, limit, offset }
  }

  async getInvoice(userId, invoiceId) {
    const { rows } = await pool.query(
      `SELECT * FROM invoices WHERE id = $1 AND user_id = $2`,
      [invoiceId, userId]
    )
    if (rows.length === 0) throw new ApiError(404, `Invoice ${invoiceId} not found`)
    return rows[0]
  }

  async getCurrentEstimate(userId) {
    const now   = new Date()
    const year  = now.getUTCFullYear()
    const month = now.getUTCMonth() + 1

    let usageData
    try {
      usageData = await fetchCurrentUsage(userId)
    } catch (err) {
      logger.warn({ err, userId }, "Failed to fetch current usage from metering service")
      throw new ApiError(502, "Could not retrieve usage data from metering service")
    }

    const monthly = usageData?.monthly || {}
    const usage = {
      storage_used:     parseInt(monthly.storage_used     || 0, 10),
      bytes_uploaded:   parseInt(monthly.bytes_uploaded   || 0, 10),
      bytes_downloaded: parseInt(monthly.bytes_downloaded || 0, 10),
      api_calls:        parseInt(monthly.api_calls        || 0, 10),
    }

    const tier    = await getUserTier(userId)
    const charges = calculateCharge(usage, tier)   

    return {
      period:   `${year}-${String(month).padStart(2, "0")}`,
      usage,
      tier:     { id: tier.id, name: tier.name },
      charges,
      currency: "USD",
      note:     "This is an estimate based on current month usage and may change.",
    }
  }

  async generateInvoice(userId, year, month) {
  
    const now          = new Date()
    const currentYear  = now.getUTCFullYear()
    const currentMonth = now.getUTCMonth() + 1

    if (year > currentYear || (year === currentYear && month >= currentMonth)) {
      throw new ApiError(400, "Cannot generate invoice for the current or a future period")
    }

    const periodStartStr = `${year}-${String(month).padStart(2, "0")}-01`
    const lastDay        = new Date(Date.UTC(year, month, 0)).getDate()
    const periodEndStr   = `${year}-${String(month).padStart(2, "0")}-${String(lastDay).padStart(2, "0")}`

    let usageSummary
    try {
      usageSummary = await fetchMonthlyUsage(userId, year, month)
    } catch (err) {
      logger.error({ err, userId }, "Failed to fetch monthly usage for invoice generation")
      throw new ApiError(502, "Could not retrieve usage data from metering service")
    }

    const usage = usageSummary
      ? {
          storage_used:     parseInt(usageSummary.storage_used     || 0, 10),
          bytes_uploaded:   parseInt(usageSummary.bytes_uploaded   || 0, 10),
          bytes_downloaded: parseInt(usageSummary.bytes_downloaded || 0, 10),
          api_calls:        parseInt(usageSummary.api_calls        || 0, 10),
        }
      : { storage_used: 0, bytes_uploaded: 0, bytes_downloaded: 0, api_calls: 0 }

    const tier = await getUserTier(userId)
    const { storage_charge, upload_charge, download_charge, api_charge, total_amount } =
      calculateCharge(usage, tier)   
    const { rows } = await pool.query(
      `INSERT INTO invoices
         (user_id, period_start, period_end,
          bytes_uploaded, bytes_downloaded, api_calls, storage_used,
          storage_charge, upload_charge, download_charge, api_charge, total_amount,
          currency, status, issued_at, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12,
               'USD', 'issued', NOW(), NOW(), NOW())
       ON CONFLICT (user_id, period_start) DO NOTHING
       RETURNING *`,
      [
        userId, periodStartStr, periodEndStr,
        usage.bytes_uploaded, usage.bytes_downloaded, usage.api_calls, usage.storage_used,
        storage_charge, upload_charge, download_charge, api_charge, total_amount,
      ]
    )

    // ON CONFLICT DO NOTHING returns 0 rows if a row already existed
    if (rows.length === 0) {
      const { rows: existing } = await pool.query(
        `SELECT * FROM invoices WHERE user_id = $1 AND period_start = $2`,
        [userId, periodStartStr]
      )
      logger.info({ userId, periodStart: periodStartStr }, "Invoice already exists, returning existing")
      return { invoice: existing[0], created: false }
    }

    const invoice = rows[0]

    // Publish invoice.generated event — non-fatal if Redis is temporarily down
    try {
      const eventId = randomUUID()
      await billingEventsQueue.add(
        "invoice.generated",
        {
          eventId,
          eventType: "invoice.generated",
          version:   "v1",
          timestamp: new Date().toISOString(),
          data: {
            invoiceId:   invoice.id,
            userId,
            periodStart: periodStartStr,
            periodEnd:   periodEndStr,
            totalAmount: invoice.total_amount,
            currency:    invoice.currency,
          },
        },
        {
          jobId:    eventId,
          attempts: 5,
          backoff:  { type: "exponential", delay: 2000 },
          removeOnComplete: { age: 24 * 3600 },
          removeOnFail:     { age: 7 * 24 * 3600 },
        }
      )
      logger.info({ invoiceId: invoice.id }, "invoice.generated event published")
    } catch (err) {
      logger.warn({ err, invoiceId: invoice.id }, "Failed to publish invoice.generated event")
    }

    logger.info({ invoiceId: invoice.id, userId, total: invoice.total_amount }, "Invoice generated")
    return { invoice, created: true }
  }

  // ── Cron helper ────────────────────────────────────────────────────────────

  async generateInvoicesForAllUsers(year, month) {
    const { rows: users } = await pool.query(`
      SELECT DISTINCT user_id FROM user_plans
      UNION
      SELECT DISTINCT user_id FROM invoices
    `)

    logger.info({ count: users.length, year, month }, "Starting monthly invoice run")
    const results = { generated: 0, skipped: 0, errors: 0 }

    const limit = pLimit(10)   // max 10 concurrent metering HTTP calls

    const tasks = users.map(({ user_id }) =>
      limit(async () => {
        try {
          const { created } = await this.generateInvoice(user_id, year, month)
          if (created) results.generated++
          else         results.skipped++
        } catch (err) {
          results.errors++
          logger.error({ err, userId: user_id }, "Failed to generate invoice in monthly run")
        }
      })
    )

    await Promise.all(tasks)

    logger.info(results, "Monthly invoice run complete")
    return results
  }
}

module.exports = new BillingService()