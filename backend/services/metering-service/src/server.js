require("dotenv").config()

const { validateEnv }                   = require("./config/env.validation")
const { initDB, pool }                  = require("./config/db")
const { setupWorkers, teardownWorkers } = require("./subscribers/bullmq.subscriber") 
const { startJobs }                     = require("./jobs/aggregator.job")
const app                               = require("./app")
const logger                            = require("./utils/logger")

const PORT = process.env.PORT || 5003

let server

const start = async () => {
  try {
    // 1. Validate env vars 
    validateEnv()

    // 2. Connect to PostgreSQL
    await initDB()

    // 3. Start BullMQ worker (consumes storage-events queue published by Storage Service)
    setupWorkers() 

    // 4. Start cron jobs (aggregation)
    startJobs()

    // 5. Start HTTP server
    server = app.listen(PORT, () => {
      logger.info({ port: PORT }, "Metering service started")
    })

  } catch (err) {
    logger.error({ err }, "Failed to start metering service")
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
    await teardownWorkers()
    logger.info("BullMQ workers shut down")

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