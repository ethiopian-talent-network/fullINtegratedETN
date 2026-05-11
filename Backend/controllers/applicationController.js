const db = require("../config/db");

// Get job details with token cost for application
exports.getJobApplicationDetails = async (req, res) => {
  try {
    const { jobId } = req.params;

    if (!req.user || !req.user.id) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const talentId = req.user.id;

    // Get job details
    const [job] = await db.query(
      `
      SELECT j.id, j.title, j.discription, j.salary, j.budget_type,
             j.experience_level, j.token_cost, j.status,
             e.company_name, e.location as company_location
      FROM jobs j
      JOIN employers e ON j.employer_id = e.id
      WHERE j.id = ?
    `,
      [jobId],
    );

    if (job.length === 0) {
      return res.status(404).json({ message: "Job not found or not active" });
    }

    // Check if already applied
    const [existingApplication] = await db.query(
      "SELECT id FROM applications WHERE job_id = ? AND talent_id = ?",
      [jobId, talentId],
    );

    // Get user's token balance
    const [tokenRows] = await db.query(
      "SELECT balance FROM tokens WHERE talent_id = ?",
      [talentId],
    );

    const tokenBalance = tokenRows.length > 0 ? tokenRows[0].balance : 0;
    const hasEnoughTokens = tokenBalance >= job[0].token_cost;
    const alreadyApplied = existingApplication.length > 0;

    res.json({
      job: job[0],
      userTokens: tokenBalance,
      hasEnoughTokens,
      alreadyApplied,
      canApply: hasEnoughTokens && !alreadyApplied,
    });
  } catch (error) {
    console.error("Error getting job application details:", error);
    res.status(500).json({
      message: "Error fetching job details",
      error: error.message,
    });
  }
};

