const express = require("express");
const router = express.Router();

const { authenticate } = require("../middlewares/authMiddleWare");
const { authorizeRole } = require("../middlewares/roleMiddleWare");

const {
  createPayment,
  verfiyTransaction,
  getEscrowStatus,
  getPaymentReceipt,
  getOwnerPayments,
  getOwnerPaymentsByTalent,
  ownerReleaseEscrow,
  releasePayment,
  submitPaymentForVerification,
} = require("../controllers/paymentControllers");

router.post(
  "/initialize",
  authenticate,
  authorizeRole("employer"),
  createPayment,
);
router.post("/verify", verfiyTransaction);
router.get("/verify", verfiyTransaction);
router.post(
  "/submit-for-verification",
  authenticate,
  authorizeRole("employer"),
  submitPaymentForVerification,
);
router.get(
  "/escrow/:job_id",
  authenticate,
  authorizeRole("employer"),
  getEscrowStatus,
);
router.post(
  "/release/:job_id",
  authenticate,
  authorizeRole("employer"),
  releasePayment,
);
router.get(
  "/receipt/:tx_ref",
  authenticate,
  authorizeRole("employer"),
  getPaymentReceipt,
);
router.get(
  "/owner/payments",
  authenticate,
  authorizeRole("owner"),
  getOwnerPayments,
);
router.get(
  "/owner/payments/:talentId",
  authenticate,
  authorizeRole("owner"),
  getOwnerPaymentsByTalent,
);
router.post(
  "/owner/release/:escrowId",
  authenticate,
  authorizeRole("owner"),
  ownerReleaseEscrow,
);

module.exports = router;
