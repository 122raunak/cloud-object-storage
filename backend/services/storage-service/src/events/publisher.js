const { Queue } = require("bullmq")
const { v4: uuid } = require("uuid")
const logger = require("../utils/logger")

const redisConnection = {
  host:                 process.env.REDIS_HOST,
  port:                 parseInt(process.env.REDIS_PORT, 10),
  password:             process.env.REDIS_PASSWORD,
  maxRetriesPerRequest: null,
  tls: process.env.NODE_ENV === 'production' ? {} : undefined,
}

const jobOptions = {
  attempts: 5,
  backoff: { type: "exponential", delay: 2000 },
  removeOnComplete: { age: 24 * 3600 },
  removeOnFail: { age: 7 * 24 * 3600 },
}

const meteringQueue     = new Queue("storage-events-metering",     { connection: redisConnection })
const notificationQueue = new Queue("storage-events-notification", { connection: redisConnection })

exports.publishEvent = async (eventType, data) => {
  const eventId = uuid()
  const payload = {
    eventId,
    eventType,
    version:   "v1",
    timestamp: new Date().toISOString(),
    data,
  }

  const validEvents = ["file.uploaded", "file.downloaded", "file.deleted", "file.restored"]
  if (!validEvents.includes(eventType)) {
    logger.warn({ eventType }, "No queue defined for event type — skipping")
    return
  }

  try {
    await Promise.all([
      meteringQueue.add(eventType, payload, { jobId: `metering-${eventId}`, ...jobOptions }),
      notificationQueue.add(eventType, payload, { jobId: `notification-${eventId}`, ...jobOptions }),
    ])
    logger.info({ eventType, eventId }, "Event published to BullMQ")
  } catch (err) {
    logger.error({ err, eventType, eventId }, "Failed to publish event to BullMQ")
  }
}