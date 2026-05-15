const ApiError = require("../utils/ApiError")
const asyncHandler = require("../utils/asyncHandler")
const jwt = require("jsonwebtoken")
const User = require('../models/users.models')

const verifyJWT = asyncHandler(async (req , res , next) =>{
    const token = req.cookies?.accessToken || req.header("Authorization")?.replace("Bearer ", "")

    if(!token){
        throw new ApiError(401 , "unauthorized request")
    }
    
    try {
        
        const decodedToken = jwt.verify(token , process.env.JWT_ACCESS_SECRET)

        const user = await User.findById(decodedToken._id).select("-password -refreshToken")

        if(!user){
            throw new ApiError(401 , "invlaid accesstoken")
        }

        req.user = user
        next()
        
    } catch (error) {
        throw new ApiError(401 , error?.message || "inavlid acccess token")
    }
})

module.exports = verifyJWT