const meteringDocs = require("./swagger.docs")

const swaggerSpec = {
    openapi: "3.0.0",
    info: {
        title: "Metering Service",
        version: "1.0.0",
        description: "Tracks and aggregates storage usage events — uploads, downloads, deletes, restores. Provides usage summaries for billing and analytics."
    },
    servers: [
        {
            url: "http://localhost:5003",
            description: "Metering Service (direct)"
        },
        {
            url: "http://localhost:5000",
            description: "Via API Gateway"
        }
    ],
    paths: meteringDocs,
    components: {
        securitySchemes: {
            bearerAuth: {
                type: "http",
                scheme: "bearer",
                bearerFormat: "JWT",
                description: "JWT issued by Auth Service. In production this is verified by the API Gateway which forwards X-User-ID, X-User-Role, X-User-Email headers."
            }
        },
        schemas: {
            HealthResponse: {
                type: "object",
                properties: {
                    status: {
                        type: "string",
                        enum: ["ok", "degraded"],
                        example: "ok"
                    },
                    postgres: {
                        type: "string",
                        enum: ["ok", "error"],
                        example: "ok"
                    },
                    redis: {
                        type: "string",
                        enum: ["ok", "error"],
                        example: "ok"
                    }
                }
            },
            UsageSummary: {
                type: "object",
                properties: {
                    user_id:          { type: "string",  example: "64b1f2c3d4e5f6a7b8c9d0e1" },
                    period_type:      { type: "string",  enum: ["daily", "monthly"], example: "monthly" },
                    period_start:     { type: "string",  format: "date", example: "2025-01-01" },
                    bytes_uploaded:   { type: "integer", example: 52428800 },
                    bytes_downloaded: { type: "integer", example: 104857600 },
                    api_calls:        { type: "integer", example: 240 },
                    file_count:       { type: "integer", example: 18 },
                    storage_used:     { type: "integer", example: 52428800 },
                    updated_at:       { type: "string",  format: "date-time", example: "2025-01-15T23:00:00.000Z" }
                }
            },
            UsageEvent: {
                type: "object",
                properties: {
                    id:         { type: "integer", example: 1 },
                    event_id:   { type: "string",  example: "evt_abc123def456" },
                    event_type: { type: "string",  enum: ["file.uploaded", "file.downloaded", "file.deleted", "file.restored"], example: "file.uploaded" },
                    file_id:    { type: "string",  example: "64b1f2c3d4e5f6a7b8c9d0e2" },
                    file_name:  { type: "string",  example: "report.pdf" },
                    bytes:      { type: "integer", example: 524288 },
                    mime_type:  { type: "string",  example: "application/pdf" },
                    created_at: { type: "string",  format: "date-time", example: "2025-01-15T10:30:00.000Z" }
                }
            },
            ApiResponse: {
                type: "object",
                properties: {
                    statusCode: { type: "integer", example: 200 },
                    success:    { type: "boolean", example: true },
                    message:    { type: "string",  example: "Success" },
                    data:       { type: "object" }
                }
            },
            ErrorResponse: {
                type: "object",
                properties: {
                    success:    { type: "boolean", example: false },
                    message:    { type: "string",  example: "Unauthorized — missing identity headers" },
                    errors:     { type: "array", items: { type: "string" }, example: [] }
                }
            }
        }
    }
}

module.exports = swaggerSpec