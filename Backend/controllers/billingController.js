const db = require("../config/db");

// GET /api/billing - Get talent's billing information
exports.getBilling = async (req, res) => {
  const user_id = req.user.id;

  try {
    const [billings] = await db.query(
      `SELECT 
        id,
        user_id,
        phone,
        payout_method,
        account_number,
        bank_name,
        is_verified,
        approval_status,
        admin_note,
        created_at,
        updated_at
       FROM billing
       WHERE user_id = ?
       LIMIT 1`,
      [user_id]
    );

    if (billings.length === 0) {
      return res.status(404).json({ message: "No billing information found" });
    }

    return res.status(200).json({ billing: billings[0] });
  } catch (error) {
    console.error("Error in getBilling:", error);
    return res.status(500).json({ message: error.message });
  }
};

// POST /api/billing - Create or update talent's billing information
exports.submitBilling = async (req, res) => {
  const user_id = req.user.id;
  const { phone, payout_method, account_number, bank_name } = req.body;

  try {
    console.log("Submitting billing for user:", user_id, { phone, payout_method, account_number, bank_name });

    // Validate required fields
    if (!phone || !payout_method) {
      return res.status(400).json({ message: "Phone and payout method are required" });
    }

    if (payout_method === "bank" && (!account_number || !bank_name)) {
      return res.status(400).json({ message: "Account number and bank name required for bank transfers" });
    }

    // Check if billing already exists
    const [existing] = await db.query(
      "SELECT id FROM billing WHERE user_id = ?",
      [user_id]
    );

    if (existing.length > 0) {
      // Update existing
      await db.query(
        `UPDATE billing 
         SET phone = ?, payout_method = ?, account_number = ?, bank_name = ?, is_verified = FALSE, approval_status = 'pending', updated_at = NOW()
         WHERE user_id = ?`,
        [phone, payout_method, account_number || null, bank_name || null, user_id]
      );
    } else {
      // Create new
      await db.query(
        `INSERT INTO billing (user_id, phone, payout_method, account_number, bank_name, is_verified, approval_status)
         VALUES (?, ?, ?, ?, ?, FALSE, 'pending')`,
        [user_id, phone, payout_method, account_number || null, bank_name || null]
      );
    }

    return res.status(200).json({ message: "Billing information submitted for verification" });
  } catch (error) {
    console.error("Error in submitBilling:", error);
    return res.status(500).json({ message: error.message });
  }
};

// DELETE /api/billing - Delete talent's billing information
exports.deleteBilling = async (req, res) => {
  const user_id = req.user.id;

  try {
    await db.query(
      "DELETE FROM billing WHERE user_id = ?",
      [user_id]
    );

    return res.status(200).json({ message: "Billing information deleted" });
  } catch (error) {
    console.error("Error in deleteBilling:", error);
    return res.status(500).json({ message: error.message });
  }
};

// GET /api/billing/my-status - Get talent's billing approval status
exports.getTalentBillingStatus = async (req, res) => {
  const user_id = req.user.id;

  try {
    const [billings] = await db.query(
      `SELECT 
        id,
        phone,
        payout_method,
        account_number,
        bank_name,
        is_verified,
        approval_status,
        admin_note,
        created_at,
        approved_at
       FROM billing
       WHERE user_id = ?
       LIMIT 1`,
      [user_id]
    );

    if (billings.length === 0) {
      return res.status(404).json({ message: "No billing information found" });
    }

    return res.status(200).json({ billing: billings[0] });
  } catch (error) {
    console.error("Error in getTalentBillingStatus:", error);
    return res.status(500).json({ message: error.message });
  }
};

// GET /api/billing/pending - Get pending billing verifications
exports.getPendingBillingApprovals = async (req, res) => {
  try {
    const [billings] = await db.query(
      `SELECT 
        b.id,
        b.user_id,
        b.phone,
        b.payout_method,
        b.account_number,
        b.bank_name,
        b.is_verified,
        b.approval_status,
        b.created_at,
        u.name as user_name,
        u.email as user_email
       FROM billing b
       JOIN users u ON b.user_id = u.id
       WHERE b.is_verified = FALSE
       ORDER BY b.created_at DESC`
    );

    return res.status(200).json({ billings });
  } catch (error) {
    console.error("Error in getPendingBillingApprovals:", error);
    return res.status(500).json({ message: error.message });
  }
};

