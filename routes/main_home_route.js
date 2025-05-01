import express from "express"
import { getFriendList } from "../controller/friendlist_controller.js"

const router = express.Router()

router.get('/friendList', getFriendList)

export default router