import logger from "../utils/logger.js";
import { validateRegistration, validateLogin } from "../utils/validation.js";
import User from "../models/User.js";
import generateTokens from "../utils/generateToken.js";
import RefreshToken from "../models/RefreshToken.js";

// user registration

const registerUser = async (req, res) => {
  logger.info("Registration end point hit...");
  try {
    // validate the schema
    const { error } = validateRegistration(req.body);
    if (error) {
      logger.warn("Validation error", error.details[0].message);
      return res.status(400).json({
        success: false,
        message: error.details[0].message,
      });
    }
    const { username, email, password } = req.body;
    let user = await User.findOne({ $or: [{ username }, { email }] });
    if (user) {
      logger.warn("user is already exists");
      return res.status(404).json({
        success: false,
        message: "user is existed",
      });
    }

    user = new User({ username, email, password });
    await user.save();
    logger.warn("User  saved succesfully", user._id);
    const { accessToken, refreshToken } = await generateTokens(user);
    res.status(201).json({
      success: true,
      message: "User is succesfully registered",
      accessToken,
      refreshToken,
    });
  } catch (error) {
    logger.error("registraion error occured", error);
    res.status(500).json({
      success: false,
      message: "internal server error",
    });
  }
};

// user login

const loginUser = async (req, res) => {
  logger.info("login endpoint hit...");
  try {
    const { error } = validateLogin(req.body);
    if (error) {
      logger.warn("Validation error", error.details[0].message);
      return res.status(400).json({
        message: error.details[0].message,
      });
    }

    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user) {
      logger.warn("inavlalid user");
      return res.status(400).json({
        success: false,
        message: "user is not existed",
      });
    }

    // valid password or not
    const isValidPassword = await user.comparePassword(password);
    if (!isValidPassword) {
      logger.warn("inavlalid password");
      return res.status(400).json({
        success: false,
        message: "invalid pasword",
      });
    }

    const { accessToken, refreshToken } = await generateTokens(user);
    res.json({
      accessToken,
      refreshToken,
      userId: user._id,
    });
  } catch (error) {
    logger.error("login error is occured", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

// refresh token
const refreshTokenUser = async (req, res) => {
  logger.info("refresh token endpoint hit...");
  try {
    const { refreshToken } = req.body;
    if (!refreshToken) {
      logger.warn("refresh token is missing ");
      return res.status(400).json({
        success: false,
        message: "Refresh token missing  ",
      });
    }
    const storedToken = await RefreshToken.findOne({ token: refreshToken });
    if (!storedToken || storedToken.expiresAt < new Date()) {
      logger.warn("Inavalid or expired refresh token");
      return res.status(400).json({
        success: false,
        message: "Invalid or expired refresh token",
      });
    }
    const user = await User.findById(storedToken.user);
    if (!user) {
      logger.warn("user not found");
      return res.status(400).json({
        success: false,
        message: "user  not found",
      });
    }

    const { accessToken: newAccessToken, refreshToken: newRefreshToken } =
      await generateTokens(user);
    // delete the old refresh token
    await RefreshToken.deleteOne({ _id: storedToken._id });
    res.json({
      accessToken: newAccessToken,
      refreshToken: newRefreshToken,
    });
  } catch (error) {
    logger.error("Refresh token error is occured");
    res.status(400).json({
      success: false,
      message: "internal server error",
    });
  }
};

// logout
const logoutUser = async (req, res) => {
  logger.info("logout endpoint hit...");
  try {
    const { refreshToken } = req.body;
    if (!refreshToken) {
      logger.warn("Refresh token is missing");
      return res.status(400).json({
        success: false,
        message: "Refresh token is missing ",
      });
    }
    await RefreshToken.deleteOne({ token: refreshToken });
    logger.info("refresh token is delete for the logout");
    res.json({
      success: true,
      message: "loged out successfully",
    });
  } catch (error) {
    logger.error("Error while logging out", error);
    res.status(400).json({
      success: false,
      message: "Inernal server error",
    });
  }
};

export { registerUser, loginUser, refreshTokenUser, logoutUser };
