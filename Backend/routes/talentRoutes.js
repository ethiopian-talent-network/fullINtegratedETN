const express = require("express");
const router = express.Router();

const { authenticate } = require("../middlewares/authMiddleWare");
const { authorizeRole } = require("../middlewares/roleMiddleWare");
const {
  talentProfile,
  talentDashBoard,
  updateProfile,
  createPortifolio,
  getPortifolio,
  updatePortifolio,
  deletePortifolio,
  applyForJob,
  getMyTokens,
  addSkills,
  sendRequest,
  acceptRequest,
  getRequestedConnections,
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

router.get("/portifolio", authenticate, authorizeRole("talent"), getPortifolio);
router.post(
  "/portifolio",
  authenticate,
  authorizeRole("talent"),
  createPortifolio,
);
router.patch(
  "/updatePortifolio",
  authenticate,
  authorizeRole("talent"),
  updatePortifolio,
);
router.delete(
  "/deletePortifolio",
  authenticate,
  authorizeRole("talent"),
  deletePortifolio,
);

router.post("/applyForJob", authenticate, authorizeRole("talent"), applyForJob);
router.get("/tokeBalance", authenticate, authorizeRole("talent"), getMyTokens);
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

module.exports = router;
