import { Router } from "express";
import {
  createDoctorProfile,
  updateDoctorProfile,
  getDoctors,
  getDoctorById,
  updateAvailability,
  getDoctorAppointments
} from "../controllers/doctor.controller.js";
import { authMiddleware ,doctorOnly} from "../middleware/authMiddleware.js";

const router = Router();

router.get("/", getDoctors);          
router.get("/:id", getDoctorById);    

// Protected routes (doctor-only)
router.post("/profile", authMiddleware, doctorOnly, createDoctorProfile);
router.put("/profile", authMiddleware, doctorOnly, updateDoctorProfile);
router.put("/availability", authMiddleware, doctorOnly, updateAvailability);
router.get("/appointments", authMiddleware, doctorOnly, getDoctorAppointments);

export default router;
