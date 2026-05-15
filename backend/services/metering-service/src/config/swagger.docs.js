const meteringDocs = {
    "/health": {
        get: {
            summary: "Metering service health check",
            tags: ["Health"],
            responses: {
                200: {
                    description: "Service is healthy",
                    content: {
                        "application/json": {
                            schema: { "$ref": "#/components/schemas/HealthResponse" }
                        }
                    }
                },
                503: {
                    description: "Service is degraded — PostgreSQL or Redis unavailable",
                    content: {
                        "application/json": {
                            schema: { "$ref": "#/components/schemas/HealthResponse" }
                        }
                    }
                }
            }
        }
    },

    "/api/v1/metering/usage/{userId}": {
        get: {
            summary: "Get current usage summary",
            tags: ["Usage"],
            description: "Returns today's daily summary and the current month's monthly summary for a user. Users can only access their own data. ADMIN and service roles can access any user.",
            security: [{ bearerAuth: [] }],
            parameters: [
                {
                    in: "path",
                    name: "userId",
                    required: true,
                    schema: { type: "string" },
                    description: "The user ID to fetch usage for",
                    example: "64b1f2c3d4e5f6a7b8c9d0e1"
                }
            ],
            responses: {
                200: {
                    description: "Usage summary fetched successfully",
                    content: {
                        "application/json": {
                            schema: { "$ref": "#/components/schemas/ApiResponse" },
                            example: {
                                statusCode: 200,
                                success: true,
                                message: "Usage summary fetched",
                                data: {
                                    daily: {
                                        user_id: "64b1f2c3d4e5f6a7b8c9d0e1",
                                        period_type: "daily",
                                        period_start: "2025-01-15",
                                        bytes_uploaded: 5242880,
                                        bytes_downloaded: 10485760,
                                        api_calls: 24,
                                        file_count: 3,
                                        storage_used: 5242880
                                    },
                                    monthly: {
                                        user_id: "64b1f2c3d4e5f6a7b8c9d0e1",
                                        period_type: "monthly",
                                        period_start: "2025-01-01",
                                        bytes_uploaded: 52428800,
                                        bytes_downloaded: 104857600,
                                        api_calls: 240,
                                        file_count: 18,
                                        storage_used: 52428800
                                    }
                                }
                            }
                        }
                    }
                },
                401: { description: "Unauthorized — missing identity headers", content: { "application/json": { schema: { "$ref": "#/components/schemas/ErrorResponse" } } } },
                403: { description: "Forbidden — cannot access another user's data", content: { "application/json": { schema: { "$ref": "#/components/schemas/ErrorResponse" } } } },
                429: { description: "Too many requests", content: { "application/json": { schema: { "$ref": "#/components/schemas/ErrorResponse" } } } }
            }
        }
    },

    "/api/v1/metering/usage/{userId}/daily": {
        get: {
            summary: "Get daily usage breakdown",
            tags: ["Usage"],
            description: "Returns aggregated daily usage rows for the last N days. Maximum 365 days.",
            security: [{ bearerAuth: [] }],
            parameters: [
                {
                    in: "path",
                    name: "userId",
                    required: true,
                    schema: { type: "string" },
                    example: "64b1f2c3d4e5f6a7b8c9d0e1"
                },
                {
                    in: "query",
                    name: "days",
                    required: false,
                    schema: { type: "integer", default: 30, minimum: 1, maximum: 365 },
                    description: "Number of past days to return",
                    example: 30
                }
            ],
            responses: {
                200: {
                    description: "Daily breakdown fetched successfully",
                    content: {
                        "application/json": {
                            schema: { "$ref": "#/components/schemas/ApiResponse" },
                            example: {
                                statusCode: 200,
                                success: true,
                                message: "Daily breakdown fetched",
                                data: [
                                    {
                                        period_start: "2025-01-15",
                                        bytes_uploaded: 5242880,
                                        bytes_downloaded: 10485760,
                                        api_calls: 24,
                                        file_count: 3,
                                        storage_used: 5242880,
                                        updated_at: "2025-01-15T23:00:00.000Z"
                                    }
                                ]
                            }
                        }
                    }
                },
                400: { description: "Invalid days parameter", content: { "application/json": { schema: { "$ref": "#/components/schemas/ErrorResponse" } } } },
                401: { description: "Unauthorized", content: { "application/json": { schema: { "$ref": "#/components/schemas/ErrorResponse" } } } },
                403: { description: "Forbidden", content: { "application/json": { schema: { "$ref": "#/components/schemas/ErrorResponse" } } } }
            }
        }
    },

    "/api/v1/metering/usage/{userId}/monthly": {
        get: {
            summary: "Get monthly usage breakdown",
            tags: ["Usage"],
            description: "Returns aggregated monthly usage rows for the last N months. Maximum 60 months.",
            security: [{ bearerAuth: [] }],
            parameters: [
                {
                    in: "path",
                    name: "userId",
                    required: true,
                    schema: { type: "string" },
                    example: "64b1f2c3d4e5f6a7b8c9d0e1"
                },
                {
                    in: "query",
                    name: "months",
                    required: false,
                    schema: { type: "integer", default: 12, minimum: 1, maximum: 60 },
                    description: "Number of past months to return",
                    example: 12
                }
            ],
            responses: {
                200: {
                    description: "Monthly breakdown fetched successfully",
                    content: {
                        "application/json": {
                            schema: { "$ref": "#/components/schemas/ApiResponse" },
                            example: {
                                statusCode: 200,
                                success: true,
                                message: "Monthly breakdown fetched",
                                data: [
                                    {
                                        period_start: "2025-01-01",
                                        bytes_uploaded: 52428800,
                                        bytes_downloaded: 104857600,
                                        api_calls: 240,
                                        file_count: 18,
                                        storage_used: 52428800,
                                        updated_at: "2025-01-15T23:00:00.000Z"
                                    }
                                ]
                            }
                        }
                    }
                },
                400: { description: "Invalid months parameter", content: { "application/json": { schema: { "$ref": "#/components/schemas/ErrorResponse" } } } },
                401: { description: "Unauthorized", content: { "application/json": { schema: { "$ref": "#/components/schemas/ErrorResponse" } } } },
                403: { description: "Forbidden", content: { "application/json": { schema: { "$ref": "#/components/schemas/ErrorResponse" } } } }
            }
        }
    },

    "/api/v1/metering/events/{userId}": {
        get: {
            summary: "Get raw event log",
            tags: ["Events"],
            description: "Returns the raw usage event log for a user with pagination and optional event type filter.",
            security: [{ bearerAuth: [] }],
            parameters: [
                {
                    in: "path",
                    name: "userId",
                    required: true,
                    schema: { type: "string" },
                    example: "64b1f2c3d4e5f6a7b8c9d0e1"
                },
                {
                    in: "query",
                    name: "limit",
                    required: false,
                    schema: { type: "integer", default: 50, minimum: 1, maximum: 200 },
                    description: "Number of events to return"
                },
                {
                    in: "query",
                    name: "offset",
                    required: false,
                    schema: { type: "integer", default: 0, minimum: 0 },
                    description: "Number of events to skip"
                },
                {
                    in: "query",
                    name: "eventType",
                    required: false,
                    schema: {
                        type: "string",
                        enum: ["file.uploaded", "file.downloaded", "file.deleted", "file.restored"]
                    },
                    description: "Filter by event type"
                }
            ],
            responses: {
                200: {
                    description: "Event log fetched successfully",
                    content: {
                        "application/json": {
                            schema: { "$ref": "#/components/schemas/ApiResponse" },
                            example: {
                                statusCode: 200,
                                success: true,
                                message: "Event log fetched",
                                data: {
                                    data: [
                                        {
                                            id: 1,
                                            event_id: "evt_abc123",
                                            event_type: "file.uploaded",
                                            file_id: "64b1f2c3d4e5f6a7b8c9d0e2",
                                            file_name: "report.pdf",
                                            bytes: 524288,
                                            mime_type: "application/pdf",
                                            created_at: "2025-01-15T10:30:00.000Z"
                                        }
                                    ],
                                    total: 142,
                                    limit: 50,
                                    offset: 0
                                }
                            }
                        }
                    }
                },
                400: { description: "Invalid eventType parameter", content: { "application/json": { schema: { "$ref": "#/components/schemas/ErrorResponse" } } } },
                401: { description: "Unauthorized", content: { "application/json": { schema: { "$ref": "#/components/schemas/ErrorResponse" } } } },
                403: { description: "Forbidden", content: { "application/json": { schema: { "$ref": "#/components/schemas/ErrorResponse" } } } }
            }
        }
    }
}

module.exports = meteringDocs