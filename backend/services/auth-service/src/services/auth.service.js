const axios = require("axios")
const crypto = require("crypto")
const jwt = require("jsonwebtoken")
const User = require("../models/users.models")
const ApiError = require("../utils/ApiError")
const logger = require("../utils/logger")


class AuthService {

    // ─── Private Helper ────────────────────────────────────────────────────────

    async #generateTokens(user) {
        const accessToken = user.generateAccessToken()
        const refreshToken = user.generateRefreshToken()


        const hashedRefreshToken = crypto
            .createHash("sha256")
            .update(refreshToken)
            .digest("hex")

        user.refreshToken = hashedRefreshToken
        await user.save({ validateBeforeSave: false })

        return { accessToken, refreshToken }
    }

    // ─── Auth Operations ───────────────────────────────────────────────────────

    async register(username, email, password, role) {
        
        if ([username, email, password].some((field) => !field || field.trim() === "")) {
            throw new ApiError(400, "All required fields must be provided")
        }

        const allowedRoles = ["USER", "ADMIN"]
        const assignedRole = role && allowedRoles.includes(role) ? role : "USER"

        const existingUser = await User.findOne({ email })
        if (existingUser) {
            throw new ApiError(409, "User with these credentials already exists")
        }

        const user = await User.create({
            username,
            email,
            password,
            role: assignedRole
        })

        const createdUser = await User.findById(user._id).select("-password -refreshToken")

        return createdUser
    }

    async login(email, password) {
        if (!email || !password) {
            throw new ApiError(400, "Email and password are required")
        }
        const user = await User.findOne({ email }).select("+password")
        if (!user) {
            throw new ApiError(404, "User not found")
        }
        const isPasswordCorrect = await user.isPasswordCorrect(password)
        if (!isPasswordCorrect) {
            throw new ApiError(401, "Invalid credentials")
        }
        if (user.isSuspended) {
            throw new ApiError(403, `Account suspended: ${user.suspendReason || "Contact support"}`)
        }
        const { accessToken, refreshToken } = await this.#generateTokens(user)
        const loggedInUser = user.toObject()
        delete loggedInUser.password
        delete loggedInUser.refreshToken

        return { accessToken, refreshToken, user: loggedInUser }
        }

        async refreshAccessToken(incomingRefreshToken) {
            if (!incomingRefreshToken) {
                throw new ApiError(401, "Unauthorized request")
            }

            let decodedToken
            try {
                decodedToken = jwt.verify(
                    incomingRefreshToken,
                    process.env.JWT_REFRESH_SECRET
                )
            } catch (error) {
                throw new ApiError(401, "Invalid or expired refresh token")
            }

        const user = await User.findById(decodedToken._id)
        if (!user) {
            throw new ApiError(401, "Invalid refresh token")
        }

        const hashedIncoming = crypto
            .createHash("sha256")
            .update(incomingRefreshToken)
            .digest("hex")

        if (hashedIncoming !== user.refreshToken) {
            throw new ApiError(401, "Refresh token already used or expired")
        }

        const { accessToken, refreshToken } = await this.#generateTokens(user)

        return { accessToken, refreshToken }
    }

    async logout(userId) {
        const user = await User.findByIdAndUpdate(
            userId,
            { $unset: { refreshToken: 1 } },
            { returnDocument: "after" }
        )

        if (!user) {
            throw new ApiError(404, "User not found")
        }

        return true
    }

    // ─── User Operations ───────────────────────────────────────────────────────

    async getCurrentUser(userId) {
        const user = await User.findById(userId).select("-password -refreshToken")

        if (!user) {
            throw new ApiError(404, "User not found")
        }

        return user
    }

    async getAllUsers(page, limit) {
        const safePage = Math.max(1, parseInt(page) || 1)
        const safeLimit = Math.min(100, parseInt(limit) || 20)
        const skip = (safePage - 1) * safeLimit

        const [users, total] = await Promise.all([
            User.find()
                .select("-password -refreshToken")
                .skip(skip)
                .limit(safeLimit),
            User.countDocuments()
        ])

        return {
            users,
            pagination: {
                total,
                page: safePage,
                limit: safeLimit,
                totalPages: Math.ceil(total / safeLimit)
            }
        }
    }

    async changeUserRole(userId, role) {
        const allowedRoles = ["USER", "ADMIN"]

        if (!role) {
            throw new ApiError(400, "Role is required")
        }

        if (!allowedRoles.includes(role)) {
            throw new ApiError(400, "Invalid role provided")
        }

        const user = await User.findById(userId)
        if (!user) {
            throw new ApiError(404, "User not found")
        }

        user.role = role
        await user.save({ validateBeforeSave: false })

        const updatedUser = user.toObject()
        delete updatedUser.password
        delete updatedUser.refreshToken

        return updatedUser
    }

    async changePassword(userId, oldPassword, newPassword) {
        if (!oldPassword || !newPassword) {
            throw new ApiError(400, "Old password and new password are required")
        }

        if (oldPassword === newPassword) {
            throw new ApiError(400, "New password must be different from old password")
        }

        const user = await User.findById(userId).select("+password")
        if (!user) {
            throw new ApiError(404, "User not found")
        }

        const isPasswordCorrect = await user.isPasswordCorrect(oldPassword)
        if (!isPasswordCorrect) {
            throw new ApiError(401, "Old password is incorrect")
        }

        user.password = newPassword
        user.refreshToken = undefined
        await user.save()

        return true
    }

    // Create notification preferences — fire and forget
    async suspendUser(userId, reason) {
        const user = await User.findById(userId)
        if (!user) throw new ApiError(404, "User not found")
        if (user.role === "ADMIN") throw new ApiError(403, "Cannot suspend an admin user")

        user.isSuspended = true
        user.suspendedAt = new Date()
        user.suspendReason = reason || "Suspended by admin"
        user.refreshToken = undefined // force logout
        await user.save({ validateBeforeSave: false })

        return { message: "User suspended successfully" }
    }

    async unsuspendUser(userId) {
        const user = await User.findById(userId)
        if (!user) throw new ApiError(404, "User not found")

        user.isSuspended = false
        user.suspendedAt = null
        user.suspendReason = null
        await user.save({ validateBeforeSave: false })

        return { message: "User unsuspended successfully" }
    }

    async deleteUser(userId) {
        const user = await User.findById(userId)
        if (!user) throw new ApiError(404, "User not found")
        if (user.role === "ADMIN") throw new ApiError(403, "Cannot delete an admin user")

        await User.findByIdAndDelete(userId)
        return { message: "User deleted successfully" }
    }
}

module.exports = new AuthService()