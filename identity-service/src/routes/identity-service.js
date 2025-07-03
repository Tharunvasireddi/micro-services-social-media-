import express from "express";
import {
  loginUser,
  logoutUser,
  refreshTokenUser,
  registerUser,
} from "../controllers/identity-controller.js";
const registraionRouter = express.Router();
registraionRouter.post("/register", registerUser);

const loginRouter = express.Router();
loginRouter.post("/login", loginUser);

const refreshTokenRouter = express.Router();
refreshTokenRouter.post("/refresh-token", refreshTokenUser);

const logoutRouter = express.Router();
logoutRouter.post("/logout", logoutUser);
export { registraionRouter, loginRouter, refreshTokenRouter, logoutRouter };
