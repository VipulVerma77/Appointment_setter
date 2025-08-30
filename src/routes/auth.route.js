import { Router } from "express";
import {
  registerUser,
  loginUser,
  refreshAccessToken,
  logoutUser,
  updatePassword,
} from "../controllers/auth.controller.js";
import  {authMiddleware}  from "../middleware/authMiddleware.js";

const router = Router();

// Public routes
router.post("/register", registerUser);
router.post("/login", loginUser);
router.post("/refresh", refreshAccessToken);

// Protected routes
router.post("/logout", authMiddleware, logoutUser);
router.post("/update-password", authMiddleware, updatePassword);

export default router;
