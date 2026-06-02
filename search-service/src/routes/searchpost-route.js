import express from "express";
import searchPostController from "../controllers/search-controller";
import authenticateRequest from "../middlewares/authMiddleware";

const searchRouter = express.Router();

searchRouter.use(authenticateRequest);

searchRouter.get("/post", searchPostController);

export default searchRouter;
