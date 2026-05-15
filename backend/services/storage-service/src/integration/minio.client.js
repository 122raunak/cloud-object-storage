const { minioClient } = require("../config/minio")

const bucket = process.env.MINIO_BUCKET

const generateUploadUrl = async (objectKey, expiry = 300) => {
  return await minioClient.presignedPutObject(bucket, objectKey, expiry)
}

const generateDownloadUrl = async (objectKey, expiry = 300) => {
  return await minioClient.presignedGetObject(bucket, objectKey, expiry)
}

const fileExists = async (objectKey) => {
  try {
    await minioClient.statObject(bucket, objectKey)
    return true
  } catch (err) {
    if (err.code === "NotFound") return false
    throw err
  }
}

const deleteObject = async (objectKey) => {
  await minioClient.removeObject(bucket, objectKey)
}

const getObjectStats = async (objectKey) => {
  return await minioClient.statObject(bucket, objectKey)
}

module.exports = {
  generateUploadUrl,
  generateDownloadUrl,
  fileExists,
  deleteObject,
  getObjectStats
}