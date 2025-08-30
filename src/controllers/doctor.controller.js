import asyncHandler from "../utils/asyncHandler.js";
import ApiResponse from "../utils/ApiResponse.js";
import ApiError from "../utils/ApiError.js";
import Doctor from "../models/doctor.model.js";
import Category from "../models/category.model.js";
import User from "../models/user.model.js";
import Appointment from "../models/appointment.model.js";

// ---------------- Create Doctor Profile ----------------
export const createDoctorProfile = asyncHandler(async (req, res) => {
  const { category, specialization, experience, fees, availableSlots, bio, clinicName, clinicAddress } = req.body;
  const userId = req.user.id;

  const user = await User.findById(userId);
  if (!user || user.role !== "doctor") {
    throw new ApiError(403, "Only doctors can create profiles");
  }

  const catExists = await Category.findById(category);
  if (!catExists) throw new ApiError(404, "Category not found");

  const existingDoctor = await Doctor.findOne({ user: userId });
  if (existingDoctor) throw new ApiError(409, "Doctor profile already exists");

  const doctor = await Doctor.create({
    user: userId,
    category,
    specialization,
    experience,
    fees,
    availableSlots,
    bio,
    clinicName,
    clinicAddress,
    profileImage: req.body.profileImage || null,
  });

  res.status(201).json(new ApiResponse(201, "Doctor profile created", doctor));
});

// ---------------- Update Doctor Profile ----------------
export const updateDoctorProfile = asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const doctor = await Doctor.findOne({ user: userId });
  if (!doctor) throw new ApiError(404, "Doctor profile not found");

  // Whitelist fields to update
  const allowedFields = ["category", "specialization", "experience", "fees", "availableSlots", "bio", "clinicName", "clinicAddress", "profileImage"];
  allowedFields.forEach((field) => {
    if (req.body[field] !== undefined) doctor[field] = req.body[field];
  });

  await doctor.save();
  res.status(200).json(new ApiResponse(200, "Doctor profile updated", doctor));
});

// ---------------- Update Availability ----------------
export const updateAvailability = asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const { availableSlots } = req.body;

  const doctor = await Doctor.findOne({ user: userId });
  if (!doctor) throw new ApiError(404, "Doctor profile not found");

  doctor.availableSlots = availableSlots;
  await doctor.save();

  res.status(200).json(new ApiResponse(200, "Availability updated", doctor));
});

// ---------------- Get All Doctors ----------------
export const getDoctors = asyncHandler(async (req, res) => {
  const { category, specialization, name, page = 1, limit = 10 } = req.query;

  let filter = {};
  if (category) filter.category = category;
  if (specialization) filter.specialization = new RegExp(specialization, "i");

  let query = Doctor.find(filter)
    .populate("user", "name email")
    .populate("category", "name")
    .skip((page - 1) * limit)
    .limit(parseInt(limit));

  let doctors = await query;

  if (name) {
    doctors = doctors.filter((doc) => doc.user.name.toLowerCase().includes(name.toLowerCase()));
  }

  const total = await Doctor.countDocuments(filter);

  res.status(200).json(new ApiResponse(200, "Doctors fetched", { doctors, total, page, pages: Math.ceil(total / limit) }));
});

// ---------------- Get Doctor by ID ----------------
export const getDoctorById = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const doctor = await Doctor.findById(id)
    .populate("user", "name email")
    .populate("category", "name description");

  if (!doctor) throw new ApiError(404, "Doctor not found");

  res.status(200).json(new ApiResponse(200, "Doctor details", doctor));
});

// ---------------- Get Doctor Appointments ----------------
export const getDoctorAppointments = asyncHandler(async (req, res) => {
  const userId = req.user.id;

  const doctor = await Doctor.findOne({ user: userId });
  if (!doctor) throw new ApiError(404, "Doctor profile not found");

  const appointments = await Appointment.find({ doctor: doctor._id })
    .populate("patient", "name email")
    .populate("doctor", "clinicName specialization");

  res.status(200).json(new ApiResponse(200, "Doctor appointments", appointments));
});
