import express from "express"
import { login, signup, allUsers } from "../controllers/user.js"
import protect from "../middleware/autherization.js"
const router = express.Router()

router.route("/").post(signup).get(protect, allUsers)
router.route("/login").post(login)

export default router
