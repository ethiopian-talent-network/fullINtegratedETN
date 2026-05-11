const db = require("../config/db");
const axios = require("axios");

// Resolves an array of skill names or IDs into integer skill IDs.
// If a skill name doesn't exist it gets created automatically.
const resolveSkillIds = async (connection, skills) => {
  const ids = [];
  for (const skill of skills) {
    if (typeof skill === "number" || (typeof skill === "string" && /^\d+$/.test(skill))) {
      ids.push(parseInt(skill));
    } else {
      const name = String(skill).trim();
      if (!name) continue;
      const [existing] = await connection.query(
        "SELECT id FROM skills WHERE skill_name = ?",
        [name],
      );
      if (existing.length > 0) {
        ids.push(existing[0].id);
      } else {
        const [inserted] = await connection.query(
          "INSERT INTO skills (skill_name) VALUES (?)",
          [name],
        );
        ids.push(inserted.insertId);
      }
    }
  }
  return ids;
};

// Get all categories
exports.categories = async (req, res) => {
  try {
    const sql = "SELECT * FROM categories ORDER BY name ASC";
    const [rows] = await db.query(sql);

    return res.status(200).json({
      message: "Categories retrieved successfully",
      data: rows,
    });
  } catch (error) {
    console.error("Error fetching categories:", error);
    return res.status(500).json({
      message: "An unexpected error occurred while fetching categories.",
      error: error.message,
    });
  }
};

// Get all jobs with pagination and filtering
exports.getAllJobs = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 20,
      category,
      experience,
      search,
      sortBy = "id",
      sortOrder = "DESC",
    } = req.query;

    const offset = (page - 1) * limit;

    // Build WHERE clause for filtering
    let whereClause = "WHERE 1=1";
    const params = [];

    if (category) {
      whereClause += " AND j.category_id = ?";
      params.push(category);
    }

    if (experience) {
      whereClause += " AND j.experience_level = ?";
      params.push(experience);
    }

    if (search) {
      whereClause += " AND (j.title LIKE ? OR j.discription LIKE ?)";
      params.push(`%${search}%`, `%${search}%`);
    }

    // Build ORDER BY clause
    const validSortFields = ["id", "title", "salary", "created_at"];
    const sortField = validSortFields.includes(sortBy) ? sortBy : "id";
    const sortDirection = sortOrder.toUpperCase() === "ASC" ? "ASC" : "DESC";
    const orderClause = `ORDER BY j.${sortField} ${sortDirection}`;

    // Get total count for pagination
    const countQuery = `
      SELECT COUNT(*) as total
      FROM jobs j
      ${whereClause}
    `;
    const [countResult] = await db.query(countQuery, params);
    const totalJobs = countResult[0].total;

    // Get jobs with skills and employer info
    const jobsQuery = `
      SELECT
        j.id,
        j.title,
        j.discription as description,
        j.salary,
        j.budget_type,
        j.experience_level as experience,
        j.status,
        j.created_at,
        j.token_cost,
        e.company_name as company,
        e.company_discription as companyDescription,
        e.website,
        e.location as companyLocation,
        e.is_verified as employerVerified,
        c.name as category,
        (SELECT COUNT(*) FROM applications a WHERE a.job_id = j.id) as applicants
      FROM jobs j
      JOIN employers e ON j.employer_id = e.id
      LEFT JOIN categories c ON j.category_id = c.id
      ${whereClause}
      ${orderClause}
      LIMIT ? OFFSET ?
    `;

    const [jobs] = await db.query(jobsQuery, [
      ...params,
      parseInt(limit),
      offset,
    ]);

    // Get skills for each job
    const jobsWithSkills = await Promise.all(
      jobs.map(async (job) => {
        const [skills] = await db.query(
          `
          SELECT s.skill_name as name
          FROM job_skills js
          JOIN skills s ON js.skill_id = s.id
          WHERE js.job_id = ?
        `,
          [job.id],
        );

        return {
          ...job,
          skills: skills.map((s) => s.name),
          budget:
            job.budget_type === "fixed"
              ? `$${job.salary}`
              : `$${job.salary}/hour`,
          duration: "Project-based", // Default value, can be added to DB later
          location: job.companyLocation || "Remote", // Use employer location as job location
          remote: true, // Default to remote since no remote column exists
          posted: job.created_at, // Use created_at as posted date
          match: Math.floor(Math.random() * 30) + 70, // Temporary match calculation
          status: "new", // Default status for frontend
          companyLogo: null, // Can be added later
          featured: Math.random() > 0.8, // Random featured jobs
          urgent: job.token_cost > 5, // Mark high token cost jobs as urgent
          verified: !!job.employerVerified, // Add verified badge
        };
      }),
    );

    res.json({
      jobs: jobsWithSkills,
      pagination: {
        current: parseInt(page),
        pageSize: parseInt(limit),
        total: totalJobs,
        pages: Math.ceil(totalJobs / limit),
      },
    });
  } catch (error) {
    console.error("Error fetching jobs:", error);
    res.status(500).json({
      message: "Error fetching jobs",
      error: error.message,
    });
  }
};