// GET /api/billing/all - Get all billing information
exports.getAllBilling = async (req, res) => {
  try {
    const [billings] = await db.query(
      `SELECT 
        b.id,
        b.user_id,
        b.phone,
        b.payout_method,
        b.account_number,
        b.bank_name,
        b.is_verified,
        b.approval_status,
        b.created_at,
        u.name as user_name,
        u.email as user_email
       FROM billing b
       JOIN users u ON b.user_id = u.id
       ORDER BY b.is_verified ASC, b.created_at DESC`
    );

    return res.status(200).json({ billing: billings });
  } catch (error) {
    console.error("Error in getAllBilling:", error);
    return res.status(500).json({ message: error.message });
  }
};

// PATCH /api/billing/:billingId/approve - Verify billing information
exports.approveBilling = async (req, res) => {
  const { billingId } = req.params;
  const { admin_note } = req.body;
  const admin_id = req.user.id;

  const connection = await db.getConnection();
  try {
    await connection.beginTransaction();

    // Get billing record
    const [billings] = await connection.query(
      "SELECT * FROM billing WHERE id = ? FOR UPDATE",
      [billingId]
    );

    if (billings.length === 0) {
      await connection.rollback();
      return res.status(404).json({ message: "Billing record not found" });
    }

    const billing = billings[0];

    // Update billing - verify
    await connection.query(
      `UPDATE billing 
       SET is_verified = TRUE,
           approval_status = 'approved',
           admin_note = ?,
           approved_by = ?,
           approved_at = NOW()
       WHERE id = ?`,
      [admin_note || null, admin_id, billingId]
    );

    // Notify talent
    await connection.query(
      `INSERT INTO notifications (user_id, type, title, message)
       VALUES (?, 'billing_verified', ?, ?)`,
      [
        billing.user_id,
        "Billing Information Verified",
        "Your billing information has been verified. You can now receive payouts.",
      ]
    );

    await connection.commit();
    return res.status(200).json({ message: "Billing information verified successfully" });
  } catch (error) {
    await connection.rollback();
    console.error("Error in approveBilling:", error);
    return res.status(500).json({ message: error.message });
  } finally {
    connection.release();
  }
};

// PATCH /api/billing/:billingId/reject - Reject billing information
exports.rejectBilling = async (req, res) => {
  const { billingId } = req.params;
  const { admin_note } = req.body;
  const admin_id = req.user.id;

  const connection = await db.getConnection();
  try {
    await connection.beginTransaction();

    // Get billing record
    const [billings] = await connection.query(
      "SELECT * FROM billing WHERE id = ? FOR UPDATE",
      [billingId]
    );

    if (billings.length === 0) {
      await connection.rollback();
      return res.status(404).json({ message: "Billing record not found" });
    }

    const billing = billings[0];

    // Update billing - reject
    await connection.query(
      `UPDATE billing 
       SET is_verified = FALSE,
           approval_status = 'rejected',
           admin_note = ?,
           approved_by = ?,
           approved_at = NOW()
       WHERE id = ?`,
      [admin_note || "Rejected by admin", admin_id, billingId]
    );

    // Notify talent
    await connection.query(
      `INSERT INTO notifications (user_id, type, title, message)
       VALUES (?, 'billing_rejected', ?, ?)`,
      [
        billing.user_id,
        "Billing Information Rejected",
        `Your billing information was rejected. Reason: ${admin_note || "Please update your information and resubmit."}`,
      ]
    );

    await connection.commit();
    return res.status(200).json({ message: "Billing information rejected successfully" });
  } catch (error) {
    await connection.rollback();
    console.error("Error in rejectBilling:", error);
    return res.status(500).json({ message: error.message });
  } finally {
    connection.release();
  }
};
