const { v4: uuidv4} = require("uuid")

const requestIDMiddleware = (req, res, next) =>{
    //reuse if there already exists an id
    const requestID = req.headers["x-request-id"] || uuidv4()
    req.requestID  = requestID

    res.setHeader('X-Request-ID' , requestID)

    next();
}

module.exports = requestIDMiddleware