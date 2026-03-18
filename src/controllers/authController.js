const User = require("../models/User");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

exports.registerAdmin = async (req, res) => {
  try {
    const { username, password, role } = req.body;

    // Capture the IP from the request object
    const systemIp =
      req.ip || req.headers["x-forwarded-for"] || req.socket.remoteAddress;

    // Strict Requirement: Only allow Admin registration via this endpoint
    if (role !== "Admin") {
      return res.status(403).json({
        success: false,
        message:
          "Registration is restricted to Admin users only. Candidates and Tutors must be created by an Admin.",
      });
    }

    const hashedPassword = await bcrypt.hash(password, 12);
    const admin = new User({
      username,
      password: hashedPassword,
      role: "Admin",
      registrationIp: systemIp,
    });

    await admin.save();
    res
      .status(201)
      .json({
        success: true,
        message: "Admin registered successfully",
        detectedIp: systemIp,
      });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

exports.login = async (req, res) => {
  try {
    const { username, password, role } = req.body;
    const systemIp =
      req.ip || req.headers["x-forwarded-for"] || req.socket.remoteAddress;

    const user = await User.findOne({ username });
    if (!user) return res.status(401).json({ message: "Invalid credentials" });

    // If the client sends a role, ensure it matches the stored role
    if (role && user.role !== role) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch)
      return res.status(401).json({ message: "Invalid credentials" });

    // Update IP on every login
    user.lastLoginIp = systemIp;
    await user.save();

    const token = jwt.sign(
      { id: user._id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: "1d" },
    );

    res.json({ success: true, token, role: user.role, ip: systemIp });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};
exports.logout = async (req, res) => {
  try {
    const { userid } = req.query;

    if (!userid) {
      return res.status(400).json({
        success: false,
        message: "userid is required",
      });
    }

    const user = await User.findById(userid);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // Save logout timestamp
    user.lastLogoutAt = new Date();
    await user.save();

    res.status(200).json({
      success: true,
      message: "User logged out successfully",
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      error: err.message,
    });
  }
};
exports.changePassword = async (req, res) => {
  try {
    const { userType, userId, oldPassword, newPassword } = req.body;

    if (!userType || !userId || !oldPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        message: "All fields are required"
      });
    }

    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found"
      });
    }

    // Ensure userType matches
    if (user.userType !== userType && user.role !== userType) {
      return res.status(403).json({
        success: false,
        message: "Unauthorized operation"
      });
    }

    // Check old password
    const isMatch = await bcrypt.compare(oldPassword, user.password);

    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: "Old password is incorrect"
      });
    }

    // Prevent same password reuse (optional but smart)
    const isSamePassword = await bcrypt.compare(newPassword, user.password);

    if (isSamePassword) {
      return res.status(400).json({
        success: false,
        message: "New password must be different from old password"
      });
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 12);

    user.password = hashedPassword;
    await user.save();

    res.status(200).json({
      success: true,
      message: "Password changed successfully"
    });

  } catch (err) {
    res.status(500).json({
      success: false,
      error: err.message
    });
  }
};
exports.deleteUser = async (req, res) => {
  try {
    const { userType, userId } = req.body;

    if (!userType || !userId) {
      return res.status(400).json({
        success: false,
        message: "userType and userId are required"
      });
    }

    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found"
      });
    }

    // Ensure the provided userType matches the stored one
    if (user.userType !== userType && user.role !== userType) {
      return res.status(403).json({
        success: false,
        message: "User type mismatch"
      });
    }

    await User.findByIdAndDelete(userId);

    res.status(200).json({
      success: true,
      message: `${userType} deleted successfully`
    });

  } catch (err) {
    res.status(500).json({
      success: false,
      error: err.message
    });
  }
};
exports.newAdmin = async (req, res) => {
  try {
    const {
      userType,
      password,
      surname,
      firstname,
      gender,
      phoneNo,
      email,
      birthday,
      passport,
      address,
      otherName,
      physicalChallenge,
      tenant,
      imagePhoto,
    } = req.body;

    const systemIp =
      req.ip || req.headers["x-forwarded-for"] || req.socket.remoteAddress;

    // Ensure only Admin accounts are created
    if (userType !== "Admin") {
      return res.status(403).json({
        success: false,
        message: "This endpoint is restricted to Admin creation only",
      });
    }

    // Check if email already exists
    const existingUser = await User.findOne({ email });

    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: "Admin with this email already exists",
      });
    }

    const hashedPassword = await bcrypt.hash(password, 12);

    const admin = new User({
      userType,
      password: hashedPassword,
      surname,
      firstname,
      gender,
      phoneNo,
      email,
      birthday,
      passport,
      address,
      otherName,
      physicalChallenge,
      tenant,
      imagePhoto,
      registrationIp: systemIp,
      role: "Admin",
    });

    await admin.save();

    res.status(201).json({
      success: true,
      message: "Admin created successfully",
      userId: admin._id,
      detectedIp: systemIp,
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      error: err.message,
    });
  }
};
exports.editAdminUser = async (req, res) => {
  try {
    const {
      userId,
      surname,
      firstname,
      gender,
      phoneNo,
      birthday,
      passport,
      tenant,
      imagePhoto,
    } = req.body;

    if (!userId) {
      return res.status(400).json({
        success: false,
        message: "userId is required",
      });
    }

    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // Update only fields that were sent
    if (surname) user.surname = surname;
    if (firstname) user.firstname = firstname;
    if (gender) user.gender = gender;
    if (phoneNo) user.phoneNo = phoneNo;
    if (birthday) user.birthday = birthday;
    if (passport) user.passport = passport;
    if (tenant) user.tenant = tenant;
    if (imagePhoto) user.imagePhoto = imagePhoto;

    await user.save();

    res.status(200).json({
      success: true,
      message: "Admin user updated successfully",
      data: user,
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      error: err.message,
    });
  }
};
exports.getAdminById = async (req, res) => {
  try {
    const { UserId, UserType } = req.query;

    if (!UserId) {
      return res.status(400).json({
        success: false,
        message: "UserId is required"
      });
    }

    const user = await User.findById(UserId).select('-password');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found"
      });
    }

    // Ensure it's an Admin
    if (user.role !== "Admin" && user.userType !== "Admin") {
      return res.status(403).json({
        success: false,
        message: "This endpoint is restricted to Admin users"
      });
    }

    // Optional check if UserType is provided
    if (UserType && user.userType !== UserType && user.role !== UserType) {
      return res.status(403).json({
        success: false,
        message: "UserType mismatch"
      });
    }

    res.status(200).json({
      success: true,
      data: user
    });

  } catch (err) {
    res.status(500).json({
      success: false,
      error: err.message
    });
  }
};
exports.newTutor = async (req, res) => {
  try {
    const {
      userType,
      password,
      surname,
      firstname,
      gender,
      phoneNo,
      email,
      birthday,
      tenant,
      address,
      passport,
      selectedSubjects
    } = req.body;

    const systemIp = req.ip || req.headers['x-forwarded-for'] || req.socket.remoteAddress;

    // Restrict to Tutor creation only
    if (userType !== "Tutor") {
      return res.status(403).json({
        success: false,
        message: "This endpoint is restricted to Tutor creation only"
      });
    }

    // Check existing email
    const existingUser = await User.findOne({ email });

    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: "User with this email already exists"
      });
    }

    const hashedPassword = await bcrypt.hash(password, 12);

    const tutor = new User({
      userType: "Tutor",
      role: "Tutor",
      password: hashedPassword,
      surname,
      firstname,
      gender,
      phoneNo,
      email,
      birthday,
      tenant,
      address,
      passport,
      selectedSubjects,
      registrationIp: systemIp
    });

    await tutor.save();

    res.status(201).json({
      success: true,
      message: "Tutor created successfully",
      userId: tutor._id
    });

  } catch (err) {
    res.status(500).json({
      success: false,
      error: err.message
    });
  }
};
exports.editTutorUser = async (req, res) => {
  try {
    const {
      userId,
      surname,
      firstname,
      gender,
      phoneNo,
      email,
      tenant,
      address,
      passport,
      selectedSubjects
    } = req.body;

    if (!userId) {
      return res.status(400).json({
        success: false,
        message: "userId is required"
      });
    }

    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found"
      });
    }

    // Ensure it's a Tutor
    if (user.role !== "Tutor" && user.userType !== "Tutor") {
      return res.status(403).json({
        success: false,
        message: "This endpoint is restricted to Tutor users"
      });
    }

    // Prevent duplicate email (if updating email)
    if (email && email !== user.email) {
      const existingEmail = await User.findOne({ email });
      if (existingEmail) {
        return res.status(400).json({
          success: false,
          message: "Email already in use"
        });
      }
    }

    // Update fields safely
    const updates = {
      surname,
      firstname,
      gender,
      phoneNo,
      email,
      tenant,
      address,
      passport
    };

    Object.keys(updates).forEach(key => {
      if (updates[key] !== undefined) {
        user[key] = updates[key];
      }
    });

    // Handle subjects separately
    if (Array.isArray(selectedSubjects)) {
      user.selectedSubjects = selectedSubjects;
    }

    await user.save();

    res.status(200).json({
      success: true,
      message: "Tutor updated successfully",
      data: user
    });

  } catch (err) {
    res.status(500).json({
      success: false,
      error: err.message
    });
  }
};
exports.getTutorDetailsById = async (req, res) => {
  try {
    const { UserType, UserId } = req.query;

    if (!UserType || !UserId) {
      return res.status(400).json({
        success: false,
        message: "UserType and UserId are required"
      });
    }

    // Enforce Tutor
    if (UserType !== "Tutor") {
      return res.status(403).json({
        success: false,
        message: "This endpoint is restricted to Tutor users"
      });
    }

    const user = await User.findById(UserId).select('-password');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "Tutor not found"
      });
    }

    // Extra safety check
    if (user.role !== "Tutor" && user.userType !== "Tutor") {
      return res.status(403).json({
        success: false,
        message: "User is not a Tutor"
      });
    }

    res.status(200).json({
      success: true,
      message: "Tutor details fetched successfully",
      data: user
    });

  } catch (err) {
    res.status(500).json({
      success: false,
      error: err.message
    });
  }
};
exports.newCandidate = async (req, res) => {
  try {
    const {
      userType,
      password,
      surname,
      firstname,
      gender,
      phoneNo,
      email,
      birthday,
      passport,
      otherName,
      physicalChallenge,
      tenant,
      selectedSubjs
    } = req.body;

    const systemIp = req.ip || req.headers['x-forwarded-for'] || req.socket.remoteAddress;

    // Restrict to Candidate creation only
     if (userType !== "Candidate") {
      return res.status(403).json({
        success: false,
        message: "This endpoint is restricted to Candidate creation only"
      });
    }

    // Check existing email
    const existingUser = await User.findOne({ email });

    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: "User with this email already exists"
      });
    }

    const hashedPassword = await bcrypt.hash(password, 12);

    const candidate = new User({
      userType: "Candidate",
      role: "Candidate",
      password: hashedPassword,
      surname,
      firstname,
      gender,
      phoneNo,
      email,
      birthday,
      tenant,
      address,
      passport,
      selectedSubjects,
      registrationIp: systemIp
    });

    await candidate.save();

    res.status(201).json({
      success: true,
      message: "Candidate created successfully",
      userId: candidate._id
    });

  } catch (err) {
    res.status(500).json({
      success: false,
      error: err.message
    });
  }
};
exports.editCandidateUser = async (req, res) => {
  try {
    const {
      userId,
      password,
      surname,
      firstname,
      gender,
      phoneNo,
      email,
      birthday,
      passport,
      otherName,
      physicalChallenge,
      tenant,
      selectedSubjs
    } = req.body;

    if (!userId) {
      return res.status(400).json({
        success: false,
        message: "userId is required"
      });
    }

    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found"
      });
    }

    // Ensure it's a Candidate
    if (user.role !== "Candidate" && user.userType !== "Candidate") {
      return res.status(403).json({
        success: false,
        message: "This endpoint is restricted to Candidate users"
      });
    }

    // Prevent duplicate email if email is being changed
    if (email && email !== user.email) {
      const existingEmail = await User.findOne({ email });
      if (existingEmail) {
        return res.status(400).json({
          success: false,
          message: "Email already in use"
        });
      }
    }

    // Update plain fields only if provided
    const updates = {
      surname,
      firstname,
      gender,
      phoneNo,
      email,
      birthday,
      passport,
      otherName,
      physicalChallenge,
      tenant
    };

    Object.keys(updates).forEach((key) => {
      if (updates[key] !== undefined) {
        user[key] = updates[key];
      }
    });

    // Update password only if provided
    if (password) {
      user.password = await bcrypt.hash(password, 12);
    }

    // Update subjects only if provided as an array
    if (Array.isArray(selectedSubjs)) {
      user.selectedSubjs = selectedSubjs;
    }

    await user.save();

    res.status(200).json({
      success: true,
      message: "Candidate updated successfully",
      data: user
    });

  } catch (err) {
    res.status(500).json({
      success: false,
      error: err.message
    });
  }
};
exports.getCandidateDetailsById = async (req, res) => {
  try {
    const { UserType, UserId } = req.query;

    if (!UserId) {
      return res.status(400).json({
        success: false,
        message: "UserId is required"
      });
    }

    const user = await User.findById(UserId).select('-password');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "Candidate not found"
      });
    }

    // Ensure it's a Candidate
    if (user.role !== "Candidate" && user.userType !== "Candidate") {
      return res.status(403).json({
        success: false,
        message: "This endpoint is restricted to Candidate users"
      });
    }

    // Optional check if UserType is provided
    if (UserType && user.userType !== UserType && user.role !== UserType) {
      return res.status(403).json({
        success: false,
        message: "UserType mismatch"
      });
    }

    res.status(200).json({
      success: true,
      message: "Candidate details fetched successfully",
      data: user
    });

  } catch (err) {
    res.status(500).json({
      success: false,
      error: err.message
    });
  }
};

