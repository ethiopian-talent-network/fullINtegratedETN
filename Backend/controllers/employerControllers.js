const db = require("../config/db")
const cloudinary = require("../config/cloudImage");
const fs = require("fs");
const path = require("path");

exports.employerDashboard = async (req, res) => {
  const { company_name, company_discription, website, location, username } =
    req.body;

  if (!company_name || !company_discription || !location || !username) {
    return res.status(400).json({ message: "please fill required fields" });
  }
  if (!req.user || !req.user.id) {
    return res.status(401).send({ message: "Unauthorized" });
  }
  try {
    const [rows] = await db.query(
      "SELECT * FROM employers WHERE username = ?",
      [username],
    );
    if (rows.length > 0) {
      return res.status(400).send({ message: "username already exists" });
    }

    const [exstingEmployer] = await db.query(
      "SELECT * FROM employers where user_id = ?",
      [req.user.id],
    );
    if (exstingEmployer.length > 0) {
      return res
        .status(400)
        .json({ message: "employer profile already exist" });
    }

    const values = {
      company_name,
      company_discription,
      website,
      location,
      username,
      user_id: req.user.id,
    };
    const [result] = await db.query("INSERT INTO employers SET ?", [values]);

    if (result.affectedRows > 0) {
      return res
        .status(200)
        .send({ message: "Employer registered successfully" });
    } else {
      return res.status(500).send({ message: "Failed to register employer" });
    }
  } catch (error) {
    if (error.code === "ER_DUP_ENTRY") {
      return res.status(400).send({ message: "Username already exists" });
    }

    if (error.code === "ER_NO_REFERENCED_ROW_2") {
      return res.status(400).send({ message: "User not found" });
    }

    console.error(error);
    return res.status(500).send({
      message: "An unexpected error occurred while saving your profile.",
      error,
    });
  }
};

exports.employerProfile = async (req, res) => {
  const sql =
    "SELECT u.name, u.email, u.profile_image, e.id, e.company_name, e.company_discription, e.website, e.location, e.username, e.profile_url, e.is_verified FROM employers e JOIN users u ON e.user_id = u.id WHERE e.user_id = ?";
  try {
    const [rows] = await db.query(sql, [req.user.id]);

    if (rows.length === 0) {
      // Return user info even if employer profile not set up yet
      const [userRows] = await db.query(
        "SELECT name, email, profile_image FROM users WHERE id = ?",
        [req.user.id],
      );
      return res.status(200).send({
        message: "Employer profile not set up",
        data: userRows[0] || null,
        incomplete: true,
      });
    }

    return res.status(200).send({ message: "Employer profile", data: rows[0] });
  } catch (error) {
    return res.status(500).send({
      message: "An unexpected error occurred while fetching your profile.",
      error,
    });
  }
};

exports.updateEmployerProfile = async (req, res) => {
  const { company_name, company_discription, website, location, username } = req.body;
  const user_id = req.user.id;

  try {
    const [existing] = await db.query(
      "SELECT id FROM employers WHERE user_id = ?",
      [user_id],
    );

    if (existing.length === 0) {
      return res.status(404).json({ message: "Employer profile not found. Please complete initial setup first." });
    }

    // Check username uniqueness if changing
    if (username) {
      const [taken] = await db.query(
        "SELECT id FROM employers WHERE username = ? AND user_id != ?",
        [username, user_id],
      );
      if (taken.length > 0) {
        return res.status(400).json({ message: "Username already taken" });
      }
    }

    const fields = [];
    const values = [];
    if (company_name !== undefined) { fields.push("company_name = ?"); values.push(company_name); }
    if (company_discription !== undefined) { fields.push("company_discription = ?"); values.push(company_discription); }
    if (website !== undefined) { fields.push("website = ?"); values.push(website); }
    if (location !== undefined) { fields.push("location = ?"); values.push(location); }
    if (username !== undefined) { fields.push("username = ?"); values.push(username); }

    if (fields.length === 0) {
      return res.status(400).json({ message: "No fields to update" });
    }

    values.push(user_id);
    await db.query(`UPDATE employers SET ${fields.join(", ")} WHERE user_id = ?`, values);

    const [updated] = await db.query(
      "SELECT u.name, u.email, u.profile_image, e.id, e.company_name, e.company_discription, e.website, e.location, e.username, e.profile_url FROM employers e JOIN users u ON e.user_id = u.id WHERE e.user_id = ?",
      [user_id],
    );

    return res.status(200).json({ message: "Profile updated successfully", data: updated[0] });
  } catch (error) {
    if (error.code === "ER_DUP_ENTRY") {
      return res.status(400).json({ message: "Username already taken" });
    }
    return res.status(500).json({
      message: "An unexpected error occurred while updating your profile.",
      error: error.message,
    });
  }
};

