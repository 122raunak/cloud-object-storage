const express = require("express")
const swaggerUi = require("swagger-ui-express")
const swaggerSpec = require("../config/swagger")
const controller = require("../controllers/storage.controller")
const auth = require("../middlewares/auth.middleware")
const { uploadLimiter } = require("../middlewares/ratelimiter.middleware")
const { validateUpload, validateConfirmUpload } = require("../middlewares/validate.middleware")

const router = express.Router()

router.use(auth)
router.post("/upload-url", uploadLimiter, validateUpload, controller.getUploadUrl)
router.get("/download-url/:fileId", controller.getDownloadUrl)
router.get("/files", controller.listFiles)
router.delete("/:fileId", controller.deleteFile)
router.patch("/restore/:fileId", controller.restoreFile)
router.post("/confirm-upload", validateConfirmUpload, controller.confirmUpload)
router.use("/docs", swaggerUi.serve)
router.get("/share/:fileId", controller.getShareUrl)
router.get("/docs", swaggerUi.setup(swaggerSpec))

module.exports = router