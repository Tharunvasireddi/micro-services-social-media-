import Search from "../models/SearchPost";

const searchPostController = async (req, res) => {
	logger.info("search endpoint hit..");
	try {
		const { query } = req.query;
		const results = await Search.find(
			{
				$text: { $search: query },
			},
			{
				score: { $meta: "textScore" },
			},
		)
			.sort({ score: { $meta: "textScore" } })
			.limit(10);
		res.json(results);
	} catch (error) {
		logger.error("Error while searching post", error);
		res.status(500).json({
			success: false,
			message: "Error while searching post",
		});
	}
};

export default searchPostController;
