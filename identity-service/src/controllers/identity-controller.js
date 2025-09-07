import User from "../models/user.js";
import logger from "../utils/logger.js";
import validateRegistration from "../utils/validation.js";

// user registration

const RegisterUserController = async (req, res) => {
  logger.info("registration endpoint hit");
  try {
    // validate the schema

    const { error } = validateRegistration(req.body);
    if (error) {
      
    }
    const { username, email, password } = req.body;

    let user = await User.findOne({ $or: [{ email }, { username }] });
    if (user) {
      logger.warn("user already exists");
      return res.status(400).json({
        success: false,
        message:
          "user is already existed please try again with different email or username",
      });
    }

    user = new User({ username, email, password });
    await user.save();
    logger.warn("user saved sucessfiully", user._id);
    res.status(200).json({
      success: true,
      message: "user is registred sucessfully",
    });
  } catch (error) {
     logger.warn("registeration error", error.details[0].message);
      return res.status(400).json({
        success: false,
        message: error.details[0].message,
      });

  }
};
