import { Router } from "express";
import {
  bookAppointment,
  getMyAppointments,
  getDoctorAppointments,
  updateAppointmentStatus,
  cancelAppointment
} from "../controllers/appointment.controller.js";

import { authMiddleware,doctorOnly } from "../middleware/authMiddleware.js";

const router = Router();

// ---------------- Patient Routes ----------------
// Book a new appointment
router.post("/", authMiddleware, bookAppointment);

// Get all appointments for logged-in patient
router.get("/me", authMiddleware, getMyAppointments);

// Cancel an appointment (patient)
router.put("/cancel/:id", authMiddleware, cancelAppointment);

// ---------------- Doctor Routes ----------------
// Get all appointments for logged-in doctor
router.get("/doctor", authMiddleware, doctorOnly, getDoctorAppointments);

// Update appointment status (doctor)
router.put("/doctor/status/:id", authMiddleware, doctorOnly, updateAppointmentStatus);

export default router;
