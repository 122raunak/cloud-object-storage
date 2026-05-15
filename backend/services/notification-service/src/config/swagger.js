const notificationDocs = require("./swagger.docs")

const swaggerSpec = {
    openapi: "3.0.0",
    info: {
        title: "Notification Service API",
        version: "1.0.0",
        description: "Notification microservice for CloudStore — handles email alerts, digests, and user notification preferences"
    },
    servers: [
        {
            url: "http://localhost:5005",
            description: "Direct access"
        },
        {
            url: "http://localhost:5000",
            description: "Via API Gateway"
        }
    ],
    paths: notificationDocs,
    components: {
        securitySchemes: {
            gatewayAuth: {
                type: "apiKey",
                in: "header",
                name: "x-user-id",
                description: "Injected by API Gateway after JWT verification. Never pass JWT here directly."
            }
        },
        schemas: {
            ApiResponse: {
                type: "object",
                properties: {
                    statusCode: { type: "integer", example: 200 },
                    data: { type: "object" },
                    message: { type: "string", example: "Success" },
                    success: { type: "boolean", example: true }
                }
            },
            ApiError: {
                type: "object",
                properties: {
                    statusCode: { type: "integer", example: 400 },
                    data: { type: "null" },
                    message: { type: "string", example: "Bad request" },
                    success: { type: "boolean", example: false }
                }
            },
            Notification: {
                type: "object",
                properties: {
                    _id: { type: "string", example: "64f1b2c3d4e5f6a7b8c9d0e1" },
                    userId: { type: "string", example: "64f1b2c3d4e5f6a7b8c9d0e1" },
                    type: {
                        type: "string",
                        enum: ["invoice_generated", "budget_alert", "storage_warning", "login_alert", "daily_digest", "weekly_report"],
                        example: "invoice_generated"
                    },
                    channel: { type: "string", enum: ["email"], example: "email" },
                    status: {
                        type: "string",
                        enum: ["pending", "sent", "failed"],
                        example: "sent"
                    },
                    subject: { type: "string", example: "Invoice #123 — Jan 1 to Jan 31, 2025" },
                    metadata: {
                        type: "object",
                        example: { invoiceId: 123, totalAmount: "12.50", currency: "USD" }
                    },
                    sentAt: { type: "string", format: "date-time" },
                    createdAt: { type: "string", format: "date-time" }
                }
            },
            PaginatedNotifications: {
                type: "object",
                properties: {
                    notifications: {
                        type: "array",
                        items: { "$ref": "#/components/schemas/Notification" }
                    },
                    pagination: {
                        type: "object",
                        properties: {
                            total: { type: "integer", example: 100 },
                            page: { type: "integer", example: 1 },
                            limit: { type: "integer", example: 20 },
                            pages: { type: "integer", example: 5 }
                        }
                    }
                }
            },
            NotificationPreferences: {
                type: "object",
                properties: {
                    userId: { type: "string", example: "64f1b2c3d4e5f6a7b8c9d0e1" },
                    email: { type: "string", format: "email", example: "john@example.com" },
                    budgetThreshold: {
                        type: "number",
                        example: 50.00,
                        description: "Alert when invoice exceeds this amount. 0 = disabled."
                    },
                    storageQuotaGB: {
                        type: "number",
                        example: 5,
                        description: "User's storage quota in GB. Alerts fire at 80% and 95%."
                    },
                    preferences: {
                        type: "object",
                        properties: {
                            invoiceGenerated: { type: "boolean", example: true },
                            budgetAlert: { type: "boolean", example: true },
                            storageWarning: { type: "boolean", example: true },
                            loginAlert: { type: "boolean", example: true },
                            dailyDigest: { type: "boolean", example: true },
                            weeklyReport: { type: "boolean", example: true }
                        }
                    },
                    createdAt: { type: "string", format: "date-time" },
                    updatedAt: { type: "string", format: "date-time" }
                }
            },
            UpdatePreferencesRequest: {
                type: "object",
                properties: {
                    email: { type: "string", format: "email", example: "john@example.com" },
                    budgetThreshold: {
                        type: "number",
                        minimum: 0,
                        example: 50.00,
                        description: "Set to 0 to disable budget alerts"
                    },
                    storageQuotaGB: {
                        type: "number",
                        minimum: 1,
                        example: 10
                    },
                    preferences: {
                        type: "object",
                        properties: {
                            invoiceGenerated: { type: "boolean" },
                            budgetAlert: { type: "boolean" },
                            storageWarning: { type: "boolean" },
                            loginAlert: { type: "boolean" },
                            dailyDigest: { type: "boolean" },
                            weeklyReport: { type: "boolean" }
                        }
                    }
                }
            },
            LoginAlertRequest: {
                type: "object",
                required: ["userId", "ipAddress"],
                properties: {
                    userId: { type: "string", example: "64f1b2c3d4e5f6a7b8c9d0e1" },
                    ipAddress: { type: "string", example: "192.168.1.1" },
                    timestamp: {
                        type: "string",
                        format: "date-time",
                        description: "Defaults to current time if not provided"
                    },
                    userAgent: {
                        type: "string",
                        example: "Mozilla/5.0 (Windows NT 10.0; Win64; x64)"
                    }
                }
            }
        }
    }
}

module.exports = swaggerSpec