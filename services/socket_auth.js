// utils/socketAuth.js
import jwt from 'jsonwebtoken';
import User from '../models/user_model.js';

export const socketAuthMiddleware = (socket, next) => {
  console.log("🛡️ Running socket auth middleware...");

  const token = socket.handshake.auth?.token || 
                socket.handshake.query?.token ||
                socket.handshake.headers?.authorization?.split(' ')[1];    

  if (!token) {
    console.log('⚠️ No token provided');
    return next(new Error('Authentication error: No token provided'));
  }

  jwt.verify(token, 'secret', (err, decoded) => {
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
