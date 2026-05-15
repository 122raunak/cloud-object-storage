const { z } = require("zod")

const uploadSchema = z.object({
  fileName: z.string().min(1).max(255),
  contentType: z.string().min(1),
  size: z.number().positive().max(parseInt(process.env.MAX_FILE_SIZE))
})

exports.validateUpload = (req, res, next) => {
  try {
    uploadSchema.parse(req.body)
    next()
  } catch (err) {
    return res.status(400).json({
      error: "Invalid input",
      details: err.errors
    })
  }
}

const confirmUploadSchema = z.object({
  objectKey: z.string().min(1),
  fileName: z.string().min(1).max(255),
  contentType: z.string().min(1),
  size: z.number().positive()
})

exports.validateConfirmUpload = (req, res, next) => {
  try {
    confirmUploadSchema.parse(req.body)
    next()
  } catch (err) {
    return res.status(400).json({
      error: "Invalid input",
      details: err.errors
    })
  }
}