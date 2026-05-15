const rateLimit = require("express-rate-limit")

const rateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: parseInt(process.env.RATE_LIMIT_MAX) || 100,
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => req.path.includes('/refresh-token'),
  handler: (req, res) => {
    res.setHeader('Access-Control-Allow-Origin', process.env.CORS_ORIGIN || 'http://localhost:3000')
    res.setHeader('Access-Control-Allow-Credentials', 'true')
    res.status(429).json({
      success: false,
      message: "Too many requests. Please try again later."
    })
  }
})

module.exports = rateLimiter