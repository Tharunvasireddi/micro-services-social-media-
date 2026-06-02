import Post from "../models/Post.js";
import { invalidPostChache } from "../utils/invalid-cache.js";
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
		await invalidPostChache(req, newPost._id.toString());
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
		// pagenation
		const page = parseInt(req.query.page) || 1;
		const limit = parseInt(req.query.limit) || 10;
		const startIndex = (page - 1) * limit;

		// checking first in the chache of redis
		const chacheKey = `posts:${page}:${limit}`;
		const chachedPosts = await req.redisClient.get(chacheKey);

		if (chachedPosts) {
			return res.json(JSON.parse(chachedPosts));
		}

		const posts = await Post.find()
			.sort({ createdAt: -1 })
			.skip(startIndex)
			.limit(limit);
		console.log("this is post controller", posts);
		const totalNoOfPosts = await Post.countDocuments();
		const result = {
			posts,
			currentPage: page,
			totalPages: Math.ceil(totalNoOfPosts / limit),
			totalPosts: totalNoOfPosts,
		};

		// setting to chache (save to the redis chache)
		await req.redisClient.setex(chacheKey, 300, JSON.stringify(result));

		res.json({
			success: true,
			message: "success fully fethed",
			result: result,
		});
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
		const postId = req.params.id;
		const cacheKey = `post:${postId}`;
		const chachedPost = await req.redisClient.get(chacheKey);
		if (chachedPost) {
			return res.json(JSON.parse(chachedPost));
		}
		const singlePost = await Post.findById(postId);
		if (!singlePost) {
			return res.status(404).json({
				success: false,
				message: "Post not found",
			});
		}
		await req.redisClient.set(chacheKey, JSON.stringify(singlePost));
		res.json(singlePost);
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
		const postId = req.params.id;
		await Post.findByIdAndDelete(postId);
	} catch (error) {
		logger.error("Error while creating post", error);
		res.status(500).json({
			success: false,
			message: "Error while deleting  the post",
		});
	}
};

export { createPostController, getAllPostsController, deletePostController };
