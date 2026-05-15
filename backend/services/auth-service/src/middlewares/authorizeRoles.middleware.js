const ApiError = require("../utils/ApiError")
const authorizeRoles = (...roles) =>{
    return (req , res ,next) =>{
        if(!roles.includes(req.user.role)){
            throw new ApiError(401 , "you are not allowed to access this response ")
        }
        next()
    }
}

module.exports = authorizeRoles
