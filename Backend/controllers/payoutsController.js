const db = require("../config/db");

// GET /api/owner/payouts/talents — get all talents with billing info
exports.getTalentsForPayouts = async (req, res) => {
  const { page = 1, limit = 20, search } = req.query;
  const offset = (page - 1) * limit;

  try {
    let whereClause = "WHERE 1=1";
    const params = [];

    if (search) {
      whereClause += " AND (u.name LIKE ? OR u.email LIKE ?)";
      const searchTerm = `%${search}%`;
      params.push(searchTerm, searchTerm);
    }

    // Get total count
    const [countResult] = await db.query(
      `SELECT COUNT(DISTINCT t.id) as total FROM talents t
       JOIN users u ON t.user_id = u.id
       ${whereClause}`,
      params
    );

    const total = countResult[0].total;

    // Get talents with payout info
    const [talents] = await db.query(
      `SELECT 
        t.id as talent_id,
        u.id as user_id,
        u.name,
        u.email,
        u.profile_image,
        t.Location,
        t.HourlyRate,
        t.about,
        t.skills,
        COUNT(DISTINCT p.id) as total_payouts,
        SUM(CASE WHEN p.status = 'paid' THEN p.amount ELSE 0 END) as total_paid_out,
        SUM(CASE WHEN p.status = 'pending' THEN p.amount ELSE 0 END) as pending_amount
       FROM talents t
       JOIN users u ON t.user_id = u.id
       LEFT JOIN payouts p ON t.id = p.talent_id
       ${whereClause}
       GROUP BY t.id, u.id
       ORDER BY total_paid_out DESC
       LIMIT ? OFFSET ?`,
      [...params, parseInt(limit), offset]
    );

    return res.status(200).json({
      message: "Talents retrieved successfully",
      talents,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Error fetching talents for payouts:", error);
    return res.status(500).json({ message: error.message });
  }
};

// GET /api/owner/payouts/talent/:talent_id/billing — get talent billing info
exports.getTalentBillingInfo = async (req, res) => {
  const { talent_id } = req.params;

  try {
    const [talent] = await db.query(
      `SELECT 
        t.id,
        u.id as user_id,
        u.name,
        u.email,
        u.profile_image,
        t.Location,
        t.HourlyRate,
        t.about,
        t.skills,
        t.education,
        t.experience,
        t.languages,
        t.linkedin,
        t.github,
        t.resume_url,
        COUNT(DISTINCT p.id) as total_payouts,
        SUM(CASE WHEN p.status = 'paid' THEN p.amount ELSE 0 END) as total_paid_out,
        SUM(CASE WHEN p.status = 'pending' THEN p.amount ELSE 0 END) as pending_amount
       FROM talents t
       JOIN users u ON t.user_id = u.id
       LEFT JOIN payouts p ON t.id = p.talent_id
       WHERE t.id = ?
       GROUP BY t.id, u.id`,
      [talent_id]
    );

    if (talent.length === 0) {
      return res.status(404).json({ message: "Talent not found" });
    }

    return res.status(200).json({
      message: "Talent billing info retrieved successfully",
      talent: talent[0],
    });
  } catch (error) {
    console.error("Error fetching talent billing info:", error);
    return res.status(500).json({ message: error.message });
  }
};

// GET /api/owner/payouts — get all payouts
exports.getAllPayouts = async (req, res) => {
  const { status = "pending", page = 1, limit = 20, search } = req.query;
  const offset = (page - 1) * limit;

  try {
    let whereClause = "WHERE 1=1";
    const params = [];

    if (status !== "all") {
      whereClause += " AND p.status = ?";
      params.push(status);
    }

    if (search) {
      whereClause += " AND (u.name LIKE ? OR u.email LIKE ? OR p.payout_ref LIKE ?)";
      const searchTerm = `%${search}%`;
      params.push(searchTerm, searchTerm, searchTerm);
    }

    // Get total count
    const [countResult] = await db.query(
      `SELECT COUNT(*) as total FROM payouts p
       JOIN talents t ON p.talent_id = t.id
       JOIN users u ON t.user_id = u.id
       ${whereClause}`,
      params
    );

    const total = countResult[0].total;

    // Get paginated payouts
    const [payouts] = await db.query(
      `SELECT 
        p.id,
        p.talent_id,
        p.amount,
        p.status,
        p.escrow_status,
        p.employer_approval_status,
        p.payout_ref,
        p.created_at,
        p.released_at,
        u.name as talent_name,
        u.email as talent_email,
        u.profile_image as talent_image
       FROM payouts p
       JOIN talents t ON p.talent_id = t.id
       JOIN users u ON t.user_id = u.id
       ${whereClause}
       ORDER BY p.created_at DESC
       LIMIT ? OFFSET ?`,
      [...params, parseInt(limit), offset]
    );

    return res.status(200).json({
      message: "Payouts retrieved successfully",
      payouts,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Error fetching payouts:", error);
    return res.status(500).json({ message: error.message });
  }
};

// GET /api/owner/payouts/summary — get payout summary
exports.getPayoutSummary = async (req, res) => {
  try {
    const [summary] = await db.query(
      `SELECT 
        COUNT(*) as total_payouts,
        SUM(CASE WHEN status = 'paid' THEN 1 ELSE 0 END) as paid_count,
        SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) as pending_count,
        SUM(CASE WHEN status = 'failed' THEN 1 ELSE 0 END) as failed_count,
        SUM(CASE WHEN escrow_status = 'held' THEN 1 ELSE 0 END) as held_in_escrow_count,
        SUM(CASE WHEN employer_approval_status = 'pending' THEN 1 ELSE 0 END) as awaiting_approval_count,
        SUM(amount) as total_amount,
        SUM(CASE WHEN status = 'paid' THEN amount ELSE 0 END) as paid_amount,
        SUM(CASE WHEN status = 'pending' AND escrow_status = 'held' THEN amount ELSE 0 END) as held_in_escrow_amount
       FROM payouts`
    );

    return res.status(200).json({
      message: "Payout summary retrieved successfully",
      summary: summary[0] || {
        total_payouts: 0,
        paid_count: 0,
        pending_count: 0,
        failed_count: 0,
        held_in_escrow_count: 0,
        awaiting_approval_count: 0,
        total_amount: 0,
        paid_amount: 0,
        held_in_escrow_amount: 0,
      },
    });
  } catch (error) {
    console.error("Error fetching payout summary:", error);
    return res.status(500).json({ message: error.message });
  }
};
