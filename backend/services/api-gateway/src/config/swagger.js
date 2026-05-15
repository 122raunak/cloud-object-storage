const gatewayDocs = require("./swagger.docs")

const swaggerSpec = {
    openapi: "3.0.0",
    info: {
        title: "API Gateway",
        version: "1.0.0",
        description: "API Gateway for Cloud Object Storage System — single entry point for all microservices"
    },
    servers: [
        {
            url: "http://localhost:5000",
            description: "API Gateway"
        }
    ],
    paths: gatewayDocs,
    components: {
        securitySchemes: {
            cookieAuth: {
                type: "apiKey",
                in: "cookie",
                name: "accessToken"
            },
            bearerAuth: {
                type: "http",
                scheme: "bearer",
                bearerFormat: "JWT"
            }
        },
        schemas: {
            HealthResponse: {
                type: "object",
                properties: {
                    status: { type: "string", example: "ok" },
                    service: { type: "string", example: "api-gateway" },
                    timestamp: { type: "string", format: "date-time" },
                    uptime: { type: "number", example: 123.45 },
                    services: {
                        type: "object",
                        properties: {
                            auth: { type: "string", enum: ["up", "down"], example: "up" },
                            storage: { type: "string", enum: ["up", "down"], example: "up" },
                            billing: { type: "string", enum: ["up", "down"], example: "up" }
                        }
                    }
                }
            },
            ErrorResponse: {
                type: "object",
                properties: {
                    success: { type: "boolean", example: false },
                    message: { type: "string", example: "Unauthorized request" }
                }
            }
        }
    }
}

module.exports = swaggerSpec