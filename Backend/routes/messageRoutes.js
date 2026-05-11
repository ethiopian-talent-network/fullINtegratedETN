const express = require("express");
const router = express.Router();
const { authenticate } = require("../middlewares/authMiddleWare");
const { authorizeRole } = require("../middlewares/roleMiddleWare");
const {
  getConversations,
  getMessages,
  sendMessage,
  markMessagesRead,
  getUnreadCount
} = require("../controllers/messageController");

// All routes require authentication and talent role
router.get("/unread-count", authenticate, authorizeRole("talent"), getUnreadCount);
router.get("/conversations", authenticate, authorizeRole("talent"), getConversations);
router.get("/", authenticate, authorizeRole("talent"), getMessages);
router.post("/send", authenticate, authorizeRole("talent"), sendMessage);
router.patch("/:sender_id/read", authenticate, authorizeRole("talent"), markMessagesRead);

module.exports = router;
