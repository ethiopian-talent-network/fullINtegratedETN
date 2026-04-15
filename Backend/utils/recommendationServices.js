const db = require("../config/db").promise();

exports.getRecommendedJobs = async (req, res) => {
  try {
    const userId = req.user.id;

    const matchingQuery = `
      SELECT
        j.id,
        j.title,
        j.discription,
        j.salary,
        j.experience_level,
        COUNT(js.skill_id) AS match_score,
        GROUP_CONCAT(s.skill_name) AS matched_skills
      FROM jobs j
      JOIN job_skills js ON j.id = js.job_id
      JOIN talent_skills ts ON js.skill_id = ts.skill_id
      JOIN skills s ON ts.skill_id = s.id
      JOIN talents t ON ts.talent_id = t.id
      WHERE t.user_id = ? AND j.status = 'active'
      GROUP BY j.id
      ORDER BY match_score DESC
      LIMIT 20;
    `;

    const [recommendedJobs] = await db.query(matchingQuery, [userId]);

    const formattedJobs = recommendedJobs.map((job) => ({
      ...job,
      matched_skills: job.matched_skills ? job.matched_skills.split(",") : [],
    }));

    return res.status(200).json({
      success: true,
      data: formattedJobs,
    });
  } catch (error) {
    console.error("Recommendation Error:", error);
    return res.status(500).json({
      message: "Could not fetch recommendations",
      error: error.message,
    });
  }
};
