import express from "express"
import { allMessages, sendMessage } from "../controllers/message.js"

const router = express.Router()

router.route("/").post(sendMessage)
router.route("/:chatId").get(allMessages)


export default router
