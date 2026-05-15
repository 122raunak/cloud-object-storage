const express = require("express")
const helmet  = require("helmet")
const cors    = require("cors")
const mongoose = require("mongoose")
const crypto  = require("crypto")

const ApiResponse = require("./utils/ApiResponse")
const ApiError    = require("./utils/ApiError")
const logger      = require("./utils/logger")
const { redis }   = require("./config/redis")

const swaggerUi   = require("swagger-ui-express")
const swaggerSpec = require("./config/swagger")

const app = express()

// ─── Security Middleware ───────────────────────────────────────────────────────

app.use(helmet())

// CORS_ORIGIN is validated as a URL in env.validation.js — safe to use directly
app.use(cors({
  origin:         process.env.CORS_ORIGIN || "http://localhost:3000",
  credentials:    true,
  methods:        ["GET", "POST", "PUT", "PATCH", "DELETE"],
  allowedHeaders: [
    "Content-Type",
    "Authorization",
    "x-user-id",
    "x-user-role",
    "x-user-email",
    "x-request-id",
    "x-internal-secret", // Required for internal service calls (login-alert)
  ],
}))

// ─── Body Parsing ──────────────────────────────────────────────────────────────

app.use(express.json({ limit: "10kb" }))
app.use(express.urlencoded({ extended: true, limit: "10kb" }))

// ─── Correlation ID ────────────────────────────────────────────────────────────

app.use((req, res, next) => {
  req.requestId = req.headers["x-request-id"] || crypto.randomUUID()
  res.setHeader("x-request-id", req.requestId)
  next()
})

// ─── Request Logging ───────────────────────────────────────────────────────────

app.use((req, res, next) => {
  const start = Date.now()
  res.on("finish", () => {
    logger.info({
      method:    req.method,
      url:       req.url,
      status:    res.statusCode,
      duration:  `${Date.now() - start}ms`,
      requestId: req.requestId,
      userId:    req.headers["x-user-id"] || null,
    })
  })
  next()
})

// ─── Health Check ──────────────────────────────────────────────────────────────

app.get("/health", async (req, res) => {
  const checks = {}

  checks.mongodb = mongoose.connection.readyState === 1 ? "ok" : "degraded"

  try {
    const pong    = await redis.ping()
    checks.redis  = pong === "PONG" ? "ok" : "degraded"
  } catch {
    checks.redis = "degraded"
  }

  const allOk = Object.values(checks).every((v) => v === "ok")

  res.status(allOk ? 200 : 503).json({
    status:    allOk ? "ok" : "degraded",
    service:   "notification-service",
    timestamp: new Date().toISOString(),
    uptime:    process.uptime(),
    checks,
  })
})

// ─── Swagger Docs ──────────────────────────────────────────────────────────────

app.use(
  "/api/v1/notifications/docs",
  swaggerUi.serve,
  swaggerUi.setup(swaggerSpec, {
    customSiteTitle: "Notification Service API Docs",
    customCss:       ".swagger-ui .topbar { display: none }",
  })
)

// ─── Routes ────────────────────────────────────────────────────────────────────

const notificationRoutes = require("./routes/notification.routes")
app.use("/api/v1/notifications", notificationRoutes)

// ─── 404 Handler ──────────────────────────────────────────────────────────────

app.use((req, res) => {
  res.status(404).json(
    new ApiError(404, `Route ${req.method} ${req.url} not found`)
  )
})

// ─── Global Error Handler ──────────────────────────────────────────────────────

app.use((err, req, res, next) => {
  const statusCode = err.statusCode || 500
  const message    = statusCode === 500 ? "Internal Server Error" : err.message

  logger.error({
    statusCode,
    message:   err.message,
    stack:     process.env.NODE_ENV === "development" ? err.stack : undefined,
    method:    req.method,
    url:       req.url,
    requestId: req.requestId,
  }, "Request error")

  return res.status(statusCode).json(
    new ApiError(statusCode, message, err.errors || [])
  )
})

module.exports = app