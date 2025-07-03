import dotenv from "dotenv";
import express from "express";
dotenv.config();
import mongoose from "mongoose";
import Redis from "ioredis";
import cors from "cors";
import helmet from "helmet";
import { postRouter } from "./routes/post-routes.js";
import errorHandler from "./middlewares/errorHandling.js";
import logger from "./utils/logger.js";
import rateLimit from "express-rate-limit";
import RedisStore from "rate-limit-redis";

const app = express();
const port = process.env.PORT || 3002;
mongoose
  .connect(process.env.MONGODB_URL)
  .then(() => {
    logger.info("mongodb is connected successfully");
  })
  .catch((e) => logger.error("Mongo connection error", e));

const redisClient = new Redis(process.env.REDIS_URL);

app.use(express.json());
app.use(cors());
app.use(helmet());

app.use((req, res, next) => {
  logger.info(`Received ${req.method} request to ${req.url}`);
  logger.info(`Request body , ${req.body}`);
  next();
});

// ip ratelimiting for senstive endpoints
const sestiveEndPoints = rateLimit({
  windowMs: 10 * 60 * 1000,
  max: 15,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    logger.warn(`Senstive endpoint rate limit exceeded for IP :${req.ip}`);
    res.status(429).json({
      success: false,
      message: "too many requests",
    });
  },
  store: new RedisStore({
    sendCommand: (...args) => redisClient.call(...args),
  }),
});

// applying this senstiveenfpoint to our post create router
app.use("/api/posts/create-post", sestiveEndPoints);

app.use(
  "/api/posts",
  (req, res, next) => {
    req.redisClient = redisClient;
    next();
  },
  postRouter
);

app.use(errorHandler);

app.listen(port, () => {
  logger.info(`sever is running on port ${port}`);
});

process.on("unhandledRejection", (reason, promise) => {
  logger.error("unhandled rejection", promise, "reason", reason);
});
