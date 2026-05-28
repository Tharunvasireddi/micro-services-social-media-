import dotenv from "dotenv";
dotenv.config();

import cors from "cors";
import express from "express";
import rateLimit from "express-rate-limit";
import helmet from "helmet";
import Redis from "ioredis";
import mongoose from "mongoose";
import { RedisStore } from "rate-limit-redis";
import errorHandler from "./middlewares/error-handler.js";
import postRouter from "./routes/post-routes.js";
import logger from "./utils/logger.js";
const app = express();

const port = process.env.PORT || 3002;

mongoose
	.connect(process.env.MONGO_URL)
	.then(() => logger.info("Connected to mongodb"))
	.catch((e) => logger.error("Mongo connection error", e));

const redisClient = new Redis(process.env.REDIS_URL);

app.use(express.json());
app.use(helmet());
app.use(cors());

// Ip based rateliminting for senstive endpoint
const senstiveEndPointsLimiter = rateLimit({
	windowMs: 15 * 60 * 1000,
	max: 50,
	standardHeaders: true,
	legacyHeaders: false,
	handler: (req, res) => {
		logger.warn(`Senstive endpoint rate limit exceed for IP :${req.ip}`);
		res.status(429).json({
			success: false,
			message: "too many requests",
		});
	},
	store: new RedisStore({
		sendCommand: (...args) => redisClient.call(...args),
	}),
});

app.use("/api/posts/create-post", senstiveEndPointsLimiter);

app.use(
	"/api/posts",
	(req, res, next) => {
		req.redisClient = redisClient;
		next();
	},
	postRouter,
);

app.use(errorHandler);

app.listen(port, () => {
	logger.info(`post service running on port ${port}`);
});

// unhandles  promise rejection
process.on("unhandledRejection", (reason, promise) => {
	logger.error("Unhandled Rejection", { promise, reason });
});