exports.uploadEmployerImage = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "No image file provided" });
    }

    const [employer] = await db.query(
      "SELECT id FROM employers WHERE user_id = ?",
      [req.user.id],
    );

    if (employer.length === 0) {
      return res.status(404).json({ message: "Employer profile not found" });
    }

    let uploadPath = req.file.path;
    const originalName = req.file.originalname || "";
    const isHeic = /\.(heic|heif)$/i.test(originalName) ||
      req.file.mimetype === "image/heic" ||
      req.file.mimetype === "image/heif";

    // Convert HEIC/HEIF to JPEG before uploading
    if (isHeic) {
      try {
        const heicConvert = require("heic-convert");
        const inputBuffer = fs.readFileSync(uploadPath);
        const outputBuffer = await heicConvert({
          buffer: inputBuffer,
          format: "JPEG",
          quality: 0.92,
        });
        const convertedPath = uploadPath + ".jpg";
        fs.writeFileSync(convertedPath, outputBuffer);
        fs.unlinkSync(uploadPath);
        uploadPath = convertedPath;
      } catch (convErr) {
        console.error("HEIC conversion error:", convErr);
        fs.unlink(uploadPath, () => {});
        return res.status(400).json({ message: "Failed to process HEIC image" });
      }
    }

    const result = await cloudinary.uploader.upload(uploadPath, {
      folder: "employers/profiles",
      public_id: `employer_${employer[0].id}_${Date.now()}`,
      transformation: [{ width: 400, height: 400, crop: "fill", gravity: "face" }],
    });

    fs.unlink(uploadPath, (err) => {
      if (err) console.error("Error deleting local file:", err);
    });

    await db.query(
      "UPDATE employers SET profile_url = ? WHERE user_id = ?",
      [result.secure_url, req.user.id],
    );

    return res.status(200).json({
      message: "Profile image uploaded successfully",
      imageUrl: result.secure_url,
    });
  } catch (error) {
    console.error("Error uploading employer image:", error);
    return res.status(500).json({
      message: "Failed to upload image",
      error: error.message,
    });
  }
};

exports.categories = async (req, res) => {
  try {
    const sql = "select * from categories";

    const [rows] = await db.query(sql);

    return res.status(200).json({ message: "Categories", data: rows });
  } catch (error) {
    return res.status(500).json({
      message: "An unexpected error occurred while fetching categories.",
      error,
    });
  }
};

exports.postJobs = async (req, res) => {
  const connection = await db.getConnection();
  try {
    const {
      title,
      discription,
      salary,
      budget_type,
      experience_level,
      status,
      category_id,
      token_cost,
      skill_names,
    } = req.body;

    const user = req.user.id;

    if (!title || !discription || !salary || !skill_names) {
      return res
        .status(400)
        .send({ message: "Required fields (including skills) are missing" });
    }

    await connection.beginTransaction();

    const [employerRow] = await connection.query(
      "SELECT id, is_verified FROM employers WHERE user_id = ?",
      [user],
    );

    if (employerRow.length === 0) {
      await connection.rollback();
      return res.status(404).send({ message: "Employer profile not found" });
    }

    // Check if employer is verified
    if (!employerRow[0].is_verified) {
      await connection.rollback();
      return res.status(403).json({ 
        message: "Business license verification required. Please submit your business license for verification before posting jobs.",
        requiresLicense: true
      });
    }

    const employer_id = employerRow[0].id;

    const [jobResult] = await connection.query(
      "INSERT INTO jobs (title, discription, salary, budget_type, experience_level, status, category_id, employer_id, token_cost) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)",
      [
        title,
        discription,
        salary,
        budget_type,
        experience_level,
        status,
        category_id,
        employer_id,
        token_cost,
      ],
    );

    const job_id = jobResult.insertId;

    for (const name of skill_names) {
      if (!name) continue;
      let [skillRows] = await connection.query(
        "SELECT id FROM skills WHERE skill_name = ?",
        [name],
      );
      let skillId;

      if (skillRows.length > 0) {
        skillId = skillRows[0].id;
      } else {
        const [newSkill] = await connection.query(
          "INSERT INTO skills (skill_name) VALUES (?)",
          [name],
        );
        skillId = newSkill.insertId;
      }

      await connection.query(
        "INSERT IGNORE INTO job_skills (job_id, skill_id) VALUES (?, ?)",
        [job_id, skillId],
      );
    }

    await connection.commit();
    return res
      .status(201)
      .send({ message: "Job and requirements posted successfully" });
  } catch (error) {
    await connection.rollback();
    console.error(error);
    return res
      .status(500)
      .send({ message: "Unexpected error occurred", error: error.message });
  } finally {
    connection.release();
  }
};

