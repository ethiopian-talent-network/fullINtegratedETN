const db = require("../config/db");

// POST /api/agreements — create agreement when employer hires talent
exports.createAgreement = async (req, res) => {
  const { job_id, talent_id, budget, start_date, end_date } = req.body;
  const user_id = req.user.id;

  if (!job_id || !talent_id || !budget) {
    return res.status(400).json({ message: "job_id, talent_id, and budget are required" });
  }

  const connection = await db.getConnection();
  try {
    await connection.beginTransaction();

    // Get employer_id from user_id
    const [employerRows] = await connection.query(
      "SELECT id FROM employers WHERE user_id = ?",
      [user_id]
    );
    if (employerRows.length === 0) {
      await connection.rollback();
      return res.status(404).json({ message: "Employer profile not found" });
    }
    const employer_id = employerRows[0].id;

    // Get job details
    const [jobRows] = await connection.query(
      "SELECT title, description FROM jobs WHERE id = ? AND employer_id = ?",
      [job_id, employer_id]
    );
    if (jobRows.length === 0) {
      await connection.rollback();
      return res.status(404).json({ message: "Job not found or unauthorized" });
    }

    // Create agreement
    const [agreementResult] = await connection.query(
      `INSERT INTO agreements (job_id, employer_id, talent_id, title, description, budget, start_date, end_date, status)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'pending')`,
      [job_id, employer_id, talent_id, jobRows[0].title, jobRows[0].description, budget, start_date || null, end_date || null]
    );

    // Create escrow account
    await connection.query(
      `INSERT INTO escrow_accounts (agreement_id, job_id, employer_id, talent_id, amount, status)
       VALUES (?, ?, ?, ?, ?, 'pending')`,
      [agreementResult.insertId, job_id, employer_id, talent_id, budget]
    );

    // Log activity
    await connection.query(
      `INSERT INTO agreement_activity_log (agreement_id, user_id, action, description, new_status)
       VALUES (?, ?, 'created', 'Agreement created', 'pending')`,
      [agreementResult.insertId, user_id]
    );

    // Notify talent
    const [talentUser] = await connection.query(
      "SELECT user_id FROM talents WHERE id = ?",
      [talent_id]
    );
    if (talentUser.length > 0) {
      await connection.query(
        `INSERT INTO notifications (user_id, type, title, message, is_read, created_at)
         VALUES (?, 'agreement_created', 'New Agreement', 'An employer has sent you an agreement for review', false, NOW())`,
        [talentUser[0].user_id]
      );
    }

    await connection.commit();
    return res.status(201).json({
      message: "Agreement created successfully",
      agreement_id: agreementResult.insertId,
    });
  } catch (error) {
    await connection.rollback();
    return res.status(500).json({ message: error.message });
  } finally {
    connection.release();
  }
};

