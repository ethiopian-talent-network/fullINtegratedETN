const express = require("express");
const router = express.Router();

const { authenticate } = require("../middlewares/authMiddleWare");
const { authorizeRole } = require("../middlewares/roleMiddleWare");

const {
  getBilling,
  submitBilling,
  deleteBilling,
  getTalentBillingStatus,
  getPendingBillingApprovals,
  getAllBilling,
  approveBilling,
  rejectBilling,
} = require("../controllers/billingController");

// Talent routes
router.get("/", authenticate, authorizeRole("talent"), getBilling);
router.post("/", authenticate, authorizeRole("talent"), submitBilling);
router.delete("/", authenticate, authorizeRole("talent"), deleteBilling);
router.get("/my-status", authenticate, authorizeRole("talent"), getTalentBillingStatus);

// Admin/Owner routes - verification and management
router.get("/pending", authenticate, authorizeRole("admin", "owner"), getPendingBillingApprovals);
router.get("/all", authenticate, authorizeRole("admin", "owner"), getAllBilling);
router.patch("/:billingId/approve", authenticate, authorizeRole("admin", "owner"), approveBilling);
router.patch("/:billingId/reject", authenticate, authorizeRole("admin", "owner"), rejectBilling);

module.exports = router;
