const axios = require("axios");
const express = require("express");
const router = express.Router();
const {authenticate} = require("../middlewares/authenticate");

router.post("/generate-cover-letter", authenticate, async (req, res) => {
  try{
    const {job ,company, skills , experience} = req.body;

    const aiResponse = await axios.post("http://localhost:8000/generate-cover-letter",{
        job,
        skills,
        company,
        experience
    })
    
    res.status(200).json({ message: "AI response", data: aiResponse.data });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal server error" });
  }
});

module.exports = router;