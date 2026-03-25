const mongoose = require("mongoose");

const UserSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true, // Good practice for emails
      trim: true,
    },
    password: { type: String, required: true },
    // Three supported roles for the system
    role: {
      type: String,
      enum: ["Admin", "Candidate", "Tutor"],
      default: "Candidate",
    },
    registrationIp: { type: String }, // Captured from system
    lastLoginIp: { type: String },
  },
  { timestamps: true },
);

module.exports = mongoose.model("User", UserSchema);
