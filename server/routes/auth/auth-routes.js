import express from "express";
const router = express.Router();

import * as AuthController from "../../controllers/auth/auth-controller.js";

// Creater a user
router.post("/register", AuthController.registerUser);

// Verify email token
router.get("/verify-email", AuthController.verifyEmail);

// Login user
router.post("/login", AuthController.loginUser);

// Logout user
router.post("/logout", AuthController.logoutUser);

export default router;
