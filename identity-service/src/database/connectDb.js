import mongoose, { mongo } from "mongoose";
import dotenv from "dotenv";

dotenv.config();
const MAX_RETRIES = 3;
const RETRY_INTERVAL = 5000;

class Databaseconnection {
  constructor() {
    this.retryCount = 0;
    this.isConnected = false;

    mongoose.set("strictQuery", true);

    mongoose.connection.on("connected", () => {
      console.log("mongodb is connected successfully");
      this.isConnected = true;
    });

    mongoose.connection.on("error", () => {
      console.log("error while connected to the mongodb");
      this.isConnected = false;
      this.handleConnectionError();
    });

    mongoose.connection.on("disconnected", () => {
      console.log("mongodb is disconnected succesfully");
      this.isConnected = false;
      this.handleDisconnection();
    });
  }

  async connect() {
    if (!process.env.MONGO_URL) {
      throw new Error("mongoDB url is not defined in environment variables");
    }

    const connectionOpitons = {
      maxPoolSize: 10,
      serverSelectionTimeoutMs: 5000,
      socketTimeoutMS: 45000,
      family: 4,
    };

    try {
      await mongoose.connect(process.env.MONGO_URL, connectionOpitons);
      this.retryCount = 0;
    } catch (error) {
      console.error("failed to connect to mongoDB");
    }
  }

  async handleConnectionError() {
    if (this.retryCount < MAX_RETRIES) {
      this.retryCount++;
      console.log(
        `Retrying connection attempt ${this.retryCount} of ${MAX_RETIRES}`
      );
      await new Promise((resolve) => setTimeout(resolve, RETRY_INTERVAL));

      return this.connect;
    } else {
      console.error(
        `Failed to connect to MongoDB after ${MAX_RETRIES} attempts`
      );
      process.exit(1);
    }
  }

  handleDisconnection() {
    if (!this.isConnected) {
      console.log("Attempting to reconnect to MongoDB...");
      this.connect();
    }
  }
}

const connectionObj = new Databaseconnection();

export default connectionObj.connect.bind(connectionObj);


