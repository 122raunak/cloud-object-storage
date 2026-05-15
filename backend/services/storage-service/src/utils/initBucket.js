const { minioClient } = require("../config/minio")
const logger = require("./logger")

const wait = (ms) => new Promise((res) => setTimeout(res, ms))

const initBucket = async () => {
  const bucket = process.env.MINIO_BUCKET
  let retries = 3

  while (retries) {
    try {
      const exists = await minioClient.bucketExists(bucket)
      if (!exists) {
        logger.warn(`Bucket ${bucket} does not exist — create it manually`)
      } else {
        logger.info(`Bucket already exists: ${bucket}`)
      }
      return
    } catch (err) {
      logger.warn({ err }, "Could not verify bucket — continuing anyway")
      retries -= 1
      await wait(2000)
    }
  }
  // Non-fatal — don't exit if bucket check fails
  logger.warn("Could not verify bucket after retries — continuing anyway")
}

module.exports = initBucket