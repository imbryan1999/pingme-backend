import UserService from "../services/user_services.js";
import jwt from "jsonwebtoken"
import dotenv from 'dotenv';
dotenv.config();
import UserModel from "../models/user_model.js"
import otpGenerator from 'otp-generator';
import { sendOTPEmail } from "../services/email_service.js";

// user signup controller
export async function register(req, res, next) {
    console.log(req.body)
    try {
        const {username, fullname, email, password, photo} = req.body

        // check user exist
        const existUser = await UserService.checkUserExist(email)
        if(existUser){
            return res.status(400).json({
                status: false,
                statusCode: 400,
                message: "User Already Exist."
            })
        }

        // generate OTP
        // const otp = otpGenerator.generate(4, {
        //     upperCaseAlphabets: false,
        //     lowerCaseAlphabets: false,
        //     specialChars: false,
        //     digits: true
        // });

        // const emailSent = await sendOTPEmail(email, otp)
        
        // if(!emailSent) {
        //     return res.status(500).json({
        //         status: false,
        //         statusCode: 500,
        //         message: "Failed to send OTP email.",
        //     });
        // }

        // store unverified user + otp in DB (you can hash the OTP for security)
        await UserService.storeTempUser(username, fullname, email, password, photo, "0000");
        res.status(200).json({
            status: true,
            statusCode: 200,
            message: "OTP sent to email. Please verify to complete registration.",
        })

    } catch (error) {
        console.error('Error in user signup:', error);
        res.status(500).json({
            status : false,
            statusCode : 500,
            message : 'Internal server error'
        })    
    }
}

export async function login(req, res, next) {
    console.log(req.body)
    try {
        const {email, password} = req.body
        const existingUser = await UserService.checkUserExist(email)
        console.log("--------------- user --------------", existingUser)

        if (!existingUser) {
            return res.status(401).json({
                status: false,
                statusCode: 401,
                message: 'User not exists'
            })
        }

        const isMatch = await existingUser.comparePassword(password)
        if(isMatch == false){
            return res.status(401).json({
                status: false, 
                message: 'Invalid Password' 
              });
        }

        let tokenData = {_id: existingUser.userId, email: existingUser.email}        
    const JWT_SECRET = process.env.JWT_SECRET || 'secret';
    const token = await UserService.generateToken(tokenData, JWT_SECRET, '24h')

        const userInfo = {
            userId : existingUser.userId,
            username : existingUser.username,
            fullname : existingUser.fullname,
            email : existingUser.email,
            photo : existingUser.photo ?? "",
            token : token
        }

        console.log(res)
        res.status(200).json({
            statusCode: 200,
            status : true,
            message: 'User login Successfully',
            data: userInfo    
        })

    } catch (error) {
        console.error('Error in user signin:', error);
        res.status(500).json({ error: 'Internal server error' });
        next(error)
    }
}

export async function verifyOtp(req, res) {
    console.log(req);
    try {
        const {email, otp} = req.body
        const userData = await UserService.getTempUserByEmail(email)
        if(!userData || userData.otp !== otp) {
            return res.status(400).json({
                status: false,
                message: "Invalid OTP.",
            });
        }
        
        const successResponse = await UserService.signUp(userData.username, userData.fullname, userData.email, userData.password, userData.photo)
        let tokenData = {_id: successResponse.userId, email: successResponse.email}
    const JWT_SECRET = process.env.JWT_SECRET || 'secret';
    const token = await UserService.generateToken(tokenData, JWT_SECRET, '24h')

        //send success response
        res.status(200).json({
          statusCode: 200,
          status: true,
          message: "User Registered Successfully.",
          data: {
            "userId" : successResponse.userId,
            "username" : successResponse.username,
            "fullname": successResponse.fullname,
            "email" : successResponse.email,
            "photo" : successResponse.photo,
            "token" : token
          }  
        })

    } catch (error) {
        console.error("Error in OTP verification:", error);
        res.status(500).json({
            status: false,
            message: "Internal server error",
        });   
    }
}