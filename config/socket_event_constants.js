// socket_events.js

export const SOCKET_EVENTS = {
    CONNECTION: 'connection',
    DISCONNECT: 'disconnect',
  
    // Chat specific events
    JOIN_ROOM: 'joinRoom',
    LEAVE_ROOM: 'leaveRoom',
    NEW_MESSAGE: 'newMessage',
    SEND_MESSAGE: 'sendMessage',
    MESSAGE_SENT: 'messageSent',
    MESSAGE_RECEIVED: 'messageReceived',
    TYPING: 'typing',
    STOP_TYPING: 'stopTyping',
    UPDATE_STATUS: 'statusUpdated',

    // Private chat
    CREATE_PRIVATE_CHAT: "createPrivateChat",
    PRIVATE_CHAT_CREATED: "privateChatCreated",


    // Delivery and Read Receipts
    MESSAGE_DELIVERED: 'messageDelivered',
    MESSAGE_READ: 'messageRead',
  
    // User presence
    USER_ONLINE: 'userOnline',
    USER_OFFLINE: 'userOffline',
  
    // Error or system events
    ERROR: 'error',
    CONNECT_ERROR: 'connect_error',
  
    // Media & Attachments
    SEND_MEDIA: 'sendMedia',
    MEDIA_RECEIVED: 'mediaReceived',
  
    // Notifications
    NEW_NOTIFICATION: 'newNotification',
  
    // Reactions
    ADD_REACTION: 'addReaction',
    REMOVE_REACTION: 'removeReaction',
  
    // Group Chat
    CREATE_GROUP: 'createGroup',
    ADD_MEMBER: 'addMember',
    REMOVE_MEMBER: 'removeMember',
    GROUP_MESSAGE: 'groupMessage',
  };
  