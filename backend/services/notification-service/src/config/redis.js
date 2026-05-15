const Redis = require("ioredis")
const logger = require("../utils/logger")

const redisOptions = {
  host: process.env.REDIS_HOST || "redis",
  port: parseInt(process.env.REDIS_PORT || "6379", 10),
  // BullMQ requirement: maxRetriesPerRequest must be null for blocking commands
  maxRetriesPerRequest: null,
  retryStrategy(times) {
    const delay = Math.min(times * 500, 5000)
    logger.warn({ times, delay }, "Redis reconnecting...")
    return delay
  },
}

// ─── Main client — general commands (get, set, incr, publish) ─────────────────
const redis = new Redis(redisOptions)

// ─── BullMQ requires its own dedicated connection ─────────────────────────────
// BullMQ internally uses blocking commands (BRPOP etc.) which require
// maxRetriesPerRequest: null. Never share this client with other code.
const bullMQConnection = new Redis(redisOptions)

redis.on("connect", () => logger.info("Redis (main) connected"))
redis.on("error", (err) => logger.error({ err }, "Redis (main) error"))

bullMQConnection.on("connect", () => logger.info("Redis (BullMQ) connected"))
bullMQConnection.on("error", (err) => logger.error({ err }, "Redis (BullMQ) error"))

/**
 * Factory — BullMQ requires a fresh ioredis instance per Worker/Queue.
 * Call this when creating each BullMQ Worker or Queue instance.
 */
function createRedisConnection() {
  const conn = new Redis(redisOptions)
  conn.on("error", (err) => logger.error({ err }, "Redis (worker) error"))
  return conn
}

module.exports = { redis, bullMQConnection, createRedisConnection }