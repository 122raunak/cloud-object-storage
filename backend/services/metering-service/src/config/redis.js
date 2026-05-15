const Redis  = require("ioredis")
const logger = require("../utils/logger")

const redisConfig = {
  host:                 process.env.REDIS_HOST,
  port:                 parseInt(process.env.REDIS_PORT, 10),
  password:             process.env.REDIS_PASSWORD,
  maxRetriesPerRequest: null,
  tls: process.env.NODE_ENV === 'production' ? {} : undefined,
  retryStrategy(times) {
    const delay = Math.min(times * 500, 5000)
    logger.warn({ times, delay }, "Redis reconnecting...")
    return delay
  },
}

const redis = new Redis(redisConfig)

redis.on("connect", () => logger.info("Redis (main) connected"))
redis.on("error",   (err) => logger.error({ err }, "Redis (main) error"))

module.exports = { redis }