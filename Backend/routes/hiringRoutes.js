const express = require("express");
const router = express.Router();
const { authenticate } = require("../middlewares/authMiddleWare");
const { authorizeRole } = require("../middlewares/roleMiddleWare");
const {
  hireTalent,
  getMyHires,
  getMyEmployers
} = require("../controllers/hiringController");

// Employer routes
router.post("/hire", authenticate, authorizeRole("employer"), hireTalent);
router.get("/my-hires", authenticate, authorizeRole("employer"), getMyHires);

// Talent routes
router.get("/my-employers", authenticate, authorizeRole("talent"), getMyEmployers);

module.exports = router;