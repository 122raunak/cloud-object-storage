const cron = require("node-cron")
const NotificationPreference = require("../models/notificationPreference.model")
const notificationService = require("../services/notification.service")
const { redis } = require("../config/redis")
const logger = require("../utils/logger")

const BATCH_SIZE       = 50
const LOCK_KEY         = "lock:cron:weekly_report"
const LOCK_TTL_SECONDS = 3600 // 1 hour

/**
 * Weekly storage report cron — runs every Monday at 09:00 UTC.

 */
function startWeeklyReportJob() {
  const task = cron.schedule("0 9 * * 1", async () => {
    logger.info("Weekly report cron triggered")

    // ── Distributed lock ────────────────────────────────────────────────────
    const acquired = await redis.set(LOCK_KEY, "1", "NX", "EX", LOCK_TTL_SECONDS)
    if (!acquired) {
      logger.info("Weekly report lock held by another instance — skipping this run")
      return
    }

    try {
      const eligibleUsers = await NotificationPreference.find({
        email: { $exists: true, $ne: null },
        "preferences.weeklyReport": true,
      }).lean()

      logger.info({ count: eligibleUsers.length }, "Processing weekly reports")

      for (let i = 0; i < eligibleUsers.length; i += BATCH_SIZE) {
        const batch = eligibleUsers.slice(i, i + BATCH_SIZE)
        const results = await Promise.allSettled(
          batch.map((prefs) =>
            notificationService.sendWeeklyReportForUser(prefs.userId, prefs)
          )
        )

        results.forEach((result, idx) => {
          if (result.status === "rejected") {
            logger.error(
              { err: result.reason, userId: batch[idx].userId },
              "Failed to send weekly report for user"
            )
          }
        })
      }

      logger.info("Weekly report cron completed")
    } catch (err) {
      logger.error({ err }, "Fatal error in weekly report cron")
    } finally {
      // Always release the lock
      await redis.del(LOCK_KEY)
    }
  }, {
    timezone: "UTC",
  })

  logger.info("Weekly report job scheduled — runs every Monday at 09:00 UTC")
  return task
}

module.exports = { startWeeklyReportJob }