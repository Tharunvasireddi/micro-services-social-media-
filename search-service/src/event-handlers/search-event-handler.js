import Search from "../models/SearchPost.js";
import logger from "../utils/logger.js";

async function handlePostCreatetd(event) {
	try {
		const newSearchPost = new Search({
			postId: event.postId,
			userId: event.userId,
			content: event.content,
			createdAt: event.createdAt,
		});
		await newSearchPost.save();
	} catch (error) {
		logger.error(error, "Error handling post creation event");
	}
}

async function handlePostDeleted(event) {
	try {
		await Search.findOneAndDelete({ postId: event.postId });
	} catch (error) {
		logger.error(error, "Error handling post deletion event");
	}
}

export { handlePostCreatetd, handlePostDeleted };
