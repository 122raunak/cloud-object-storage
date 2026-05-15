const Notification = require("../models/notification.model")
const NotificationPreference = require("../models/notificationPreference.model")
const { sendMail } = require("../config/mailer")
const { redis } = require("../config/redis")
const logger = require("../utils/logger")

const invoiceGeneratedTemplate = require("../templates/invoiceGenerated")
const budgetAlertTemplate      = require("../templates/budgetAlert")
const storageWarningTemplate   = require("../templates/storageWarning")
const loginAlertTemplate       = require("../templates/loginAlert")
const dailyDigestTemplate      = require("../templates/dailyDigest")
const weeklyReportTemplate     = require("../templates/weeklyReport")

// ─── Constants ─────────────────────────────────────────────────────────────────
const EMAIL_RATE_LIMIT          = 10
const EMAIL_RATE_WINDOW_SECONDS = 3600
const STORAGE_KEY_TTL_SECONDS   = 7 * 24 * 3600
const IDEMPOTENCY_KEY_TTL       = 86400 // 24h — dedup window for events

class NotificationService {

  // Preferences

  async getPreferences(userId) {
    const prefs = await NotificationPreference.findOne({ userId })
    if (!prefs) {
      // Return defaults without persisting — upsert happens on first PUT
      return {
        userId,
        email: null,
        budgetThreshold: 0,
        storageQuotaGB: parseFloat(process.env.USER_STORAGE_QUOTA_GB || "5"),
        preferences: {
          invoiceGenerated: true,
          budgetAlert:      true,
          storageWarning:   true,
          loginAlert:       true,
          dailyDigest:      true,
          weeklyReport:     true,
        },
      }
    }
    return prefs
  }

  async updatePreferences(userId, updates) {
    const prefs = await NotificationPreference.findOneAndUpdate(
      { userId },
      { $set: updates },
      { new: true, upsert: true, runValidators: true }
    )
    logger.info({ userId }, "Notification preferences updated")
    return prefs
  }

  // Notification Log

