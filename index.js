// import required packages
import app from "./app.js";

// Set the port 
const port = process.env.PORT || 6969;

app.get("/", (req, res) => {
    res.send("Hi, I am Live :)")
})

// Start the server
app.listen(port, () => {
  console.log(`Server started on port ${port}`); 
});

