const paymentServices = require("../services/paymentervice");
const db = require("../config/db");

exports.createPayment = async (req, res) => {
  try {
    const { currency, amount, job_id, method } = req.body;
    const user = req.user;

    if (method !== "chapa") {
      return res.status(501).json({
        message: "Payment method not implemented yet. Please use Chapa.",
      });
    }

    const [rows] = await db.query("SELECT * FROM jobs WHERE id = ?", [job_id]);
    if (rows.length === 0) {
      return res.status(400).json({ message: "job is not found" });
    }

    const result = await paymentServices.createPayment(
      user,
      currency,
      amount,
      job_id,
      method,
    );

    res.status(200).json(result);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.verfiyTransaction = async (req, res) => {
  try {
    const { tx_ref } = req.body;
    const { trx_ref, status } = req.query;

    // Handle both POST body and GET query parameters
    const transactionRef = tx_ref || trx_ref;

    if (!transactionRef) {
      return res.status(400).json({ message: "tx_ref/trx_ref is required" });
    }

    const payment =
      await paymentServices.verfiyAndUpdateTransaction(transactionRef);

    // Get job_id from payment record for redirect
    const job_id = payment.job_id;

    // Support JSONP callback for jQuery requests
    const callback = req.query.callback;
    if (callback) {
      res.type("text/javascript");
      const frontendUrl = process.env.FRONTEND_URL || "http://localhost:5173";
      const redirectUrl = `${frontendUrl}/employer/payment-pending/${job_id}?tx_ref=${transactionRef}`;
      return res.send(
        `${callback}(${JSON.stringify({ message: "your payment is successful", status: status || "success", redirect_url: redirectUrl })}); window.location.href = "${redirectUrl}";`,
      );
    }

    // Redirect to frontend payment pending page
    const frontendUrl = process.env.FRONTEND_URL || "http://localhost:5173";
    return res.redirect(
      `${frontendUrl}/employer/payment-pending/${job_id}?tx_ref=${transactionRef}`,
    );
  } catch (error) {
    const callback = req.query.callback;
    if (callback) {
      res.type("text/javascript");
      return res.send(
        `${callback}(${JSON.stringify({ message: error.message, status: "error" })})`,
      );
    }
    return res.status(500).json({ message: error.message });
  }
};

// GET /api/payment/escrow/:job_id — get escrow status for a job
exports.getEscrowStatus = async (req, res) => {
  const { job_id } = req.params;
  const user_id = req.user.id;
  try {
    // Get employer_id from user_id
    const [employerRows] = await db.query(
      "SELECT id FROM employers WHERE user_id = ?",
      [user_id],
    );

    if (employerRows.length === 0) {
      return res.status(404).json({ message: "Employer profile not found" });
    }

    const employer_id = employerRows[0].id;

    const [rows] = await db.query(
      `SELECT e.*, u.name AS talent_name, u.email AS talent_email
       FROM escrow e
       JOIN talents t ON e.talent_id = t.id
       JOIN users u ON t.user_id = u.id
       WHERE e.job_id = ? AND e.employer_id = ?
       ORDER BY e.id DESC LIMIT 1`,
      [job_id, employer_id],
    );
    if (rows.length === 0) {
      return res.status(404).json({ message: "No escrow found for this job" });
    }
    return res.status(200).json({ escrow: rows[0] });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

// GET /api/payment/receipt/:tx_ref — get payment receipt
exports.getPaymentReceipt = async (req, res) => {
  const { tx_ref } = req.params;
  const user_id = req.user.id;
  try {
    // Get employer_id from user_id
    const [employerRows] = await db.query(
      "SELECT id, company_name FROM employers WHERE user_id = ?",
      [user_id],
    );

    if (employerRows.length === 0) {
      return res.status(404).json({ message: "Employer profile not found" });
    }

    const employer_id = employerRows[0].id;
    const company_name = employerRows[0].company_name;

    const [rows] = await db.query(
      `SELECT
        p.id,
        p.transaction_id,
        p.amount,
        p.currency,
        p.method,
        p.status,
        p.created_at,
        j.title as job_title,
        e.talent_id,
        u.name as talent_name,
        u.email as talent_email
       FROM payments p
       JOIN jobs j ON p.job_id = j.id
       LEFT JOIN escrow e ON e.treansaction_ref = p.transaction_id
       LEFT JOIN talents t ON e.talent_id = t.id
       LEFT JOIN users u ON t.user_id = u.id
       WHERE p.transaction_id = ? AND p.client_id = ?
       LIMIT 1`,
      [tx_ref, employer_id],
    );

    if (rows.length === 0) {
      return res.status(404).json({ message: "Payment receipt not found" });
    }

    const receipt = {
      ...rows[0],
      company_name,
      receipt_number: `RCP-${rows[0].id.toString().padStart(6, "0")}`,
      payment_date: rows[0].created_at,
    };

    return res.status(200).json({ receipt });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

// GET /api/payment/owner/payments — get all payments for owner dashboard
exports.getOwnerPayments = async (req, res) => {
  try {
    const [payments] = await db.query(
      `SELECT
        op.id,
        op.talent_id,
        op.user_id,
        op.job_id,
        op.amount,
        op.currency,
        op.transaction_id,
        op.status,
        op.created_at,
        u.name as talent_name,
        u.email as talent_email,
        j.title as job_title,
        b.phone,
        b.payout_method,
        b.account_number,
        b.bank_name,
        b.is_verified
       FROM owner_payments op
       JOIN users u ON op.user_id = u.id
       JOIN jobs j ON op.job_id = j.id
       LEFT JOIN billing b ON op.user_id = b.user_id
       ORDER BY op.created_at DESC`,
    );

    return res.status(200).json({ payments });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

// GET /api/payment/owner/payments/:talentId — get payments for specific talent
exports.getOwnerPaymentsByTalent = async (req, res) => {
  const { talentId } = req.params;
  try {
    const [payments] = await db.query(
      `SELECT
        op.id,
        op.talent_id,
        op.user_id,
        op.job_id,
        op.amount,
        op.currency,
        op.transaction_id,
        op.status,
        op.created_at,
        u.name as talent_name,
        u.email as talent_email,
        j.title as job_title,
        b.phone,
        b.payout_method,
        b.account_number,
        b.bank_name,
        b.is_verified
       FROM owner_payments op
       JOIN users u ON op.user_id = u.id
       JOIN jobs j ON op.job_id = j.id
       LEFT JOIN billing b ON op.user_id = b.user_id
       WHERE op.talent_id = ?
       ORDER BY op.created_at DESC`,
      [talentId],
    );

    return res.status(200).json({ payments });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

// POST /api/payment/submit-for-verification — employer submits payment for verification
exports.submitPaymentForVerification = async (req, res) => {
  const {
    job_id,
    talent_id,
    application_id,
    amount,
    currency = "ETB",
    payment_method = "chapa",
    transaction_id,
  } = req.body;
  const user_id = req.user.id;
  const connection = await db.getConnection();

  try {
    if (!job_id || !talent_id || !amount) {
      return res
        .status(400)
        .json({ message: "job_id, talent_id, and amount are required" });
    }

    await connection.beginTransaction();

    // Get employer_id from user_id
    const [employerRows] = await connection.query(
      "SELECT id FROM employers WHERE user_id = ?",
      [user_id],
    );

    if (employerRows.length === 0) {
      await connection.rollback();
      return res.status(404).json({ message: "Employer profile not found" });
    }

    const employer_id = employerRows[0].id;

    // Verify job exists and belongs to employer
    const [jobRows] = await connection.query(
      "SELECT id FROM jobs WHERE id = ? AND employer_id = ?",
      [job_id, employer_id],
    );

    if (jobRows.length === 0) {
      await connection.rollback();
      return res
        .status(404)
        .json({ message: "Job not found or does not belong to you" });
    }

    // Verify talent exists
    const [talentRows] = await connection.query(
      "SELECT id FROM talents WHERE id = ?",
      [talent_id],
    );

    if (talentRows.length === 0) {
      await connection.rollback();
      return res.status(404).json({ message: "Talent not found" });
    }

    // Get or create payment record
    let paymentId;
    const [existingPayment] = await connection.query(
      "SELECT id FROM payments WHERE job_id = ? AND client_id = ? AND status = 'pending'",
      [job_id, employer_id],
    );

    if (existingPayment.length > 0) {
      paymentId = existingPayment[0].id;
    } else {
      const [paymentResult] = await connection.query(
        `INSERT INTO payments (job_id, client_id, amount, currency, method, status, transaction_id, created_at)
         VALUES (?, ?, ?, ?, ?, 'pending', ?, NOW())`,
        [
          job_id,
          employer_id,
          amount,
          currency,
          payment_method,
          transaction_id || null,
        ],
      );
      paymentId = paymentResult.insertId;
    }

    // Create payment verification record
    const [verificationResult] = await connection.query(
      `INSERT INTO payment_verifications (payment_id, job_id, employer_id, talent_id, amount, currency, transaction_id, payment_method, payment_date, verification_status)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW(), 'pending')`,
      [
        paymentId,
        job_id,
        employer_id,
        talent_id,
        amount,
        currency,
        transaction_id || null,
        payment_method,
      ],
    );

    // Update application status to payment_pending if exists
    if (application_id) {
      await connection.query(
        "UPDATE applications SET status = 'payment_pending' WHERE id = ? AND talent_id = ? AND job_id = ?",
        [application_id, talent_id, job_id],
      );
    }

    // Notify owner/admin about pending payment verification
    const [admins] = await connection.query(
      "SELECT id FROM users WHERE role IN ('owner', 'admin')",
    );

    const [jobInfo] = await connection.query(
      "SELECT title FROM jobs WHERE id = ?",
      [job_id],
    );

    const [talentInfo] = await connection.query(
      "SELECT u.name FROM talents t JOIN users u ON t.user_id = u.id WHERE t.id = ?",
      [talent_id],
    );

    for (const admin of admins) {
      await connection.query(
        `INSERT INTO notifications (user_id, type, title, message, sender_user_id, created_at)
         VALUES (?, 'payment_pending_verification', ?, ?, ?, NOW())`,
        [
          admin.id,
          "Payment Pending Verification",
          `Payment of ${amount} ${currency} for "${jobInfo[0]?.title}" from ${talentInfo[0]?.name} is pending your verification.`,
          user_id,
        ],
      );
    }

    await connection.commit();

    return res.status(201).json({
      message: "Payment submitted for verification successfully",
      verification_id: verificationResult.insertId,
      payment_id: paymentId,
      status: "payment_pending",
    });
  } catch (error) {
    await connection.rollback();
    console.error("Error submitting payment for verification:", error);
    return res.status(500).json({ message: error.message });
  } finally {
    connection.release();
  }
};

// POST /api/payment/release/:job_id — employer releases escrow payment to talent
exports.releasePayment = async (req, res) => {
  const { job_id } = req.params;
  const user_id = req.user.id;
  const connection = await db.getConnection();
  try {
    await connection.beginTransaction();

    // Get employer_id from user_id
    const [employerRows] = await connection.query(
      "SELECT id FROM employers WHERE user_id = ?",
      [user_id],
    );

    if (employerRows.length === 0) {
      await connection.rollback();
      return res.status(404).json({ message: "Employer profile not found" });
    }

    const employer_id = employerRows[0].id;

    // Verify job exists and belongs to employer
    const [jobRows] = await connection.query(
      "SELECT id FROM jobs WHERE id = ? AND employer_id = ?",
      [job_id, employer_id],
    );

    if (jobRows.length === 0) {
      await connection.rollback();
      return res
        .status(404)
        .json({ message: "Job not found or does not belong to you" });
    }

    // Get escrow for this job
    const [escrowRows] = await connection.query(
      "SELECT * FROM escrow WHERE job_id = ? FOR UPDATE",
      [job_id],
    );

    if (escrowRows.length === 0) {
      await connection.rollback();
      return res
        .status(404)
        .json({ message: "Escrow record not found for this job" });
    }

    const escrow = escrowRows[0];

    if (escrow.status !== "funded" && escrow.status !== "releassed") {
      await connection.rollback();
      return res
        .status(400)
        .json({ message: "Escrow must be funded to release payment" });
    }

    // Get talent user info
    const [talentUser] = await connection.query(
      "SELECT user_id FROM talents WHERE id = ?",
      [escrow.talent_id],
    );

    if (talentUser.length === 0) {
      await connection.rollback();
      return res.status(404).json({ message: "Talent not found" });
    }

    // Check if talent's billing is approved
    const [billings] = await connection.query(
      "SELECT * FROM billing WHERE user_id = ? AND approval_status = 'approved'",
      [talentUser[0].user_id],
    );

    if (billings.length === 0) {
      await connection.rollback();
      return res
        .status(400)
        .json({ message: "Talent's billing information is not approved yet" });
    }

    const billing = billings[0];

    // Mark escrow as released
    await connection.query(
      "UPDATE escrow SET status = 'released', released_at = NOW() WHERE id = ?",
      [escrow.id],
    );

    // Create payout record with billing info
    await connection.query(
      `INSERT INTO payouts (talent_id, escrow_id, amount, currency, payout_method, account_info, status, created_at)
       VALUES (?, ?, ?, ?, ?, ?, 'completed', NOW())`,
      [
        escrow.talent_id,
        escrow.id,
        escrow.amount,
        escrow.currency,
        billing.payout_method,
        JSON.stringify({
          phone: billing.phone,
          account_number: billing.account_number,
          bank_name: billing.bank_name,
        }),
      ],
    );

    const [job] = await connection.query(
      "SELECT title FROM jobs WHERE id = ?",
      [escrow.job_id],
    );

    // Notify talent
    await connection.query(
      `INSERT INTO notifications (user_id, type, title, message)
       VALUES (?, 'payment_released', ?, ?)`,
      [
        talentUser[0].user_id,
        "Payment Released!",
        `Payment of ${escrow.amount} ${escrow.currency} for "${job[0]?.title}" has been released to your ${billing.payout_method} account.`,
      ],
    );

    await connection.commit();
    return res
      .status(200)
      .json({ message: "Payment released to talent successfully" });
  } catch (error) {
    await connection.rollback();
    return res.status(500).json({ message: error.message });
  } finally {
    connection.release();
  }
};

// POST /api/payment/owner/release/:escrowId — owner releases escrow payment to talent
exports.ownerReleaseEscrow = async (req, res) => {
  const { escrowId } = req.params;
  const connection = await db.getConnection();
  try {
    await connection.beginTransaction();

    const [escrowRows] = await connection.query(
      "SELECT * FROM escrow WHERE id = ? FOR UPDATE",
      [escrowId],
    );

    if (escrowRows.length === 0) {
      await connection.rollback();
      return res.status(404).json({ message: "Escrow record not found" });
    }

    const escrow = escrowRows[0];

    if (escrow.status !== "funded" && escrow.status !== "releassed") {
      await connection.rollback();
      return res
        .status(400)
        .json({ message: "Escrow must be funded to release payment" });
    }

    // Get talent user info
    const [talentUser] = await connection.query(
      "SELECT user_id FROM talents WHERE id = ?",
      [escrow.talent_id],
    );

    if (talentUser.length === 0) {
      await connection.rollback();
      return res.status(404).json({ message: "Talent not found" });
    }

    // Check if talent's billing is approved
    const [billings] = await connection.query(
      "SELECT * FROM billing WHERE user_id = ? AND approval_status = 'approved'",
      [talentUser[0].user_id],
    );

    if (billings.length === 0) {
      await connection.rollback();
      return res
        .status(400)
        .json({ message: "Talent's billing information is not approved yet" });
    }

    const billing = billings[0];

    // Mark escrow as released
    await connection.query(
      "UPDATE escrow SET status = 'released', released_at = NOW() WHERE id = ?",
      [escrow.id],
    );

    // Create payout record with billing info
    await connection.query(
      `INSERT INTO payouts (talent_id, escrow_id, amount, currency, payout_method, account_info, status, created_at)
       VALUES (?, ?, ?, ?, ?, ?, 'completed', NOW())`,
      [
        escrow.talent_id,
        escrow.id,
        escrow.amount,
        escrow.currency,
        billing.payout_method,
        JSON.stringify({
          phone: billing.phone,
          account_number: billing.account_number,
          bank_name: billing.bank_name,
        }),
      ],
    );

    const [job] = await connection.query(
      "SELECT title FROM jobs WHERE id = ?",
      [escrow.job_id],
    );

    // Notify talent
    await connection.query(
      `INSERT INTO notifications (user_id, type, title, message)
       VALUES (?, 'payment_released', ?, ?)`,
      [
        talentUser[0].user_id,
        "Payment Released!",
        `Payment of ${escrow.amount} ${escrow.currency} for "${job[0]?.title}" has been released to your ${billing.payout_method} account.`,
      ],
    );

    await connection.commit();
    return res
      .status(200)
      .json({ message: "Payment released to talent successfully" });
  } catch (error) {
    await connection.rollback();
    return res.status(500).json({ message: error.message });
  } finally {
    connection.release();
  }
};