// Get job by ID
exports.getJobById = async (req, res) => {
  try {
    const { id } = req.params;

    const jobQuery = `
      SELECT
        j.id,
        j.title,
        j.discription as description,
        j.salary,
        j.budget_type,
        j.experience_level as experience,
        j.status,
        j.created_at,
        j.token_cost,
        e.company_name as company,
        e.company_discription as companyDescription,
        e.website,
        e.location as companyLocation,
        e.is_verified as employerVerified,
        c.name as category,
        (SELECT COUNT(*) FROM applications a WHERE a.job_id = j.id) as applicants
      FROM jobs j
      JOIN employers e ON j.employer_id = e.id
      LEFT JOIN categories c ON j.category_id = c.id
      WHERE j.id = ? AND j.status = 'active'
    `;

    const [jobs] = await db.query(jobQuery, [id]);

    if (jobs.length === 0) {
      return res.status(404).json({ message: "Job not found" });
    }

    const job = jobs[0];

    // Get skills for the job
    const [skills] = await db.query(
      `
      SELECT s.skill_name as name
      FROM job_skills js
      JOIN skills s ON js.skill_id = s.id
      WHERE js.job_id = ?
    `,
      [id],
    );

    const jobWithSkills = {
      ...job,
      skills: skills.map((s) => s.name),
      budget:
        job.budget_type === "fixed" ? `$${job.salary}` : `$${job.salary}/hour`,
      duration: "Project-based",
      location: job.companyLocation || "Remote",
      remote: true,
      posted: job.created_at,
      match: Math.floor(Math.random() * 30) + 70,
      status: "new",
      companyLogo: null,
      featured: Math.random() > 0.8,
      urgent: job.token_cost > 5,
      verified: !!job.employerVerified,
    };

    res.json(jobWithSkills);
  } catch (error) {
    console.error("Error fetching job:", error);
    res.status(500).json({
      message: "Error fetching job",
      error: error.message,
    });
  }
};

// Get jobs by category
exports.getJobsByCategory = async (req, res) => {
  try {
    const { categoryId } = req.params;
    const { page = 1, limit = 20 } = req.query;
    const offset = (page - 1) * limit;

    const jobsQuery = `
      SELECT
        j.id,
        j.title,
        j.discription as description,
        j.salary,
        j.budget_type,
        j.experience_level as experience,
        j.status,
        j.created_at,
        j.token_cost,
        e.company_name as company,
        e.location as companyLocation,
        c.name as category,
        (SELECT COUNT(*) FROM applications a WHERE a.job_id = j.id) as applicants
      FROM jobs j
      JOIN employers e ON j.employer_id = e.id
      LEFT JOIN categories c ON j.category_id = c.id
      WHERE j.category_id = ? AND j.status = "active"
      ORDER BY j.created_at DESC
      LIMIT ? OFFSET ?
    `;

    const [jobs] = await db.query(jobsQuery, [
      categoryId,
      parseInt(limit),
      offset,
    ]);

    // Get skills for each job
    const jobsWithSkills = await Promise.all(
      jobs.map(async (job) => {
        const [skills] = await db.query(
          `
          SELECT s.skill_name as name
          FROM job_skills js
          JOIN skills s ON js.skill_id = s.id
          WHERE js.job_id = ?
        `,
          [job.id],
        );

        return {
          ...job,
          skills: skills.map((s) => s.name),
          budget:
            job.budget_type === "fixed"
              ? `$${job.salary}`
              : `$${job.salary}/hour`,
          duration: "Project-based",
          location: job.companyLocation || "Remote",
          remote: true,
          posted: job.created_at,
          match: Math.floor(Math.random() * 30) + 70,
          status: "new",
          companyLogo: null,
          featured: Math.random() > 0.8,
          urgent: job.token_cost > 5,
          verified: !!job.employerVerified,
        };
      }),
    );

    res.json({
      jobs: jobsWithSkills,
      categoryId,
      pagination: {
        current: parseInt(page),
        pageSize: parseInt(limit),
      },
    });
  } catch (error) {
    console.error("Error fetching jobs by category:", error);
    res.status(500).json({
      message: "Error fetching jobs by category",
      error: error.message,
    });
  }
};

