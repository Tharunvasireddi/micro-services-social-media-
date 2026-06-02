import logger from "../utils/logger";

const authenticateRequest = (req, res, next) => {
	const userId = req.headers["x-user-id"];

	if (!userId) {
		logger.warn(`Access attempted without user ID`);
		return res.status(401).json({
			success: false,
			message: "authentication is required! please login to continue",
		});
	}
	req.user = { userId };
	next();
};

export default authenticateRequest;
