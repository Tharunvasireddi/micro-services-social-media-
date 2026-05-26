import RefreshToken from "../models/refreshToken.js";
import User from "../models/user.js";
import generateToken from "../utils/generateToken.js";
import logger from "../utils/logger.js";
import { validateLogin, validateRegistration } from "../utils/validation.js";

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

// login user
const loginUserController = async (req, res) => {
	logger.info("Login endpoint hit...");
	try {
		const { error } = validateLogin(req.body);
		if (error) {
			logger.warn("Validation error", error.details[0].message);
			return res.status(400).json({
				success: false,
				message: error.details[0].message,
			});
		}
		const { email, password } = req.body;
		const user = await User.findOne({ email });

		if (!user) {
			logger.warn("Invalid user");
			return res.status(400).json({
				success: false,
				message: "Invalid credentials",
			});
		}

		// user valid password or not
		const isValidPassword = await user.comparePassword(password);
		if (!isValidPassword) {
			logger.warn("Invalid password");
			return res.status(400).json({
				success: false,
				message: "Invalid password",
			});
		}

		const { accessToken, refreshToken } = await generateToken(user);

		res.json({
			accessToken,
			refreshToken,
			userId: user._id,
		});
	} catch (e) {
		logger.error("Login error occured", e);
		res.status(500).json({
			success: false,
			message: "Internal server error",
		});
	}
};

// refresh token controller

const refreshTokenController = async (req, res) => {
	logger.info("Refresh token endpoint hit...");
	try {
		const refreshToken = req.body;
		if (!refreshToken) {
			logger.warn("Refresh token missing");
			res.status(400).json({
				success: false,
				message: "Refresh token missing",
			});
		}

		const storedToken = await RefreshToken.findOne({ token: refreshToken });

		if (!storedToken || storedToken.expires < new Date()) {
			logger.warn("Invalid refresh token");

			return res.status(401).json({
				success: false,
				message: "invalid token",
			});
		}

		const user = await User.findById(storedToken.user);
		if (!user) {
			logger.warn("user was not found");

			return res.status(401).json({
				success: false,
				message: "user was not found",
			});
		}

		const { accessToken: newAccessToken, refreshToken: newRefreshToken } =
			await generateToken(user);

		// delete old refresh token
		await RefreshToken.deleteOne({ _id: storedToken._id });

		res.json({
			accessToken: newAccessToken,
			refreshToken: newRefreshToken,
			message: "Internal server error",
		});
	} catch (e) {
		logger.error("refresh token error is occured :", e);
		res.status(500).json({
			success: false,
			message: "Internal server error",
		});
	}
};

// logout controller

const logoutController = async (req, res) => {
	logger.info("logout endpoint is hit...");
	try {
		const refreshToken = req.body;
		if (!refreshToken) {
			logger.warn("Refresh token missing");
			res.status(400).json({
				success: false,
				message: "Refresh token missing",
			});
		}
		await RefreshToken.deleteOne({ token: refreshToken });

		res.status(200).json({
			success: true,
			message: "user is loged out successfully",
		});
	} catch (error) {}
};

export {
	loginUserController,
	logoutController,
	refreshTokenController,
	RegisterUserController,
};
