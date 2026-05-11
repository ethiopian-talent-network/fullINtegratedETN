const db = require("../config/db");

// GET /api/notifications/employer — employer-only notifications (new_application, license_result)
exports.getEmployerNotifications = async (req, res) => {
  const user_id = req.user.id;
  try {
    const [notifications] = await db.query(
      `SELECT n.id, n.type, n.title, n.message, n.is_read, n.created_at,
              u.name AS sender_name, u.profile_image AS sender_image
       FROM notifications n
       LEFT JOIN users u ON n.sender_user_id = u.id
       WHERE n.user_id = ?
         AND n.type IN ('new_application', 'license_result')
       ORDER BY n.created_at DESC
       LIMIT 30`,
      [user_id]
    );
    const unread_count = notifications.filter((n) => !n.is_read).length;
    return res.status(200).json({ notifications, unread_count });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

// GET /api/notifications — get all notifications for logged-in user
exports.getNotifications = async (req, res) => {
  const user_id = req.user.id;
  try {
    const [notifications] = await db.query(
      `SELECT n.id, n.type, n.title, n.message, n.connection_id,
              n.sender_talent_id, n.is_read, n.created_at,
              COALESCE(u_sender.name, u_talent.name) AS sender_name,
              COALESCE(u_sender.profile_image, u_talent.profile_image) AS sender_image
       FROM notifications n
       LEFT JOIN users u_sender ON n.sender_user_id = u_sender.id
       LEFT JOIN talents t ON n.sender_talent_id = t.id
       LEFT JOIN users u_talent ON t.user_id = u_talent.id
       WHERE n.user_id = ?
       ORDER BY n.created_at DESC
       LIMIT 50`,
      [user_id],
    );
    const unread_count = notifications.filter((n) => !n.is_read).length;
    return res.status(200).json({ notifications, unread_count });
  } catch (error) {
    return res.status(500).json({ message: "Failed to fetch notifications", error: error.message });
  }
};

// POST /api/notifications/:id/read — mark one as read
exports.markAsRead = async (req, res) => {
  const { id } = req.params;
  const user_id = req.user.id;
  try {
    await db.query(
      "UPDATE notifications SET is_read = 1 WHERE id = ? AND user_id = ?",
      [id, user_id],
    );
    return res.status(200).json({ message: "Marked as read" });
  } catch (error) {
    return res.status(500).json({ message: "Failed to mark as read", error: error.message });
  }
};

// POST /api/notifications/read-all — mark all as read
exports.markAllRead = async (req, res) => {
  const user_id = req.user.id;
  try {
    await db.query("UPDATE notifications SET is_read = 1 WHERE user_id = ?", [user_id]);
    return res.status(200).json({ message: "All marked as read" });
  } catch (error) {
    return res.status(500).json({ message: "Failed to mark all as read", error: error.message });
  }
};

// POST /api/notifications/accept/:connection_id — accept connection request
exports.acceptConnection = async (req, res) => {
  const { connection_id } = req.params;
  const user_id = req.user.id;
  try {
    // Get my talent id
    const [talent] = await db.query(
      "SELECT id FROM talents WHERE user_id = ?",
      [user_id],
    );
    if (talent.length === 0) {
      return res.status(404).json({ message: "Talent profile not found" });
    }
    const my_talent_id = talent[0].id;

    // Accept the connection
    const [result] = await db.query(
      "UPDATE connections SET status = 'accepted' WHERE id = ? AND reciver_id = ?",
      [connection_id, my_talent_id],
    );
    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "Connection request not found or unauthorized" });
    }

    // Mark related notification as read
    await db.query(
      "UPDATE notifications SET is_read = 1 WHERE connection_id = ? AND user_id = ?",
      [connection_id, user_id],
    );

    // Notify the sender that their request was accepted
    const [conn] = await db.query(
      "SELECT sender_id FROM connections WHERE id = ?",
      [connection_id],
    );
    if (conn[0]) {
      const [senderUser] = await db.query(
        "SELECT t.user_id, u.name FROM talents t JOIN users u ON t.user_id = u.id WHERE t.id = ?",
        [conn[0].sender_id],
      );
      const [myUser] = await db.query("SELECT name FROM users WHERE id = ?", [user_id]);
      if (senderUser[0]) {
        await db.query(
          `INSERT INTO notifications (user_id, type, title, message, connection_id, sender_talent_id)
           VALUES (?, 'connection_accepted', ?, ?, ?, ?)`,
          [
            senderUser[0].user_id,
            `${myUser[0]?.name} accepted your request`,
            `You are now connected with ${myUser[0]?.name}`,
            connection_id,
            my_talent_id,
          ],
        );
      }
    }

    return res.status(200).json({ message: "Connection accepted" });
  } catch (error) {
    return res.status(500).json({ message: "Failed to accept connection", error: error.message });
  }
};

// POST /api/notifications/decline/:connection_id — decline connection request
exports.declineConnection = async (req, res) => {
  const { connection_id } = req.params;
  const user_id = req.user.id;
  try {
    const [talent] = await db.query(
      "SELECT id FROM talents WHERE user_id = ?",
      [user_id],
    );
    if (talent.length === 0) {
      return res.status(404).json({ message: "Talent profile not found" });
    }
    const my_talent_id = talent[0].id;

    const [result] = await db.query(
      "UPDATE connections SET status = 'rejected' WHERE id = ? AND reciver_id = ?",
      [connection_id, my_talent_id],
    );
    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "Connection request not found or unauthorized" });
    }

    // Mark related notification as read
    await db.query(
      "UPDATE notifications SET is_read = 1 WHERE connection_id = ? AND user_id = ?",
      [connection_id, user_id],
    );

    return res.status(200).json({ message: "Connection declined" });
  } catch (error) {
    return res.status(500).json({ message: "Failed to decline connection", error: error.message });
  }
};
