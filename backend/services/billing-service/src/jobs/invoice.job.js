const cron = require("node-cron")
const billingService = require("../services/billing.service")
const logger = require("../utils/logger")

/**
 * Runs on the 1st of every month at 00:30 UTC.
 * Generates invoices for the previous calendar month for all known users.
 */
function startJobs() {
  cron.schedule(
    "30 0 1 * *",
    async () => {
      const now = new Date()
      // Target = previous month
      const target = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - 1, 1))
      const year = target.getUTCFullYear()
      const month = target.getUTCMonth() + 1

      logger.info({ year, month }, "Monthly invoice cron started")

      try {
        const results = await billingService.generateInvoicesForAllUsers(year, month)
        logger.info(results, "Monthly invoice cron completed")
      } catch (err) {
        logger.error({ err }, "Monthly invoice cron failed")
      }
    },
    { timezone: "UTC" }
  )

  logger.info("Invoice cron job scheduled — runs on 1st of every month at 00:30 UTC")
}

module.exports = { startJobs }