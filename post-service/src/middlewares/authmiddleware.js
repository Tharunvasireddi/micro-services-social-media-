import logger from "../utils/logger.js";

const authenticatedRequest = (req, res, next) => {
  const userId = req.headers["x-user-id"];
  console.log("hi hello", userId);
  if (!userId) {
    logger.warn("Access attempted without userId");
    return res.status(401).json({
      success: false,
      message: "Authentication  required please login to continue",
    });
  }
  req.user = { userId };
  next();
};

export { authenticatedRequest };
