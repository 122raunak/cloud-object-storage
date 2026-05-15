const mongoose = require("mongoose")
const logger = require("../utils/logger")

async function initDB() {
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI, {
      serverSelectionTimeoutMS: 5000,
      // Explicit pool size — under cron load (50 concurrent digests)
      // the default of 5 connections will queue. Set higher.
      maxPoolSize: 20,
    })
    logger.info(`MongoDB connected: ${conn.connection.host}`)
  } catch (err) {
    logger.error({ err }, "MongoDB connection failed")
    process.exit(1)
  }
}

module.exports = { initDB }