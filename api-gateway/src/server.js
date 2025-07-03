import dotenv from "dotenv";
import express from "express";
import cors from "cors";
import Redis from "ioredis";
dotenv.config();
import helmet from "helmet";
import errorHandler from "./middleware/errorHandler.js";
import { rateLimit } from "express-rate-limit";
import { RedisStore } from "rate-limit-redis";
import logger from "./utils/logger.js";
import proxy from "express-http-proxy";
import { validToken } from "./middleware/authmiddleware.js";
const app = express();
app.use(cors());
app.use(helmet());
app.use(express.json());

app.use((req, res, next) => {
  logger.info(`Received ${req.method} request to ${req.url}`);
  logger.info(`reques body ${req.body}`);
  next();
});

// redis client
const redisClient = new Redis(process.env.REDIS_URL);

// proxy
const proxyOptions = {
  proxyReqPathResolver: (req) => {
    console.log("this is proxy touch");
    return req.originalUrl.replace(/^\/v1/, "/api");
  },
  proxyErrorHandler: (err, res, next) => {
    logger.error(`Proxy error: ${err.message}`);
    res.status(500).json({
      message: "Internal server error",
      error: err.message,
    });
  },
};

// app.use("/v1/auth", proxy(process.env.IDENTITY_SERVICE_URL, proxyOptions));

// setting up proxy for our identity service
app.use(
  "/v1/auth",
  proxy(process.env.IDENTITY_SERVICE_URL, {
    ...proxyOptions,
    proxyPathResolver: (req) => req.originalUrl.replace(/^\/v1/, "/api"),
    proxyReqOptDecorator: (opts) => {
      opts.headers["Content-Type"] = "application/json";
      return opts;
    },
    userResDecorator: (proxyRes, proxyResData) => {
      logger.info(`Response from Identity service: ${proxyRes.statusCode}`);
      return proxyResData;
    },
  })
);

// setting proxy for post-service
app.use(
  "/v1/posts",
  validToken,
  proxy(process.env.POST_SERVICE_URL, {
    ...proxyOptions, // make sure it doesn't override decorators below
    proxyReqOptDecorator: (proxyReqOpts, srcReq) => {
      console.log("user is present or not",srcReq.user.userId);
      proxyReqOpts.headers = {
        ...proxyReqOpts.headers,
        "Content-Type": "application/json",
        "x-user-id": srcReq.user?.userId || "",
      };
      return proxyReqOpts;
    },
    userResDecorator: (proxyRes, proxyResData) => {
      logger.info(`Response from post service: ${proxyRes.statusCode}`);
      return proxyResData;
    },
  })
);

// rate limiting
const ratelimitOptions = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 200,
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

app.use(ratelimitOptions);

// app.use((req, res, next) => {
//   rateLimit
//     .consume(req.ip)
//     .then(() => next())
//     .catch(() => {
//       logger.warn(`Rate limit exceeded for IP :${req.ip}`);
//       res.status(429).json({
//         success: false,
//         message: "Too many requests",
//       });
//     });
// });

app.use(errorHandler);
const port = process.env.PORT || 3000;
app.listen(port, () => {
  logger.info(`API Gateway is running on port ${port}`);
  logger.info(
    `Identity service is running on port ${process.env.IDENTITY_SERVICE_URL}`
  );
  logger.info(
    `post service is running on port ${process.env.POST_SERVICE_URL}`
  );
  logger.info(`Redis Url ${process.env.REDIS_URL}`);
});