// Get most recent jobs
exports.getRecentJobs = async (req, res) => {
  try {
    const { limit = 20 } = req.query;

    const [jobs] = await db.query(
      `SELECT
        j.id, j.title, j.discription as description, j.salary, j.budget_type,
        j.experience_level as experience, j.status, j.created_at, j.token_cost,
        e.company_name as company, e.location as companyLocation, e.is_verified as employerVerified,
        c.name as category,
        (SELECT COUNT(*) FROM applications a WHERE a.job_id = j.id) as applicants
      FROM jobs j
      JOIN employers e ON j.employer_id = e.id
      LEFT JOIN categories c ON j.category_id = c.id
      WHERE j.status = 'active'
      ORDER BY j.created_at DESC
      LIMIT ?`,
      [parseInt(limit)]
    );

    const jobsWithSkills = await Promise.all(
      jobs.map(async (job) => {
        const [skills] = await db.query(
          `SELECT s.skill_name as name FROM job_skills js
           JOIN skills s ON js.skill_id = s.id WHERE js.job_id = ?`,
          [job.id]
        );
        return {
          ...job,
          skills: skills.map((s) => s.name),
          budget: job.budget_type === "fixed" ? `$${job.salary}` : `$${job.salary}/hour`,
          duration: "Project-based",
          location: job.companyLocation || "Remote",
          remote: true,
          posted: job.created_at,
          match: Math.floor(Math.random() * 30) + 70,
          status: "new",
          companyLogo: null,
          featured: Math.random() > 0.8,
          urgent: job.token_cost > 5,
          applicants: parseInt(job.applicants) || 0,
          verified: !!job.employerVerified,
        };
      })
    );

    res.json(jobsWithSkills);
  } catch (error) {
    console.error("Error fetching recent jobs:", error);
    res.status(500).json({ message: "Error fetching recent jobs", error: error.message });
  }
};

// Get saved jobs for a talent
exports.getSavedJobs = async (req, res) => {
  try {
    // Check if user is authenticated
    if (!req.user || !req.user.id) {
      return res
        .status(401)
        .json({ message: "Unauthorized - Please login to view saved jobs" });
    }

    const talentId = req.user.id;

    // Simple query for saved jobs
    const [savedJobs] = await db.query(
      `
      SELECT
        j.id, j.title, j.discription as description, j.salary, j.budget_type,
        j.experience_level as experience, j.status, j.created_at, j.token_cost,
        e.company_name as company, e.location as companyLocation,
        c.name as category,
        (SELECT COUNT(*) FROM applications a2 WHERE a2.job_id = j.id) as applicants,
        sj.saved_at
      FROM saved_jobs sj
      JOIN jobs j ON sj.job_id = j.id
      JOIN employers e ON j.employer_id = e.id
      LEFT JOIN categories c ON j.category_id = c.id
      WHERE sj.talent_id = ?
      ORDER BY sj.saved_at DESC
    `,
      [talentId],
    );

    const formattedJobs = await Promise.all(
      savedJobs.map(async (job) => {
        const [skills] = await db.query(
          `SELECT s.skill_name as name FROM job_skills js
           JOIN skills s ON js.skill_id = s.id WHERE js.job_id = ?`,
          [job.id]
        );
        return {
          ...job,
          skills: skills.map((s) => s.name),
          budget: job.budget_type === "fixed" ? `$${job.salary}` : `$${job.salary}/hour`,
          duration: "Project-based",
          location: "Remote",
          remote: true,
          posted: job.created_at,
          match: Math.floor(Math.random() * 30) + 70,
          status: "saved",
          companyLogo: null,
          featured: Math.random() > 0.8,
          urgent: job.token_cost > 5,
          company: job.company || "Company",
          category: job.category || "Category",
          applicants: parseInt(job.applicants) || 0,
          verified: !!job.employerVerified,
        };
      })
    );

    res.json(formattedJobs);
  } catch (error) {
    console.error("Error fetching saved jobs:", error);
    res.status(500).json({ message: "Error fetching saved jobs", error: error.message });
  }
};

