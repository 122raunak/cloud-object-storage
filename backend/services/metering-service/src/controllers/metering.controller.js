const meteringService = require("../services/metering.service")
const ApiResponse     = require("../utils/ApiResponse")
const ApiError        = require("../utils/ApiError")
const asyncHandler    = require("../utils/asyncHandler")

// ─── GET /api/v1/metering/usage/:userId ───────────────────────────────────────
const getCurrentUsage = asyncHandler(async (req, res) => {
  const { userId } = req.params

  const usage = await meteringService.getCurrentUsage(userId)

  return res
    .status(200)
    .json(new ApiResponse(200, usage, "Usage summary fetched"))
})

// ─── GET /api/v1/metering/usage/:userId/daily?days=30 ────────────────────────
const getDailyBreakdown = asyncHandler(async (req, res) => {
  const { userId } = req.params

  const days = parseInt(req.query.days, 10) || 30

  if (isNaN(days) || days < 1 || days > 365) {
    throw new ApiError(400, "days must be between 1 and 365")
  }

  const data = await meteringService.getDailyBreakdown(userId, days)

  return res
    .status(200)
    .json(new ApiResponse(200, data, "Daily breakdown fetched"))
})

// ─── GET /api/v1/metering/usage/:userId/monthly?months=12 ────────────────────
const getMonthlyBreakdown = asyncHandler(async (req, res) => {
  const { userId } = req.params

  const months = parseInt(req.query.months, 10) || 12

  if (isNaN(months) || months < 1 || months > 60) {
    throw new ApiError(400, "months must be between 1 and 60")
  }

  const data = await meteringService.getMonthlyBreakdown(userId, months)

  return res
    .status(200)
    .json(new ApiResponse(200, data, "Monthly breakdown fetched"))
})

// ─── GET /api/v1/metering/events/:userId ─────────────────────────────────────
const getEventLog = asyncHandler(async (req, res) => {
  const { userId } = req.params

  const { limit, offset, eventType } = req.query

  const data = await meteringService.getEventLog(userId, {
    limit:     limit     || 50,
    offset:    offset    || 0,
    eventType: eventType || null,
  })

  return res
    .status(200)
    .json(new ApiResponse(200, data, "Event log fetched"))
})

// ─── GET /api/v1/metering/health ─────────────────────────────────────────────
const health = asyncHandler(async (req, res) => {
  return res
    .status(200)
    .json(new ApiResponse(200, { status: "ok" }, "Metering service healthy"))
})

module.exports = {
  getCurrentUsage,
  getDailyBreakdown,
  getMonthlyBreakdown,
  getEventLog,
  health,
}