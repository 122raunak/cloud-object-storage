const { rateLimit, ipKeyGenerator } = require("express-rate-limit")

const defaultLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: { statusCode: 429, message: "Too many requests, please try again later.", success: false },
  keyGenerator: (req) => req.headers["x-user-id"] || ipKeyGenerator(req),
})

const generateInvoiceLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { statusCode: 429, message: "Invoice generation rate limit exceeded.", success: false },
  keyGenerator: (req) => req.headers["x-user-id"] || ipKeyGenerator(req),
})

module.exports = { defaultLimiter, generateInvoiceLimiter }