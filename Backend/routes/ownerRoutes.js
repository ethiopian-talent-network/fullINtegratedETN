const express = require("express");
const router = express.Router();
const db = require("../config/db");
const { authenticate } = require("../middlewares/authMiddleWare");
const { authorizeRole } = require("../middlewares/roleMiddleWare");
const {
  getDashboard,
  getAllPayments,
  getAllEscrow,
  getPaymentDetail,
  verifyPaymentWithChapa,
  approvePayment,
  releaseEscrow,
  getAllPayouts,
  processPayout,
  completePayout,
  failPayout,
} = require("../controllers/ownerControllers");

const owner = [authenticate, authorizeRole("owner")];

// Debug endpoint - NO AUTH for testing
router.get("/debug/check", async (req, res) => {
  try {
    const db = require("../config/db");
    
    const [[totalPayments]] = await db.query("SELECT COUNT(*) as count FROM payments");
    const [[totalEmployers]] = await db.query("SELECT COUNT(*) as count FROM employers");
    const [recentPayments] = await db.query("SELECT id, transaction_id, client_id, amount, status, create_at FROM payments ORDER BY create_at DESC LIMIT 3");
    
    // Check the JOIN
    const [paymentsWithJoin] = await db.query(`
      SELECT 
        p.id, p.transaction_id, p.client_id, p.amount, p.status,
        e.id as employer_id, e.company_name, e.user_id,
        u.name as employer_name, u.email as employer_email
      FROM payments p
      LEFT JOIN employers e ON p.client_id = e.id
      LEFT JOIN users u ON e.user_id = u.id
      ORDER BY p.create_at DESC LIMIT 3
    `);
    
    // Check employer with id 19
    const [employer19] = await db.query("SELECT * FROM employers WHERE id = 19");
    
    return res.json({
      status: "OK",
      total_payments: totalPayments.count,
      total_employers: totalEmployers.count,
      recent_payments: recentPayments,
      payments_with_join: paymentsWithJoin,
      employer_19: employer19,
      message: "If you see this, database connection works!"
    });
  } catch (error) {
    return res.status(500).json({ 
      status: "ERROR",
      error: error.message, 
      stack: error.stack 
    });
  }
});

// Debug endpoint - remove in production
router.get("/debug/payments", authenticate, async (req, res) => {
  try {
    const db = require("../config/db");
    
    const [[totalPayments]] = await db.query("SELECT COUNT(*) as count FROM payments");
    const [recentPayments] = await db.query("SELECT * FROM payments ORDER BY create_at DESC LIMIT 5");
    const [employers] = await db.query("SELECT id, user_id, company_name FROM employers LIMIT 5");
    const [paymentsWithJoin] = await db.query(`
      SELECT 
        p.id, p.transaction_id, p.client_id, p.amount, p.status,
        e.id as employer_id, e.company_name, u.name as employer_name
      FROM payments p
      LEFT JOIN employers e ON p.client_id = e.id
      LEFT JOIN users u ON e.user_id = u.id
      ORDER BY p.create_at DESC LIMIT 5
    `);
    
    return res.json({
      total_payments: totalPayments.count,
      recent_payments: recentPayments,
      employers: employers,
      payments_with_join: paymentsWithJoin
    });
  } catch (error) {
    return res.status(500).json({ error: error.message, stack: error.stack });
  }
});

router.get("/dashboard", ...owner, getDashboard);
router.get("/payments", ...owner, getAllPayments);
router.get("/payments/:id", ...owner, getPaymentDetail);
router.post("/payments/:id/verify", ...owner, verifyPaymentWithChapa);
router.post("/payments/:id/approve", ...owner, approvePayment);

router.get("/escrow", ...owner, getAllEscrow);
router.post("/escrow/:id/release", ...owner, releaseEscrow);

// Specific payout routes MUST come before parameterized routes
router.get("/payouts/talents", ...owner, getAllPayouts);
router.get("/payouts/summary", ...owner, async (req, res) => {
  try {
    const [[summary]] = await db.query(`
      SELECT 
        COUNT(*) as total_payouts,
        SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) as pending_count,
        SUM(CASE WHEN status = 'processing' THEN 1 ELSE 0 END) as processing_count,
        SUM(CASE WHEN status = 'paid' THEN 1 ELSE 0 END) as paid_count,
        SUM(CASE WHEN status = 'failed' THEN 1 ELSE 0 END) as failed_count,
        COALESCE(SUM(amount), 0) as total_amount
      FROM payouts
    `);
    return res.status(200).json({ summary });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
});

// Parameterized payout routes
router.get("/payouts", ...owner, getAllPayouts);
router.post("/payouts/:id/process", ...owner, processPayout);
router.post("/payouts/:id/complete", ...owner, completePayout);
router.post("/payouts/:id/fail", ...owner, failPayout);

module.exports = router;
