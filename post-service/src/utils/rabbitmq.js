import amqp from "amqplib";
import dotenv from "dotenv";
import logger from "./logger.js";
dotenv.config();
let connection = null;
let channel = null;

const EXCHANGE_NAME = "facebook_events";

async function connectRabbitMq() {
	try {
		connection = await amqp.connect(process.env.RABBITQ_URL);
		channel = await connection.createChannel();

		await channel.assertExchange(EXCHANGE_NAME, "topic", { durable: false });
		logger.info("Connected to rabbit mq");
	} catch (error) {
		logger.error("error connecting to rabbit mq", error);
	}
}

export default connectRabbitMq;
