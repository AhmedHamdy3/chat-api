import express from "express"
import { login, signup, allUsers } from "../controllers/user.js"
const router = express.Router()

router.route("/").post(signup).get(allUsers)
router.route("/login").post(login)

export default router
