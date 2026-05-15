const ApiError = require("../utils/ApiError")
const asyncHandler = require("../utils/asyncHandler")


const verifyToken = asyncHandler(async (req, res, next) => {
  const userId = req.headers["x-user-id"]
  const role   = req.headers["x-user-role"]
  const email  = req.headers["x-user-email"]

  if (!userId || !role) {
    throw new ApiError(401, "Unauthorized — missing identity headers")
  }

  req.user = { id: userId, role, email }

  next()
})

// ─── Ownership check ──────────────────────────────────────────────────────────
// USER can only access their own data
// ADMIN and internal service calls (role=service) can access any user's data
const authorizeUserOrService = asyncHandler(async (req, res, next) => {
  const { userId } = req.params
  const { id: requesterId, role } = req.user

  if (role === "service" || role === "ADMIN" || requesterId === userId) {
    return next()
  }

  throw new ApiError(403, "Forbidden — you can only access your own usage data")
})

module.exports = { verifyToken, authorizeUserOrService }