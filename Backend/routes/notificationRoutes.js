const express = require("express");
const router = express.Router();
const { authenticate } = require("../middlewares/authMiddleWare");
const {
  getNotifications,
  getEmployerNotifications,
  markAsRead,
  markAllRead,
  acceptConnection,
  declineConnection,
} = require("../controllers/notificationController");

router.get("/", authenticate, getNotifications);
router.get("/employer", authenticate, getEmployerNotifications);
router.post("/read-all", authenticate, markAllRead);
router.post("/:id/read", authenticate, markAsRead);
router.post("/accept/:connection_id", authenticate, acceptConnection);
router.post("/decline/:connection_id", authenticate, declineConnection);

module.exports = router;
