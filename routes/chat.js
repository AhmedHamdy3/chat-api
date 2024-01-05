import express from "express"
import {
	fetchChats,
	accessChats,
	createGroupChat,
	addToGroup,
	removeFromGroup,
	renameGroup,
	addAdmin,
	removeAdmin,
} from "../controllers/chat.js"

const router = express.Router()

router.route("/").get(fetchChats).post(accessChats)
router
	.route("/group")
	.post(createGroupChat)
	.put(renameGroup)
	.delete(removeFromGroup)
router.route("/group/add").put(addToGroup)
router.route("/group/admin").post(addAdmin).delete(removeAdmin)

export default router
