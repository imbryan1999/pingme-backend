// import required packages
import app from "./app.js";
import db from "./config/db_config.js"
import routes from "./routes/user_route.js"
import { Server } from "socket.io";
import http from "http";

// Set the port 
const port = process.env.PORT || 6969;

const server = http.createServer(app)

// attach socket io to server
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
})

// handle socket connection
io.on("connection", (socket) => {
  console.log("A user connected:", socket.id);
  socket.on("newMessage", (data) => {
    console.log("Received:", data);
    io.emit("newMessage", data);
  })

  socket.on("disconnect", () => {
    console.log("User disconnected:", socket.id);
  });
})

app.get("/", (req, res) => {
  res.send("Hi, I am Live :)");
});

// Start the server
server.listen(port, () => {
  console.log(`Server started on port ${port}`); 
});

