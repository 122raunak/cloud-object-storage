const Redis = require("ioredis")
const logger = require("../utils/logger")

const redis = new Redis({
  host:     process.env.REDIS_HOST || "redis",
  port:     parseInt(process.env.REDIS_PORT) || 6379,
  password: process.env.REDIS_PASSWORD,
  tls: process.env.NODE_ENV === 'production' ? {} : undefined,
  retryStrategy: (times) => {
    if (times > 3) {
      logger.error("Redis connection failed after 3 retries")
      return null
    }
    return Math.min(times * 200, 1000)
  }
})

redis.on("connect", () => logger.info("Redis connected successfully"))
redis.on("error", (err) => logger.error({ err }, "Redis connection error"))

module.exports = redis