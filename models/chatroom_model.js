import mongoose, { mongo } from "mongoose";
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
        type: String,  // Can handle both ObjectId and String
        ref: 'users_collection',
        required: true
    }],    
    adminId: {
        type: Schema.Types.Mixed,  // Can handle both ObjectId and String
        ref: 'users_collection',
        required: function() { return this.isGroup; } // Only required for groups
    },
    readBy : [{type: mongoose.Schema.Types.ObjectId,  ref : ''}],

    lastMessage: {
        type: String,
        default: ''
    },
    lastMessageAt: {
        type: Date,
        default: null
    },
    unreadCount: {
        type: Map,
        of: Number,
        default: {}
    }
    
  }, {timeseries: true}
  )

// Indexes for faster queries
chatRoomSchema.index({ participants: 1, updatedAt: -1 });  // Find all rooms a user is in
chatRoomSchema.index({ isGroup: 1 }); // Group chat filter
chatRoomSchema.index({ isGroup: 1, adminId: 1 }); // Group admin queries
chatRoomSchema.index({ readBy: 1 }); // Unread chat tracking
chatRoomSchema.index({ createdAt: -1 }); // Newest chats first

const ChatRoom = mongoose.model('chatroom_collection', chatRoomSchema);
export default ChatRoom;