import express from "express"
import dotenv from "dotenv"
import connectDB from "./config/db.js"
import colors from "colors"
import { Server } from "socket.io"
import http from "http"
import cors from "cors"
import userRouter from "./routes/user.js"
import chatRouter from "./routes/chat.js"
import { notFound, errorHandler } from "./middleware/errorHandler.js"
import protect from "./middleware/autherization.js"

dotenv.config()
const PORT = process.env.PORT || 5000
const corsOptions = {
	origin: process.env.FRONT_END_URL,
	methods: "GET,HEAD,PUT,PATCH,POST,DELETE",
	credentials: true, // enable set cookie
	optionsSuccessStatus: 204,
}

const app = express()
const server = http.createServer(app)
const io = new Server(server, {
	cors: corsOptions,
})
app.use(cors(corsOptions))
app.use(express.json())
app.use("/api/user/", userRouter)
app.use("/api/chats/", protect, chatRouter)
app.use(notFound)
app.use(errorHandler)

app.get("/", (req, res) => {
	res.send("testing...")
})

const start = async () => {
	server.listen(PORT, () =>
		console.log(`server listening on ${PORT} ... `.blue.bold)
	)
	await connectDB()
}

start()
