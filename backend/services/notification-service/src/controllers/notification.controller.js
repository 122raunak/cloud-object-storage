const asyncHandler = require("../utils/asyncHandler")
const ApiResponse = require("../utils/ApiResponse")
const ApiError = require("../utils/ApiError")
const notificationService = require("../services/notification.service")

/**
 * GET /api/v1/notifications/:userId
 * List paginated notifications for a user with optional filters.
 */
const listNotifications = asyncHandler(async (req, res) => {
  const { userId } = req.params
  const { page = "1", limit = "20", type, status } = req.query

  const data = await notificationService.listNotifications(userId, {
    page: parseInt(page, 10),
    limit: Math.min(parseInt(limit, 10), 100), // hard cap at 100 per page
    type,
    status,
  })

  return res.status(200).json(new ApiResponse(200, data, "Notifications retrieved successfully"))
})

/**
 * GET /api/v1/notifications/:userId/preferences
 * Get notification preferences for a user.
 */
const getPreferences = asyncHandler(async (req, res) => {
  const { userId } = req.params
  const prefs = await notificationService.getPreferences(userId)
  return res.status(200).json(new ApiResponse(200, prefs, "Preferences retrieved successfully"))
})

/**
 * PUT /api/v1/notifications/:userId/preferences
 * Update notification preferences for a user.
 */
const updatePreferences = asyncHandler(async (req, res) => {
  const { userId } = req.params
  const updates = req.body

  const prefs = await notificationService.updatePreferences(userId, updates)
  return res.status(200).json(new ApiResponse(200, prefs, "Preferences updated successfully"))
})

/**
 * POST /api/v1/notifications/login-alert
 * Trigger a login alert email. Called internally by Auth Service.
 */
const triggerLoginAlert = asyncHandler(async (req, res) => {
  const { userId, ipAddress, timestamp, userAgent } = req.body

  const notification = await notificationService.sendLoginAlert({
    userId,
    ipAddress,
    timestamp: timestamp || new Date().toISOString(),
    userAgent: userAgent || "Unknown",
  })

  return res.status(200).json(
    new ApiResponse(200, { notificationId: notification?._id || null }, "Login alert processed")
  )
})

/**
 * GET /api/v1/notifications/:userId/unread-count
 * Return count of pending notifications for a user.
 */
const getUnreadCount = asyncHandler(async (req, res) => {
  const { userId } = req.params
  const data = await notificationService.getUnreadCount(userId)
  return res.status(200).json(new ApiResponse(200, data, "Unread count retrieved successfully"))
})

module.exports = {
  listNotifications,
  getPreferences,
  updatePreferences,
  triggerLoginAlert,
  getUnreadCount,
}