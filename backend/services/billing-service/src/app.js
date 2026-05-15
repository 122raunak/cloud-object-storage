const express    = require("express")
const helmet     = require("helmet")
const cors       = require("cors")
const { v4: uuid } = require("uuid")
const swaggerUi    = require("swagger-ui-express")
const swaggerSpec  = require("./config/swagger")

const billingRoutes = require("./routes/billing.routes")
const ApiError      = require("./utils/ApiError")
const logger        = require("./utils/logger")
const { pool }      = require("./config/db")
const { redis }     = require("./config/redis")

const app = express()

// ─── Security ─────────────────────────────────────────────────────────────────
app.use(helmet())
app.use(cors({ origin: process.env.CORS_ORIGIN || "*" }))

// ─── Body parsing ─────────────────────────────────────────────────────────────
app.use(express.json())
app.use(express.urlencoded({ extended: true }))

// ─── Correlation ID ───────────────────────────────────────────────────────────
app.use((req, res, next) => {
  const requestId = req.headers["x-request-id"] || uuid()
  req.requestId   = requestId
  res.setHeader("x-request-id", requestId)
  next()
})

// ─── Request logger ───────────────────────────────────────────────────────────
app.use((req, res, next) => {
  const start = Date.now()

  res.on("finish", () => {
    logger.info({
      method:    req.method,
      url:       req.originalUrl,
      status:    res.statusCode,
      duration:  `${Date.now() - start}ms`,
      requestId: req.requestId,
    }, "Request handled")
  })

  next()
})

// ─── Health check ─────────────────────────────────────────────────────────────
app.get("/health", async (req, res) => {
  const health = { status: "ok", postgres: "ok", redis: "ok" }
  let httpStatus = 200

  try {
    await pool.query("SELECT 1")
  } catch (err) {
    health.postgres = "error"
    health.status   = "degraded"
    httpStatus      = 503
    logger.error({ err }, "Health check: PostgreSQL failed")
  }

  try {
    await redis.ping()
  } catch (err) {
    health.redis  = "error"
    health.status = "degraded"
    httpStatus    = 503
    logger.error({ err }, "Health check: Redis failed")
  }

  return res.status(httpStatus).json(health)
})

// ─── Swagger docs ─────────────────────────────────────────────────────────────
app.use("/api/v1/billing/docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
  customCss:       ".swagger-ui .topbar { display: none }",
  customSiteTitle: "Billing Service API",
}))

// ─── Routes ───────────────────────────────────────────────────────────────────
app.use("/api/v1/billing", billingRoutes)

// ─── 404 ──────────────────────────────────────────────────────────────────────
app.use((req, res) => {
  res.status(404).json({ success: false, message: "Route not found" })
})

// ─── Global error handler ─────────────────────────────────────────────────────
app.use((err, req, res, next) => {
  logger.error({ err, requestId: req.requestId }, "Unhandled error")

  if (err instanceof ApiError) {
    return res.status(err.statusCode).json({
      success: false,
      message: err.message,
      errors:  err.errors,
    })
  }

  return res.status(500).json({
    success: false,
    message: "Internal server error",
  })
})

module.exports = app