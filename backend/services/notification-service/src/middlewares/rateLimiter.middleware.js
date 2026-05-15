const rateLimit = require("express-rate-limit")

const apiRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  // Use userId from gateway headers — no IP involved, no IPv6 issue
  keyGenerator: (req) => req.headers["x-user-id"] || "anonymous",
  skip: (req) => {
    // If no userId header, fall through to default IP-based limiting
    return false
  },
  message: {
    statusCode: 429,
    message: "Too many requests — please try again later",
    success: false,
    errors: [],
  },
})

const loginAlertRateLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  // Internal service calls — key on internal secret header, not IP
  keyGenerator: (req) => req.headers["x-internal-secret"] || "anonymous",
  message: {
    statusCode: 429,
    message: "Too many login alert requests",
    success: false,
    errors: [],
  },
})

module.exports = { apiRateLimiter, loginAlertRateLimiter }