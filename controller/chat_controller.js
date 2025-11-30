import ChatRoom from '../models/chatroom_model.js';
import Message from '../models/message_model.js';
import UserModel from '../models/user_model.js';

/**
 * Create or return existing private chat between two users.
 * Ensures:
 * - No duplicate chatRooms
 * - Order-independent searching ($all)
 * - participants field used consistently
 * - Returns fully populated chat
 */
export const getOrCreatePrivateChat = async (userId1, userId2) => {
  try {
    // Convert userId to UserModel ObjectId
    const user1 = await UserModel.findOne({ userId: userId1 });
    const user2 = await UserModel.findOne({ userId: userId2 });

    if (!user1 || !user2) {
      throw new Error('Invalid userId: users not found');
    }

    // Sort ensures consistent order, avoids duplicate rooms
    const participants = [user1._id.toString(), user2._id.toString()].sort();

    // 1️⃣ Try to FIND existing 1-to-1 room
    let room = await ChatRoom.findOne({
      isGroup: false,
      participants: { $all: participants, $size: 2 }
    })
      .populate('participants', 'name username userId avatar');

    // 2️⃣ If NOT FOUND → CREATE NEW
    if (!room) {
      room = await ChatRoom.create({
        isGroup: false,
        participants: participants
      });

      room = await ChatRoom.findById(room._id)
        .populate('participants', 'name username userId avatar');
    }

    return room;

  } catch (err) {
    console.error("🔥 getOrCreatePrivateChat ERROR:", err.message);

    if (err.name === "CastError") {
      throw new Error(`Invalid ObjectId format: ${err.value}`);
    }

    throw new Error("Failed to create or fetch private chat: " + err.message);
  }
};

// export const createAndSendMessage = async ({ senderId, chatRoomId, content }) => {
//   try {
//     if (!senderId || !chatRoomId || !content?.trim()) {
//       throw new Error('All fields (senderId, chatRoomId, content) are required');
//     }

//     // Create message
//     let message = await Message.create({
//       senderId,
//       chatRoomId,
//       content,
//       status: 'sent',
//     });

//     // Populate sender info
//     message = await message.populate([
//       { path: 'senderId', select: 'userId username name' },
//     ]);

//     // Update chat room timestamp
//     await ChatRoom.updateOne(
//       { _id: chatRoomId },
//       { $set: { updatedAt: new Date() } }
//     );

//     return message;

//   } catch (error) {
//     console.error('sendMessage error:', error);
//     throw new Error('Failed to send message: ' + error.message);
//   }
// };


// 2. Create a new group chat

export const createGroupChat = async (req, res) => {
  try {
    const { name, participants, adminId } = req.body;

    if (!name || !participants?.length || !adminId) {
      return res.status(400).json({ message: 'Group name, participants, and adminId required' });
    }

    const room = await ChatRoom.create({
      name,
      isGroup: true,
      participants,
      adminId
    });

    return res.status(201).json(room);
  } catch (err) {
    console.error('Group chat error:', err);
    res.status(500).json({ error: 'Server error' });
  }
};

// 3. Get all chat rooms for a user
export const getUserChatRooms = async (req, res) => {
  try {
    const { userId } = req.params;
    const { page = 1, limit = 10 } = req.query; // Pagination params

    // Validate userId format
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({ error: 'Invalid user ID format' });
    }

    const option = {
      page: parseInt(page),
      limit: parseInt(limit),
      sort: { updatedAt: -1 }, // Sort by most recently active
      populate: [
        {
          path: 'participants',
          select: 'name avatar status',
          match: { _id: { $ne: userId } } // Exclude current user
        },
        {
          path: 'lastMessage',
          select: 'content sender createdAt'
        }
      ]
    }

    // Transform data for frontend
    const transformedChats = result.docs.map(chat => {
      const isGroup = chat.isGroup;
      const chatName = isGroup 
        ? chat.name 
        : chat.participants[0]?.name || 'Deleted User';

      return {
        id: chat._id,
        name: chatName,
        isGroup,
        avatar: isGroup ? chat.avatar : chat.participants[0]?.avatar,
        lastMessage: chat.lastMessage,
        unreadCount: 0 // You'd calculate this from Message model
      };
    });

    return res.status(200).json({
      chats: transformedChats,
      total: result.total,
      pages: result.pages
    });
  
  } catch (err) {
    console.error('Fetch chat rooms error:', err);
    res.status(500).json({ error: 'Server error' });
  }
};
