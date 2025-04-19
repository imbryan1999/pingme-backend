// import controller from "../controller/user_controller.js"
import {register, login, verifyOtp} from "../controller/user_controller.js"
import express from "express"

const router = express.Router()

router.post('/register_user', register)
router.post('/login', login)
router.post('/verifyOtp', verifyOtp)

export default router