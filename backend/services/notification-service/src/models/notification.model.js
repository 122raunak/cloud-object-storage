const mongoose = require("mongoose")

const notificationSchema = new mongoose.Schema(
  {
    userId: {
      type: String,
      required: true,
      index: true,
    },
    type: {
      type: String,
      required: true,
      enum: [
        "invoice_generated",
        "budget_alert",
        "storage_warning",
        "login_alert",
        "daily_digest",
        "weekly_report",
      ],
      index: true,
    },
    channel: {
      type: String,
      required: true,
      enum: ["email"],
      default: "email",
    },
    status: {
      type: String,
      required: true,
      enum: ["pending", "sent", "failed"],
      default: "pending",
      index: true,
    },
    subject: {
      type: String,
      required: true,
    },
    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
    // Deduplication key — stores eventId from Redis events to ensure idempotency
    eventId: {
      type: String,
      index: true,
      sparse: true,
    },
    sentAt: {
      type: Date,
    },
    // TTL index — MongoDB auto-deletes documents 90 days after createdAt
    createdAt: {
      type: Date,
      default: Date.now,
      index: { expires: "90d" },
    },
  },
  {
    // Disable automatic createdAt/updatedAt so we control the TTL field manually
    timestamps: false,
    versionKey: false,
  }
)

// Compound index for efficient per-user queries with filtering
notificationSchema.index({ userId: 1, type: 1, createdAt: -1 })
notificationSchema.index({ userId: 1, status: 1, createdAt: -1 })

const Notification = mongoose.model("Notification", notificationSchema, "notifications")

module.exports = Notification