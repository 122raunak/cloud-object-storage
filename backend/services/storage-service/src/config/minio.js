const Minio = require("minio")
const logger = require("../utils/logger")

const minioClient = new Minio.Client({
  endPoint: process.env.MINIO_ENDPOINT,
  port: Number(process.env.MINIO_PORT),
  useSSL: process.env.MINIO_USE_SSL === "true",
  accessKey: process.env.MINIO_ACCESS_KEY,
  secretKey: process.env.MINIO_SECRET_KEY,
  pathStyle: true,
  region:   "ap-southeast-1" 
})

const checkMinioConnection = async () => {
  try {
    await minioClient.bucketExists(process.env.MINIO_BUCKET)
    logger.info("MinIO/B2 connected")
  } catch (error) {
    logger.error({ err: error }, "MinIO/B2 connection failed")
    process.exit(1)
  }
}

const ensureBucketExists = async (bucketName) => {
  const exists = await minioClient.bucketExists(bucketName)
  if (!exists) {
    await minioClient.makeBucket(bucketName)
    logger.info(`Bucket ${bucketName} created`)
  }
}

module.exports = {
  minioClient,
  checkMinioConnection,
  ensureBucketExists
}