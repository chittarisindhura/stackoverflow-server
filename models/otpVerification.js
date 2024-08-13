import mongoose from "mongoose";
const otpSchema = mongoose.Schema({
  id: { type: String },
  otp: { type: String },
  createdAt: { type: Date },
  expiresAt: { type: Date },
});
export default mongoose.model("otp", otpSchema);
