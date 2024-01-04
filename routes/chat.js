import express from "express"
import {
	fetchChats,
	accessChats,
	createGroupChat,
	addToGroup,
	removeFromGroup,
	renameGroup,
} from "../controllers/chat.js"

const router = express.Router()

router.route("/").get(fetchChats).post(accessChats)
router
	.route("/group")
	.post(createGroupChat)
	.put(renameGroup)
	.delete(removeFromGroup)
router.route("group/addmember").put(addToGroup)

export default router
