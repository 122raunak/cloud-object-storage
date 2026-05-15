const express = require("express")
const helmet = require("helmet")
const cors = require("cors")
const cookieParser = require("cookie-parser")
const requestIdMiddleware = require("./middlewares/requestId.middleware")
const rateLimiter = require("./middlewares/rateLimiter.middleware")
const logger = require("./utils/logger")
const serviceRoutes = require("./routes/service.routes")
const swaggerUi = require("swagger-ui-express")
const swaggerSpec = require("./config/swagger")

const app = express()

app.use(helmet())

const corsOptions = {
    origin: process.env.CORS_ORIGIN || "http://localhost:3000",
    credentials: true,
    methods: ["GET", "POST", "PATCH", "DELETE", "PUT", "OPTIONS"],
    allowedHeaders: [
        "Content-Type",
        "Authorization",
        "X-Request-ID",
        "X-User-ID",
        "X-User-Role",
        "X-User-Email"
    ]
}
app.use(cors(corsOptions))
app.options(/.*/, cors(corsOptions))

app.use(cookieParser())
app.use(requestIdMiddleware)
app.use((req, res, next) => {
  if (req.path.startsWith('/api/auth')) return next()
  return rateLimiter(req, res, next)
})


// Request logging
app.use((req, res, next) => {
    logger.info({
        method: req.method,
        url: req.url,
        requestId: req.requestID,
        ip: req.ip
    }, "Incoming request")
    next()
})

// Health check
app.get("/health", async (req, res) => {
    const services = {
        auth: process.env.AUTH_SERVICE_URL,
        storage: process.env.STORAGE_SERVICE_URL,
        billing: process.env.BILLING_SERVICE_URL
    }

    const checks = await Promise.allSettled(
        Object.entries(services).map(async ([name, url]) => {
            const response = await fetch(`${url}/health`, { signal: AbortSignal.timeout(2000) })
            return { name, status: response.ok ? "up" : "down" }
        })
    )

    const results = checks.reduce((acc, check) => {
        if (check.status === "fulfilled") {
            acc[check.value.name] = check.value.status
        } else {
            acc["unknown"] = "down"
        }
        return acc
    }, {})

    res.status(200).json({
        status: "ok",
        service: "api-gateway",
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        services: results
    })
})


app.use("/docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
    customSiteTitle: "API Gateway Docs",
    customCss: ".swagger-ui .topbar { display: none }"
}))

app.use(serviceRoutes)

// 404 handler
app.use((req, res) => {
    res.status(404).json({
        success: false,
        message: `Route ${req.method} ${req.url} not found`
    })
})

// Global error handler
app.use((err, req, res, next) => {
    logger.error({
        err,
        requestId: req.requestID,
        method: req.method,
        url: req.url
    }, "Unhandled error")

    res.status(err.statusCode || 500).json({
        success: false,
        message: err.message || "Internal Server Error"
    })
})

module.exports = app