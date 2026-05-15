const notificationDocs = {

    "/api/v1/notifications/{userId}": {
        get: {
            summary: "List notifications for a user",
            description: "Returns paginated notification history. Admins can query any user. Regular users can only query their own.",
            tags: ["Notifications"],
            security: [{ gatewayAuth: [] }],
            parameters: [
                {
                    in: "path",
                    name: "userId",
                    required: true,
                    schema: { type: "string" },
                    description: "User ID"
                },
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
                    description: "Results per page (max 100)"
                },
                {
                    in: "query",
                    name: "type",
                    schema: {
                        type: "string",
                        enum: ["invoice_generated", "budget_alert", "storage_warning", "login_alert", "daily_digest", "weekly_report"]
                    },
                    description: "Filter by notification type"
                },
                {
                    in: "query",
                    name: "status",
                    schema: {
                        type: "string",
                        enum: ["pending", "sent", "failed"]
                    },
                    description: "Filter by delivery status"
                }
            ],
            responses: {
                200: {
                    description: "Notifications retrieved successfully",
                    content: {
                        "application/json": {
                            schema: {
                                allOf: [
                                    { "$ref": "#/components/schemas/ApiResponse" },
                                    {
                                        properties: {
                                            data: { "$ref": "#/components/schemas/PaginatedNotifications" }
                                        }
                                    }
                                ]
                            }
                        }
                    }
                },
                401: { description: "Unauthorized — missing gateway headers" },
                403: { description: "Forbidden — cannot access another user's notifications" }
            }
        }
    },

    "/api/v1/notifications/{userId}/unread-count": {
        get: {
            summary: "Get pending notification count for a user",
            tags: ["Notifications"],
            security: [{ gatewayAuth: [] }],
            parameters: [
                {
                    in: "path",
                    name: "userId",
                    required: true,
                    schema: { type: "string" },
                    description: "User ID"
                }
            ],
            responses: {
                200: {
                    description: "Unread count retrieved successfully",
                    content: {
                        "application/json": {
                            schema: {
                                allOf: [
                                    { "$ref": "#/components/schemas/ApiResponse" },
                                    {
                                        properties: {
                                            data: {
                                                type: "object",
                                                properties: {
                                                    count: { type: "integer", example: 3 }
                                                }
                                            }
                                        }
                                    }
                                ]
                            }
                        }
                    }
                },
                401: { description: "Unauthorized" },
                403: { description: "Forbidden" }
            }
        }
    },

    "/api/v1/notifications/{userId}/preferences": {
        get: {
            summary: "Get notification preferences for a user",
            tags: ["Preferences"],
            security: [{ gatewayAuth: [] }],
            parameters: [
                {
                    in: "path",
                    name: "userId",
                    required: true,
                    schema: { type: "string" },
                    description: "User ID"
                }
            ],
            responses: {
                200: {
                    description: "Preferences retrieved successfully",
                    content: {
                        "application/json": {
                            schema: {
                                allOf: [
                                    { "$ref": "#/components/schemas/ApiResponse" },
                                    {
                                        properties: {
                                            data: { "$ref": "#/components/schemas/NotificationPreferences" }
                                        }
                                    }
                                ]
                            }
                        }
                    }
                },
                401: { description: "Unauthorized" },
                403: { description: "Forbidden" }
            }
        },
        put: {
            summary: "Update notification preferences for a user",
            tags: ["Preferences"],
            security: [{ gatewayAuth: [] }],
            parameters: [
                {
                    in: "path",
                    name: "userId",
                    required: true,
                    schema: { type: "string" },
                    description: "User ID"
                }
            ],
            requestBody: {
                required: true,
                content: {
                    "application/json": {
                        schema: { "$ref": "#/components/schemas/UpdatePreferencesRequest" }
                    }
                }
            },
            responses: {
                200: {
                    description: "Preferences updated successfully",
                    content: {
                        "application/json": {
                            schema: {
                                allOf: [
                                    { "$ref": "#/components/schemas/ApiResponse" },
                                    {
                                        properties: {
                                            data: { "$ref": "#/components/schemas/NotificationPreferences" }
                                        }
                                    }
                                ]
                            }
                        }
                    }
                },
                400: { description: "Validation error" },
                401: { description: "Unauthorized" },
                403: { description: "Forbidden" }
            }
        }
    },

    "/api/v1/notifications/login-alert": {
        post: {
            summary: "Trigger a login alert email",
            description: "Called internally by Auth Service after a successful login. Sends a security notification email to the user.",
            tags: ["Internal"],
            security: [{ gatewayAuth: [] }],
            requestBody: {
                required: true,
                content: {
                    "application/json": {
                        schema: { "$ref": "#/components/schemas/LoginAlertRequest" }
                    }
                }
            },
            responses: {
                200: {
                    description: "Login alert processed",
                    content: {
                        "application/json": {
                            schema: {
                                allOf: [
                                    { "$ref": "#/components/schemas/ApiResponse" },
                                    {
                                        properties: {
                                            data: {
                                                type: "object",
                                                properties: {
                                                    notificationId: {
                                                        type: "string",
                                                        example: "64f1b2c3d4e5f6a7b8c9d0e1"
                                                    }
                                                }
                                            }
                                        }
                                    }
                                ]
                            }
                        }
                    }
                },
                400: { description: "Validation error" },
                401: { description: "Unauthorized" }
            }
        }
    }
}

module.exports = notificationDocs