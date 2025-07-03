import dotenv from "dotenv";
import mongoose from "mongoose";
dotenv.config();
import express from "express";
import helmet from "helmet";
import cors from "cors";
import { RateLimiterRedis } from "rate-limiter-flexible";
import Redis from "ioredis";
import rateLimit from "express-rate-limit";
import { RedisStore } from "rate-limit-redis";
import {
  registraionRouter,
  loginRouter,
  refreshTokenRouter,
  logoutRouter,
} from "./routes/identity-service.js";
import errorHandler from "./middleware/errorHandler.js";
import logger from "./utils/logger.js";
const app = express();

mongoose
  .connect(process.env.MONGODB_URL)
  .then(() => logger.info("connected to mongodb"))
  .catch((error) => logger.error("mongo connection error", error));

const redisClient = new Redis(process.env.REDIS_URL);

// middleware
app.use(helmet());
app.use(cors());
app.use(express.json());

app.use((req, res, next) => {
  logger.info(`Received ${req.method} request to ${req.url}`);
  logger.info(`reques body ${req.body}`);
  next();
});

// DDos proection and rate limiting

const rateLimiter = new RateLimiterRedis({
  storeClient: redisClient,
  keyPrefix: "middleware",
  points: 10,
  duration: 1,
});

app.use((req, res, next) => {
  rateLimiter
    .consume(req.ip)
    .then(() => next())
    .catch(() => {
      logger.warn(`Rate limit exceeded for IP :${req.ip}`);
      res.status(429).json({
        success: false,
        message: "Too many requests",
      });
    });
});

// IP based rate limiting for senstive endpoints
const senstiveEndpointsLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 50,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    logger.warn(`Senstive endpoint rate limit exceeded for IP:${req.ip}`);
    res.status(429).json({
      success: false,
      message: "Too many requests",
    });
  },
  store: new RedisStore({
    sendCommand: (...args) => redisClient.call(...args),
  }),
});

// apply this senstiveEndpointsLimiter to our routes
app.use("/api/auth/register", senstiveEndpointsLimiter);

// Routes
app.use("/api/auth", registraionRouter);
app.use("/api/auth", loginRouter);
app.use("/api/auth", refreshTokenRouter);
app.use("/api/auth", logoutRouter);

// errorhandler
app.use(errorHandler);

app.listen(process.env.PORT, () => {
  logger.info(`idenity service running on port ${process.env.PORT}`);
});

// unhandled promise rejecion

process.on("unhandledRejection", (reason, promise) => {
  logger.error("Unhandled Rejection at", promise, "reason : ", reason);
});
