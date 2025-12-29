import UserModel from "../models/user_model.js";
import ChatRoom from '../models/chatroom_model.js';

export async function getMyChatRooms(req, res, next) {
  try {
    const jwtUserId = req.user._id;
    
    // Find current user
    const currentUser = await UserModel.findOne({ userId: jwtUserId });
    if (!currentUser) {
      return res.status(404).json({
        status: false,
        message: "User not found"
      });
    }
    
    const userObjectId = currentUser._id;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    // Get chat rooms with populated participants
    const chatRooms = await ChatRoom.find({
      participants: userObjectId
    })
      .sort({ lastMessageAt: -1, createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate({
        path: "participants",
        select: "userId fullname username email photo isOnline lastseen",
        model: 'users_collection'
      })
      .lean();

    // Format response
    const formattedChatRooms = chatRooms.map((room) => {
      let otherUser = null;
      let title = "Unknown";
      let avatar = null;
      let userDetails = null;

      if (!room.isGroup && room.participants && room.participants.length > 0) {
        // Find other user in 1:1 chat
        otherUser = room.participants.find(
          (p) => p._id.toString() !== userObjectId.toString()
        );
        
        if (otherUser) {
          title = otherUser.fullname || otherUser.username || otherUser.userId;
          avatar = otherUser.photo;
          
          userDetails = {
            userId: otherUser.userId,
            fullname: otherUser.fullname,
            username: otherUser.username,
            email: otherUser.email,
            photo: otherUser.photo,
            isOnline: otherUser.isOnline,
            lastseen: otherUser.lastseen
          };
        }
      } else if (room.isGroup) {
        title = room.groupName || "Group Chat";
        avatar = room.groupAvatar;
      }

      return {
        chatRoomId: room._id,
        isGroup: room.isGroup,
        title: title,
        avatar: avatar,
        lastMessage: room.lastMessage || "",
        lastMessageAt: room.lastMessageAt || room.createdAt,
        unreadCount: room.unreadCount?.[userObjectId.toString()] || 
                    room.unreadCount?.[jwtUserId] || 0,
        // User info (for 1:1 chats)
        user: userDetails,
        // Group info (for group chats)
        group: room.isGroup ? {
          groupName: room.groupName,
          groupAvatar: room.groupAvatar,
          adminId: room.adminId,
          participantCount: room.participants?.length || 0
        } : null
      };
    });

    // Count total
    const totalChatRooms = await ChatRoom.countDocuments({
      participants: userObjectId
    });

    res.status(200).json({
      status: true,
      statusCode: 200,
      message: "Chat rooms fetched successfully.",
      data: {
        page,
        totalPages: Math.ceil(totalChatRooms / limit),
        totalChatRooms,
        chatRooms: formattedChatRooms,
      },
    });
  } catch (error) {
    console.error("Error in getMyChatRooms:", error);
    res.status(500).json({
      status: false,
      statusCode: 500,
      message: "Internal server error"
    });
  }
}


export async function getFriendList(req, res, next){
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const skip = (page - 1) * limit;
    
        const totalUsers = await UserModel.countDocuments();
        const users = await UserModel.find().skip(skip).limit(limit);
        res.status(200).json({
            status: true,
            statusCode: 200,
            message: 'Friend list fetched successfully.',
            data: {
                page,
                totalPages: Math.ceil(totalUsers / limit),
                totalUsers,
                users
              }
          });

    } catch (error) {
        console.error('Error in friend list', error);
        res.status(500).json({
            status : false,
            statusCode : 500,
            message : 'Internal server error'
        }) 
    }
}