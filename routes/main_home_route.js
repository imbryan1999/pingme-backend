import express from "express"
import { getFriendList, getMyChatRooms } from "../controller/friendlist_controller.js"
import { httpAuthMiddleware } from "../services/auth_middleware.js"

const router = express.Router()

router.get('/friendList', getFriendList);
router.get('/myChatRooms', httpAuthMiddleware, getMyChatRooms);

export default router