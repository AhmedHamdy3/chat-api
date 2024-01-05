import asyncHandler from "express-async-handler"
import User from "../models/userModel.js"
import Chat from "../models/chatModel.js"

// @description      Get your chats
// @route            GET api/chats
export const fetchChats = asyncHandler(async (req, res) => {})
// @description      Access a specific Chat
// @route            POST api/chats
// @payload           userId => Id of the user you want to access his chat
export const accessChats = asyncHandler(async (req, res) => {
	const { userId } = req.body
	const myId = req.user && req.user.id

    // validate on Ids and user existence
	if (!myId) {
		res.status(400)
		throw new Error("Not authenticated")
	}

	if (!userId) {
		res.status(400)
		throw new Error("userId is required but was not provided")
	}

	const userExist = await User.findById(userId)
	if (!userExist) {
		res.status(404)
		throw new Error("This user does not exist")
	}

    // search for the chat which includes both of us and not a group chat
	let findChat = await Chat.findOne({
		isGroupChat: false,
		$and: [
			{ users: { $elemMatch: { $eq: myId } } },
			{ users: { $elemMatch: { $eq: userId } } },
		],
	})
		.populate("users", "-password")
		.populate("latestMessage")



    // Populate the sender from the User model
	findChat = await User.populate(findChat, {
		path: "latestMessage.sender",
		select: "name email pic",
	})

    // if chat is already existing, return it 
	if (findChat) return res.status(200).json(findChat)

	const chatData = {
		chatName: "two users chat",
		isGroupChat: false,
		users: [userId, myId],
	}

    // Create the new chat for the first time
	try {
		const createdChat = await Chat.create(chatData)
		console.log(createdChat)
		const fullChat = await Chat.findOne({ _id: createdChat._id }).populate(
			"users",
			"-password"
		)
		console.log(fullChat)
		res.status(200).json(fullChat)
	} catch (err) {
		res.status(400)
		throw new Error(err.message)
	}
})
// @description      Creating a new Group chat
// @route            POST api/chats/group
export const createGroupChat = asyncHandler(async (req, res) => {})
// @description      Add members to group chat
// @route            PUT api/chats/group/addmember
// @payload
export const addToGroup = asyncHandler(async (req, res) => {})
// @description      Remove member from group
// @route            DELETE api/chats/group
export const removeFromGroup = asyncHandler(async (req, res) => {})
// @description      Change the group name
// @route            PUT api/chats/group
export const renameGroup = asyncHandler(async (req, res) => {})
