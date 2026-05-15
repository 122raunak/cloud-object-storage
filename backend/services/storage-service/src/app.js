const express = require("express")
const cors = require("cors")
const helmet = require("helmet")
const mongoose = require("mongoose")
const crypto = require("crypto")
const { globalLimiter } = require("./middlewares/ratelimiter.middleware")
const { minioClient } = require("./config/minio")
const storageRoutes = require("./routes/storage.routes")
const logger = require("./utils/logger")
const app = express()

// 1. Core middleware
app.use(express.json())
app.use(cors({
  origin: process.env.CORS_ORIGIN || "http://localhost:3000",
  credentials: true,
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: [
    "Content-Type",
    "Authorization",
    "X-Request-ID",
    "X-User-ID",
    "X-User-Role",
    "X-User-Email"
  ]
}))
app.options(/.*/, cors()) 
app.use(helmet())
app.use(globalLimiter)

// 2. Correlation ID — must be before routes
app.use((req, res, next) => {
  req.requestId = req.headers["x-request-id"] || crypto.randomUUID()
  res.setHeader("x-request-id", req.requestId)
  next()
})

//3 request logger
app.use((req, res, next) => {
  const start = Date.now()
  res.on("finish", () => {
    logger.info({
      method: req.method,
      url: req.url,
      status: res.statusCode,
      duration: `${Date.now() - start}ms`,
      requestId: req.requestId
    })
  })
  next()
})

// 3. Health check
app.get("/health", async (req, res) => {
  const mongoOk = mongoose.connection.readyState === 1
  let minioOk = false
  try {
    await minioClient.bucketExists(process.env.MINIO_BUCKET)
    minioOk = true
  } catch (_) {}

  // Return 200 even if minio is degraded — don't block health check
  return res.status(200).json({
    status: mongoOk ? "ok" : "degraded",
    service: "storage-service",
    uptime: process.uptime(),
    mongo: mongoOk ? "connected" : "disconnected",
    minio: minioOk ? "connected" : "disconnected"
  })
})

// 4. Routes
app.use("/api/v1/storage", storageRoutes)

//404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: `Route ${req.method} ${req.url} not found`
  })
})


// 5. Global error handler — must be last
app.use((err, req, res, next) => {
  const statusCode = err.statusCode || 500
  return res.status(statusCode).json({
    success: false,
    message: err.message || "Internal Server Error",
    errors: err.errors || []
  })
})


module.exports = app