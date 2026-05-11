const db = require("../config/db");
const bcrypt = require("bcryptjs");

exports.addCategories = async (req, res) => {
  const { name } = req.body;
  try {
    if (!name) return res.status(400).json({ message: "Please insert the category name" });
    const [row] = await db.query("SELECT * FROM categories WHERE name = ?", [name]);
    if (row.length > 0) return res.status(400).json({ message: "Category already exists" });
    const [row0] = await db.query("INSERT INTO categories SET name = ?", [name]);
    if (row0.affectedRows > 0) return res.status(200).json({ message: "Category added" });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

// GET /api/admin/dashboard — platform overview stats
exports.getDashboard = async (req, res) => {
  try {
    const [[talents]]   = await db.query("SELECT COUNT(*) AS total FROM users WHERE role = 'talent'");
    const [[employers]] = await db.query("SELECT COUNT(*) AS total FROM users WHERE role = 'employer'");
    const [[owners]]    = await db.query("SELECT COUNT(*) AS total FROM users WHERE role = 'owner'");
    const [[jobs]]      = await db.query("SELECT COUNT(*) AS total FROM jobs");
    const [[activeJobs]]= await db.query("SELECT COUNT(*) AS total FROM jobs WHERE status = 'active'");
    const [[apps]]      = await db.query("SELECT COUNT(*) AS total FROM applications");
    const [[payments]]  = await db.query("SELECT COUNT(*) AS total, COALESCE(SUM(amount),0) AS volume FROM payments WHERE status = 'success'");
    const [[pending]]   = await db.query("SELECT COUNT(*) AS total FROM payments WHERE status = 'pending'");

    return res.status(200).json({
      stats: {
        total_talents:   talents.total,
        total_employers: employers.total,
        total_owners:    owners.total,
        total_jobs:      jobs.total,
        active_jobs:     activeJobs.total,
        total_applications: apps.total,
        total_payments:  payments.total,
        total_revenue:   payments.volume,
        pending_payments: pending.total,
      },
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

// GET /api/admin/users — list all users with filters
exports.getUsers = async (req, res) => {
  const { role, search, page = 1, limit = 20 } = req.query;
  const offset = (page - 1) * limit;
  let where = "WHERE 1=1";
  const params = [];

  if (role && role !== "all") { where += " AND role = ?"; params.push(role); }
  if (search) {
    where += " AND (name LIKE ? OR email LIKE ?)";
    const like = `%${search}%`;
    params.push(like, like);
  }

  try {
    const [users] = await db.query(
      `SELECT id, name, email, role, is_verified, created_at FROM users ${where} ORDER BY created_at DESC LIMIT ? OFFSET ?`,
      [...params, parseInt(limit), offset]
    );
    const [[{ total }]] = await db.query(`SELECT COUNT(*) AS total FROM users ${where}`, params);
    return res.status(200).json({ users, pagination: { total, page: parseInt(page), limit: parseInt(limit), pages: Math.ceil(total / limit) } });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

// POST /api/admin/create-employer — admin creates employer account
exports.createEmployer = async (req, res) => {
  const { name, email, password, company_name, location } = req.body;
  if (!name || !email || !password || !company_name)
    return res.status(400).json({ message: "name, email, password and company_name are required" });

  const connection = await db.getConnection();
  try {
    await connection.beginTransaction();

    const [existing] = await connection.query("SELECT id FROM users WHERE email = ?", [email.toLowerCase().trim()]);
    if (existing.length > 0) {
      await connection.rollback();
      return res.status(400).json({ message: "Email already in use" });
    }

    const hashed = await bcrypt.hash(password, 12);
    const [userResult] = await connection.query(
      "INSERT INTO users (name, email, password, role, is_verified) VALUES (?, ?, ?, 'employer', 1)",
      [name, email.toLowerCase().trim(), hashed]
    );

    await connection.query(
      "INSERT INTO employers (user_id, company_name, location) VALUES (?, ?, ?)",
      [userResult.insertId, company_name, location || null]
    );

    await connection.commit();
    return res.status(201).json({
      message: "Employer account created successfully",
      employer: { id: userResult.insertId, name, email, company_name },
    });
  } catch (error) {
    await connection.rollback();
    return res.status(500).json({ message: error.message });
  } finally {
    connection.release();
  }
};

// POST /api/admin/create-owner — admin creates platform owner account
exports.createOwner = async (req, res) => {
  const { name, email, password } = req.body;
  if (!name || !email || !password)
    return res.status(400).json({ message: "name, email and password are required" });

  try {
    const [existing] = await db.query("SELECT id FROM users WHERE email = ?", [email.toLowerCase().trim()]);
    if (existing.length > 0)
      return res.status(400).json({ message: "Email already in use" });

    const hashed = await bcrypt.hash(password, 12);
    const [result] = await db.query(
      "INSERT INTO users (name, email, password, role, is_verified) VALUES (?, ?, ?, 'owner', 1)",
      [name, email.toLowerCase().trim(), hashed]
    );

    return res.status(201).json({
      message: "Owner account created successfully",
      owner: { id: result.insertId, name, email, role: "owner" },
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

// PATCH /api/admin/users/:id/toggle — activate/deactivate user
exports.toggleUser = async (req, res) => {
  const { id } = req.params;
  try {
    const [rows] = await db.query("SELECT is_verified, role FROM users WHERE id = ?", [id]);
    if (rows.length === 0) return res.status(404).json({ message: "User not found" });
    if (["admin", "owner"].includes(rows[0].role))
      return res.status(403).json({ message: "Cannot deactivate admin or owner accounts" });

    const newStatus = rows[0].is_verified ? 0 : 1;
    await db.query("UPDATE users SET is_verified = ? WHERE id = ?", [newStatus, id]);
    return res.status(200).json({ message: newStatus ? "User activated" : "User deactivated" });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

// DELETE /api/admin/users/:id — delete user
exports.deleteUser = async (req, res) => {
  const { id } = req.params;
  const connection = await db.getConnection();
  try {
    await connection.beginTransaction();

    const [rows] = await connection.query("SELECT role FROM users WHERE id = ?", [id]);
    if (rows.length === 0) { await connection.rollback(); return res.status(404).json({ message: "User not found" }); }
    if (["admin", "owner"].includes(rows[0].role)) { await connection.rollback(); return res.status(403).json({ message: "Cannot delete admin or owner accounts" }); }

    // Delete in FK dependency order
    // proposals → applications
    await connection.query(`DELETE p FROM proposals p JOIN applications a ON p.application_id = a.id WHERE a.talent_id = ?`, [id]);
    await connection.query(`DELETE p FROM proposals p JOIN applications a ON p.application_id = a.id JOIN jobs j ON a.job_id = j.id WHERE j.employer_id = ?`, [id]);

    // applications
    await connection.query("DELETE FROM applications WHERE talent_id = ?", [id]);
    await connection.query(`DELETE a FROM applications a JOIN jobs j ON a.job_id = j.id WHERE j.employer_id = ?`, [id]);

    // contracts & related
    await connection.query("DELETE FROM contract_milestones WHERE contract_id IN (SELECT id FROM contracts WHERE employer_id = ? OR talent_id = ?)", [id, id]);
    await connection.query("DELETE FROM contract_signatures WHERE contract_id IN (SELECT id FROM contracts WHERE employer_id = ? OR talent_id = ?)", [id, id]);
    await connection.query("DELETE FROM contract_revisions WHERE contract_id IN (SELECT id FROM contracts WHERE employer_id = ? OR talent_id = ?)", [id, id]);
    await connection.query("DELETE FROM contract_documents WHERE contract_id IN (SELECT id FROM contracts WHERE employer_id = ? OR talent_id = ?)", [id, id]);
    await connection.query("DELETE FROM contracts WHERE employer_id = ? OR talent_id = ?", [id, id]);

    // payments & escrow (before jobs)
    await connection.query("DELETE FROM payouts WHERE escrow_id IN (SELECT id FROM escrow WHERE employer_id = ? OR talent_id = ?)", [id, id]);
    await connection.query("DELETE FROM escrow WHERE employer_id = ? OR talent_id = ?", [id, id]);
    await connection.query("DELETE FROM payments WHERE client_id = ?", [id]);
    await connection.query(`DELETE FROM payments WHERE job_id IN (SELECT id FROM jobs WHERE employer_id = ?)`, [id]);

    // talent-specific tables
    const [talent] = await connection.query("SELECT id FROM talents WHERE user_id = ?", [id]);
    if (talent.length > 0) {
      const tid = talent[0].id;
      await connection.query("DELETE FROM saved_jobs WHERE talent_id = ?", [tid]);
      await connection.query("DELETE FROM talent_skills WHERE talent_id = ?", [tid]);
      await connection.query("DELETE FROM connections WHERE sender_id = ? OR reciver_id = ?", [tid, tid]);
      await connection.query("DELETE FROM token_transactions WHERE talent_id = ?", [id]);
      await connection.query("DELETE FROM tokens WHERE talent_id = ?", [id]);
    }

    // employer-specific (jobs last after payments)
    await connection.query("DELETE FROM job_skills WHERE job_id IN (SELECT id FROM jobs WHERE employer_id = ?)", [id]);
    await connection.query("DELETE FROM jobs WHERE employer_id = ?", [id]);
    await connection.query("DELETE FROM employers WHERE user_id = ?", [id]);

    // shared tables
    await connection.query("DELETE FROM billing WHERE user_id = ?", [id]);
    await connection.query("DELETE FROM Protifolio WHERE user_id = ?", [id]);
    await connection.query("DELETE FROM certificates WHERE user_id = ?", [id]);
    await connection.query("DELETE FROM verification_requests WHERE user_id = ?", [id]);
    await connection.query("DELETE FROM notifications WHERE user_id = ? OR sender_user_id = ?", [id, id]);
    await connection.query("DELETE FROM messages WHERE sender_id = ? OR reciver_id = ?", [id, id]);
    await connection.query("DELETE FROM talents WHERE user_id = ?", [id]);

    await connection.query("DELETE FROM users WHERE id = ?", [id]);

    await connection.commit();
    return res.status(200).json({ message: "User deleted" });
  } catch (error) {
    await connection.rollback();
    return res.status(500).json({ message: error.message });
  } finally {
    connection.release();
  }
};

// GET /api/admin/verification-requests
exports.getVerificationRequests = async (req, res) => {
  const { status = "pending" } = req.query;
  try {
    const [requests] = await db.query(
      `SELECT vr.id, vr.user_id, vr.status, vr.message, vr.admin_note, vr.national_id_image, vr.created_at,
              u.name, u.email, u.profile_image
       FROM verification_requests vr
       JOIN users u ON u.id = vr.user_id
       WHERE vr.status = ?
       ORDER BY vr.created_at ASC`,
      [status]
    );
    return res.status(200).json({ requests });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

// GET /api/admin/talent-profile/:userId — full talent profile for admin review
exports.getTalentProfileForAdmin = async (req, res) => {
  const { userId } = req.params;
  try {
    const [[user]] = await db.query(
      `SELECT u.id, u.name, u.email, u.profile_image, u.is_verified,
              t.about, t.education, t.experience, t.languages,
              t.linkedin, t.github, t.resume_url, t.Location, t.HourlyRate,
              GROUP_CONCAT(DISTINCT s.skill_name ORDER BY s.skill_name SEPARATOR ',') AS skills
       FROM users u
       LEFT JOIN talents t ON t.user_id = u.id
       LEFT JOIN talent_skills ts ON t.id = ts.talent_id
       LEFT JOIN skills s ON ts.skill_id = s.id
       WHERE u.id = ?
       GROUP BY u.id, t.id`,
      [userId]
    );
    if (!user) return res.status(404).json({ message: "User not found" });

    const [portfolio] = await db.query(
      "SELECT id, title, description, technologies, image_url, project_url, github_url FROM Protifolio WHERE user_id = ? ORDER BY create_at DESC",
      [userId]
    );
    const [certificates] = await db.query(
      "SELECT title, organization, issue_date, credential_url FROM certificates WHERE user_id = ? ORDER BY issue_date DESC",
      [userId]
    );
    const [verReq] = await db.query(
      "SELECT id, status, message, admin_note, created_at FROM verification_requests WHERE user_id = ? ORDER BY created_at DESC LIMIT 1",
      [userId]
    );

    return res.status(200).json({
      profile: { ...user, skills: user.skills ? user.skills.split(",") : [] },
      portfolio: portfolio.map(p => ({ ...p, technologies: p.technologies ? JSON.parse(p.technologies) : [] })),
      certificates,
      verification_request: verReq[0] || null,
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

// GET /api/admin/license-requests
exports.getLicenseRequests = async (req, res) => {
  const { status = "pending" } = req.query;
  
  // Validate status parameter
  if (!['pending', 'approved', 'rejected'].includes(status)) {
    return res.status(400).json({ message: "Invalid status. Must be pending, approved, or rejected" });
  }
  
  try {
    const [requests] = await db.query(
      `SELECT el.id, el.employer_id, el.user_id, el.license_name, el.license_number,
              el.issuing_authority, el.license_image, el.status, el.admin_note, el.submitted_at,
              u.name, u.email, e.company_name, e.is_verified
       FROM employer_licenses el
       JOIN users u ON u.id = el.user_id
       JOIN employers e ON e.id = el.employer_id
       WHERE el.status = ?
       ORDER BY el.submitted_at ASC`,
      [status]
    );
    return res.status(200).json({ requests });
  } catch (error) {
    console.error(`[SECURITY] License request access attempt by user ${req.user?.id} failed:`, error.message);
    return res.status(500).json({ message: "Internal server error" });
  }
};

// PATCH /api/admin/license-requests/:id
exports.reviewLicenseRequest = async (req, res) => {
  const { id } = req.params;
  const { action, admin_note } = req.body;
  
  // Additional security validation
  if (!Number.isInteger(parseInt(id)) || parseInt(id) <= 0) {
    return res.status(400).json({ message: "Invalid request ID" });
  }
  
  const connection = await db.getConnection();
  try {
    await connection.beginTransaction();
    
    // Check if request exists and get current status
    const [rows] = await connection.query(
      "SELECT employer_id, user_id, status FROM employer_licenses WHERE id = ?", [id]
    );
    
    if (!rows.length) { 
      await connection.rollback(); 
      return res.status(404).json({ message: "License request not found" }); 
    }
    
    const { employer_id, user_id, status } = rows[0];
    
    // Prevent duplicate processing
    if (status !== 'pending') {
      await connection.rollback();
      return res.status(400).json({ message: "Request has already been processed" });
    }
    
    const newStatus = action === "approve" ? "approved" : "rejected";

    // Log the admin action for audit
    console.log(`[AUDIT] ${new Date().toISOString()} - Admin ${req.user.id} ${action}ed license request ${id} for user ${user_id}`);

    await connection.query(
      "UPDATE employer_licenses SET status = ?, admin_note = ?, reviewed_at = NOW(), reviewed_by = ? WHERE id = ?",
      [newStatus, admin_note || null, req.user.id, id]
    );

    if (action === "approve") {
      await connection.query("UPDATE employers SET is_verified = 1 WHERE id = ?", [employer_id]);
    }

    const title = action === "approve" ? "Business License Approved!" : "License Submission Rejected";
    const msg = action === "approve"
      ? "Your business license has been verified. A verified badge now appears on your job postings."
      : `Your license submission was rejected. ${admin_note || "Please resubmit with correct documentation."}`;

    await connection.query(
      `INSERT INTO notifications (user_id, type, title, message, is_read, created_at)
       VALUES (?, 'license_result', ?, ?, false, NOW())`,
      [user_id, title, msg]
    );

    await connection.commit();
    return res.status(200).json({ message: `License ${newStatus} successfully.` });
  } catch (error) {
    await connection.rollback();
    console.error(`[SECURITY] License review error by admin ${req.user?.id}:`, error.message);
    return res.status(500).json({ message: "Internal server error" });
  } finally {
    connection.release();
  }
};

// GET /api/admin/payments — get all payments with receipts
exports.getAllPayments = async (req, res) => {
  const { status, page = 1, limit = 20 } = req.query;
  const offset = (page - 1) * limit;
  let where = "WHERE 1=1";
  const params = [];

  if (status && status !== "all") { where += " AND p.status = ?"; params.push(status); }

  try {
    const [payments] = await db.query(
      `SELECT 
        p.id,
        p.transaction_id,
        p.amount,
        p.currency,
        p.method,
        p.status,
        j.title as job_title,
        j.id as job_id,
        emp.company_name,
        u_emp.name as employer_name,
        u_emp.email as employer_email
       FROM payments p
       LEFT JOIN jobs j ON p.job_id = j.id
       LEFT JOIN employers emp ON p.client_id = emp.id
       LEFT JOIN users u_emp ON emp.user_id = u_emp.id
       ${where}
       ORDER BY p.id DESC
       LIMIT ? OFFSET ?`,
      [...params, parseInt(limit), offset]
    );
    
    const [[{ total }]] = await db.query(
      `SELECT COUNT(*) AS total FROM payments p ${where}`,
      params
    );
    
    return res.status(200).json({ 
      payments, 
      pagination: { 
        total, 
        page: parseInt(page), 
        limit: parseInt(limit), 
        pages: Math.ceil(total / limit) 
      } 
    });
  } catch (error) {
    console.error("getAllPayments error:", error.message);
    return res.status(500).json({ message: error.message });
  }
};

// PATCH /api/admin/verification-requests/:id
exports.reviewVerificationRequest = async (req, res) => {
  const { id } = req.params;
  const { action, admin_note } = req.body; // action: 'approve' | 'reject'
  if (!["approve", "reject"].includes(action)) {
    return res.status(400).json({ message: "action must be 'approve' or 'reject'" });
  }
  const connection = await db.getConnection();
  try {
    await connection.beginTransaction();
    const [rows] = await connection.query("SELECT user_id FROM verification_requests WHERE id = ?", [id]);
    if (rows.length === 0) {
      await connection.rollback();
      return res.status(404).json({ message: "Request not found" });
    }
    const { user_id } = rows[0];
    const newStatus = action === "approve" ? "approved" : "rejected";

    await connection.query(
      "UPDATE verification_requests SET status = ?, admin_note = ?, updated_at = NOW() WHERE id = ?",
      [newStatus, admin_note || null, id]
    );

    if (action === "approve") {
      await connection.query("UPDATE users SET is_verified = 1 WHERE id = ?", [user_id]);
    }

    // Notify the talent
    const title = action === "approve" ? "Account Verified!" : "Verification Request Rejected";
    const msg = action === "approve"
      ? "Congratulations! Your account has been verified. You can now apply for jobs."
      : `Your verification request was rejected. ${admin_note || ""}`;

    await connection.query(
      `INSERT INTO notifications (user_id, type, title, message, is_read, created_at)
       VALUES (?, 'verification_result', ?, ?, false, NOW())`,
      [user_id, title, msg]
    );

    await connection.commit();
    return res.status(200).json({ message: `Request ${newStatus} successfully.` });
  } catch (error) {
    await connection.rollback();
    return res.status(500).json({ message: error.message });
  } finally {
    connection.release();
  }
};
