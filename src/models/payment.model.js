import mongoose from "mongoose";

const paymentSchema = new mongoose.Schema({
  appointment: { type: mongoose.Schema.Types.ObjectId, ref: "Appointment", required: true },
  amount: { type: Number, required: true },
  currency: { type: String, default: "usd" },
  status: { 
    type: String, 
    enum: ["pending", "success", "failed"], 
    default: "pending" 
  },
  provider: { type: String, enum: ["stripe", "razorpay"], required: true },
  transactionId: { type: String },
  receiptUrl: { type: String }
}, { timestamps: true });

export default mongoose.model("Payment", paymentSchema);
