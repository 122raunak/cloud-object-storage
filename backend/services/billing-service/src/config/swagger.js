const billingDocs = require("./swagger.docs")

const swaggerSpec = {
  openapi: "3.0.0",
  info: {
    title: "Billing Service",
    version: "1.0.0",
    description: "Generates invoices and calculates charges for storage usage. Pulls monthly usage from the Metering Service and applies per-tier pricing.",
  },
  servers: [
    {
      url: "http://localhost:5004",
      description: "Billing Service (direct)",
    },
    {
      url: "http://localhost:5000",
      description: "Via API Gateway",
    },
  ],
  paths: billingDocs,
  components: {
    securitySchemes: {
      bearerAuth: {
        type: "http",
        scheme: "bearer",
        bearerFormat: "JWT",
        description:
          "JWT issued by Auth Service. In production this is verified by the API Gateway which forwards X-User-ID, X-User-Role, X-User-Email headers.",
      },
    },
    schemas: {
      HealthResponse: {
        type: "object",
        properties: {
          status:   { type: "string", enum: ["ok", "degraded"], example: "ok" },
          postgres: { type: "string", enum: ["ok", "error"],    example: "ok" },
          redis:    { type: "string", enum: ["ok", "error"],    example: "ok" },
        },
      },
      PricingTier: {
        type: "object",
        properties: {
          id:               { type: "integer", example: 1 },
          name:             { type: "string",  example: "Free" },
          storage_price:    { type: "string",  example: "0.023000" },
          upload_price:     { type: "string",  example: "0.005000" },
          download_price:   { type: "string",  example: "0.090000" },
          api_call_price:   { type: "string",  example: "0.000400" },
          free_storage_gb:  { type: "integer", example: 5 },
          free_upload_gb:   { type: "integer", example: 1 },
          free_download_gb: { type: "integer", example: 1 },
          free_api_calls:   { type: "integer", example: 1000 },
          created_at:       { type: "string",  format: "date-time", example: "2025-01-01T00:00:00.000Z" },
        },
      },
      Invoice: {
        type: "object",
        properties: {
          id:               { type: "integer", example: 1 },
          user_id:          { type: "string",  example: "64b1f2c3d4e5f6a7b8c9d0e1" },
          period_start:     { type: "string",  format: "date",      example: "2025-01-01" },
          period_end:       { type: "string",  format: "date",      example: "2025-01-31" },
          bytes_uploaded:   { type: "integer", example: 52428800 },
          bytes_downloaded: { type: "integer", example: 104857600 },
          api_calls:        { type: "integer", example: 240 },
          storage_used:     { type: "integer", example: 52428800 },
          storage_charge:   { type: "string",  example: "0.5520" },
          upload_charge:    { type: "string",  example: "0.2450" },
          download_charge:  { type: "string",  example: "0.8640" },
          api_charge:       { type: "string",  example: "0.0000" },
          total_amount:     { type: "string",  example: "1.6610" },
          currency:         { type: "string",  example: "USD" },
          status:           { type: "string",  enum: ["draft", "issued", "paid", "void"], example: "issued" },
          issued_at:        { type: "string",  format: "date-time", nullable: true, example: "2025-02-01T00:30:00.000Z" },
          created_at:       { type: "string",  format: "date-time", example: "2025-02-01T00:30:00.000Z" },
          updated_at:       { type: "string",  format: "date-time", example: "2025-02-01T00:30:00.000Z" },
        },
      },
      AssignPlanBody: {
        type: "object",
        required: ["tierId"],
        properties: {
          tierId: { type: "integer", example: 2 },
        },
      },
      GenerateInvoiceBody: {
        type: "object",
        required: ["year", "month"],
        properties: {
          year:  { type: "integer", example: 2025, minimum: 2024 },
          month: { type: "integer", example: 1,    minimum: 1, maximum: 12 },
        },
      },
      ApiResponse: {
        type: "object",
        properties: {
          statusCode: { type: "integer", example: 200 },
          success:    { type: "boolean", example: true },
          message:    { type: "string",  example: "Success" },
          data:       { type: "object" },
        },
      },
      ErrorResponse: {
        type: "object",
        properties: {
          success: { type: "boolean", example: false },
          message: { type: "string",  example: "Unauthorized — missing identity headers" },
          errors:  { type: "array",   items: { type: "string" }, example: [] },
        },
      },
    },
  },
}

module.exports = swaggerSpec