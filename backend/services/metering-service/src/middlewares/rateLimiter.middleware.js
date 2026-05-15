const rateLimit = require("express-rate-limit")

// ─── Global limiter — applied at app level in app.js ─────────────────────────
const globalLimiter = rateLimit({
  windowMs:       60 * 1000,   // 1 minute
  max:            100,
  standardHeaders: true,
  legacyHeaders:  false,
  message: {
    success: false,
    message: "Too many requests — please try again later",
  },
})

// ─── Metering route limiter — applied per route in metering.routes.js ─────────
const meteringRateLimiter = rateLimit({
  windowMs:       60 * 1000,   // 1 minute
  max:            60,           // 60 reads per minute per IP is generous for usage queries
  standardHeaders: true,
  legacyHeaders:  false,
  message: {
    success: false,
    message: "Too many requests — please try again later",
  },
})

module.exports = { globalLimiter, meteringRateLimiter }