const { z }    = require("zod")
const ApiError = require("../utils/ApiError")

// ─── Middleware factory ───────────────────────────────────────────────────────
// Validates req.query against a Zod schema
// On success: replaces req.query with coerced/defaulted values
// On failure: throws ApiError 400 with the first validation message
const validateQuery = (schema) => (req, res, next) => {
  const result = schema.safeParse(req.query)

  if (!result.success) {
    const message = result.error.issues[0].message
    throw new ApiError(400, message)
  }

  // Replace with coerced values (strings → numbers, defaults applied)
  req.query = result.data
  next()
}

// ─── Schemas ─────────────────────────────────────────────────────────────────

const dailyQuerySchema = z.object({
  days: z.coerce
    .number({ invalid_type_error: "days must be a number" })
    .int("days must be an integer")
    .min(1,   "days must be at least 1")
    .max(365, "days cannot exceed 365")
    .default(30),
})

const monthlyQuerySchema = z.object({
  months: z.coerce
    .number({ invalid_type_error: "months must be a number" })
    .int("months must be an integer")
    .min(1,  "months must be at least 1")
    .max(60, "months cannot exceed 60")
    .default(12),
})

const eventLogQuerySchema = z.object({
  limit: z.coerce
    .number({ invalid_type_error: "limit must be a number" })
    .int("limit must be an integer")
    .min(1,   "limit must be at least 1")
    .max(200, "limit cannot exceed 200")
    .default(50),

  offset: z.coerce
    .number({ invalid_type_error: "offset must be a number" })
    .int("offset must be an integer")
    .min(0, "offset cannot be negative")
    .default(0),

  eventType: z.enum(
    ["file.uploaded", "file.downloaded", "file.deleted", "file.restored"],
    { message: "eventType must be one of: file.uploaded, file.downloaded, file.deleted, file.restored" }
  ).optional(),
})

module.exports = {
  validateQuery,
  dailyQuerySchema,
  monthlyQuerySchema,
  eventLogQuerySchema,
}