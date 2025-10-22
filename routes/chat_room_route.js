import express from "express"
import { getOrCreatePrivateChat, createGroupChat, getUserChatRooms } from "../controller/chat_controller.js"

const router = express.Router();

// router.post('/private', getOrCreatePrivateChat);
// router.get('/user/:userId', getUserChatRooms);
// router.post('/group', createGroupChat);

export default router;