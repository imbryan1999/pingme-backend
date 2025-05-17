import ChatRoom from '../models/chatroom_model.js';

// 1. Get or create 1-to-1 chat room
export const getOrCreatePrivateChat = async (req, res) => {
try {
    const { userId1, userId2 } = req.body;

    if (!userId1 || !userId2) {
      return res.status(400).json({ message: 'User IDs required' });
    }

    // Check if room already exists
    let room = await ChatRoom.findOne({
      isGroup: false,
      participants: { $all: [userId1, userId2], $size: 2 }
    }).populate('participants', 'name');

    // Create if not found
    if (!room) {
      room = await ChatRoom.create({
        isGroup: false,
        participants: [userId1, userId2]
      });
      
      // Populate after creation
      room = await ChatRoom.findById(room._id)
        .populate('participants', 'name');
    }

    return res.status(200).json(room);
  } catch (err) {
    console.error('Private chat error:', err);
    res.status(500).json({ error: 'Server error' });
  }

}


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
