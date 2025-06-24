import { SOCKET_EVENTS } from "../config/socket_event_constants.js";
import { getOrCreatePrivateChat } from "../controller/chat_controller.js";
import ChatRoom from "../models/chatroom_model.js";
import Message from "../models/message_model.js";
import { socketAuthMiddleware } from "./socket_auth.js";
import mongoose from "mongoose";
import UserModel from "../models/user_model.js";

export const registerSocketEvents = (io) => {
  
  // Apply authentication middleware
  io.use(socketAuthMiddleware);

  io.on(SOCKET_EVENTS.CONNECTION, (socket) => {
    // Store user ID from auth middleware (assuming you have it)
    const userId = socket.user?._id;

    console.log("✅ User connected:", {
      id: socket.id,
      userId: userId,
      handshake: socket.handshake.auth
    });

    // --- Chat Room Events ---
  socket.on(SOCKET_EVENTS.CREATE_PRIVATE_CHAT, async ({ userId1, userId2 }, callback) => {
    try {
      console.log("Handling CREATE_PRIVATE_CHAT for users:", userId1, userId2);
    
    // if (![userId1, userId2].includes(userId?.toString())) {
    //   throw new Error('Unauthorized chat creation');
    // }

    const chat = await getOrCreatePrivateChat(userId1, userId2);
    console.log("Chat created:", chat._id);
    
    // Send response to requester
    if (typeof callback === 'function') {
      callback({ status: 'success', chat });
    }
    
    // Notify both users
    io.to(userId1.toString()).to(userId2.toString()).emit(
      SOCKET_EVENTS.PRIVATE_CHAT_CREATED, 
      chat
    );
    
  } catch (err) {
    console.error('Error in CREATE_PRIVATE_CHAT:', err);
    if (typeof callback === 'function') {
      callback({ status: 'error', message: err.message });
    }
  }
  
});

    socket.on(SOCKET_EVENTS.JOIN_ROOM, (chatId) => {
      socket.join(chatId);
      console.log(`👥 User ${userId} joined chat ${chatId}`);
    });

    // --- Message Events ---
    socket.on(SOCKET_EVENTS.SEND_MESSAGE, async ({ chatRoomId, content }, callback) => {
      try {
        console.log('SEND_MESSAGE received:', { chatRoomId, userId, content });
        if (!content?.trim()) {
          throw new Error('Message content cannot be empty');
        }

        // const new_user_id = await UserModel.findOne({ userId: userId });
        const user = await UserModel.findOne({ userId });
      
        const message = await Message.create({
          senderId: userId,
          chatRoomId,
          content,
          status: 'sent'
        });

        // Send response to requester
        if (typeof callback === 'function') {
          // callback({ status: 'success', message});
          callback({ status: 'success', message: { ...message.toObject(), senderId: userId } });
        }

        // Broadcast to room (except sender)
        socket.to(chatRoomId).emit(SOCKET_EVENTS.NEW_MESSAGE, message);
        // Confirm to sender with populated data
        socket.emit(SOCKET_EVENTS.MESSAGE_SENT, message);
        
        // Update chat room's last message timestamp
        await ChatRoom.updateOne(
          { _id: chatRoomId },
          { $set: { updatedAt: new Date() } }
        );
      } catch (err) {
        console.error('Message send error:', err);
        socket.emit('error', {
          event: 'sendMessage',
          message: err.message
        });
      }
    });

    socket.on(SOCKET_EVENTS.NEW_MESSAGE, async ({ chatRoomId, page = 1 }, callback) => {
      try {
        const messages = await Message.find({ chatRoomId })
          .sort({ createdAt: -1 })
          .skip((page - 1) * 50)
          .limit(50)
          .populate('senderId', 'username avatar')
          .lean();

        // Use callback instead of emit for request/response pattern
        callback({ status: 'success', messages });
      } catch (err) {
        console.error('Message fetch error:', err);
        callback({ status: 'error', message: err.message });
      }
    });

    // --- Message Status Events ---
    socket.on(SOCKET_EVENTS.MESSAGE_DELIVERED, async (messageId) => {
      try {
        await Message.updateOne(
          { _id: messageId, senderId: { $ne: userId } }, // Can't ack own messages
          { $set: { status: 'delivered' } }
        );
        
        io.to(userId).emit(SOCKET_EVENTS.UPDATE_STATUS, {
          messageId,
          status: 'delivered'
        });
      } catch (err) {
        console.error('Delivery ack error:', err);
      }
    });

    socket.on(SOCKET_EVENTS.MESSAGE_READ, async (messageId) => {
      try {
        await Message.updateOne(
          { _id: messageId, senderId: { $ne: userId } }, // Can't read own messages
          { 
            $set: { status: 'read' },
            $addToSet: { readBy: userId } 
          }
        );
        
        io.to(userId).emit(SOCKET_EVENTS.UPDATE_STATUS, {
          messageId,
          status: 'read'
        });
      } catch (err) {
        console.error('Read receipt error:', err);
      }
    });

    // --- Disconnection ---
    socket.on(SOCKET_EVENTS.DISCONNECT, () => {
      console.log(`❌ User disconnected: ${socket.id} (User: ${userId})`);
    });
  });

  // Global error handler
  io.on('error', (err) => {
    console.error('Socket server error:', err);
  });
};