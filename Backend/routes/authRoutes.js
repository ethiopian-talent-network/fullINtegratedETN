const express = require("express");
const router = express.Router();
const { authenticate } = require("../middlewares/authMiddleWare");
const RegisterController = require("../controllers/authControllers");

router.post("/signup", RegisterController.signup);
router.post("/verify-otp", RegisterController.verifyOTP);
router.post("/resend-otp", RegisterController.resendOTP);
router.post("/login", RegisterController.login);
router.post("/logout", RegisterController.logout);
router.get("/me", authenticate, (req, res) => {
  res.status(200).json({ id: req.user.id, role: req.user.role, email: req.user.email });
});

module.exports = router;
