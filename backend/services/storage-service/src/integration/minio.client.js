const logger = require("../utils/logger")

const isProduction = process.env.NODE_ENV === 'production'
const bucket = process.env.MINIO_BUCKET

const generateUploadUrl = async (objectKey, expiry = 300) => {
  if (isProduction) {
    const { S3Client, PutObjectCommand } = require("@aws-sdk/client-s3")
    const { getSignedUrl } = require("@aws-sdk/s3-request-presigner")
    const client = new S3Client({
      region: "ap-southeast-2",
      endpoint: `https://${process.env.MINIO_ENDPOINT}/storage/v1/s3`,
      credentials: {
        accessKeyId:     process.env.MINIO_ACCESS_KEY,
        secretAccessKey: process.env.MINIO_SECRET_KEY,
      },
      forcePathStyle: true,
    })
    return await getSignedUrl(client, new PutObjectCommand({ Bucket: bucket, Key: objectKey }), { expiresIn: expiry })
  } else {
    const Minio = require("minio")
    const client = new Minio.Client({
      endPoint:  process.env.MINIO_ENDPOINT,
      port:      parseInt(process.env.MINIO_PORT) || 9000,
      useSSL:    process.env.MINIO_USE_SSL === "true",
      accessKey: process.env.MINIO_ACCESS_KEY,
      secretKey: process.env.MINIO_SECRET_KEY,
      pathStyle: true,
    })
    return await client.presignedPutObject(bucket, objectKey, expiry)
  }
}

const generateDownloadUrl = async (objectKey, expiry = 300) => {
  if (isProduction) {
    const { S3Client, GetObjectCommand } = require("@aws-sdk/client-s3")
    const { getSignedUrl } = require("@aws-sdk/s3-request-presigner")
    const client = new S3Client({
      region: "ap-southeast-2",
      endpoint: `https://${process.env.MINIO_ENDPOINT}/storage/v1/s3`,
      credentials: {
        accessKeyId:     process.env.MINIO_ACCESS_KEY,
        secretAccessKey: process.env.MINIO_SECRET_KEY,
      },
      forcePathStyle: true,
    })
    return await getSignedUrl(client, new GetObjectCommand({ Bucket: bucket, Key: objectKey }), { expiresIn: expiry })
  } else {
    const Minio = require("minio")
    const client = new Minio.Client({
      endPoint:  process.env.MINIO_ENDPOINT,
      port:      parseInt(process.env.MINIO_PORT) || 9000,
      useSSL:    process.env.MINIO_USE_SSL === "true",
      accessKey: process.env.MINIO_ACCESS_KEY,
      secretKey: process.env.MINIO_SECRET_KEY,
      pathStyle: true,
    })
    return await client.presignedGetObject(bucket, objectKey, expiry)
  }
}

const fileExists = async (objectKey) => {
  if (isProduction) {
    const { S3Client, HeadObjectCommand } = require("@aws-sdk/client-s3")
    const client = new S3Client({
      region: "ap-southeast-2",
      endpoint: `https://${process.env.MINIO_ENDPOINT}/storage/v1/s3`,
      credentials: {
        accessKeyId:     process.env.MINIO_ACCESS_KEY,
        secretAccessKey: process.env.MINIO_SECRET_KEY,
      },
      forcePathStyle: true,
    })
    try {
      await client.send(new HeadObjectCommand({ Bucket: bucket, Key: objectKey }))
      return true
    } catch (err) {
      if (err.$metadata?.httpStatusCode === 404) return false
      throw err
    }
  } else {
    const Minio = require("minio")
    const client = new Minio.Client({
      endPoint:  process.env.MINIO_ENDPOINT,
      port:      parseInt(process.env.MINIO_PORT) || 9000,
      useSSL:    process.env.MINIO_USE_SSL === "true",
      accessKey: process.env.MINIO_ACCESS_KEY,
      secretKey: process.env.MINIO_SECRET_KEY,
      pathStyle: true,
    })
    try {
      await client.statObject(bucket, objectKey)
      return true
    } catch (err) {
      if (err.code === "NotFound") return false
      throw err
    }
  }
}

const deleteObject = async (objectKey) => {
  if (isProduction) {
    const { S3Client, DeleteObjectCommand } = require("@aws-sdk/client-s3")
    const client = new S3Client({
      region: "ap-southeast-2",
      endpoint: `https://${process.env.MINIO_ENDPOINT}/storage/v1/s3`,
      credentials: {
        accessKeyId:     process.env.MINIO_ACCESS_KEY,
        secretAccessKey: process.env.MINIO_SECRET_KEY,
      },
      forcePathStyle: true,
    })
    await client.send(new DeleteObjectCommand({ Bucket: bucket, Key: objectKey }))
  } else {
    const Minio = require("minio")
    const client = new Minio.Client({
      endPoint:  process.env.MINIO_ENDPOINT,
      port:      parseInt(process.env.MINIO_PORT) || 9000,
      useSSL:    process.env.MINIO_USE_SSL === "true",
      accessKey: process.env.MINIO_ACCESS_KEY,
      secretKey: process.env.MINIO_SECRET_KEY,
      pathStyle: true,
    })
    await client.removeObject(bucket, objectKey)
  }
}

const getObjectStats = async (objectKey) => {
  if (isProduction) {
    const { S3Client, HeadObjectCommand } = require("@aws-sdk/client-s3")
    const client = new S3Client({
      region: "ap-southeast-2",
      endpoint: `https://${process.env.MINIO_ENDPOINT}/storage/v1/s3`,
      credentials: {
        accessKeyId:     process.env.MINIO_ACCESS_KEY,
        secretAccessKey: process.env.MINIO_SECRET_KEY,
      },
      forcePathStyle: true,
    })
    const result = await client.send(new HeadObjectCommand({ Bucket: bucket, Key: objectKey }))
    return { size: result.ContentLength, contentType: result.ContentType, etag: result.ETag }
  } else {
    const Minio = require("minio")
    const client = new Minio.Client({
      endPoint:  process.env.MINIO_ENDPOINT,
      port:      parseInt(process.env.MINIO_PORT) || 9000,
      useSSL:    process.env.MINIO_USE_SSL === "true",
      accessKey: process.env.MINIO_ACCESS_KEY,
      secretKey: process.env.MINIO_SECRET_KEY,
      pathStyle: true,
    })
    return await client.statObject(bucket, objectKey)
  }
}

module.exports = {
  generateUploadUrl,
  generateDownloadUrl,
  fileExists,
  deleteObject,
  getObjectStats,
}