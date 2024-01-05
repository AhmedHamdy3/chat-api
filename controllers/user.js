import asyncHandler from "express-async-handler"
import User from "../models/userModel.js"
import generateToken from "../config/generateToken.js"

// @description    Register a new user
// @route          POST /api/user 
// @payload 		[required : {name, email, password}, optional : {pic}]
export const signup = asyncHandler(async (req, res) => {
	const { name, email, password, pic } = req.body
	
	if (!name || !email || !password) {
		res.status(400)
		throw new Error("Please enter required fields")
	}
	const isUserExist = await User.findOne({ email: email })

	if (isUserExist) {
		res.status(400)
		throw new Error("User already exists")
	}

	const user = await User.create({ name, email, password, pic })

	if (user) {
		res.status(201).json({
			id: user._id,
			name: user.name,
			email: user.email,
			pic: user.pic,
			token: generateToken(user._id),
		})
	} else {
		res.status(400)
		throw new Error("process failed :(")
	}
})

// @description         login for existing user
// @route          		POST /api/user/login
// payload				[required : {email, password}]
export const login = asyncHandler(async (req, res) => {
	const { email, password } = req.body

	if (!email || !password) {
		throw new Error("Please enter required fields!")
	}

	const user = await User.findOne({ email })

	if (!user) {
		res.status(400)
		throw new Error("This user does not exists")
	}

	if (!(await user.comparePassword(password))) {
		res.status(400)
		throw new Error("invalid credentials")
	}

	res.status(201).json({
		id: user._id,
		name: user.name,
		email: user.email,
		pic: user.pic,
		token: generateToken(user._id),
	})
})

// @description 		Seach for users by query
// @route 				GET /api/user
export const allUsers = asyncHandler(async (req,res) => {
	const query = req.query.search
	const myId = (req.user && req.user.id) 
	console.log(myId)

	const keyword = query ? {
		$or: [
			{
				name : {$regex : query , $options : "i"}
			},
			{
				email : {$regex: query , $options: "i"}
			}
		]
	} :{};

	const users = await User.find(keyword).where("_id").ne(myId)
	res.status(200).json(users)
})
