import mongoose from "mongoose"
import bcrypt from "bcryptjs"

const userModel = mongoose.Schema(
	{
		name: {
			type: String,
			required: true,
		},
		email: {
			type: String,
			required: true,
			unique: true,
		},
		password: {
			type: string,
			required: true,
		},
		pic: {
			type: string,
			required: true,
			default:
				"https://icon-library.com/images/anonymous-avatar-icon/anonymous-avatar-icon-25.jpg",
		},
		isAdmin: {
			type: Boolean,
			default: false,
			required: true,
		},
	},
	{ timestamps: true }
)

userModel.pre("save", async function (next) {
	this.password = await bcrypt.hash(this.password, 10)
})

const User = mongoose.model("User", userModel)

export default User
