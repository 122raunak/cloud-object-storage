require("dotenv").config()
const validateEnv = require("./config/env") 
validateEnv()   
const app = require("./app")
const initBucket = require("./utils/initBucket")
const {checkMinioConnection} = require("./config/minio")
const logger = require("./utils/logger")
const { connectWithRetry, disconnectDB } = require("./config/db")
const cleanupTrash = require("./jobs/cleanupTrash")

const startServer = async () => {
  try {
    await connectWithRetry()
    await checkMinioConnection()
    await initBucket()

    const server = app.listen(process.env.STORAGE_SERVICE_PORT, () => {
      logger.info(`Storage Service running on port ${process.env.STORAGE_SERVICE_PORT}`)
    })
    cleanupTrash()
    const shutdown = async () => {
      logger.info("Shutting down gracefully...")
      server.close(async () => {
        await disconnectDB()
        logger.info("Server closed")
        process.exit(0)
      })
      setTimeout(() => {
        logger.error("Force shutdown after timeout")
        process.exit(1)
      }, 10000)
    }

    process.on("SIGTERM", shutdown)
    process.on("SIGINT", shutdown)
  } catch (err) {
    logger.error(`Startup failed ${err.message}`)
    process.exit(1)
  }
}

startServer()