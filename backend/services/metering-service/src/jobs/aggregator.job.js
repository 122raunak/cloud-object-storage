const cron = require("node-cron")
const meteringService = require("../services/metering.service")
const logger = require("../utils/logger")

// ─── Helper: get start of today ───────────────────────────────────────────────
const todayStart = () => {
  const now = new Date()
  return new Date(now.getFullYear(), now.getMonth(), now.getDate())
}

// ─── Helper: get start of this month ─────────────────────────────────────────
const monthStart = () => {
  const now = new Date()
  return new Date(now.getFullYear(), now.getMonth(), 1)
}

// ─── Helper: get start of yesterday ──────────────────────────────────────────
const yesterdayStart = () => {
  const d = todayStart()
  d.setDate(d.getDate() - 1)
  return d
}

// ─── Helper: get start of last month ─────────────────────────────────────────
const lastMonthStart = () => {
  const now = new Date()
  return new Date(now.getFullYear(), now.getMonth() - 1, 1)
}

// ═════════════════════════════════════════════════════════════════════════════
// JOB 1 — Hourly: re-aggregate today's daily summary
// Keeps the live daily row accurate throughout the day
// Runs at minute 0 of every hour: 0 * * * *
// ═════════════════════════════════════════════════════════════════════════════
const hourlyJob = cron.schedule("0 * * * *", async () => {
  logger.info("Hourly aggregation job started")

  try {
    await meteringService.aggregatePeriod("daily", todayStart())
    logger.info("Hourly aggregation job completed")
  } catch (err) {
    logger.error({ err }, "Hourly aggregation job failed")
  }
})

// ═════════════════════════════════════════════════════════════════════════════
// JOB 2 — Midnight: finalize yesterday + re-aggregate current month
// Runs at 00:05 every day (5 min after midnight to let late events land)
// ═════════════════════════════════════════════════════════════════════════════
const midnightJob = cron.schedule("5 0 * * *", async () => {
  logger.info("Midnight aggregation job started")

  try {
    // Finalize yesterday's daily row (full recompute — safe to run multiple times)
    await meteringService.aggregatePeriod("daily", yesterdayStart())

    // Also recompute this month's running monthly total
    await meteringService.aggregatePeriod("monthly", monthStart())

    logger.info("Midnight aggregation job completed")
  } catch (err) {
    logger.error({ err }, "Midnight aggregation job failed")
  }
})

// ═════════════════════════════════════════════════════════════════════════════
// JOB 3 — 1st of month at 00:10: finalize last month
// Ensures the previous month's summary is fully correct after month rollover
// ═════════════════════════════════════════════════════════════════════════════
const monthlyFinalizeJob = cron.schedule("10 0 1 * *", async () => {
  logger.info("Monthly finalization job started")

  try {
    await meteringService.aggregatePeriod("monthly", lastMonthStart())
    logger.info("Monthly finalization job completed")
  } catch (err) {
    logger.error({ err }, "Monthly finalization job failed")
  }
})

const startJobs = () => {
  hourlyJob.start()
  midnightJob.start()
  monthlyFinalizeJob.start()
  logger.info("Aggregator cron jobs scheduled")
}

module.exports = { startJobs }