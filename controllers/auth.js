import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import users from "../models/auth.js";
import nodemailer from "nodemailer";
import otps from "../models/otpVerification.js";
import { hash } from "crypto";
import textflow from "textflow.js";
export const signup = async (req, res) => {
  const { name, email, password } = req.body;
  try {
    const existinguser = await users.findOne({ email });
    if (existinguser) {
      return res.status(404).json({ message: "User already Exist." });
    }
    const hashedPassword = await bcrypt.hash(password, 12);
    const newUser = await users.create({
      name,
      email,
      password: hashedPassword,
      verified: false,
    });
    const token = jwt.sign({ email: newUser.email, id: newUser._id }, "test", {
      expiresIn: "1h",
    });
    res.status(200).json({ result: newUser, token });
  } catch (error) {
    res.status(500).json("Someting went wrong...");
  }
};

export const login = async (req, res) => {
  const { email, password } = req.body;
  try {
    const existinguser = await users.findOne({ email });
    if (!existinguser) {
      return res.status(404).json({ message: "User don't Exist." });
    }
    const isPasswordCrt = await bcrypt.compare(password, existinguser.password);
    if (!isPasswordCrt) {
      return res.status(400).json({ message: "Invalid credentials" });
    }
    const token = jwt.sign(
      { email: existinguser.email, id: existinguser._id },
      "test",
      { expiresIn: "1h" }
    );
    res.status(200).json({ result: existinguser, token });
  } catch (error) {
    res.status(500).json("Something went wrong...");
  }
};

export const forgotPassword = async (req, res) => {
  const { email } = req.body;
  try {
    const oldUser = await users.findOne({ email });
    if (!oldUser) {
      return res.json({ status: "User Not Exists!!" });
    }
    const token = jwt.sign({ email: oldUser.email, id: oldUser._id }, "test", {
      expiresIn: "5h",
    });
    const link = `https://stackoverflow-topaz-eta.vercel.app//resetPassword/${oldUser._id}/${token}`;
    var transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: "csindhura1279@gmail.com",
        pass: "tcty jhdb uxzb yjoy",
      },
    });

    var mailOptions = {
      from: "csindhura1279@gmail.com",
      to: email,
      subject: "Password Reset",
      text: link,
    };

    transporter.sendMail(mailOptions, function (error, info) {
      if (error) {
        console.log(error);
      } else {
        console.log("Email sent: " + info.response);
      }
    });
  } catch (error) {
    console.log(error);
  }
};

export const resetPassword = async (req, res) => {
  const { id: id, token: token, password: password } = req.body;
  try {
    const oldUser = await users.findOne({ _id: id });
    if (!oldUser) {
      return res.json({ status: "User Not Exists!" });
    }
    const verify = jwt.verify(token, "test");
    if (!verify) {
      res.status(404).json({ email: verify.email, status: "Not Verified" });
    }
    const encryptedPassword = await bcrypt.hash(password, 10);
    await users.updateOne(
      { _id: id },

      {
        $set: {
          password: encryptedPassword,
        },
      }
    );

    res
      .status(201)
      .json({ email: verify.email, status: "verified and password updated " });
  } catch (error) {
    console.log(error);
    res.json({ status: "password not updated" });
  }
};

export const sendOtpVerificationEmail = async (req, res) => {
  try {
    const { _id, email, enterEmail } = req.body;
    const otp = `${Math.floor(1000 + Math.random() * 9000)}`;
    var transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: "csindhura1279@gmail.com",
        pass: "tcty jhdb uxzb yjoy",
      },
    });

    const mailOptions = {
      from: "csindhura1279@gmail.com",
      to: enterEmail,
      subject: "Verify your email",
      html: `<p>Enter <b>${otp}</b> in the app to verify your email address for spanish language translation</p>`,
    };

    const saltRounds = 10;
    const hashedOtp = await bcrypt.hash(otp, saltRounds);
    const newOtp = await new otps({
      id: _id,
      otp: hashedOtp,
      createdAt: Date.now(),
      expiresAt: Date.now() + 3600000,
    });
    await newOtp.save();
    if (enterEmail == email) {
      await transporter.sendMail(mailOptions);
      res.status(200).json({
        status: "pending",
        message: "verification email otp sent",
        data: {
          _id: _id,
          email,
        },
      });
    } else {
      res.status(400).json({
        message: "your login email and  entered email are different",
      });
    }
  } catch (error) {
    res.status(404).json({
      status: "failed",
      message: error.message,
    });
  }
};

export const verifyOtpData = async (req, res) => {
  try {
    let { id, otp } = req.body;
    console.log(id, otp);
    if (!id || !otp) {
      throw Error("Enter OTP");
    } else {
      const userOtpRecords = await otps.find({
        id,
      });
      if (userOtpRecords.length <= 0) {
        throw Error(
          "Account record does not exist or has been verified already. please signup or login again"
        );
      } else {
        const expiresAt = userOtpRecords[userOtpRecords.length - 1];
        const hashedOtp = userOtpRecords[userOtpRecords.length - 1].otp;

        if (expiresAt < Date.now()) {
          await otps.deleteMany({ id });
          throw new Error("Code has expired.Please request again");
        } else {
          const validOtp = await bcrypt.compare(otp, hashedOtp);
          if (!validOtp) {
            res.status(400).json({
              status: "invalid",
              message: "user email not verified",
            });
          } else {
            const updated = await users.findByIdAndUpdate(
              { _id: id },
              { $set: { verified: true } }
            );
            await otps.deleteMany({ id });
            res.status(201).json({
              status: "verified",
              message: "user email verified successfully",
            });
          }
        }
      }
    }
  } catch (error) {
    res.json({
      status: "failed",
      message: error.message,
    });
  }
};
textflow.useKey(
  "UE1pPYvB8ICAt2ODYKdDZ4LjdyoCqp6muJYaWcn7pyDGt0CWgioOE7wqKKbfNs00"
);
export const sendMobile = async (req, res) => {
  const { phoneNumber } = req.body;

  const verificationOptions = {
    service_name: "My app",
    seconds: 600,
  };
  try {
    const result = await textflow.sendVerificationSMS(
      phoneNumber,
      verificationOptions
    );
    return res.status(result.status).json({ result, message: result.message });
  } catch (error) {
    if (error) {
      return error;
    }
  }
};
export const verifyMobileCode = async (req, res) => {
  const { phoneNumber, code } = req.body;
  try {
    let result = await textflow.verifyCode(phoneNumber, code);
    if (result.valid) {
      return res.status(200).json(result.message);
    }
  } catch (error) {
    return res.status(result.status).json(result.message);
  }
};
