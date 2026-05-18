const { Router } = require("express")
const { z } = require("zod")
const ApiResponse = require("../utils/ApiResponse")
const Notification = require("../models/notification.model")
const {
  listNotifications,
  getPreferences,
  updatePreferences,
  triggerLoginAlert,
  getUnreadCount,
} = require("../controllers/notification.controller")

const { verifyToken, verifyInternalService, requireOwnerOrAdmin } = require("../middlewares/auth.middleware")
const { validateBody, validateQuery, validateParams } = require("../middlewares/validate.middleware")
const { loginAlertRateLimiter, apiRateLimiter } = require("../middlewares/rateLimiter.middleware")

const router = Router()

router.use(apiRateLimiter)

const userIdParamsSchema = z.object({
  userId: z.string().min(1, "userId is required"),
})

const listQuerySchema = z.object({
  page:   z.string().optional().default("1"),
  limit:  z.string().optional().default("20"),
  type:   z.enum(["invoice_generated", "budget_alert", "storage_warning", "login_alert", "daily_digest", "weekly_report"]).optional(),
  status: z.enum(["pending", "sent", "failed"]).optional(),
})

const updatePreferencesSchema = z.object({
  email:           z.string().email("Invalid email address").optional(),
  budgetThreshold: z.number().min(0).optional(),
  storageQuotaGB:  z.number().min(1).optional(),
  preferences: z.object({
    invoiceGenerated: z.boolean().optional(),
    budgetAlert:      z.boolean().optional(),
    storageWarning:   z.boolean().optional(),
    loginAlert:       z.boolean().optional(),
    dailyDigest:      z.boolean().optional(),
    weeklyReport:     z.boolean().optional(),
  }).optional(),
})

const loginAlertBodySchema = z.object({
  userId:    z.string().min(1, "userId is required"),
  ipAddress: z.string().regex(
    /^(\d{1,3}\.){3}\d{1,3}$|^([0-9a-fA-F]{0,4}:){2,7}[0-9a-fA-F]{0,4}$/,
    "Invalid IP address format"
  ),
  timestamp: z.string().datetime().optional(),
  userAgent: z.string().max(512).optional(),
})

// POST /login-alert — must be before /:userId routes
router.post("/login-alert", loginAlertRateLimiter, verifyInternalService, validateBody(loginAlertBodySchema), triggerLoginAlert)

// GET /:userId
router.get("/:userId", verifyToken, validateParams(userIdParamsSchema), requireOwnerOrAdmin, validateQuery(listQuerySchema), listNotifications)

// GET /:userId/unread-count
router.get("/:userId/unread-count", verifyToken, validateParams(userIdParamsSchema), requireOwnerOrAdmin, getUnreadCount)

// GET /:userId/preferences
router.get("/:userId/preferences", verifyToken, validateParams(userIdParamsSchema), requireOwnerOrAdmin, getPreferences)

// PUT /:userId/preferences
router.put("/:userId/preferences", verifyToken, validateParams(userIdParamsSchema), requireOwnerOrAdmin, validateBody(updatePreferencesSchema), updatePreferences)

// PATCH /:userId/read-all
router.patch("/:userId/read-all", verifyToken, validateParams(userIdParamsSchema), requireOwnerOrAdmin, async (req, res) => {
  await Notification.updateMany(
    { userId: req.params.userId, read: { $ne: true } },
    { $set: { read: true } }
  )
  return res.status(200).json(new ApiResponse(200, null, "All notifications marked as read"))
})

// PATCH /:userId/:notifId/read
router.patch("/:userId/:notifId/read", verifyToken, validateParams(userIdParamsSchema), requireOwnerOrAdmin, async (req, res) => {
  await Notification.findByIdAndUpdate(req.params.notifId, { read: true })
  return res.status(200).json(new ApiResponse(200, null, "Notification marked as read"))
})

module.exports = router