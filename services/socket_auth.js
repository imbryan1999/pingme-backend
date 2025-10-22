// utils/socketAuth.js
import jwt from 'jsonwebtoken';
import User from '../models/user_model.js';
import dotenv from 'dotenv';
dotenv.config();

export const socketAuthMiddleware = (socket, next) => {
  console.log("🛡️ Running socket auth middleware...");

  const token = socket.handshake.auth?.token || 
                socket.handshake.query?.token ||
                socket.handshake.headers?.authorization?.split(' ')[1];    

  if (!token) {
    console.log('⚠️ No token provided');
    return next(new Error('Authentication error: No token provided'));
  }

  const JWT_SECRET = process.env.JWT_SECRET || 'secret';
  jwt.verify(token, JWT_SECRET, (err, decoded) => {
    if (err) {
      console.log('⚠️ Invalid token:', err.message);
      return next(new Error('Authentication error: Invalid token'));
    }

    socket.user = decoded;
    console.log('✅ Authenticated user:', {
      id: decoded._id,
      email: decoded.email
    });
    next();
  });
};
