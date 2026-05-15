const Redis = require("ioredis")
const logger = require("./logger")

// ─── Publisher client (for general use e.g. rate limiting) ───────────────────
const redis = new Redis({
  host: process.env.REDIS_HOST,
  port: process.env.REDIS_PORT,
})

// ─── Dedicated subscriber client ─────────────────────────────────────────────
// ioredis requires a separate client for subscribe mode
// A subscribed client cannot issue regular commands
const subscriber = new Redis({
  host: process.env.REDIS_HOST,
  port: process.env.REDIS_PORT,
})

redis.on("connect", () => logger.info("Redis (main) connected"))
redis.on("error", (err) => logger.error({ err }, "Redis (main) error"))

subscriber.on("connect", () => logger.info("Redis (subscriber) connected"))
subscriber.on("error", (err) => logger.error({ err }, "Redis (subscriber) error"))

module.exports = { redis, subscriber }