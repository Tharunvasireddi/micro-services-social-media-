import Post from "../models/Post.js";
import logger from "../utils/logger.js";
// create post
const createPostController = async (req, res) => {
	try {
		const { content, mediaIds } = req.body;
		const newPost = new Post({
			user: req.user.userId,
			content: content,
			mediaIds: mediaIds || [],
		});
		await newPost.save();
		logger.info("Post is created successfully", newPost);
		res.status(201).json({
			success: true,
			message: "post is created successfully",
		});
	} catch (error) {
		logger.error("Error while creating post", error);
		res.status(500).json({
			success: false,
			message: "Error while creating the post",
		});
	}
};

// get All post
const getAllPostsController = async (req, res) => {
	try {
	} catch (error) {
		logger.error("Error while creating post", error);
		res.status(500).json({
			success: false,
			message: "Error while fetching  posts",
		});
	}
};
// get single post
const getPostController = async (req, res) => {
	try {
	} catch (error) {
		logger.error("Error while creating post", error);
		res.status(500).json({
			success: false,
			message: "Error while get post by id",
		});
	}
};
// deletepost
const deletePostController = async (req, res) => {
	try {
	} catch (error) {
		logger.error("Error while creating post", error);
		res.status(500).json({
			success: false,
			message: "Error while deleting  the post",
		});
	}
};

export { createPostController };
