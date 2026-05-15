const mongoose = require("mongoose")
const bcrypt = require('bcrypt')
const jwt = require('jsonwebtoken')
const {JWT_ACCESS_SECRET , JWT_REFRESH_SECRET , JWT_ACCESS_EXPIRY , JWT_REFRESH_EXPIRY} = require("../config/env")

const userSchema = new mongoose.Schema({
    username:{
        type: String,
        required:true,
        unique:true,
        trim:true
    },
    email:{
        type:String, 
        required:true,
        unique:true,
        lowercase:true,
        trim:true,
        match:[/\S+@\S+\.\S+/, "Please use a valid email address"],
        index:true
    },
    password:{
        type:String , 
        required:true,   
        select:false,
        minlength:6
    },
    role:{
        type:String,
        enum: ["USER" , "ADMIN"],
        default:"USER"
    },
    refreshToken:{
        type:String
    },
    isSuspended: {
    type: Boolean,
    default: false
    },
    suspendedAt: {
        type: Date,
        default: null
    },
    suspendReason: {
        type: String,
        default: null
    }
} , {timestamps: true})


userSchema.pre("save", async function() {
    if (!this.isModified("password")) return
    this.password = await bcrypt.hash(this.password, 10)
})

userSchema.methods.isPasswordCorrect = async function (enteredPassword){
    return await bcrypt.compare(enteredPassword , this.password)
}

userSchema.methods.generateAccessToken = function(){
    return jwt.sign(
        {
            _id: this._id,
            email: this.email,
            role: this.role
        },
        JWT_ACCESS_SECRET,
        {
            expiresIn: JWT_ACCESS_EXPIRY

        }
    )
}


userSchema.methods.generateRefreshToken = function () {
  return jwt.sign(
    {
      _id: this._id,
    },
    JWT_REFRESH_SECRET,
    {
      expiresIn: JWT_REFRESH_EXPIRY
    }
  );
};


const User = mongoose.model("User" , userSchema)
module.exports = User