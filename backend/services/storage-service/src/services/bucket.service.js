const Bucket = require("../models/bucket.model")
const File = require("../models/file.model")
const ApiError = require("../utils/ApiError")

class BucketService {

  async createBucket(userId, { name, description }) {
    const existing = await Bucket.findOne({ userId, name, isDeleted: false })
    if (existing) throw new ApiError(409, `Bucket "${name}" already exists`)

    const bucket = await Bucket.create({ userId, name, description })
    return bucket
  }

  async listBuckets(userId) {
    const buckets = await Bucket.find({ userId, isDeleted: false })
      .sort({ createdAt: -1 })
    
    // Get file count and size for each bucket
    const bucketsWithStats = await Promise.all(buckets.map(async (b) => {
      const stats = await File.aggregate([
        { $match: { userId, userBucketId: b._id, isDeleted: false } },
        { $group: { _id: null, count: { $sum: 1 }, totalSize: { $sum: '$size' } } }
      ])
      return {
        ...b.toObject(),
        fileCount: stats[0]?.count || 0,
        totalSize: stats[0]?.totalSize || 0,
      }
    }))

    return bucketsWithStats
  }

  async getBucket(userId, bucketId) {
    const bucket = await Bucket.findOne({ _id: bucketId, userId, isDeleted: false })
    if (!bucket) throw new ApiError(404, "Bucket not found")
    return bucket
  }

  async deleteBucket(userId, bucketId) {
    const bucket = await Bucket.findOne({ _id: bucketId, userId, isDeleted: false })
    if (!bucket) throw new ApiError(404, "Bucket not found")

    // Check if bucket has files
    const fileCount = await File.countDocuments({ userId, userBucketId: bucketId, isDeleted: false })
    if (fileCount > 0) throw new ApiError(400, `Bucket is not empty — delete or move ${fileCount} file(s) first`)

    await Bucket.findByIdAndUpdate(bucketId, { isDeleted: true })
    return { deleted: true }
  }

  async updateBucket(userId, bucketId, { description }) {
    const bucket = await Bucket.findOneAndUpdate(
      { _id: bucketId, userId, isDeleted: false },
      { description },
      { new: true }
    )
    if (!bucket) throw new ApiError(404, "Bucket not found")
    return bucket
  }
}

module.exports = new BucketService()