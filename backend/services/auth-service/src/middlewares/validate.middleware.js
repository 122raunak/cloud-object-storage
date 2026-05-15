const ApiError = require("../utils/ApiError")

const validate = (schema) => (req, res, next) => {
    const result = schema.safeParse(req.body)

    if (!result.success) {
        const errorMessages = result.error.errors
            .map((err) => {
                const path = (err.path || []).join(".")
                return path ? `${path}: ${err.message}` : err.message
            })
            .join(", ")

        return next(new ApiError(400, errorMessages))
    }

    req.body = result.data
    next()
}

module.exports = validate