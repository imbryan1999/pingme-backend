// import required packages
import express, { json } from "express"
import cors from "cors"

// create express app
const app = express()

// middlewar
app.use(json())
app.use(cors())

// export module
export default app