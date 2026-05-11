const express = require("express");
const router = express.Router();

const multer = require("multer");
const upload = multer({ dest: "uploads/" });

const { authenticate } = require("../middlewares/authMiddleWare");
const { authorizeRole } = require("../middlewares/roleMiddleWare");
const { 
  rateLimiter, 
  sanitizeInput, 
  validateLicenseSubmission, 
  validateFileUpload 
} = require("../middlewares/securityMiddleware");
const {
  employerProfile,
  employerDashboard,
  updateEmployerProfile,
  uploadEmployerImage,
  categories,
  postJobs,
  getAppliedJobs,
  hireTalents,
  shorListTalents,
  getJobApplicantsForEmployer,
  getAllApplications,
  getAllProposalsAndApplications,
  getAllTalents,
  getTalentById,
  submitLicense,
  getLicenseStatus,
} = require("../controllers/employerControllers");

const employer = [authenticate, authorizeRole("employer"), sanitizeInput];
const licenseRateLimit = rateLimiter({ windowMs: 60 * 60 * 1000, max: 3 }); // 3 license submissions per hour

router.get("/employerProfile", ...employer, employerProfile);
router.patch("/employerProfile", ...employer, updateEmployerProfile);
router.post("/upload-profile", ...employer, upload.single("image"), uploadEmployerImage);
router.post("/employerDashboard", ...employer, employerDashboard);
router.get("/categories", categories);
router.post("/postJobs", ...employer, postJobs);
router.get("/appliedJobs", ...employer, getAppliedJobs);
router.post("/hireTalents", ...employer, hireTalents);
router.get("/shortlistedTalents", ...employer, shorListTalents);
router.get("/jobApplicants/:jobId", ...employer, getJobApplicantsForEmployer);
router.get("/applications", ...employer, getAllApplications);
router.get("/proposals-and-applications", ...employer, getAllProposalsAndApplications);
router.get("/talents", ...employer, getAllTalents);
router.get("/talents/:talentId", ...employer, getTalentById);
router.get("/license", ...employer, getLicenseStatus);
router.post("/license", licenseRateLimit, ...employer, upload.single("license_image"), validateFileUpload, validateLicenseSubmission, submitLicense);

// Debug endpoint to check applications without auth
router.get("/debug/applications", async (req, res) => {
  try {
    const db = require("../config/db").promise();
    const [applications] = await db.query(
      `
      SELECT
        a.id,
        a.cover_letter,
        a.status,
        a.applied_at,
        a.tokens_used,
        a.proposal,
        t.id as talent_id,
        u.name as talent_name,
        u.email as talent_email,
        j.title as job_title,
        j.id as job_id
      FROM applications a
      JOIN talents t ON a.talent_id = t.id
      JOIN users u ON t.user_id = u.id
      JOIN jobs j ON a.job_id = j.id
      ORDER BY a.applied_at DESC
      LIMIT 10
      `,
    );

    res.json({
      message: "Debug: Applications retrieved successfully",
      count: applications.length,
      applications,
    });
  } catch (error) {
    console.error("Debug error:", error);
    res.status(500).json({
      message: "Debug error",
      error: error.message,
    });
  }
});

module.exports = router;
