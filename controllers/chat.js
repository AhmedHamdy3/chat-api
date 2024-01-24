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
		const fullChat = await Chat.findOne({ _id: createdChat._id }).populate(
			"users",
			"-password"
		)
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
	users.push(myId)
	const filteredUsers = []
	const mySet = new Set()
	for (let id of users) {
		let isExist = false
		try {
			isExist = await User.findById(id)
		} catch (err) {}
		if (isExist && !mySet.has(id)) {
			filteredUsers.push(id)
			mySet.add(id)
		}
	}
	if (filteredUsers.length < 3) {
		res.status(400)
		throw new Error("More than 2 users are required to form a group chat")
	}

	try {
		const groupChat = await Chat.create({
			chatName: name,
			isGroupChat: true,
			users: filteredUsers,
			groupAdmin: [req.user],
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
// @route            PUT api/chats/group/add
// @payload          required => {usersIds: list[ObjectId] , groupId: ObjectId}
export const addToGroup = asyncHandler(async (req, res) => {
	const { usersIds, groupId } = req.body
	const myId = req.user && req.user.id
	// check if you are an admin
	await checkAdmin("Only admins can add members from group chat",req, res)

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
	const myId = req.user && req.user.id
	const ids = JSON.parse(usersIds)

	let chat
	try {
		chat = await Chat.findById(groupId)
	} catch (err) {
		throw new Error("Can't find the group chat, something went wrong")
	}
	console.log(chat)

	// Leave group
	const isLeaving = ids.some((id) => id == myId)
	if (isLeaving) {
		if (chat.groupAdmin.some((adminId) => adminId == myId)) {
			if (chat.users.length == 1) {
				try {
					const deleted = await Chat.findByIdAndDelete(groupId, { new: true })
					return res.json({
						success: true,
						message: "The group has been deleted",
					})
				} catch (err) {
					throw new Error("Can't delete the group, something went wrong")
				}
			}
			if (chat.groupAdmin.length == 1) {
				throw new Error(
					"You must select another member to be admin to leave the group"
				)
			}
		} else {
			const left = await Chat.findByIdAndUpdate(
				groupId,
				{
					$pull: {
						users: { $eq: myId },
					},
				},
				{ new: true }
			)
			return res
				.status(200)
				.json({ success: true, message: "You left this group successfully" })
		}
	}

	await checkAdmin("Only admins can remove members from group chat", req, res)
	let removed
	try {
		removed = await Chat.findByIdAndUpdate(
			groupId,
			{
				$pull: { users: { $in: ids }, groupAdmin: { $in: ids } },
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

// @description      Make a member as admin
// @route            POST api/chats/group/admin
// @payload          required => {usersIds: list[ObjectId] , groupId: ObjectId}
export const addAdmin = asyncHandler(async (req, res) => {
	let { usersIds, groupId } = req.body
	// check if you already admin
	const groupChat = await checkAdmin("Only admins can add admins from group chat",req, res)

	usersIds = JSON.parse(usersIds)

	const isUsersFromChat = usersIds.every((id) =>
		groupChat.users.some((userId) => userId == id)
	)
	if (!isUsersFromChat) {
		res.status(400)
		throw new Error("All users must exist in the chat to be admins")
	}
	const updated = await Chat.findByIdAndUpdate(
		groupId,
		{
			$addToSet: { groupAdmin: { $each: usersIds } },
		},
		{ new: true }
	)
		.populate("users", "-password")
		.populate("groupAdmin", "-password")
	res.status(200).json(updated)
})
// @description      Make a member as admin
// @route            DELETE api/chats/group/admin
// @payload          required => {usersIds: list[ObjectId] , groupId: ObjectId}
export const removeAdmin = asyncHandler(async (req, res) => {
	let { usersIds, groupId } = req.body
	// check if you already admin
	const groupChat = await checkAdmin(
		"Only admins can remove admins from group chat",
		req,
		res
	)

	usersIds = JSON.parse(usersIds)

	const isUsersFromChat = usersIds.every((id) =>
		groupChat.users.some((userId) => userId == id)
	)
	if (!isUsersFromChat) {
		res.status(400)
		throw new Error("All users must exist in the chat to remove from admins")
	}

	const allAminsToBeRemoved = groupChat.groupAdmin.every((admin) =>
		usersIds.some((id) => id == admin)
	)
	if (allAminsToBeRemoved) {
		res.status(400)
		throw new Error("Can't remove All admins")
	}

	const updated = await Chat.findByIdAndUpdate(
		groupId,
		{
			$pull: { groupAdmin: { $in: usersIds } },
		},
		{ new: true }
	)
		.populate("users", "-password")
		.populate("groupAdmin", "-password")
	res.status(200).json(updated)
})

// static methods => checks if you already admin and returns the chat group
const checkAdmin = asyncHandler(async (err, req, res) => {
	const { usersIds, groupId } = req.body
	const myId = req.user && req.user.id
	if (!groupId) {
		res.status(400)
		throw new Error("group id must be provided")
	}
	if (!usersIds) {
		res.status(400)
		throw new Error("no users provided")
	}

	let findGroupChat
	try {
		findGroupChat = await Chat.findById(groupId)
	} catch (err) {
		res.status(404)
		throw new Error("This chat does not exist")
	}
	if (!findGroupChat) {
		res.status(404)
		throw new Error("This chat does not exist")
	}
	const isAdmin = findGroupChat.groupAdmin.some((admin) => admin == myId)
	if (!isAdmin) {
		return res.status(400).json({
			success: false,
			message: err, 
		})
	}
	return findGroupChat
})