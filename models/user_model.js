import mongoose from "mongoose";
import db from "../config/db_config.js"
import bcrypt from "bcryptjs";
import shortid from "shortid";
import { type } from "os";

const {Schema} = mongoose

const userSchema = new Schema({
  username : {type: String, lowercase: true, required: true, unique: true},
  userId : {type: String, default: shortid.generate},
  fullname : {type: String, require: true},
  email : {type: String, lowercase: true, required: true, unique: true},
  password : {type: String, require: true},
  photo : {type: String},
  lastseen : {type: String},
  isOnline : {type: Boolean}
}, {timeseries: true}
)

userSchema.pre("save", async function(){
    try {
        var user = this
        const salt = await(bcrypt.genSalt())
        const hashPass = await bcrypt.hash(user.password, salt)
        user.password = hashPass
    } catch (error) {
        throw error
    }
})

userSchema.methods.comparePassword = async function (candidatePassword) {
    return await bcrypt.compare(candidatePassword, this.password)
  }

const UserModel = db.model("users_collection", userSchema)
export default UserModel  