const express = require("express");
const router = express.Router();
const multer = require("multer");
const upload = multer({ dest: "uploads/" });

const { authenticate } = require("../middlewares/authMiddleWare");
const { authorizeRole } = require("../middlewares/roleMiddleWare");
const { rateLimiter, sanitizeInput } = require("../middlewares/securityMiddleware");

const {
  getAllPayments,
  getPaymentDetails,
  verifyPayment,
  rejectPayment,
  uploadReceipt,
  getPaymentSummary,
  getJobPayments,
  getTalentPayments,
} = require("../controllers/paymentVerificationController");

const owner = [authenticate, authorizeRole("owner"), sanitizeInput];
const ownerRateLimit = rateLimiter({ windowMs: 5 * 60 * 1000, max: 50 });

// Get all payments for verification
router.get("/", ownerRateLimit, ...owner, getAllPayments);

// Get payment summary
router.get("/summary", ...owner, getPaymentSummary);

// Get specific payment details
router.get("/:id", ...owner, getPaymentDetails);

// Verify payment
router.post("/:id/verify", ownerRateLimit, ...owner, verifyPayment);

// Reject payment
router.post("/:id/reject", ownerRateLimit, ...owner, rejectPayment);

// Upload receipt for payment
router.post("/:id/upload-receipt", ownerRateLimit, ...owner, upload.single("receipt"), uploadReceipt);

// Get all payments for a specific job
router.get("/job/:job_id", ...owner, getJobPayments);

// Get all payments for a specific talent
router.get("/talent/:talent_id", ...owner, getTalentPayments);

module.exports = router;