exports.getAppliedJobs = async (req, res) => {
  try {
    const [appliedJobs] = await db.query(
      `SELECT a.id, a.status, a.applied_at, p.cover_letter, u.name, u.email
       FROM applications a
       JOIN talents t ON a.talent_id = t.id
       JOIN users u ON t.user_id = u.id
       LEFT JOIN proposals p ON a.id = p.application_id`,
    );
    if (!appliedJobs || appliedJobs.length === 0) {
      return res.status(404).json({ message: "No applied jobs found" });
    }

    return res.status(200).json({ message: "Applied jobs", data: appliedJobs });
  } catch (error) {
    return res.status(500).json({
      message: "An unexpected error occurred while fetching applied jobs.",
      error,
    });
  }
};

exports.shorListTalents = async (req, res) => {
  const { applicationID } = req.body;
  try {
    const [application] = await db.query(
      "update applications set status = 'shortlisted' where id = ? and status = 'pending'",
      [applicationID],
    );

    if (application.affectedRows === 0) {
      return res
        .status(404)
        .json({ message: "Application not found or already processed" });
    }

    return res.status(200).json({
      message: "Talent shortlisted successfully",
      data: application,
    });
  } catch (error) {
    return res.status(500).json({
      message: "An unexpected error occurred while shortlisting talents.",
      error,
    });
  }
};

exports.hireTalents = async (req, res) => {
  const connection = await db.getConnection();
  const { jobId, talentId } = req.body;
  try {
    await connection.beginTransaction();
    const [applications] = await connection.query(
      "select * from applications where job_id = ? and talent_id = ?",
      [jobId, talentId],
    );
    if (applications.length === 0) {
      await connection.rollback();
      return res.status(404).json({ message: "Application not found" });
    }

    const application = applications[0].id;

    await connection.query(
      "update applications set status = 'accepted' where id = ?",
      [application],
    );
    await connection.query(
      "update applications set status = 'rejected' where id != ? and job_id = ?",
      [application, jobId],
    );

    await connection.commit();
    return res.status(200).json({ message: "Talent hired successfully" });
  } catch (error) {
    return res.status(500).json({
      message: "An unexpected error occurred while hiring talent.",
      error,
    });
  } finally {
    connection.release();
  }
};

exports.getJobApplicantsForEmployer = async (req, res) => {
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

    const [applicants] = await db.query(
      `SELECT a.id AS applicationID, a.status, a.applied_at,
              p.id AS proposal_id, p.cover_letter, p.proposal, p.tokens_used, p.created_at,
              COALESCE(u.name, 'Unknown Talent') AS name,
              COALESCE(u.email, 'N/A') AS email,
              u.id AS user_id,
              u.profile_image,
              t.id AS talent_id, t.fullName AS talent_full_name,
              t.about, t.skills, t.experience, t.education, t.languages,
              t.linkedin, t.github, t.resume_url
       FROM applications a
       LEFT JOIN talents t ON a.talent_id = t.id
       LEFT JOIN users u ON t.user_id = u.id
       JOIN jobs j ON a.job_id = j.id
       LEFT JOIN proposals p ON a.id = p.application_id
       WHERE a.job_id = ? AND j.employer_id = ?
       ORDER BY a.applied_at DESC`,
      [jobId, employerId],
    );

    return res.status(200).json(applicants);
  } catch (error) {
    console.error("Error in getJobApplicantsForEmployer:", error);
    return res.status(500).json({
      message: "An unexpected error occurred while retrieving applicants.",
      error,
    });
  }
};

