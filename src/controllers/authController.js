const User = require("../models/User");
const Subject = require("../models/Subject");
const Question = require("../models/Question");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");



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
    const user = await User.findById(req.params.id);
    if (!user || user.role !== 'Admin') return res.status(404).json({ succeeded: false, message: "Admin not found" });

    res.json({
      succeeded: true,
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
        image: user.image
      }
    });
  } catch (err) { res.status(500).json({ succeeded: false, error: err.message }); }
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
    const user = await User.findById(req.params.id);
    if (!user || user.role !== 'Tutor') return res.status(404).json({ succeeded: false, message: "Tutor not found" });

    res.json({
      succeeded: true,
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
        image: user.image,
        address: user.address,
        passport: user.passport,
        tutorSubjs: user.tutorSubjs
      }
    });
  } catch (err) { res.status(500).json({ succeeded: false, error: err.message }); }
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

    const systemIp =
      req.ip || req.headers["x-forwarded-for"] || req.socket.remoteAddress;

    // Restrict to Candidate creation only
    if (userType !== "Candidate") {
      return res.status(403).json({
        success: false,
        message: "This endpoint is restricted to Candidate creation only",
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
      passport,
      selectedSubjects,
      registrationIp: systemIp,
    });

    await candidate.save();

    res.status(201).json({
      success: true,
      message: "Candidate created successfully",
      userId: candidate._id,
    });
  } catch (err) {
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
    const user = await User.findById(req.params.id);
    if (!user || user.role !== 'Candidate') return res.status(404).json({ succeeded: false, message: "Candidate not found" });

    res.json({
      succeeded: true,
      responseCode: null,
      code: 0,
      message: "Success",
      errors: null,
      data: {
        id: user._id,
        regNo: user.regNo,
        surname: user.surname,
        firstName: user.firstname, // Note the capital N for Candidate
        otherName: user.otherName,
        physicalChallenge: user.physicalChallenge,
        gender: user.gender,
        phoneNo: user.phoneNo,
        email: user.email,
        passport: user.passport,
        dateOfBirth: user.dateOfBirth,
        tenant: user.tenant,
        image: user.image
      }
    });
  } catch (err) { res.status(500).json({ succeeded: false, error: err.message }); }
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
    let { PageNo, PageSize, Tenant, Name } = req.query;

    PageNo = parseInt(PageNo, 10) || 1;
    PageSize = parseInt(PageSize, 10) || 10;

    if (PageNo < 1 || PageSize < 1) {
      return res.status(400).json({
        success: false,
        message: "PageNo and PageSize must be greater than 0",
      });
    }

    const filter = {};

    if (Tenant) {
      filter.tenant = Tenant.trim();
    }

    if (Name) {
      filter.name = { $regex: Name.trim(), $options: "i" };
    }

    const totalRecords = await Subject.countDocuments(filter);

    const subjects = await Subject.find(filter)
      .sort({ createdAt: -1 })
      .skip((PageNo - 1) * PageSize)
      .limit(PageSize);

    res.status(200).json({
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
    res.status(500).json({
      success: false,
      error: err.message,
    });
  }
};
exports.fetchSubjects = async (req, res) => {
  try {
    const subjects = await Subject.find()
      .select("_id name shortCode tenant")
      .sort({ name: 1 });

    res.status(200).json({
      success: true,
      message: "Subjects fetched successfully",
      data: subjects,
    });
  } catch (err) {
    res.status(500).json({
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
exports.createQuestion = async (req, res) => {
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
