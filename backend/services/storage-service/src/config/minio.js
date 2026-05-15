const { S3Client, HeadBucketCommand } = require("@aws-sdk/client-s3")
const logger = require("../utils/logger")

const s3Client = new S3Client({
  region: "ap-southeast-1",
  endpoint: `https://${process.env.MINIO_ENDPOINT}/storage/v1/s3`,
  credentials: {
    accessKeyId:     process.env.MINIO_ACCESS_KEY,
    secretAccessKey: process.env.MINIO_SECRET_KEY,
  },
  forcePathStyle: true,
})

const checkMinioConnection = async () => {
  try {
    await s3Client.send(new HeadBucketCommand({ Bucket: process.env.MINIO_BUCKET }))
    logger.info("Supabase Storage connected")
  } catch (error) {
    logger.warn({ err: error }, "Supabase Storage check failed — continuing anyway")
  }
}

const ensureBucketExists = async (bucketName) => {
  logger.info(`Using bucket: ${bucketName}`)
}

module.exports = { s3Client, checkMinioConnection, ensureBucketExists }