const { z } = require("zod")

const registerSchema = z.object({
    username: z.string()
        .min(3, "Username must be at least 3 characters")
        .max(30, "Username must be at most 30 characters")
        .trim(),
    email: z.string()
        .email("Please provide a valid email address")
        .toLowerCase(),
    password: z.string()
        .min(8, "Password must be at least 8 characters")
        .max(72, "Password must be at most 72 characters")
        .regex(
            /^(?=.*[A-Z])(?=.*[0-9])(?=.*[!@#$%^&*])/,
            "Password must contain at least one uppercase letter, one number, and one special character"
        ),
    role: z.enum(["USER", "ADMIN"]).optional()
})

const loginSchema = z.object({
    email: z.string()
        .email("Please provide a valid email address"),
    password: z.string()
        .min(1, "Password is required")
})

const changePasswordSchema = z.object({
    oldPassword: z.string()
        .min(1, "Old password is required"),
    newPassword: z.string()
        .min(8, "New password must be at least 8 characters")
        .max(72, "New password must be at most 72 characters")
        .regex(
            /^(?=.*[A-Z])(?=.*[0-9])(?=.*[!@#$%^&*])/,
            "Password must contain at least one uppercase letter, one number, and one special character"
        )
})

const changeRoleSchema = z.object({
    role: z.enum(["USER", "ADMIN"], {
        errorMap: () => ({ message: "Role must be USER or ADMIN" })
    })
})

module.exports = {
    registerSchema,
    loginSchema,
    changePasswordSchema,
    changeRoleSchema
}