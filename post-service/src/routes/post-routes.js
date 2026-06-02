import express from "express";
import {
	createPostController,
	deletePostController,
	getAllPostsController,
} from "../controllers/post-controller.js";
import authenticateRequest from "../middlewares/auth-middleware.js";

const postRouter = express.Router();

// this middleware will tell that user is authenticated or not

postRouter.use(authenticateRequest);

postRouter.post("/create-post", createPostController);
postRouter.get("/all-posts", getAllPostsController);
postRouter.delete("/delete/:id", deletePostController);
export default postRouter;
