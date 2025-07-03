import jwt from "jsonwebtoken";
import dotenv from "dotenv";
import RefreshToken from "../models/RefreshToken.js";
import crypto from "crypto";
dotenv.config();
const generateTokens = async (user) => {
  const accessToken = jwt.sign(
    {
      userId: user._id,
      username: user.username,
      email: user.email,
      password: user.password,
    },
    process.env.JWT_SECRET,
    { expiresIn: "60m" }
  );

  const refreshToken = crypto.randomBytes(40).toString("hex");
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 7); // refresh token expires 7 days

  await RefreshToken.create({
    token: refreshToken,
    user: user._id,
    expiresAt,
  });
  return { accessToken, refreshToken };
};

export default generateTokens;
