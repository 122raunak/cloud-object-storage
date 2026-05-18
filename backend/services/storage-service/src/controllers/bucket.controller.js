const ApiResponse = require("../utils/ApiResponse")
const ApiError = require("../utils/ApiError")
const asyncHandler = require("../utils/asyncHandler")
const bucketService = require("../services/bucket.service")

const validateUser = (req) => {
  const userId = req.user?.id
  if (!userId) throw new ApiError(401, "Unauthorized")
  return userId
}

const createBucket = asyncHandler(async (req, res) => {
  const userId = validateUser(req)
  const { name, description } = req.body
  if (!name) throw new ApiError(400, "Bucket name is required")
  const bucket = await bucketService.createBucket(userId, { name, description })
  return res.status(201).json(new ApiResponse(201, bucket, "Bucket created"))
})

const listBuckets = asyncHandler(async (req, res) => {
  const userId = validateUser(req)
  const buckets = await bucketService.listBuckets(userId)
  return res.status(200).json(new ApiResponse(200, buckets, "Buckets fetched"))
})

const getBucket = asyncHandler(async (req, res) => {
  const userId = validateUser(req)
  const bucket = await bucketService.getBucket(userId, req.params.bucketId)
  return res.status(200).json(new ApiResponse(200, bucket, "Bucket fetched"))
})

const deleteBucket = asyncHandler(async (req, res) => {
  const userId = validateUser(req)
  await bucketService.deleteBucket(userId, req.params.bucketId)
  return res.status(200).json(new ApiResponse(200, null, "Bucket deleted"))
})

const updateBucket = asyncHandler(async (req, res) => {
  const userId = validateUser(req)
  const bucket = await bucketService.updateBucket(userId, req.params.bucketId, req.body)
  return res.status(200).json(new ApiResponse(200, bucket, "Bucket updated"))
})

module.exports = { createBucket, listBuckets, getBucket, deleteBucket, updateBucket }