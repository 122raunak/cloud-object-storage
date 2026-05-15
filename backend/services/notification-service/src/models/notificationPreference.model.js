const mongoose = require("mongoose")

const notificationPreferenceSchema = new mongoose.Schema(
  {
    userId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    email: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
    },
    budgetThreshold: {
      type: Number,
      default: 0, // 0 = no budget alert
      min: 0,
    },
    storageQuotaGB: {
      type: Number,
      default: 5,
      min: 1,
    },
    // Track which thresholds have already triggered alerts — idempotency
    storageAlertsSent: {
      eighty: { type: Boolean, default: false },
      ninetyFive: { type: Boolean, default: false },
    },
    preferences: {
      invoiceGenerated: { type: Boolean, default: true },
      budgetAlert: { type: Boolean, default: true },
      storageWarning: { type: Boolean, default: true },
      loginAlert: { type: Boolean, default: true },
      dailyDigest: { type: Boolean, default: true },
      weeklyReport: { type: Boolean, default: true },
    },
  },
  {
    timestamps: true,
    versionKey: false,
    collection: "notification_preferences",
  }
)

const NotificationPreference = mongoose.model(
  "NotificationPreference",
  notificationPreferenceSchema
)

module.exports = NotificationPreference