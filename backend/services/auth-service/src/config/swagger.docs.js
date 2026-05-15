const authDocs = {
    "/api/v1/auth/register": {
        post: {
            summary: "Register a new user",
            tags: ["Auth"],
            requestBody: {
                required: true,
                content: {
                    "application/json": {
                        schema: { "$ref": "#/components/schemas/RegisterRequest" }
                    }
                }
            },
            responses: {
                201: {
                    description: "User registered successfully",
                    content: {
                        "application/json": {
                            schema: { "$ref": "#/components/schemas/ApiResponse" }
                        }
                    }
                },
                400: { description: "Validation error" },
                409: { description: "User already exists" }
            }
        }
    },
    "/api/v1/auth/login": {
        post: {
            summary: "Login user",
            tags: ["Auth"],
            requestBody: {
                required: true,
                content: {
                    "application/json": {
                        schema: { "$ref": "#/components/schemas/LoginRequest" }
                    }
                }
            },
            responses: {
                200: {
                    description: "User logged in successfully",
                    content: {
                        "application/json": {
                            schema: { "$ref": "#/components/schemas/ApiResponse" }
                        }
                    }
                },
                400: { description: "Validation error" },
                401: { description: "Invalid credentials" },
                404: { description: "User not found" }
            }
        }
    },
    "/api/v1/auth/refresh-token": {
        post: {
            summary: "Refresh access token",
            tags: ["Auth"],
            responses: {
                200: { description: "Access token refreshed" },
                401: { description: "Invalid or expired refresh token" }
            }
        }
    },
    "/api/v1/auth/logout": {
        post: {
            summary: "Logout user",
            tags: ["Auth"],
            security: [{ cookieAuth: [] }],
            responses: {
                200: { description: "User logged out successfully" },
                401: { description: "Unauthorized" }
            }
        }
    },
    "/api/v1/auth/me": {
        get: {
            summary: "Get current logged in user",
            tags: ["Auth"],
            security: [{ cookieAuth: [] }, { bearerAuth: [] }],
            responses: {
                200: {
                    description: "Current user fetched successfully",
                    content: {
                        "application/json": {
                            schema: {
                                allOf: [
                                    { "$ref": "#/components/schemas/ApiResponse" },
                                    {
                                        properties: {
                                            data: { "$ref": "#/components/schemas/User" }
                                        }
                                    }
                                ]
                            }
                        }
                    }
                },
                401: { description: "Unauthorized" }
            }
        }
    },
    "/api/v1/auth/change-password": {
        patch: {
            summary: "Change user password",
            tags: ["Auth"],
            security: [{ cookieAuth: [] }],
            requestBody: {
                required: true,
                content: {
                    "application/json": {
                        schema: { "$ref": "#/components/schemas/ChangePasswordRequest" }
                    }
                }
            },
            responses: {
                200: { description: "Password changed successfully" },
                400: { description: "Validation error" },
                401: { description: "Old password is incorrect" }
            }
        }
    },
    "/api/v1/auth/all-users": {
        get: {
            summary: "Get all users with pagination",
            tags: ["Admin"],
            security: [{ cookieAuth: [] }],
            parameters: [
                {
                    in: "query",
                    name: "page",
                    schema: { type: "integer", default: 1 },
                    description: "Page number"
                },
                {
                    in: "query",
                    name: "limit",
                    schema: { type: "integer", default: 20 },
                    description: "Results per page"
                }
            ],
            responses: {
                200: {
                    description: "Users fetched successfully",
                    content: {
                        "application/json": {
                            schema: {
                                allOf: [
                                    { "$ref": "#/components/schemas/ApiResponse" },
                                    {
                                        properties: {
                                            data: { "$ref": "#/components/schemas/PaginatedUsers" }
                                        }
                                    }
                                ]
                            }
                        }
                    }
                },
                401: { description: "Unauthorized" },
                403: { description: "Forbidden — Admin only" }
            }
        }
    },
    "/api/v1/auth/change-role/{userId}": {
        patch: {
            summary: "Change user role",
            tags: ["Admin"],
            security: [{ cookieAuth: [] }],
            parameters: [
                {
                    in: "path",
                    name: "userId",
                    required: true,
                    schema: { type: "string" },
                    description: "MongoDB user ID"
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
                                role: {
                                    type: "string",
                                    enum: ["USER", "ADMIN"],
                                    example: "ADMIN"
                                }
                            }
                        }
                    }
                }
            },
            responses: {
                200: { description: "User role updated successfully" },
                400: { description: "Invalid role" },
                401: { description: "Unauthorized" },
                403: { description: "Forbidden — Admin only" },
                404: { description: "User not found" }
            }
        }
    }
}

module.exports = authDocs