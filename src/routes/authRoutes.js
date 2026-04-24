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
  getAdminDetailsById,
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
  getCandidateList,
  getTutorList,
  bulkQuestion,
  getQuestionList,
  viewBulkQuestion,
  viewMyExamProfile,
  getExamQuestions,
  deleteQuestion,
  submitExam,
  adminHome,
  tutorHome,
  candidateHome

} = require("../controllers/authController");


router.post("/new-admin", newAdmin);
router.post("/login", login);
router.get("/logout", logout);
router.post("/edit-admin-user", authMiddleware, adminOnly, editAdminUser);
router.post("/change-password", authMiddleware, changePassword);
router.get("/get-admin-details-by-id", authMiddleware, adminOnly, getAdminDetailsById);
router.post("/new-tutor", authMiddleware, adminOnly, newTutor);
router.post("/edit-tutor-user", authMiddleware, adminOnly, editTutorUser);
router.get("/get-tutor-details-by-id", authMiddleware, adminOnly, getTutorDetailsById);
router.post("/new-candidate", authMiddleware, adminOnly, newCandidate);
router.delete("/delete-user", authMiddleware, adminOnly, deleteUser);
router.post("/edit-candidate-user", authMiddleware, adminOnly, editCandidateUser);
router.get("/candidate-details-by-id", authMiddleware, adminOnly, getCandidateDetailsById);
router.post("/add-subject", authMiddleware, adminOnly, addSubject);
router.post("/edit-subject", authMiddleware, adminOnly, editSubject);
router.get("/get-subject-list", authMiddleware, adminOnly, getSubjectList);
router.get("/fetch-subjects", authMiddleware,fetchSubjects);
router.delete("/delete-subject", authMiddleware, adminOnly, deleteSubject);
router.post("/create-question", authMiddleware, tutorOnly, createQuestion);
router.post("/update-question", authMiddleware, tutorOnly, updateQuestion);
router.get("/candidate-list", authMiddleware, adminOnly, getCandidateList);
router.get("/tutor-list", authMiddleware, adminOnly, getTutorList);
router.post("/bulk-question", authMiddleware, tutorOnly, bulkQuestion);
router.get("/question-list", authMiddleware, getQuestionList);
router.get("/view-bulk-question", viewBulkQuestion);
router.get("/view-my-exam-profile", viewMyExamProfile);
router.get("/exam-questions", getExamQuestions);
router.post("/submit-exam", submitExam);
router.delete("/delete-question", authMiddleware, tutorOnly, deleteQuestion);
router.get("/admin-home", authMiddleware, adminOnly, adminHome);
router.get("/tutor-home", authMiddleware, tutorOnly, tutorHome);
router.get("/candidate-home", authMiddleware, candidateHome);

module.exports = router;
