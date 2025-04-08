import mongoose, { mongo } from "mongoose";
import db from "../config/db_config"
import bcrypt from "bcryptjs";
import shortid from "shortid";
import { type } from "os";
import { ref } from "process";

const {Schema} = mongoose

const chatRoomSchema = new Schema({
    name: {
        type: String,
        required: function() { return this.isGroup; } // Only required if isGroup=true
    },    
    isGroup: {type: Boolean, default: false},
    participants: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'user_collection', // Links to the 'users' collection
        required: true
    }], 
    adminId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'user_collection', // Links to the 'users' collection
        required: function() { return this.isGroup; } // Only required for groups
    },
    readBy : [{type: mongoose.Schema.Types.ObjectId,  ref : ''}],
  }, {timeseries: true}
  )

// Indexes for faster queries
chatRoomSchema.index({ participants: 1 }); // Find all rooms a user is in
chatRoomSchema.index({ isGroup: 1 });      // Filter group chats
chatRoomSchema.index({ createdAt: -1 });   // Sort rooms by creation time

const ChatRoom = mongoose.model('chatroom_collection', chatRoomSchema);
module.exports = ChatRoom;