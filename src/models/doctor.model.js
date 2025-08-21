import mongoose from "mongoose";

const doctorSchema = new mongoose.Schema({
  user:{ type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  category: { type: mongoose.Schema.Types.ObjectId, ref: "Category", required: true },
  specialization: { type: String },
  experience: { type: Number },
  fees: { type: Number, required: true },
  availableSlots: [{ type: String }],
  bio: { type: String },
  clinicName: { type: String },
  clinicAddress: { type: String },
  profileImage: { type: String }
}, { timestamps: true });

export default mongoose.model("Doctor", doctorSchema);
