const Redis  = require("ioredis")
const logger = require("../utils/logger")


const redis = new Redis({
  host:                 process.env.REDIS_HOST,
  port:                 parseInt(process.env.REDIS_PORT, 10),
  maxRetriesPerRequest: null, // Required for BullMQ compatibility
  retryStrategy(times) {
    const delay = Math.min(times * 500, 5000)
    logger.warn({ times, delay }, "Redis reconnecting...")
    return delay
  },
})

redis.on("connect", () => logger.info("Redis (main) connected"))
redis.on("error",   (err) => logger.error({ err }, "Redis (main) error"))

module.exports = { redis }