// GET /api/agreements — get all agreements for user
exports.getAgreements = async (req, res) => {
  const { status, role, page = 1, limit = 20 } = req.query;
  const user_id = req.user.id;
  const offset = (page - 1) * limit;

  try {
    let where = "WHERE 1=1";
    const params = [];

    if (role === "employer") {
      const [employerRows] = await db.query(
        "SELECT id FROM employers WHERE user_id = ?",
        [user_id]
      );
      if (employerRows.length === 0) {
        return res.status(200).json({ agreements: [], pagination: { total: 0, page: 1, pages: 0 } });
      }
      where += " AND a.employer_id = ?";
      params.push(employerRows[0].id);
    } else if (role === "talent") {
      const [talentRows] = await db.query(
        "SELECT id FROM talents WHERE user_id = ?",
        [user_id]
      );
      if (talentRows.length === 0) {
        return res.status(200).json({ agreements: [], pagination: { total: 0, page: 1, pages: 0 } });
      }
      where += " AND a.talent_id = ?";
      params.push(talentRows[0].id);
    }

    if (status && status !== "all") {
      where += " AND a.status = ?";
      params.push(status);
    }

    const [agreements] = await db.query(
      `SELECT 
        a.id, a.job_id, a.title, a.description, a.budget, a.currency,
        a.status, a.start_date, a.end_date,
        a.employer_accepted_at, a.talent_accepted_at, a.started_at, a.completed_at,
        a.created_at, a.updated_at,
        j.title as job_title,
        emp.company_name, u_emp.name as employer_name, u_emp.email as employer_email,
        u_tal.name as talent_name, u_tal.email as talent_email,
        e.status as escrow_status, e.amount as escrow_amount
       FROM agreements a
       LEFT JOIN jobs j ON a.job_id = j.id
       LEFT JOIN employers emp ON a.employer_id = emp.id
       LEFT JOIN users u_emp ON emp.user_id = u_emp.id
       LEFT JOIN talents t ON a.talent_id = t.id
       LEFT JOIN users u_tal ON t.user_id = u_tal.id
       LEFT JOIN escrow_accounts e ON a.id = e.agreement_id
       ${where}
       ORDER BY a.created_at DESC
       LIMIT ? OFFSET ?`,
      [...params, parseInt(limit), offset]
    );

    const [[{ total }]] = await db.query(
      `SELECT COUNT(*) AS total FROM agreements a ${where}`,
      params
    );

    return res.status(200).json({
      agreements,
      pagination: { total, page: parseInt(page), limit: parseInt(limit), pages: Math.ceil(total / limit) },
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

// GET /api/agreements/:id — get agreement details
exports.getAgreementDetails = async (req, res) => {
  const { id } = req.params;
  const user_id = req.user.id;

  try {
    const [agreements] = await db.query(
      `SELECT 
        a.*, 
        j.title as job_title, j.description as job_description,
        emp.company_name, u_emp.name as employer_name, u_emp.email as employer_email,
        u_tal.name as talent_name, u_tal.email as talent_email,
        e.id as escrow_id, e.status as escrow_status, e.amount as escrow_amount,
        GROUP_CONCAT(m.id) as milestone_ids,
        GROUP_CONCAT(m.title) as milestone_titles,
        GROUP_CONCAT(m.status) as milestone_statuses
       FROM agreements a
       LEFT JOIN jobs j ON a.job_id = j.id
       LEFT JOIN employers emp ON a.employer_id = emp.id
       LEFT JOIN users u_emp ON emp.user_id = u_emp.id
       LEFT JOIN talents t ON a.talent_id = t.id
       LEFT JOIN users u_tal ON t.user_id = u_tal.id
       LEFT JOIN escrow_accounts e ON a.id = e.agreement_id
       LEFT JOIN agreement_milestones m ON a.id = m.agreement_id
       WHERE a.id = ?
       GROUP BY a.id`,
      [id]
    );

    if (agreements.length === 0) {
      return res.status(404).json({ message: "Agreement not found" });
    }

    const agreement = agreements[0];

    // Check authorization
    const [employerCheck] = await db.query(
      "SELECT id FROM employers WHERE user_id = ? AND id = ?",
      [user_id, agreement.employer_id]
    );
    const [talentCheck] = await db.query(
      "SELECT id FROM talents WHERE user_id = ? AND id = ?",
      [user_id, agreement.talent_id]
    );

    if (employerCheck.length === 0 && talentCheck.length === 0) {
      return res.status(403).json({ message: "Unauthorized" });
    }

    // Get activity log
    const [activityLog] = await db.query(
      `SELECT al.*, u.name as user_name
       FROM agreement_activity_log al
       LEFT JOIN users u ON al.user_id = u.id
       WHERE al.agreement_id = ?
       ORDER BY al.created_at DESC`,
      [id]
    );

    return res.status(200).json({
      agreement: {
        ...agreement,
        milestones: agreement.milestone_ids
          ? agreement.milestone_ids.split(",").map((mid, i) => ({
              id: mid,
              title: agreement.milestone_titles.split(",")[i],
              status: agreement.milestone_statuses.split(",")[i],
            }))
          : [],
      },
      activity_log: activityLog,
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

// PATCH /api/agreements/:id/accept — accept agreement
exports.acceptAgreement = async (req, res) => {
  const { id } = req.params;
  const user_id = req.user.id;

  const connection = await db.getConnection();
  try {
    await connection.beginTransaction();

    const [agreements] = await connection.query(
      "SELECT * FROM agreements WHERE id = ?",
      [id]
    );

    if (agreements.length === 0) {
      await connection.rollback();
      return res.status(404).json({ message: "Agreement not found" });
    }

    const agreement = agreements[0];

    // Determine if user is employer or talent
    const [employerCheck] = await connection.query(
      "SELECT id FROM employers WHERE user_id = ? AND id = ?",
      [user_id, agreement.employer_id]
    );
    const [talentCheck] = await connection.query(
      "SELECT id FROM talents WHERE user_id = ? AND id = ?",
      [user_id, agreement.talent_id]
    );

    if (employerCheck.length === 0 && talentCheck.length === 0) {
      await connection.rollback();
      return res.status(403).json({ message: "Unauthorized" });
    }

    let newStatus = agreement.status;
    if (employerCheck.length > 0) {
      if (agreement.employer_accepted_at) {
        await connection.rollback();
        return res.status(400).json({ message: "Employer has already accepted this agreement" });
      }
      await connection.query(
        "UPDATE agreements SET employer_accepted_at = NOW() WHERE id = ?",
        [id]
      );
      newStatus = agreement.talent_accepted_at ? "active" : "employer_accepted";
    } else if (talentCheck.length > 0) {
      if (agreement.talent_accepted_at) {
        await connection.rollback();
        return res.status(400).json({ message: "Talent has already accepted this agreement" });
      }
      await connection.query(
        "UPDATE agreements SET talent_accepted_at = NOW() WHERE id = ?",
        [id]
      );
      newStatus = agreement.employer_accepted_at ? "active" : "talent_accepted";
    }

    // Update status
    await connection.query(
      "UPDATE agreements SET status = ?, updated_at = NOW() WHERE id = ?",
      [newStatus, id]
    );

    // Log activity
    await connection.query(
      `INSERT INTO agreement_activity_log (agreement_id, user_id, action, description, old_status, new_status)
       VALUES (?, ?, 'accepted', ?, ?, ?)`,
      [id, user_id, employerCheck.length > 0 ? "Employer accepted" : "Talent accepted", agreement.status, newStatus]
    );

    // If both accepted, update escrow to funded and notify both parties
    if (newStatus === "active") {
      await connection.query(
        "UPDATE escrow_accounts SET status = 'funded', funded_at = NOW() WHERE agreement_id = ?",
        [id]
      );

      // Notify both parties
      const [talentUser] = await connection.query(
        "SELECT user_id FROM talents WHERE id = ?",
        [agreement.talent_id]
      );
      const [employerUser] = await connection.query(
        "SELECT user_id FROM employers WHERE user_id = ? LIMIT 1",
        [agreement.employer_id]
      );

      if (talentUser.length > 0) {
        await connection.query(
          `INSERT INTO notifications (user_id, type, title, message, is_read, created_at)
           VALUES (?, 'agreement_active', 'Agreement Active', 'The agreement has been accepted by both parties. Project is now active.', false, NOW())`,
          [talentUser[0].user_id]
        );
      }
      if (employerUser.length > 0) {
        await connection.query(
          `INSERT INTO notifications (user_id, type, title, message, is_read, created_at)
           VALUES (?, 'agreement_active', 'Agreement Active', 'The agreement has been accepted by both parties. Project is now active.', false, NOW())`,
          [employerUser[0].user_id]
        );
      }
    }

    await connection.commit();
    return res.status(200).json({
      message: "Agreement accepted successfully",
      new_status: newStatus,
    });
  } catch (error) {
    await connection.rollback();
    return res.status(500).json({ message: error.message });
  } finally {
    connection.release();
  }
};

// PATCH /api/agreements/:id/complete — mark agreement as completed
exports.completeAgreement = async (req, res) => {
  const { id } = req.params;
  const user_id = req.user.id;

  const connection = await db.getConnection();
  try {
    await connection.beginTransaction();

    const [agreements] = await connection.query(
      "SELECT * FROM agreements WHERE id = ?",
      [id]
    );

    if (agreements.length === 0) {
      await connection.rollback();
      return res.status(404).json({ message: "Agreement not found" });
    }

    const agreement = agreements[0];

    // Only talent can mark as completed
    const [talentCheck] = await connection.query(
      "SELECT id FROM talents WHERE user_id = ? AND id = ?",
      [user_id, agreement.talent_id]
    );

    if (talentCheck.length === 0) {
      await connection.rollback();
      return res.status(403).json({ message: "Only talent can mark agreement as completed" });
    }

    if (agreement.status !== "active") {
      await connection.rollback();
      return res.status(400).json({ message: "Agreement must be active to mark as completed" });
    }

    await connection.query(
      "UPDATE agreements SET status = 'completed', completed_at = NOW(), updated_at = NOW() WHERE id = ?",
      [id]
    );

    // Log activity
    await connection.query(
      `INSERT INTO agreement_activity_log (agreement_id, user_id, action, description, old_status, new_status)
       VALUES (?, ?, 'completed', 'Talent marked work as completed', 'active', 'completed')`,
      [id, user_id]
    );

    // Notify employer
    const [employerUser] = await connection.query(
      "SELECT user_id FROM employers WHERE id = ?",
      [agreement.employer_id]
    );

    if (employerUser.length > 0) {
      await connection.query(
        `INSERT INTO notifications (user_id, type, title, message, is_read, created_at)
         VALUES (?, 'work_completed', 'Work Completed', 'The talent has marked the work as completed. Please review and confirm.', false, NOW())`,
        [employerUser[0].user_id]
      );
    }

    await connection.commit();
    return res.status(200).json({ message: "Agreement marked as completed" });
  } catch (error) {
    await connection.rollback();
    return res.status(500).json({ message: error.message });
  } finally {
    connection.release();
  }
};

// PATCH /api/agreements/:id/confirm-completion — employer confirms completion
exports.confirmCompletion = async (req, res) => {
  const { id } = req.params;
  const user_id = req.user.id;

  const connection = await db.getConnection();
  try {
    await connection.beginTransaction();

    const [agreements] = await connection.query(
      "SELECT * FROM agreements WHERE id = ?",
      [id]
    );

    if (agreements.length === 0) {
      await connection.rollback();
      return res.status(404).json({ message: "Agreement not found" });
    }

    const agreement = agreements[0];

    // Only employer can confirm completion
    const [employerCheck] = await connection.query(
      "SELECT id FROM employers WHERE user_id = ? AND id = ?",
      [user_id, agreement.employer_id]
    );

    if (employerCheck.length === 0) {
      await connection.rollback();
      return res.status(403).json({ message: "Only employer can confirm completion" });
    }

    if (agreement.status !== "completed") {
      await connection.rollback();
      return res.status(400).json({ message: "Agreement must be marked as completed first" });
    }

    // Get escrow details
    const [escrowRows] = await connection.query(
      "SELECT * FROM escrow_accounts WHERE agreement_id = ?",
      [id]
    );

    if (escrowRows.length === 0) {
      await connection.rollback();
      return res.status(404).json({ message: "Escrow account not found" });
    }

    const escrow = escrowRows[0];

    // Create payout record
    const [payoutResult] = await connection.query(
      `INSERT INTO payout_history (agreement_id, escrow_id, talent_id, employer_id, amount, currency, payout_type, status)
       VALUES (?, ?, ?, ?, ?, ?, 'completion', 'pending')`,
      [id, escrow.id, agreement.talent_id, agreement.employer_id, escrow.amount, escrow.currency]
    );

    // Log activity
    await connection.query(
      `INSERT INTO agreement_activity_log (agreement_id, user_id, action, description, old_status, new_status)
       VALUES (?, ?, 'completion_confirmed', 'Employer confirmed work completion. Payout pending admin approval.', 'completed', 'completed')`,
      [id, user_id]
    );

    // Notify talent
    const [talentUser] = await connection.query(
      "SELECT user_id FROM talents WHERE id = ?",
      [agreement.talent_id]
    );

    if (talentUser.length > 0) {
      await connection.query(
        `INSERT INTO notifications (user_id, type, title, message, is_read, created_at)
         VALUES (?, 'payout_pending', 'Payout Pending', 'Your work has been confirmed. Payout is pending admin approval.', false, NOW())`,
        [talentUser[0].user_id]
      );
    }

    await connection.commit();
    return res.status(200).json({
      message: "Completion confirmed. Payout pending admin approval.",
      payout_id: payoutResult.insertId,
    });
  } catch (error) {
    await connection.rollback();
    return res.status(500).json({ message: error.message });
  } finally {
    connection.release();
  }
};
