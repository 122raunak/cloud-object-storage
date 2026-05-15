const cron = require("node-cron")
const NotificationPreference = require("../models/notificationPreference.model")
const notificationService = require("../services/notification.service")
const { redis } = require("../config/redis")
const logger = require("../utils/logger")

const BATCH_SIZE       = 50
const LOCK_KEY         = "lock:cron:daily_digest"
const LOCK_TTL_SECONDS = 3600 // 1 hour — longer than job should ever take

/**
 * Daily digest cron — runs at 08:00 UTC every day.

 */
function startDailyDigestJob() {
  const task = cron.schedule("0 8 * * *", async () => {
    logger.info("⏰ Daily digest cron triggered")

    // ── Distributed lock ────────────────────────────────────────────────────
    // SET NX = only succeeds if key does not exist (atomic)
    // If another instance already holds the lock, skip this run entirely.
    const acquired = await redis.set(LOCK_KEY, "1", "NX", "EX", LOCK_TTL_SECONDS)
    if (!acquired) {
      logger.info("Daily digest lock held by another instance — skipping this run")
      return
    }

    try {
      const eligibleUsers = await NotificationPreference.find({
        email: { $exists: true, $ne: null },
        "preferences.dailyDigest": true,
      }).lean()

      logger.info({ count: eligibleUsers.length }, "Processing daily digests")

      // Process in batches to avoid overwhelming SMTP connection pool.
      // 50 concurrent sends is the max — adjust BATCH_SIZE to your SMTP limits.
      for (let i = 0; i < eligibleUsers.length; i += BATCH_SIZE) {
        const batch = eligibleUsers.slice(i, i + BATCH_SIZE)
        const results = await Promise.allSettled(
          batch.map((prefs) =>
            notificationService.sendDailyDigestForUser(prefs.userId, prefs)
          )
        )

        // Log any per-user failures without aborting the batch
        results.forEach((result, idx) => {
          if (result.status === "rejected") {
            logger.error(
              { err: result.reason, userId: batch[idx].userId },
              "Failed to send daily digest for user"
            )
          }
        })
      }

      logger.info("Daily digest cron completed")
    } catch (err) {
      logger.error({ err }, "Fatal error in daily digest cron")
    } finally {
      // Always release the lock — even if the job crashes
      await redis.del(LOCK_KEY)
    }
  }, {
    timezone: "UTC",
  })

  logger.info("Daily digest job scheduled — runs at 08:00 UTC daily")
  return task
}

module.exports = { startDailyDigestJob }