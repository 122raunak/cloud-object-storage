const storage = require("../integration/minio.client")
const { v4: uuid } = require("uuid")
const File = require("../models/file.model")
const { publishEvent } = require("../events/publisher")
const ApiError = require("../utils/ApiError")
const redis = require("../utils/redis")
const logger = require("../utils/logger")

const bucket          = process.env.MINIO_BUCKET
const allowedTypes    = process.env.ALLOWED_FILE_TYPES.split(",")
const maxSize         = parseInt(process.env.MAX_FILE_SIZE)
const allowedExts     = process.env.ALLOWED_EXTENSIONS
  ? process.env.ALLOWED_EXTENSIONS.split(",")
  : ["jpg", "png", "pdf"]

const sanitizeFileName = (name) => name.replace(/[^a-zA-Z0-9._-]/g, "_")

class StorageService {

  // ─── Generate Upload URL ───────────────────────────────────────────────────
  async generateUploadUrl(userId, fileName, contentType, size, idempotencyKey) {
    const cacheKey = idempotencyKey ? `upload:${userId}:${idempotencyKey}` : null

    if (cacheKey) {
      const existing = await redis.get(cacheKey)
      if (existing) return JSON.parse(existing)
    }

    if (!allowedTypes.includes(contentType)) throw new ApiError(400, "Invalid file type")
    if (size > maxSize) throw new ApiError(400, "File too large")

    const quota    = parseInt(process.env.USER_STORAGE_QUOTA)
    const totalUsed = await File.aggregate([
      { $match: { userId, isDeleted: false } },
      { $group: { _id: null, total: { $sum: "$size" } } },
    ])
    const used = totalUsed[0]?.total || 0
    if (used + size > quota) throw new ApiError(400, "Storage quota exceeded")

    const safeFileName = sanitizeFileName(fileName)
    const ext = safeFileName.split(".").pop().toLowerCase()
    if (!allowedExts.includes(ext)) throw new ApiError(400, "Invalid file extension")

    const objectKey = `${userId}/${uuid()}-${safeFileName}`
    const expiry    = parseInt(process.env.PRESIGNED_URL_EXPIRY) || 300
    const uploadUrl = await storage.generateUploadUrl(objectKey, expiry)

    const response = { uploadUrl, objectKey }
    if (cacheKey) await redis.set(cacheKey, JSON.stringify(response), "EX", 300)

    return response
  }

  // ─── Confirm Upload ────────────────────────────────────────────────────────
  async confirmUpload(userId, objectKey, fileName, contentType, size, bucketId) {
    const exists = await storage.fileExists(objectKey)
    if (!exists) throw new ApiError(400, "File not uploaded or not found")
    const stats = await storage.getObjectStats(objectKey)
    if (stats.size !== size) throw new ApiError(400, "File size mismatch")
    const safeFileName = sanitizeFileName(fileName)
    const file = await File.create({
      userId,
      fileName:     safeFileName,
      objectKey,
      size,
      mimeType:     contentType,
      bucket:       process.env.MINIO_BUCKET, 
      isDeleted:    false,
      userBucketId: bucketId || null,
    })
    try {
      await publishEvent("file.uploaded", {
        userId,
        fileId:    file._id.toString(),
        fileName:  safeFileName,
        size,
        mimeType:  contentType,
        createdAt: file.createdAt,
      })
    } catch (err) {
      logger.error({ err, userId, fileId: file._id }, "Upload event publish failed")
    }
    logger.info({ userId, fileId: file._id }, "File uploaded successfully")
    return { fileId: file._id }
  }