  async listNotifications(userId, { page = 1, limit = 20, type, status } = {}) {
    const query = { userId }
    if (type)   query.type   = type
    if (status) query.status = status

    const skip = (page - 1) * limit
    const [notifications, total] = await Promise.all([
      Notification.find(query).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
      Notification.countDocuments(query),
    ])

    return {
      notifications,
      pagination: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit),
      },
    }
  }

  async getUnreadCount(userId) {
    // "pending" = queued but not yet sent.
    // NOTE: For a true "unread by user" count, add a `read` boolean field
    // to the Notification model and expose a PATCH /read endpoint.
    const count = await Notification.countDocuments({ userId, status: "pending" })
    return { count }
  }

  // Rate Limiting — atomic pipeline, no race condition

  async checkRateLimit(userId) {
    const key = `email_rate:${userId}`

    // Atomic pipeline: SET NX (only if not exists) then INCR
    // This eliminates the incr+expire race condition from the original code.
    const pipeline = redis.pipeline()
    pipeline.set(key, 0, "EX", EMAIL_RATE_WINDOW_SECONDS, "NX") // set only if not exists
    pipeline.incr(key)
    const results = await pipeline.exec()

    // results[1] = [error, incrValue]
    const count = results[1][1]
    return count <= EMAIL_RATE_LIMIT
  }

  // Idempotency — Redis-based O(1) dedup (replaces slow MongoDB query)

  /**
   * Atomically check-and-mark an eventId as processed.
   * Returns true if this is the FIRST time we've seen this eventId (safe to process).
   * Returns false if already processed (skip).
   *
   * Uses SET NX (set if not exists) — atomic, no race condition.
   */
  async markEventAsProcessed(eventId) {
    if (!eventId) return true // No eventId = cannot deduplicate, allow through
    const key = `processed_event:${eventId}`
    // Returns "OK" if set, null if key already exists
    const result = await redis.set(key, "1", "EX", IDEMPOTENCY_KEY_TTL, "NX")
    return result === "OK" // true = first time, false = duplicate
  }

  // Core send helper — creates log entry + sends email

  async _sendNotification({ userId, type, to, subject, html, metadata = {}, eventId = null }) {
    // Create notification log entry in pending state
    const notification = await Notification.create({
      userId,
      type,
      channel: "email",
      status: "pending",
      subject,
      metadata,
      eventId,
      createdAt: new Date(),
    })

    // Check per-user email rate limit
    const withinLimit = await this.checkRateLimit(userId)
    if (!withinLimit) {
      logger.warn({ userId, type }, "Email rate limit exceeded — skipping send")
      await Notification.findByIdAndUpdate(notification._id, {
        status: "failed",
        metadata: { ...metadata, reason: "rate_limit_exceeded" },
      })
      return null
    }

    // Send email — non-fatal, returns boolean
    const success = await sendMail({ to, subject, html })

    await Notification.findByIdAndUpdate(notification._id, {
      status: success ? "sent" : "failed",
      sentAt: success ? new Date() : undefined,
    })

    if (!success) {
      // BullMQ will retry the entire job — the notification log entry will have
      // a duplicate on retry. The eventId dedup key prevents sending a 2nd email,
      // but the log entry is created before the send attempt. This is intentional:
      // we want a record of every attempt. Use eventId to trace duplicates.
      logger.warn({ userId, type, notificationId: notification._id }, "Email send failed — BullMQ will retry job")
    }

    return notification
  }

  // 1. Invoice Generated

  async handleInvoiceGenerated(event) {
    const { eventId, data } = event
    const { userId, invoiceId, periodStart, periodEnd, totalAmount, currency, lineItems = [] } = data

    const prefs = await NotificationPreference.findOne({ userId })
    if (!prefs?.email) {
      logger.warn({ userId }, "No email configured — skipping invoice notification")
      return
    }

    // ── Invoice email ────────────────────────────────────────────────────────
    if (prefs.preferences.invoiceGenerated) {
      // Atomic dedup check — first-time returns true, duplicate returns false
      const isFirst = await this.markEventAsProcessed(eventId)
      if (!isFirst) {
        logger.info({ eventId }, "invoice.generated already processed — skipping")
      } else {
        const { subject, html } = invoiceGeneratedTemplate({
          invoiceId,
          periodStart,
          periodEnd,
          totalAmount,
          currency,
          lineItems,
        })

        await this._sendNotification({
          userId,
          type: "invoice_generated",
          to: prefs.email,
          subject,
          html,
          metadata: { invoiceId, totalAmount, currency },
          eventId,
        })

        logger.info({ userId, invoiceId }, "Invoice notification sent")
      }
    }

    // ── Budget alert — separate dedup key ────────────────────────────────────
    if (
      prefs.preferences.budgetAlert &&
      prefs.budgetThreshold > 0 &&
      parseFloat(totalAmount) > prefs.budgetThreshold
    ) {
      const budgetEventId = `${eventId}_budget_alert`
      const isFirst = await this.markEventAsProcessed(budgetEventId)

      if (isFirst) {
        const { subject, html } = budgetAlertTemplate({
          invoiceId,
          totalAmount,
          currency,
          threshold: prefs.budgetThreshold,
          periodStart,
          periodEnd,
        })

        await this._sendNotification({
          userId,
          type: "budget_alert",
          to: prefs.email,
          subject,
          html,
          metadata: { invoiceId, totalAmount, threshold: prefs.budgetThreshold },
          eventId: budgetEventId,
        })

        logger.info({ userId, invoiceId, totalAmount, threshold: prefs.budgetThreshold }, "Budget alert sent")
      }
    }
  }


  // 2. Storage Warning (triggered by file.uploaded)
  async handleFileUploaded(event) {
    const { data } = event
    const { userId, size = 0 } = data

    const prefs = await NotificationPreference.findOne({ userId })
    if (!prefs?.email || !prefs.preferences.storageWarning) return

    // Accumulate per-user storage usage in Redis (bytes)
    const storageKey = `storage_used:${userId}`
    const newTotal   = await redis.incrby(storageKey, size)
    await redis.expire(storageKey, STORAGE_KEY_TTL_SECONDS)

    const quotaBytes  = (prefs.storageQuotaGB || parseFloat(process.env.USER_STORAGE_QUOTA_GB || "5")) * 1024 ** 3
    const percentUsed = (newTotal / quotaBytes) * 100
    const usedGB      = parseFloat((newTotal / 1024 ** 3).toFixed(3))
    const quotaGB     = prefs.storageQuotaGB

    logger.debug({ userId, percentUsed: percentUsed.toFixed(1), usedGB, quotaGB }, "Storage check")

    // Reset flags if user freed space below 80%
    if (percentUsed < 80 && (prefs.storageAlertsSent.eighty || prefs.storageAlertsSent.ninetyFive)) {
      await NotificationPreference.findOneAndUpdate(
        { userId },
        { $set: { "storageAlertsSent.eighty": false, "storageAlertsSent.ninetyFive": false } }
      )
      return
    }

    const thresholds = [
      { level: 95, flag: "ninetyFive" },
      { level: 80, flag: "eighty" },
    ]

    for (const { level, flag } of thresholds) {
      if (percentUsed < level) continue

      const updated = await NotificationPreference.findOneAndUpdate(
        { userId, [`storageAlertsSent.${flag}`]: false }, // Only match if NOT already sent
        { $set: { [`storageAlertsSent.${flag}`]: true } },
        { new: false } // Return original doc to confirm we made the change
      )

      if (!updated) {
        // Another process already sent this threshold alert — skip
        logger.debug({ userId, level }, "Storage alert already sent by another process — skipping")
        continue
      }

      const { subject, html } = storageWarningTemplate({
        usedGB,
        quotaGB,
        percentUsed,
        threshold: level,
      })

      await this._sendNotification({
        userId,
        type: "storage_warning",
        to: prefs.email,
        subject,
        html,
        metadata: { usedGB, quotaGB, percentUsed, threshold: level },
        eventId: `storage_${level}_${userId}_${Date.now()}`,
      })

      logger.info({ userId, threshold: level, percentUsed: percentUsed.toFixed(1) }, `Storage ${level}% alert sent`)
      break // Only send the highest-priority threshold per event
    }
  }

  // 3. Login Alert (HTTP endpoint — called directly, not via queue)
  async sendLoginAlert({ userId, ipAddress, timestamp, userAgent }) {
    const prefs = await NotificationPreference.findOne({ userId })
    if (!prefs?.email || !prefs.preferences.loginAlert) return null

    const { subject, html } = loginAlertTemplate({ timestamp, ipAddress, userAgent })

    return this._sendNotification({
      userId,
      type: "login_alert",
      to: prefs.email,
      subject,
      html,
      metadata: { ipAddress, userAgent, timestamp },
      // No eventId for HTTP-triggered alerts — each login is a unique event
    })
  }

  // 4. Daily Digest (called by cron job)

  async sendDailyDigestForUser(userId, prefs) {
    // Idempotency: skip if digest already sent today
    const digestKey = `digest_sent:daily:${userId}:${new Date().toISOString().slice(0, 10)}`
    const alreadySent = await redis.set(digestKey, "1", "EX", 25 * 3600, "NX")
    if (alreadySent !== "OK") {
      logger.debug({ userId }, "Daily digest already sent today — skipping")
      return
    }

    const redisKeys = [
      `activity:${userId}:uploaded`,
      `activity:${userId}:downloaded`,
      `activity:${userId}:deleted`,
      `activity:${userId}:restored`,
      `activity:${userId}:bytesUploaded`,
    ]

    const values = await Promise.all(
      redisKeys.map((k) => redis.get(k).then((v) => parseInt(v || "0", 10)))
    )
    const [uploaded, downloaded, deleted, restored, bytesUploaded] = values
    const totalActivity = uploaded + downloaded + deleted + restored

    if (totalActivity === 0) {
      logger.debug({ userId }, "No activity — skipping daily digest")
      // Release the lock so we don't block future sends if there was no activity
      await redis.del(digestKey)
      return
    }

    const { subject, html } = dailyDigestTemplate({
      date: new Date().toISOString(),
      activity: { uploaded, downloaded, deleted, restored, totalBytesUploaded: bytesUploaded },
    })

    await this._sendNotification({
      userId,
      type: "daily_digest",
      to: prefs.email,
      subject,
      html,
      metadata: { uploaded, downloaded, deleted, restored, bytesUploaded },
    })

    // Reset daily counters AFTER successful send
    await Promise.all(redisKeys.map((k) => redis.del(k)))
    logger.info({ userId }, "Daily digest sent and counters reset")
  }

  // 5. Weekly Report (called by cron job)

  async sendWeeklyReportForUser(userId, prefs) {
    // Idempotency: skip if report already sent this week (keyed by ISO week)
    const weekNumber = getISOWeek(new Date())
    const reportKey  = `digest_sent:weekly:${userId}:${new Date().getFullYear()}-W${weekNumber}`
    const alreadySent = await redis.set(reportKey, "1", "EX", 8 * 24 * 3600, "NX")
    if (alreadySent !== "OK") {
      logger.debug({ userId }, "Weekly report already sent this week — skipping")
      return
    }

    const weekEnd   = new Date()
    const weekStart = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)

    const storageKey = `storage_used:${userId}`
    const usedBytes  = parseInt((await redis.get(storageKey)) || "0", 10)
    const quotaGB    = prefs.storageQuotaGB || parseFloat(process.env.USER_STORAGE_QUOTA_GB || "5")
    const usedGB     = parseFloat((usedBytes / 1024 ** 3).toFixed(3))

    const redisKeys = [
      `activity:${userId}:uploaded`,
      `activity:${userId}:downloaded`,
      `activity:${userId}:deleted`,
      `activity:${userId}:restored`,
      `activity:${userId}:bytesUploaded`,
    ]

    const values = await Promise.all(
      redisKeys.map((k) => redis.get(k).then((v) => parseInt(v || "0", 10)))
    )
    const [uploaded, downloaded, deleted, restored, bytesUploaded] = values

    const { subject, html } = weeklyReportTemplate({
      weekStart: weekStart.toISOString(),
      weekEnd:   weekEnd.toISOString(),
      usedGB,
      quotaGB,
      activity: { uploaded, downloaded, deleted, restored, totalBytesUploaded: bytesUploaded },
    })

    await this._sendNotification({
      userId,
      type: "weekly_report",
      to: prefs.email,
      subject,
      html,
      metadata: { usedGB, quotaGB, uploaded, downloaded, deleted, restored },
    })

    logger.info({ userId }, "Weekly report sent")
  }

  // Activity tracking helpers (called by BullMQ subscriber)

  async trackFileActivity(userId, eventType, size = 0) {
    const typeMap = {
      "file.uploaded":   "uploaded",
      "file.downloaded": "downloaded",
      "file.deleted":    "deleted",
      "file.restored":   "restored",
    }

    const activityType = typeMap[eventType]
    if (!activityType) return

    const pipeline = redis.pipeline()
    pipeline.incr(`activity:${userId}:${activityType}`)
    if (eventType === "file.uploaded" && size > 0) {
      pipeline.incrby(`activity:${userId}:bytesUploaded`, size)
    }
    await pipeline.exec()
  }
}

// ─── ISO Week Helper ──────────────────────────────────────────────────────────
function getISOWeek(date) {
  const d    = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()))
  const dayNum = d.getUTCDay() || 7
  d.setUTCDate(d.getUTCDate() + 4 - dayNum)
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1))
  return Math.ceil((((d - yearStart) / 86400000) + 1) / 7)
}

module.exports = new NotificationService()