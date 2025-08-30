import asyncHandler from "../utils/asyncHandler.js";
import ApiResponse from "../utils/ApiResponse.js";
import ApiError from "../utils/ApiError.js";
import Payment from "../models/payment.model.js";
import Appointment from "../models/appointment.model.js";
import Doctor from "../models/doctor.model.js";
import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

// ---------------- Create Payment Intent ----------------
export const createPaymentIntent = asyncHandler(async (req, res) => {
  const { appointmentId } = req.body;
  const userId = req.user.id;

  const appointment = await Appointment.findById(appointmentId).populate("doctor");
  if (!appointment) throw new ApiError(404, "Appointment not found");

  if (appointment.patient.toString() !== userId) {
    throw new ApiError(403, "Not authorized to pay for this appointment");
  }

  if (appointment.paymentStatus === "paid") {
    throw new ApiError(400, "Appointment already paid");
  }

  const amount = appointment.doctor.fees * 100; 

  const paymentIntent = await stripe.paymentIntents.create({
    amount,
    currency: "usd",
    payment_method_types: ["card"],
    metadata: { appointmentId: appointment._id.toString(), userId },
  });

  // Save a pending payment record
  await Payment.create({
    appointment: appointment._id,
    amount: appointment.doctor.fees,
    currency: "usd",
    status: "pending",
    provider: "stripe",
    transactionId: paymentIntent.id,
  });

  res.status(200).json(new ApiResponse(200, "Payment intent created", {
    clientSecret: paymentIntent.client_secret,
  }));
});

// ---------------- Confirm Payment ----------------
export const confirmPayment = asyncHandler(async (req, res) => {
  const { appointmentId, paymentIntentId } = req.body;
  const userId = req.user.id;

  const appointment = await Appointment.findById(appointmentId);
  if (!appointment) throw new ApiError(404, "Appointment not found");

  if (appointment.patient.toString() !== userId) {
    throw new ApiError(403, "Not authorized to confirm this payment");
  }

  const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
  if (!paymentIntent) throw new ApiError(404, "Payment not found");

  // Find corresponding payment record
  const payment = await Payment.findOne({ appointment: appointmentId, transactionId: paymentIntent.id });
  if (!payment) throw new ApiError(404, "Payment record not found");

  // Update status based on Stripe payment status
  let newStatus = "pending";
  if (paymentIntent.status === "succeeded") newStatus = "success";
  else if (paymentIntent.status === "requires_payment_method" || paymentIntent.status === "requires_action") newStatus = "pending";
  else newStatus = "failed";

  payment.status = newStatus;
  payment.receiptUrl = paymentIntent.charges.data[0]?.receipt_url || null;
  await payment.save();

  // Update appointment status accordingly
  if (newStatus === "success") {
    appointment.paymentStatus = "paid";
    appointment.status = "confirmed"; // auto-confirm appointment
  } else if (newStatus === "pending") {
    appointment.paymentStatus = "pending";
    appointment.status = "pending";
  } else {
    appointment.paymentStatus = "failed";
  }
  await appointment.save();

  res.status(200).json(new ApiResponse(200, `Payment ${newStatus}`, { payment, appointment }));
});

// ---------------- Get Patient Payments ----------------
export const getMyPayments = asyncHandler(async (req, res) => {
  const userId = req.user.id;

  const payments = await Payment.find()
    .populate({
      path: "appointment",
      match: { patient: userId },
      populate: { path: "doctor", select: "clinicName specialization fees" }
    });

  res.status(200).json(new ApiResponse(200, "Payments fetched", payments));
});
