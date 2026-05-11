const express = require("express");
const router = express.Router();
const { authenticate } = require("../middlewares/authMiddleWare");
const { authorizeRole } = require("../middlewares/roleMiddleWare");
const {
  getWorkConversations,
  getWorkMessages,
  sendWorkMessage,
  markWorkMessagesRead,
  getWorkUnreadCount
} = require("../controllers/employerTalentMessageController");

// Routes for both employers and talents
router.get("/unread-count", authenticate, authorizeRole("employer", "talent"), getWorkUnreadCount);
router.get("/conversations", authenticate, authorizeRole("employer", "talent"), getWorkConversations);
router.get("/:hiringId", authenticate, authorizeRole("employer", "talent"), getWorkMessages);
router.post("/send", authenticate, authorizeRole("employer", "talent"), sendWorkMessage);
router.patch("/:hiringId/read", authenticate, authorizeRole("employer", "talent"), markWorkMessagesRead);

module.exports = router;