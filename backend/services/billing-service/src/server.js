require("dotenv").config()

const { validateEnv }  = require("./config/env.validation")
const { initDB, pool } = require("./config/db")
const { startJobs }    = require("./jobs/invoice.job")
const { redis }        = require("./config/redis")
const app              = require("./app")
const logger           = require("./utils/logger")

const PORT = process.env.PORT || 5004

let server

const start = async () => {
  try {
    // 1. Validate env vars — fail fast before touching any external service
    validateEnv()

    // 2. Initialize PostgreSQL schema
    await initDB()

    // 3. Start cron jobs (monthly invoice generation)
    startJobs()

    // 4. Start HTTP server
    server = app.listen(PORT, () => {
      logger.info({ port: PORT }, "Billing service started")
    })

  } catch (err) {
    logger.error({ err }, "Failed to start billing service")
    process.exit(1)
  }
}

// ─── Graceful Shutdown ────────────────────────────────────────────────────────
const shutdown = async (signal) => {
  logger.info({ signal }, "Shutdown signal received")

  try {
    if (server) {
      await new Promise((resolve, reject) => {
        server.close((err) => {
          if (err) return reject(err)
          logger.info("HTTP server closed")
          resolve()
        })
      })
    }

    // Safe to disconnect now — no more in-flight HTTP requests
    await redis.quit()
    logger.info("Redis disconnected")

    await pool.end()
    logger.info("PostgreSQL pool drained")

    logger.info("Graceful shutdown complete")
    process.exit(0)

  } catch (err) {
    logger.error({ err }, "Error during shutdown")
    process.exit(1)
  }
}

process.on("SIGTERM", () => shutdown("SIGTERM"))
process.on("SIGINT",  () => shutdown("SIGINT"))

start()