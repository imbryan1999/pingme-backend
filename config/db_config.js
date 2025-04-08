// import required packages
import { createConnection } from "mongoose";
import dotenv from "dotenv"
dotenv.config()

    // Connect to MongoDB
    const connection = createConnection(process.env.MONGODB_URL);
    
    connection.on('open', () => {
    console.log('MongoDB Connected...')
    })

  connection.on('error', (error) => {
    console.log('MongoDB connection error:', error);
})

export default connection