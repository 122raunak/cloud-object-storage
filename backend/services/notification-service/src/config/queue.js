const { Queue } = require("bullmq")
const { createRedisConnection } = require("./redis")
const logger = require("../utils/logger")

// ─── Queue Names ───────────────────────────────────────────────────────────────
// These must match what your other services (Storage, Billing, Metering) publish to.
const QUEUE_NAMES = {
  STORAGE_EVENTS: "storage-events-notification", 
  BILLING_EVENTS: "billing-events",
  AUTH_EVENTS:    "auth-events",
}

// ─── Queue instances — used by OTHER services to publish jobs ─────────────────
// The notification service itself only needs these for inspection/management.
// Workers (consumers) are defined in src/subscribers/bullmq.subscriber.js

const storageEventsQueue = new Queue(QUEUE_NAMES.STORAGE_EVENTS, {
  connection: createRedisConnection(),
  defaultJobOptions: {
    attempts: 5,
    backoff: {
      type: "exponential",
      delay: 2000, // 2s, 4s, 8s, 16s, 32s
    },
    removeOnComplete: {
      age: 24 * 3600, // Keep completed jobs for 24h for debugging
      count: 1000,
    },
    removeOnFail: {
      age: 7 * 24 * 3600, // Keep failed jobs for 7 days — acts as DLQ
    },
  },
})

const billingEventsQueue = new Queue(QUEUE_NAMES.BILLING_EVENTS, {
  connection: createRedisConnection(),
  defaultJobOptions: {
    attempts: 5,
    backoff: { type: "exponential", delay: 2000 },
    removeOnComplete: { age: 24 * 3600, count: 1000 },
    removeOnFail: { age: 7 * 24 * 3600 },
  },
})

const authEventsQueue = new Queue(QUEUE_NAMES.AUTH_EVENTS, {
  connection: createRedisConnection(),
  defaultJobOptions: {
    attempts: 3,
    backoff: { type: "exponential", delay: 1000 },
    removeOnComplete: { age: 24 * 3600, count: 1000 },
    removeOnFail: { age: 7 * 24 * 3600 },
  },
})

storageEventsQueue.on("error", (err) => logger.error({ err }, "storageEventsQueue error"))
billingEventsQueue.on("error", (err) => logger.error({ err }, "billingEventsQueue error"))
authEventsQueue.on("error",   (err) => logger.error({ err }, "authEventsQueue error"))

module.exports = {
  QUEUE_NAMES,
  storageEventsQueue,
  billingEventsQueue,
  authEventsQueue,
}