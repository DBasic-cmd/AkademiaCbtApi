const express = require("express");
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');
const { adminOnly } = require('../middleware/adminOnly');
const tutorOnly  = require('../middleware/tutorOnly');
const {
  registerAdmin,
  login,
  logout,
  newAdmin,
  editAdminUser,
  changePassword,
  getAdminById,
  newTutor,
  editTutorUser,
  getTutorDetailsById,
  newCandidate,
  deleteUser,
  editCandidateUser,
  getCandidateDetailsById,
  addSubject,
  editSubject,
  getSubjectList,
  fetchSubjects,
  deleteSubject,
  createQuestion,
  updateQuestion,
} = require("../controllers/authController");

router.post("/register", registerAdmin);
router.post("/new-admin", newAdmin);
router.post("/login", login);
router.get("/logout", logout);
router.post("/edit-admin-user", authMiddleware, adminOnly, editAdminUser);
router.post("/change-password", authMiddleware, changePassword);
router.get("/get-admin-by-id", authMiddleware, adminOnly, getAdminById);
router.post("/new-tutor", authMiddleware, adminOnly, newTutor);
router.post("/edit-tutor-user", authMiddleware, adminOnly, editTutorUser);
router.get("/get-tutor-details-by-id", authMiddleware, adminOnly, getTutorDetailsById);
router.post("/new-candidate", authMiddleware, adminOnly, newCandidate);
router.post("/delete-user", authMiddleware, adminOnly, deleteUser);
router.post("/edit-candidate-user", authMiddleware, adminOnly, editCandidateUser);
router.post("/get-candidate-details-by-id", authMiddleware, adminOnly, getCandidateDetailsById);
router.post("/add-subject", authMiddleware, adminOnly, addSubject);
router.post("/edit-subject", authMiddleware, adminOnly, editSubject);
router.get("/get-subject-list", authMiddleware, adminOnly, getSubjectList);
router.get("/fetch-subjects", authMiddleware,fetchSubjects);
router.post("/delete-subject", authMiddleware, adminOnly, deleteSubject);
router.post("/create-question", authMiddleware, tutorOnly, createQuestion);
router.post("/update-question", authMiddleware, tutorOnly, updateQuestion);

module.exports = router;
