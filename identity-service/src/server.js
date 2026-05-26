import cors from "cors";
import dotenv from "dotenv";
import express from "express";
import rateLimit from "express-rate-limit";
import helmet from "helmet";
import Redis from "ioredis";
import RedisStore from "rate-limit-redis";
import { RateLimiterRedis } from "rate-limiter-flexible";
import connect from "./database/connectDb.js";
import errorHandler from "./middlewares/errorHandler.js";
import router from "./routes/identity-service.js";
import logger from "./utils/logger.js";
dotenv.config();

const app = express();

// middlewares
app.use(express.json());
app.use(helmet());
app.use(cors());

// logging middleware
app.use((req, res, next) => {
	logger.info(`received ${req.method} request to ${req.url}`);
	logger.info(`Request body ${req.body}`);
	next();
});

// connectdb
await connect();

// redis
const redisClient = new Redis(process.env.REDIS_URL);

// DDo protection and rate limiting
const rateLimiter = new RateLimiterRedis({
	storeClient: redisClient, // storeclient is redis client instance that stores the ratelimit data
	keyPrefix: "middleware", // this keyprefix is added to the redis key and distguinsh between ratelimiting data and other data
	points: 10, // this values is equal to the how many requests can make in one second by the ip address or client
	duration: 1, // this tells the above requests can take in this duration
});

app.use((req, res, next) => {
	rateLimiter
		.consume(req.ip)
		.then(() => next())
		.catch(() => {
			logger.warn(`Rate limit exceeded for IP : ${req.ip}`);
			res.status(429).json({ success: false, message: "too many requests" });
		});
});

//  Ip based rate lmiting for senstive endpoints
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

// apply these senstiverate limit to all the routes
app.use("/api/auth/register", senstiveEndPointsLimiter);

// Routes
app.use("/api/auth", router);

// error handler
app.use(errorHandler);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
	logger.info(`Identity service running on port ${PORT}`);
});

// unhandles  promise rejection
process.on("unhandledRejection", (reason, promise) => {
	logger.error("Unhandled Rejection", { promise, reason });
});
