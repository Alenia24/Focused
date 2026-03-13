import mongoose from "mongoose";
import bcrypt from "bcrypt";
import crypto from "crypto";
import validator from "validator";

// Define the User Schema
const userSchema = new mongoose.Schema(
  {
    username: {
      type: String,
      required: [true, "Username is required!"],
      trim: true,
    },
    email: {
      type: String,
      required: [true, "Email is required!"],
      unique: true,
      lowercase: true,
      validate: [validator.isEmail, "Please provide a valid email!"],
    },
    password: {
      type: String,
      required: [true, "Password is required!"],
      minlength: 6,
      select: false,
    },
    isVerified: {
      type: Boolean,
      default: false,
    },
    verificationToken: {
      type: String,
    },
    verificationTokenExpires: {
      type: Date,
    },
  },
  { timestamps: true },
);

// Hash the password before saving
userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();

  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// Compare entered password with hashed password
userSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

// Generate email verification token
userSchema.methods.generateVerificationToken = function () {
    const token = crypto.randomBytes(32).toString("hex");

    this.verificationToken = crypto.createHash("sha256").update(token).digest("hex");
    this.verificationTokenExpires = Date.now() + 24 * 60 * 60 * 1000;

    return token;
}

const User = mongoose.model("User", userSchema);
export default User;