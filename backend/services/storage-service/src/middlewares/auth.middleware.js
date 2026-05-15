const ApiError = require("../utils/ApiError")

const authContext = (req, res, next) => {
  const userId = req.headers["x-user-id"]
  const role = req.headers["x-user-role"]
  const email = req.headers["x-user-email"]

  if (!userId) {
    return next(new ApiError(401, "Unauthorized: Missing user context"))
  }

  req.user = {
    id: userId,
    role,
    email
  }

  next()
}

module.exports = authContext