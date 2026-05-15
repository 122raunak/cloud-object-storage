require("dotenv").config()

const mongoose = require("mongoose")
const app = require("./app.js")
const connectDB = require("./config/db.js")
const { PORT } = require("./config/env")
const logger = require("./utils/logger")

// ─── Environment Validation ────────────────────────────────────────────────────

const requiredEnvVars = [
    "JWT_ACCESS_SECRET",
    "JWT_REFRESH_SECRET",
    "MONGO_URI",
    "PORT"
]

requiredEnvVars.forEach((key) => {
    if (!process.env[key]) {
        console.error(`FATAL: Missing required environment variable: ${key}`)
        process.exit(1)
    }
})

// ─── Server Startup ────────────────────────────────────────────────────────────

let server

const startServer = async () => {
    try {
        await connectDB()
        logger.info("MongoDB connected successfully")

        server = app.listen(PORT, () => {
            logger.info({
                port: PORT,
                environment: process.env.NODE_ENV || "development"
            }, "Auth service started")
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
                await mongoose.connection.close()
                logger.info("MongoDB connection closed")
                process.exit(0)
            } catch (error) {
                logger.error({ err: error }, "Error during MongoDB shutdown")
                process.exit(1)
            }
        })
    } else {
        process.exit(0)
    }

    // Force shutdown if graceful shutdown takes too long
    setTimeout(() => {
        logger.error("Forced shutdown after timeout")
        process.exit(1)
    }, 10000)
}

process.on("SIGTERM", () => shutdown("SIGTERM"))
process.on("SIGINT", () => shutdown("SIGINT"))

// ─── Unhandled Errors ──────────────────────────────────────────────────────────

process.on("unhandledRejection", (reason) => {
    logger.error({ reason }, "Unhandled Promise Rejection — shutting down")
    shutdown("unhandledRejection")
})

process.on("uncaughtException", (error) => {
    logger.error({ err: error }, "Uncaught Exception — shutting down")
    shutdown("uncaughtException")
})

startServer()