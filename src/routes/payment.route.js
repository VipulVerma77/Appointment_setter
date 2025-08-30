import { Router } from "express";
import { authMiddleware } from "../middleware/authMiddleware.js";
import {
  createPaymentIntent,
  confirmPayment,
  getMyPayments
} from "../controllers/payment.controller.js";

const router = Router();

// All routes require authentication
router.post("/create-intent", authMiddleware, createPaymentIntent);
router.post("/confirm", authMiddleware, confirmPayment);
router.get("/me", authMiddleware, getMyPayments);

export default router;
