const asyncHandler = require("../utils/asyncHandler")
const ApiError = require("../utils/ApiError")

const verifyToken = asyncHandler(async (req, res, next) => {
  const userId = req.headers["x-user-id"]
  const role = req.headers["x-user-role"]
  const email = req.headers["x-user-email"]

  if (!userId || !role) throw new ApiError(401, "Unauthorized — missing identity headers")

  req.user = { id: userId, role, email }
  next()
})

const requireAdmin = asyncHandler(async (req, res, next) => {
  if (req.user.role !== "ADMIN") {
    throw new ApiError(403, "Forbidden — admin access required")
  }
  next()
})

// Allow owner OR admin OR internal service-to-service calls
const requireOwnerOrAdmin = (paramKey = "userId") =>
  asyncHandler(async (req, res, next) => {
    const targetUserId = req.params[paramKey]
    const { id: requesterId, role } = req.user

    if (role === "ADMIN" || role === "service" || requesterId === targetUserId) {
      return next()
    }

    throw new ApiError(403, "Forbidden — you can only access your own billing data")
  })

module.exports = { verifyToken, requireAdmin, requireOwnerOrAdmin }