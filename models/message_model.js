import mongoose, { mongo } from "mongoose";
import db from "../config/db_config"
import bcrypt from "bcryptjs";
import shortid from "shortid";
import { type } from "os";
import { ref } from "process";

const {Schema} = mongoose

const messageSchema = new Schema({
    senderId : {
        type: mongoose.Schema.Types.ObjectId,
        ref : 'user_collection', 
        require: true
    },
    chatRoomId : {
        type: mongoose.Schema.Types.ObjectId,
        ref : 'chatroom_collection', 
        require: true
    },
    content : {type: String, required: true},
    readBy : [{
        type: mongoose.Schema.Types.ObjectId,
        ref : 'user_collection'
    }],
  }, {timeseries: true}
  )

  // Indexes for faster queries
messageSchema.index({ chatRoomId: 1 }); // Optimize chat room message fetches
messageSchema.index({ senderId: 1 });   // Optimize sender-based queries
messageSchema.index({ createdAt: -1 }); // Sort messages newest-first

const Message = mongoose.model('message_collection', messageSchema);
module.exports = Message;