// Get applied jobs for a talent
exports.getAppliedJobs = async (req, res) => {
  try {
    // Check if user is authenticated
    if (!req.user || !req.user.id) {
      return res
        .status(401)
        .json({ message: "Unauthorized - Please login to view applied jobs" });
    }

    const talentId = req.user.id;

    // Simple query for applied jobs
    const [appliedJobs] = await db.query(
      `
      SELECT
        j.id, j.title, j.discription as description, j.salary, j.budget_type,
        j.experience_level as experience, j.status, j.created_at, j.token_cost,
        e.company_name as company, e.location as companyLocation, e.is_verified as employerVerified,
        c.name as category,
        (SELECT COUNT(*) FROM applications a2 WHERE a2.job_id = j.id) as applicants,
        a.status as applicationStatus, a.applied_at, p.cover_letter
      FROM applications a
      JOIN jobs j ON a.job_id = j.id
      JOIN employers e ON j.employer_id = e.id
      LEFT JOIN categories c ON j.category_id = c.id
      LEFT JOIN proposals p ON a.id = p.application_id
      WHERE a.talent_id = ?
      ORDER BY a.applied_at DESC
    `,
      [talentId],
    );

    const formattedJobs = await Promise.all(
      appliedJobs.map(async (job) => {
        const [skills] = await db.query(
          `SELECT s.skill_name as name FROM job_skills js
           JOIN skills s ON js.skill_id = s.id WHERE js.job_id = ?`,
          [job.id]
        );
        return {
          ...job,
          skills: skills.map((s) => s.name),
          budget: job.budget_type === "fixed" ? `$${job.salary}` : `$${job.salary}/hour`,
          duration: "Project-based",
          location: "Remote",
          remote: true,
          posted: job.created_at,
          match: Math.floor(Math.random() * 30) + 70,
          status: "applied",
          companyLogo: null,
          featured: Math.random() > 0.8,
          urgent: job.token_cost > 5,
          company: job.company || "Company",
          category: job.category || "Category",
          applicants: parseInt(job.applicants) || 0,
          verified: !!job.employerVerified,
        };
      })
    );

    res.json(formattedJobs);
  } catch (error) {
    console.error("Error fetching applied jobs:", error);
    res.status(500).json({ message: "Error fetching applied jobs", error: error.message });
  }
};

// Save a job
exports.saveJob = async (req, res) => {
  try {
    const { jobId } = req.params;

    // Check if user is authenticated
    if (!req.user || !req.user.id) {
      return res
        .status(401)
        .json({ message: "Unauthorized - Please login to save jobs" });
    }

    const talentId = req.user.id;

    // Validate jobId
    if (!jobId || isNaN(parseInt(jobId))) {
      return res.status(400).json({ message: "Invalid job ID" });
    }

    // Check if job exists
    const [job] = await db.query("SELECT id FROM jobs WHERE id = ?", [jobId]);
    if (job.length === 0) {
      return res.status(404).json({ message: "Job not found" });
    }

    // Check if already saved
    const [existing] = await db.query(
      "SELECT id FROM saved_jobs WHERE talent_id = ? AND job_id = ?",
      [talentId, jobId],
    );

    if (existing.length > 0) {
      return res.status(200).json({ 
        message: "Job is already saved", 
        alreadySaved: true 
      });
    }

    // Save the job
    await db.query(
      "INSERT INTO saved_jobs (talent_id, job_id, saved_at) VALUES (?, ?, NOW())",
      [talentId, jobId],
    );

    res.json({ 
      message: "Job saved successfully", 
      success: true 
    });
  } catch (error) {
    console.error("Error saving job:", error);
    
    // Handle duplicate entry error gracefully
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(200).json({ 
        message: "Job is already saved", 
        alreadySaved: true 
      });
    }
    
    res.status(500).json({
      message: "Error saving job",
      error: error.message,
    });
  }
};

// Toggle save/unsave a job
exports.toggleSaveJob = async (req, res) => {
  try {
    const { jobId } = req.params;

    // Check if user is authenticated
    if (!req.user || !req.user.id) {
      return res
        .status(401)
        .json({ message: "Unauthorized - Please login to save jobs" });
    }

    const talentId = req.user.id;

    // Validate jobId
    if (!jobId || isNaN(parseInt(jobId))) {
      return res.status(400).json({ message: "Invalid job ID" });
    }

    // Check if job exists
    const [job] = await db.query("SELECT id FROM jobs WHERE id = ?", [jobId]);
    if (job.length === 0) {
      return res.status(404).json({ message: "Job not found" });
    }

    // Check if already saved
    const [existing] = await db.query(
      "SELECT id FROM saved_jobs WHERE talent_id = ? AND job_id = ?",
      [talentId, jobId],
    );

    if (existing.length > 0) {
      // Job is saved, so unsave it
      await db.query(
        "DELETE FROM saved_jobs WHERE talent_id = ? AND job_id = ?",
        [talentId, jobId],
      );
      return res.json({ 
        message: "Job unsaved successfully", 
        saved: false 
      });
    } else {
      // Job is not saved, so save it
      await db.query(
        "INSERT INTO saved_jobs (talent_id, job_id, saved_at) VALUES (?, ?, NOW())",
        [talentId, jobId],
      );
      return res.json({ 
        message: "Job saved successfully", 
        saved: true 
      });
    }
  } catch (error) {
    console.error("Error toggling job save:", error);
    
    // Handle duplicate entry error gracefully
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(200).json({ 
        message: "Job is already saved", 
        saved: true 
      });
    }
    
    res.status(500).json({
      message: "Error toggling job save",
      error: error.message,
    });
  }
};