exports.getApplicants = async (req, res) => {
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

    const [applicants] = await db.query(
      `SELECT a.id AS applicationID, a.status, a.applied_at, p.cover_letter,
              u.name, u.email
       FROM applications a
       JOIN talents t ON a.talent_id = t.id
       JOIN users u ON t.user_id = u.id
       JOIN jobs j ON a.job_id = j.id
       LEFT JOIN proposals p ON a.id = p.application_id
       WHERE a.job_id = ? AND j.employer_id = ?
       ORDER BY a.applied_at DESC`,
      [jobId, employerId],
    );
    return res.status(200).json(applicants);
  } catch (error) {
    console.error("Error getting applicants:", error);
    res
      .status(500)
      .json({ message: "Error getting applicants", error: error.message });
  }
};

exports.getAllProposalsAndApplications = async (req, res) => {
  let { page = 1, limit = 20, status, search, job_id } = req.query;
  const userId = req.user.id;

  page = parseInt(page);
  limit = parseInt(limit);
  const offset = (page - 1) * limit;

  try {
    // 1. Get employer ID
    const [employerRow] = await db.query(
      "SELECT id FROM employers WHERE user_id = ?",
      [userId],
    );

    if (!employerRow.length) {
      return res.status(200).json({
        message: "Proposals and applications retrieved successfully",
        data: [],
        pagination: { total: 0, page, limit, has_next_page: false, has_prev_page: false },
      });
    }

    const employerId = employerRow[0].id;

    // 2. Build WHERE clause safely
    let whereClause = "WHERE j.employer_id = ?";
    const params = [employerId];

    if (status && status !== "all") {
      whereClause += " AND a.status = ?";
      params.push(status);
    }

    if (job_id) {
      whereClause += " AND j.id = ?";
      params.push(job_id);
    }

    if (search) {
      whereClause += `
        AND (
          u.name LIKE ?
          OR (p.cover_letter IS NOT NULL AND p.cover_letter LIKE ?)
          OR (p.proposal IS NOT NULL AND p.proposal LIKE ?)
        )
      `;
      const searchValue = `%${search}%`;
      params.push(searchValue, searchValue, searchValue);
    }

    // 3. Main query (IMPORTANT: LIMIT injected, not parameterized)
    const [rows] = await db.query(
      `
      SELECT
        a.id AS application_id,
        a.status AS application_status,
        a.applied_at,
        a.job_id,

        j.title AS job_title,
        j.discription AS job_description,
        j.salary AS job_salary,
        j.budget_type AS job_budget_type,
        j.experience_level AS job_experience_level,
        j.status AS job_status,

        p.id AS proposal_id,
        p.cover_letter,
        p.proposal,
        p.tokens_used,
        p.created_at AS proposal_created_at,
        p.updated_at AS proposal_updated_at,

        t.id AS talent_id,
        u.name AS talent_name,
        u.email AS talent_email,
        u.profile_image AS talent_profile_image,
        t.about AS talent_about,
        t.Location AS talent_location,
        t.HourlyRate AS talent_hourly_rate,

        e.company_name,
        e.location AS company_location

      FROM applications a
      JOIN jobs j ON a.job_id = j.id
      LEFT JOIN users u ON a.talent_id = u.id
      LEFT JOIN talents t ON u.id = t.user_id
      JOIN employers e ON j.employer_id = e.id
      LEFT JOIN proposals p ON a.id = p.application_id

      ${whereClause}

      ORDER BY a.applied_at DESC
      LIMIT ${limit} OFFSET ${offset}
      `,
      params,
    );

    // 4. Count query
    const [countResult] = await db.query(
      `
      SELECT COUNT(DISTINCT a.id) AS total
      FROM applications a
      JOIN jobs j ON a.job_id = j.id
      LEFT JOIN users u ON a.talent_id = u.id
      LEFT JOIN talents t ON u.id = t.user_id
      JOIN employers e ON j.employer_id = e.id
      LEFT JOIN proposals p ON a.id = p.application_id

      ${whereClause}
      `,
      params,
    );

    const total = countResult[0].total;

    // 5. Grouping (safe + avoids duplication issues)
    const groupedByJob = {};

    rows.forEach((row) => {
      if (!groupedByJob[row.job_id]) {
        groupedByJob[row.job_id] = {
          job_id: row.job_id,
          job_title: row.job_title,
          job_description: row.job_description,
          job_salary: row.job_salary,
          job_budget_type: row.job_budget_type,
          job_experience_level: row.job_experience_level,
          job_status: row.job_status,
          company_name: row.company_name,
          company_location: row.company_location,
          applications: [],
        };
      }

      // find existing application (avoid duplicates if multiple proposals)
      let existingApp = groupedByJob[row.job_id].applications.find(
        (app) => app.application_id === row.application_id,
      );

      if (!existingApp) {
        existingApp = {
          application_id: row.application_id,
          application_status: row.application_status,
          applied_at: row.applied_at,
          talent_id: row.talent_id,
          talent_name: row.talent_name,
          talent_email: row.talent_email,
          talent_profile_image: row.talent_profile_image,
          talent_about: row.talent_about,
          talent_location: row.talent_location,
          talent_hourly_rate: row.talent_hourly_rate,
          proposals: [],
        };

        groupedByJob[row.job_id].applications.push(existingApp);
      }

      // push proposal if exists
      if (row.proposal_id) {
        existingApp.proposals.push({
          proposal_id: row.proposal_id,
          cover_letter: row.cover_letter,
          proposal: row.proposal,
          tokens_used: row.tokens_used,
          created_at: row.proposal_created_at,
          updated_at: row.proposal_updated_at,
        });
      }
    });

    return res.status(200).json({
      message: "Proposals and applications retrieved successfully",
      data: Object.values(groupedByJob),
      pagination: {
        total,
        page,
        limit,
        has_next_page: page * limit < total,
        has_prev_page: page > 1,
      },
    });
  } catch (error) {
    console.error("Error getting proposals/applications:", error);
    return res.status(500).json({
      message: "Server error",
      error: error.message,
    });
  }
};