// Submit job application with proposal
exports.submitApplication = async (req, res) => {
  try {
    const { jobId } = req.params;
    const { cover_letter, proposal, estimated_timeline, budget_proposal } =
      req.body;

    if (!req.user || !req.user.id) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const talentId = req.user.id;

    // Validate required fields
    if (!cover_letter || !cover_letter.trim()) {
      return res.status(400).json({ message: "Cover letter is required" });
    }

    // Get job details
    const [job] = await db.query(
      "SELECT id, title, token_cost FROM jobs WHERE id = ?",
      [jobId],
    );

    if (job.length === 0) {
      return res.status(404).json({ message: "Job not found or not active" });
    }

    const jobDetails = job[0];

    // Check if already applied
    const [existingApplication] = await db.query(
      "SELECT id FROM applications WHERE job_id = ? AND talent_id = ?",
      [jobId, talentId],
    );

    if (existingApplication.length > 0) {
      return res
        .status(400)
        .json({ message: "You have already applied for this job" });
    }

    // Check token balance and deduct tokens
    const connection = await db.getConnection();
    try {
      await connection.beginTransaction();

      // Get current token balance with lock
      const [tokenRows] = await connection.query(
        "SELECT balance FROM tokens WHERE talent_id = ? FOR UPDATE",
        [talentId],
      );

      if (
        tokenRows.length === 0 ||
        tokenRows[0].balance < jobDetails.token_cost
      ) {
        await connection.rollback();
        return res.status(400).json({
          message: `You need ${jobDetails.token_cost} tokens to apply for this job. Current balance: ${tokenRows.length > 0 ? tokenRows[0].balance : 0}`,
        });
      }

      // Deduct tokens
      const newBalance = tokenRows[0].balance - jobDetails.token_cost;
      await connection.query(
        "UPDATE tokens SET balance = ? WHERE talent_id = ?",
        [newBalance, talentId],
      );

      // Record token transaction
      await connection.query(
        "INSERT INTO token_transactions (talent_id, amount, type, reason) VALUES (?, ?, ?, ?)",
        [
          talentId,
          jobDetails.token_cost,
          "debit",
          `Applied for job: ${jobDetails.title}`,
        ],
      );

      // Create application
      const [applicationResult] = await connection.query(
        `INSERT INTO applications (job_id, talent_id, status)
         VALUES (?, ?, 'pending')`,
        [jobId, talentId],
      );

      // Create proposal record with cover letter and tokens_used
      if (cover_letter || proposal || jobDetails.token_cost) {
        await connection.query(
          `INSERT INTO proposals (application_id, cover_letter, proposal, tokens_used)
           VALUES (?, ?, ?, ?)`,
          [
            applicationResult.insertId,
            cover_letter || null,
            proposal || null,
            jobDetails.token_cost || 0,
          ],
        );
      }

      // Create notification for employer
      const [jobEmployer] = await connection.query(
        "SELECT j.employer_id, e.user_id FROM jobs j JOIN employers e ON j.employer_id = e.id WHERE j.id = ?",
        [jobId],
      );

      if (jobEmployer.length > 0) {
        const [talentUser] = await connection.query(
          "SELECT u.name FROM talents t JOIN users u ON t.user_id = u.id WHERE t.id = ?",
          [talentId],
        );

        await connection.query(
          `INSERT INTO notifications (user_id, type, title, message, sender_user_id)
           VALUES (?, 'new_application', ?, ?, ?)`,
          [
            jobEmployer[0].user_id,
            "New Job Application",
            `${talentUser[0]?.name || "A talent"} applied for "${jobDetails.title}"`,
            req.user.id,
          ],
        );
      }

      await connection.commit();

      res.status(201).json({
        message: "Application submitted successfully",
        applicationId: applicationResult.insertId,
        tokensUsed: jobDetails.token_cost,
        remainingTokens: newBalance,
      });
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  } catch (error) {
    console.error("Error submitting application:", error);
    res.status(500).json({
      message: "Error submitting application",
      error: error.message,
    });
  }
};

// Get user's applications
exports.getUserApplications = async (req, res) => {
  try {
    if (!req.user || !req.user.id) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const talentId = req.user.id;
    const { page = 1, limit = 10, status } = req.query;
    const offset = (page - 1) * limit;

    let whereClause = "WHERE a.talent_id = ?";
    const params = [talentId];

    if (status) {
      whereClause += " AND a.status = ?";
      params.push(status);
    }

    const [applications] = await db.query(
      `
      SELECT a.id, a.job_id, a.status, a.applied_at, a.updated_at,
             p.tokens_used, p.proposal,
             p.cover_letter,
             j.title as job_title, j.salary as job_salary, j.budget_type,
             e.company_name, e.location as company_location
      FROM applications a
      JOIN jobs j ON a.job_id = j.id
      JOIN employers e ON j.employer_id = e.id
      LEFT JOIN proposals p ON a.id = p.application_id
      ${whereClause}
      ORDER BY a.applied_at DESC
      LIMIT ? OFFSET ?
    `,
      [...params, parseInt(limit), offset],
    );

    // Get total count
    const [countResult] = await db.query(
      `
      SELECT COUNT(*) as total FROM applications a ${whereClause}
    `,
      params,
    );

    res.json({
      applications,
      pagination: {
        current: parseInt(page),
        pageSize: parseInt(limit),
        total: countResult[0].total,
        pages: Math.ceil(countResult[0].total / limit),
      },
    });
  } catch (error) {
    console.error("Error fetching user applications:", error);
    res.status(500).json({
      message: "Error fetching applications",
      error: error.message,
    });
  }
};

// Get application details
exports.getApplicationDetails = async (req, res) => {
  try {
    const { applicationId } = req.params;

    if (!req.user || !req.user.id) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const talentId = req.user.id;

    const [application] = await db.query(
      `
      SELECT a.id, a.status, a.applied_at, a.updated_at,
             p.tokens_used, p.proposal, p.cover_letter,
             j.title as job_title, j.discription as job_description,
             j.salary as job_salary, j.budget_type,
             e.company_name, e.location as company_location,
             u.name as talent_name, u.email as talent_email
      FROM applications a
      JOIN jobs j ON a.job_id = j.id
      JOIN employers e ON j.employer_id = e.id
      JOIN talents t ON a.talent_id = t.id
      JOIN users u ON t.user_id = u.id
      LEFT JOIN proposals p ON a.id = p.application_id
      WHERE a.id = ? AND a.talent_id = ?
    `,
      [applicationId, talentId],
    );

    if (application.length === 0) {
      return res.status(404).json({ message: "Application not found" });
    }

    res.json(application[0]);
  } catch (error) {
    console.error("Error fetching application details:", error);
    res.status(500).json({
      message: "Error fetching application details",
      error: error.message,
    });
  }
};

// Get applications grouped by status for employer dashboard
exports.getApplicationsByStatus = async (req, res) => {
  const { jobId } = req.params;
  const userId = req.user.id;
  try {
    // Get the employer ID from the employers table using the user ID
    const [employerRow] = await db.query(
      "SELECT id FROM employers WHERE user_id = ?",
      [userId],
    );

    if (employerRow.length === 0) {
      return res.status(404).json({ message: "Employer profile not found" });
    }

    const employerId = employerRow[0].id;

    // Get all applications for the job grouped by status
    const [applications] = await db.query(
      `SELECT a.id AS applicationID, a.status, a.applied_at,
              p.id AS proposal_id, p.cover_letter, p.proposal, p.tokens_used,
              u.name, u.email, u.profile_image,
              t.id AS talent_id,
              j.title as job_title
       FROM applications a
       LEFT JOIN talents t ON a.talent_id = t.id
       LEFT JOIN users u ON t.user_id = u.id
       JOIN jobs j ON a.job_id = j.id
       LEFT JOIN proposals p ON a.id = p.application_id
       WHERE a.job_id = ? AND j.employer_id = ?
       ORDER BY
         CASE a.status
           WHEN 'hired' THEN 1
           WHEN 'payment_pending' THEN 2
           WHEN 'shortlisted' THEN 3
           WHEN 'accepted' THEN 4
           WHEN 'pending' THEN 5
           ELSE 6
         END,
         a.applied_at DESC`,
      [jobId, employerId],
    );

    // Group applications by status
    const grouped = {
      hired: [],
      payment_pending: [],
      shortlisted: [],
      accepted: [],
      pending: [],
      rejected: [],
      withdrawn: [],
    };

    applications.forEach((app) => {
      if (grouped[app.status]) {
        grouped[app.status].push(app);
      }
    });

    return res.status(200).json({
      message: "Applications retrieved successfully",
      data: grouped,
      summary: {
        total: applications.length,
        hired: grouped.hired.length,
        payment_pending: grouped.payment_pending.length,
        shortlisted: grouped.shortlisted.length,
        accepted: grouped.accepted.length,
        pending: grouped.pending.length,
        rejected: grouped.rejected.length,
        withdrawn: grouped.withdrawn.length,
      },
    });
  } catch (error) {
    console.error("Error in getApplicationsByStatus:", error);
    return res.status(500).json({
      message: "An unexpected error occurred while retrieving applications.",
      error,
    });
  }
};

// Update application (for withdrawing or editing proposal)
exports.updateApplication = async (req, res) => {
  try {
    const { applicationId } = req.params;
    const { cover_letter, proposal, action } = req.body;

    if (!req.user || !req.user.id) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const talentId = req.user.id;

    // Check if application exists and belongs to user
    const [existingApplication] = await db.query(
      "SELECT * FROM applications WHERE id = ? AND talent_id = ?",
      [applicationId, talentId],
    );

    if (existingApplication.length === 0) {
      return res.status(404).json({ message: "Application not found" });
    }

    const application = existingApplication[0];

    // Can only update if status is pending
    if (application.status !== "pending") {
      return res.status(400).json({
        message:
          "Cannot update application. Current status: " + application.status,
      });
    }

    if (action === "withdraw") {
      // Withdraw application and refund tokens
      const connection = await db.getConnection();
      try {
        await connection.beginTransaction();

        // Update application status
        await connection.query(
          'UPDATE applications SET status = "withdrawn", updated_at = NOW() WHERE id = ?',
          [applicationId],
        );

        // Refund tokens
        await connection.query(
          "UPDATE tokens SET balance = balance + ? WHERE talent_id = ?",
          [application.tokens_used, talentId],
        );

        // Record refund transaction
        await connection.query(
          "INSERT INTO token_transactions (talent_id, amount, type, reason) VALUES (?, ?, ?, ?)",
          [
            talentId,
            application.tokens_used,
            "credit",
            "Application withdrawn",
          ],
        );

        await connection.commit();

        res.json({
          message: "Application withdrawn successfully",
          tokensRefunded: application.tokens_used,
        });
      } catch (error) {
        await connection.rollback();
        throw error;
      } finally {
        connection.release();
      }
    } else {
      // Update proposal details
      const appUpdateFields = [];
      const appUpdateValues = [];
      const proposalUpdateFields = [];
      const proposalUpdateValues = [];

      if (cover_letter !== undefined && cover_letter.trim()) {
        proposalUpdateFields.push("cover_letter = ?");
        proposalUpdateValues.push(cover_letter);
      }

      if (proposal !== undefined) {
        proposalUpdateFields.push("proposal = ?");
        proposalUpdateValues.push(proposal);
      }

      if (appUpdateFields.length === 0 && proposalUpdateFields.length === 0) {
        return res.status(400).json({ message: "No fields to update" });
      }

      const connection = await db.getConnection();
      try {
        await connection.beginTransaction();

        // Update applications table
        if (appUpdateFields.length > 0) {
          appUpdateFields.push("updated_at = NOW()");
          appUpdateValues.push(applicationId);
          await connection.query(
            `UPDATE applications SET ${appUpdateFields.join(", ")} WHERE id = ?`,
            appUpdateValues,
          );
        }

        // Update or insert into proposals table for cover_letter
        if (proposalUpdateFields.length > 0) {
          // Check if proposal exists
          const [existingProposal] = await connection.query(
            "SELECT id FROM proposals WHERE application_id = ?",
            [applicationId],
          );

          if (existingProposal.length > 0) {
            proposalUpdateFields.push("updated_at = NOW()");
            proposalUpdateValues.push(existingProposal[0].id);
            await connection.query(
              `UPDATE proposals SET ${proposalUpdateFields.join(", ")} WHERE id = ?`,
              proposalUpdateValues,
            );
          } else {
            // Insert new proposal record
            await connection.query(
              `INSERT INTO proposals (application_id, cover_letter, proposal) VALUES (?, ?, ?)`,
              [applicationId, cover_letter || null, proposal || null],
            );
          }
        }

        await connection.commit();
        res.json({ message: "Application updated successfully" });
      } catch (error) {
        await connection.rollback();
        throw error;
      } finally {
        connection.release();
      }
    }
  } catch (error) {
    console.error("Error updating application:", error);
    res.status(500).json({
      message: "Error updating application",
      error: error.message,
    });
  }
};
