import mongoose from "mongoose";

const reviewSchema = new mongoose.Schema(
  {
    patient: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    doctor: { type: mongoose.Schema.Types.ObjectId, ref: "Doctor", required: true },
    rating: { type: Number, min: 1, max: 5, required: true },
    comment: { type: String, trim: true },
    status: { 
      type: String, 
      enum: ["pending", "approved", "rejected"], 
      default: "approved" 
    }
  },
  { timestamps: true }
);


reviewSchema.index({ patient: 1, doctor: 1 }, { unique: true });

export default mongoose.model("Review", reviewSchema);
