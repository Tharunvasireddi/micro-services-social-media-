import amqp from "amqplib";
import dotenv from "dotenv";
import logger from "./logger.js";
dotenv.config();
let connection = null;
let channel = null;

const EXCHANGE_NAME = "facebook_events";

async function connectToRabbitMQ() {
	try {
		connection = await amqp.connect(process.env.RABBITQ_URL);
		channel = await connection.createChannel();
		await channel.assertExchange(EXCHANGE_NAME, "topic", { durable: false });
		logger.info("Connected to rabbit mq");
		return channel;
	} catch (error) {
		logger.error("Error while connecting rabbit mq", error);
	}
}

async function publishEvent(routingKey, message) {
	if (!channel) {
		await connectToRabbitMQ();
	}
	channel.publish(
		EXCHANGE_NAME,
		routingKey,
		buffer.from(JSON.stringify(message)),
	);
	logger.info(`Event publish : ${routingKey}`);
}

async function consumeEvent(routingKey, callback) {
	if (!channel) {
		await connectToRabbitMQ();
	}
	const q = await channel.assertQueue("", { exclusive: true });
	await channel.bindQueue(q.queue, EXCHANGE_NAME, routingKey);
	channel.consume(q.queue, (msg) => {
		if (msg !== null) {
			const content = JSON.parse(msg.content.toString());
			callback(content);
			channel.ack(msg);
		}
	});
	logger.info(`Subscribed to event : ${routingKey}`);
}

export { connectToRabbitMQ, consumeEvent, publishEvent };
