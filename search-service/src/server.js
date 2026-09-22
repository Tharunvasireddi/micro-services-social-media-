import cors from "cors";
import dotenv from "dotenv";
import express from "express";
import helmet from "helmet";
import mongoose from "mongoose";
import {
	handlePostCreatetd,
	handlePostDeleted,
} from "./event-handlers/search-event-handler.js";
import errorHandler from "./middlewares/error-handler.js";
import searchRouter from "./routes/searchpost-route.js";
import logger from "./utils/logger.js";
import { connectToRabbitMQ, consumeEvent } from "./utils/rabbitMq.js";
dotenv.config();

const app = express();
const port = process.env.PORT;

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

app.use("/api/search", searchRouter);

app.use(errorHandler);

async function startServer() {
	try {
		await connectToRabbitMQ();
		// consume all the events
		await consumeEvent("post.created", handlePostCreatetd);
		await consumeEvent("post.deleted", handlePostDeleted);
		app.listen(port, () => {
			logger.info(`media- service running on port ${port}`);
		});
	} catch (error) {
		logger.error("failed tp start serch service", error);
		process.exit(1);
	}
}

startServer();

// unhandles  promise rejection
process.on("unhandledRejection", (reason, promise) => {
	logger.error("Unhandled Rejection", { promise, reason });
});
