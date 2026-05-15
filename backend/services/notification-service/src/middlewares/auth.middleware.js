const asyncHandler = require("../utils/asyncHandler")
const ApiError = require("../utils/ApiError")

/**
 * Reads identity headers injected by the API Gateway.
 * Never re-verifies JWT — that is the gateway's responsibility.
 */
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

/**
 * Verifies that the request comes from a trusted internal microservice.
 * Used on endpoints like /login-alert that should ONLY be called by Auth Service,
 * not by end users through the gateway.
 *
 * The calling service must include: x-internal-secret: <INTERNAL_SERVICE_SECRET>
 */
const verifyInternalService = (req, res, next) => {
  const secret         = req.headers["x-internal-secret"]
  const expectedSecret = process.env.INTERNAL_SERVICE_SECRET

  if (!secret || secret !== expectedSecret) {
    return next(new ApiError(401, "Unauthorized — invalid internal service secret"))
  }

  // Mark request as internal so downstream handlers know
  req.isInternalRequest = true
  next()
}

/**
 * Ensure the authenticated user can only access their own resources.
 * Admins can access any user's resources.
 */
const requireOwnerOrAdmin = asyncHandler(async (req, res, next) => {
  const { userId }               = req.params
  const { id: requesterId, role } = req.user

  if (role === "admin") return next()

  if (requesterId !== userId) {
    throw new ApiError(403, "Forbidden — you cannot access another user's notifications")
  }

  next()
})

module.exports = { verifyToken, verifyInternalService, requireOwnerOrAdmin }