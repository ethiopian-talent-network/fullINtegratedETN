const express = require("express");
const router = express.Router();

const { authenticate } = require("../middlewares/authMiddleWare");
const { authorizeRole } = require("../middlewares/roleMiddleWare");

const {
  createPayment,
  verfiyTransaction,
} = require("../controllers/paymentControllers");

router.post(
  "/initialize",
  authenticate,
  authorizeRole("employer"),
  createPayment,
);
router.post("/verify", verfiyTransaction);

module.exports = router;
