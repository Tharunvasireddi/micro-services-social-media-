import winston from "winston";

const logger = winston.createLogger({
  // creating a logger
  level: process.env.NODE_ENV === "production" ? "info" : "debug", // checking the logging level based on the environment the level of the logging is change

  // and now we going to define the messages format that how they consolelog ...
  format: winston.format.combine(
    winston.format.timestamp(), // time stamps
    winston.format.errors({ stack: true }), // including the stack entry if there any errors
    winston.format.splat(), // splat method is used for the enable message templates
    winston.format.json() // json formate logging
  ),
  defaultMeta: { service: "identity-service" }, // what is what it is will logged

  // these transpors is used to define the output desination of our loggings
  transports: [
    // Console --> transpors to the console
    new winston.format.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.simple()
      ),
    }),
    // transports to the file that we want to log the logs
    new winston.transports.File({ filename: "error.log", level: " error" }),
    new winston.transports.File({ filename: "combine.log" }),
  ],
});

export default logger;
