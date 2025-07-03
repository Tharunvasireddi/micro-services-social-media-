import logger from "../utils/logger.js";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";
dotenv.config();

const validToken = (req, res, next) => {
  const authHeader = req.headers["authorization"];
  console.log(process.env.JWT_SECRET);
  logger.debug("Authorization header: ", authHeader);

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    logger.warn("Access attempt without valid token!");
    return res.status(401).json({
      success: false,
      message: "Authentication required",
    });
  }

  const token = authHeader.split(" ")[1];
  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) {
      logger.warn("Invalid token!");
      return res.status(401).json({
        success: false,
        message: "Invalid token!",
      });
    }
    req.user = user;
    console.log("this is an user :",user);
    next();
  });
};

export { validToken };
