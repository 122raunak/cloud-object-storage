const express = require("express")
const cookieParser = require("cookie-parser")
const helmet = require("helmet")
const cors = require("cors")
const rateLimit = require("express-rate-limit")
const ApiResponse = require("./utils/ApiResponse")
const logger = require("./utils/logger")

const swaggerUi = require("swagger-ui-express")
const swaggerSpec = require("./config/swagger")

const app = express()

// ─── Security Middleware ───────────────────────────────────────────────────────

app.use(helmet())

app.use(cors({
    origin: process.env.CORS_ORIGIN || "http://localhost:3000",
    credentials: true,
    methods: ["GET", "POST", "PATCH", "DELETE"],
    allowedHeaders: ["Content-Type", "Authorization"]
}))

// ─── Health Check ──────────────────────────────────────────────────────────────

app.get("/health", (req, res) => {
    res.status(200).json({
        status: "ok",
        service: "auth-service",
        timestamp: new Date().toISOString(),
        uptime: process.uptime()
    })
})


// ─── Rate Limiting ─────────────────────────────────────────────────────────────

const globalLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: parseInt(process.env.RATE_LIMIT_MAX) || 100,
    standardHeaders: true,
    legacyHeaders: false
})

const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: parseInt(process.env.AUTH_RATE_LIMIT_MAX) || 20,
    standardHeaders: true,
    legacyHeaders: false,
    skip: (req) => {
        // Only apply strict limit to login and register
        return !req.path.includes('/login') && !req.path.includes('/register')
    }
})

app.use(globalLimiter)

// ─── Body Parsing ──────────────────────────────────────────────────────────────

app.use(express.json({ limit: "10kb" }))
app.use(express.urlencoded({ extended: true, limit: "10kb" }))
app.use(cookieParser())

// ─── Request Logging ───────────────────────────────────────────────────────────

app.use((req, res, next) => {
    logger.info({
        method: req.method,
        url: req.url,
        ip: req.ip
    }, "Incoming request")
    next()
})




app.use("/api/v1/auth/docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
    customSiteTitle: "Auth Service API Docs",
    customCss: ".swagger-ui .topbar { display: none }"
}))



// ─── Routes ────────────────────────────────────────────────────────────────────

const authRoutes = require("./routes/auth.routes")
app.use("/api/v1/auth", authRoutes)

// ─── 404 Handler ──────────────────────────────────────────────────────────────

app.use((req, res) => {
    res.status(404).json(
        new ApiResponse(404, null, `Route ${req.method} ${req.url} not found`)
    )
})

// ─── Global Error Handler ──────────────────────────────────────────────────────

app.use((err, req, res, next) => {
    const statusCode = err.statusCode || 500
    const message = err.message || "Internal Server Error"

    logger.error({
        statusCode,
        message,
        stack: process.env.NODE_ENV === "development" ? err.stack : undefined,
        method: req.method,
        url: req.url
    }, "Request error")

    return res.status(statusCode).json(
        new ApiResponse(statusCode, null, message)
    )
})

module.exports = app