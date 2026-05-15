const { z } = require("zod")
const ApiError = require("../utils/ApiError")

/**
 * Factory that creates a validation middleware for req.body, req.query, or req.params.
 * @param {z.ZodSchema} schema
 * @param {"body"|"query"|"params"} source
 */
function validate(schema, source = "body") {
  return (req, res, next) => {
    const result = schema.safeParse(req[source])
    if (!result.success) {
      const errors = result.error.flatten().fieldErrors
      const messages = Object.entries(errors)
        .map(([field, msgs]) => `${field}: ${msgs.join(", ")}`)
        .join("; ")
      return next(new ApiError(400, `Validation error: ${messages}`, Object.values(errors).flat()))
    }
    req[source] = result.data
    next()
  }
}

const validateBody = (schema) => validate(schema, "body")
const validateQuery = (schema) => validate(schema, "query")
const validateParams = (schema) => validate(schema, "params")

module.exports = { validateBody, validateQuery, validateParams }