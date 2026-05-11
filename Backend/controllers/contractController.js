const db = require("../config/db");

// POST /api/contracts - Create new contract (employer)
exports.createContract = async (req, res) => {
  const {
    job_id, application_id, talent_id, title, description,
    scope_of_work, total_amount, currency, start_date, end_date,
    payment_terms, terms_and_conditions, milestones
  } = req.body;

  const employer_id = req.user.id;

  if (!job_id || !talent_id || !title || !scope_of_work || !total_amount) {
    return res.status(400).json({ message: "Missing required fields" });
  }

  const connection = await db.getConnection();
  try {
    await connection.beginTransaction();

    // Create contract
    const [result] = await connection.query(
      `INSERT INTO contracts (
        job_id, application_id, employer_id, talent_id, title, description,
        scope_of_work, total_amount, currency, start_date, end_date,
        payment_terms, terms_and_conditions, created_by, status
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'draft')`,
      [job_id, application_id, employer_id, talent_id, title, description,
       scope_of_work, total_amount, currency || 'ETB', start_date, end_date,
       payment_terms, terms_and_conditions, employer_id]
    );

    const contract_id = result.insertId;

    // Create milestones if provided
    if (milestones && Array.isArray(milestones) && milestones.length > 0) {
      for (let i = 0; i < milestones.length; i++) {
        const m = milestones[i];
        await connection.query(
          `INSERT INTO contract_milestones (
            contract_id, title, description, amount, due_date, order_index
          ) VALUES (?, ?, ?, ?, ?, ?)`,
          [contract_id, m.title, m.description, m.amount, m.due_date, i]
        );
      }
    }

    await connection.commit();
    return res.status(201).json({
      message: "Contract created successfully",
      contract_id
    });
  } catch (error) {
    await connection.rollback();
    return res.status(500).json({ message: error.message });
  } finally {
    connection.release();
  }
};

