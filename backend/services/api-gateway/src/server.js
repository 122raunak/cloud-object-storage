require("dotenv").config()

const app = require("./app")
const logger = require("./utils/logger")

const requiredEnvVars = [
    "AUTH_SERVICE_URL",
    "PORT"
]

requiredEnvVars.forEach((key) => {
    if (!process.env[key]) {
        console.error(`FATAL: Missing required environment variable: ${key}`)
        process.exit(1)
    }
})

const PORT = process.env.PORT || 8080

const server = app.listen(PORT, () => {
    logger.info({
        port: PORT,
        environment: process.env.NODE_ENV || "development"
    }, "API Gateway started")
})

const shutdown = async (signal) => {
    logger.info(`${signal} received — shutting down`)
    //stops accepting new request
    server.close(() => {
        logger.info("HTTP server closed")
        process.exit(0)
    })
    setTimeout(() => process.exit(1), 10000)
}

process.on("SIGTERM", () => shutdown("SIGTERM"))
process.on("SIGINT", () => shutdown("SIGINT"))

process.on("unhandledRejection", (reason) => {
    logger.error({ reason }, "Unhandled rejection")
    shutdown("unhandledRejection")
})

process.on("uncaughtException", (error) => {
    logger.error({ err: error }, "Uncaught exception")
    shutdown("uncaughtException")
})