const billingDocs = {
  "/health": {
    get: {
      summary: "Billing service health check",
      tags: ["Health"],
      responses: {
        200: {
          description: "Service is healthy",
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/HealthResponse" }
            }
          }
        },
        503: {
          description: "Service is degraded — PostgreSQL or Redis unavailable",
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/HealthResponse" }
            }
          }
        }
      }
    }
  },

  "/api/v1/billing/plans": {
    get: {
      summary: "List all pricing tiers",
      tags: ["Plans"],
      description: "Returns all available pricing tiers. Public endpoint — no authentication required.",
      responses: {
        200: {
          description: "Pricing tiers fetched successfully",
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/ApiResponse" },
              example: {
                statusCode: 200,
                success: true,
                message: "Pricing tiers retrieved",
                data: [
                  {
                    id: 1,
                    name: "Free",
                    storage_price: "0.023000",
                    upload_price: "0.005000",
                    download_price: "0.090000",
                    api_call_price: "0.000400",
                    free_storage_gb: 5,
                    free_upload_gb: 1,
                    free_download_gb: 1,
                    free_api_calls: 1000,
                    created_at: "2025-01-01T00:00:00.000Z"
                  }
                ]
              }
            }
          }
        }
      }
    }
  },

  "/api/v1/billing/plans/{userId}": {
    put: {
      summary: "Assign a pricing tier to a user",
      tags: ["Plans"],
      description: "Assigns or updates the pricing tier for a user. ADMIN role required.",
      security: [{ bearerAuth: [] }],
      parameters: [
        {
          in: "path",
          name: "userId",
          required: true,
          schema: { type: "string" },
          description: "The user ID to assign a plan to",
          example: "64b1f2c3d4e5f6a7b8c9d0e1"
        }
      ],
      requestBody: {
        required: true,
        content: {
          "application/json": {
            schema: { $ref: "#/components/schemas/AssignPlanBody" },
            example: { tierId: 2 }
          }
        }
      },
      responses: {
        200: {
          description: "Plan assigned successfully",
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/ApiResponse" },
              example: {
                statusCode: 200,
                success: true,
                message: "Plan assigned successfully",
                data: {
                  id: 1,
                  user_id: "64b1f2c3d4e5f6a7b8c9d0e1",
                  tier_id: 2,
                  started_at: "2025-01-01T00:00:00.000Z",
                  updated_at: "2025-06-01T00:00:00.000Z"
                }
              }
            }
          }
        },
        400: { description: "Invalid request body", content: { "application/json": { schema: { $ref: "#/components/schemas/ErrorResponse" } } } },
        401: { description: "Unauthorized — missing identity headers", content: { "application/json": { schema: { $ref: "#/components/schemas/ErrorResponse" } } } },
        403: { description: "Forbidden — admin access required", content: { "application/json": { schema: { $ref: "#/components/schemas/ErrorResponse" } } } },
        404: { description: "Pricing tier not found", content: { "application/json": { schema: { $ref: "#/components/schemas/ErrorResponse" } } } }
      }
    }
  },

  "/api/v1/billing/invoices/{userId}": {
    get: {
      summary: "List invoices for a user",
      tags: ["Invoices"],
      description: "Returns paginated invoices for a user with optional status filter. Users can only access their own invoices. ADMIN and service roles can access any user.",
      security: [{ bearerAuth: [] }],
      parameters: [
        {
          in: "path",
          name: "userId",
          required: true,
          schema: { type: "string" },
          description: "The user ID to fetch invoices for",
          example: "64b1f2c3d4e5f6a7b8c9d0e1"
        },
        {
          in: "query",
          name: "status",
          required: false,
          schema: { type: "string", enum: ["draft", "issued", "paid", "void"] },
          description: "Filter invoices by status"
        },
        {
          in: "query",
          name: "limit",
          required: false,
          schema: { type: "integer", default: 12, minimum: 1, maximum: 100 },
          description: "Number of invoices to return"
        },
        {
          in: "query",
          name: "offset",
          required: false,
          schema: { type: "integer", default: 0, minimum: 0 },
          description: "Number of invoices to skip"
        }
      ],
      responses: {
        200: {
          description: "Invoices fetched successfully",
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/ApiResponse" },
              example: {
                statusCode: 200,
                success: true,
                message: "Invoices retrieved",
                data: {
                  invoices: [
                    {
                      id: 1,
                      user_id: "64b1f2c3d4e5f6a7b8c9d0e1",
                      period_start: "2025-01-01",
                      period_end: "2025-01-31",
                      bytes_uploaded: 52428800,
                      bytes_downloaded: 104857600,
                      api_calls: 240,
                      storage_used: 52428800,
                      storage_charge: "0.5520",
                      upload_charge: "0.2450",
                      download_charge: "0.8640",
                      api_charge: "0.0000",
                      total_amount: "1.6610",
                      currency: "USD",
                      status: "issued",
                      issued_at: "2025-02-01T00:30:00.000Z",
                      created_at: "2025-02-01T00:30:00.000Z"
                    }
                  ],
                  total: 6,
                  limit: 12,
                  offset: 0
                }
              }
            }
          }
        },
        401: { description: "Unauthorized — missing identity headers", content: { "application/json": { schema: { $ref: "#/components/schemas/ErrorResponse" } } } },
        403: { description: "Forbidden — cannot access another user's invoices", content: { "application/json": { schema: { $ref: "#/components/schemas/ErrorResponse" } } } }
      }
    }
  },

  "/api/v1/billing/invoices/{userId}/{invoiceId}": {
    get: {
      summary: "Get a single invoice",
      tags: ["Invoices"],
      description: "Returns full detail for a single invoice. Users can only access their own invoices. ADMIN and service roles can access any.",
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
          in: "path",
          name: "invoiceId",
          required: true,
          schema: { type: "integer" },
          description: "The invoice ID",
          example: 1
        }
      ],
      responses: {
        200: {
          description: "Invoice fetched successfully",
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/ApiResponse" },
              example: {
                statusCode: 200,
                success: true,
                message: "Invoice retrieved",
                data: {
                  id: 1,
                  user_id: "64b1f2c3d4e5f6a7b8c9d0e1",
                  period_start: "2025-01-01",
                  period_end: "2025-01-31",
                  bytes_uploaded: 52428800,
                  bytes_downloaded: 104857600,
                  api_calls: 240,
                  storage_used: 52428800,
                  storage_charge: "0.5520",
                  upload_charge: "0.2450",
                  download_charge: "0.8640",
                  api_charge: "0.0000",
                  total_amount: "1.6610",
                  currency: "USD",
                  status: "issued",
                  issued_at: "2025-02-01T00:30:00.000Z",
                  created_at: "2025-02-01T00:30:00.000Z",
                  updated_at: "2025-02-01T00:30:00.000Z"
                }
              }
            }
          }
        },
        401: { description: "Unauthorized", content: { "application/json": { schema: { $ref: "#/components/schemas/ErrorResponse" } } } },
        403: { description: "Forbidden", content: { "application/json": { schema: { $ref: "#/components/schemas/ErrorResponse" } } } },
        404: { description: "Invoice not found", content: { "application/json": { schema: { $ref: "#/components/schemas/ErrorResponse" } } } }
      }
    }
  },

  "/api/v1/billing/current/{userId}": {
    get: {
      summary: "Get current month estimated charge",
      tags: ["Invoices"],
      description: "Calculates a live estimate of the current month's charges based on usage data from the metering service. Not a persisted invoice.",
      security: [{ bearerAuth: [] }],
      parameters: [
        {
          in: "path",
          name: "userId",
          required: true,
          schema: { type: "string" },
          example: "64b1f2c3d4e5f6a7b8c9d0e1"
        }
      ],
      responses: {
        200: {
          description: "Current estimate calculated successfully",
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/ApiResponse" },
              example: {
                statusCode: 200,
                success: true,
                message: "Current month estimate retrieved",
                data: {
                  period: "2025-06",
                  usage: {
                    storage_used: 52428800,
                    bytes_uploaded: 10485760,
                    bytes_downloaded: 20971520,
                    api_calls: 180
                  },
                  tier: { id: 1, name: "Free" },
                  charges: {
                    storage_charge: 0,
                    upload_charge: 0,
                    download_charge: 0,
                    api_charge: 0,
                    total_amount: 0
                  },
                  currency: "USD",
                  note: "This is an estimate based on current month usage and may change."
                }
              }
            }
          }
        },
        401: { description: "Unauthorized", content: { "application/json": { schema: { $ref: "#/components/schemas/ErrorResponse" } } } },
        403: { description: "Forbidden", content: { "application/json": { schema: { $ref: "#/components/schemas/ErrorResponse" } } } },
        502: { description: "Metering service unavailable", content: { "application/json": { schema: { $ref: "#/components/schemas/ErrorResponse" } } } }
      }
    }
  },

  "/api/v1/billing/generate/{userId}": {
    post: {
      summary: "Manually trigger invoice generation",
      tags: ["Invoices"],
      description: "Generates an invoice for the specified user and billing period. Idempotent — returns the existing invoice if one already exists for that period. ADMIN role required.",
      security: [{ bearerAuth: [] }],
      parameters: [
        {
          in: "path",
          name: "userId",
          required: true,
          schema: { type: "string" },
          example: "64b1f2c3d4e5f6a7b8c9d0e1"
        }
      ],
      requestBody: {
        required: true,
        content: {
          "application/json": {
            schema: { $ref: "#/components/schemas/GenerateInvoiceBody" },
            example: { year: 2025, month: 1 }
          }
        }
      },
      responses: {
        201: {
          description: "Invoice generated successfully",
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/ApiResponse" },
              example: {
                statusCode: 201,
                success: true,
                message: "Invoice generated successfully",
                data: {
                  id: 7,
                  user_id: "64b1f2c3d4e5f6a7b8c9d0e1",
                  period_start: "2025-01-01",
                  period_end: "2025-01-31",
                  total_amount: "1.6610",
                  currency: "USD",
                  status: "issued",
                  issued_at: "2025-02-01T00:30:00.000Z"
                }
              }
            }
          }
        },
        200: { description: "Invoice already existed — returned existing record", content: { "application/json": { schema: { $ref: "#/components/schemas/ApiResponse" } } } },
        400: { description: "Invalid request body", content: { "application/json": { schema: { $ref: "#/components/schemas/ErrorResponse" } } } },
        401: { description: "Unauthorized", content: { "application/json": { schema: { $ref: "#/components/schemas/ErrorResponse" } } } },
        403: { description: "Forbidden — admin access required", content: { "application/json": { schema: { $ref: "#/components/schemas/ErrorResponse" } } } },
        502: { description: "Metering service unavailable", content: { "application/json": { schema: { $ref: "#/components/schemas/ErrorResponse" } } } }
      }
    }
  }
}

module.exports = billingDocs