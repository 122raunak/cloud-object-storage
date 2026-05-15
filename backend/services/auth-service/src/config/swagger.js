const authDocs = require("./swagger.docs")

const swaggerSpec = {
    openapi: "3.0.0",
    info: {
        title: "Auth Service API",
        version: "1.0.0",
        description: "Authentication microservice for Cloud Object Storage System"
    },
    servers: [
        {
            url: "http://localhost:5001",
            description: "Direct access"
        },
        {
            url: "http://localhost:5000",
            description: "Via API Gateway"
        }
    ],
    paths: authDocs,
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
            User: {
                type: "object",
                properties: {
                    _id: { type: "string", example: "64f1b2c3d4e5f6a7b8c9d0e1" },
                    username: { type: "string", example: "johndoe" },
                    email: { type: "string", example: "john@example.com" },
                    role: { type: "string", enum: ["USER", "ADMIN"], example: "USER" },
                    createdAt: { type: "string", format: "date-time" },
                    updatedAt: { type: "string", format: "date-time" }
                }
            },
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
            RegisterRequest: {
                type: "object",
                required: ["username", "email", "password"],
                properties: {
                    username: { type: "string", minLength: 3, maxLength: 30, example: "johndoe" },
                    email: { type: "string", format: "email", example: "john@example.com" },
                    password: { type: "string", minLength: 8, example: "Test@1234" },
                    role: { type: "string", enum: ["USER", "ADMIN"], example: "USER" }
                }
            },
            LoginRequest: {
                type: "object",
                required: ["email", "password"],
                properties: {
                    email: { type: "string", format: "email", example: "john@example.com" },
                    password: { type: "string", example: "Test@1234" }
                }
            },
            ChangePasswordRequest: {
                type: "object",
                required: ["oldPassword", "newPassword"],
                properties: {
                    oldPassword: { type: "string", example: "Test@1234" },
                    newPassword: { type: "string", example: "NewTest@1234" }
                }
            },
            PaginatedUsers: {
                type: "object",
                properties: {
                    users: {
                        type: "array",
                        items: { "$ref": "#/components/schemas/User" }
                    },
                    pagination: {
                        type: "object",
                        properties: {
                            total: { type: "integer", example: 100 },
                            page: { type: "integer", example: 1 },
                            limit: { type: "integer", example: 20 },
                            totalPages: { type: "integer", example: 5 }
                        }
                    }
                }
            }
        }
    }
}

module.exports = swaggerSpec