// GET /api/contracts - Get all contracts for user
exports.getContracts = async (req, res) => {
  const user_id = req.user.id;
  const { status, page = 1, limit = 20 } = req.query;
  const offset = (page - 1) * limit;

  let where = "WHERE (c.employer_id = ? OR c.talent_id = ?)";
  const params = [user_id, user_id];

  if (status && status !== "all") {
    where += " AND c.status = ?";
    params.push(status);
  }

  try {
    const [contracts] = await db.query(
      `SELECT 
        c.*,
        j.title AS job_title,
        ue.name AS employer_name, ue.email AS employer_email,
        emp.company_name,
        ut.name AS talent_name, ut.email AS talent_email,
        (SELECT COUNT(*) FROM contract_milestones WHERE contract_id = c.id) AS milestone_count,
        (SELECT COUNT(*) FROM contract_milestones WHERE contract_id = c.id AND status IN ('approved','paid')) AS milestones_completed,
        (SELECT COUNT(*) FROM contract_signatures WHERE contract_id = c.id) AS signature_count
      FROM contracts c
      LEFT JOIN jobs j ON c.job_id = j.id
      LEFT JOIN users ue ON c.employer_id = ue.id
      LEFT JOIN employers emp ON ue.id = emp.user_id
      LEFT JOIN users ut ON c.talent_id = ut.id
      ${where}
      ORDER BY c.created_at DESC
      LIMIT ? OFFSET ?`,
      [...params, parseInt(limit), offset]
    );

    const [[{ total }]] = await db.query(
      `SELECT COUNT(*) AS total FROM contracts c ${where}`,
      params
    );

    return res.status(200).json({
      contracts,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

// GET /api/contracts/:id - Get contract details
exports.getContractById = async (req, res) => {
  const { id } = req.params;
  const user_id = req.user.id;

  try {
    const [contracts] = await db.query(
      `SELECT 
        c.*,
        j.title AS job_title, j.description AS job_description,
        ue.name AS employer_name, ue.email AS employer_email,
        emp.company_name,
        ut.name AS talent_name, ut.email AS talent_email
      FROM contracts c
      LEFT JOIN jobs j ON c.job_id = j.id
      LEFT JOIN users ue ON c.employer_id = ue.id
      LEFT JOIN employers emp ON ue.id = emp.user_id
      LEFT JOIN users ut ON c.talent_id = ut.id
      WHERE c.id = ? AND (c.employer_id = ? OR c.talent_id = ?)`,
      [id, user_id, user_id]
    );

    if (contracts.length === 0) {
      return res.status(404).json({ message: "Contract not found" });
    }

    // Get milestones
    const [milestones] = await db.query(
      `SELECT * FROM contract_milestones WHERE contract_id = ? ORDER BY order_index`,
      [id]
    );

    // Get signatures
    const [signatures] = await db.query(
      `SELECT cs.*, u.name, u.email 
       FROM contract_signatures cs
       JOIN users u ON cs.user_id = u.id
       WHERE cs.contract_id = ?`,
      [id]
    );

    // Get revisions
    const [revisions] = await db.query(
      `SELECT cr.*, u.name AS revised_by_name
       FROM contract_revisions cr
       JOIN users u ON cr.revised_by = u.id
       WHERE cr.contract_id = ?
       ORDER BY cr.created_at DESC`,
      [id]
    );

    return res.status(200).json({
      contract: contracts[0],
      milestones,
      signatures,
      revisions
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

// POST /api/contracts/:id/send - Send contract to talent
exports.sendContract = async (req, res) => {
  const { id } = req.params;
  const user_id = req.user.id;

  try {
    const [contracts] = await db.query(
      "SELECT * FROM contracts WHERE id = ? AND employer_id = ?",
      [id, user_id]
    );

    if (contracts.length === 0) {
      return res.status(404).json({ message: "Contract not found" });
    }

    if (contracts[0].status !== "draft") {
      return res.status(400).json({ message: "Contract already sent" });
    }

    await db.query(
      "UPDATE contracts SET status = 'sent', sent_at = NOW() WHERE id = ?",
      [id]
    );

    // TODO: Send notification to talent

    return res.status(200).json({ message: "Contract sent to talent successfully" });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

// POST /api/contracts/:id/sign - Sign contract
exports.signContract = async (req, res) => {
  const { id } = req.params;
  const user_id = req.user.id;
  const { signature_data } = req.body;

  const connection = await db.getConnection();
  try {
    await connection.beginTransaction();

    const [contracts] = await connection.query(
      "SELECT * FROM contracts WHERE id = ? AND (employer_id = ? OR talent_id = ?) FOR UPDATE",
      [id, user_id, user_id]
    );

    if (contracts.length === 0) {
      await connection.rollback();
      return res.status(404).json({ message: "Contract not found" });
    }

    const contract = contracts[0];

    if (!["sent", "negotiating"].includes(contract.status)) {
      await connection.rollback();
      return res.status(400).json({ message: "Contract cannot be signed in current status" });
    }

    // Determine role
    const role = contract.employer_id === user_id ? "employer" : "talent";

    // Check if already signed
    const [existing] = await connection.query(
      "SELECT * FROM contract_signatures WHERE contract_id = ? AND user_id = ?",
      [id, user_id]
    );

    if (existing.length > 0) {
      await connection.rollback();
      return res.status(400).json({ message: "You have already signed this contract" });
    }

    // Create signature
    await connection.query(
      `INSERT INTO contract_signatures (contract_id, user_id, role, ip_address, user_agent, signature_data)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [id, user_id, role, req.ip, req.headers['user-agent'], signature_data]
    );

    // Check if both parties signed
    const [allSignatures] = await connection.query(
      "SELECT COUNT(*) AS count FROM contract_signatures WHERE contract_id = ?",
      [id]
    );

    if (allSignatures[0].count === 2) {
      // Both signed - activate contract
      await connection.query(
        "UPDATE contracts SET status = 'signed', signed_at = NOW() WHERE id = ?",
        [id]
      );
    }

    await connection.commit();
    return res.status(200).json({ 
      message: "Contract signed successfully",
      both_signed: allSignatures[0].count === 2
    });
  } catch (error) {
    await connection.rollback();
    return res.status(500).json({ message: error.message });
  } finally {
    connection.release();
  }
};

// POST /api/contracts/:id/request-changes - Request changes (talent)
exports.requestChanges = async (req, res) => {
  const { id } = req.params;
  const user_id = req.user.id;
  const { revision_notes, changes } = req.body;

  const connection = await db.getConnection();
  try {
    await connection.beginTransaction();

    const [contracts] = await connection.query(
      "SELECT * FROM contracts WHERE id = ? AND talent_id = ?",
      [id, user_id]
    );

    if (contracts.length === 0) {
      await connection.rollback();
      return res.status(404).json({ message: "Contract not found" });
    }

    if (contracts[0].status !== "sent") {
      await connection.rollback();
      return res.status(400).json({ message: "Cannot request changes for this contract" });
    }

    // Create revision
    await connection.query(
      `INSERT INTO contract_revisions (contract_id, revised_by, revision_notes, changes)
       VALUES (?, ?, ?, ?)`,
      [id, user_id, revision_notes, JSON.stringify(changes)]
    );

    // Update contract status
    await connection.query(
      "UPDATE contracts SET status = 'negotiating' WHERE id = ?",
      [id]
    );

    await connection.commit();
    return res.status(200).json({ message: "Change request sent successfully" });
  } catch (error) {
    await connection.rollback();
    return res.status(500).json({ message: error.message });
  } finally {
    connection.release();
  }
};

// PUT /api/contracts/:id - Update contract (during negotiation)
exports.updateContract = async (req, res) => {
  const { id } = req.params;
  const user_id = req.user.id;
  const {
    title, description, scope_of_work, total_amount,
    start_date, end_date, payment_terms, terms_and_conditions
  } = req.body;

  try {
    const [contracts] = await db.query(
      "SELECT * FROM contracts WHERE id = ? AND employer_id = ?",
      [id, user_id]
    );

    if (contracts.length === 0) {
      return res.status(404).json({ message: "Contract not found" });
    }

    if (!["draft", "negotiating"].includes(contracts[0].status)) {
      return res.status(400).json({ message: "Cannot update contract in current status" });
    }

    await db.query(
      `UPDATE contracts SET
        title = COALESCE(?, title),
        description = COALESCE(?, description),
        scope_of_work = COALESCE(?, scope_of_work),
        total_amount = COALESCE(?, total_amount),
        start_date = COALESCE(?, start_date),
        end_date = COALESCE(?, end_date),
        payment_terms = COALESCE(?, payment_terms),
        terms_and_conditions = COALESCE(?, terms_and_conditions),
        status = 'sent'
      WHERE id = ?`,
      [title, description, scope_of_work, total_amount, start_date, end_date,
       payment_terms, terms_and_conditions, id]
    );

    return res.status(200).json({ message: "Contract updated successfully" });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

// POST /api/contracts/:id/activate - Activate signed contract (create payment)
exports.activateContract = async (req, res) => {
  const { id } = req.params;
  const user_id = req.user.id;

  try {
    const [contracts] = await db.query(
      "SELECT * FROM contracts WHERE id = ? AND employer_id = ?",
      [id, user_id]
    );

    if (contracts.length === 0) {
      return res.status(404).json({ message: "Contract not found" });
    }

    if (contracts[0].status !== "signed") {
      return res.status(400).json({ message: "Contract must be signed by both parties first" });
    }

    await db.query(
      "UPDATE contracts SET status = 'active', activated_at = NOW() WHERE id = ?",
      [id]
    );

    return res.status(200).json({ 
      message: "Contract activated. Proceed to payment.",
      contract_id: id,
      amount: contracts[0].total_amount
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

// POST /api/contracts/:id/cancel - Cancel contract
exports.cancelContract = async (req, res) => {
  const { id } = req.params;
  const user_id = req.user.id;
  const { reason } = req.body;

  try {
    const [contracts] = await db.query(
      "SELECT * FROM contracts WHERE id = ? AND (employer_id = ? OR talent_id = ?)",
      [id, user_id, user_id]
    );

    if (contracts.length === 0) {
      return res.status(404).json({ message: "Contract not found" });
    }

    if (["completed", "cancelled"].includes(contracts[0].status)) {
      return res.status(400).json({ message: "Contract already finalized" });
    }

    await db.query(
      "UPDATE contracts SET status = 'cancelled' WHERE id = ?",
      [id]
    );

    return res.status(200).json({ message: "Contract cancelled successfully" });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

module.exports = exports;