exports.getAllApplications = async (req, res) => {
  const { page = 1, limit = 20, status, search } = req.query;
  const userId = req.user.id;
  const offset = (page - 1) * limit;

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

    // Build WHERE clause
    let whereClause = "WHERE j.employer_id = ?";
    let params = [employerId];

    if (status && status !== "all") {
      whereClause += " AND a.status = ?";
      params.push(status);
    }

    if (search) {
      whereClause += " AND (u.name LIKE ? OR p.cover_letter LIKE ?)";
      params.push(`%${search}%`, `%${search}%`);
    }

    // Get applications with talent info
    const [applications] = await db.query(
      `
      SELECT
        a.id,
        a.status,
        a.applied_at,
        p.cover_letter,
        p.tokens_used,
        p.proposal,
        t.id as talent_id,
        u.name as talent_name,
        u.email as talent_email,
        j.title as job_title,
        j.id as job_id
      FROM applications a
      JOIN talents t ON a.talent_id = t.id
      JOIN users u ON t.user_id = u.id
      JOIN jobs j ON a.job_id = j.id
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
      SELECT COUNT(*) as total
      FROM applications a
      JOIN talents t ON a.talent_id = t.id
      JOIN users u ON t.user_id = u.id
      JOIN jobs j ON a.job_id = j.id
      LEFT JOIN proposals p ON a.id = p.application_id
      ${whereClause}
    `,
      params,
    );

    const total = countResult[0].total;

    res.status(200).json({
      message: "Applications retrieved successfully",
      applications,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        has_next_page: parseInt(page) * parseInt(limit) < total,
        has_prev_page: parseInt(page) > 1,
      },
    });
  } catch (error) {
    console.error("Error getting all applications:", error);
    res
      .status(500)
      .json({ message: "Error getting applications", error: error.message });
  }
};

