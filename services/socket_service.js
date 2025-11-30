import { SOCKET_EVENTS } from "../config/socket_event_constants.js";
import { getOrCreatePrivateChat } from "../controller/chat_controller.js";
import ChatRoom from "../models/chatroom_model.js";
import Message from "../models/message_model.js";
import { socketAuthMiddleware } from "./socket_auth.js";
import mongoose from "mongoose";
import UserModel from "../models/user_model.js";

/**
 * registerSocketEvents(io)
 *
 * Robust socket.io registration with multi-device support and proper room semantics.
 *
 * Key idea:
 * - Keep a map `userSockets` mapping userId -> Set(socketId)
 * - Only join sockets to chat rooms (chatRoomId) via JOIN_ROOM
 * - Use io.to(chatRoomId).emit for chat messages
 * - Use userSockets to notify all devices of a user (notifications, delivery/read receipts)
 */

export const registerSocketEvents = (io) => {
  // Apply socket auth middleware before connection
  io.use(socketAuthMiddleware);

  // Map to keep track of connected sockets per user
  // userSockets: { [userId]: Set(socketId) }
  const userSockets = new Map();

  // Helper: register a socketId for a userId
  const addUserSocket = (userId, socketId) => {
    if (!userId) return;
    const key = userId.toString();
    const set = userSockets.get(key) ?? new Set();
    set.add(socketId);
    userSockets.set(key, set);
    console.log(`🟢 addUserSocket: user=${key} socket=${socketId} totalSockets=${set.size}`);
  };

  // Helper: remove a socketId for a userId
  const removeUserSocket = (userId, socketId) => {
    if (!userId) return;
    const key = userId.toString();
    const set = userSockets.get(key);
    if (!set) return;
    set.delete(socketId);
    if (set.size === 0) {
      userSockets.delete(key);
      console.log(`🔴 removeUserSocket: user=${key} all sockets removed`);
    } else {
      userSockets.set(key, set);
      console.log(`🟡 removeUserSocket: user=${key} remainedSockets=${set.size}`);
    }
  };

  // Helper: notify all sockets of a user with an event
  const notifyUserSockets = (userId, event, payload) => {
    if (!userId) return;
    const key = userId.toString();
    const set = userSockets.get(key);
    if (!set || set.size === 0) return;
    for (const socketId of set) {
      io.to(socketId).emit(event, payload);
    }
    console.log(`🔔 notifyUserSockets: notified user=${key} sockets=${set.size} event=${event}`);
  };

  // On new connection
  io.on(SOCKET_EVENTS.CONNECTION, (socket) => {
    // The auth middleware should have attached `socket.user` (or similar)
    const user = socket.user || null;
    const userId = user?._id ? user._id.toString() : null;

    console.log("✅ Socket connected:", {
      socketId: socket.id,
      userId,
      handshake: socket.handshake?.auth ?? {},
    });

    // Track this socket under the user
    if (userId) {
      addUserSocket(userId, socket.id);
      // Note: we DO NOT join the userId as a chat room. That caused message mixing.
      // Only join chat rooms below when client calls JOIN_ROOM.
    }

    // ---------- CREATE / GET PRIVATE CHAT ----------
    socket.on(SOCKET_EVENTS.CREATE_PRIVATE_CHAT, async ({ userId1, userId2 }, callback) => {
      try {
        console.log(`[${socket.id}] CREATE_PRIVATE_CHAT for ${userId1} - ${userId2}`);
        const chat = await getOrCreatePrivateChat(userId1, userId2);

        // Ack to requester
        if (typeof callback === "function") {
          callback({ status: "success", chat });
        }

        // Notify participants (if connected) about newly-created chat
        const memberList = chat.participants || [];
        if (Array.isArray(memberList) && memberList.length > 0) {
          for (const member of memberList) {
            const memberId = member.toString();
            notifyUserSockets(memberId, SOCKET_EVENTS.PRIVATE_CHAT_CREATED, chat);
          }
        }
      } catch (err) {
        console.error("CREATE_PRIVATE_CHAT error:", err);
        if (typeof callback === "function") {
          callback({ status: "error", message: err.message });
        }
      }
    });

    // ---------- JOIN / LEAVE CHAT ROOM ----------
    socket.on(SOCKET_EVENTS.JOIN_ROOM, (chatId) => {
      try {
        if (!chatId) return;
        socket.join(chatId);
        console.log(`👥 Socket ${socket.id} joined chatRoom ${chatId}`);
      } catch (err) {
        console.error("JOIN_ROOM error:", err);
      }
    });

    socket.on(SOCKET_EVENTS.LEAVE_ROOM, (chatId) => {
      try {
        if (!chatId) return;
        socket.leave(chatId);
        console.log(`👋 Socket ${socket.id} left chatRoom ${chatId}`);
      } catch (err) {
        console.error("LEAVE_ROOM error:", err);
      }
    });

    // ---------- SEND_MESSAGE ----------
    /**
     * Expected payload from client:
     * { chatRoomId, content }
     *
     * Server responsibilities:
     * - validate content
     * - persist message
     * - broadcast message to chat room (so all sockets that have joined the room receive it)
     * - notify other members' sockets (if they haven't joined room) as required (notifications)
     * - ACK sender via callback and via MESSAGE_SENT event
     */
    socket.on(SOCKET_EVENTS.SEND_MESSAGE, async ({ chatRoomId, content }, callback) => {
      try {
        console.log(`[${socket.id}] SEND_MESSAGE by user=${userId} chatRoom=${chatRoomId}`);
        if (!chatRoomId) throw new Error("chatRoomId is required");
        if (!content || !content.toString().trim()) throw new Error("Message content cannot be empty");

        // create and persist message
        const messageDoc = await Message.create({
          senderId: userId,
          chatRoomId,
          content,
          status: "sent",
        });

        const messageObj = { ...messageDoc.toObject(), senderId: userId };

        // 1) Broadcast to all sockets currently in the chat room (includes sender if they joined)
        io.to(chatRoomId).emit(SOCKET_EVENTS.NEW_MESSAGE, {
          chatRoomId,
          message: messageObj,
        });
        console.log(`[SEND_MESSAGE] Broadcasted NEW_MESSAGE to room ${chatRoomId}`);

        // 2) Notify members (who are members of chat but might not be in the room)
        const chat = await ChatRoom.findById(chatRoomId).lean();
        const memberList = chat?.participants ?? [];
        
        if (Array.isArray(memberList) && memberList.length > 0) {
          // recipients = members except the sender
          const recipients = memberList.map(m => m.toString()).filter(m => m !== userId?.toString());

          // For each recipient, notify all their connected sockets (as notification)
            for (const recipientId of recipients) {
                notifyUserSockets(recipientId, SOCKET_EVENTS.NEW_MESSAGE, {
                chatRoomId,
                messageId: messageObj._id,
                message: messageObj,
            });
        }
          console.log(`[SEND_MESSAGE] Notified ${recipients.length} recipients`);
        } else {
          console.log(`[SEND_MESSAGE] No chat found or empty members for chatRoomId=${chatRoomId}`);
        }

        // 3) ACK to sender via callback + direct event
        if (typeof callback === "function") {
          callback({ status: "success", message: messageObj });
        }

        // send explicit ack to the sender socket
        socket.emit(SOCKET_EVENTS.MESSAGE_SENT, { chatRoomId, message: messageObj });

        // 4) update chatroom timestamp
        await ChatRoom.updateOne({ _id: chatRoomId }, { $set: { updatedAt: new Date() } });

      } catch (err) {
        console.error("SEND_MESSAGE error:", err);
        // ack error back to sender
        if (typeof callback === "function") {
          callback({ status: "error", message: err.message });
        }
        socket.emit("error", { event: SOCKET_EVENTS.SEND_MESSAGE, message: err.message });
      }
    });

    // ---------- NEW_MESSAGE (message fetch / history) ----------
    socket.on(SOCKET_EVENTS.NEW_MESSAGE, async ({ chatRoomId, page = 1 }, callback) => {
      try {
        if (!chatRoomId) throw new Error("chatRoomId is required");
        const messages = await Message.find({ chatRoomId })
          .sort({ createdAt: -1 })
          .skip((page - 1) * 50)
          .limit(50)
          .populate("senderId", "username avatar")
          .lean();

        if (typeof callback === "function") {
          callback({ status: "success", messages });
        }
      } catch (err) {
        console.error("NEW_MESSAGE(fetch) error:", err);
        if (typeof callback === "function") {
          callback({ status: "error", message: err.message });
        }
      }
    });

    // ---------- MESSAGE_DELIVERED ----------
    socket.on(SOCKET_EVENTS.MESSAGE_DELIVERED, async (messageId) => {
      try {
        if (!messageId) return;
        await Message.updateOne(
          { _id: messageId, senderId: { $ne: userId } },
          { $set: { status: "delivered" } }
        );

        // notify sender's sockets about status update
        const msg = { messageId, status: "delivered" };
        const messageDoc = await Message.findById(messageId).lean();
        if (messageDoc && messageDoc.senderId) {
          notifyUserSockets(messageDoc.senderId.toString(), SOCKET_EVENTS.UPDATE_STATUS, msg);
        }
      } catch (err) {
        console.error("MESSAGE_DELIVERED error:", err);
      }
    });

    // ---------- MESSAGE_READ ----------
    socket.on(SOCKET_EVENTS.MESSAGE_READ, async (messageId) => {
      try {
        if (!messageId) return;
        await Message.updateOne(
          { _id: messageId, senderId: { $ne: userId } },
          {
            $set: { status: "read" },
            $addToSet: { readBy: userId },
          }
        );

        // notify sender(s) about read
        const msg = { messageId, status: "read" };
        const messageDoc = await Message.findById(messageId).lean();
        if (messageDoc && messageDoc.senderId) {
          notifyUserSockets(messageDoc.senderId.toString(), SOCKET_EVENTS.UPDATE_STATUS, msg);
        }
      } catch (err) {
        console.error("MESSAGE_READ error:", err);
      }
    });

    // ---------- OTHER EVENTS: typing / stopTyping (optional) ----------
    socket.on(SOCKET_EVENTS.TYPING || "typing", ({ chatRoomId }) => {
      if (!chatRoomId) return;
      // broadcast typing to everyone in the room except the sender
      socket.to(chatRoomId).emit(SOCKET_EVENTS.TYPING || "typing", { chatRoomId, userId });
    });

    socket.on(SOCKET_EVENTS.STOP_TYPING || "stopTyping", ({ chatRoomId }) => {
      if (!chatRoomId) return;
      socket.to(chatRoomId).emit(SOCKET_EVENTS.STOP_TYPING || "stopTyping", { chatRoomId, userId });
    });

    // ---------- DISCONNECT ----------
    socket.on(SOCKET_EVENTS.DISCONNECT, (reason) => {
      console.log(`❌ Socket disconnected: ${socket.id} user=${userId} reason=${reason}`);
      if (userId) removeUserSocket(userId, socket.id);

      // Optional: broadcast user's offline presence to friends (if implemented)
      // e.g. io.emit(SOCKET_EVENTS.USER_OFFLINE, { userId });
    });

    // Clean up if socket disconnects unexpectedly
    socket.on("error", (err) => {
      console.error(`Socket error on ${socket.id}:`, err);
    });
  });

  // Global error handler for io
  io.on("error", (err) => {
    console.error("Socket server global error:", err);
  });

  // Expose internal helper for debugging if needed (optional)
  io._userSockets = userSockets;
};