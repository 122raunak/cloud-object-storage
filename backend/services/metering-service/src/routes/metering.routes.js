const express = require("express")
const router  = express.Router()

const {
  getCurrentUsage,
  getDailyBreakdown,
  getMonthlyBreakdown,
  getEventLog,
  health,
} = require("../controllers/metering.controller")

const { verifyToken, authorizeUserOrService } = require("../middlewares/auth.middleware")
const { meteringRateLimiter }                 = require("../middlewares/rateLimiter.middleware")

const {
  validateQuery,
  dailyQuerySchema,
  monthlyQuerySchema,
  eventLogQuerySchema,
} = require("../middlewares/validate.middleware")

// ─── Health — no auth ────────────────────────────────────────────────────────
router.get("/health", health)

// ─── Current usage summary ───────────────────────────────────────────────────
router.get(
  "/usage/:userId",
  meteringRateLimiter,
  verifyToken,
  authorizeUserOrService,
  getCurrentUsage
)

// ─── Daily breakdown ─────────────────────────────────────────────────────────
// validateQuery coerces and validates ?days before it reaches the controller
router.get(
  "/usage/:userId/daily",
  meteringRateLimiter,
  verifyToken,
  authorizeUserOrService,
  validateQuery(dailyQuerySchema),
  getDailyBreakdown
)

// ─── Monthly breakdown ───────────────────────────────────────────────────────
// validateQuery coerces and validates ?months before it reaches the controller
router.get(
  "/usage/:userId/monthly",
  meteringRateLimiter,
  verifyToken,
  authorizeUserOrService,
  validateQuery(monthlyQuerySchema),
  getMonthlyBreakdown
)

// ─── Raw event log ───────────────────────────────────────────────────────────
// validateQuery coerces limit, offset and validates eventType enum
router.get(
  "/events/:userId",
  meteringRateLimiter,
  verifyToken,
  authorizeUserOrService,
  validateQuery(eventLogQuerySchema),
  getEventLog
)

module.exports = router