import express from "express";
import {
	loginUserController,
	logoutController,
	refreshTokenController,
	RegisterUserController,
} from "../controllers/identity-controller.js";

const router = express.Router();

router.post("/register", RegisterUserController);
router.post("/login", loginUserController);
router.post("/refreshtoken", refreshTokenController);
router.post("/logout", logoutController);

export default router;
