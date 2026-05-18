const mongoose = require("mongoose")

const fileSchema = new mongoose.Schema({
  userId: {
    type: String, 
    required: true, 
    index: true 
  },
  fileName: {
    type: String, 
    required: true, 
    trim: true, 
    maxlength: 255 
  },
  objectKey: { 
    type: String, 
    required: true, 
    unique: true 
  },
  size: { 
    type: Number,
    required: true, 
    min: 0 
  },
  mimeType: { 
    type: String, 
    required: true 
  },
  bucket: { 
    type: String, 
    required: true 
  },

  isDeleted: { 
    type: Boolean, 
    default: false, 
    index: true 
  },
  deletedAt: { 
    type: Date, 
    default: null 
  },

  version: { 
    type: Number, 
    default: 1 
  },
  downloadCount: { 
    type: Number, 
    default: 0 
  },
  userBucketId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Bucket',
    default: null,
    index: true
  },
}, { timestamps: true })

fileSchema.index({ userId: 1, isDeleted: 1 })
fileSchema.index({ userId: 1, createdAt: -1 })
fileSchema.index({ userId: 1, fileName: 1, isDeleted: 1 })
fileSchema.index({ fileName: "text" })

module.exports = mongoose.model("File", fileSchema)