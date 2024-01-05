import asyncHandler from "express-async-handler"
import User from "../models/userModel.js"
import Chat from "../models/chatModel.js"

// @description      Get your chats
// @route            GET api/chats
export const fetchChats = asyncHandler(async (req, res) => {
	const myId = req.user && req.user.id
	try {
		let chats = await Chat.find({ users: { $elemMatch: { $eq: myId } } })
			.populate("users", "-password")
			.populate("groupAdmin", "-password")
			.populate("latestMessage")
			.sort({ updatedAt: -1 })

		chats = await User.populate(chats, {
			path: "latestMessage.sender",
			select: "name email pic",
		})
		res.status(200).json(chats)
	} catch (err) {
		res.status(400)
		throw new Error(err.message)
	}
})
// @description      Access a specific Chat
// @route            POST api/chats
// @payload          userId => Id of the user you want to access his chat
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
// @payload          required => {name:string, users:list[user]}
export const createGroupChat = asyncHandler(async (req, res) => {
	const myId = req.user && req.user.id
	let { name, users } = req.body
	if (!name || !users) {
		res.status(400)
		throw new Error("name and users must be provided")
	}

	users = JSON.parse(users)
	console.log(users)
	const filteredUsers = []
	for (let id of users) {
		let isExist = false
		try {
			isExist = await User.findById(id)
		} catch (err) {}
		if (isExist) filteredUsers.push(id)
	}
	if (filteredUsers.length < 2) {
		res.status(400)
		throw new Error("More than 2 users are required to form a group chat")
	}
	filteredUsers.push(myId)

	try {
		const groupChat = await Chat.create({
			chatName: name,
			isGroupChat: true,
			users: filteredUsers,
			groupAdmin: req.user,
		})
		const fullChat = await Chat.findById(groupChat._id)
			.populate("users", "-password")
			.populate("groupAdmin", "-password")

		res.status(200).json(fullChat)
	} catch (err) {
		res.status(400)
		throw new Error(err.message)
	}
})
// @description      Add members to group chat
// @route            PUT api/chats/group/addmember
// @payload          required => {usersIds: list[ObjectId] , groupId: ObjectId}
export const addToGroup = asyncHandler(async (req, res) => {
	const { usersIds, groupId } = req.body

	const ids = JSON.parse(usersIds)
	let added
	try {
		added = await Chat.findByIdAndUpdate(
			groupId,
			{
				$addToSet: { users: { $each: ids } },
			},
			{ new: true }
		)
			.populate("users", "-password")
			.populate("groupAdmin", "-password")
	} catch (err) {
		res.status(404)
		throw new Error(err.message)
	}

	if (!added) {
		res.status(404)
		throw new Error("Chat not found")
	}
	res.json(added)
})
// @description      Remove member from group
// @route            DELETE api/chats/group
// @payload          required => {usersIds: list[ObjectId] , groupId: ObjectId}
export const removeFromGroup = asyncHandler(async (req, res) => {
	const { usersIds, groupId } = req.body

	const ids = JSON.parse(usersIds)
	let removed
	try {
		removed = await Chat.findByIdAndUpdate(
			groupId,
			{
				$pull: { users: { $in: ids } },
			},
			{ new: true }
		)
			.populate("users", "-password")
			.populate("groupAdmin", "-password")
	} catch (err) {
		res.status(404)
		throw new Error(err.message)
	}

	if (!removed) {
		res.status(404)
		throw new Error("Chat not found")
	}
	res.json(removed)
})
// @description      Change the group name
// @route            PUT api/chats/group
// @payload          required => {groupId : ObjectId, newName : String}
export const renameGroup = asyncHandler(async (req, res) => {
	const { groupId, newName } = req.body
	let updated = undefined
	try {
		updated = await Chat.findByIdAndUpdate(
			groupId,
			{ chatName: newName },
			{ new: true }
		)
			.populate("users", "-password")
			.populate("groupAdmin", "-password")
	} catch (err) {
		res.status(404)
		throw new Error(err.message)
	}
	if (!updated) {
		res.status(404)
		throw new Error("Chat not found")
	}
	res.status(200).json(updated)
})
