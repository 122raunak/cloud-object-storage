const { S3Client, HeadObjectCommand, DeleteObjectCommand } = require("@aws-sdk/client-s3")
const { getSignedUrl } = require("@aws-sdk/s3-request-presigner")
const { PutObjectCommand, GetObjectCommand } = require("@aws-sdk/client-s3")
const logger = require("../utils/logger")

const s3Client = new S3Client({
  region: "ap-southeast-2",
  endpoint: `https://${process.env.MINIO_ENDPOINT}/storage/v1/s3`,
  credentials: {
    accessKeyId:     process.env.MINIO_ACCESS_KEY,
    secretAccessKey: process.env.MINIO_SECRET_KEY,
  },
  forcePathStyle: true,
})

const bucket = process.env.MINIO_BUCKET

const generateUploadUrl = async (objectKey, expiry = 300) => {
  const command = new PutObjectCommand({
    Bucket: bucket,
    Key:    objectKey,
  })
  return await getSignedUrl(s3Client, command, { expiresIn: expiry })
}

const generateDownloadUrl = async (objectKey, expiry = 300) => {
  const command = new GetObjectCommand({
    Bucket: bucket,
    Key:    objectKey,
  })
  return await getSignedUrl(s3Client, command, { expiresIn: expiry })
}

const fileExists = async (objectKey) => {
  try {
    await s3Client.send(new HeadObjectCommand({ Bucket: bucket, Key: objectKey }))
    return true
  } catch (err) {
    if (err.name === "NotFound" || err.$metadata?.httpStatusCode === 404) return false
    throw err
  }
}

const deleteObject = async (objectKey) => {
  await s3Client.send(new DeleteObjectCommand({ Bucket: bucket, Key: objectKey }))
}

const getObjectStats = async (objectKey) => {
  const result = await s3Client.send(new HeadObjectCommand({ Bucket: bucket, Key: objectKey }))
  return {
    size:        result.ContentLength,
    contentType: result.ContentType,
    etag:        result.ETag,
  }
}

module.exports = {
  generateUploadUrl,
  generateDownloadUrl,
  fileExists,
  deleteObject,
  getObjectStats,
}