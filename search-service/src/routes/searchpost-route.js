import express from "express";
import searchPostController from "../controllers/search-controller.js";
import authenticateRequest from "../middlewares/authMiddleware.js";

const searchRouter = express.Router();

searchRouter.use(authenticateRequest);

searchRouter.get("/post", searchPostController);

export default searchRouter;
