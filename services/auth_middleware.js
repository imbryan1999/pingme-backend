import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
dotenv.config();

export const httpAuthMiddleware = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    console.log("Auth Header:", authHeader);

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({
        status: false,
        statusCode: 401,
        message: "Authorization token missing"
      });
    }

    const token = authHeader.split(" ")[1];
    console.log("Token:", token); 
    console.log("JWT_SECRET exists:", !!'secret');
    
    const decoded = jwt.verify(token, 'secret');
    console.log("Decoded:", decoded);
    
    req.user = decoded;
    next();
  } catch (error) {
    console.error("JWT Error:", error.message);
    return res.status(401).json({
      status: false,
      statusCode: 401,
      message: "Invalid or expired token"
    });
  }
};