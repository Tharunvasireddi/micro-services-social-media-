export const invalidPostChache = async (req, input) => {
	const chacheKey = `post:${input}`;
	await req.redisClient.del(chacheKey);

	const keys = await req.redisClient.key();
	if (keys.length > 0) {
		await req.redisClient.del(keys);
	}
};
