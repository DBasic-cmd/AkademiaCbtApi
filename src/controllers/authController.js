const User = require("../models/User");
const Counter = require("../models/Counter");
const Subject = require("../models/Subject");
const Exam = require('../models/Exam');
const Question = require("../models/Question");
const Result = require("../models/Result");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

console.log("Subject.find:", typeof Subject.find);
console.log("Question.find:", typeof Question.find);

exports.login = async (req, res) => {
  try {
    // 1. Destructure 'email' instead of 'username'
    const { email, password, role } = req.body;

    const systemIp =
      req.ip || req.headers["x-forwarded-for"] || req.socket.remoteAddress;

    // 2. Find the user by email
    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) return res.status(401).json({ message: "Invalid credentials" });

    // 3. Role check (Ensures an Admin isn't logging in through a Candidate portal)
    if (role && user.role !== role) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    // 4. Compare passwords
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch)
      return res.status(401).json({ message: "Invalid credentials" });

    // 5. Update last login IP
    user.lastLoginIp = systemIp;
    await user.save();

    // 6. Generate JWT
    const token = jwt.sign(
      { id: user._id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: "1d" },
    );

    res.json({
      success: true,
      token,
      role: user.role,
      userid: user._id,
      ip: systemIp,
    });
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
    const { oldPassword, newPassword } = req.body;
    const userId = req.user.id;

    if (!oldPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        message: "oldPassword and newPassword are required",
      });
    }

    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    const isMatch = await bcrypt.compare(oldPassword, user.password);

    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: "Old password is incorrect",
      });
    }

    const isSamePassword = await bcrypt.compare(newPassword, user.password);

    if (isSamePassword) {
      return res.status(400).json({
        success: false,
        message: "New password must be different from old password",
      });
    }

    user.password = await bcrypt.hash(newPassword, 12);
    await user.save();

    res.status(200).json({
      success: true,
      message: "Password changed successfully",
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      error: err.message,
    });
  }
};
exports.deleteUser = async (req, res) => {
  try {
    const { userType, userId } = req.body;

    if (!userType || !userId) {
      return res.status(400).json({
        success: false,
        message: "userType and userId are required",
      });
    }

    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // Ensure the provided userType matches the stored one
    if (user.userType !== userType && user.role !== userType) {
      return res.status(403).json({
        success: false,
        message: "User type mismatch",
      });
    }

    await User.findByIdAndDelete(userId);

    res.status(200).json({
      success: true,
      message: `${userType} deleted successfully`,
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      error: err.message,
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
exports.getAdminDetailsById = async (req, res) => {
  try {
    const { UserId, UserType } = req.query;

    const user = await User.findById(UserId);

    if (!user || user.role !== "Admin") {
      return res.status(404).json({
        success: false,
        message: "Admin not found",
      });
    }

    res.json({
      success: true,
      responseCode: null,
      code: 0,
      message: "Success",
      errors: null,
      data: {
        id: user._id,
        password: user.password,
        surname: user.surname,
        firstname: user.firstname,
        gender: user.gender,
        phoneNo: user.phoneNo,
        email: user.email,
        birthday: user.dateOfBirth,
        passport: user.passport,
        isActive: user.isActive,
        isDelete: user.isDelete,
        createdBy: user.createdBy,
        createdDate: user.createdDate,
        image: user.image,
      },
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      error: err.message,
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
      selectedSubjects,
    } = req.body;

    const DEFAULT_PASSWORD = "AkadaPassword#2!";
    const finalPassword = password || DEFAULT_PASSWORD;

    const systemIp =
      req.ip || req.headers["x-forwarded-for"] || req.socket.remoteAddress;

    // Restrict to Tutor creation only
    if (userType !== "Tutor") {
      return res.status(403).json({
        success: false,
        message: "This endpoint is restricted to Tutor creation only",
      });
    }

    // Check existing email
    const existingUser = await User.findOne({ email });

    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: "User with this email already exists",
      });
    }

    const hashedPassword = await bcrypt.hash(finalPassword, 12);

    const tutor = new User({
      userType: "Tutor",
      role: "Tutor",
      password: hashedPassword,
      surname,
      firstname,
      username: email,
      gender,
      phoneNo,
      email,
      birthday,
      tenant,
      address,
      passport,
      selectedSubjects,
      registrationIp: systemIp,
    });

    await tutor.save();

    res.status(201).json({
      success: true,
      message: "Tutor created successfully",
      userId: tutor._id,
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      error: err.message,
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
      selectedSubjects,
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

    // Ensure it's a Tutor
    if (user.role !== "Tutor" && user.userType !== "Tutor") {
      return res.status(403).json({
        success: false,
        message: "This endpoint is restricted to Tutor users",
      });
    }

    // Prevent duplicate email (if updating email)
    if (email && email !== user.email) {
      const existingEmail = await User.findOne({ email });
      if (existingEmail) {
        return res.status(400).json({
          success: false,
          message: "Email already in use",
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
      passport,
    };

    Object.keys(updates).forEach((key) => {
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
      data: user,
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      error: err.message,
    });
  }
};
exports.getTutorDetailsById = async (req, res) => {
  try {
    const { UserId } = req.query;

    if (!UserId) {
      return res.status(400).json({
        success: false,
        message: "UserId is required",
      });
    }

    const user = await User.findById(UserId);

    if (!user || user.role !== "Tutor") {
      return res.status(404).json({
        success: false,
        message: "Tutor not found",
      });
    }

    res.json({
      success: true,
      responseCode: null,
      code: 0,
      message: "Success",
      errors: null,
      data: {
        id: user._id,
        staffId: user.staffId,
        surname: user.surname,
        firstname: user.firstname,
        phoneNo: user.phoneNo,
        email: user.email,
        gender: user.gender,
        tenant: user.tenant,
        image: user.image || user.passport || "",
        address: user.address,
        passport: user.passport,
        selectedSubjects: user.selectedSubjects || [],
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
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
      selectedSubjs,
    } = req.body;

    const DEFAULT_PASSWORD = "AkadaPassword#2!";
    const finalPassword = password || DEFAULT_PASSWORD;

    const systemIp =
      req.ip || req.headers["x-forwarded-for"] || req.socket.remoteAddress;

    if (userType !== "Candidate") {
      return res.status(403).json({
        success: false,
        message: "This endpoint is restricted to Candidate creation only",
      });
    }

    const existingUser = await User.findOne({ email });

    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: "User with this email already exists",
      });
    }

    const hashedPassword = await bcrypt.hash(finalPassword, 12);
    let normalizedSubjects = selectedSubjs || [];

    if (typeof normalizedSubjects === "string") {
      normalizedSubjects = normalizedSubjects.split(",");
    }

    if (Array.isArray(normalizedSubjects)) {
      normalizedSubjects = normalizedSubjects.flatMap((item) => {
        if (typeof item === "string") {
          return item
            .replace(/"/g, "")
            .split(",")
            .map((id) => id.trim())
            .filter(Boolean);
        }

        return item;
      });
    }
    // 1. Atomically find and increment the counter
    const counter = await Counter.findOneAndUpdate(
      { id: "candidateRegNo" },
      { $inc: { seq: 1 } },
      { new: true, upsert: true }, // Creates the document if it doesn't exist yet
    );

    // 2. Format the registration number (e.g., 5 -> "REG0005")
    const paddedSeq = String(counter.seq).padStart(4, "0");
    const registrationNumber = `REG${paddedSeq}`;

    const candidate = new User({
      userType: "Candidate",
      role: "Candidate",
      password: hashedPassword,
      username: email,
      surname,
      firstname,
      otherName,
      gender,
      phoneNo,
      email,
      birthday,
      tenant,
      passport,
      physicalChallenge,
      selectedSubjects: normalizedSubjects,
      registrationIp: systemIp,
      regNo: registrationNumber,
    });

    await candidate.save();

    res.status(201).json({
      success: true,
      message: "Candidate created successfully",
      userId: candidate._id,
      regNo: registrationNumber,
    });
  } catch (err) {
    console.error("Error in newCandidate:", err);
    res.status(500).json({
      success: false,
      error: err.message,
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
      selectedSubjs,
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

    // Ensure it's a Candidate
    if (user.role !== "Candidate" && user.userType !== "Candidate") {
      return res.status(403).json({
        success: false,
        message: "This endpoint is restricted to Candidate users",
      });
    }

    // Prevent duplicate email if email is being changed
    if (email && email !== user.email) {
      const existingEmail = await User.findOne({ email });
      if (existingEmail) {
        return res.status(400).json({
          success: false,
          message: "Email already in use",
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
      tenant,
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
      data: user,
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      error: err.message,
    });
  }
};
exports.getCandidateDetailsById = async (req, res) => {
  try {
    const { UserId } = req.query;

    if (!UserId) {
      return res.status(400).json({
        success: false,
        message: "UserId is required",
      });
    }

    const user = await User.findById(UserId);

    if (!user || user.role !== "Candidate") {
      return res.status(404).json({
        success: false,
        message: "Candidate not found",
      });
    }

    res.json({
      success: true,
      responseCode: null,
      code: 0,
      message: "Success",
      errors: null,
      data: {
        id: user._id,
        regNo: user.regNo,
        surname: user.surname,
        firstName: user.firstname,
        otherName: user.otherName,
        physicalChallenge: user.physicalChallenge,
        gender: user.gender,
        phoneNo: user.phoneNo,
        email: user.email,
        passport: user.passport,
        dateOfBirth: user.dateOfBirth || user.birthday,
        tenant: user.tenant,
        image: user.image,
        selectedSubjects: user.selectedSubjects || [],
      },
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      error: err.message,
    });
  }
};

exports.addSubject = async (req, res) => {
  try {
    const { name, tenant, shortCode, description } = req.body;

    if (!name) {
      return res.status(400).json({
        success: false,
        message: "name is required",
      });
    }
    const trimmedName = name.trim();
    const trimmedTenant = (tenant || "DefaultTenant").trim();
    const trimmedShortCode = (
      shortCode || trimmedName.substring(0, 5).toUpperCase()
    ).trim();

    const existingSubject = await Subject.findOne({
      $or: [{ name: trimmedName }, { shortCode: trimmedShortCode }],
    });

    if (existingSubject) {
      return res.status(400).json({
        success: false,
        message: "Subject with this name or shortCode already exists",
      });
    }

    const subject = new Subject({
      name: trimmedName,
      tenant: trimmedTenant,
      shortCode: trimmedShortCode,
      description: description ? description.trim() : "",
    });

    await subject.save();

    res.status(201).json({
      success: true,
      message: "Subject added successfully",
      data: subject,
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      error: err.message,
    });
  }
};
exports.editSubject = async (req, res) => {
  try {
    const { id, name, description, shortCode } = req.body;

    if (!id) {
      return res.status(400).json({
        success: false,
        message: "id is required",
      });
    }

    const subject = await Subject.findById(id);

    if (!subject) {
      return res.status(404).json({
        success: false,
        message: "Subject not found",
      });
    }

    // Check duplicates if name or shortCode is being updated
    if (name || shortCode) {
      const duplicate = await Subject.findOne({
        _id: { $ne: id },
        tenant: subject.tenant,
        $or: [
          name ? { name: name.trim() } : null,
          shortCode ? { shortCode: shortCode.trim() } : null,
        ].filter(Boolean),
      });

      if (duplicate) {
        return res.status(400).json({
          success: false,
          message: "Another subject with same name or shortCode exists",
        });
      }
    }

    if (name !== undefined) subject.name = name.trim();
    if (description !== undefined) subject.description = description.trim();
    if (shortCode !== undefined) subject.shortCode = shortCode.trim();

    await subject.save();

    res.status(200).json({
      success: true,
      message: "Subject updated successfully",
      data: subject,
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      error: err.message,
    });
  }
};
exports.getSubjectList = async (req, res) => {
  try {
    // Defensively rename destructuring keys to prevent variable shadowing collisions
    let { PageNo, PageSize, Tenant: tenantQuery, Name: nameQuery } = req.query;

    PageNo = parseInt(PageNo, 10) || 1;
    PageSize = parseInt(PageSize, 10) || 10;

    if (PageNo < 1 || (PageSize < 1 && PageSize !== -1)) {
      return res.status(400).json({
        success: false,
        message: "PageNo must be greater than 0, and PageSize must be greater than 0 or equal to -1",
      });
    }

    const filter = {};

    if (tenantQuery) {
      filter.tenant = tenantQuery.trim();
    }

    if (nameQuery) {
      filter.name = { $regex: nameQuery.trim(), $options: "i" };
    }

    // This cleanly safely executes now because 'Subject' points entirely to your compiled Mongoose schema!
    const totalRecords = await Subject.countDocuments(filter);

    const subjects = await Subject.find(filter)
      .sort({ createdAt: -1 })
      .skip((PageNo - 1) * PageSize)
      .limit(PageSize);

    return res.status(200).json({
      success: true,
      message: "Subjects fetched successfully",
      data: subjects,
      pagination: {
        pageNo: PageNo,
        pageSize: PageSize,
        totalRecords,
        totalPages: Math.ceil(totalRecords / PageSize),
      },
    });
  } catch (err) {
    console.error("getSubjectList error context:", err);
    return res.status(500).json({
      success: false,
      error: err.message,
    });
  }
};
exports.fetchSubjects = async (req, res) => {
  try {
    // Force Node to look exactly at the required module to bypass any variable shadowing bugs
    const SubjectModel = require("../models/Subject");

    const subjects = await SubjectModel.find()
      .select("_id name shortCode tenant")
      .sort({ name: 1 });

    return res.status(200).json({
      success: true,
      message: "Subjects fetched successfully",
      data: subjects,
    });
  } catch (err) {
    console.error("fetchSubjects runtime failure:", err);
    return res.status(500).json({
      success: false,
      error: err.message,
    });
  }
};
exports.deleteSubject = async (req, res) => {
  try {
    const { subjectId } = req.query;

    if (!subjectId) {
      return res.status(400).json({
        success: false,
        message: "subjectId is required",
      });
    }

    const subject = await Subject.findById(subjectId);

    if (!subject) {
      return res.status(404).json({
        success: false,
        message: "Subject not found",
      });
    }

    await Subject.findByIdAndDelete(subjectId);

    res.status(200).json({
      success: true,
      message: "Subject deleted successfully",
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      error: err.message,
    });
  }
};
exports.newQuestion = async (req, res) => {
  try {
    const {
      subject,
      examYear,
      orderId,
      ask,
      option1,
      option2,
      option3,
      option4,
      answer,
      score,
    } = req.body;

    // Basic validation
    if (
      !subject ||
      !examYear ||
      orderId === undefined ||
      !ask ||
      !option1 ||
      !option2 ||
      !option3 ||
      !option4 ||
      !answer ||
      score === undefined
    ) {
      return res.status(400).json({
        success: false,
        message: "All fields are required",
      });
    }

    // Check subject exists
    const subjectExists = await Subject.findOne({ name: subject.trim() });

    if (!subjectExists) {
      return res.status(404).json({
        success: false,
        message: "Subject not found",
      });
    }

    // Validate answer is one of the options
    const options = [option1, option2, option3, option4];

    if (!options.includes(answer)) {
      return res.status(400).json({
        success: false,
        message: "Answer must match one of the options",
      });
    }

    const question = new Question({
      subject: subject.trim(),
      examYear,
      orderId,
      ask: ask.trim(),
      option1: option1.trim(),
      option2: option2.trim(),
      option3: option3.trim(),
      option4: option4.trim(),
      answer: answer.trim(),
      score,
    });

    await question.save();

    res.status(201).json({
      success: true,
      message: "Question created successfully",
      data: question,
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      error: err.message,
    });
  }
};
exports.updateQuestion = async (req, res) => {
  try {
    const {
      questionId,
      subject,
      examYear,
      orderId,
      ask,
      option1,
      option2,
      option3,
      option4,
      answer,
      score,
    } = req.body;

    if (!questionId) {
      return res.status(400).json({
        success: false,
        message: "questionId is required",
      });
    }

    const question = await Question.findById(questionId);

    if (!question) {
      return res.status(404).json({
        success: false,
        message: "Question not found",
      });
    }

    if (subject !== undefined) {
      const subjectExists = await Subject.findOne({ name: subject.trim() });

      if (!subjectExists) {
        return res.status(404).json({
          success: false,
          message: "Subject not found",
        });
      }
    }

    const finalOption1 =
      option1 !== undefined ? option1.trim() : question.option1;
    const finalOption2 =
      option2 !== undefined ? option2.trim() : question.option2;
    const finalOption3 =
      option3 !== undefined ? option3.trim() : question.option3;
    const finalOption4 =
      option4 !== undefined ? option4.trim() : question.option4;
    const finalAnswer = answer !== undefined ? answer.trim() : question.answer;

    const options = [finalOption1, finalOption2, finalOption3, finalOption4];

    if (!options.includes(finalAnswer)) {
      return res.status(400).json({
        success: false,
        message: "Answer must match one of the options",
      });
    }

    if (subject !== undefined) question.subject = subject.trim();
    if (examYear !== undefined) question.examYear = examYear.trim();
    if (orderId !== undefined) question.orderId = orderId;
    if (ask !== undefined) question.ask = ask.trim();
    if (option1 !== undefined) question.option1 = option1.trim();
    if (option2 !== undefined) question.option2 = option2.trim();
    if (option3 !== undefined) question.option3 = option3.trim();
    if (option4 !== undefined) question.option4 = option4.trim();
    if (answer !== undefined) question.answer = answer.trim();
    if (score !== undefined) question.score = score;

    await question.save();

    res.status(200).json({
      success: true,
      message: "Question updated successfully",
      data: question,
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      error: err.message,
    });
  }
};
exports.getCandidateList = async (req, res) => {
  try {
    let { pageNo, pageSize, PhoneNo, Email, fromDate, toDate } = req.query;

    // Pagination defaults
    pageNo = parseInt(pageNo) || 1;
    pageSize = parseInt(pageSize) || 10;

    if (pageNo < 1 || pageSize < 1) {
      return res.status(400).json({
        success: false,
        message: "pageNo and pageSize must be greater than 0",
      });
    }

    // Base filter (only Candidates)
    const filter = {
      $or: [{ role: "Candidate" }, { userType: "Candidate" }],
    };

    // Filter by Phone Number
    if (PhoneNo) {
      filter.phoneNo = { $regex: PhoneNo.trim(), $options: "i" };
    }

    // Filter by Email
    if (Email) {
      filter.email = { $regex: Email.trim(), $options: "i" };
    }

    // Filter by Date Range
    if (fromDate || toDate) {
      filter.createdAt = {};

      if (fromDate) {
        filter.createdAt.$gte = new Date(fromDate);
      }

      if (toDate) {
        filter.createdAt.$lte = new Date(toDate);
      }
    }

    // Total count
    const totalRecords = await User.countDocuments(filter);

    // Fetch data
    const candidates = await User.find(filter)
      .select("-password") // never expose password
      .sort({ createdAt: -1 })
      .skip((pageNo - 1) * pageSize)
      .limit(pageSize);

    res.status(200).json({
      success: true,
      message: "Candidates fetched successfully",
      data: candidates,
      pagination: {
        pageNo,
        pageSize,
        totalRecords,
        totalPages: Math.ceil(totalRecords / pageSize),
      },
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      error: err.message,
    });
  }
};
exports.getTutorList = async (req, res) => {
  try {
    let { pageNo, pageSize, PhoneNo, Email, fromDate, toDate } = req.query;

    pageNo = parseInt(pageNo) || 1;
    pageSize = parseInt(pageSize) || 10;

    if (pageNo < 1 || pageSize < 1) {
      return res.status(400).json({
        success: false,
        message: "pageNo and pageSize must be greater than 0",
      });
    }

    const filter = {
      $or: [{ role: "Tutor" }, { userType: "Tutor" }],
    };

    if (PhoneNo) {
      filter.phoneNo = { $regex: PhoneNo.trim(), $options: "i" };
    }

    if (Email) {
      filter.email = { $regex: Email.trim(), $options: "i" };
    }

    if (fromDate || toDate) {
      filter.createdAt = {};

      if (fromDate) {
        filter.createdAt.$gte = new Date(fromDate);
      }

      if (toDate) {
        filter.createdAt.$lte = new Date(toDate);
      }
    }

    const totalRecords = await User.countDocuments(filter);

    const tutors = await User.find(filter)
      .select("-password")
      .sort({ createdAt: -1 })
      .skip((pageNo - 1) * pageSize)
      .limit(pageSize);

    res.status(200).json({
      success: true,
      message: "Tutors fetched successfully",
      data: tutors,
      pagination: {
        pageNo,
        pageSize,
        totalRecords,
        totalPages: Math.ceil(totalRecords / pageSize),
      },
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      error: err.message,
    });
  }
};
exports.bulkQuestion = async (req, res) => {
  try {
    const questions = req.body;

    if (!Array.isArray(questions) || questions.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Request body must be a non-empty array of questions",
      });
    }

    const preparedQuestions = [];

    for (let i = 0; i < questions.length; i++) {
      const item = questions[i];

      const {
        subject,
        examYear,
        orderId,
        ask,
        option1,
        option2,
        option3,
        option4,
        answer,
        score,
      } = item;

      if (
        !subject ||
        !examYear ||
        orderId === undefined ||
        !ask ||
        !option1 ||
        !option2 ||
        !option3 ||
        !option4 ||
        !answer ||
        score === undefined
      ) {
        return res.status(400).json({
          success: false,
          message: `All fields are required for item at index ${i}`,
        });
      }

      const subjectExists = await Subject.findOne({ name: subject.trim() });

      if (!subjectExists) {
        return res.status(404).json({
          success: false,
          message: `Subject not found for item at index ${i}: ${subject}`,
        });
      }

      const options = [
        option1.trim(),
        option2.trim(),
        option3.trim(),
        option4.trim(),
      ];

      if (!options.includes(answer.trim())) {
        return res.status(400).json({
          success: false,
          message: `Answer must match one of the options for item at index ${i}`,
        });
      }

      preparedQuestions.push({
        subject: subject.trim(),
        examYear: examYear.trim(),
        orderId,
        ask: ask.trim(),
        option1: option1.trim(),
        option2: option2.trim(),
        option3: option3.trim(),
        option4: option4.trim(),
        answer: answer.trim(),
        score,
      });
    }

    const insertedQuestions = await Question.insertMany(preparedQuestions);

    res.status(201).json({
      success: true,
      message: "Questions uploaded successfully",
      totalUploaded: insertedQuestions.length,
      data: insertedQuestions,
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      error: err.message,
    });
  }
};
exports.getQuestionList = async (req, res) => {
  try {
    // 1. Rename 'Subject' to 'subjectQuery' to prevent shadowing the global Model variable!
    let { PageNo, PageSize, ExamYear, Subject: subjectQuery } = req.query;

    PageNo = parseInt(PageNo, 10) || 1;
    PageSize = parseInt(PageSize, 10) || 10;

    const filter = {};

    if (ExamYear) {
      filter.examYear = ExamYear.trim();
    }

    // 2. TUTOR RESTRICTION GATEWAY
    if (req.user?.role === "Tutor") {
      const tutor = await User.findById(req.user.id || req.user._id);

      if (!tutor) {
        return res.status(404).json({ success: false, message: "Tutor profile not found" });
      }

      // Safeguard array values from selectedSubjects
      const assignedSubjectIds = Array.isArray(tutor.selectedSubjects)
        ? tutor.selectedSubjects.filter(Boolean)
        : [];
        
      if (!assignedSubjectIds.length) {
        return res.status(403).json({
          success: false,
          message: "You have not been assigned to any subjects yet.",
        });
      }

      // Explicitly pull the Subject model to guarantee context isolation
      const SubjectModel = require("../models/Subject");
      const assignedSubjects = await SubjectModel.find({
        _id: { $in: assignedSubjectIds },
      }).select("name");

      const allowedSubjectNames = assignedSubjects.map((s) => s.name);

      // If the tutor filters by a specific subject, check if they own it
      if (subjectQuery) {
        const trimmedQuery = subjectQuery.trim();
        if (!allowedSubjectNames.some(name => name.toLowerCase() === trimmedQuery.toLowerCase())) {
          return res.status(403).json({
            success: false,
            message: "Access Denied: You are not assigned to view this subject.",
          });
        }
        filter.subject = { $regex: `^${trimmedQuery}$`, $options: "i" };
      } else {
        // If no filter is applied, strictly return questions matching ANY of their assigned subjects
        filter.subject = { $in: allowedSubjectNames };
      }
    } else {
      // ADMIN PATHWAY (Can see everything or filter globally)
      if (subjectQuery) {
        filter.subject = { $regex: subjectQuery.trim(), $options: "i" };
      }
    }

    // Bypass server pagination if PageSize is explicitly configured to -1
    const isPaginationDisabled = parseInt(PageSize, 10) === -1;
    const totalRecords = await Question.countDocuments(filter);
    let queryExecution = Question.find(filter).sort({ examYear: -1, createdAt: -1 });

    if (!isPaginationDisabled) {
      queryExecution = queryExecution.skip((PageNo - 1) * PageSize).limit(PageSize);
    }

    const questions = await queryExecution;

    return res.status(200).json({
      success: true,
      message: "Questions loaded successfully",
      data: questions,
      pagination: {
        pageNo: PageNo,
        pageSize: isPaginationDisabled ? totalRecords : PageSize,
        totalRecords,
        totalPages: isPaginationDisabled ? 1 : Math.ceil(totalRecords / PageSize),
      },
    });
  } catch (err) {
    console.error("getQuestionList error:", err);
    return res.status(500).json({ success: false, error: err.message });
  }
};
exports.viewBulkQuestion = async (req, res) => {
  try {
    const { questionId } = req.query;

    if (!questionId) {
      return res.status(400).json({
        success: false,
        message: "questionId is required",
      });
    }

    const question = await Question.findById(questionId);

    if (!question) {
      return res.status(404).json({
        success: false,
        message: "Question not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Question fetched successfully",
      data: question,
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      error: err.message,
    });
  }
};
exports.viewMyExamProfile = async (req, res) => {
  try {
    const { CandidateRegNo } = req.query;

    if (!CandidateRegNo) {
      return res.status(400).json({
        success: false,
        message: "CandidateRegNo is required",
      });
    }

    // Find candidate by RegNo
    const candidate = await User.findOne({
      $and: [
        { $or: [{ role: "Candidate" }, { userType: "Candidate" }] },
        { regNo: CandidateRegNo }, // adjust field name if needed
      ],
    }).select("-password");

    if (!candidate) {
      return res.status(404).json({
        success: false,
        message: "Candidate not found",
      });
    }

    // Optional: fetch subject details if IDs are stored
    let subjects = [];

    const subjectIds =
      candidate.selectedSubjects || candidate.selectedSubjs || [];

    if (Array.isArray(subjectIds) && subjectIds.length > 0) {
      subjects = await Subject.find({
        _id: { $in: subjectIds },
      }).select("name shortCode");
    }

    res.status(200).json({
      success: true,
      message: "Exam profile fetched successfully",
      data: {
        candidate,
        subjects,
      },
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      error: err.message,
    });
  }
};
exports.getExamQuestions = async (req, res) => {
  try {
    const { RegNo, ChoiceSubject, ExamYear } = req.query;
    const now = new Date();

    // 1. Find the scheduled exam configuration matching the subject and year (latest first)
    const examSchedule = await Exam.findOne({
      subject: { $regex: `^${ChoiceSubject.trim()}$`, $options: "i" },
      examYear: ExamYear.trim()
    }).sort({ createdAt: -1 });

    if (!examSchedule) {
      return res.status(404).json({
        success: false,
        message: "No exam has been scheduled for this subject and year combination."
      });
    }

    // Rule A: Candidate cannot start an exam UNTIL the scheduled time and date
    if (now < new Date(examSchedule.startTime)) {
      return res.status(403).json({
        success: false,
        message: `This exam room is locked. You can only join starting from ${new Date(examSchedule.startTime).toLocaleString()}`
      });
    }

    // Rule B: Can join after start time but CANNOT join after the end time window closes
    if (now > new Date(examSchedule.endTime)) {
      return res.status(403).json({
        success: false,
        message: "Access Denied: This exam session's scheduled time window has closed and expired."
      });
    }

    // 2. Verify Candidate Authorization
    const candidate = await User.findOne({ regNo: RegNo });
    if (!candidate) {
      return res.status(404).json({ success: false, message: "Candidate record not found." });
    }

    // 3. Fetch questions with answer data stripped for safety
    const questions = await Question.find({
      subject: { $regex: `^${ChoiceSubject.trim()}$`, $options: "i" },
      examYear: ExamYear.trim()
    }).select("-answer");

    // Calculate dynamic duration remaining if they joined late near the closing wall
    const totalSessionSecondsLeft = Math.floor((new Date(examSchedule.endTime) - now) / 1000);
    const standardDurationSeconds = (examSchedule.duration || 60) * 60;
    
    // Safety check: if they join late, their timer shouldn't exceed the absolute deadline wall
    const tailoredDurationSeconds = Math.min(standardDurationSeconds, totalSessionSecondsLeft);

    return res.status(200).json({
      success: true,
      examDetails: {
        title: examSchedule.title,
        endTime: examSchedule.endTime,
        // Send down computed remaining duration dynamically
        duration: Math.ceil(tailoredDurationSeconds / 60) 
      },
      questions
    });

  } catch (err) {
    console.error("getExamQuestions entry verification failure:", err);
    return res.status(500).json({ success: false, error: err.message });
  }
};
exports.scheduleExam = async (req, res) => {
  try {
    const { title, subject, examYear, startTime, endTime, duration } = req.body;

    if (!title || !subject || !examYear || !startTime || !endTime || !duration) {
      return res.status(400).json({ success: false, message: "All scheduling fields are required." });
    }

    // Convert string inputs explicitly into clear date instances
    const parsedStart = new Date(startTime);
    const parsedEnd = new Date(endTime);

    if (parsedStart >= parsedEnd) {
      return res.status(400).json({ success: false, message: "End time must be greater than start time." });
    }

    const questionCount = await Question.countDocuments({ subject, examYear });
    if (questionCount === 0) {
      return res.status(404).json({
        success: false,
        message: `No questions found for ${subject} (${examYear}). Please upload questions first.`
      });
    }

    const creatorId = req.user?.id || req.user?._id || null;

    // Save directly using the raw string mapping inputs to preserve exactly what the user picked
    const newExam = await Exam.create({
      title,
      subject,
      examYear,
      startTime: startTime, // Storing the ISO string directly avoids conversion drift
      endTime: endTime,
      duration,
      teacherId: creatorId
    });

    return res.status(201).json({ success: true, data: newExam });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
};
exports.getScheduledExamsList = async (req, res) => {
  try {
    const userRole = req.user?.role;
    let queryCondition = {};

    // If it's a Tutor, isolate them to their own records. If Admin, leaves condition empty {} to view all.
    if (userRole === "Tutor") {
      queryCondition.teacherId = req.user.id || req.user._id;
    } 

    const exams = await Exam.find(queryCondition)
      .populate("teacherId", "firstname surname email")
      .sort({ startTime: 1 });

    return res.status(200).json({ success: true, data: exams });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
};
exports.deleteQuestion = async (req, res) => {
  try {
    const { questId } = req.query;

    if (!questId) {
      return res.status(400).json({
        success: false,
        message: "questId is required",
      });
    }

    const question = await Question.findById(questId);

    if (!question) {
      return res.status(404).json({
        success: false,
        message: "Question not found",
      });
    }

    await Question.findByIdAndDelete(questId);

    res.status(200).json({
      success: true,
      message: "Question deleted successfully",
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      error: err.message,
    });
  }
};
exports.submitExam = async (req, res) => {
  try {
    const submissions = req.body;

    if (!Array.isArray(submissions) || submissions.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Request body must be a non-empty array",
      });
    }

    // 1. TIME WINDOW GATEKEEPER (Moved to the very top safely)
    const firstSubmission = submissions[0];
    const { subject, examYear } = firstSubmission;

    if (!subject || !examYear) {
      return res.status(400).json({
        success: false,
        message: "Subject and Exam Year must be specified in the submission metadata.",
      });
    }

    // Check if the actual exam schedule exists and has expired (latest first)
    const exam = await Exam.findOne({
      subject: { $regex: `^${subject.trim()}$`, $options: "i" },
      examYear: examYear.trim(),
    }).sort({ createdAt: -1 });

    if (!exam) {
      return res.status(400).json({
        success: false,
        message: "Submission rejected: No active scheduled exam found for this subject and year.",
      });
    }

    if (new Date() > new Date(exam.endTime)) {
      return res.status(403).json({
        success: false,
        message: "Submission rejected: The scheduled exam time window has expired.",
      });
    }

    const results = [];
    let totalScore = 0;

    // 2. Process questions matching safely
    for (let i = 0; i < submissions.length; i++) {
      const item = submissions[i];

      const {
        candidateId,
        regNo,
        questionId,
        orderId,
        submittedAnswer,
      } = item;

      // Handle cases where a student skips a question ('unanswered')
      if (!candidateId || !regNo || !questionId || orderId === undefined) {
        return res.status(400).json({
          success: false,
          message: `All core parameters are required for item at index ${i}`,
        });
      }

      // Fallback evaluation for skipped items
      if (!submittedAnswer || submittedAnswer === "unanswered" || submittedAnswer === "missed_exam_timeout") {
        results.push({
          candidateId,
          regNo,
          questionId,
          subject,
          examYear,
          orderId,
          submittedAnswer: submittedAnswer || "No Answer",
          correctAnswer: "N/A",
          isCorrect: false,
          scoreAwarded: 0,
        });
        continue;
      }

      const question = await Question.findById(questionId);

      if (!question) {
        return res.status(404).json({
          success: false,
          message: `Question record not found for item at index ${i}`,
        });
      }

      // Structural safety string checks
      if (question.subject.toLowerCase() !== item.subject.trim().toLowerCase()) {
        return res.status(400).json({
          success: false,
          message: `Subject mismatch layout error for item at index ${i}`,
        });
      }

      if (question.examYear !== item.examYear.trim()) {
        return res.status(400).json({
          success: false,
          message: `Exam year mismatch layout error for item at index ${i}`,
        });
      }

      const isCorrect =
        question.answer.trim().toLowerCase() ===
        submittedAnswer.trim().toLowerCase();

      const earnedScore = isCorrect ? Number(question.score || 0) : 0;
      totalScore += earnedScore;

      results.push({
        candidateId,
        regNo,
        questionId,
        subject,
        examYear,
        orderId,
        submittedAnswer,
        correctAnswer: question.answer,
        isCorrect,
        scoreAwarded: earnedScore,
      });
    }

    // 3. Save to database
    await Result.create({
      candidateId: firstSubmission.candidateId,
      examId: exam._id,
      regNo: firstSubmission.regNo,
      subject,
      examYear,
      totalQuestions: submissions.length,
      totalScore,
      results
    });

    // 4. Return the payload cleanly inside the try-scope
    return res.status(200).json({
      success: true,
      message: "Exam processed and submitted successfully",
      data: {
        candidateId: firstSubmission.candidateId,
        regNo: firstSubmission.regNo,
        subject,
        examYear,
        totalQuestions: submissions.length,
        totalScore,
        results,
      },
    });

  } catch (err) {
    console.error("submitExam runtime failure:", err);
    return res.status(500).json({
      success: false,
      error: err.message,
    });
  }
};
exports.adminHome = async (req, res) => {
  try {
    const tutorCount = await User.countDocuments({
      $or: [{ role: "Tutor" }, { userType: "Tutor" }],
    });

    const maleCount = await User.countDocuments({
      $or: [{ role: "Candidate" }, { userType: "Candidate" }],
      gender: { $regex: "^male$", $options: "i" },
    });

    const femaleCount = await User.countDocuments({
      $or: [{ role: "Candidate" }, { userType: "Candidate" }],
      gender: { $regex: "^female$", $options: "i" },
    });

    const totalCount = await User.countDocuments({
      $or: [{ role: "Candidate" }, { userType: "Candidate" }],
    });

    res.status(200).json({
      success: true,
      responseCode: null,
      code: 0,
      message: "Success",
      errors: null,
      data: {
        tutorCount,
        maleCount,
        femaleCount,
        totalCount,
        monthlyResult: [],
      },
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      responseCode: null,
      code: 1,
      message: "An error occurred",
      errors: [err.message],
      data: null,
    });
  }
};
exports.tutorHome = async (req, res) => {
  try {
    const maleCount = await User.countDocuments({
      $or: [{ role: "Candidate" }, { userType: "Candidate" }],
      gender: { $regex: "^male$", $options: "i" },
    });

    const femaleCount = await User.countDocuments({
      $or: [{ role: "Candidate" }, { userType: "Candidate" }],
      gender: { $regex: "^female$", $options: "i" },
    });

    const totalCount = await User.countDocuments({
      $or: [{ role: "Candidate" }, { userType: "Candidate" }],
    });

    res.status(200).json({
      success: true,
      responseCode: null,
      code: 0,
      message: "Success",
      errors: null,
      data: {
        maleCount,
        femaleCount,
        totalCount,
        monthlyResult: [],
      },
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      responseCode: null,
      code: 1,
      message: "An error occurred",
      errors: [err.message],
      data: null,
    });
  }
};
exports.candidateHome = async (req, res) => {
  try {
    res.status(200).json({
      success: true,
      responseCode: null,
      code: 0,
      message: "Success",
      errors: null,
      data: {
        monthlyResult: [],
      },
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      responseCode: null,
      code: 1,
      message: "An error occurred",
      errors: [err.message],
      data: null,
    });
  }
};

exports.getMyResults = async (req, res) => {
  try {
    let { PageNo, PageSize, CandidateId } = req.query;

    if (!CandidateId) {
      return res.status(400).json({
        success: false,
        message: "CandidateId is required"
      });
    }

    PageNo = parseInt(PageNo, 10) || 1;
    PageSize = parseInt(PageSize, 10) || 10;

    const filter = { candidateId: CandidateId };

    const totalRecords = await Result.countDocuments(filter);
    const results = await Result.find(filter)
      .sort({ createdAt: -1 })
      .skip((PageNo - 1) * PageSize)
      .limit(PageSize);

    return res.status(200).json({
      success: true,
      message: "Results fetched successfully",
      data: results,
      pagination: {
        pageNo: PageNo,
        pageSize: PageSize,
        totalRecords,
        totalPages: Math.ceil(totalRecords / PageSize),
      }
    });
  } catch (err) {
    console.error("getMyResults error:", err);
    return res.status(500).json({ success: false, error: err.message });
  }
};

exports.getAllResultsList = async (req, res) => {
  try {
    const userRole = req.user?.role;
    if (userRole !== "Admin" && userRole !== "Tutor") {
      return res.status(403).json({
        success: false,
        message: "Access denied. Admins or Tutors only"
      });
    }

    let { PageNo, PageSize } = req.query;
    PageNo = parseInt(PageNo, 10) || 1;
    PageSize = parseInt(PageSize, 10) || 10;

    const filter = {};

    if (userRole === "Tutor") {
      const tutor = await User.findById(req.user.id || req.user._id);
      if (tutor) {
        const assignedSubjectIds = Array.isArray(tutor.selectedSubjects)
          ? tutor.selectedSubjects.filter(Boolean)
          : [];
        
        if (assignedSubjectIds.length > 0) {
          const SubjectModel = require("../models/Subject");
          const assignedSubjects = await SubjectModel.find({
            _id: { $in: assignedSubjectIds },
          }).select("name");
          const allowedSubjectNames = assignedSubjects.map((s) => s.name);
          filter.subject = { $in: allowedSubjectNames };
        }
      }
    }

    const totalRecords = await Result.countDocuments(filter);
    const results = await Result.find(filter)
      .populate("candidateId", "firstname surname email regNo")
      .sort({ createdAt: -1 })
      .skip((PageNo - 1) * PageSize)
      .limit(PageSize);

    return res.status(200).json({
      success: true,
      message: "All results fetched successfully",
      data: results,
      pagination: {
        pageNo: PageNo,
        pageSize: PageSize,
        totalRecords,
        totalPages: Math.ceil(totalRecords / PageSize),
      }
    });
  } catch (err) {
    console.error("getAllResultsList error:", err);
    return res.status(500).json({ success: false, error: err.message });
  }
};

exports.viewExamReport = async (req, res) => {
  try {
    const { BatchID } = req.query;

    if (!BatchID) {
      return res.status(400).json({
        success: false,
        message: "BatchID is required"
      });
    }

    const candidateId = req.user?.id || req.user?._id;
    if (!candidateId) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized"
      });
    }

    // Find the result for this candidate and this exam batch
    const result = await Result.findOne({
      candidateId: candidateId,
      examId: BatchID
    })
    .populate("candidateId", "firstname surname email regNo")
    .populate("results.questionId");

    if (!result) {
      return res.status(404).json({
        success: false,
        message: "No exam report found for this candidate in the specified batch."
      });
    }

    // Format response to match frontend expectations (array of subjects with questions)
    const formattedResult = [{
      subject: result.subject,
      questions: result.results.map(r => ({
        question: r.questionId?.ask || "Question not found",
        option1: r.questionId?.option1 || "",
        option2: r.questionId?.option2 || "",
        option3: r.questionId?.option3 || "",
        option4: r.questionId?.option4 || "",
        correctAnswer: r.correctAnswer,
        submittedAnswer: r.submittedAnswer
      }))
    }];

    return res.status(200).json({
      success: true,
      message: "Exam report fetched successfully",
      data: formattedResult
    });
  } catch (err) {
    console.error("viewExamReport error:", err);
    return res.status(500).json({ success: false, error: err.message });
  }
};
