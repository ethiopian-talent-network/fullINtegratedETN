const db = require("../config/db");
const cloudinary = require("../config/cloudImage");
const fs = require("fs");

// GET /api/owner/payments — get all payments for verification
exports.getAllPayments = async (req, res) => {
  const { status = "pending", page = 1, limit = 20, search } = req.query;
  const owner_id = req.user.id;
  const offset = (page - 1) * limit;

  try {
    // Validate status
    if (!["pending", "verified", "rejected", "all"].includes(status)) {
      return res.status(400).json({ message: "Invalid status filter" });
    }

    let whereClause = "WHERE 1=1";
    const params = [];

    if (status !== "all") {
      whereClause += " AND pv.verification_status = ?";
      params.push(status);
    }

    if (search) {
      whereClause += " AND (j.title LIKE ? OR tu.name LIKE ? OR tu.email LIKE ?)";
      const searchTerm = `%${search}%`;
      params.push(searchTerm, searchTerm, searchTerm);
    }

    // Get total count
    const [countResult] = await db.query(
      `SELECT COUNT(*) as total FROM payment_verifications pv
       JOIN jobs j ON pv.job_id = j.id
       JOIN talents t ON pv.talent_id = t.id
       JOIN users tu ON t.user_id = tu.id
       ${whereClause}`,
      params
    );

    const total = countResult[0].total;

    // Get paginated payments
    const [payments] = await db.query(
      `SELECT 
        pv.id,
        pv.payment_id,
        pv.job_id,
        pv.talent_id,
        pv.amount,
        pv.currency,
        pv.receipt_number,
        pv.transaction_id,
        pv.payment_method,
        pv.payment_date,
        pv.verification_status,
        pv.verified_at,
        pv.verification_notes,
        j.title as job_title,
        j.salary as job_salary,
        eu.name as employer_name,
        tu.name as talent_name,
        tu.email as talent_email,
        tu.profile_image as talent_image,
        vu.name as verified_by_name
       FROM payment_verifications pv
       JOIN jobs j ON pv.job_id = j.id
       JOIN employers e ON pv.employer_id = e.id
       JOIN users eu ON e.user_id = eu.id
       JOIN talents t ON pv.talent_id = t.id
       JOIN users tu ON t.user_id = tu.id
       LEFT JOIN users vu ON pv.verified_by = vu.id
       ${whereClause}
       ORDER BY pv.created_at DESC
       LIMIT ? OFFSET ?`,
      [...params, parseInt(limit), offset]
    );

    return res.status(200).json({
      message: "Payments retrieved successfully",
      payments,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Error fetching payments:", error);
    return res.status(500).json({ message: error.message });
  }
};

// GET /api/owner/payments/:id — get payment details with receipt
exports.getPaymentDetails = async (req, res) => {
  const { id } = req.params;
  const owner_id = req.user.id;

  try {
    const [payment] = await db.query(
      `SELECT 
        pv.id,
        pv.payment_id,
        pv.job_id,
        pv.talent_id,
        pv.amount,
        pv.currency,
        pv.receipt_url,
        pv.receipt_number,
        pv.transaction_id,
        pv.payment_method,
        pv.payment_date,
        pv.verification_status,
        pv.verified_at,
        pv.verification_notes,
        pv.rejection_reason,
        j.id as job_id_check,
        j.title as job_title,
        j.discription as job_description,
        j.salary as job_salary,
        j.budget_type,
        j.experience_level,
        j.created_at as job_created_at,
        e.company_name as employer_company,
        e.location as employer_location,
        eu.name as employer_name,
        eu.email as employer_email,
        eu.profile_image as employer_image,
        t.id as talent_id_check,
        tu.name as talent_name,
        tu.email as talent_email,
        tu.profile_image as talent_image,
        vu.name as verified_by_name,
        vu.email as verified_by_email
       FROM payment_verifications pv
       JOIN jobs j ON pv.job_id = j.id
       JOIN employers e ON pv.employer_id = e.id
       JOIN users eu ON e.user_id = eu.id
       JOIN talents t ON pv.talent_id = t.id
       JOIN users tu ON t.user_id = tu.id
       LEFT JOIN users vu ON pv.verified_by = vu.id
       WHERE pv.id = ?`,
      [id]
    );

    if (payment.length === 0) {
      return res.status(404).json({ message: "Payment not found" });
    }

    return res.status(200).json({
      message: "Payment details retrieved successfully",
      payment: payment[0],
    });
  } catch (error) {
    console.error("Error fetching payment details:", error);
    return res.status(500).json({ message: error.message });
  }
};

// POST /api/owner/payments/:id/verify — verify payment with receipt
exports.verifyPayment = async (req, res) => {
  const { id } = req.params;
  const { verification_notes } = req.body;
  const owner_id = req.user.id;
  const connection = await db.getConnection();

  try {
    await connection.beginTransaction();

    // Get payment verification record
    const [payment] = await connection.query(
      "SELECT * FROM payment_verifications WHERE id = ? AND verification_status = 'pending'",
      [id]
    );

    if (payment.length === 0) {
      await connection.rollback();
      return res.status(404).json({ message: "Payment not found or already processed" });
    }

    const paymentRecord = payment[0];

    // Verify payment
    await connection.query(
      `UPDATE payment_verifications 
       SET verification_status = 'verified', 
           verified_by = ?, 
           verified_at = NOW(),
           verification_notes = ?
       WHERE id = ?`,
      [owner_id, verification_notes || null, id]
    );

    // Update payments table
    await connection.query(
      `UPDATE payments 
       SET verification_status = 'verified',
           verified_by = ?,
           verified_at = NOW()
       WHERE id = ?`,
      [owner_id, paymentRecord.payment_id]
    );

    // Log audit
    await connection.query(
      `INSERT INTO payment_verification_audit (verification_id, owner_id, action, old_status, new_status, notes, ip_address)
       VALUES (?, ?, 'VERIFIED', 'pending', 'verified', ?, ?)`,
      [id, owner_id, verification_notes || null, req.ip]
    );

    // Notify employer
    const [employer] = await connection.query(
      "SELECT user_id FROM employers WHERE id = ?",
      [paymentRecord.employer_id]
    );

    if (employer.length > 0) {
      await connection.query(
        `INSERT INTO notifications (user_id, type, title, message, created_at)
         VALUES (?, 'payment_verified', 'Payment Verified', ?, NOW())`,
        [
          employer[0].user_id,
          `Your payment of ${paymentRecord.amount} ${paymentRecord.currency} for job has been verified by the owner.`,
        ]
      );
    }

    // Notify talent
    const [talent] = await connection.query(
      "SELECT user_id FROM talents WHERE id = ?",
      [paymentRecord.talent_id]
    );

    if (talent.length > 0) {
      await connection.query(
        `INSERT INTO notifications (user_id, type, title, message, created_at)
         VALUES (?, 'payment_verified', 'Payment Verified', ?, NOW())`,
        [
          talent[0].user_id,
          `Payment of ${paymentRecord.amount} ${paymentRecord.currency} has been verified and will be processed.`,
        ]
      );
    }

    await connection.commit();

    return res.status(200).json({
      message: "Payment verified successfully",
      verification_id: id,
    });
  } catch (error) {
    await connection.rollback();
    console.error("Error verifying payment:", error);
    return res.status(500).json({ message: error.message });
  } finally {
    connection.release();
  }
};

// POST /api/owner/payments/:id/reject — reject payment with reason
exports.rejectPayment = async (req, res) => {
  const { id } = req.params;
  const { rejection_reason, verification_notes } = req.body;
  const owner_id = req.user.id;
  const connection = await db.getConnection();

  try {
    if (!rejection_reason || rejection_reason.trim().length < 10) {
      return res.status(400).json({ message: "Rejection reason must be at least 10 characters" });
    }

    await connection.beginTransaction();

    // Get payment verification record
    const [payment] = await connection.query(
      "SELECT * FROM payment_verifications WHERE id = ? AND verification_status = 'pending'",
      [id]
    );

    if (payment.length === 0) {
      await connection.rollback();
      return res.status(404).json({ message: "Payment not found or already processed" });
    }

    const paymentRecord = payment[0];

    // Reject payment
    await connection.query(
      `UPDATE payment_verifications 
       SET verification_status = 'rejected', 
           verified_by = ?, 
           verified_at = NOW(),
           rejection_reason = ?,
           verification_notes = ?
       WHERE id = ?`,
      [owner_id, rejection_reason, verification_notes || null, id]
    );

    // Update payments table
    await connection.query(
      `UPDATE payments 
       SET verification_status = 'rejected',
           verified_by = ?,
           verified_at = NOW()
       WHERE id = ?`,
      [owner_id, paymentRecord.payment_id]
    );

    // Log audit
    await connection.query(
      `INSERT INTO payment_verification_audit (verification_id, owner_id, action, old_status, new_status, notes, ip_address)
       VALUES (?, ?, 'REJECTED', 'pending', 'rejected', ?, ?)`,
      [id, owner_id, rejection_reason, req.ip]
    );

    // Notify employer
    const [employer] = await connection.query(
      "SELECT user_id FROM employers WHERE id = ?",
      [paymentRecord.employer_id]
    );

    if (employer.length > 0) {
      await connection.query(
        `INSERT INTO notifications (user_id, type, title, message, created_at)
         VALUES (?, 'payment_rejected', 'Payment Rejected', ?, NOW())`,
        [
          employer[0].user_id,
          `Your payment of ${paymentRecord.amount} ${paymentRecord.currency} has been rejected. Reason: ${rejection_reason}`,
        ]
      );
    }

    await connection.commit();

    return res.status(200).json({
      message: "Payment rejected successfully",
      verification_id: id,
    });
  } catch (error) {
    await connection.rollback();
    console.error("Error rejecting payment:", error);
    return res.status(500).json({ message: error.message });
  } finally {
    connection.release();
  }
};

// POST /api/owner/payments/:id/upload-receipt — upload payment receipt
exports.uploadReceipt = async (req, res) => {
  const { id } = req.params;
  const owner_id = req.user.id;

  try {
    if (!req.file) {
      return res.status(400).json({ message: "Receipt file is required" });
    }

    // Validate file type
    const allowedTypes = ["image/jpeg", "image/png", "image/jpg", "application/pdf"];
    if (!allowedTypes.includes(req.file.mimetype)) {
      fs.unlink(req.file.path, () => {});
      return res.status(400).json({ message: "Only JPEG, PNG, and PDF files are allowed" });
    }

    // Validate file size (5MB max)
    if (req.file.size > 5 * 1024 * 1024) {
      fs.unlink(req.file.path, () => {});
      return res.status(400).json({ message: "File size must be less than 5MB" });
    }

    // Get payment record
    const [payment] = await db.query(
      "SELECT * FROM payment_verifications WHERE id = ?",
      [id]
    );

    if (payment.length === 0) {
      fs.unlink(req.file.path, () => {});
      return res.status(404).json({ message: "Payment not found" });
    }

    // Upload to Cloudinary
    const result = await cloudinary.uploader.upload(req.file.path, {
      folder: "payment_receipts",
      public_id: `receipt_${id}_${Date.now()}`,
      resource_type: "auto",
    });

    // Clean up temp file
    fs.unlink(req.file.path, (err) => {
      if (err) console.error("Error deleting temp file:", err);
    });

    // Update payment record with receipt URL
    await db.query(
      `UPDATE payment_verifications 
       SET receipt_url = ? 
       WHERE id = ?`,
      [result.secure_url, id]
    );

    return res.status(200).json({
      message: "Receipt uploaded successfully",
      receipt_url: result.secure_url,
    });
  } catch (error) {
    if (req.file) {
      fs.unlink(req.file.path, () => {});
    }
    console.error("Error uploading receipt:", error);
    return res.status(500).json({ message: error.message });
  }
};

// GET /api/owner/payments/summary — get payment summary for dashboard
exports.getPaymentSummary = async (req, res) => {
  const owner_id = req.user.id;

  try {
    const [summary] = await db.query(
      `SELECT 
        COUNT(*) as total_payments,
        SUM(CASE WHEN verification_status = 'verified' THEN 1 ELSE 0 END) as verified_count,
        SUM(CASE WHEN verification_status = 'pending' THEN 1 ELSE 0 END) as pending_count,
        SUM(CASE WHEN verification_status = 'rejected' THEN 1 ELSE 0 END) as rejected_count,
        SUM(CASE WHEN verification_status = 'verified' THEN amount ELSE 0 END) as total_verified_amount,
        SUM(CASE WHEN verification_status = 'pending' THEN amount ELSE 0 END) as total_pending_amount,
        SUM(CASE WHEN verification_status = 'rejected' THEN amount ELSE 0 END) as total_rejected_amount,
        SUM(amount) as total_amount
       FROM payment_verifications`
    );

    return res.status(200).json({
      message: "Payment summary retrieved successfully",
      summary: summary[0],
    });
  } catch (error) {
    console.error("Error fetching payment summary:", error);
    return res.status(500).json({ message: error.message });
  }
};

// GET /api/owner/payments/job/:job_id — get all payments for a specific job
exports.getJobPayments = async (req, res) => {
  const { job_id } = req.params;

  try {
    const [payments] = await db.query(
      `SELECT 
        pv.id,
        pv.payment_id,
        pv.amount,
        pv.currency,
        pv.receipt_number,
        pv.transaction_id,
        pv.payment_method,
        pv.payment_date,
        pv.verification_status,
        pv.verified_at,
        j.title as job_title,
        j.salary as job_salary,
        eu.name as employer_name,
        tu.name as talent_name,
        tu.email as talent_email
       FROM payment_verifications pv
       JOIN jobs j ON pv.job_id = j.id
       JOIN employers e ON pv.employer_id = e.id
       JOIN users eu ON e.user_id = eu.id
       JOIN talents t ON pv.talent_id = t.id
       JOIN users tu ON t.user_id = tu.id
       WHERE pv.job_id = ?
       ORDER BY pv.created_at DESC`,
      [job_id]
    );

    return res.status(200).json({
      message: "Job payments retrieved successfully",
      payments,
    });
  } catch (error) {
    console.error("Error fetching job payments:", error);
    return res.status(500).json({ message: error.message });
  }
};

// GET /api/owner/payments/talent/:talent_id — get all payments for a specific talent
exports.getTalentPayments = async (req, res) => {
  const { talent_id } = req.params;

  try {
    const [payments] = await db.query(
      `SELECT 
        pv.id,
        pv.payment_id,
        pv.job_id,
        pv.amount,
        pv.currency,
        pv.receipt_number,
        pv.transaction_id,
        pv.payment_method,
        pv.payment_date,
        pv.verification_status,
        pv.verified_at,
        j.title as job_title,
        j.salary as job_salary,
        eu.name as employer_name,
        tu.name as talent_name,
        tu.email as talent_email
       FROM payment_verifications pv
       JOIN jobs j ON pv.job_id = j.id
       JOIN employers e ON pv.employer_id = e.id
       JOIN users eu ON e.user_id = eu.id
       JOIN talents t ON pv.talent_id = t.id
       JOIN users tu ON t.user_id = tu.id
       WHERE pv.talent_id = ?
       ORDER BY pv.created_at DESC`,
      [talent_id]
    );

    return res.status(200).json({
      message: "Talent payments retrieved successfully",
      payments,
    });
  } catch (error) {
    console.error("Error fetching talent payments:", error);
    return res.status(500).json({ message: error.message });
  }
};
