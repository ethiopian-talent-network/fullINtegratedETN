const express = require("express");
const router = express.Router();
const { authenticate } = require("../middlewares/authMiddleWare");
const { authorizeRoles } = require("../middlewares/roleMiddleWare");
const { 
  rateLimiter, 
  sanitizeInput, 
  validateAdminAction, 
  auditLog 
} = require("../middlewares/securityMiddleware");
const {
  addCategories,
  getDashboard,
  getUsers,
  createOwner,
  toggleUser,
  deleteUser,
  getVerificationRequests,
  reviewVerificationRequest,
  getTalentProfileForAdmin,
  getLicenseRequests,
  reviewLicenseRequest,
  getAllPayments,
} = require("../controllers/adminControllers");

const admin = [authenticate, authorizeRoles("admin", "owner"), sanitizeInput];
const adminWithAudit = (action) => [...admin, auditLog(action)];
const adminRateLimit = rateLimiter({ windowMs: 5 * 60 * 1000, max: 50 }); // 50 requests per 5 minutes

router.post("/categories", adminRateLimit, ...adminWithAudit('ADD_CATEGORY'), addCategories);
router.get("/dashboard", ...admin, getDashboard);
router.get("/users", ...admin, getUsers);
router.post("/create-owner", adminRateLimit, ...adminWithAudit('CREATE_OWNER'), createOwner);
router.patch("/users/:id/toggle", adminRateLimit, ...adminWithAudit('TOGGLE_USER'), toggleUser);
router.delete("/users/:id", adminRateLimit, ...adminWithAudit('DELETE_USER'), deleteUser);
router.get("/verification-requests", ...admin, getVerificationRequests);
router.patch("/verification-requests/:id", adminRateLimit, validateAdminAction, ...adminWithAudit('REVIEW_VERIFICATION'), reviewVerificationRequest);
router.get("/talent-profile/:userId", ...admin, getTalentProfileForAdmin);
router.get("/license-requests", ...admin, getLicenseRequests);
router.patch("/license-requests/:id", adminRateLimit, validateAdminAction, ...adminWithAudit('REVIEW_LICENSE'), reviewLicenseRequest);
router.get("/payments", ...admin, getAllPayments);

module.exports = router;
