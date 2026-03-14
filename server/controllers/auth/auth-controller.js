import jwt from "jsonwebtoken";
import crypto from "crypto";
import nodemailer from "nodemailer";

import User from "../../models/user/user-model.js";

// Generate JWT
const generateToken = (userId) => {
  return jwt.sign({ id: userId }, process.env.JWT_SECRET, {
    expiresIn: "7d",
  });
};

// Helper function to send dev email using Ethereal
const sendDevEmail = async (toEmail, subject, htmlContent) => {
  // Create test account(Ethereal)
  let testAccount = await nodemailer.createTestAccount();

  // Create transporter
  let transporter = nodemailer.createTransport({
    host: testAccount.smtp.host,
    port: testAccount.smtp.port,
    secure: testAccount.smtp.secure,
    auth: {
      user: testAccount.user,
      pass: testAccount.pass,
    },
  });

  // Send Email
  let info = await transporter.sendMail({
    from: `"Focused" <${testAccount.user}>`,
    to: toEmail,
    subject: subject,
    html: htmlContent,
  });

  console.log("Message sent: %s", info.messageId);
  console.log("Preview URL: %s", nodemailer.getTestMessageUrl(info));
};

// Register a new User
export const registerUser = async (req, res) => {
  const { username, email, password } = req.body;

  try {
    // Check if the user exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res
        .status(400)
        .json({ message: "Email already in use. Try logging in." });
    }

    // Create a user
    const user = await User.create({ username, email, password });

    // Generate verification token
    const verificationToken = user.generateVerificationToken();
    await user.save({ validateBeforeSave: false });

    // Send verification email
    const verificationURL = `${process.env.CLIENT_URL}/verify-email?token=${verificationToken}`;

    // Send dev email
    await sendDevEmail(
      user.email,
      "Verify Your Email",
      `<p>Click <a href="${verificationURL}">here</a> to verify your email</p>`,
    );

    res.status(201).json({
      message:
        "User registered successfully! Check your console for the email preview URL.",
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Verify email
export const verifyEmail = async (req, res) => {
  const { token } = req.query;

  try {
    const hashedToken = crypto.createHash("sha256").update(token).digest("hex");

    const user = await User.findOne({
      verificationToken: hashedToken,
      verificationTokenExpires: { $gt: Date.now() },
    });

    if (!user)
      return res.status(400).json({ message: "Token is invalid or expired" });

    user.isVerified = true;
    user.verificationToken = undefined;
    user.verificationTokenExpires = undefined;

    await user.save({ validateBeforeSave: false });

    res.status(200).json({ message: "Email verified successfully!" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Login User
export const loginUser = async (req, res) => {
  const { email, password } = req.body;

  try {
    // Find user and select password
    const user = await User.findOne({ email }).select("+password");
    if (!user)
      return res.status(400).json({ message: "Invalid email or password." });

    // Check if email is verified
    if (!user.isVerified)
      return res.status(401).json({ message: "Email not verified." });

    // Compare password
    const isMatch = await user.matchPassword(password);
    if (!isMatch)
      return res.status(400).json({ message: "Invalid email or password." });

    // Send JWT
    const token = generateToken(user._id);
    res.status(200).json({
      token,
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
      },
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};


// Logout User
export const logoutUser = (req, res) => {
    res.cookie("token", "", {
        httpOnly: true,
        expires: new Date(0),
    })

    res.status(200).json({ message: "Logged out successfully"})
}