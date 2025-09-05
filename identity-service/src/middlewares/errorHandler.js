import logger from "../utils/logger.js";

//  these error handler is used to handle the errors implicitly instead of tryc block

const errorHandler = (err, req, res, next) => {
  logger.error(err.stack);

  res.status(err.status || 500).json({
    message: err.message || " internal server error",
  });
};

export default errorHandler;
