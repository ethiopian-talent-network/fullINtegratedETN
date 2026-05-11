const express = require("express");
const router = express.Router();
const { authenticate } = require("../middlewares/authMiddleWare");
const {
  getAllJobs,
  getJobById,
  getJobsByCategory,
  getRecentJobs,
  getSavedJobs,
  getAppliedJobs,
  saveJob,
  toggleSaveJob,
  checkJobSaved,
  talentMatchJobs,
  getPersonalizedJobs,
  createJob,
  getEmployerJobs,
  updateJob,
  deleteJob,
  getJobApplications,
  updateApplicationStatus,
  categories,
} = require("../controllers/jobController");

// Get all jobs with filtering and pagination
router.get("/", getAllJobs);

// Get recent jobs
router.get("/recent", getRecentJobs);

// Get jobs by category
router.get("/category/:categoryId", getJobsByCategory);

// Get all categories
router.get("/categories", categories);

// Get specific job by ID
router.get("/:id", getJobById);

// Get saved jobs for authenticated talent
router.get("/saved/my", authenticate, getSavedJobs);

// Get applied jobs for authenticated talent
router.get("/applied/my", authenticate, getAppliedJobs);

// Save a job (legacy endpoint)
router.post("/:jobId/save", authenticate, saveJob);

// Toggle save/unsave a job (recommended)
router.put("/:jobId/save", authenticate, toggleSaveJob);

// Check if job is saved
router.get("/:jobId/saved", authenticate, checkJobSaved);

// AI-based talent match jobs
router.get("/best-match", authenticate, talentMatchJobs);

// Personalized job recommendations (fallback without AI)
router.get("/personalized", authenticate, getPersonalizedJobs);

// Employer job management routes (require authentication)
router.post("/employer/jobs", authenticate, createJob);
router.get("/employer/jobs", authenticate, getEmployerJobs);
router.put("/employer/jobs/:id", authenticate, updateJob);
router.delete("/employer/jobs/:id", authenticate, deleteJob);
router.get(
  "/employer/jobs/:jobId/applications",
  authenticate,
  getJobApplications,
);
router.put(
  "/employer/applications/:applicationId/status",
  authenticate,
  updateApplicationStatus,
);

module.exports = router;
