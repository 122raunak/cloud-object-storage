const ApiResponse = require("../utils/ApiResponse")
const ApiError = require("../utils/ApiError")
const storageService = require("../services/storage.service")
const asyncHandler = require("../utils/asyncHandler")

// HELPERS
const validateUser = (req) => {
  const userId = req.user?.id
  if (!userId) throw new ApiError(401, "Unauthorized: Missing user context")
  return userId
}

// UPLOAD URL
const getUploadUrl = asyncHandler(async (req, res) => {
  const userId = validateUser(req)
  const { fileName, contentType, size } = req.body

  if (!fileName || typeof fileName !== "string" || fileName.length > 255) {
    throw new ApiError(400, "Invalid fileName")
  }
  if (!contentType || typeof contentType !== "string") {
    throw new ApiError(400, "Invalid contentType")
  }
  if (!size || typeof size !== "number" || size <= 0) {
    throw new ApiError(400, "Invalid file size")
  }

  const idempotencyKey = req.headers["idempotency-key"] || null

  const result = await storageService.generateUploadUrl(
    userId,
    fileName.trim(),
    contentType,
    size,
    idempotencyKey
  )

  return res.status(200).json(
    new ApiResponse(200, result, "Upload URL generated")
  )
})


// CONFIRM UPLOAD
const confirmUpload = asyncHandler(async (req, res) => {
  const userId = validateUser(req)
  const { objectKey, fileName, contentType, size } = req.body

  if (!objectKey) throw new ApiError(400, "objectKey is required")

  const result = await storageService.confirmUpload(
    userId,
    objectKey,
    fileName,
    contentType,
    size
  )

  return res.status(200).json(
    new ApiResponse(200, result, "Upload confirmed")
  )
})


// DOWNLOAD URL
const getDownloadUrl = asyncHandler(async (req, res) => {
  const userId = validateUser(req)
  const { fileId } = req.params

  if (!fileId) throw new ApiError(400, "fileId is required")

  const result = await storageService.generateDownloadUrl(userId, fileId)

  return res.status(200).json(
    new ApiResponse(200, result, "Download URL generated")
  )
})


// LIST FILES
const listFiles = asyncHandler(async (req, res) => {
  const userId = validateUser(req)

  const {
    page = 1,
    limit = 10,
    search,
    mimeType,
    sortBy = "createdAt",
    order = "desc",
    includeDeleted
  } = req.query

  const parsedPage = parseInt(page)
  const parsedLimit = parseInt(limit)

  if (parsedPage <= 0 || parsedLimit <= 0) {
    throw new ApiError(400, "Invalid pagination values")
  }

  const result = await storageService.listFiles(userId, {
    page: parsedPage,
    limit: parsedLimit,
    search,
    mimeType,
    sortBy,
    order,
    includeDeleted 
  })

  return res.status(200).json(
    new ApiResponse(200, result, "Files fetched")
  )
})

// DELETE FILE
const deleteFile = asyncHandler(async (req, res) => {
  const userId = validateUser(req)
  const { fileId } = req.params

  if (!fileId) throw new ApiError(400, "fileId is required")

  await storageService.deleteFile(userId, fileId)

  return res.status(200).json(
    new ApiResponse(200, null, "File moved to trash")
  )
})

// RESTORE FILE
const restoreFile = asyncHandler(async (req, res) => {
  const userId = validateUser(req)
  const { fileId } = req.params

  if (!fileId) throw new ApiError(400, "fileId is required")

  await storageService.restoreFile(userId, fileId)

  return res.status(200).json(
    new ApiResponse(200, null, "File restored")
  )
})

// SHARE URL
const getShareUrl = asyncHandler(async (req, res) => {
  const userId = validateUser(req)
  const { fileId } = req.params
  const expiry = Math.min(parseInt(req.query.expiry) || 3600, 86400)
  if (!fileId) throw new ApiError(400, "fileId is required")
  const result = await storageService.generateShareUrl(userId, fileId, expiry)
  return res.status(200).json(
    new ApiResponse(200, result, "Share URL generated")
  )
})

module.exports = {
  getUploadUrl,
  confirmUpload,
  getDownloadUrl,
  listFiles,
  deleteFile,
  restoreFile,
  getShareUrl
}