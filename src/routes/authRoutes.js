const express = require("express");
const router = express.Router();
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
} = require("../controllers/authController");

router.post("/register", registerAdmin);
router.post("/new-admin", newAdmin);
router.post("/login", login);
router.get("/logout", logout);
router.post("/edit-admin-user", editAdminUser);
router.post("/change-password", changePassword);
router.get("/get-admin-by-id", getAdminById);
router.post("/new-tutor", newTutor);
router.post("/edit-tutor-user", editTutorUser);
router.get("/get-tutor-details-by-id", getTutorDetailsById);
router.post("/new-candidate", newCandidate);
router.post("/delete-user", deleteUser);
router.post("/edit-candidate-user", editCandidateUser);
router.post("/get-candidate-details-by-id", getCandidateDetailsById);

module.exports = router;
