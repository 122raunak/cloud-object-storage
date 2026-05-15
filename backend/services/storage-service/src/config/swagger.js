const storageDocs = require("./swagger.docs")

const swaggerSpec = {
  openapi: "3.0.0",
  info: {
    title: "Storage Service API",
    version: "1.0.0",
    description: "Storage microservice for Cloud Object Storage System — handles file upload, download, metadata, versioning, and soft delete"
  },
  servers: [
    {
      url: "http://localhost:5002",
      description: "Direct access"
    },
    {
      url: "http://localhost:5000",
      description: "Via API Gateway"
    }
  ],
  paths: storageDocs,
  components: {
    securitySchemes: {
      bearerAuth: {
        type: "http",
        scheme: "bearer",
        bearerFormat: "JWT"
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
      UploadUrlRequest: {
        type: "object",
        required: ["fileName", "contentType", "size"],
        properties: {
          fileName: { type: "string", maxLength: 255, example: "report.pdf" },
          contentType: { type: "string", example: "application/pdf" },
          size: { type: "number", example: 204800 }
        }
      },
      UploadUrlResponse: {
        type: "object",
        properties: {
          uploadUrl: { type: "string", example: "http://minio:9000/bucket/userId/uuid-report.pdf?X-Amz-Signature=..." },
          objectKey: { type: "string", example: "userId/uuid-report.pdf" }
        }
      },
      ConfirmUploadRequest: {
        type: "object",
        required: ["objectKey", "fileName", "contentType", "size"],
        properties: {
          objectKey: { type: "string", example: "userId/uuid-report.pdf" },
          fileName: { type: "string", example: "report.pdf" },
          contentType: { type: "string", example: "application/pdf" },
          size: { type: "number", example: 204800 }
        }
      },
      ConfirmUploadResponse: {
        type: "object",
        properties: {
          fileId: { type: "string", example: "64f1b2c3d4e5f6a7b8c9d0e1" }
        }
      },
      DownloadUrlResponse: {
        type: "object",
        properties: {
          downloadUrl: { type: "string", example: "http://minio:9000/bucket/userId/uuid-report.pdf?X-Amz-Signature=..." }
        }
      },
      File: {
        type: "object",
        properties: {
          _id: { type: "string", example: "64f1b2c3d4e5f6a7b8c9d0e1" },
          userId: { type: "string", example: "64f1b2c3d4e5f6a7b8c9d0e2" },
          fileName: { type: "string", example: "report.pdf" },
          objectKey: { type: "string", example: "userId/uuid-report.pdf" },
          size: { type: "number", example: 204800 },
          mimeType: { type: "string", example: "application/pdf" },
          bucket: { type: "string", example: "cloud-storage" },
          isDeleted: { type: "boolean", example: false },
          deletedAt: { type: "string", format: "date-time", nullable: true },
          version: { type: "integer", example: 1 },
          downloadCount: { type: "integer", example: 3 },
          createdAt: { type: "string", format: "date-time" },
          updatedAt: { type: "string", format: "date-time" }
        }
      },
      PaginatedFiles: {
        type: "object",
        properties: {
          data: {
            type: "array",
            items: { $ref: "#/components/schemas/File" }
          },
          pagination: {
            type: "object",
            properties: {
              total: { type: "integer", example: 50 },
              page: { type: "integer", example: 1 },
              pages: { type: "integer", example: 5 }
            }
          }
        }
      }
    }
  }
}

module.exports = swaggerSpec