const mongoose = require("mongoose")
const logger = require("../utils/logger")

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.STORAGE_MONGO_URI, {
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000
    })

    logger.info("MongoDb connected")

  } catch (error) {
    logger.error({err:error} , "MongoDB connection error")
    process.exit(1)
  }
}

const disconnectDB = async () => {
  try {
    await mongoose.connection.close()
    logger.info("MongoDB disconnected")
  } catch (error) {
    logger.error({ err: error }, "Error disconnecting MongoDB")
  }
}

const connectWithRetry = async () => {
  let retries = 5

  while (retries) {
    try {
      await connectDB()
      break
    } catch (err) {
      logger.warn({ err }, "Retrying DB connection...")
      retries -= 1
      await new Promise(res => setTimeout(res, 5000))
    }
  }
  if (retries === 0) {
    throw new Error("MongoDB connection failed after 5 retries")
  }
}
module.exports = { connectDB, disconnectDB , connectWithRetry}