exports.getTalentById = async (req, res) => {
  const { talentId } = req.params;
  try {
    const [rows] = await db.query(
      `SELECT
        t.id, u.name, u.email, u.profile_image,
        t.fullName, t.about, t.experience, t.education,
        t.languages, t.linkedin, t.github, t.resume_url,
        t.Location, t.HourlyRate,
        t.created_at
       FROM talents t
       JOIN users u ON t.user_id = u.id
       WHERE t.id = ?`,
      [talentId]
    );

    if (rows.length === 0) {
      return res.status(404).json({ message: "Talent not found" });
    }

    const talent = rows[0];

    const [skills] = await db.query(
      `SELECT s.skill_name FROM talent_skills ts
       JOIN skills s ON ts.skill_id = s.id
       WHERE ts.talent_id = ?`,
      [talent.id]
    );

    // Fetch portfolio projects
    const [portfolio] = await db.query(
      `SELECT id, title, description, technologies, image_url, project_url, github_url
       FROM Protifolio WHERE user_id = (
         SELECT user_id FROM talents WHERE id = ?
       ) ORDER BY create_at DESC`,
      [talent.id]
    );

    // Fetch certificates
    const [certificates] = await db.query(
      `SELECT id, title, organization, issue_date, expiry_date, credential_id, credential_url
       FROM certificates WHERE user_id = (
         SELECT user_id FROM talents WHERE id = ?
       ) ORDER BY issue_date DESC`,
      [talent.id]
    );

    const parsedPortfolio = portfolio.map((p) => ({
      ...p,
      technologies: p.technologies ? JSON.parse(p.technologies) : [],
    }));

    return res.status(200).json({
      talent: {
        ...talent,
        skills: skills.map((s) => s.skill_name),
        portfolio: parsedPortfolio,
        certificates,
      },
    });
  } catch (error) {
    console.error("Error fetching talent by id:", error);
    return res.status(500).json({ message: "Server error", error: error.message });
  }
};

// POST /api/employer/license — submit business license
exports.submitLicense = async (req, res) => {
  const userId = req.user.id;
  const { license_name, license_number, issuing_authority } = req.body;
  
  const SecurityService = require('../services/securityService');
  
  try {
    // Get employer profile
    const [empRow] = await db.query("SELECT id FROM employers WHERE user_id = ?", [userId]);
    if (!empRow.length) {
      await SecurityService.logSecurityEvent(
        'INVALID_LICENSE_SUBMISSION',
        userId,
        { reason: 'Employer profile not found' },
        'MEDIUM',
        req
      );
      return res.status(404).json({ message: "Employer profile not found" });
    }
    
    const employerId = empRow[0].id;

    // Check for existing pending submissions
    const [existing] = await db.query(
      "SELECT id, status FROM employer_licenses WHERE employer_id = ? ORDER BY submitted_at DESC LIMIT 1",
      [employerId]
    );
    
    if (existing.length && existing[0].status === "pending") {
      await SecurityService.logSecurityEvent(
        'DUPLICATE_LICENSE_SUBMISSION',
        userId,
        { existing_request_id: existing[0].id },
        'LOW',
        req
      );
      return res.status(400).json({ message: "You already have a pending license review." });
    }

    // Detect suspicious activity
    const isSuspicious = await SecurityService.detectSuspiciousLicenseActivity(userId, {
      license_name,
      license_number,
      issuing_authority
    });
    
    if (isSuspicious) {
      return res.status(429).json({ 
        message: "Your submission is under review. Please contact support if you believe this is an error." 
      });
    }

    // Upload license document
    const cloudinary = require("../config/cloudImage");
    const fs = require("fs");
    const result = await cloudinary.uploader.upload(req.file.path, {
      folder: "employer/licenses",
      public_id: `license_${employerId}_${Date.now()}`,
      resource_type: "auto"
    });
    
    // Clean up uploaded file
    fs.unlink(req.file.path, (err) => {
      if (err) console.error('Error deleting temp file:', err);
    });

    // Insert license submission
    const [insertResult] = await db.query(
      "INSERT INTO employer_licenses (employer_id, user_id, license_name, license_number, issuing_authority, license_image) VALUES (?, ?, ?, ?, ?, ?)",
      [employerId, userId, license_name, license_number || null, issuing_authority || null, result.secure_url]
    );

    // Log successful submission
    await SecurityService.logSecurityEvent(
      'LICENSE_SUBMITTED',
      userId,
      { 
        license_id: insertResult.insertId,
        license_name,
        file_url: result.secure_url
      },
      'LOW',
      req
    );

    // Notify admins
    const [admins] = await db.query("SELECT id FROM users WHERE role = 'admin'");
    for (const admin of admins) {
      await db.query(
        `INSERT INTO notifications (user_id, type, title, message, sender_user_id, is_read, created_at)
         VALUES (?, 'license_review', 'New Employer License Submission', ?, ?, false, NOW())`,
        [admin.id, `An employer has submitted a business license for review.`, userId]
      );
    }
    
    return res.status(201).json({ 
      message: "License submitted successfully. Admin will review it shortly.",
      submission_id: insertResult.insertId
    });
  } catch (error) {
    console.error('License submission error:', error);
    await SecurityService.logSecurityEvent(
      'LICENSE_SUBMISSION_ERROR',
      userId,
      { error: error.message },
      'MEDIUM',
      req
    );
    return res.status(500).json({ message: "Internal server error" });
  }
};

