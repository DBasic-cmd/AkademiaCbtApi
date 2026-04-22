const mongoose = require('mongoose');
const UserSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { type: String, enum: ['Admin', 'Candidate', 'Tutor'], required: true },
  userType: { type: String },
  username: { type: String },
  
  // Shared Fields
  surname: { type: String },
  firstname: { type: String }, // Note: Candidate uses firstName (capital N) in your JSON
  phoneNo: { type: String },
  gender: { type: String },
  image: { type: String, default: "" },
  passport: { type: String, default: null },
  tenant: { type: String },
  address: { type: String },
  birthday: { type: String },
  selectedSubjects: { type: [String], default: [] },
  registrationIp: { type: String },
  
  // Tutor Specific
  staffId: { type: String },
  tutorSubjs: { type: [Number], default: [] },
  
  // Candidate Specific
  regNo: { type: String },
  otherName: { type: String },
  physicalChallenge: { type: String },
  dateOfBirth: { type: String }, // Maps to birthday in your Admin model
  
  // Admin Meta
  isActive: { type: Boolean, default: true },
  createdBy: { type: String, default: "Sys" },
}, { timestamps: true });
module.exports = mongoose.model('User', UserSchema);