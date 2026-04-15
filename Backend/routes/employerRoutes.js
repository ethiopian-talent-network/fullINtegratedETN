const express = require("express");
const router = express.Router();

const { authenticate } = require("../middlewares/authMiddleWare");
const { authorizeRole } = require("../middlewares/roleMiddleWare");
const {
  employerProfile,
  employerDashboard,
  categories,
  postJobs,
  getAppliedJobs,
  hireTalents,
  shorListTalents,
  getJobApplicantsForEmployer,
} = require("../controllers/employerControllers");

router.get(
  "/employerProfile",
  authenticate,
  authorizeRole("employer"),
  employerProfile,
);
router.post(
  "/employerDashboard",
  authenticate,
  authorizeRole("employer"),
  employerDashboard,
);
router.get("/categories", categories);
router.post("/postJobs", authenticate, authorizeRole("employer"), postJobs);
router.get(
  "/appliedJobs",
  authenticate,
  authorizeRole("employer"),
  getAppliedJobs,
);

router.post(
  "/hireTalents",
  authenticate,
  authorizeRole("employer"),
  hireTalents,
);
router.get(
  "/shortlistedTalents",
  authenticate,
  authorizeRole("employer"),
  shorListTalents,
);
router.get(
  "/jobApplicants/:jobId",
  authenticate,
  authorizeRole("employer"),
  getJobApplicantsForEmployer,
);

module.exports = router;
