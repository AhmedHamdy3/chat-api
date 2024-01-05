import asyncHandler from "express-async-handler"
import Message from "../models/messageModel.js"
import Chat from "../models/chatModel.js"
import User from "../models/userModel.js"

// @description         Get all messages from a specific chat
// @route               GET api/message/:chatId
export const allMessages = asyncHandler(async (req, res) => {
	const { chatId } = req.params
	try {
		const messages = await Message.find({ chat: chatId })
			.populate("sender", "name email pic")
			.populate("chat")

		res.status(200).json(messages)
	} catch (err) {
		res.status(400)
		throw new Error(err.message)
	}
})

// @description         Send a message takes the chat id => [the group id 'createGroupChat' || the chat id after 'accessChat']
// @route               POST api/message
// @patload             Required => {chatId: ObjectId, content: String}
export const sendMessage = asyncHandler(async (req, res) => {
	const { content, chatId } = req.body
	const myId = req.user && req.user.id

	if (!chatId || !content) {
		res.status(400)
		throw new Error("Invalid data received")
	}

	const isChatExist = await Chat.findById(chatId)
	if (!isChatExist) {
		res.status(404)
		throw new Error("This chat does not exist")
	}

	try {
		let message = await Message.create({
			sender: myId,
			content: content,
			chat: chatId,
		})
		message = await message.populate("sender", "name email pic")

		message = await message.populate("chat")

		message = await User.populate(message, {
			path: "chat.users",
			select: "name email pic",
		})

		const chat = await Chat.findByIdAndUpdate(chatId, { latestMessage: message }, {new : true })
        console.log(chat)
		res.status(200).json(message)
	} catch (err) {
		res.status(400)
		throw new Error(err.message)
	}
})
