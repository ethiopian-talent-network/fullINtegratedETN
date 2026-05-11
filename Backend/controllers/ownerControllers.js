const db = require("../config/db");
const { verifyPayment } = require("../services/chapaServices");

// GET /api/owner/dashboard — overall platform stats
exports.getDashboard = async (req, res) => {
  try {
    const [[totalPayments]] = await db.query(
      "SELECT COUNT(*) AS total, COALESCE(SUM(amount), 0) AS volume FROM payments WHERE status = 'success'"
    );
    const [[fundedEscrow]] = await db.query(
      "SELECT COUNT(*) AS total, COALESCE(SUM(amount), 0) AS volume FROM escrow WHERE status = 'funded'"
    );
    const [[releasedEscrow]] = await db.query(
      "SELECT COUNT(*) AS total, COALESCE(SUM(amount), 0) AS volume FROM escrow WHERE status = 'releassed'"
    );
    const [[pendingEscrow]] = await db.query(
      "SELECT COUNT(*) AS total, COALESCE(SUM(amount), 0) AS volume FROM escrow WHERE status = 'pending'"
    );
    const [[failedPayments]] = await db.query(
      "SELECT COUNT(*) AS total FROM payments WHERE status = 'failed'"
    );
    const [[totalEmployers]] = await db.query(
      "SELECT COUNT(*) AS total FROM employers"
    );
    const [[totalTalents]] = await db.query(
      "SELECT COUNT(*) AS total FROM talents"
    );
    const [[pendingPayouts]] = await db.query(
      "SELECT COUNT(*) AS total, COALESCE(SUM(amount), 0) AS volume FROM payouts WHERE status = 'pending'"
    );
    const [[processingPayouts]] = await db.query(
      "SELECT COUNT(*) AS total, COALESCE(SUM(amount), 0) AS volume FROM payouts WHERE status = 'processing'"
    );
    const [[paidPayouts]] = await db.query(
      "SELECT COUNT(*) AS total, COALESCE(SUM(amount), 0) AS volume FROM payouts WHERE status = 'paid'"
    );

    return res.status(200).json({
      stats: {
        total_payments: totalPayments.total,
        total_volume: totalPayments.volume,
        pending_escrow_count: pendingEscrow.total,
        pending_escrow_volume: pendingEscrow.volume,
        funded_escrow_count: fundedEscrow.total,
        funded_escrow_volume: fundedEscrow.volume,
        released_escrow_count: releasedEscrow.total,
        released_escrow_volume: releasedEscrow.volume,
        failed_payments: failedPayments.total,
        total_employers: totalEmployers.total,
        total_talents: totalTalents.total,
        pending_payouts_count: pendingPayouts.total,
        pending_payouts_volume: pendingPayouts.volume,
        processing_payouts_count: processingPayouts.total,
        processing_payouts_volume: processingPayouts.volume,
        paid_payouts_count: paidPayouts.total,
        paid_payouts_volume: paidPayouts.volume,
      },
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

// GET /api/owner/payments — all payments with full details
exports.getAllPayments = async (req, res) => {
  const { page = 1, limit = 20, status, search } = req.query;
  const offset = (page - 1) * limit;

  let where = "WHERE 1=1";
  const params = [];

  if (status && status !== "all") {
    where += " AND p.status = ?";
    params.push(status);
  }
  if (search) {
    where += " AND (u.name LIKE ? OR u.email LIKE ? OR p.transaction_id LIKE ?)";
    const like = `%${search}%`;
    params.push(like, like, like);
  }

  try {
    const [payments] = await db.query(
      `SELECT
         p.id, p.transaction_id, p.amount, p.currency, p.method,
         p.status, p.create_at,
         p.job_id,
         j.title AS job_title,
         u.name AS employer_name, u.email AS employer_email,
         e.company_name,
         es.status AS escrow_status, es.id AS escrow_id
       FROM payments p
       LEFT JOIN employers e ON p.client_id = e.id
       LEFT JOIN users u ON e.user_id = u.id
       LEFT JOIN jobs j ON p.job_id = j.id
       LEFT JOIN escrow es ON p.transaction_id = es.treansaction_ref
       ${where}
       ORDER BY p.create_at DESC
       LIMIT ? OFFSET ?`,
      [...params, parseInt(limit), offset]
    );

    const [[{ total }]] = await db.query(
      `SELECT COUNT(*) AS total FROM payments p
       LEFT JOIN employers e ON p.client_id = e.id
       LEFT JOIN users u ON e.user_id = u.id
       ${where}`,
      params
    );

    return res.status(200).json({
      payments,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

// GET /api/owner/escrow — all escrow records
exports.getAllEscrow = async (req, res) => {
  const { page = 1, limit = 20, status, search } = req.query;
  const offset = (page - 1) * limit;

  let where = "WHERE 1=1";
  const params = [];

  if (status && status !== "all") {
    where += " AND es.status = ?";
    params.push(status);
  }
  if (search) {
    where += " AND (ue.name LIKE ? OR ut.name LIKE ? OR j.title LIKE ?)";
    const like = `%${search}%`;
    params.push(like, like, like);
  }

  try {
    const [escrows] = await db.query(
      `SELECT
         es.id, es.amount, es.currency, es.status,
         es.treansaction_ref, es.job_id,
         es.funded_at, es.released_at, es.created_at,
         j.title AS job_title,
         ue.name AS employer_name, ue.email AS employer_email,
         emp.company_name,
         ut.name AS talent_name, ut.email AS talent_email,
         p.create_at AS payment_date, p.method AS payment_method
       FROM escrow es
       LEFT JOIN employers emp ON es.employer_id = emp.id
       LEFT JOIN users ue ON emp.user_id = ue.id
       LEFT JOIN talents t ON es.talent_id = t.id
       LEFT JOIN users ut ON t.user_id = ut.id
       LEFT JOIN jobs j ON es.job_id = j.id
       LEFT JOIN payments p ON es.treansaction_ref = p.transaction_id
       ${where}
       ORDER BY es.created_at DESC
       LIMIT ? OFFSET ?`,
      [...params, parseInt(limit), offset]
    );

    const [[{ total }]] = await db.query(
      `SELECT COUNT(*) AS total FROM escrow es
       ${where}`,
      params
    );

    return res.status(200).json({
      escrows,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

// GET /api/owner/payments/:id — single payment detail
exports.getPaymentDetail = async (req, res) => {
  const { id } = req.params;
  try {
    const [rows] = await db.query(
      `SELECT
         p.id, p.transaction_id, p.amount, p.currency, p.method,
         p.status, p.create_at,
         j.title AS job_title, j.id AS job_id,
         u.name AS employer_name, u.email AS employer_email,
         e.company_name,
         es.status AS escrow_status, es.amount AS escrow_amount,
         es.talent_id, ut.name AS talent_name, ut.email AS talent_email
       FROM payments p
       LEFT JOIN employers e ON p.client_id = e.id
       LEFT JOIN users u ON e.user_id = u.id
       LEFT JOIN jobs j ON p.job_id = j.id
       LEFT JOIN escrow es ON p.transaction_id = es.treansaction_ref
       LEFT JOIN talents t ON es.talent_id = t.id
       LEFT JOIN users ut ON t.user_id = ut.id
       WHERE p.id = ?`,
      [id]
    );
    if (rows.length === 0) return res.status(404).json({ message: "Payment not found" });
    return res.status(200).json({ payment: rows[0] });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

// POST /api/owner/payments/:id/verify — verify payment with Chapa API only
exports.verifyPaymentWithChapa = async (req, res) => {
  const { id } = req.params;
  try {
    const [rows] = await db.query(
      "SELECT * FROM payments WHERE id = ?",
      [id]
    );
    if (rows.length === 0) {
      return res.status(404).json({ message: "Payment not found" });
    }

    const payment = rows[0];

    if (payment.status === "success") {
      return res.status(400).json({ message: "Payment already approved" });
    }

    // Verify payment with Chapa API
    try {
      const chapaResponse = await verifyPayment(payment.transaction_id);
      
      // Check if Chapa verification was successful
      if (chapaResponse.status !== "success" || chapaResponse.data?.status !== "success") {
        return res.status(400).json({ 
          message: "Chapa verification failed. Payment is not successful on Chapa.",
          chapa_status: chapaResponse.data?.status || "unknown",
          verified: false
        });
      }

      // Verify amount matches
      if (chapaResponse.data?.amount && parseFloat(chapaResponse.data.amount) !== parseFloat(payment.amount)) {
        return res.status(400).json({ 
          message: "Amount mismatch between payment record and Chapa verification",
          expected: payment.amount,
          received: chapaResponse.data.amount,
          verified: false
        });
      }

      // Verification successful - return Chapa data
      return res.status(200).json({ 
        message: "Payment verified successfully with Chapa",
        verified: true,
        chapa_data: {
          status: chapaResponse.data?.status,
          amount: chapaResponse.data?.amount,
          currency: chapaResponse.data?.currency,
          reference: chapaResponse.data?.reference || payment.transaction_id,
          created_at: chapaResponse.data?.created_at,
        }
      });

    } catch (chapaError) {
      return res.status(400).json({ 
        message: "Failed to verify payment with Chapa",
        error: chapaError.message,
        verified: false
      });
    }
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

// POST /api/owner/payments/:id/approve — approve verified payment & fund escrow
exports.approvePayment = async (req, res) => {
  const { id } = req.params;
  const connection = await db.getConnection();
  try {
    await connection.beginTransaction();

    const [rows] = await connection.query(
      "SELECT * FROM payments WHERE id = ? FOR UPDATE",
      [id]
    );
    if (rows.length === 0) {
      await connection.rollback();
      return res.status(404).json({ message: "Payment not found" });
    }
    if (rows[0].status === "success") {
      await connection.rollback();
      return res.status(400).json({ message: "Payment already approved" });
    }

    const payment = rows[0];

    // Update payment status to success
    await connection.query(
      "UPDATE payments SET status = 'success' WHERE id = ?",
      [id]
    );
    
    // Fund the escrow
    await connection.query(
      "UPDATE escrow SET status = 'funded', funded_at = NOW() WHERE treansaction_ref = ?",
      [payment.transaction_id]
    );

    await connection.commit();
    return res.status(200).json({ message: "Payment approved and escrow funded successfully" });
  } catch (error) {
    await connection.rollback();
    return res.status(500).json({ message: error.message });
  } finally {
    connection.release();
  }
};

// POST /api/owner/escrow/:id/release — release escrow and create payout
exports.releaseEscrow = async (req, res) => {
  const { id } = req.params;
  const connection = await db.getConnection();
  try {
    await connection.beginTransaction();

    // Get escrow details
    const [escrows] = await connection.query(
      "SELECT * FROM escrow WHERE id = ? FOR UPDATE",
      [id]
    );
    if (escrows.length === 0) {
      await connection.rollback();
      return res.status(404).json({ message: "Escrow not found" });
    }

    const escrow = escrows[0];

    if (escrow.status !== "funded") {
      await connection.rollback();
      return res.status(400).json({ message: `Cannot release escrow with status: ${escrow.status}. Only funded escrow can be released.` });
    }

    // Generate payout reference
    const payoutRef = `PAYOUT-${Date.now()}-${escrow.talent_id}`;

    // Create payout record
    await connection.query(
      "INSERT INTO payouts (escrow_id, talent_id, amount, status, payout_ref, created_at) VALUES (?, ?, ?, 'pending', ?, NOW())",
      [escrow.id, escrow.talent_id, escrow.amount, payoutRef]
    );

    // Update escrow status to released
    await connection.query(
      "UPDATE escrow SET status = 'releassed', released_at = NOW() WHERE id = ?",
      [id]
    );

    await connection.commit();
    return res.status(200).json({ 
      message: "Escrow released and payout created successfully",
      payout_ref: payoutRef
    });
  } catch (error) {
    await connection.rollback();
    return res.status(500).json({ message: error.message });
  } finally {
    connection.release();
  }
};

// GET /api/owner/payouts — all payouts with details
exports.getAllPayouts = async (req, res) => {
  const { page = 1, limit = 20, status, search } = req.query;
  const offset = (page - 1) * limit;

  let where = "WHERE 1=1";
  const params = [];

  if (status && status !== "all") {
    where += " AND po.status = ?";
    params.push(status);
  }
  if (search) {
    where += " AND (ut.name LIKE ? OR ut.email LIKE ? OR po.payout_ref LIKE ?)";
    const like = `%${search}%`;
    params.push(like, like, like);
  }

  try {
    const [payouts] = await db.query(
      `SELECT
         po.id, po.escrow_id, po.talent_id, po.amount, po.status,
         po.payout_ref, po.created_at,
         ut.name AS talent_name, ut.email AS talent_email,
         es.job_id, es.currency, es.treansaction_ref,
         j.title AS job_title,
         ue.name AS employer_name
       FROM payouts po
       LEFT JOIN talents t ON po.talent_id = t.id
       LEFT JOIN users ut ON t.user_id = ut.id
       LEFT JOIN escrow es ON po.escrow_id = es.id
       LEFT JOIN jobs j ON es.job_id = j.id
       LEFT JOIN users ue ON es.employer_id = ue.id
       ${where}
       ORDER BY po.created_at DESC
       LIMIT ? OFFSET ?`,
      [...params, parseInt(limit), offset]
    );

    const [[{ total }]] = await db.query(
      `SELECT COUNT(*) AS total FROM payouts po ${where}`,
      params
    );

    return res.status(200).json({
      payouts,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

// POST /api/owner/payouts/:id/process — mark payout as processing
exports.processPayout = async (req, res) => {
  const { id } = req.params;
  try {
    const [rows] = await db.query(
      "SELECT * FROM payouts WHERE id = ?",
      [id]
    );
    if (rows.length === 0) {
      return res.status(404).json({ message: "Payout not found" });
    }
    if (rows[0].status !== "pending") {
      return res.status(400).json({ message: `Cannot process payout with status: ${rows[0].status}` });
    }

    await db.query(
      "UPDATE payouts SET status = 'processing' WHERE id = ?",
      [id]
    );

    return res.status(200).json({ message: "Payout marked as processing" });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

// POST /api/owner/payouts/:id/complete — mark payout as paid
exports.completePayout = async (req, res) => {
  const { id } = req.params;
  try {
    const [rows] = await db.query(
      "SELECT * FROM payouts WHERE id = ?",
      [id]
    );
    if (rows.length === 0) {
      return res.status(404).json({ message: "Payout not found" });
    }
    if (rows[0].status === "paid") {
      return res.status(400).json({ message: "Payout already completed" });
    }

    await db.query(
      "UPDATE payouts SET status = 'paid' WHERE id = ?",
      [id]
    );

    return res.status(200).json({ message: "Payout completed successfully" });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

// POST /api/owner/payouts/:id/fail — mark payout as failed
exports.failPayout = async (req, res) => {
  const { id } = req.params;
  const connection = await db.getConnection();
  try {
    await connection.beginTransaction();

    const [rows] = await connection.query(
      "SELECT * FROM payouts WHERE id = ? FOR UPDATE",
      [id]
    );
    if (rows.length === 0) {
      await connection.rollback();
      return res.status(404).json({ message: "Payout not found" });
    }
    if (rows[0].status === "paid") {
      await connection.rollback();
      return res.status(400).json({ message: "Cannot fail a completed payout" });
    }

    // Mark payout as failed
    await connection.query(
      "UPDATE payouts SET status = 'failed' WHERE id = ?",
      [id]
    );

    // Revert escrow back to funded status
    await connection.query(
      "UPDATE escrow SET status = 'funded', released_at = NULL WHERE id = ?",
      [rows[0].escrow_id]
    );

    await connection.commit();
    return res.status(200).json({ message: "Payout marked as failed and escrow reverted to funded" });
  } catch (error) {
    await connection.rollback();
    return res.status(500).json({ message: error.message });
  } finally {
    connection.release();
  }
};
