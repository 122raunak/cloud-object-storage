const { z }    = require("zod")
const ApiError = require("../utils/ApiError")


const validateQuery = (schema) => (req, res, next) => {
  const result = schema.safeParse(req.query)

  if (!result.success) {
    return next(new ApiError(400, result.error.issues[0].message))
  }

  req.query = result.data
  next()
}

const validateBody = (schema) => (req, res, next) => {
  const result = schema.safeParse(req.body)

  if (!result.success) {
    return next(new ApiError(400, result.error.issues[0].message))
  }

  req.body = result.data
  next()
}

const validateParams = (schema) => (req, res, next) => {
  const result = schema.safeParse(req.params)

  if (!result.success) {
    return next(new ApiError(400, result.error.issues[0].message))
  }

  req.params = result.data
  next()
}

// ─── Schemas ──────────────────────────────────────────────────────────────────

const invoiceListQuerySchema = z.object({
  status: z.enum(
    ["draft", "issued", "paid", "void"],
    { message: "status must be one of: draft, issued, paid, void" }
  ).optional(),

  limit: z.coerce
    .number({ invalid_type_error: "limit must be a number" })
    .int("limit must be an integer")
    .min(1,   "limit must be at least 1")
    .max(100, "limit cannot exceed 100")
    .default(12),

  offset: z.coerce
    .number({ invalid_type_error: "offset must be a number" })
    .int("offset must be an integer")
    .min(0, "offset cannot be negative")
    .default(0),
})

const assignPlanBodySchema = z.object({
  tierId: z.coerce
    .number({ invalid_type_error: "tierId must be a number" })
    .int("tierId must be an integer")
    .positive("tierId must be a positive integer"),
})

const generateInvoiceBodySchema = z.object({
  year: z.coerce
    .number({ invalid_type_error: "year must be a number" })
    .int("year must be an integer")
    .min(2024, "year must be 2024 or later"),

  month: z.coerce
    .number({ invalid_type_error: "month must be a number" })
    .int("month must be an integer")
    .min(1,  "month must be between 1 and 12")
    .max(12, "month must be between 1 and 12"),
})

const invoiceParamsSchema = z.object({
  userId:    z.string().min(1, "userId is required"),
  invoiceId: z.coerce
    .number({ invalid_type_error: "invoiceId must be a number" })
    .int("invoiceId must be an integer")
    .positive("invoiceId must be a positive integer"),
})

module.exports = {
  validateQuery,
  validateBody,
  validateParams,
  invoiceListQuerySchema,
  invoiceParamsSchema,
  assignPlanBodySchema,
  generateInvoiceBodySchema,
}