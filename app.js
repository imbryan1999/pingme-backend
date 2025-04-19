// import required packages
import express, { json } from "express"
import cors from "cors"
import body_parser from "body-parser"
import userRoute from "./routes/user_route.js"

// create express app
const app = express()

//middleware
app.use(body_parser.json())
app.use(body_parser.urlencoded({extended: true}))
app.use(json())
app.use(cors())

//import and use routes
app.use("/api/", userRoute)

// export module
export default app  