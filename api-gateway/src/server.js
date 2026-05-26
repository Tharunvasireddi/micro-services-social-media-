import cors from "cors";
import dotenv from "dotenv";
import express from "express";
import proxy from "express-http-proxy";
import rateLimit from "express-rate-limit";
import helmet from "helmet";
import Redis from "ioredis";
import { RedisStore } from "rate-limit-redis";
import errorHandler from "./middlewares/errorhandler.js";
import logger from "./utils/logger.js";
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

const redisClient = new Redis(process.env.REDIS_URL);

app.use(cors());
app.use(helmet());
app.use(express.json());

// rate limiting
const rateLimiter = rateLimit({
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

app.use(rateLimiter);
// logging middleware
app.use((req, res, next) => {
	logger.info(`received ${req.method} request to ${req.url}`);
	logger.info(`Request body ${req.body}`);
	next();
});

// setting proxy service for api gateway

// proxy Options

const proxyOptions = {
	proxyReqPathResolver: (req) => {
		return req.originalUrl.replace(/^\/v1/, "/api");
	},
	proxyErrorHandler: (err, res, next) => {
		logger.error(`Proxy error : ${err.message}`);
		res.status(500).json({
			message: `internal server error`,
			error: err.message,
		});
	},
};

// setting up proxy for indentity service
app.use(
	"/v1/auth",
	proxy(process.env.IDENTITY_SERVICE_URL, {
		...proxyOptions,
		proxyReqOptDecorator: (proxyReqOpts, srcReq) => {
			proxyReqOpts.headers["Content-Type"] = "application/json";
			return proxyReqOpts;
		},
		userResDecorator: (proxyRes, proxyResData, userReq, userRes) => {
			logger.info(
				`Response recived from idenity service : ${proxyRes.statusCode}`,
			);

			return proxyResData;
		},
	}),
);

app.use(errorHandler);

app.listen(PORT, () => {
	logger.info(`API Gateway is running on port ${PORT}`);
	logger.info(
		`indentity serivice is running on port ${process.env.IDENTITY_SERVICE_URL}`,
	);
	logger.info(`Redis Url ${process.env.REDIS_URL}`);
});
