module.exports = {
    auth: {
        target: process.env.AUTH_SERVICE_URL || "http://auth-service:5001",
        rewrite: "^/api/auth",
        rewriteTo: "/api/v1/auth"
    },
    storage: {
        target: process.env.STORAGE_SERVICE_URL || "http://storage-service:5002",
        rewrite: "^/api/storage",
        rewriteTo: "/api/v1/storage"
    },
    metering: {
        target:    process.env.METERING_SERVICE_URL || "http://metering-service:5003",
        rewrite:   "^/api/metering",
        rewriteTo: "/api/v1/metering"
    },
    billing: {
        target: process.env.BILLING_SERVICE_URL || "http://billing-service:5004",
        rewrite: "^/api/billing",
        rewriteTo: "/api/v1/billing"
    },
     notification: {                                                              // ← ADD
        target: process.env.NOTIFICATION_SERVICE_URL || "http://notification-service:5005",
        rewrite: "^/api/notifications",
        rewriteTo: "/api/v1/notifications"
    }
}