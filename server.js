import express from "express"
import dotenv from "dotenv"
import connectDB from "./config/db.js"
import colors from "colors"

dotenv.config()
const PORT = process.env.PORT || 5000
const app = express()

app.get("/", (req, res) => {
	res.send("addafdsnj")
})

const start = async () => {
	app.listen(PORT, () => console.log(`server listening on ${PORT} ... `.blue.bold))
	await connectDB()
}

start()
