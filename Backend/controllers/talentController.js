const db = require("../config/db");
const { updateMonthlyToken } = require("../utils/tokenServices");
const axios = require("axios");
const cloudinary = require("../config/cloudImage");
const fs = require("fs");
const {
  sendConnectionNotification,
} = require("../utils/sendConnectionNotification");

exports.talentDashBoard = async (req, res) => {
  const {
    fullName,
    about,
    education,
    experience,
    languages,

    linkedin,
    github,
    resume_url,
  } = req.body;

  try {
    const query = "SELECT * FROM talents where user_id = ?";
    const [row0] = await db.query(query, [req.user.id]);

    if (row0.length > 0) {
      return res.status(400).send({ message: "Talent already exists" });
    }

    const values = {
      user_id: req.user.id,
      fullName,
      about,
      education,
      experience,
      languages,

      linkedin,
      github,
      resume_url,
    };
    const insertquery = "INSERT INTO talents SET ?";
    const [row1] = await db.query(insertquery, values);

    if (row1.affectedRows > 0) {
      return res
        .status(201)
        .send({ message: "Talent registered successfully" });
    } else {
      return res.status(500).send({ message: "Failed to register talent" });
    }
  } catch (error) {
    res.status(500).send({
      message: "An unexpected error occurred while saving your profile.",
      error,
    });
  }
};

exports.talentProfile = async (req, res) => {
  try {
    const fetchQuery = `
      SELECT
        u.name,
        u.email,
        u.profile_image,
        t.about,
        t.education,
        t.experience,
        t.languages,
        t.linkedin,
        t.github,
        t.resume_url,
        t.Location,
        t.HourlyRate,
        GROUP_CONCAT(s.skill_name) AS skill_names
      FROM talents t
      JOIN users u ON t.user_id = u.id
      LEFT JOIN talent_skills ts ON t.id = ts.talent_id
      LEFT JOIN skills s ON ts.skill_id = s.id
      WHERE t.user_id = ?
      GROUP BY t.id, u.id;
    `;

    const [rows] = await db.query(fetchQuery, [req.user.id]);

    if (rows.length === 0) {
      // Talent record doesn't exist yet - get user data and return incomplete profile
      const [userRows] = await db.query(
        "SELECT name, email, profile_image FROM users WHERE id = ?",
        [req.user.id],
      );

      if (userRows.length === 0) {
        return res.status(404).send({ message: "User not found" });
      }

      const user = userRows[0];
      return res.status(200).send({
        message: "Talent profile incomplete",
        data: {
          name: user.name,
          email: user.email,
          profile_image: user.profile_image,
          about: null,
          education: null,
          experience: null,
          languages: null,
          linkedin: null,
          github: null,
          resume_url: null,
          Location: null,
          HourlyRate: null,
          skills: [],
        },
        incomplete: true,
      });
    }

    const profile = rows[0];
    profile.skills = profile.skill_names ? profile.skill_names.split(",") : [];

    delete profile.skill_names;

    return res.status(200).send({ message: "Talent profile", data: profile });
  } catch (error) {
    console.error("Fetch Profile Error:", error);
    return res.status(500).send({
      message: "An unexpected error occurred while fetching your profile.",
      error: error.message,
    });
  }
};

