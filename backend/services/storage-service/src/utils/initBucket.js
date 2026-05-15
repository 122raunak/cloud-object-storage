const { minioClient } = require("../config/minio")
const logger = require("./logger")

const wait = (ms) => new Promise((res) => setTimeout(res, ms))

const initBucket = async () => {
  const bucket = process.env.MINIO_BUCKET
  let retries = 5

  while (retries) {
    try {
      const exists = await minioClient.bucketExists(bucket)

      if (!exists) {
        await minioClient.makeBucket(bucket)
        logger.info(`Bucket created: ${bucket}`)
      } else {
        logger.info(`Bucket already exists: ${bucket}`)
      }

      return
    } catch (err) {
      logger.warn({ err }, "Waiting for MinIO...")
      retries -= 1
      await wait(2000)
    }
  }

  logger.error("Failed to initialize bucket after retries")
  process.exit(1)
}

module.exports = initBucket