import mongoose from "mongoose"
import dotenv from "dotenv"

dotenv.config()

const connectDB = async () => {
	try {
		const conn = await mongoose.connect(process.env.MONGO_URI)
		console.log(`MongoDB Connect ${conn.connection.host}`.yellow.bold)
	} catch (err) {
		throw new Error("Database connection failed: " + err)
	}
}


export default connectDB