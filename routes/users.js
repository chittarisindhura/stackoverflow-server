import express from "express";
import {
  login,
  signup,
  forgotPassword,
  resetPassword,
  sendOtpVerificationEmail,
  verifyOtpData,
  sendMobile,
  verifyMobileCode,
} from "../controllers/auth.js";
import { getAllUsers, updateProfile } from "../controllers/users.js";
import auth from "../middleware/auth.js";
const router = express.Router();
router.post("/signup", signup);
router.post("/login", login);
router.get("/getAllUsers", getAllUsers);
router.patch("/update/:id", auth, updateProfile);
router.post("/forgotPassword", forgotPassword);
router.patch("/resetPassword/:id/:token", resetPassword);
router.post("/sendOtp", sendOtpVerificationEmail);
router.post("/verifyOtp", verifyOtpData);
router.post("/sendMobile", sendMobile);
router.post("/verifyCode", verifyMobileCode);
export default router;
