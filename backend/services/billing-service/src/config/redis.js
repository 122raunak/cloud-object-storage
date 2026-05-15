const Redis  = require("ioredis")
const logger = require("../utils/logger")

const redis = new Redis({
  host:        process.env.REDIS_HOST,
  port:        parseInt(process.env.REDIS_PORT, 10),
  password:    process.env.REDIS_PASSWORD,
  lazyConnect: true,
  tls: process.env.NODE_ENV === 'production' ? {} : undefined,
})

redis.on("connect", () => logger.info("Redis (main) connected"))
redis.on("error",   (err) => logger.error({ err }, "Redis (main) error"))

module.exports = { redis }