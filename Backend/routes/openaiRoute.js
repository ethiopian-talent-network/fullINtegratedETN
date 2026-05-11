const express = require("express");
const router = express.Router();
const openaiController = require("../controllers/openaiController");

// Generate content (cover letter or proposal)
router.post("/generate", openaiController.generateContent);

// Improve existing content
router.post("/improve", openaiController.improveContent);

// Legacy chat endpoint
router.post("/", openaiController.chat);

module.exports = router;
