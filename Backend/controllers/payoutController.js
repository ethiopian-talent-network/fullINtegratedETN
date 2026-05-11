const db = require("../config/db");

// GET /api/payouts — get all pending payouts (admin/owner only)
exports.getPendingPayouts = async (req, res) => {
  const { status = "pending", page = 1, limit = 20 } = req.query;
  const offset = (page - 1) * limit;

  try {
    const [payouts] = await db.query(
      `SELECT 
        ph.id, ph.agreement_id, ph.escrow_id, ph.amount, ph.currency,
        ph.payout_type, ph.status, ph.created_at, ph.approved_at,
        a.title as agreement_title, a.job_id,
        j.title as job_title,
        emp.company_name, u_emp.name as employer_name, u_emp.email as employer_email,
        u_tal.name as talent_name, u_tal.email as talent_email,
        u_admin.name as approved_by_name
       FROM payout_history ph
       LEFT JOIN agreements a ON ph.agreement_id = a.id
       LEFT JOIN jobs j ON a.job_id = j.id
       LEFT JOIN employers emp ON ph.employer_id = emp.id
       LEFT JOIN users u_emp ON emp.user_id = u_emp.id
       LEFT JOIN talents t ON ph.talent_id = t.id
       LEFT JOIN users u_tal ON t.user_id = u_tal.id
       LEFT JOIN users u_admin ON ph.approved_by = u_admin.id
       WHERE ph.status = ?
       ORDER BY ph.created_at ASC
       LIMIT ? OFFSET ?`,
      [status, parseInt(limit), offset]
    );

    const [[{ total }]] = await db.query(
      "SELECT COUNT(*) AS total FROM payout_history WHERE status = ?",
      [status]
    );

    return res.status(200).json({
      payouts,
      pagination: { total, page: parseInt(page), limit: parseInt(limit), pages: Math.ceil(total / limit) },
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

// GET /api/payouts/:id — get payout details
exports.getPayoutDetails = async (req, res) => {
  const { id } = req.params;

  try {
    const [payouts] = await db.query(
      `SELECT 
        ph.*, 
        a.title as agreement_title, a.budget, a.start_date, a.end_date,
        j.title as job_title, j.description as job_description,
        emp.company_name, u_emp.name as employer_name, u_emp.email as employer_email,
        u_tal.name as talent_name, u_tal.email as talent_email,
        e.status as escrow_status, e.funded_at,
        u_admin.name as approved_by_name
       FROM payout_history ph
       LEFT JOIN agreements a ON ph.agreement_id = a.id
       LEFT JOIN jobs j ON a.job_id = j.id
       LEFT JOIN employers emp ON ph.employer_id = emp.id
       LEFT JOIN users u_emp ON emp.user_id = u_emp.id
       LEFT JOIN talents t ON ph.talent_id = t.id
       LEFT JOIN users u_tal ON t.user_id = u_tal.id
       LEFT JOIN escrow_accounts e ON ph.escrow_id = e.id
       LEFT JOIN users u_admin ON ph.approved_by = u_admin.id
       WHERE ph.id = ?`,
      [id]
    );

    if (payouts.length === 0) {
      return res.status(404).json({ message: "Payout not found" });
    }

    return res.status(200).json({ payout: payouts[0] });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

// PATCH /api/payouts/:id/approve — approve payout for release
exports.approvePayout = async (req, res) => {
  const { id } = req.params;
  const { notes } = req.body;
  const user_id = req.user.id;

  const connection = await db.getConnection();
  try {
    await connection.beginTransaction();

    const [payouts] = await connection.query(
      "SELECT * FROM payout_history WHERE id = ?",
      [id]
    );

    if (payouts.length === 0) {
      await connection.rollback();
      return res.status(404).json({ message: "Payout not found" });
    }

    const payout = payouts[0];

    if (payout.status !== "pending") {
      await connection.rollback();
      return res.status(400).json({ message: "Only pending payouts can be approved" });
    }

    // Update payout status
    await connection.query(
      "UPDATE payout_history SET status = 'approved', approved_by = ?, approved_at = NOW(), notes = ? WHERE id = ?",
      [user_id, notes || null, id]
    );

    // Notify talent
    const [talentUser] = await connection.query(
      "SELECT user_id FROM talents WHERE id = ?",
      [payout.talent_id]
    );

    if (talentUser.length > 0) {
      await connection.query(
        `INSERT INTO notifications (user_id, type, title, message, is_read, created_at)
         VALUES (?, 'payout_approved', 'Payout Approved', 'Your payout has been approved and is being processed.', false, NOW())`,
        [talentUser[0].user_id]
      );
    }

    await connection.commit();
    return res.status(200).json({ message: "Payout approved successfully" });
  } catch (error) {
    await connection.rollback();
    return res.status(500).json({ message: error.message });
  } finally {
    connection.release();
  }
};

// PATCH /api/payouts/:id/release — release payout from escrow to talent
exports.releasePayout = async (req, res) => {
  const { id } = req.params;
  const { transaction_id, payment_method } = req.body;
  const user_id = req.user.id;

  const connection = await db.getConnection();
  try {
    await connection.beginTransaction();

    const [payouts] = await connection.query(
      "SELECT * FROM payout_history WHERE id = ?",
      [id]
    );

    if (payouts.length === 0) {
      await connection.rollback();
      return res.status(404).json({ message: "Payout not found" });
    }

    const payout = payouts[0];

    if (payout.status !== "approved") {
      await connection.rollback();
      return res.status(400).json({ message: "Payout must be approved before release" });
    }

    // Update payout status
    await connection.query(
      "UPDATE payout_history SET status = 'processing', transaction_id = ?, payment_method = ? WHERE id = ?",
      [transaction_id || null, payment_method || null, id]
    );

    // Update escrow status
    await connection.query(
      "UPDATE escrow_accounts SET status = 'released', released_at = NOW() WHERE id = ?",
      [payout.escrow_id]
    );

    // Update agreement status to paid
    await connection.query(
      "UPDATE agreements SET status = 'paid', updated_at = NOW() WHERE id = ?",
      [payout.agreement_id]
    );

    // Simulate payment processing (in real scenario, integrate with payment gateway)
    await connection.query(
      "UPDATE payout_history SET status = 'completed', processed_at = NOW() WHERE id = ?",
      [id]
    );

    // Notify talent
    const [talentUser] = await connection.query(
      "SELECT user_id FROM talents WHERE id = ?",
      [payout.talent_id]
    );

    if (talentUser.length > 0) {
      await connection.query(
        `INSERT INTO notifications (user_id, type, title, message, is_read, created_at)
         VALUES (?, 'payout_completed', 'Payment Received', ?, false, NOW())`,
        [talentUser[0].user_id, `Your payout of ${payout.amount} ${payout.currency} has been released to your account.`]
      );
    }

    // Notify employer
    const [employerUser] = await connection.query(
      "SELECT user_id FROM employers WHERE id = ?",
      [payout.employer_id]
    );

    if (employerUser.length > 0) {
      await connection.query(
        `INSERT INTO notifications (user_id, type, title, message, is_read, created_at)
         VALUES (?, 'payout_released', 'Payment Released', 'The payout for the completed work has been released to the talent.', false, NOW())`,
        [employerUser[0].user_id]
      );
    }

    await connection.commit();
    return res.status(200).json({ message: "Payout released successfully" });
  } catch (error) {
    await connection.rollback();
    return res.status(500).json({ message: error.message });
  } finally {
    connection.release();
  }
};

// GET /api/payouts/history/:talent_id — get payout history for talent
exports.getTalentPayoutHistory = async (req, res) => {
  const { talent_id } = req.params;
  const { page = 1, limit = 20 } = req.query;
  const offset = (page - 1) * limit;

  try {
    const [payouts] = await db.query(
      `SELECT 
        ph.id, ph.agreement_id, ph.amount, ph.currency, ph.payout_type,
        ph.status, ph.created_at, ph.processed_at,
        a.title as agreement_title, j.title as job_title,
        emp.company_name, u_emp.name as employer_name
       FROM payout_history ph
       LEFT JOIN agreements a ON ph.agreement_id = a.id
       LEFT JOIN jobs j ON a.job_id = j.id
       LEFT JOIN employers emp ON ph.employer_id = emp.id
       LEFT JOIN users u_emp ON emp.user_id = u_emp.id
       WHERE ph.talent_id = ?
       ORDER BY ph.created_at DESC
       LIMIT ? OFFSET ?`,
      [talent_id, parseInt(limit), offset]
    );

    const [[{ total }]] = await db.query(
      "SELECT COUNT(*) AS total FROM payout_history WHERE talent_id = ?",
      [talent_id]
    );

    const [[{ total_earned }]] = await db.query(
      "SELECT COALESCE(SUM(amount), 0) AS total_earned FROM payout_history WHERE talent_id = ? AND status = 'completed'",
      [talent_id]
    );

    return res.status(200).json({
      payouts,
      total_earned,
      pagination: { total, page: parseInt(page), limit: parseInt(limit), pages: Math.ceil(total / limit) },
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

// GET /api/payouts/employer/:employer_id — get payout history for employer
exports.getEmployerPayoutHistory = async (req, res) => {
  const { employer_id } = req.params;
  const { page = 1, limit = 20 } = req.query;
  const offset = (page - 1) * limit;

  try {
    const [payouts] = await db.query(
      `SELECT 
        ph.id, ph.agreement_id, ph.amount, ph.currency, ph.payout_type,
        ph.status, ph.created_at, ph.processed_at,
        a.title as agreement_title, j.title as job_title,
        u_tal.name as talent_name, u_tal.email as talent_email
       FROM payout_history ph
       LEFT JOIN agreements a ON ph.agreement_id = a.id
       LEFT JOIN jobs j ON a.job_id = j.id
       LEFT JOIN talents t ON ph.talent_id = t.id
       LEFT JOIN users u_tal ON t.user_id = u_tal.id
       WHERE ph.employer_id = ?
       ORDER BY ph.created_at DESC
       LIMIT ? OFFSET ?`,
      [employer_id, parseInt(limit), offset]
    );

    const [[{ total }]] = await db.query(
      "SELECT COUNT(*) AS total FROM payout_history WHERE employer_id = ?",
      [employer_id]
    );

    const [[{ total_paid }]] = await db.query(
      "SELECT COALESCE(SUM(amount), 0) AS total_paid FROM payout_history WHERE employer_id = ? AND status = 'completed'",
      [employer_id]
    );

    return res.status(200).json({
      payouts,
      total_paid,
      pagination: { total, page: parseInt(page), limit: parseInt(limit), pages: Math.ceil(total / limit) },
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};