const addSkill = async (connection, talent_id, skill_name) => {
  try {
    await connection.beginTransaction();

    const [skills] = await connection.query(
      "select id from skills where skill_name = ?",
      [skill_name],
    );

    let skillID;
    if (skills.length > 0) {
      skillID = skills[0].id;
    } else {
      const [newSkill] = await connection.query(
        "INSERT INTO skills (skill_name) VALUES (?)",
        [skill_name],
      );
      skillID = newSkill.insertId;
    }

    await connection.query(
      "INSERT IGNORE INTO talent_skills (talent_id, skill_id) VALUES (?, ?)",
      [talent_id, skillID],
    );
    await connection.commit();
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
};

exports.addSkills = async (req, res) => {
  const { skill_name } = req.body;
  const user = req.user.id;
  const connection = await db.getConnection();

  try {
    await connection.beginTransaction();

    const [talent] = await connection.query(
      "select id from talents where user_id = ?",
      [user],
    );
    if (talent.length === 0) {
      return res.status(201).json("add your profile first");
    }

    const talent_id = talent[0].id;

    await addSkill(connection, talent_id, skill_name);
    await connection.commit();

    return res.status(200).send({ message: "Skill added successfully" });
  } catch (error) {
    await connection.rollback();
    return res.status(500).json({
      message: "unexpected error occurred while adding skill function",
      error,
    });
  } finally {
    connection.release();
  }
};

exports.getAllSkills = async (req, res) => {
  try {
    const [skills] = await db.query(
      "SELECT id, skill_name FROM skills ORDER BY skill_name ASC",
    );
    return res.status(200).json({
      message: "Skills retrieved successfully",
      data: skills,
    });
  } catch (error) {
    console.error("Error retrieving skills:", error);
    return res.status(500).json({
      message: "Error retrieving skills",
      error: error.message,
    });
  }
};

exports.getMySkills = async (req, res) => {
  try {
    const [talent] = await db.query(
      "SELECT id FROM talents WHERE user_id = ?",
      [req.user.id],
    );

    if (talent.length === 0) {
      return res.status(200).json({
        message: "No talent profile found",
        data: [],
      });
    }

    const talent_id = talent[0].id;

    const [skills] = await db.query(
      `SELECT s.id, s.skill_name
       FROM skills s
       JOIN talent_skills ts ON s.id = ts.skill_id
       WHERE ts.talent_id = ?
       ORDER BY s.skill_name ASC`,
      [talent_id],
    );

    return res.status(200).json({
      message: "My skills retrieved successfully",
      data: skills,
    });
  } catch (error) {
    console.error("Error retrieving my skills:", error);
    return res.status(500).json({
      message: "Error retrieving my skills",
      error: error.message,
    });
  }
};

exports.updateProfile = async (req, res) => {
  try {
    const updateData = [
      "skills",
      "education",
      "experience",
      "languages",
      "linkedin",
      "github",
      "resume_url",
      "about",
      "Location",
      "HourlyRate",
    ];

    let fields = [];
    let values = [];

    for (let key in req.body) {
      if (updateData.includes(key)) {
        const val = req.body[key];
        fields.push(`${key} = ?`);
        values.push(val === '' ? null : val);
      }
    }

    if (fields.length === 0) {
      return res.status(400).send({ message: "No fields to update" });
    }

    // Check if talent record exists
    const [talentRows] = await db.query(
      "SELECT id FROM talents WHERE user_id = ?",
      [req.user.id],
    );

    if (talentRows.length === 0) {
      // Create new talent record
      const dataFields = [];
      const dataValues = [];

      // Collect actual data fields from request body
      for (let key in req.body) {
        if (updateData.includes(key)) {
          dataFields.push(key);
          const val = req.body[key];
          dataValues.push(val === '' ? null : val);
        }
      }

      // Build the full field list including timestamps
      const allFields = ["user_id", ...dataFields, "created_at", "updated_at"];

      // Build placeholders: ? for data, NOW() for timestamps
      const placeholders = [
        "?", // for user_id
        ...dataFields.map(() => "?"), // for each data field
        "NOW()", // for created_at
        "NOW()", // for updated_at
      ].join(", ");

      const insertSql = `INSERT INTO talents (${allFields.join(", ")}) VALUES (${placeholders})`;

      // Only pass actual data values (user_id + data fields)
      const queryValues = [req.user.id, ...dataValues];

      await db.query(insertSql, queryValues);

      return res.status(200).send({ message: "Profile created successfully" });
    } else {
      // Update existing record
      fields.push("updated_at = NOW()");
      const sql = `UPDATE talents SET ${fields.join(" ,")} where user_id = ?`;
      values.push(req.user.id);

      const [rows] = await db.query(sql, values);

      if (rows.affectedRows > 0) {
        return res
          .status(200)
          .send({ message: "Profile updated successfully" });
      } else {
        return res.status(500).send({ message: "Failed to update profile" });
      }
    }
  } catch (error) {
    console.error(error);
    return res.status(500).send({
      message: "An unexpected error occurred while updating your profile.",
      error,
    });
  }
};

exports.createPortfolio = async (req, res) => {
  const { title, description, technologies, github_url, project_url } =
    req.body;

  try {
    if (!title) {
      return res.status(400).json({
        message: "Title is required",
      });
    }

    // Handle image upload if file is provided
    let image_url = req.body.image_url || null;
    if (req.file) {
      const result = await cloudinary.uploader.upload(req.file.path, {
        folder: "portfolio/projects",
        public_id: `portfolio_${req.user.id}_${Date.now()}`,
      });
      image_url = result.secure_url;

      // Delete local file
      fs.unlink(req.file.path, (err) => {
        if (err) console.error("Error deleting local file:", err);
      });
    }

    const values = [
      req.user.id,
      title,
      description || null,
      technologies ? JSON.stringify(technologies) : null,
      image_url,
      project_url || null,
      github_url || null,
    ];

    const [row1] = await db.query(
      "INSERT INTO Protifolio (user_id, title, description, technologies, image_url, project_url, github_url, create_at, updates_at) VALUES (?, ?, ?, ?, ?, ?, ?, NOW(), NOW())",
      values,
    );

    return res.status(201).json({
      message: "Portfolio project created successfully",
      data: { id: row1.insertId, title, image_url },
    });
  } catch (error) {
    console.error("Error creating portfolio:", error);
    return res.status(500).json({
      message: "An unexpected error occurred while creating your portfolio.",
      error: error.message,
    });
  }
};

const getPortfolioByUserId = async (userId) => {
  const query =
    "SELECT * FROM Protifolio WHERE user_id = ? ORDER BY create_at DESC";
  const [rows] = await db.query(query, [userId]);
  return rows;
};

exports.getPortfolio = async (req, res) => {
  try {
    const portfolio = await getPortfolioByUserId(req.user.id);

    // Parse technologies JSON for each project
    const parsedPortfolio = portfolio.map((project) => ({
      ...project,
      technologies: project.technologies
        ? JSON.parse(project.technologies)
        : [],
    }));

    return res.status(200).json({
      message: "Portfolio retrieved successfully",
      data: parsedPortfolio,
    });
  } catch (error) {
    console.error("Error retrieving portfolio:", error);
    return res.status(500).json({
      message: "An unexpected error occurred while retrieving your portfolio.",
      error: error.message,
    });
  }
};

exports.updatePortfolio = async (req, res) => {
  const { id } = req.params;
  const { title, description, technologies, github_url, project_url } =
    req.body;

  try {
    // Check if project exists and belongs to user
    const [existing] = await db.query(
      "SELECT * FROM Protifolio WHERE id = ? AND user_id = ?",
      [id, req.user.id],
    );

    if (existing.length === 0) {
      return res.status(404).json({
        message: "Portfolio project not found",
      });
    }

    const fields = [];
    const values = [];

    if (title !== undefined) {
      fields.push("title = ?");
      values.push(title);
    }
    if (description !== undefined) {
      fields.push("description = ?");
      values.push(description);
    }
    if (technologies !== undefined) {
      fields.push("technologies = ?");
      values.push(JSON.stringify(technologies));
    }
    if (github_url !== undefined) {
      fields.push("github_url = ?");
      values.push(github_url);
    }
    if (project_url !== undefined) {
      fields.push("project_url = ?");
      values.push(project_url);
    }

    // Handle image upload
    if (req.file) {
      const result = await cloudinary.uploader.upload(req.file.path, {
        folder: "portfolio/projects",
        public_id: `portfolio_${req.user.id}_${Date.now()}`,
      });
      fields.push("image_url = ?");
      values.push(result.secure_url);

      fs.unlink(req.file.path, (err) => {
        if (err) console.error("Error deleting local file:", err);
      });
    }

    if (fields.length === 0) {
      return res.status(400).json({
        message: "No fields to update",
      });
    }

    fields.push("updates_at = NOW()");
    values.push(id);
    values.push(req.user.id);

    const sql = `UPDATE Protifolio SET ${fields.join(", ")} WHERE id = ? AND user_id = ?`;
    const [row] = await db.query(sql, values);

    return res.status(200).json({
      message: "Portfolio project updated successfully",
      data: row,
    });
  } catch (error) {
    console.error("Error updating portfolio:", error);
    return res.status(500).json({
      message: "An unexpected error occurred while updating your portfolio.",
      error: error.message,
    });
  }
};

exports.deletePortfolio = async (req, res) => {
  const { id } = req.params;

  try {
    const [row] = await db.query(
      "DELETE FROM Protifolio WHERE id = ? AND user_id = ?",
      [id, req.user.id],
    );

    if (row.affectedRows === 0) {
      return res.status(404).json({
        message: "Portfolio project not found",
      });
    }

    return res.status(200).json({
      message: "Portfolio project deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting portfolio:", error);
    return res.status(500).json({
      message: "An unexpected error occurred while deleting your portfolio.",
      error: error.message,
    });
  }
};

exports.applyForJob = async (req, res) => {
  const { cover_letter, job_id } = req.body;
  const user = req.user.id;

  try {
    const sql = "select * from jobs where id =?";
    const [job] = await db.query(sql, [job_id]);

    if (job.length === 0) {
      return res.status(404).json({
        message: "Job not found",
      });
    }
    const jobId = job[0];

    const [jobRows] = await db.query(
      "select token_cost from jobs where id = ?",
      [jobId.id],
    );

    const takenCost = jobRows[0].token_cost;

    const [tokenRows] = await db.query(
      "select balance from tokens where talent_id =? for update",
      [user],
    );
    if (tokenRows.length === 0 || tokenRows[0].balance < takenCost) {
      return res.status(400).json({
        message: "You don't have enough tokens to apply for this job",
      });
    }
    const sql3 =
      "select * from applications where job_id = ? and talent_id = ?";
    const [applicationExists] = await db.query(sql3, [jobId.id, user]);
    if (applicationExists.length > 0) {
      return res.status(400).json({
        message: "You have already applied for this job",
      });
    }

    const newBalance = tokenRows[0].balance - takenCost;

    await db.query("update tokens set balance = ? where talent_id = ?", [
      newBalance,
      user,
    ]);

    await db.query(
      "INSERT INTO token_transactions (talent_id , amount , type , reason) VALUES (? , ? , ? , ?)",
      [user, takenCost, "debit", `applied for ${jobId.title}`],
    );

    // Create application (without cover_letter - it's in proposals table)
    const sql2 =
      "INSERT INTO applications (job_id, talent_id, status) VALUES (?, ?, 'pending')";
    const [applicationResult] = await db.query(sql2, [jobId.id, user]);

    // Create proposal with cover_letter
    if (cover_letter) {
      await db.query(
        "INSERT INTO proposals (application_id, cover_letter, tokens_used) VALUES (?, ?, ?)",
        [applicationResult.insertId, cover_letter, takenCost],
      );
    }

    // Notify the employer
    const [jobOwner] = await db.query(
      `SELECT e.user_id, u.name as talent_name
       FROM jobs j
       JOIN employers e ON j.employer_id = e.id
       JOIN users u ON u.id = ?
       WHERE j.id = ?`,
      [user, jobId.id]
    );
    if (jobOwner[0]) {
      await db.query(
        `INSERT INTO notifications (user_id, type, title, message, sender_user_id, is_read, created_at)
         VALUES (?, 'new_application', ?, ?, ?, false, NOW())`,
        [
          jobOwner[0].user_id,
          `New application for "${jobId.title}"`,
          `${jobOwner[0].talent_name} applied for your job posting.`,
          user,
        ]
      );
    }

    if (!applicationResult) {
      return res.status(500).json({
        message: "An unexpected error occurred while applying for the job.",
      });
    }
    return res.status(200).json({
      message: "Application submitted successfully",
      data: { id: applicationResult.insertId },
    });
  } catch (error) {
    return res.status(500).json({
      message: "An unexpected error occurred while applying for the job.",
      error,
    });
  }
};

exports.getMyTokens = async (req, res) => {
  const user = req.user.id;

  const connection = await db.getConnection();

  try {
    const [tokens] = await connection.query(
      "SELECT balance FROM tokens WHERE talent_id = ? ",
      [user],
    );

    await updateMonthlyToken(user);

    return res.status(200).json({ balance: tokens[0]?.balance || 0 });
  } catch (error) {
    return res.status(500).json({
      message: "An unexpected error occurred while getting your tokens.",
      error,
    });
  }
};

exports.sendRequest = async (req, res) => {
  const { receiver_id } = req.body;
  const user = req.user.id;

  try {
    const [sender] = await db.query(
      "SELECT t.id, u.name FROM talents t JOIN users u ON t.user_id = u.id WHERE u.id = ?",
      [user],
    );

    if (sender.length === 0 || !sender[0]) {
      return res.status(404).json({
        message: "Sender not found",
      });
    }

    const [receiver] = await db.query(
      "select u.name, u.email from talents t join users u on t.user_id = u.id where t.id = ?",
      [receiver_id],
    );

    if (receiver.length === 0 || !receiver[0]) {
      return res.status(404).json({
        message: "Receiver not found",
      });
    }

    const sender_id = sender[0].id;

    if (sender_id === parseInt(receiver_id)) {
      return res.status(400).json({
        message: "You cannot connect to yourself",
      });
    }

    const [existing] = await db.query(
      `SELECT id, status, created_at FROM connections
       WHERE (sender_id = ? AND reciver_id = ?) OR (sender_id = ? AND reciver_id = ?)`,
      [sender_id, receiver_id, receiver_id, sender_id],
    );

    if (existing.length > 0) {
      const { status, created_at } = existing[0];
      if (status === 'accepted') {
        return res.status(400).json({ message: "You are already connected" });
      }
      if (status === 'pending') {
        // Expire pending requests older than 1 hour
        const ageMs = Date.now() - new Date(created_at).getTime();
        if (ageMs < 60 * 60 * 1000) {
          return res.status(400).json({ message: "A connection request already exists between you two" });
        }
        // Expired — delete and allow re-send
        await db.query("DELETE FROM connections WHERE id = ?", [existing[0].id]);
      }
    }

    const [result] = await db.query(
      "INSERT INTO connections (sender_id, reciver_id, status) VALUES (?, ?, 'pending')",
      [sender_id, receiver_id],
    );

    // Insert notification for the receiver
    const [receiverUser] = await db.query(
      "SELECT user_id FROM talents WHERE id = ?",
      [receiver_id],
    );
    if (receiverUser[0]) {
      await db.query(
        `INSERT INTO notifications (user_id, type, title, message, connection_id, sender_talent_id)
         VALUES (?, 'connection_request', ?, ?, ?, ?)`,
        [
          receiverUser[0].user_id,
          `${sender[0].name} wants to connect`,
          `You have a new connection request from ${sender[0].name}`,
          result.insertId,
          sender_id,
        ],
      );
    }

    // Fire and forget — don't let email failure break the request
    sendConnectionNotification(
      receiver[0].email,
      receiver[0].name,
      sender[0].name,
    ).catch(() => {});

    return res.status(200).json({ message: "Request sent successfully", data: { connection_id: result.insertId } });
  } catch (error) {
    if (error.code === "ER_DUP_ENTRY") {
      return res.status(400).json({
        message: "You have already sent a connection request to this user",
      });
    }

    return res.status(500).json({
      message: "An unexpected error occurred while sending request.",
      error: error.message,
    });
  }
};

exports.getRequestedConnections = async (req, res) => {
  const user = req.user.id;

  try {
    const [talent] = await db.query(
      "SELECT t.id FROM talents t JOIN users u ON t.user_id = u.id WHERE u.id = ?",
      [user],
    );

    if (talent.length === 0) {
      return res.status(404).json({ message: "Talent not found" });
    }

    const reciver_id = talent[0].id;

    const [connections] = await db.query(
      `SELECT c.id, c.sender_id, u.name, u.profile_image, t.about,
              GROUP_CONCAT(s.skill_name SEPARATOR ', ') as skills
       FROM connections c
       JOIN talents t ON c.sender_id = t.id
       JOIN users u ON t.user_id = u.id
       LEFT JOIN talent_skills ts ON t.id = ts.talent_id
       LEFT JOIN skills s ON ts.skill_id = s.id
       WHERE c.reciver_id = ? AND c.status = 'pending'
       GROUP BY c.id, c.sender_id, u.id, t.id`,
      [reciver_id],
    );

    return res.status(200).json({ connections });
  } catch (error) {
    return res.status(500).json({
      message:
        "An unexpected error occurred while getting requested connections.",
      error,
    });
  }
};

exports.getMyConnections = async (req, res) => {
  const user = req.user.id;
  try {
    const [talents] = await db.query(
      "SELECT id FROM talents WHERE user_id = ?",
      [user],
    );

    if (talents.length === 0) {
      return res.status(200).json({ connections: [] });
    }

    const talent_id = talents[0].id;

    const [connections] = await db.query(
      `SELECT MIN(c.id) as id, t.id as talent_id, u.id as user_id, u.name, u.profile_image, t.about,
              GROUP_CONCAT(DISTINCT s.skill_name ORDER BY s.skill_name SEPARATOR ', ') as skills,
              t.linkedin, t.github
       FROM connections c
       JOIN talents t ON (c.sender_id = t.id OR c.reciver_id = t.id)
       JOIN users u ON t.user_id = u.id
       LEFT JOIN talent_skills ts ON t.id = ts.talent_id
       LEFT JOIN skills s ON ts.skill_id = s.id
       WHERE (c.sender_id = ? OR c.reciver_id = ?)
       AND c.status = 'accepted'
       AND t.id != ?
       GROUP BY t.id, u.id`,
      [talent_id, talent_id, talent_id],
    );

    return res.status(200).json({ connections });
  } catch (error) {
    return res.status(500).json({
      message: "An unexpected error occurred while getting my connections.",
      error,
    });
  }
};

exports.acceptRequest = async (req, res) => {
  const { connection_id } = req.body;
  const user = req.user.id;

  try {
    const [talent_id] = await db.query(
      "SELECT t.id FROM talents t JOIN users u WHERE t.user_id = u.id",
      [user],
    );
    const my_id = talent_id[0].id;

    const [rows] = await db.query(
      "update connections set status = 'accepted' where id = ? and reciver_id = ?",
      [connection_id, my_id],
    );
    if (rows.affectedRows === 0) {
      return res
        .status(404)
        .json({ message: "unauthorized to accept this request" });
    }

    return res.status(200).json({ message: "Request accepted successfully" });
  } catch (error) {
    return res.status(500).json({
      message: "An unexpected error occurred while accepting request.",
      error: error.message,
    });
  }
};

exports.talentMatchJobs = async (req, res) => {
  const connection = await db.getConnection();

  const user = req.user.id;
  try {
    await connection.beginTransaction();
    const [talentRows] = await connection.query(
      `
SELECT
    t.id AS talent_id,
    t.about,
    COALESCE(GROUP_CONCAT(s.skill_name SEPARATOR ', '), '') AS skills
FROM talents t
LEFT JOIN talent_skills ts ON t.id = ts.talent_id
LEFT JOIN skills s ON ts.skill_id = s.id
WHERE t.user_id = ?
GROUP BY t.id;
  `,
      [user],
    );

    const talent = talentRows[0];

    const [jobs] = await connection.query("SELECT * FROM jobs");

    const talentSkills = talent.skills ? talent.skills.split(",") : [];

    const talentText = `${talent.about || ""}\nSkills: ${talentSkills.join(
      ", ",
    )}`;

    const jobsWithSkills = await Promise.all(
      jobs.map(async (job) => {
        const [rows] = await connection.query(
          `SELECT s.skill_name FROM job_skills js
           JOIN skills s ON s.id = js.skill_id
           WHERE js.job_id = ?`,
          [job.id],
        );

        return {
          ...job,
          skills: rows.map((r) => r.skill_name),
        };
      }),
    );

    const jobsAsStrings = jobsWithSkills.map((job) => {
      return `Title: ${job.title}. Description: ${job.discription}. Skills: ${job.skills.join(", ")}`;
    });

    const response = await axios.post("http://localhost:8000/match-jobs", {
      jobs: jobsAsStrings, // This matches list[str] in Python
      talent: talentText,
    });

    const ranked = response.data.map((item) => ({
      jobId: item.jobId,
      score: item.score,
    }));

    ranked.sort((a, b) => b.score - a.score);

    await connection.commit();

    return res.status(200).json({
      message: "Jobs matched successfully",
      data: ranked,
    });
  } catch (error) {
    await connection.rollback();
    return res.status(500).json({
      message: "An unexpected error occurred while processing your request.",
      error: error.message,
    });
  } finally {
    connection.release();
  }
};

// ── Certificates ─────────────────────────────────────────────────────────────

exports.getCertificates = async (req, res) => {
  try {
    const [rows] = await db.query(
      `SELECT id, title, organization, issue_date, expiry_date,
              credential_id, credential_url, created_at
       FROM certificates WHERE user_id = ? ORDER BY issue_date DESC`,
      [req.user.id],
    );
    return res.status(200).json({ message: "Certificates retrieved", data: rows });
  } catch (error) {
    return res.status(500).json({ message: "Error retrieving certificates", error: error.message });
  }
};

exports.addCertificate = async (req, res) => {
  const { title, organization, issue_date, expiry_date, credential_id, credential_url } = req.body;
  if (!title || !title.trim()) {
    return res.status(400).json({ message: "Certificate title is required" });
  }
  try {
    const [result] = await db.query(
      `INSERT INTO certificates (user_id, title, organization, issue_date, expiry_date, credential_id, credential_url)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [req.user.id, title.trim(), organization || null, issue_date || null,
       expiry_date || null, credential_id || null, credential_url || null],
    );
    const [rows] = await db.query("SELECT * FROM certificates WHERE id = ?", [result.insertId]);
    return res.status(201).json({ message: "Certificate added successfully", data: rows[0] });
  } catch (error) {
    return res.status(500).json({ message: "Error adding certificate", error: error.message });
  }
};

exports.updateCertificate = async (req, res) => {
  const { id } = req.params;
  const { title, organization, issue_date, expiry_date, credential_id, credential_url } = req.body;
  try {
    const [existing] = await db.query(
      "SELECT id FROM certificates WHERE id = ? AND user_id = ?",
      [id, req.user.id],
    );
    if (existing.length === 0) {
      return res.status(404).json({ message: "Certificate not found" });
    }
    const fields = [];
    const values = [];
    if (title !== undefined) { fields.push("title = ?"); values.push(title); }
    if (organization !== undefined) { fields.push("organization = ?"); values.push(organization); }
    if (issue_date !== undefined) { fields.push("issue_date = ?"); values.push(issue_date || null); }
    if (expiry_date !== undefined) { fields.push("expiry_date = ?"); values.push(expiry_date || null); }
    if (credential_id !== undefined) { fields.push("credential_id = ?"); values.push(credential_id); }
    if (credential_url !== undefined) { fields.push("credential_url = ?"); values.push(credential_url); }
    if (fields.length === 0) return res.status(400).json({ message: "No fields to update" });
    values.push(id, req.user.id);
    await db.query(`UPDATE certificates SET ${fields.join(", ")} WHERE id = ? AND user_id = ?`, values);
    const [rows] = await db.query("SELECT * FROM certificates WHERE id = ?", [id]);
    return res.status(200).json({ message: "Certificate updated successfully", data: rows[0] });
  } catch (error) {
    return res.status(500).json({ message: "Error updating certificate", error: error.message });
  }
};

exports.deleteCertificate = async (req, res) => {
  const { id } = req.params;
  try {
    const [result] = await db.query(
      "DELETE FROM certificates WHERE id = ? AND user_id = ?",
      [id, req.user.id],
    );
    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "Certificate not found" });
    }
    return res.status(200).json({ message: "Certificate deleted successfully" });
  } catch (error) {
    return res.status(500).json({ message: "Error deleting certificate", error: error.message });
  }
};

exports.endorseSkill = async (req, res) => {
  const { talent_id, skill_id } = req.body;
  const user = req.user.id;

  try {
    const [endorser] = await db.query(
      "SELECT t.id FROM talents t JOIN users u ON t.user_id = u.id WHERE u.id = ?",
      [user],
    );

    if (!endorser[0]) {
      return res.status(404).json({ message: "Endorser not found" });
    }

    const endorser_id = endorser[0].id;

    if (endorser_id === parseInt(talent_id)) {
      return res.status(400).json({
        message: "You cannot endorse your own skills",
      });
    }

    const [connection] = await db.query(
      "SELECT * FROM connections WHERE status = 'accepted' AND ((sender_id = ? AND reciver_id = ?) OR (sender_id = ? AND reciver_id = ?))",
      [endorser_id, talent_id, talent_id, endorser_id],
    );

    if (connection.length === 0) {
      return res.status(403).json({
        message: "You must be connected to endorse skills",
      });
    }

    const [existing] = await db.query(
      "SELECT id FROM skill_endorsements WHERE talent_id = ? AND skill_id = ? AND endorser_id = ?",
      [talent_id, skill_id, endorser_id],
    );

    if (existing.length > 0) {
      return res.status(400).json({
        message: "You have already endorsed this skill",
      });
    }

    const [result] = await db.query(
      "INSERT INTO skill_endorsements (talent_id, skill_id, endorser_id, created_at) VALUES (?, ?, ?, NOW())",
      [talent_id, skill_id, endorser_id],
    );

    return res.status(200).json({ message: "Skill endorsed successfully", data: { endorsement_id: result.insertId } });
  } catch (error) {
    return res.status(500).json({
      message: "An unexpected error occurred while endorsing skill.",
      error: error.message,
    });
  }
};

exports.getSkillEndorsements = async (req, res) => {
  const user = req.user.id;

  try {
    const [talent] = await db.query(
      "SELECT id FROM talents WHERE user_id = ?",
      [user],
    );

    if (talent.length === 0) {
      return res.status(404).json({ message: "Talent not found" });
    }

    const talent_id = talent[0].id;

    const [endorsements] = await db.query(
      `SELECT s.id, s.skill_name, COUNT(se.id) as endorsement_count,
              GROUP_CONCAT(u.name SEPARATOR ', ') as endorsed_by
       FROM skills s
       LEFT JOIN skill_endorsements se ON s.id = se.skill_id
       LEFT JOIN talents t ON se.endorser_id = t.id
       LEFT JOIN users u ON t.user_id = u.id
       WHERE s.id IN (SELECT skill_id FROM talent_skills WHERE talent_id = ?)
       GROUP BY s.id, s.skill_name
       ORDER BY endorsement_count DESC`,
      [talent_id],
    );

    return res.status(200).json({ endorsements });
  } catch (error) {
    return res.status(500).json({
      message: "An unexpected error occurred while fetching endorsements.",
      error: error.message,
    });
  }
};

exports.getTalentNetwork = async (req, res) => {
  const user = req.user.id;

  try {
    const [talent] = await db.query(
      "SELECT id FROM talents WHERE user_id = ?",
      [user],
    );

    if (talent.length === 0) {
      return res.status(404).json({ message: "Talent not found" });
    }

    const talent_id = talent[0].id;

    const [network] = await db.query(
      `SELECT t.id as talent_id, u.name, u.profile_image, t.about,
              GROUP_CONCAT(s.skill_name SEPARATOR ', ') as skills,
              COUNT(DISTINCT se.id) as total_endorsements
       FROM connections c
       JOIN talents t ON (c.sender_id = t.id OR c.reciver_id = t.id)
       JOIN users u ON t.user_id = u.id
       LEFT JOIN talent_skills ts ON t.id = ts.talent_id
       LEFT JOIN skills s ON ts.skill_id = s.id
       LEFT JOIN skill_endorsements se ON t.id = se.talent_id
       WHERE (c.sender_id = ? OR c.reciver_id = ?)
       AND c.status = 'accepted'
       AND t.id != ?
       GROUP BY t.id, u.id`,
      [talent_id, talent_id, talent_id],
    );

    return res.status(200).json({ network });
  } catch (error) {
    return res.status(500).json({
      message: "An unexpected error occurred while fetching network.",
      error: error.message,
    });
  }
};

exports.getAllTalents = async (req, res) => {
  const user = req.user.id;
  const { page = 1, limit = 12, search } = req.query;
  const offset = (page - 1) * limit;

  try {
    // Get the current user's talent id and their skills
    const [me] = await db.query(
      "SELECT id FROM talents WHERE user_id = ?",
      [user],
    );

    if (me.length === 0) {
      return res.status(200).json({
        message: "Talents fetched successfully",
        talents: [],
        pagination: { total: 0, page: parseInt(page), limit: parseInt(limit), has_prev_page: false, has_next_page: false },
      });
    }

    const my_talent_id = me[0].id;

    // Get my skill ids for recommendation scoring
    const [mySkills] = await db.query(
      "SELECT skill_id FROM talent_skills WHERE talent_id = ?",
      [my_talent_id],
    );
    const mySkillIds = mySkills.map((s) => s.skill_id);

    let whereClause = "WHERE t.id != ?";
    const params = [my_talent_id];

    if (search) {
      whereClause += " AND (u.name LIKE ? OR t.about LIKE ?)";
      const like = `%${search}%`;
      params.push(like, like);
    }

    // Fetch all talents excluding self, with shared skill count for recommendation ordering
    const [talents] = await db.query(
      `SELECT
         t.id,
         u.name,
         u.email,
         u.profile_image,
         t.about,
         t.Location,
         t.HourlyRate,
         t.linkedin,
         t.github,
         GROUP_CONCAT(DISTINCT s.skill_name ORDER BY s.skill_name SEPARATOR ',') AS skills,
         ${
           mySkillIds.length > 0
             ? `SUM(CASE WHEN ts.skill_id IN (${mySkillIds.map(() => "?").join(",")}) THEN 1 ELSE 0 END) AS shared_skills`
             : "0 AS shared_skills"
         }
       FROM talents t
       JOIN users u ON t.user_id = u.id
       LEFT JOIN talent_skills ts ON t.id = ts.talent_id
       LEFT JOIN skills s ON ts.skill_id = s.id
       ${whereClause}
       GROUP BY t.id, u.id
       ORDER BY shared_skills DESC, t.id DESC
       LIMIT ? OFFSET ?`,
      mySkillIds.length > 0
        ? [...mySkillIds, ...params, parseInt(limit), offset]
        : [...params, parseInt(limit), offset],
    );

    // Total count for pagination
    const [countRows] = await db.query(
      `SELECT COUNT(DISTINCT t.id) AS total
       FROM talents t
       JOIN users u ON t.user_id = u.id
       ${whereClause}`,
      params,
    );
    const total = countRows[0].total;

    return res.status(200).json({
      message: "Talents fetched successfully",
      talents: talents.map((t) => ({
        ...t,
        skills: t.skills ? t.skills.split(",") : [],
      })),
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        has_prev_page: page > 1,
        has_next_page: offset + parseInt(limit) < total,
      },
    });
  } catch (error) {
    return res.status(500).json({
      message: "An unexpected error occurred while fetching talents.",
      error: error.message,
    });
  }
};

// Upload profile image to Cloudinary and save URL to database
exports.uploadProfileImage = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "No image file provided" });
    }

    const filePath = req.file.path;
    const userId = req.user.id; // req.user.id is the user_id from JWT

    // Verify user exists in talents table
    const [talentRows] = await db.query(
      "SELECT id FROM talents WHERE user_id = ?",
      [userId],
    );

    if (talentRows.length === 0) {
      return res.status(404).json({ message: "Talent not found" });
    }

    const talentId = talentRows[0].id;

    // Upload to Cloudinary
    const result = await cloudinary.uploader.upload(filePath, {
      folder: "talents/profiles",
      public_id: `talent_${talentId}_${Date.now()}`,
    });

    const imageUrl = result.secure_url;

    // Delete local file after upload
    fs.unlink(filePath, (err) => {
      if (err) console.error("Error deleting local file:", err);
    });

    // Update user's profile_image in database
    await db.query("UPDATE users SET profile_image = ? WHERE id = ?", [
      imageUrl,
      userId,
    ]);

    res.json({
      message: "Profile image uploaded successfully",
      imageUrl,
    });
  } catch (err) {
    console.error("Error uploading profile image:", err);
    res.status(500).json({
      message: "Error uploading profile image",
      error: err.message,
    });
  }
};

// GET /api/talents/connection-statuses
// Returns all connection statuses for the current talent so the frontend
// can show correct button states without relying on localStorage
exports.getConnectionStatuses = async (req, res) => {
  const user = req.user.id;
  try {
    const [me] = await db.query("SELECT id FROM talents WHERE user_id = ?", [user]);
    if (me.length === 0) return res.status(200).json({ statuses: {} });
    const talent_id = me[0].id;

    // Auto-expire pending requests older than 1 hour
    await db.query(
      `DELETE FROM connections
       WHERE status = 'pending'
       AND TIMESTAMPDIFF(SECOND, created_at, NOW()) > 3600`
    );

    const [rows] = await db.query(
      `SELECT
         CASE WHEN sender_id = ? THEN reciver_id ELSE sender_id END AS other_talent_id,
         id AS connection_id,
         status,
         CASE WHEN sender_id = ? THEN 'sent' ELSE 'received' END AS direction
       FROM connections
       WHERE sender_id = ? OR reciver_id = ?`,
      [talent_id, talent_id, talent_id, talent_id]
    );

    // Build a map: talent_id -> { status, direction, connection_id }
    const statuses = {};
    for (const row of rows) {
      statuses[row.other_talent_id] = {
        status: row.status,
        direction: row.direction,
        connection_id: row.connection_id,
      };
    }

    return res.status(200).json({ statuses });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

// POST /api/talents/request-verification
exports.requestVerification = async (req, res) => {
  const userId = req.user.id;
  const { message } = req.body;
  try {
    const [[user]] = await db.query("SELECT is_verified FROM users WHERE id = ?", [userId]);
    if (user.is_verified) {
      return res.status(400).json({ message: "Your account is already verified." });
    }

    const [existing] = await db.query(
      "SELECT id, status FROM verification_requests WHERE user_id = ? ORDER BY created_at DESC LIMIT 1",
      [userId]
    );
    if (existing.length > 0 && existing[0].status === "pending") {
      return res.status(400).json({ message: "You already have a pending verification request." });
    }

    // Handle national ID image upload
    let national_id_image = null;
    if (req.file) {
      const cloudinary = require("../config/cloudImage");
      const fs = require("fs");
      const result = await cloudinary.uploader.upload(req.file.path, {
        folder: "verification/national_ids",
        public_id: `national_id_${userId}_${Date.now()}`,
      });
      national_id_image = result.secure_url;
      fs.unlink(req.file.path, () => {});
    }

    if (!national_id_image) {
      return res.status(400).json({ message: "National ID image is required for verification." });
    }

    await db.query(
      "INSERT INTO verification_requests (user_id, message, national_id_image, status) VALUES (?, ?, ?, 'pending')",
      [userId, message || null, national_id_image]
    );

    const [admins] = await db.query("SELECT id FROM users WHERE role = 'admin'");
    for (const admin of admins) {
      await db.query(
        `INSERT INTO notifications (user_id, type, title, message, sender_user_id, is_read, created_at)
         VALUES (?, 'verification_request', 'New Verification Request', ?, ?, false, NOW())`,
        [admin.id, `A talent has requested account verification.`, userId]
      );
    }

    return res.status(201).json({ message: "Verification request submitted successfully." });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

// GET /api/talents/verification-status
exports.getVerificationStatus = async (req, res) => {
  const userId = req.user.id;
  try {
    const [[user]] = await db.query("SELECT is_verified FROM users WHERE id = ?", [userId]);
    const [requests] = await db.query(
      "SELECT id, status, admin_note, created_at FROM verification_requests WHERE user_id = ? ORDER BY created_at DESC LIMIT 1",
      [userId]
    );
    return res.status(200).json({
      is_verified: !!user.is_verified,
      request: requests[0] || null,
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};
