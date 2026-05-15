const storageDocs = {

  "/api/v1/storage/upload-url": {
    post: {
      summary: "Generate a pre-signed upload URL",
      tags: ["Storage"],
      security: [{ bearerAuth: [] }],
      requestBody: {
        required: true,
        content: {
          "application/json": {
            schema: { $ref: "#/components/schemas/UploadUrlRequest" }
          }
        }
      },
      responses: {
        200: {
          description: "Upload URL generated successfully",
          content: {
            "application/json": {
              schema: {
                allOf: [
                  { $ref: "#/components/schemas/ApiResponse" },
                  {
                    properties: {
                      data: { $ref: "#/components/schemas/UploadUrlResponse" }
                    }
                  }
                ]
              }
            }
          }
        },
        400: { description: "Invalid file type, extension, or size" },
        401: { description: "Unauthorized" },
        429: { description: "Too many upload requests" }
      }
    }
  },

  "/api/v1/storage/confirm-upload": {
    post: {
      summary: "Confirm upload and save file metadata",
      description: "Call this after the client has successfully uploaded the file directly to MinIO using the pre-signed URL",
      tags: ["Storage"],
      security: [{ bearerAuth: [] }],
      requestBody: {
        required: true,
        content: {
          "application/json": {
            schema: { $ref: "#/components/schemas/ConfirmUploadRequest" }
          }
        }
      },
      responses: {
        200: {
          description: "Upload confirmed and metadata saved",
          content: {
            "application/json": {
              schema: {
                allOf: [
                  { $ref: "#/components/schemas/ApiResponse" },
                  {
                    properties: {
                      data: { $ref: "#/components/schemas/ConfirmUploadResponse" }
                    }
                  }
                ]
              }
            }
          }
        },
        400: { description: "File not found in storage or size mismatch" },
        401: { description: "Unauthorized" }
      }
    }
  },

  "/api/v1/storage/download-url/{fileId}": {
    get: {
      summary: "Generate a pre-signed download URL",
      tags: ["Storage"],
      security: [{ bearerAuth: [] }],
      parameters: [
        {
          in: "path",
          name: "fileId",
          required: true,
          schema: { type: "string" },
          description: "MongoDB file ID"
        }
      ],
      responses: {
        200: {
          description: "Download URL generated successfully",
          content: {
            "application/json": {
              schema: {
                allOf: [
                  { $ref: "#/components/schemas/ApiResponse" },
                  {
                    properties: {
                      data: { $ref: "#/components/schemas/DownloadUrlResponse" }
                    }
                  }
                ]
              }
            }
          }
        },
        400: { description: "File is deleted" },
        401: { description: "Unauthorized" },
        403: { description: "Forbidden — file belongs to another user" },
        404: { description: "File not found" }
      }
    }
  },

  "/api/v1/storage/files": {
    get: {
      summary: "List files for the authenticated user",
      tags: ["Storage"],
      security: [{ bearerAuth: [] }],
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
          schema: { type: "integer", default: 10 },
          description: "Results per page"
        },
        {
          in: "query",
          name: "search",
          schema: { type: "string" },
          description: "Search by file name"
        },
        {
          in: "query",
          name: "mimeType",
          schema: { type: "string" },
          description: "Filter by MIME type e.g. image/png"
        },
        {
          in: "query",
          name: "sortBy",
          schema: { type: "string", enum: ["createdAt", "size"], default: "createdAt" },
          description: "Sort field"
        },
        {
          in: "query",
          name: "order",
          schema: { type: "string", enum: ["asc", "desc"], default: "desc" },
          description: "Sort order"
        }
      ],
      responses: {
        200: {
          description: "Files fetched successfully",
          content: {
            "application/json": {
              schema: {
                allOf: [
                  { $ref: "#/components/schemas/ApiResponse" },
                  {
                    properties: {
                      data: { $ref: "#/components/schemas/PaginatedFiles" }
                    }
                  }
                ]
              }
            }
          }
        },
        400: { description: "Invalid pagination values" },
        401: { description: "Unauthorized" }
      }
    }
  },

  "/api/v1/storage/{fileId}": {
    delete: {
      summary: "Soft delete a file (move to trash)",
      tags: ["Storage"],
      security: [{ bearerAuth: [] }],
      parameters: [
        {
          in: "path",
          name: "fileId",
          required: true,
          schema: { type: "string" },
          description: "MongoDB file ID"
        }
      ],
      responses: {
        200: { description: "File moved to trash" },
        401: { description: "Unauthorized" },
        403: { description: "Forbidden — file belongs to another user" },
        404: { description: "File not found" }
      }
    }
  },

  "/api/v1/storage/restore/{fileId}": {
    patch: {
      summary: "Restore a soft-deleted file",
      tags: ["Storage"],
      security: [{ bearerAuth: [] }],
      parameters: [
        {
          in: "path",
          name: "fileId",
          required: true,
          schema: { type: "string" },
          description: "MongoDB file ID"
        }
      ],
      responses: {
        200: { description: "File restored successfully" },
        401: { description: "Unauthorized" },
        403: { description: "Forbidden — file belongs to another user" },
        404: { description: "File not found" }
      }
    }
  }
}

module.exports = storageDocs