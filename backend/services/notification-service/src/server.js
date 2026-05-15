require("dotenv").config()

// ─── Env Validation — must run BEFORE anything else ───────────────────────────
const { validateEnv } = require("./config/env.validation")
validateEnv()

const mongoose = require("mongoose")
const app      = require("./app")
const { initDB }    = require("./config/db")
const { verifyMailer } = require("./config/mailer")
const logger    = require("./utils/logger")
const { redis } = require("./config/redis")
const { setupWorkers, teardownWorkers } = require("./subscribers/bullmq.subscriber")
const { startDailyDigestJob }  = require("./jobs/dailyDigest.job")
const { startWeeklyReportJob } = require("./jobs/weeklyReport.job")

let server

const startServer = async () => {
  try {
    // 1. Connect to MongoDB
    await initDB()

    // 2. Verify SMTP connection — fail fast if credentials are wrong
    try {
      await verifyMailer()
    } catch (err) {
      logger.warn({ err }, "SMTP verification failed — emails may not work but server will continue")
    }

    // 3. Start BullMQ workers
    setupWorkers()

    // 4. Start cron jobs
    startDailyDigestJob()
    startWeeklyReportJob()

    // 5. Start HTTP server
    const PORT = process.env.PORT || 5005
    server = app.listen(PORT, () => {
      logger.info(
        { port: PORT, environment: process.env.NODE_ENV || "development" },
        "Notification service started"
      )
      logger.info(`Swagger docs: http://localhost:${PORT}/api/v1/notifications/docs`)
    })

  } catch (error) {
    logger.error({ err: error }, "Server startup failed")
    process.exit(1)
  }
}

// ─── Graceful Shutdown ─────────────────────────────────────────────────────────

const shutdown = async (signal) => {
  logger.info(`${signal} received — shutting down gracefully`)

  if (server) {
    server.close(async () => {
      logger.info("HTTP server closed")

      try {
        // 1. Shut down BullMQ workers — waits for in-progress jobs to finish
        await teardownWorkers()

        // 2. Close Redis connections
        await redis.quit()
        logger.info("Redis connections closed")

        // 3. Disconnect MongoDB
        await mongoose.connection.close()
        logger.info("MongoDB connection closed")

        process.exit(0)
      } catch (error) {
        logger.error({ err: error }, "Error during shutdown")
        process.exit(1)
      }
    })
  } else {
    process.exit(0)
  }

  // Force kill if graceful shutdown exceeds 10 seconds
  setTimeout(() => {
    logger.error("Forced shutdown after timeout")
    process.exit(1)
  }, 10000)
}

process.on("SIGTERM", () => shutdown("SIGTERM"))
process.on("SIGINT",  () => shutdown("SIGINT"))

process.on("unhandledRejection", (reason) => {
  logger.error({ reason }, "Unhandled Promise Rejection — shutting down")
  shutdown("unhandledRejection")
})

process.on("uncaughtException", (error) => {
  logger.error({ err: error }, "Uncaught Exception — shutting down")
  shutdown("uncaughtException")
})

startServer()