const express = require("express");
const router = express.Router();
const multer = require("multer");

const upload = multer({ dest: "uploads/" });

const { authenticate } = require("../middlewares/authMiddleWare");
const { authorizeRole } = require("../middlewares/roleMiddleWare");
const {
  talentProfile,
  talentDashBoard,
  updateProfile,
  createPortfolio,
  getPortfolio,
  updatePortfolio,
  deletePortfolio,
  applyForJob,
  getMyTokens,
  addSkills,
  getAllSkills,
  getMySkills,
  sendRequest,
  acceptRequest,
  getRequestedConnections,
  getMyConnections,
  talentMatchJobs,
  uploadProfileImage,
  getCertificates,
  addCertificate,
  updateCertificate,
  deleteCertificate,
  endorseSkill,
  getSkillEndorsements,
  getTalentNetwork,
  getAllTalents,
  requestVerification,
  getVerificationStatus,
  getConnectionStatuses,
} = require("../controllers/talentController");

const { getRecommendedJobs } = require("../utils/recommendationServices");

router.get(
  "/talentProfile",
  authenticate,
  authorizeRole("talent"),
  talentProfile,
);

router.post(
  "/talentDashboard",
  authenticate,
  authorizeRole("talent"),
  talentDashBoard,
);

router.patch(
  "/talentProfile",
  authenticate,
  authorizeRole("talent"),
  updateProfile,
);

router.get("/portfolio", authenticate, authorizeRole("talent"), getPortfolio);
router.post(
  "/portfolio",
  authenticate,
  authorizeRole("talent"),
  upload.single("image"),
  createPortfolio,
);
router.patch(
  "/portfolio/:id",
  authenticate,
  authorizeRole("talent"),
  upload.single("image"),
  updatePortfolio,
);
router.delete(
  "/portfolio/:id",
  authenticate,
  authorizeRole("talent"),
  deletePortfolio,
);

router.post("/applyForJob", authenticate, authorizeRole("talent"), applyForJob);
router.get("/tokenBalance", authenticate, authorizeRole("talent"), getMyTokens);
router.get("/skills", authenticate, getAllSkills);
router.get("/my-skills", authenticate, authorizeRole("talent"), getMySkills);
router.post("/addSkills", authenticate, authorizeRole("talent"), addSkills);
router.get(
  "/recommendedJobs",
  authenticate,
  authorizeRole("talent"),
  getRecommendedJobs,
);
router.post("/sendRequest", authenticate, authorizeRole("talent"), sendRequest);
router.post(
  "/acceptRequest",
  authenticate,
  authorizeRole("talent"),
  acceptRequest,
);
router.get(
  "/requestedConnections",
  authenticate,
  authorizeRole("talent"),
  getRequestedConnections,
);
router.get(
  "/myConnections",
  authenticate,
  authorizeRole("talent"),
  getMyConnections,
);

router.get(
  "/matchJobs",
  authenticate,
  authorizeRole("talent"),
  talentMatchJobs,
);

router.post(
  "/upload-profile",
  authenticate,
  authorizeRole("talent"),
  upload.single("image"),
  uploadProfileImage,
);

// Certificate routes
router.get("/certificates", authenticate, authorizeRole("talent"), getCertificates);
router.post("/certificates", authenticate, authorizeRole("talent"), addCertificate);
router.patch("/certificates/:id", authenticate, authorizeRole("talent"), updateCertificate);
router.delete("/certificates/:id", authenticate, authorizeRole("talent"), deleteCertificate);

// Skill endorsement routes
router.post("/endorseSkill", authenticate, authorizeRole("talent"), endorseSkill);
router.get("/skillEndorsements", authenticate, authorizeRole("talent"), getSkillEndorsements);

// Network routes
router.get("/network", authenticate, authorizeRole("talent"), getTalentNetwork);

// Discover all talents (for networking)
router.get("/all-talents", authenticate, authorizeRole("talent"), getAllTalents);

// Verification
router.get("/verification-status", authenticate, authorizeRole("talent"), getVerificationStatus);
router.post("/request-verification", authenticate, authorizeRole("talent"), upload.single("national_id"), requestVerification);

// Connection statuses (replaces localStorage-based pending tracking)
router.get("/connection-statuses", authenticate, authorizeRole("talent"), getConnectionStatuses);

module.exports = router;
