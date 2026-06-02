import cors from "cors";
import dotenv from "dotenv";
import express from "express";
import mongoose from "mongoose";
import { handlePostCreatetd } from "./event-handlers/search-event-handler";
import errorHandler from "./middlewares/error-handler";
import searchRouter from "./routes/searchpost-route";
import logger from "./utils/logger";
import { connectToRabbitMQ, consumeEvent } from "./utils/rabbitMq";
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
		app.listen(PORT, () => {
			logger.info(`media- service running on port ${PORT}`);
		});
	} catch (error) {
		logger.error("failed tp start serch service");
		process.exit(1);
	}
}

startServer();

// unhandles  promise rejection
process.on("unhandledRejection", (reason, promise) => {
	logger.error("Unhandled Rejection", { promise, reason });
});
