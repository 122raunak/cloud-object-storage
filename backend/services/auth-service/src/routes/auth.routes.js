const express = require("express")
const verifyJWT = require("../middlewares/auth.middleware")
const authorizeRoles = require("../middlewares/authorizeRoles.middleware")
const validate = require("../middlewares/validate.middleware")
const {
    registerSchema,
    loginSchema,
    changePasswordSchema,
    changeRoleSchema
} = require("../validators/auth.validators")

const router = express.Router()

const {
    registerUser,
    loginUser,
    refreshAccessToken,
    logoutUser,
    getCurrentUser,
    getAllUsers,
    changeUserRole,
    changePassword,
    suspendUser,
    unsuspendUser,
    deleteUser
} = require("../controllers/auth.controllers")

router.post("/register", validate(registerSchema), registerUser)
router.post("/login", validate(loginSchema), loginUser)
router.post("/refresh-token", refreshAccessToken)
router.post("/logout", verifyJWT, logoutUser)
router.get("/me", verifyJWT, getCurrentUser)
router.patch("/change-password", verifyJWT, validate(changePasswordSchema), changePassword)

// ADMIN ONLY
router.get("/all-users", verifyJWT, authorizeRoles("ADMIN"), getAllUsers)
router.patch(
    "/change-role/:userId",
    verifyJWT,
    authorizeRoles("ADMIN"),
    validate(changeRoleSchema),
    changeUserRole
)
router.patch("/suspend/:userId", verifyJWT, authorizeRoles("ADMIN"), suspendUser)
router.patch("/unsuspend/:userId", verifyJWT, authorizeRoles("ADMIN"), unsuspendUser)
router.delete("/delete-user/:userId", verifyJWT, authorizeRoles("ADMIN"), deleteUser)

module.exports = router