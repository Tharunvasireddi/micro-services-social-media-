import cors from "cors";
import dotenv from "dotenv";
import express from "express";
import helmet from "helmet";
import mongoose from "mongoose";
import handlePostDeleted from "./eventhandler/event-handler.js";
import errorHandler from "./middlewares/error-handler.js";
import mediaRouter from "./routes/media-routes.js";
import logger from "./utils/logger.js";
import { connectToRabbitMQ, consumeEvent } from "./utils/rabbitmq.js";
dotenv.config();

const app = express();
const PORT = process.env.PORT;

// connect to DB
mongoose
	.connect(process.env.MONGO_URL)
	.then(() => logger.info("Connected to mongodb"))
	.catch((e) => logger.error("Mongo connection error", e));

app.use(express.json());
app.use(helmet());
app.use(cors());

// logging middleware
app.use((req, res, next) => {
	logger.info(`received ${req.method} request to ${req.url}`);
	logger.info(`Request body ${req.body}`);
	next();
});

app.use(errorHandler);

app.use("/api/media", mediaRouter);

async function startServer() {
	try {
		await connectToRabbitMQ();
		// consume all the events
		await consumeEvent("post.deleted", handlePostDeleted);
		app.listen(PORT, () => {
			logger.info(`media- service running on port ${PORT}`);
		});
	} catch (error) {}
}

// unhandles  promise rejection
process.on("unhandledRejection", (reason, promise) => {
	logger.error("Unhandled Rejection", { promise, reason });
});
