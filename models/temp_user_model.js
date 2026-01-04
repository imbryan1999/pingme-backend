import mongoose from 'mongoose';
import db from "../config/db_config.js"
import bcrypt from "bcryptjs";

const {Schema} = mongoose

const TempUserSchema = new Schema({
  username: { type: String, required: true },
  fullname: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  photo: { type: String },
  fcmToken: { type: String, default: null },
  otp: { type: String, required: true },
  createdAt: { type: Date, default: Date.now, expires: 600 }, // Auto-delete after 10 min
});

const TempUserModel = mongoose.model("temp_user_collection", TempUserSchema)
export default TempUserModel  