import UserModel from "../models/user_model.js";

export async function getFriendList(req, res, next){
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const skip = (page - 1) * limit;
    
        const totalUsers = await UserModel.countDocuments();
        const users = await UserModel.find().skip(skip).limit(limit);
        res.status(200).json({
            status: true,
            statusCode: 200,
            message: 'Friend list fetched successfully.',
            data: {
                page,
                totalPages: Math.ceil(totalUsers / limit),
                totalUsers,
                users
              }
          });

    } catch (error) {
        console.error('Error in friend list', error);
        res.status(500).json({
            status : false,
            statusCode : 500,
            message : 'Internal server error'
        }) 
    }
}