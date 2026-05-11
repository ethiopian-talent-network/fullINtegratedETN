const express = require("express");
const router = express.Router();
const { authenticate } = require("../middlewares/authMiddleWare");
const { authorizeRole } = require("../middlewares/roleMiddleWare");
const { sanitizeInput } = require("../middlewares/securityMiddleware");
const {
  createAgreement,
  getAgreements,
  getAgreementDetails,
  acceptAgreement,
  completeAgreement,
  confirmCompletion,
} = require("../controllers/agreementController");
const {
  getPendingPayouts,
  getPayoutDetails,
  approvePayout,
  releasePayout,
  getTalentPayoutHistory,
  getEmployerPayoutHistory,
} = require("../controllers/payoutController");

const auth = [authenticate, sanitizeInput];
const adminAuth = [authenticate, authorizeRole("admin", "owner"), sanitizeInput];

// Agreement routes
router.post("/agreements", ...auth, createAgreement);
router.get("/agreements", ...auth, getAgreements);
router.get("/agreements/:id", ...auth, getAgreementDetails);
router.patch("/agreements/:id/accept", ...auth, acceptAgreement);
router.patch("/agreements/:id/complete", ...auth, completeAgreement);
router.patch("/agreements/:id/confirm-completion", ...auth, confirmCompletion);

// Payout routes (admin/owner only)
router.get("/payouts/pending", ...adminAuth, getPendingPayouts);
router.get("/payouts/:id", ...adminAuth, getPayoutDetails);
router.patch("/payouts/:id/approve", ...adminAuth, approvePayout);
router.patch("/payouts/:id/release", ...adminAuth, releasePayout);

// Payout history routes
router.get("/payouts/history/talent/:talent_id", ...auth, getTalentPayoutHistory);
router.get("/payouts/history/employer/:employer_id", ...auth, getEmployerPayoutHistory);

module.exports = router;
