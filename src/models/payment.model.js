import mongoose from "mongoose";

const paymentSchema = new mongoose.Schema(
  {
    appointment: { type: mongoose.Schema.Types.ObjectId, ref: "Appointment", required: true },
    amount: { type: Number, required: true },
    currency: { 
      type: String, 
      default: "USD", 
      uppercase: true,
      match: /^[A-Z]{3}$/ // Ensures valid currency code like USD, INR, EUR
    },
    status: { 
      type: String, 
      enum: ["pending", "success", "failed"], 
      default: "pending" 
    },
    provider: { type: String, enum: ["stripe", "razorpay"], required: true },
    transactionId: { type: String, unique: true, sparse: true },
    receiptUrl: { type: String, trim: true }
  },
  { timestamps: true }
);

export default mongoose.model("Payment", paymentSchema);
