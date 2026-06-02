import express from "express";
import multer from "multer";
import {
	getAllMediaController,
	uploadMediaController,
} from "../controllers/media-controller.js";
import authenticateRequest from "../middlewares/auth-middleware.js";
import logger from "../utils/logger.js";
const mediaRouter = express.Router();

mediaRouter.use(authenticateRequest);

// configuring multer middelware to upload image

const upload = multer({
	storage: multer.memoryStorage(),
	limits: {
		fileSize: 5 * 1024 * 1024,
	},
}).single("file");

mediaRouter.post(
	"/upload",
	(req, res, next) => {
		upload(req, res, function (err) {
			if (err instanceof multer.MulterError) {
				logger.error("Multer error while uploading :", err);
				return res.status(400).json({
					message: "multer error while uploading",
					error: err.message,
					stack: err.stack,
				});
			} else if (err) {
				logger.error("Unknow error while uploading : ", err);
				return res.status(500).json({
					message: "Unkown error while uploading ",
					error: err.message,
					stack: err.stack,
				});
			}
			if (!req.file) {
				return res.status(400).json({
					message: "No file ",
				});
			}
			next();
		});
	},
	uploadMediaController,
);

mediaRouter.get("/get", getAllMediaController);

export default mediaRouter;