  // ─── Generate Download URL ────────────────────────────────────────────────
  async generateDownloadUrl(userId, fileId) {
    const file = await File.findById(fileId)
    if (!file) throw new ApiError(404, "File not found")
    if (file.userId !== userId) throw new ApiError(403, "Forbidden")
    if (file.isDeleted) throw new ApiError(400, "File is deleted")

    const expiry      = parseInt(process.env.PRESIGNED_URL_EXPIRY) || 300
    const downloadUrl = await storage.generateDownloadUrl(file.objectKey, expiry)

    await File.findByIdAndUpdate(fileId, { $inc: { downloadCount: 1 } })

    try {
      await publishEvent("file.downloaded", {
        userId,
        fileId:       fileId.toString(),
        fileName:     file.fileName,      
        size:         file.size,
        mimeType:     file.mimeType,      
        downloadedAt: new Date().toISOString(),
      })
    } catch (err) {
      logger.error({ err, userId, fileId }, "Download event publish failed")
    }

    logger.info({ userId, fileId }, "File download triggered")
    return { downloadUrl }
  }

  async generateShareUrl(userId, fileId, expiry = 3600) {
  const file = await File.findById(fileId)
    if (!file) throw new ApiError(404, "File not found")
    if (file.userId !== userId) throw new ApiError(403, "Forbidden")
    if (file.isDeleted) throw new ApiError(400, "File is deleted")
    const shareUrl = await storage.generateDownloadUrl(file.objectKey, expiry)
    const expiresAt = new Date(Date.now() + expiry * 1000).toISOString()
    return {
      shareUrl,
      fileName: file.fileName,
      size: file.size,
      expiresAt,
      expiresIn: `${Math.round(expiry / 3600)} hour(s)`,
    }
  }

  // ─── List Files ───────────────────────────────────────────────────────────
 async listFiles(userId, { page, limit, search, mimeType, sortBy, order, includeDeleted, bucketId }) {
  const parsedPage  = parseInt(page)  || 1
  const parsedLimit = parseInt(limit) || 10
  const skip = (parsedPage - 1) * parsedLimit

  const filter = { userId }

  if (!includeDeleted || includeDeleted === 'false') filter.isDeleted = false
  if (search)   filter.$text    = { $search: search }
  if (mimeType) filter.mimeType = { $regex: `^${mimeType}`, $options: 'i' }
  if (bucketId === 'none') filter.userBucketId = null
  else if (bucketId) filter.userBucketId = bucketId

  const sortField = sortBy === 'size' ? 'size' : sortBy === 'fileName' ? 'fileName' : 'createdAt'
  const sortOrder = order === 'asc' ? 1 : -1
  const sort = { [sortField]: sortOrder }

  const [files, total] = await Promise.all([
    File.find(filter).sort(sort).skip(skip).limit(parsedLimit),
    File.countDocuments(filter),
  ])

  return {
    data: files,
    pagination: { total, page: parsedPage, pages: Math.ceil(total / parsedLimit) },
  }
}

  // ─── Delete File (soft) ───────────────────────────────────────────────────
  async deleteFile(userId, fileId) {
    const file = await File.findById(fileId)
    if (!file) throw new ApiError(404, "File not found")
    if (file.userId !== userId) throw new ApiError(403, "Forbidden")

    file.isDeleted = true
    file.deletedAt = new Date()
    await file.save()

    try {
      await publishEvent("file.deleted", {
        userId,
        fileId:    fileId.toString(),
        fileName:  file.fileName,         
        size:      file.size,
        mimeType:  file.mimeType,        
        deletedAt: file.deletedAt,
      })
    } catch (err) {
      logger.error({ err, userId, fileId }, "Delete event publish failed")
    }

    logger.info({ userId, fileId }, "File deleted (soft)")
    return { message: "File moved to trash" }
  }

  // ─── Restore File ─────────────────────────────────────────────────────────
  async restoreFile(userId, fileId) {
    const file = await File.findById(fileId)
    if (!file) throw new ApiError(404, "File not found")
    if (file.userId !== userId) throw new ApiError(403, "Forbidden")

    file.isDeleted = false
    file.deletedAt = null
    await file.save()

    try {
      await publishEvent("file.restored", {
        userId,
        fileId:     fileId.toString(),
        fileName:   file.fileName,        
        size:       file.size,
        mimeType:   file.mimeType,        
        restoredAt: new Date().toISOString(),
      })
    } catch (err) {
      logger.error({ err, userId, fileId }, "Restore event publish failed")
    }

    logger.info({ userId, fileId }, "File restored")
    return { message: "File restored" }
  }
}

module.exports = new StorageService()