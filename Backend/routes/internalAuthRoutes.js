const express = require("express");
const router = express.Router();
const { internalLogin } = require("../controllers/internalAuthController");

router.post("/login", internalLogin);

module.exports = router;
