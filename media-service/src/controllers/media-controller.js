import Media from "../models/Media.js";
import { uploadToCloudinary } from "../utils/cloudinary.js";
import logger from "../utils/logger.js";
const uploadMediaController = async (req, res) => {
	logger.info("Starting media upload");
	try {
		if (!req.file) {
			logger.error("No file found . Please add a file and try again!");
			return res.status(400).json({
				success: false,
				message: "No file found. Please add a file and try again!",
			});
		}
		const { originalname, mimetype, buffer } = req.file;
		const userId = req.user.userId;

		logger.info(`File details: name=${originalname}, type=${mimetype}`);
		logger.info("Uploading to cloudinary starting...");

		const cloudinaryUploadResult = await uploadToCloudinary(req.file);

		logger.info(
			`Cloudinary upload successfully. Public Id: - ${cloudinaryUploadResult.public_id}`,
		);
		const newlyCreateMedia = new Media({
			publicId: cloudinaryUploadResult.public_id,
			originalName: originalname,
			mimeType: mimetype,
			url: cloudinaryUploadResult.secure_url,
			userId,
		});
		res.status(200).json({
			success: true,
			message: "file is uploaded successfully",
			data: newlyCreateMedia,
		});
	} catch (error) {
		logger.error("Error while uploading the media : ", error);
		res.status(429).json({
			success: false,
			message: "Error while uploading media ",
		});
	}
};

const getAllMediaController = async (req, res) => {
	try {
		const result = await Media.find({});
		return res.json({
			result,
		});
	} catch (error) {
		logger.error("Error while fetching media the media : ", error);
		res.status(429).json({
			success: false,
			message: "Error while fetching  media ",
		});
	}
};

export { getAllMediaController, uploadMediaController };
