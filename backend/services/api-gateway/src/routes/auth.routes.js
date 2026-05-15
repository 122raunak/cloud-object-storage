const express = require("express")
const verifyJWT = require("../middlewares/verifyJWT.middleware")
const authProxy = require("./auth.proxy")

const router = express.Router()

//public routes
router.use("/login", authProxy)
router.use("/register", authProxy)
router.use("/refresh-token", authProxy)


//protected routed
router.use("/logout", verifyJWT, authProxy)
router.use("/me", verifyJWT, authProxy)
router.use("/change-password", verifyJWT, authProxy)
router.use("/all-users", verifyJWT, authProxy)
router.use("/change-role", verifyJWT, authProxy)

module.exports = router