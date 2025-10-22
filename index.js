// index.js
import app from "./app.js";
import connectDB from "./config/db_config.js";
import routes from "./routes/user_route.js";
import { Server } from "socket.io";
import http from "http";
import { registerSocketEvents } from "./services/socket_service.js";
import dotenv from "dotenv";

dotenv.config();

const port = process.env.PORT || 6969;

const startServer = async () => {
  try {
    await connectDB(); // ✅ Using your separate db_config.js file
    const server = http.createServer(app);
    const io = new Server(server, {
      cors: {
        origin: "*",
        methods: ["GET", "POST"],
        allowedHeaders: ["Authorization"],
        credentials: true,
      },
    });

    registerSocketEvents(io);

    app.get("/", (req, res) => {
      res.send("Hi, I am Live :)");
    });

    server.listen(port, "0.0.0.0", () => {
      console.log(`🚀 Server started on port ${port}`);
    });
  } catch (err) {
    process.exit(1);
  }
};

startServer();
