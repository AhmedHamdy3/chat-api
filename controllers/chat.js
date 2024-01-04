import asyncHandler from "express-async-handler"


// @description      Get your chats
// @route            GET api/chats
export const fetchChats = asyncHandler(async (req, res) => {})
// @description      Access a specific Chat
// @route            GET api/chats
//@payload
export const accessChats = asyncHandler(async (req, res) => {})
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
