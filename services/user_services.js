import UserModel from "../models/user_model.js"
import jwt from "jsonwebtoken"
import TempUserModel from "../models/temp_user_model.js";

class UserService{

    static async signUp(username, fullname, email, password, photo) {
        try {
            const createUser = new UserModel({username, fullname, email, password, photo})
            return await createUser.save()
        } catch (error) {
            throw error
        }
    }

static async checkUserExist(email) {
    const user = await UserModel.findOne({ email: email });
    console.log("Found user from DB:", {
        _id: user?._id,
        email: user?.email,
        entireDoc: user ? JSON.parse(JSON.stringify(user)) : null
    });
    return user;
}

    static async generateToken(tokenData, secretKey, jwt_expire) {
        return jwt.sign(tokenData, secretKey, {expiresIn: jwt_expire})
    }

    static async storeTempUser(username, fullname, email, password, photo, otp) {
        try {
            // Optional: delete existing temp user if re-registering
            await TempUserModel.findOneAndDelete({ email });
        
            const tempUser = new TempUserModel({
              username,
              fullname,
              email,
              password,
              photo,
              otp,
            });
        
            await tempUser.save();
            return true;
          } catch (err) {
            console.error("Error storing temp user:", err);
            throw err;
          }
    }

    static async getTempUserByEmail(email) {
        return await TempUserModel.findOne({email})
    }

}

export default UserService