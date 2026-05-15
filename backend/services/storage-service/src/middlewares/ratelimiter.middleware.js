const rateLimit = require("express-rate-limit")

// Global limiter
const globalLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 100,
  message: "Too many requests, try again later"
})

// Upload limiter (stricter)
const uploadLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  message: "Too many upload requests"
})

module.exports = {
  globalLimiter,
  uploadLimiter
}