import asyncHandler from "../utils/asyncHandler.js";
import ApiResponse from "../utils/ApiResponse.js";
import ApiError from "../utils/ApiError.js";
import Appointment from "../models/appointment.model.js";
import Doctor from "../models/doctor.model.js";

// ---------------- Book Appointment (Patient) ----------------
export const bookAppointment = asyncHandler(async (req, res) => {
  const { doctorId, date, slot } = req.body;
  const patientId = req.user.id;

  // Validate doctor exists
  const doctor = await Doctor.findById(doctorId);
  if (!doctor) throw new ApiError(404, "Doctor not found");

  // Check slot availability
  if (!doctor.availableSlots.includes(slot)) {
    throw new ApiError(400, "Selected slot is not available");
  }

  // Check if patient already has a pending appointment at the same time
  const existing = await Appointment.findOne({
    patient: patientId,
    date,
    slot,
    status: { $in: ["pending", "confirmed"] },
  });
  if (existing) throw new ApiError(409, "You already have an appointment at this time");

  // Create appointment
  const appointment = await Appointment.create({
    patient: patientId,
    doctor: doctorId,
    date,
    slot,
  });

  res.status(201).json(new ApiResponse(201, "Appointment booked successfully", appointment));
});

// ---------------- Get Patient Appointments ----------------
export const getMyAppointments = asyncHandler(async (req, res) => {
  const patientId = req.user.id;

  const appointments = await Appointment.find({ patient: patientId })
    .populate("doctor", "clinicName specialization fees availableSlots")
    .populate("doctor.user", "name email");

  res.status(200).json(new ApiResponse(200, "My appointments fetched", appointments));
});

// ---------------- Get Doctor Appointments ----------------
export const getDoctorAppointments = asyncHandler(async (req, res) => {
  const doctorUserId = req.user.id;

  const doctor = await Doctor.findOne({ user: doctorUserId });
  if (!doctor) throw new ApiError(404, "Doctor profile not found");

  const appointments = await Appointment.find({ doctor: doctor._id })
    .populate("patient", "name email")
    .sort({ date: 1, slot: 1 }); // earliest first

  res.status(200).json(new ApiResponse(200, "Doctor appointments fetched", appointments));
});

// ---------------- Update Appointment Status (Doctor) ----------------
export const updateAppointmentStatus = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;
  const doctorUserId = req.user.id;

  const doctor = await Doctor.findOne({ user: doctorUserId });
  if (!doctor) throw new ApiError(404, "Doctor profile not found");

  const appointment = await Appointment.findById(id);
  if (!appointment) throw new ApiError(404, "Appointment not found");

  if (appointment.doctor.toString() !== doctor._id.toString()) {
    throw new ApiError(403, "Not authorized to update this appointment");
  }

  if (!["pending", "confirmed", "cancelled", "completed"].includes(status)) {
    throw new ApiError(400, "Invalid status value");
  }

  appointment.status = status;
  await appointment.save();

  res.status(200).json(new ApiResponse(200, "Appointment status updated", appointment));
});

// ---------------- Cancel Appointment (Patient) ----------------
export const cancelAppointment = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const patientId = req.user.id;

  const appointment = await Appointment.findById(id);
  if (!appointment) throw new ApiError(404, "Appointment not found");

  if (appointment.patient.toString() !== patientId) {
    throw new ApiError(403, "Not authorized to cancel this appointment");
  }

  if (appointment.status === "completed") {
    throw new ApiError(400, "Cannot cancel a completed appointment");
  }

  appointment.status = "cancelled";
  await appointment.save();

  res.status(200).json(new ApiResponse(200, "Appointment cancelled", appointment));
});
