import mongoose, { mongo } from "mongoose";

const {Schema} = mongoose

const messageSchema = new Schema({
  senderId: {
    type: Schema.Types.ObjectId,
    ref: 'users_collection',
    required: true
  },
  chatRoomId: {
    type: Schema.Types.ObjectId,
    ref: 'chatroom_collection',
    required: true
  },
  content: { 
    type: String, 
    required: true 
  },
  readBy: [{
    type: Schema.Types.ObjectId,
    ref: 'users_collection'
  }],
  // For Socket.IO message status tracking
  status: {
    type: String,
    enum: ['sent', 'delivered', 'read'],
    default: 'sent'
  }
}, { 
  timestamps: true, // Use this instead of timeseries for standard messaging
  bufferCommands: false // Better for Socket.IO high-frequency inserts
});

// Indexes for faster queries
// Critical for fetching chat history
messageSchema.index({ chatRoomId: 1, createdAt: -1 }); 

// For sender-specific queries (e.g., "my messages")
messageSchema.index({ senderId: 1, createdAt: -1 });  

// For read/unread status checks
messageSchema.index({ chatRoomId: 1, readBy: 1 });    

// For message status updates (Socket.IO acks)
messageSchema.index({ _id: 1, status: 1 }); 

const Message = mongoose.model('message_collection', messageSchema);
export default Message;