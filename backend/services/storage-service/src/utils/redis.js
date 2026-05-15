const Redis = require("ioredis")
const logger = require("./logger")

const redis = new Redis({
  host:     process.env.REDIS_HOST,
  port:     parseInt(process.env.REDIS_PORT, 10),
  password: process.env.REDIS_PASSWORD,
  tls: process.env.NODE_ENV === 'production' ? {} : undefined,
})

redis.on("error", (err) => {
  logger.error({ err }, "Redis connection error")
})

redis.on("connect", () => {
  logger.info("Redis connected")
})

module.exports = redis