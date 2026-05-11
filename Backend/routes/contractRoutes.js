const express = require("express");
const router = express.Router();
const { authenticate } = require("../middlewares/authMiddleWare");
const {
  createContract,
  getContracts,
  getContractById,
  sendContract,
  signContract,
  requestChanges,
  updateContract,
  activateContract,
  cancelContract,
} = require("../controllers/contractController");
const {
  getMilestones,
  addMilestone,
  updateMilestone,
  deleteMilestone,
  submitMilestone,
  approveMilestone,
  rejectMilestone,
} = require("../controllers/milestoneController");

// All routes require authentication
router.use(authenticate);

// Contract CRUD
router.post("/", createContract);
router.get("/", getContracts);
router.get("/:id", getContractById);
router.put("/:id", updateContract);

// Contract workflow
router.post("/:id/send", sendContract);
router.post("/:id/sign", signContract);
router.post("/:id/request-changes", requestChanges);
router.post("/:id/activate", activateContract);
router.post("/:id/cancel", cancelContract);

// Milestone management
router.get("/:contractId/milestones", getMilestones);
router.post("/:contractId/milestones", addMilestone);
router.put("/milestones/:id", updateMilestone);
router.delete("/milestones/:id", deleteMilestone);
router.post("/milestones/:id/submit", submitMilestone);
router.post("/milestones/:id/approve", approveMilestone);
router.post("/milestones/:id/reject", rejectMilestone);

module.exports = router;
