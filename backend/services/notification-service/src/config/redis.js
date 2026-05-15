const Redis = require("ioredis")
const logger = require("../utils/logger")

const redisOptions = {
  host:                 process.env.REDIS_HOST || "redis",
  port:                 parseInt(process.env.REDIS_PORT || "6379", 10),
  password:             process.env.REDIS_PASSWORD,
  maxRetriesPerRequest: null,
  tls: process.env.NODE_ENV === 'production' ? {} : undefined,
  retryStrategy(times) {
    const delay = Math.min(times * 500, 5000)
    logger.warn({ times, delay }, "Redis reconnecting...")
    return delay
  },
}

const redis = new Redis(redisOptions)
const bullMQConnection = new Redis(redisOptions)

redis.on("connect", () => logger.info("Redis (main) connected"))
redis.on("error", (err) => logger.error({ err }, "Redis (main) error"))
bullMQConnection.on("connect", () => logger.info("Redis (BullMQ) connected"))
bullMQConnection.on("error", (err) => logger.error({ err }, "Redis (BullMQ) error"))

function createRedisConnection() {
  const conn = new Redis(redisOptions)
  conn.on("error", (err) => logger.error({ err }, "Redis (worker) error"))
  return conn
}

module.exports = { redis, bullMQConnection, createRedisConnection }