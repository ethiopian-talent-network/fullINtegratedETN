const express = require("express");
const router = express.Router();
const openaiController = require("../controllers/openaiController"); // CommonJS require

// Access the .chat function from the required object
router.post("/", openaiController.chat);

module.exports = router; // CommonJS export
