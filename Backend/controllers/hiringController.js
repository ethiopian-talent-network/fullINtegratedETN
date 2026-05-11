const db = require("../config/db");

// POST /api/hiring/hire - Hire a talent after payment completion
const hireTalent = async (req, res) => {
  const { talent_id, job_id, application_id } = req.body;
  const user_id = req.user.id;
  
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

    // Verify payment exists and is successful for this job
    const [paymentRows] = await connection.query(
      `SELECT p.* FROM payments p 
       JOIN escrow e ON p.transaction_id = e.treansaction_ref
       WHERE p.job_id = ? AND p.client_id = ? AND p.status = 'success' AND e.talent_id = ?`,
      [job_id, employer_id, talent_id]
    );

    if (paymentRows.length === 0) {
      await connection.rollback();
      return res.status(400).json({ message: "Payment must be completed before hiring" });
    }

    // Check if already hired
    const [existingHiring] = await connection.query(
      "SELECT id FROM hirings WHERE employer_id = ? AND talent_id = ? AND job_id = ?",
      [employer_id, talent_id, job_id]
    );

    if (existingHiring.length > 0) {
      await connection.rollback();
      return res.status(400).json({ message: "Talent already hired for this job" });
    }

    // Create hiring record
    const [hiringResult] = await connection.query(
      `INSERT INTO hirings (employer_id, talent_id, job_id, application_id, hired_at, status)
       VALUES (?, ?, ?, ?, NOW(), 'active')`,
      [employer_id, talent_id, job_id, application_id]
    );

    // Update application status to hired
    if (application_id) {
      await connection.query(
        "UPDATE applications SET status = 'hired' WHERE id = ?",
        [application_id]
      );
    }

    // Get talent user info for notification
    const [talentUser] = await connection.query(
      "SELECT user_id FROM talents WHERE id = ?",
      [talent_id]
    );

    // Get job and employer info for notification
    const [jobInfo] = await connection.query(
      "SELECT title FROM jobs WHERE id = ?",
      [job_id]
    );

    const [employerInfo] = await connection.query(
      `SELECT u.name, e.company_name FROM employers e 
       JOIN users u ON e.user_id = u.id WHERE e.id = ?`,
      [employer_id]
    );

    if (talentUser.length > 0 && jobInfo.length > 0 && employerInfo.length > 0) {
      const companyName = employerInfo[0].company_name || employerInfo[0].name;
      
      // Send notification to talent
      await connection.query(
        `INSERT INTO notifications (user_id, type, title, message, sender_user_id)
         VALUES (?, 'hired', ?, ?, ?)`,
        [
          talentUser[0].user_id,
          "Congratulations! You've been hired!",
          `${companyName} has hired you for "${jobInfo[0].title}". Payment has been secured in escrow.`,
          user_id
        ]
      );
    }

    await connection.commit();
    
    return res.status(201).json({ 
      message: "Talent hired successfully",
      hiring_id: hiringResult.insertId
    });

  } catch (error) {
    await connection.rollback();
    return res.status(500).json({ message: error.message });
  } finally {
    connection.release();
  }
};

// GET /api/hiring/my-hires - Get all talents hired by employer
const getMyHires = async (req, res) => {
  const user_id = req.user.id;
  
  try {
    // Get employer_id from user_id
    const [employerRows] = await db.query(
      "SELECT id FROM employers WHERE user_id = ?",
      [user_id]
    );
    
    if (employerRows.length === 0) {
      return res.status(404).json({ message: "Employer profile not found" });
    }
    
    const employer_id = employerRows[0].id;

    const [hires] = await db.query(
      `SELECT 
        h.id as hiring_id,
        h.hired_at,
        h.status as hiring_status,
        t.id as talent_id,
        u.name as talent_name,
        u.email as talent_email,
        u.profile_image,
        j.id as job_id,
        j.title as job_title,
        j.budget_min,
        j.budget_max,
        j.currency
       FROM hirings h
       JOIN talents t ON h.talent_id = t.id
       JOIN users u ON t.user_id = u.id
       JOIN jobs j ON h.job_id = j.id
       WHERE h.employer_id = ?
       ORDER BY h.hired_at DESC`,
      [employer_id]
    );

    return res.status(200).json({ hires });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

// GET /api/hiring/my-employers - Get all employers who hired this talent
const getMyEmployers = async (req, res) => {
  const user_id = req.user.id;
  
  try {
    // Get talent_id from user_id
    const [talentRows] = await db.query(
      "SELECT id FROM talents WHERE user_id = ?",
      [user_id]
    );
    
    if (talentRows.length === 0) {
      return res.status(404).json({ message: "Talent profile not found" });
    }
    
    const talent_id = talentRows[0].id;

    const [employers] = await db.query(
      `SELECT 
        h.id as hiring_id,
        h.hired_at,
        h.status as hiring_status,
        e.id as employer_id,
        u.name as employer_name,
        u.email as employer_email,
        u.profile_image,
        e.company_name,
        j.id as job_id,
        j.title as job_title,
        j.budget_min,
        j.budget_max,
        j.currency
       FROM hirings h
       JOIN employers e ON h.employer_id = e.id
       JOIN users u ON e.user_id = u.id
       JOIN jobs j ON h.job_id = j.id
       WHERE h.talent_id = ?
       ORDER BY h.hired_at DESC`,
      [talent_id]
    );

    return res.status(200).json({ employers });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

module.exports = {
  hireTalent,
  getMyHires,
  getMyEmployers
};