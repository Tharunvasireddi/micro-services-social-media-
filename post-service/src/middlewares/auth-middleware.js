const authenticateRequest = async (req, res, next) => {
	const userId = req.headers["x-user-id"];

	if (!userId) {
		logger.warn("Access attempted without user Id");
		return res.status(401).json({
			success: false,
			messagge: "Authentication is required please login to continue",
		});
	}

	req.user = { userId };
	next();
};

export default authenticateRequest;
