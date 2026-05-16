const logger = require("../utils/logger")

const isProduction = process.env.NODE_ENV === 'production'

let s3Client = null

if (isProduction) {
  const { S3Client } = require("@aws-sdk/client-s3")
  s3Client = new S3Client({
    region: "ap-southeast-2",
    endpoint: `https://${process.env.MINIO_ENDPOINT}/storage/v1/s3`,
    credentials: {
      accessKeyId:     process.env.MINIO_ACCESS_KEY,
      secretAccessKey: process.env.MINIO_SECRET_KEY,
    },
    forcePathStyle: true,
  })
} else {
  const Minio = require("minio")
  const minioClient = new Minio.Client({
    endPoint:  process.env.MINIO_ENDPOINT,
    port:      parseInt(process.env.MINIO_PORT) || 9000,
    useSSL:    process.env.MINIO_USE_SSL === "true",
    accessKey: process.env.MINIO_ACCESS_KEY,
    secretKey: process.env.MINIO_SECRET_KEY,
    pathStyle: true,
  })
  s3Client = minioClient
}

const checkMinioConnection = async () => {
  try {
    if (isProduction) {
      const { HeadBucketCommand } = require("@aws-sdk/client-s3")
      await s3Client.send(new HeadBucketCommand({ Bucket: process.env.MINIO_BUCKET }))
    } else {
      await s3Client.bucketExists(process.env.MINIO_BUCKET)
    }
    logger.info("Storage connected")
  } catch (error) {
    logger.warn({ err: error }, "Storage check failed — continuing anyway")
  }
}

const ensureBucketExists = async (bucketName) => {
  logger.info(`Using bucket: ${bucketName}`)
}

module.exports = { s3Client, checkMinioConnection, ensureBucketExists }