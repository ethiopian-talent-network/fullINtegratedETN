const db = require("../config/db");

// GET /api/contracts/:contractId/milestones - Get all milestones for a contract
exports.getMilestones = async (req, res) => {
  const { contractId } = req.params;
  const user_id = req.user.id;

  try {
    // Verify user has access to this contract
    const [contracts] = await db.query(
      "SELECT * FROM contracts WHERE id = ? AND (employer_id = ? OR talent_id = ?)",
      [contractId, user_id, user_id]
    );

    if (contracts.length === 0) {
      return res.status(404).json({ message: "Contract not found" });
    }

    const [milestones] = await db.query(
      "SELECT * FROM contract_milestones WHERE contract_id = ? ORDER BY order_index",
      [contractId]
    );

    return res.status(200).json({ milestones });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

// POST /api/contracts/:contractId/milestones - Add milestone
exports.addMilestone = async (req, res) => {
  const { contractId } = req.params;
  const user_id = req.user.id;
  const { title, description, amount, due_date } = req.body;

  if (!title || !amount) {
    return res.status(400).json({ message: "Title and amount are required" });
  }

  try {
    // Verify employer owns this contract
    const [contracts] = await db.query(
      "SELECT * FROM contracts WHERE id = ? AND employer_id = ?",
      [contractId, user_id]
    );

    if (contracts.length === 0) {
      return res.status(404).json({ message: "Contract not found" });
    }

    if (!["draft", "negotiating"].includes(contracts[0].status)) {
      return res.status(400).json({ message: "Cannot add milestones to this contract" });
    }

    // Get next order index
    const [[{ max_order }]] = await db.query(
      "SELECT COALESCE(MAX(order_index), -1) AS max_order FROM contract_milestones WHERE contract_id = ?",
      [contractId]
    );

    await db.query(
      `INSERT INTO contract_milestones (contract_id, title, description, amount, due_date, order_index)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [contractId, title, description, amount, due_date, max_order + 1]
    );

    return res.status(201).json({ message: "Milestone added successfully" });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

// PUT /api/milestones/:id - Update milestone
exports.updateMilestone = async (req, res) => {
  const { id } = req.params;
  const user_id = req.user.id;
  const { title, description, amount, due_date } = req.body;

  try {
    // Verify employer owns this milestone's contract
    const [milestones] = await db.query(
      `SELECT m.*, c.employer_id, c.status 
       FROM contract_milestones m
       JOIN contracts c ON m.contract_id = c.id
       WHERE m.id = ? AND c.employer_id = ?`,
      [id, user_id]
    );

    if (milestones.length === 0) {
      return res.status(404).json({ message: "Milestone not found" });
    }

    if (!["draft", "negotiating"].includes(milestones[0].status)) {
      return res.status(400).json({ message: "Cannot update milestone in current contract status" });
    }

    await db.query(
      `UPDATE contract_milestones SET
        title = COALESCE(?, title),
        description = COALESCE(?, description),
        amount = COALESCE(?, amount),
        due_date = COALESCE(?, due_date)
      WHERE id = ?`,
      [title, description, amount, due_date, id]
    );

    return res.status(200).json({ message: "Milestone updated successfully" });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

// DELETE /api/milestones/:id - Delete milestone
exports.deleteMilestone = async (req, res) => {
  const { id } = req.params;
  const user_id = req.user.id;

  try {
    // Verify employer owns this milestone's contract
    const [milestones] = await db.query(
      `SELECT m.*, c.employer_id, c.status 
       FROM contract_milestones m
       JOIN contracts c ON m.contract_id = c.id
       WHERE m.id = ? AND c.employer_id = ?`,
      [id, user_id]
    );

    if (milestones.length === 0) {
      return res.status(404).json({ message: "Milestone not found" });
    }

    if (!["draft", "negotiating"].includes(milestones[0].status)) {
      return res.status(400).json({ message: "Cannot delete milestone in current contract status" });
    }

    await db.query("DELETE FROM contract_milestones WHERE id = ?", [id]);

    return res.status(200).json({ message: "Milestone deleted successfully" });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

// POST /api/milestones/:id/submit - Talent submits milestone
exports.submitMilestone = async (req, res) => {
  const { id } = req.params;
  const user_id = req.user.id;
  const { submission_notes } = req.body;

  try {
    // Verify talent owns this milestone's contract
    const [milestones] = await db.query(
      `SELECT m.*, c.talent_id, c.status AS contract_status
       FROM contract_milestones m
       JOIN contracts c ON m.contract_id = c.id
       WHERE m.id = ? AND c.talent_id = ?`,
      [id, user_id]
    );

    if (milestones.length === 0) {
      return res.status(404).json({ message: "Milestone not found" });
    }

    if (milestones[0].contract_status !== "active") {
      return res.status(400).json({ message: "Contract must be active to submit milestones" });
    }

    if (!["pending", "in_progress", "rejected"].includes(milestones[0].status)) {
      return res.status(400).json({ message: "Milestone cannot be submitted in current status" });
    }

    await db.query(
      `UPDATE contract_milestones SET
        status = 'submitted',
        submission_notes = ?,
        submitted_at = NOW()
      WHERE id = ?`,
      [submission_notes, id]
    );

    // TODO: Send notification to employer

    return res.status(200).json({ message: "Milestone submitted for review" });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

// POST /api/milestones/:id/approve - Employer approves milestone
exports.approveMilestone = async (req, res) => {
  const { id } = req.params;
  const user_id = req.user.id;
  const { review_notes } = req.body;

  try {
    // Verify employer owns this milestone's contract
    const [milestones] = await db.query(
      `SELECT m.*, c.employer_id
       FROM contract_milestones m
       JOIN contracts c ON m.contract_id = c.id
       WHERE m.id = ? AND c.employer_id = ?`,
      [id, user_id]
    );

    if (milestones.length === 0) {
      return res.status(404).json({ message: "Milestone not found" });
    }

    if (milestones[0].status !== "submitted") {
      return res.status(400).json({ message: "Only submitted milestones can be approved" });
    }

    await db.query(
      `UPDATE contract_milestones SET
        status = 'approved',
        review_notes = ?,
        approved_at = NOW()
      WHERE id = ?`,
      [review_notes, id]
    );

    // TODO: Trigger payment release process

    return res.status(200).json({ 
      message: "Milestone approved. Payment will be released.",
      milestone_id: id
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

// POST /api/milestones/:id/reject - Employer rejects milestone
exports.rejectMilestone = async (req, res) => {
  const { id } = req.params;
  const user_id = req.user.id;
  const { review_notes } = req.body;

  if (!review_notes) {
    return res.status(400).json({ message: "Review notes are required for rejection" });
  }

  try {
    // Verify employer owns this milestone's contract
    const [milestones] = await db.query(
      `SELECT m.*, c.employer_id
       FROM contract_milestones m
       JOIN contracts c ON m.contract_id = c.id
       WHERE m.id = ? AND c.employer_id = ?`,
      [id, user_id]
    );

    if (milestones.length === 0) {
      return res.status(404).json({ message: "Milestone not found" });
    }

    if (milestones[0].status !== "submitted") {
      return res.status(400).json({ message: "Only submitted milestones can be rejected" });
    }

    await db.query(
      `UPDATE contract_milestones SET
        status = 'rejected',
        review_notes = ?
      WHERE id = ?`,
      [review_notes, id]
    );

    // TODO: Send notification to talent

    return res.status(200).json({ message: "Milestone rejected. Talent can resubmit." });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

module.exports = exports;
