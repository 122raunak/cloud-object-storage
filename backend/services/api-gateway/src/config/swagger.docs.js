const gatewayDocs = {
    "/health": {
        get: {
            summary: "Gateway and services health check",
            tags: ["Gateway"],
            responses: {
                200: {
                    description: "Gateway is running",
                    content: {
                        "application/json": {
                            schema: { "$ref": "#/components/schemas/HealthResponse" }
                        }
                    }
                }
            }
        }
    },
    "/api/auth/register": {
        post: {
            summary: "Register a new user",
            tags: ["Auth"],
            description: "Proxied to Auth Service — no authentication required",
            requestBody: {
                required: true,
                content: {
                    "application/json": {
                        schema: {
                            type: "object",
                            required: ["username", "email", "password"],
                            properties: {
                                username: { type: "string", example: "johndoe" },
                                email: { type: "string", example: "john@example.com" },
                                password: { type: "string", example: "Test@1234" },
                                role: { type: "string", enum: ["USER", "ADMIN"], example: "USER" }
                            }
                        }
                    }
                }
            },
            responses: {
                201: { description: "User registered successfully" },
                400: { description: "Validation error" },
                409: { description: "User already exists" }
            }
        }
    },
    "/api/auth/login": {
        post: {
            summary: "Login user",
            tags: ["Auth"],
            description: "Proxied to Auth Service — no authentication required",
            requestBody: {
                required: true,
                content: {
                    "application/json": {
                        schema: {
                            type: "object",
                            required: ["email", "password"],
                            properties: {
                                email: { type: "string", example: "john@example.com" },
                                password: { type: "string", example: "Test@1234" }
                            }
                        }
                    }
                }
            },
            responses: {
                200: { description: "User logged in successfully" },
                401: { description: "Invalid credentials" },
                404: { description: "User not found" }
            }
        }
    },
    "/api/auth/refresh-token": {
        post: {
            summary: "Refresh access token",
            tags: ["Auth"],
            description: "Proxied to Auth Service — no authentication required",
            responses: {
                200: { description: "Access token refreshed" },
                401: { description: "Invalid or expired refresh token" }
            }
        }
    },
    "/api/auth/logout": {
        post: {
            summary: "Logout user",
            tags: ["Auth"],
            description: "Proxied to Auth Service — requires authentication",
            security: [{ cookieAuth: [] }, { bearerAuth: [] }],
            responses: {
                200: { description: "User logged out successfully" },
                401: { description: "Unauthorized" }
            }
        }
    },
    "/api/auth/me": {
        get: {
            summary: "Get current logged in user",
            tags: ["Auth"],
            description: "Proxied to Auth Service — requires authentication",
            security: [{ cookieAuth: [] }, { bearerAuth: [] }],
            responses: {
                200: { description: "Current user fetched successfully" },
                401: { description: "Unauthorized" },
                503: { description: "Auth service unavailable" }
            }
        }
    },
    "/api/auth/change-password": {
        patch: {
            summary: "Change user password",
            tags: ["Auth"],
            description: "Proxied to Auth Service — requires authentication",
            security: [{ cookieAuth: [] }, { bearerAuth: [] }],
            requestBody: {
                required: true,
                content: {
                    "application/json": {
                        schema: {
                            type: "object",
                            required: ["oldPassword", "newPassword"],
                            properties: {
                                oldPassword: { type: "string", example: "Test@1234" },
                                newPassword: { type: "string", example: "NewTest@1234" }
                            }
                        }
                    }
                }
            },
            responses: {
                200: { description: "Password changed successfully" },
                401: { description: "Unauthorized or wrong password" }
            }
        }
    },
    "/api/auth/all-users": {
        get: {
            summary: "Get all users — Admin only",
            tags: ["Admin"],
            description: "Proxied to Auth Service — requires ADMIN role",
            security: [{ cookieAuth: [] }, { bearerAuth: [] }],
            parameters: [
                {
                    in: "query",
                    name: "page",
                    schema: { type: "integer", default: 1 }
                },
                {
                    in: "query",
                    name: "limit",
                    schema: { type: "integer", default: 20 }
                }
            ],
            responses: {
                200: { description: "Users fetched successfully" },
                401: { description: "Unauthorized" },
                403: { description: "Forbidden — Admin only" }
            }
        }
    },
    "/api/auth/change-role/{userId}": {
        patch: {
            summary: "Change user role — Admin only",
            tags: ["Admin"],
            description: "Proxied to Auth Service — requires ADMIN role",
            security: [{ cookieAuth: [] }, { bearerAuth: [] }],
            parameters: [
                {
                    in: "path",
                    name: "userId",
                    required: true,
                    schema: { type: "string" }
                }
            ],
            requestBody: {
                required: true,
                content: {
                    "application/json": {
                        schema: {
                            type: "object",
                            required: ["role"],
                            properties: {
                                role: { type: "string", enum: ["USER", "ADMIN"] }
                            }
                        }
                    }
                }
            },
            responses: {
                200: { description: "User role updated successfully" },
                401: { description: "Unauthorized" },
                403: { description: "Forbidden — Admin only" },
                404: { description: "User not found" }
            }
        }
    },
    "/api/storage": {
        get: {
            summary: "Storage Service routes",
            tags: ["Storage"],
            description: "All /api/storage/* routes proxied to Storage Service — requires authentication",
            security: [{ cookieAuth: [] }, { bearerAuth: [] }],
            responses: {
                200: { description: "Proxied to Storage Service" },
                401: { description: "Unauthorized" },
                503: { description: "Storage service unavailable" }
            }
        }
    },
    "/api/billing": {
        get: {
            summary: "Billing Service routes",
            tags: ["Billing"],
            description: "All /api/billing/* routes proxied to Billing Service — requires authentication",
            security: [{ cookieAuth: [] }, { bearerAuth: [] }],
            responses: {
                200: { description: "Proxied to Billing Service" },
                401: { description: "Unauthorized" },
                503: { description: "Billing service unavailable" }
            }
        }
    }
}

module.exports = gatewayDocs