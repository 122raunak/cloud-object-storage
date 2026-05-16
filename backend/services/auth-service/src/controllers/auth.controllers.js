const ApiResponse = require("../utils/ApiResponse")
const ApiError = require("../utils/ApiError")
const asyncHandler = require("../utils/asyncHandler")
const authService = require("../services/auth.service")
const axios = require("axios")                          
const logger = require("../utils/logger")     
// ─── Cookie Config Helper ──────────────────────────────────────────────────────

const cookieOptions = () => ({
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: process.env.NODE_ENV === "production" ? "none" : "strict",

})

// ─── Public Routes ─────────────────────────────────────────────────────────────

const registerUser = asyncHandler(async (req, res) => {
    const { username, email, password, role } = req.body

    const createdUser = await authService.register(username, email, password, role)

    // Create notification preferences — fire and forget
    // CHANGE: remove gateway-style headers, add internal secret
axios.put(
  `${process.env.NOTIFICATION_SERVICE_URL}/api/v1/notifications/${createdUser._id}/preferences`,
  { email: createdUser.email },  // ← add email here
  {
    headers: {
      "x-user-id":    createdUser._id.toString(),
      "x-user-role":  createdUser.role,
      "x-user-email": createdUser.email,
    },
    timeout: 3000,
  }
).catch((err) => logger.warn({ err: err.message }, "Failed to create notification preferences"))

    return res
        .status(201)
        .json(new ApiResponse(201, createdUser, "User registered successfully"))
})

const loginUser = asyncHandler(async (req, res) => {
    const { email, password } = req.body

    const { accessToken, refreshToken, user } = await authService.login(email, password)

    // Send login alert — fire and forget
    // REMOVE the old call entirely and replace with:
axios.post(
  `${process.env.NOTIFICATION_SERVICE_URL}/api/v1/notifications/login-alert`,
  {
    userId:    user._id.toString(),
    ipAddress: (req.ip || req.headers["x-forwarded-for"] || "unknown")
    .replace(/^::ffff:/, ""), // strips IPv4-mapped IPv6 prefix
    timestamp: new Date().toISOString(),
    userAgent: req.headers["user-agent"] || "unknown",
  },
  {
    headers: {
      // Remove x-user-id/role/email, add the internal secret instead
      "x-internal-secret": process.env.INTERNAL_SERVICE_SECRET,
    },
    timeout: 15000,
  }
).catch((err) => logger.warn({ err: err.message }, "Login alert notification failed"))

    return res
        .status(200)
        .cookie("accessToken", accessToken, cookieOptions())
        .cookie("refreshToken", refreshToken, cookieOptions())
        .json(new ApiResponse(200, { user , accessToken }, "User logged in successfully"))
})

const refreshAccessToken = asyncHandler(async (req, res) => {
    const incomingRefreshToken = req.cookies.refreshToken || req.body.refreshToken

    const { accessToken, refreshToken } = await authService.refreshAccessToken(incomingRefreshToken)

    return res
        .status(200)
        .cookie("accessToken", accessToken, cookieOptions())
        .cookie("refreshToken", refreshToken, cookieOptions())
        .json(new ApiResponse(200, { accessToken }, "Access token refreshed"))
})

// ─── Protected Routes ──────────────────────────────────────────────────────────

const logoutUser = asyncHandler(async (req, res) => {
    await authService.logout(req.user._id)

    return res
        .status(200)
        .clearCookie("accessToken", cookieOptions())
        .clearCookie("refreshToken", cookieOptions())
        .json(new ApiResponse(200, {}, "User logged out successfully"))
})

const getCurrentUser = asyncHandler(async (req, res) => {
    const user = await authService.getCurrentUser(req.user._id)

    return res
        .status(200)
        .json(new ApiResponse(200, user, "Current user fetched successfully"))
})

const changePassword = asyncHandler(async (req, res) => {
    const { oldPassword, newPassword } = req.body

    await authService.changePassword(req.user._id, oldPassword, newPassword)

    return res
        .status(200)
        .clearCookie("accessToken", cookieOptions())
        .clearCookie("refreshToken", cookieOptions())
        .json(new ApiResponse(200, {}, "Password changed successfully"))
})

// ─── Admin Only Routes ─────────────────────────────────────────────────────────

const getAllUsers = asyncHandler(async (req, res) => {
    const result = await authService.getAllUsers(req.query.page, req.query.limit)

    return res
        .status(200)
        .json(new ApiResponse(200, result, "Users fetched successfully"))
})

const changeUserRole = asyncHandler(async (req, res) => {
    const { userId } = req.params
    const { role } = req.body

    const updatedUser = await authService.changeUserRole(userId, role)

    return res
        .status(200)
        .json(new ApiResponse(200, updatedUser, "User role updated successfully"))
})

const suspendUser = asyncHandler(async (req, res) => {
    const { userId } = req.params
    const { reason } = req.body

    const result = await authService.suspendUser(userId, reason)

    return res.status(200).json(new ApiResponse(200, result, "User suspended"))
})

const unsuspendUser = asyncHandler(async (req, res) => {
    const { userId } = req.params

    const result = await authService.unsuspendUser(userId)

    return res.status(200).json(new ApiResponse(200, result, "User unsuspended"))
})

const deleteUser = asyncHandler(async (req, res) => {
    const { userId } = req.params

    const result = await authService.deleteUser(userId)

    return res.status(200).json(new ApiResponse(200, result, "User deleted"))
})

module.exports = {
    registerUser,
    loginUser,
    refreshAccessToken,
    logoutUser,
    getCurrentUser,
    getAllUsers,
    changeUserRole,
    changePassword,
    suspendUser,      
    unsuspendUser,    
    deleteUser 
}