// GET /api/employer/license — get own license status
exports.getLicenseStatus = async (req, res) => {
  const userId = req.user.id;
  try {
    const [empRow] = await db.query("SELECT id, is_verified FROM employers WHERE user_id = ?", [userId]);
    if (!empRow.length) return res.status(200).json({ is_verified: false, license: null });
    const [licenses] = await db.query(
      "SELECT id, license_name, license_number, issuing_authority, license_image, status, admin_note, submitted_at FROM employer_licenses WHERE employer_id = ? ORDER BY submitted_at DESC LIMIT 1",
      [empRow[0].id]
    );
    return res.status(200).json({ is_verified: !!empRow[0].is_verified, license: licenses[0] || null });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

// Get all talents from the database
exports.getAllTalents = async (req, res) => {
  try {
    const { page = 1, limit = 20, search } = req.query;
    const offset = (page - 1) * limit;

    let whereClause = "WHERE 1=1";
    const params = [];

    if (search) {
      whereClause +=
        " AND (u.name LIKE ? OR t.fullName LIKE ? OR t.about LIKE ?)";
      const searchPattern = `%${search}%`;
      params.push(searchPattern, searchPattern, searchPattern);
    }

    // Get talents with their skills
    const [talents] = await db.query(
      `
      SELECT
        t.id,
        u.name,
        u.email,
        u.profile_image,
        t.fullName,
        t.about,
        t.education,
        t.experience,
        t.languages,
        t.linkedin,
        t.github,
        t.created_at
      FROM talents t
      JOIN users u ON t.user_id = u.id
      ${whereClause}
      ORDER BY t.created_at DESC
      LIMIT ? OFFSET ?
    `,
      [...params, parseInt(limit), offset],
    );

    // Get skills for each talent
    const talentsWithSkills = await Promise.all(
      talents.map(async (talent) => {
        const [skills] = await db.query(
          `
          SELECT s.skill_name
          FROM talent_skills ts
          JOIN skills s ON ts.skill_id = s.id
          WHERE ts.talent_id = ?
        `,
          [talent.id],
        );

        return {
          ...talent,
          profile_title: talent.about
            ? talent.about.substring(0, 100)
            : "Talent",
          skills: skills.map((s) => s.skill_name),
          avatar: talent.profile_image,
        };
      }),
    );

    // Get total count
    const [countResult] = await db.query(
      `
      SELECT COUNT(*) as total
      FROM talents t
      JOIN users u ON t.user_id = u.id
      ${whereClause}
    `,
      params,
    );

    const total = countResult[0].total;

    res.status(200).json({
      message: "Talents retrieved successfully",
      talents: talentsWithSkills,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        has_next_page: parseInt(page) * parseInt(limit) < total,
        has_prev_page: parseInt(page) > 1,
      },
    });
  } catch (error) {
    console.error("Error getting all talents:", error);
    res
      .status(500)
      .json({ message: "Error getting talents", error: error.message });
  }
};
