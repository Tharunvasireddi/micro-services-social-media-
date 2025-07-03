import logger from "../utils/logger.js";
import { validateCreatePost } from "../utils/validation.js";
import Post from "../models/Post.js";
const createPost = async (req, res) => {
  logger.info("create post end point hit..");
  const { error } = validateCreatePost(req.body);
  if (error) {
    logger.warn("Validation error", error.details[0].message);
    return res.status(400).json({
      success: false,
      message: error.details[0].message,
    });
  }
  try {
    const { content, mediaIds } = req.body;
    // if(content && mediaIds){
    //     logger.warn()
    // }
    const newlyCreatedPost = new Post({
      user: req.user.userId,
      content,
      mediaIds: mediaIds || [],
    });
    await newlyCreatedPost.save();
    logger.info("Post created successfully");
    res.status(201).json({
      succues: true,
      message: "post is created successfully",
      newlyCreatedPost,
    });
  } catch (error) {
    logger.error("Error creating  post ", error);
    res.status(500).json({
      success: false,
      message: "Error creating  post ",
    });
  }
};

export { createPost };
