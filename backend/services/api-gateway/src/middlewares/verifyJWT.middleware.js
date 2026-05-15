const redis = require("../config/redis")
const logger = require("../utils/logger")
const createCircuitBreaker = require("../utils/circuitBreaker")

const TOKEN_CACHE_TTL = 60

// The function that calls Auth Service
const callAuthService = async (token) => {
    const response = await fetch(
        `${process.env.AUTH_SERVICE_URL}/api/v1/auth/me`,
        {
            headers: {
                Authorization: `Bearer ${token}`,
                Cookie: `accessToken=${token}`
            },
            signal: AbortSignal.timeout(3000)
        }
    )
    return response
}


const authServiceBreaker = createCircuitBreaker(callAuthService, "auth-service")

const verifyJWT = async (req, res, next) => {
    const token = req.cookies?.accessToken ||
        req.headers.authorization?.split(" ")[1]

    if (!token) {
        return res.status(401).json({
            success: false,
            message: "Unauthorized request"
        })
    }

    try {
        // Check Redis cache first
        const cachedUser = await redis.get(`token:${token}`)
        if (cachedUser) {
            const user = JSON.parse(cachedUser)
            req.user = user
            req.headers["x-user-id"] = user._id
            req.headers["x-user-role"] = user.role
            req.headers["x-user-email"] = user.email
            return next()
        }

        // Call Auth Service through circuit breaker
        const response = await authServiceBreaker.fire(token)

        // Circuit breaker fallback triggered
        if (response.fallback) {
            return res.status(503).json({
                success: false,
                message: "Auth service is currently unavailable"
            })
        }

        if (!response.ok) {
            await redis.del(`token:${token}`)
            return res.status(401).json({
                success: false,
                message: "Unauthorized request"
            })
        }

        const data = await response.json()
        const user = data.data

        // Cache in Redis
        await redis.setex(`token:${token}`, TOKEN_CACHE_TTL, JSON.stringify(user))

        req.user = user
        req.headers["x-user-id"] = user._id
        req.headers["x-user-role"] = user.role
        req.headers["x-user-email"] = user.email

        next()

    } catch (error) {
        logger.error({ err: error }, "JWT verification failed")
        return res.status(503).json({
            success: false,
            message: "Auth service unavailable"
        })
    }
}

module.exports = verifyJWT