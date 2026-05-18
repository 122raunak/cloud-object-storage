const mongoose = require("mongoose")

const bucketSchema = new mongoose.Schema({
  userId: {
    type: String,
    required: true,
    index: true
  },
  name: {
    type: String,
    required: true,
    trim: true,
    maxlength: 63,
    match: /^[a-z0-9][a-z0-9-]*[a-z0-9]$/
  },
  description: {
    type: String,
    default: '',
    maxlength: 255
  },
  fileCount: {
    type: Number,
    default: 0
  },
  totalSize: {
    type: Number,
    default: 0
  },
  isDeleted: {
    type: Boolean,
    default: false
  }
}, { timestamps: true })

bucketSchema.index({ userId: 1, name: 1 }, { unique: true })
bucketSchema.index({ userId: 1, isDeleted: 1 })

module.exports = mongoose.model("Bucket", bucketSchema)