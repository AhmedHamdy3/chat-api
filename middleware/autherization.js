import jwt from "jsonwebtoken"
import User from "../models/userModel.js"
import asyncHandler from "express-async-handler"

const protect = asyncHandler(async (req, res, next) => {
	const good =
		req.headers &&
		req.headers.authorization &&
		req.headers.authorization.startsWith("Bearer ")

	if (!good) {
		res.status(401)
		throw new Error("Not authorized, no token provided")
	}

	const token = req.headers.authorization.split(" ")[1]

	try {
		const decoded = jwt.verify(token, process.env.JWT_SECRET)
		req.user = await User.findOne({ _id: decoded.id }, { password: 0 })
        // @req.user => user object from database
		next()
	} catch (err) {
		throw new Error("Not authorized, token falid")
	}
})

export default protect