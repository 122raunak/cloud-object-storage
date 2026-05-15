const Redis = require("ioredis")
const logger = require("./logger")

const redis = new Redis({
  host: process.env.REDIS_HOST,
  port: process.env.REDIS_PORT
})

redis.on("error", (err) => {
  logger.error({ err }, "Redis connection error")
})

redis.on("connect", () => {
  logger.info("Redis connected")
})

module.exports = redis