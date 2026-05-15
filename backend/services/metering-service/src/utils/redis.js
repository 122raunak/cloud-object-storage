const Redis = require("ioredis")
const logger = require("./logger")

const redisConfig = {
  host:     process.env.REDIS_HOST,
  port:     parseInt(process.env.REDIS_PORT, 10),
  password: process.env.REDIS_PASSWORD,
  tls: process.env.NODE_ENV === 'production' ? {} : undefined,
}

const redis = new Redis(redisConfig)
const subscriber = new Redis(redisConfig)

redis.on("connect", () => logger.info("Redis (main) connected"))
redis.on("error", (err) => logger.error({ err }, "Redis (main) error"))
subscriber.on("connect", () => logger.info("Redis (subscriber) connected"))
subscriber.on("error", (err) => logger.error({ err }, "Redis (subscriber) error"))

module.exports = { redis, subscriber }