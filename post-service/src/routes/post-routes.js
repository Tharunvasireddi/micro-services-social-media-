import express from "express";
import { createPostController } from "../controllers/post-controller.js";
import authenticateRequest from "../middlewares/auth-middleware.js";

const postRouter = express.Router();

// this middleware will tell that user is authenticated or not

postRouter.use(authenticateRequest);

postRouter.post("/create-post", createPostController);

export default postRouter;
