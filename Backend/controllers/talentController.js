const db = require("../config/db").promise();
const { updateMonthlyToken } = require("../utils/tokenServices");
const {
  sendConnectionNotification,
} = require("../utils/sendConnectionNotification");

exports.talentDashBoard = async (req, res) => {
  console.log("🔥 THIS CONTROLLER IS HIT");
  const {
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
        t.education,
        t.experience,
        t.languages,
        t.linkedin,
        t.github,
        t.resume_url,
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
      return res.status(404).send({ message: "Talent profile not found" });
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
    ];

    let fields = [];
    let values = [];

    for (let key in req.body) {
      if (updateData.includes(key)) {
        fields.push(`${key} = ?`);
        values.push(req.body[key]);
      }
    }

    if (fields.length === 0) {
      return res.status(400).send({ message: "No fields to update" });
    }

    fields.push("updated_at = NOW()");
    const sql = `UPDATE talents SET ${fields.join(" ,")} where user_id = ?`;
    values.push(req.user.id);

    const [rows] = await db.query(sql, values);

    if (rows.affectedRows === 0) {
      return res.status(404).send({ message: "Talent profile not found" });
    }

    if (rows.affectedRows > 0) {
      return res.status(200).send({ message: "Profile updated successfully" });
    } else {
      return res.status(500).send({ message: "Failed to update profile" });
    }
  } catch (error) {
    console.error(error);
    return res.status(500).send({
      message: "An unexpected error occurred while updating your profile.",
      error,
    });
  }
};

exports.createPortifolio = async (req, res) => {
  const {
    title,
    description,
    technologies,
    github_url,
    image_url,
    project_url,
  } = req.body;
  try {
    if (!title) {
      return res.status(400).json({
        message: "Title is required",
      });
    }
    const [row0] = await db.query(
      "Select * from Protifolio where user_id = ?",
      [req.user.id],
    );

    if (row0.length > 0) {
      return res.status(400).json({
        message: "You already have a portifolio",
      });
    }
    const values = {
      title,
      description,
      technologies: JSON.stringify(technologies),
      github_url,
      image_url,
      project_url,
      user_id: req.user.id,
    };
    const [row1] = await db.query("INSERT INTO Protifolio SET ?", values);

    return res.status(201).json({
      message: "Portifolio created successfully",
      data: row1,
    });
  } catch (error) {
    return res.status(500).json({
      message: "An unexpected error occurred while creating your portifolio.",
      error,
    });
  }
};

const getPOrtifoilioById = async (id) => {
  const query = "select * from Protifolio where user_id = ?";

  const [row] = await db.query(query, [id]);
  return row;
};

exports.getPortifolio = async (req, res) => {
  try {
    const portifolio = await getPOrtifoilioById(req.user.id);
    if (!portifolio) {
      return res.status(404).json({
        message: "Portifolio not found",
      });
    }
    return res.status(200).json({
      message: "Portifolio retrieved successfully",
      data: portifolio,
    });
  } catch (error) {
    return res.status(500).json({
      message: "An unexpected error occurred while retrieving your portifolio.",
      error,
    });
  }
};

exports.updatePortifolio = async (req, res) => {
  const updateData = {
    title,
    description,
    technologies,
    github_url,
    image_url,
    project_url,
  };
  try {
    const fields = [];
    const values = [];

    for (let key in updateData) {
      if (updateData.includes(key)) {
        fields.push(`${key} = ?`);
        values.push(req.body[key]);
      }
    }

    fields.push("updated_at = NOW()");

    const sql = `update portifolio set ${fields.join(", ")} where user_id = ?`;
    values.push(req.user.id);

    const [row] = await db.query(sql, values);

    if (!row) {
      return res.status(404).json({
        message: "Portifolio not found",
      });
    }
    return res.status(200).json({
      message: "Portifolio updated successfully",
      data: row,
    });
  } catch (error) {
    return res.status(500).json({
      message: "An unexpected error occurred while updating your portifolio.",
      error,
    });
  }
};

exports.deletePortifolio = async (req, res) => {
  try {
    const [row] = await db.query(
      "DELETE FROM Protifolio WHERE user_id = ? and id = ?",
      [req.user.id, req.params.id],
    );
    if (!row) {
      return res.status(404).json({
        message: "Portifolio not found",
      });
    }
    return res.status(200).json({
      message: "Portifolio deleted successfully",
      data: row,
    });
  } catch (error) {
    return res.status(500).json({
      message: "An unexpected error occurred while deleting your portifolio.",
      error,
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
      "select * from applications where jod_id = ? and talent_id = ?";
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
    const sql2 =
      "insert into applications (jod_id , talent_id , cover_letter) values (? , ? , ?)";
    const [application] = await db.query(sql2, [jobId.id, user, cover_letter]);
    if (!application) {
      return res.status(500).json({
        message: "An unexpected error occurred while applying for the job.",
      });
    }
    return res.status(200).json({
      message: "Application submitted successfully",
      data: application,
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

    await db.query(
      "INSERT INTO connections (sender_id, reciver_id) VALUES (?, ?)",
      [sender_id, receiver_id],
    );

    sendConnectionNotification(
      receiver[0].email,
      receiver[0].name,
      sender[0].name,
    );

    return res.status(200).json({ message: "Request sent successfully" });
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
    const [talent] = await db.query("select * from users where id = ? ", [
      user,
    ]);

    const reciver_id = talent[0].id;

    const [connections] = await db.query(
      "select * from connections where reciver_id = ? and status = 'pending'",
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

exports.talentsMessaging = async (req ,res) => {

  const {context} = req.bo
}
