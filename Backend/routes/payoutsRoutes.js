const express = require("express");
const router = express.Router();
const payoutsController = require("../controllers/payoutsController");
const { authenticate } = require("../middlewares/authMiddleWare");

// Middleware to verify owner role
const verifyOwner = (req, res, next) => {
  if (req.user && req.user.role === 'owner') {
    next();
  } else {
    res.status(403).json({ message: "Owner access required" });
  }
};

// Owner routes - require authentication and owner verification
router.use(authenticate);

// Static routes MUST come before parameterized routes
// GET /api/owner/payouts/talents — get all talents for payouts
router.get("/talents", verifyOwner, payoutsController.getTalentsForPayouts);

// GET /api/owner/payouts/summary — get payout summary
router.get("/summary", verifyOwner, payoutsController.getPayoutSummary);

// GET /api/owner/payouts/talent/:talent_id/billing — get talent billing info
router.get("/talent/:talent_id/billing", verifyOwner, payoutsController.getTalentBillingInfo);

// GET /api/owner/payouts — get all payouts (must be last)
router.get("/", verifyOwner, payoutsController.getAllPayouts);

module.exports = router;
