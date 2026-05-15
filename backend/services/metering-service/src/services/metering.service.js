const { pool } = require("../config/db")
const logger = require("../utils/logger")

const HANDLED_EVENTS = ["file.uploaded", "file.downloaded", "file.deleted", "file.restored"]

class MeteringService {

  // RECORD RAW EVENT — IDEMPOTENT
  async recordEvent(eventId, eventType, payload) {
    if (!HANDLED_EVENTS.includes(eventType)) {
      logger.warn({ eventType }, "Unhandled event type — skipping")
      return
    }

    if (!eventId) {
      logger.error({ eventType, payload }, "Event missing eventId — skipping to prevent data corruption")
      return
    }

    const { userId, fileId, fileName, size, mimeType } = payload

    if (!userId) {
      logger.error({ eventId, eventType }, "Event missing userId — skipping")
      return
    }

    const client = await pool.connect()

    try {
      await client.query("BEGIN")

      const result = await client.query(
        `INSERT INTO usage_events
           (event_id, user_id, event_type, file_id, file_name, bytes, mime_type)
         VALUES ($1, $2, $3, $4, $5, $6, $7)
         ON CONFLICT (event_id) DO NOTHING`,
        [
          eventId,
          userId,
          eventType,
          fileId   || null,
          fileName || null,
          size     || 0,
          mimeType || null,
        ]
      )

      if (result.rowCount === 0) {
        await client.query("ROLLBACK")
        logger.warn({ eventId }, "Duplicate event ignored — idempotency enforced")
        return
      }

      await this._updateLiveSummary(client, eventType, userId, size || 0)

      await client.query("COMMIT")
      logger.info({ eventId, eventType, userId }, "Usage event recorded")

    } catch (err) {
      await client.query("ROLLBACK")
      logger.error({ err, eventId }, "Failed to record usage event — rolled back")
      throw err
    } finally {
      client.release()
    }
  }


  // UPDATE LIVE SUMMARIES (same DB client = same transaction)
  async _updateLiveSummary(client, eventType, userId, bytes) {
    const now = new Date()

    const dailyStart   = this._toDateString(new Date(now.getFullYear(), now.getMonth(), now.getDate()))
    const monthlyStart = this._toDateString(new Date(now.getFullYear(), now.getMonth(), 1))

    for (const [periodType, periodStart] of [
      ["daily",   dailyStart],
      ["monthly", monthlyStart],
    ]) {
      await this._upsertSummary(client, eventType, userId, bytes, periodType, periodStart)
    }
  }

  async _upsertSummary(client, eventType, userId, bytes, periodType, periodStart) {
    const deltas = {
      "file.uploaded":   { bytes_uploaded: bytes,  bytes_downloaded: 0,     file_count:  1, storage_used:  bytes, api_calls: 1 },
      "file.downloaded": { bytes_uploaded: 0,       bytes_downloaded: bytes, file_count:  0, storage_used:  0,     api_calls: 1 },
      "file.deleted":    { bytes_uploaded: 0,       bytes_downloaded: 0,     file_count: -1, storage_used: -bytes, api_calls: 1 },
      "file.restored":   { bytes_uploaded: 0,       bytes_downloaded: 0,     file_count:  1, storage_used:  bytes, api_calls: 0 },
    }

    const d = deltas[eventType]
    if (!d) return

    await client.query(
      `INSERT INTO usage_summaries
         (user_id, period_type, period_start,
          bytes_uploaded, bytes_downloaded, api_calls, file_count, storage_used)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       ON CONFLICT (user_id, period_type, period_start)
       DO UPDATE SET
         bytes_uploaded   = usage_summaries.bytes_uploaded   + $4,
         bytes_downloaded = usage_summaries.bytes_downloaded + $5,
         api_calls        = usage_summaries.api_calls        + $6,
         file_count       = GREATEST(0, usage_summaries.file_count   + $7),
         storage_used     = GREATEST(0, usage_summaries.storage_used + $8),
         updated_at       = NOW()`,
      [
        userId,
        periodType,
        periodStart,
        d.bytes_uploaded,
        d.bytes_downloaded,
        d.api_calls,
        d.file_count,
        d.storage_used,
      ]
    )
  }


  // GET CURRENT USAGE — single query
  async getCurrentUsage(userId) {
    const now = new Date()
    const dailyStart   = this._toDateString(new Date(now.getFullYear(), now.getMonth(), now.getDate()))
    const monthlyStart = this._toDateString(new Date(now.getFullYear(), now.getMonth(), 1))

    const result = await pool.query(
      `SELECT period_type, period_start, bytes_uploaded, bytes_downloaded,
              api_calls, file_count, storage_used, updated_at
       FROM usage_summaries
       WHERE user_id     = $1
         AND period_type  IN ('daily', 'monthly')
         AND period_start IN ($2, $3)`,
      [userId, dailyStart, monthlyStart]
    )

    const rows       = result.rows
    const dailyRow   = rows.find((r) => r.period_type === "daily")
    const monthlyRow = rows.find((r) => r.period_type === "monthly")

    return {
      daily:   dailyRow   || this._emptyPeriod(userId, "daily",   dailyStart),
      monthly: monthlyRow || this._emptyPeriod(userId, "monthly", monthlyStart),
    }
  }

