const { createProxyMiddleware } = require("http-proxy-middleware")
const logger = require("./logger")

const createProxy = (target, rewritePath, rewriteTo) => {
    return createProxyMiddleware({
        target,
        changeOrigin: true,
        pathRewrite: (path, req) => {
            const newPath = rewriteTo + path
            logger.info({ originalPath: path, newPath, target }, "Proxying request")
            return newPath
        },
        timeout: 5000,
        proxyTimeout: 5000,
        on: {
            error: (err, req, res) => {
                logger.error({ err, target }, "Proxy error")
                res.status(503).json({
                    success: false,
                    message: "Service unavailable"
                })
            },
            proxyReq: (proxyReq, req) => {
                if (req.requestID) {
                    proxyReq.setHeader("X-Request-ID", req.requestID)
                }
                if (req.user) {
                    proxyReq.setHeader("X-User-ID", req.user._id || req.user.id)
                    proxyReq.setHeader("X-User-Role", req.user.role)
                    proxyReq.setHeader("X-User-Email", req.user.email)
                }
            }
        }
    })
}

module.exports = createProxy