// Check if a job is saved by the current user
exports.checkJobSaved = async (req, res) => {
  try {
    const { jobId } = req.params;

    // Check if user is authenticated
    if (!req.user || !req.user.id) {
      return res.status(200).json({ saved: false });
    }

    const talentId = req.user.id;

    // Check if job is saved
    const [existing] = await db.query(
      "SELECT id FROM saved_jobs WHERE talent_id = ? AND job_id = ?",
      [talentId, jobId],
    );

    res.json({ saved: existing.length > 0 });
  } catch (error) {
    console.error("Error checking job saved status:", error);
    res.status(500).json({
      message: "Error checking job saved status",
      error: error.message,
    });
  }
};

// Delete a job
exports.deleteJob = async (req, res) => {
  const { id } = req.params;
  const employerId = req.user.id;

  try {
    // Step 1: Delete proposals referencing applications for this job
    await db.query(
      `DELETE FROM proposals
       WHERE application_id IN (
         SELECT id FROM applications WHERE job_id = ?
       )`,
      [id],
    );

    // Step 2: Delete applications for this job
    await db.query(
      "DELETE FROM applications WHERE job_id = ? AND employer_id = ?",
      [id, employerId],
    );

    // Step 3: Delete payments for this job
    await db.query("DELETE FROM payments WHERE job_id = ?", [id]);

    // Step 4: Delete the job
    await db.query("DELETE FROM jobs WHERE id = ? AND employer_id = ?", [
      id,
      employerId,
    ]);

    res.status(200).json({
      message: "Job deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting job:", error);
    res.status(500).json({
      message: "Error deleting job",
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

    const talentText = `${talent.about || ""}
Skills: ${talentSkills.join(
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

// Get personalized job recommendations (simplified version without AI)
exports.getPersonalizedJobs = async (req, res) => {
  const connection = await db.getConnection();
  const user = req.user.id;

  try {
    // Get talent skills
    const [talentRows] = await connection.query(
      `
      SELECT
        COALESCE(GROUP_CONCAT(s.skill_name SEPARATOR ', '), '') AS skills
      FROM talents t
      LEFT JOIN talent_skills ts ON t.id = ts.talent_id
      LEFT JOIN skills s ON ts.skill_id = s.id
      WHERE t.user_id = ?
      GROUP BY t.id
      `,
      [user],
    );

    const talentSkills = talentRows[0]?.skills
      ? talentRows[0].skills.split(",")
      : [];

    if (talentSkills.length === 0) {
      return res.status(200).json({
        message:
          "No skills found. Add skills to get personalized recommendations.",
        data: { jobs: [], total: 0 },
      });
    }

    // Get jobs that match talent skills
    const [matchingJobs] = await connection.query(
      `
      SELECT DISTINCT j.*, e.company_name,
        COUNT(js.skill_id) as matched_skills_count
      FROM jobs j
      JOIN employers e ON j.employer_id = e.id
      LEFT JOIN job_skills js ON j.id = js.job_id
      LEFT JOIN skills s ON js.skill_id = s.id
      WHERE j.status = 'active'
        AND s.skill_name IN (?)
      GROUP BY j.id
      HAVING matched_skills_count > 0
      ORDER BY matched_skills_count DESC, j.created_at DESC
      LIMIT 20
      `,
      [talentSkills],
    );

    // Get skills for each job
    const jobsWithSkills = await Promise.all(
      matchingJobs.map(async (job) => {
        const [skillRows] = await connection.query(
          `
          SELECT s.skill_name
          FROM job_skills js
          JOIN skills s ON s.id = js.skill_id
          WHERE js.job_id = ?
          `,
          [job.id],
        );

        // Calculate match percentage
        const jobSkills = skillRows.map((r) => r.skill_name);
        const commonSkills = talentSkills.filter((skill) =>
          jobSkills.includes(skill),
        );
        const matchPercentage =
          jobSkills.length > 0
            ? Math.round((commonSkills.length / jobSkills.length) * 100)
            : 0;

        return {
          ...job,
          skills: jobSkills,
          matchScore: matchPercentage / 100,
          matchPercentage,
          // Add default values for frontend compatibility
          location: job.location || "Remote",
          remote: job.remote || false,
          budget: job.salary || "Negotiable",
          company: job.company_name || "Company",
          applicants: job.applicants || 0,
          posted: job.created_at || new Date().toISOString(),
          status: "new",
        };
      }),
    );

    res.status(200).json({
      message: "Personalized jobs retrieved successfully",
      data: {
        jobs: jobsWithSkills,
        total: jobsWithSkills.length,
      },
    });
  } catch (error) {
    console.error("Error getting personalized jobs:", error);
    res.status(500).json({
      message: "Error retrieving personalized jobs",
      error: error.message,
    });
  } finally {
    connection.release();
  }
};

// Employer Job Management Functions

// Create a new job (employer only)
exports.createJob = async (req, res) => {
  try {
    if (!req.user || !req.user.id) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    // Check if user is an employer and is verified
    const [employer] = await db.query(
      "SELECT id, is_verified FROM employers WHERE user_id = ?",
      [req.user.id],
    );

    if (employer.length === 0) {
      return res.status(403).json({ message: "Please complete your employer profile first" });
    }

    // Check if employer is verified
    if (!employer[0].is_verified) {
      return res.status(403).json({ 
        message: "Business license verification required. Please submit your business license for verification before posting jobs.",
        requiresLicense: true
      });
    }

    const {
      title,
      description,
      category_id,
      experience_level,
      salary,
      budget_type,
      duration,
      location,
      remote_allowed,
      skills,
    } = req.body;

    // Validate required fields
    if (
      !title ||
      !description ||
      !category_id ||
      !experience_level ||
      !salary ||
      !duration ||
      !location
    ) {
      return res
        .status(400)
        .json({ message: "Please provide all required fields" });
    }

    const connection = await db.getConnection();
    await connection.beginTransaction();

    try {
      // Sanitize inputs
      // Truncate title to 100 chars to fit database column
      const sanitizedTitle =
        title.length > 100 ? title.substring(0, 100) : title;

      // Parse salary - if it's a range like "1000-2000", take the max value
      let sanitizedSalary = salary;
      if (typeof salary === "string" && salary.includes("-")) {
        const parts = salary.split("-");
        sanitizedSalary = parseFloat(parts[1]) || parseFloat(parts[0]) || 0;
      } else {
        sanitizedSalary = parseFloat(salary) || 0;
      }

      // Insert job
      const [jobResult] = await connection.query(
        `INSERT INTO jobs (
          title, discription, category_id, experience_level, salary, budget_type,
          employer_id, status, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, 'active', NOW())`,
        [
          sanitizedTitle,
          description,
          category_id,
          experience_level,
          sanitizedSalary,
          budget_type || "fixed",
          employer[0].id,
        ],
      );

      const jobId = jobResult.insertId;

      // Insert skills if provided
      if (skills && skills.length > 0) {
        const resolvedSkillIds = await resolveSkillIds(connection, skills);
        if (resolvedSkillIds.length > 0) {
          const skillValues = resolvedSkillIds.map((skillId) => [jobId, skillId]);
          await connection.query(
            "INSERT INTO job_skills (job_id, skill_id) VALUES ?",
            [skillValues],
          );
        }
      }

      await connection.commit();

      res.status(201).json({
        message: "Job created successfully",
        job: {
          id: jobId,
          title,
          description,
          category_id,
          experience_level,
          salary,
          budget_type: budget_type || "fixed",
          duration,
          location,
          remote_allowed: remote_allowed || false,
          employer_id: employer[0].id,
          status: "active",
          created_at: new Date(),
        },
      });
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  } catch (error) {
    console.error("Error creating job:", error);
    res.status(500).json({
      message: "Error creating job",
      error: error.message,
    });
  }
};

// Get jobs posted by the current employer
exports.getEmployerJobs = async (req, res) => {
  try {
    if (!req.user || !req.user.id) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    // Check if user is an employer
    const [employer] = await db.query(
      "SELECT id FROM employers WHERE user_id = ?",
      [req.user.id],
    );

    if (employer.length === 0) {
      return res.status(200).json({ jobs: [], pagination: { total: 0, page: 1, limit: 20, has_next_page: false, has_prev_page: false } });
    }

    const { page = 1, limit = 20, status, search } = req.query;
    const offset = (page - 1) * limit;

    // Build WHERE clause
    let whereClause = "WHERE j.employer_id = ?";
    const params = [employer[0].id];

    if (status && status !== "all") {
      whereClause += " AND j.status = ?";
      params.push(status);
    }

    if (search) {
      whereClause += " AND (j.title LIKE ? OR j.discription LIKE ?)";
      params.push(`%${search}%`, `%${search}%`);
    }

    // Get jobs with applications count
    const [jobs] = await db.query(
      `
      SELECT
        j.*,
        c.name as category_name,
        COUNT(a.id) as applications_count
      FROM jobs j
      LEFT JOIN categories c ON j.category_id = c.id
      LEFT JOIN applications a ON j.id = a.job_id
      ${whereClause}
      GROUP BY j.id
      ORDER BY j.created_at DESC
      LIMIT ? OFFSET ?
    `,
      [...params, parseInt(limit), offset],
    );

    // Get total count
    const [countResult] = await db.query(
      `
      SELECT COUNT(DISTINCT j.id) as total
      FROM jobs j
      ${whereClause}
    `,
      params,
    );

    const total = countResult[0].total;

    res.status(200).json({
      message: "Jobs retrieved successfully",
      jobs,
      pagination: {
        current: parseInt(page),
        pageSize: parseInt(limit),
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Error getting employer jobs:", error);
    res.status(500).json({
      message: "Error retrieving jobs",
      error: error.message,
    });
  }
};

// Update a job (employer only)
exports.updateJob = async (req, res) => {
  try {
    if (!req.user || !req.user.id) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const { id } = req.params;
    const {
      title,
      description,
      category_id,
      experience_level,
      salary,
      budget_type,
      duration,
      location,
      remote_allowed,
      status,
      skills,
    } = req.body;

    const connection = await db.getConnection();
    await connection.beginTransaction();

    try {
      // Check if job belongs to this employer
      const [jobCheck] = await connection.query(
        `SELECT j.id, j.employer_id, e.user_id
         FROM jobs j
         JOIN employers e ON j.employer_id = e.id
         WHERE j.id = ? AND e.user_id = ?`,
        [id, req.user.id],
      );

      if (jobCheck.length === 0) {
        await connection.rollback();
        return res
          .status(404)
          .json({ message: "Job not found or unauthorized" });
      }

      // Update job
      const [updateResult] = await connection.query(
        `
        UPDATE jobs SET
          title = COALESCE(?, title),
          discription = COALESCE(?, discription),
          category_id = COALESCE(?, category_id),
          experience_level = COALESCE(?, experience_level),
          salary = COALESCE(?, salary),
          budget_type = COALESCE(?, budget_type),
          duration = COALESCE(?, duration),
          location = COALESCE(?, location),
          remote_allowed = COALESCE(?, remote_allowed),
          status = COALESCE(?, status),
          updated_at = NOW()
        WHERE id = ?
      `,
        [
          title,
          description,
          category_id,
          experience_level,
          salary,
          budget_type,
          duration,
          location,
          remote_allowed,
          status,
          id,
        ],
      );

      // Update skills if provided
      if (skills && Array.isArray(skills)) {
        // Remove existing skills
        await connection.query("DELETE FROM job_skills WHERE job_id = ?", [id]);

        // Add new skills
        if (skills.length > 0) {
          const resolvedSkillIds = await resolveSkillIds(connection, skills);
          if (resolvedSkillIds.length > 0) {
            const skillValues = resolvedSkillIds.map((skillId) => [id, skillId]);
            await connection.query(
              "INSERT INTO job_skills (job_id, skill_id) VALUES ?",
              [skillValues],
            );
          }
        }
      }

      await connection.commit();

      res.status(200).json({
        message: "Job updated successfully",
      });
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  } catch (error) {
    console.error("Error updating job:", error);
    res.status(500).json({
      message: "Error updating job",
      error: error.message,
    });
  }
};

// Delete a job (employer only)
exports.deleteJob = async (req, res) => {
  try {
    if (!req.user || !req.user.id) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const { id } = req.params;

    const connection = await db.getConnection();
    await connection.beginTransaction();

    try {
      // Check if job belongs to this employer
      const [jobCheck] = await connection.query(
        `SELECT j.id, j.employer_id, e.user_id
         FROM jobs j
         JOIN employers e ON j.employer_id = e.id
         WHERE j.id = ? AND e.user_id = ?`,
        [id, req.user.id],
      );

      if (jobCheck.length === 0) {
        await connection.rollback();
        return res
          .status(404)
          .json({ message: "Job not found or unauthorized" });
      }

      // Step 1: Get application IDs for this job
      const [applications] = await connection.query(
        "SELECT id FROM applications WHERE job_id = ?",
        [id],
      );

      // Step 2: Delete proposals referencing these applications
      if (applications.length > 0) {
        const appIds = applications.map((a) => a.id);
        await connection.query(
          "DELETE FROM proposals WHERE application_id IN (?)",
          [appIds],
        );
      }

      // Step 3: Delete applications for this job
      await connection.query("DELETE FROM applications WHERE job_id = ?", [id]);

      // Delete job skills
      await connection.query("DELETE FROM job_skills WHERE job_id = ?", [id]);

      // Delete payments for this job
      await connection.query("DELETE FROM payments WHERE job_id = ?", [id]);

      // Finally delete the job
      await connection.query("DELETE FROM jobs WHERE id = ?", [id]);

      await connection.commit();

      res.status(200).json({
        message: "Job deleted successfully",
      });
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  } catch (error) {
    console.error("Error deleting job:", error);
    res.status(500).json({
      message: "Error deleting job",
      error: error.message,
    });
  }
};

// Get job applications for employer
exports.getJobApplications = async (req, res) => {
  const { jobId } = req.params;
  const employerId = req.user.id;

  try {
    const [rows] = await db.query(
      `
      SELECT
        a.id AS application_id,
        a.status,
        a.applied_at,
        p.cover_letter,
        p.proposal,
        p.tokens_used,
        u.name AS talent_name,
        u.email
      FROM applications a
      JOIN jobs j ON a.job_id = j.id
      JOIN talents t ON a.talent_id = t.id
      JOIN users u ON t.user_id = u.id
      LEFT JOIN proposals p ON a.id = p.application_id
      WHERE a.job_id = ?
      AND j.employer_id = ?
      ORDER BY a.applied_at DESC
      `,
      [jobId, employerId],
    );

    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Update application status (employer only)
exports.updateApplicationStatus = async (req, res) => {
  try {
    if (!req.user || !req.user.id) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const { applicationId } = req.params;
    const { status } = req.body;

    if (
      !["pending", "reviewed", "shortlisted", "rejected", "hired"].includes(
        status,
      )
    ) {
      return res.status(400).json({ message: "Invalid status" });
    }

    const connection = await db.getConnection();
    await connection.beginTransaction();

    try {
      // Verify application belongs to this employer's job
      const [applicationCheck] = await connection.query(
        `SELECT a.id, a.job_id, j.employer_id, e.user_id
         FROM applications a
         JOIN jobs j ON a.job_id = j.id
         JOIN employers e ON j.employer_id = e.id
         WHERE a.id = ? AND e.user_id = ?`,
        [applicationId, req.user.id],
      );

      if (applicationCheck.length === 0) {
        await connection.rollback();
        return res.status(404).json({ message: "Application not found or unauthorized" });
      }

      const jobId = applicationCheck[0].job_id;

      if (status === "hired") {
        // Block if another application for this job is already hired
        const [alreadyHired] = await connection.query(
          "SELECT id FROM applications WHERE job_id = ? AND status = 'hired' AND id != ?",
          [jobId, applicationId],
        );

        if (alreadyHired.length > 0) {
          await connection.rollback();
          return res.status(409).json({
            message: "A talent has already been hired for this job. You cannot hire more than one applicant per job.",
          });
        }

        // Block hire if escrow is not funded
        const [escrowRows] = await connection.query(
          "SELECT id FROM escrow WHERE job_id = ? AND employer_id = ? AND status = 'funded'",
          [jobId, req.user.id],
        );

        if (escrowRows.length === 0) {
          await connection.rollback();
          return res.status(402).json({
            message: "Payment required. Please fund the escrow before hiring this talent.",
            payment_required: true,
            job_id: jobId,
          });
        }

        // Hire this application
        await connection.query(
          "UPDATE applications SET status = 'hired', updated_at = NOW() WHERE id = ?",
          [applicationId],
        );

        // Reject all other pending/reviewed/shortlisted applications for the same job
        await connection.query(
          `UPDATE applications
           SET status = 'rejected', updated_at = NOW()
           WHERE job_id = ? AND id != ? AND status NOT IN ('rejected', 'withdrawn')`,
          [jobId, applicationId],
        );

        // Close the job so no new applications come in
        await connection.query(
          "UPDATE jobs SET status = 'closed' WHERE id = ?",
          [jobId],
        );
      } else {
        // For any other status change, just update the single application
        await connection.query(
          "UPDATE applications SET status = ?, updated_at = NOW() WHERE id = ?",
          [status, applicationId],
        );
      }

      await connection.commit();

      res.status(200).json({
        message: status === "hired"
          ? "Talent hired successfully. All other applications have been rejected and the job is now closed."
          : "Application status updated successfully",
      });
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  } catch (error) {
    console.error("Error updating application status:", error);
    res.status(500).json({
      message: "Error updating application status",
      error: error.message,
    });
  }
};