  // GET DAILY BREAKDOWN
  async getDailyBreakdown(userId, days = 30) {
    const result = await pool.query(
      `SELECT period_start, bytes_uploaded, bytes_downloaded,
              api_calls, file_count, storage_used, updated_at
       FROM usage_summaries
       WHERE user_id    = $1
         AND period_type = 'daily'
         AND period_start >= CURRENT_DATE - ($2 || ' days')::INTERVAL
       ORDER BY period_start DESC`,
      [userId, days]
    )

    return result.rows
  }

  // GET MONTHLY BREAKDOWN
  async getMonthlyBreakdown(userId, months = 12) {
    const result = await pool.query(
      `SELECT period_start, bytes_uploaded, bytes_downloaded,
              api_calls, file_count, storage_used, updated_at
       FROM usage_summaries
       WHERE user_id    = $1
         AND period_type = 'monthly'
         AND period_start >= DATE_TRUNC('month', CURRENT_DATE - ($2 || ' months')::INTERVAL)
       ORDER BY period_start DESC`,
      [userId, months]
    )

    return result.rows
  }


  // GET EVENT LOG 
  async getEventLog(userId, { limit = 50, offset = 0, eventType = null } = {}) {
    const parsedLimit  = parseInt(limit,  10)
    const parsedOffset = parseInt(offset, 10)

    const dataParams  = [userId, parsedLimit, parsedOffset]
    const countParams = [userId]
    const conditions  = ["user_id = $1"]

    if (eventType) {
      dataParams.push(eventType)
      countParams.push(eventType)
      conditions.push(`event_type = $${countParams.length + 1 - 1}`)
    }
    const dataConditions  = ["user_id = $1"]
    const countConditions = ["user_id = $1"]
    const dataP           = [userId, parsedLimit, parsedOffset]
    const countP          = [userId]

    if (eventType) {
      dataP.push(eventType)
      dataConditions.push(`event_type = $${dataP.length}`)

      countP.push(eventType)
      countConditions.push(`event_type = $${countP.length}`)
    }

    const [dataResult, countResult] = await Promise.all([
      pool.query(
        `SELECT id, event_id, event_type, file_id, file_name, bytes, mime_type, created_at
         FROM usage_events
         WHERE ${dataConditions.join(" AND ")}
         ORDER BY created_at DESC
         LIMIT $2 OFFSET $3`,
        dataP
      ),
      pool.query(
        `SELECT COUNT(*) AS total
         FROM usage_events
         WHERE ${countConditions.join(" AND ")}`,
        countP
      ),
    ])

    return {
      data:   dataResult.rows,
      total:  parseInt(countResult.rows[0].total, 10),
      limit:  parsedLimit,
      offset: parsedOffset,
    }
  }

  // AGGREGATE PERIOD
  async aggregatePeriod(periodType, periodStart) {
    const periodStartStr = this._toDateString(
      typeof periodStart === "string" ? new Date(periodStart) : periodStart
    )
    const periodEnd = this._getPeriodEnd(periodType, periodStartStr)

    logger.info({ periodType, periodStart: periodStartStr }, "Aggregation started")

    // replaces: fetch distinct users → loop → query per user (N+1 pattern)
    const result = await pool.query(
      `INSERT INTO usage_summaries
         (user_id, period_type, period_start,
          bytes_uploaded, bytes_downloaded, api_calls, file_count, storage_used)
       SELECT
         user_id,
         $1,
         $2::date,
         COALESCE(SUM(CASE WHEN event_type = 'file.uploaded'   THEN bytes ELSE 0 END), 0),
         COALESCE(SUM(CASE WHEN event_type = 'file.downloaded' THEN bytes ELSE 0 END), 0),
         COUNT(*),
         GREATEST(0, COALESCE(SUM(
           CASE WHEN event_type IN ('file.uploaded',  'file.restored') THEN  1
                WHEN event_type  = 'file.deleted'                      THEN -1
                ELSE 0 END), 0)),
         GREATEST(0, COALESCE(SUM(
           CASE WHEN event_type IN ('file.uploaded',  'file.restored') THEN  bytes
                WHEN event_type  = 'file.deleted'                      THEN -bytes
                ELSE 0 END), 0))
       FROM usage_events
       WHERE created_at >= $2
         AND created_at  < $3
       GROUP BY user_id
       ON CONFLICT (user_id, period_type, period_start)
       DO UPDATE SET
         bytes_uploaded   = EXCLUDED.bytes_uploaded,
         bytes_downloaded = EXCLUDED.bytes_downloaded,
         api_calls        = EXCLUDED.api_calls,
         file_count       = EXCLUDED.file_count,
         storage_used     = EXCLUDED.storage_used,
         updated_at       = NOW()`,
      [periodType, periodStartStr, periodEnd]
    )

    logger.info({ periodType, periodStart: periodStartStr, usersAggregated: result.rowCount }, "Aggregation complete")
    return result.rowCount
  }


  // PRIVATE HELPERS
  _emptyPeriod(userId, periodType, periodStart) {
    return {
      user_id:          userId,
      period_type:      periodType,
      period_start:     periodStart,
      bytes_uploaded:   0,
      bytes_downloaded: 0,
      api_calls:        0,
      file_count:       0,
      storage_used:     0,
    }
  }

  _toDateString(date) {
    return date.toISOString().split("T")[0]
  }

  _getPeriodEnd(periodType, periodStartStr) {
    const d = new Date(periodStartStr)
    if (periodType === "daily") {
      d.setDate(d.getDate() + 1)
    } else if (periodType === "monthly") {
      d.setMonth(d.getMonth() + 1)
    } else {
      throw new Error(`Unknown period type: ${periodType}`)
    }
    return this._toDateString(d)
  }
}

module.exports = new MeteringService()