import express from "express";
import { RegisterUserController } from "../controllers/identity-controller.js";
const router = express.Router();

router.post("/register", RegisterUserController);

export default router;
