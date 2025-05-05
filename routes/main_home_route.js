import express from "express"
import { getFriendList } from "../controller/friendlist_controller.js"

const router = express.Router()

router.get('/friendList', getFriendList)
// https://youtu.be/_mR6bY-ndso?si=ypCpW20bCRfX73OM
export default router