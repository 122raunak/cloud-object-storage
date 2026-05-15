const cron = require("node-cron")
const File = require("../models/file.model")
const storage = require("../integration/minio.client")
const logger = require("../utils/logger")

const cleanupTrash = () => {
  // Runs every day at 2:00 AM
  cron.schedule("0 2 * * *", async () => {
    logger.info("Running trash cleanup job...")

    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)

    const expiredFiles = await File.find({
      isDeleted: true,
      deletedAt: { $lt: thirtyDaysAgo }
    })

    logger.info({ count: expiredFiles.length }, "Expired files found")

    for (const file of expiredFiles) {
      try {
        await storage.deleteObject(file.objectKey)
        await File.findByIdAndDelete(file._id)
        logger.info({ fileId: file._id }, "Expired file permanently deleted")
      } catch (err) {
        logger.error({ err, fileId: file._id }, "Failed to delete expired file")
      }
    }

    logger.info("Trash cleanup job complete")
  })
}

module.exports = cleanupTrash

