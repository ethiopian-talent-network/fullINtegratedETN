const express = require("express");
const router = express.Router();

const { addCategories } = require("../controllers/adminControllers");
const { authenticate } = require("../middlewares/authMiddleWare");
const { authorizeRole } = require("../middlewares/roleMiddleWare");

router.post("/categories", authenticate, authorizeRole("admin"), addCategories);

module.exports = router;
