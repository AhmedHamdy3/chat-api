import express from "express"
import dotenv from "dotenv"
import connectDB from "./config/db.js"
import colors from "colors"
import userRouter from "./routes/user.js"
import chatRouter from "./routes/chat.js"
import { notFound, errorHandler } from "./middleware/errorHandler.js"
import protect from "./middleware/autherization.js"

dotenv.config()
const PORT = process.env.PORT || 5000
const app = express()
app.use(express.json())
app.use("/api/user/", userRouter)
app.use("/api/chat/", protect, chatRouter)
app.use(notFound)
app.use(errorHandler)


app.get("/", (req, res) => {
	res.send("testing...")
})

const start = async () => {
	app.listen(PORT, () => console.log(`server listening on ${PORT} ... `.blue.bold))
	await connectDB()
}

start()
