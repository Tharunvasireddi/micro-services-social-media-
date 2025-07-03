import express from "express";
import { createPost } from "../controllers/postconroller.js";
// middlewaren this will tell if the user is an auth user or not
import { authenticatedRequest } from "../middlewares/authmiddleware.js";
const postRouter = express();

postRouter.post("/create-post", authenticatedRequest, createPost);

export { postRouter };
