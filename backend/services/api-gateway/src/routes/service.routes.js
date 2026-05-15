const express = require("express")
const rateLimit = require("express-rate-limit")
const services = require("../config/services")
const createProxy = require("../utils/createProxy")
const verifyJWT = require("../middlewares/verifyJWT.middleware")

const router = express.Router()

const publicPaths = ["/login", "/register", "/refresh-token"]

const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: parseInt(process.env.AUTH_RATE_LIMIT_MAX) || 20,
    message: { success: false, message: "Too many auth attempts" },
    standardHeaders: true,
    legacyHeaders: false
})

const authApiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: parseInt(process.env.API_RATE_LIMIT_MAX) || 200,
    message: { success: false, message: "Too many requests" },
    standardHeaders: true,
    legacyHeaders: false
})

router.use("/api/auth", (req, res, next) => {
    if (req.path.startsWith('/login') || req.path.startsWith('/register')) {
        return authLimiter(req, res, next)
    }
    return authApiLimiter(req, res, next)
}, (req, res, next) => {
    const isPublic = publicPaths.some(path => req.path.startsWith(path))
    if (isPublic) return next()
    return verifyJWT(req, res, next)
}, createProxy(services.auth.target, services.auth.rewrite, services.auth.rewriteTo))

router.use("/api/storage",
    verifyJWT,
    createProxy(services.storage.target, services.storage.rewrite, services.storage.rewriteTo)
)

router.use("/api/billing",
    verifyJWT,
    createProxy(services.billing.target, services.billing.rewrite, services.billing.rewriteTo)
)

router.use("/api/metering",
    verifyJWT,
    createProxy(services.metering.target, services.metering.rewrite, services.metering.rewriteTo)
)

router.use("/api/notifications",
    verifyJWT,
    createProxy(services.notification.target, services.notification.rewrite, services.notification.rewriteTo)
)

module.exports = router