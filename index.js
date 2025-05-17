// import required packages
import app from "./app.js";
import db from "./config/db_config.js"
import routes from "./routes/user_route.js"
import { Server } from "socket.io";
import http from "http";
import { registerSocketEvents } from "./services/socket_service.js";
  
// Set the port 
const port = process.env.PORT || 6969;

const server = http.createServer(app)

// attach socket io to server
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
    allowedHeaders: ["Authorization"],
    credentials: true,
  }
});


// register all socket event handlers
registerSocketEvents(io);

app.get("/", (req, res) => {
  res.send("Hi, I am Live :)");
});

// Start the server
server.listen(port, '0.0.0.0', () => {
  console.log(`Server started on port ${port}`); 
});

