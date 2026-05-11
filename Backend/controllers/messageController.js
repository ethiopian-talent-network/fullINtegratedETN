const db = require("../config/db");

// Helper function to create message notification
const createMessageNotification = async (senderId, receiverId, messageContent) => {
  try {
    // Get sender info
    const [sender] = await db.query(
      "SELECT name, profile_image FROM users WHERE id = ?",
      [senderId]
    );

    if (sender.length > 0) {
      const senderName = sender[0].name;
      const preview = messageContent.length > 50 
        ? messageContent.substring(0, 50) + "..." 
        : messageContent;

    await db.query(
        `INSERT INTO notifications (user_id, type, title, message, sender_user_id, is_read, created_at)
         VALUES (?, 'new_message', ?, ?, ?, false, NOW())`,
        [
          receiverId,
          `New message from ${senderName}`,
          preview,
          senderId
        ]
      );
    }
  } catch (error) {
    console.error("Error creating message notification:", error);
    // Don't throw - notification failure shouldn't break message sending
  }
};

// Get total unread message count for the authenticated user
const getUnreadCount = async (req, res) => {
  try {
    const userId = req.user.id;

    const sql = `
      SELECT COUNT(*) as total_unread
      FROM messages
      WHERE reciver_id = ? AND is_read = false
    `;

    const [result] = await db.query(sql, [userId]);
    const totalUnread = result[0]?.total_unread || 0;

    res.json({ unread_count: totalUnread });
  } catch (error) {
    console.error("Error fetching unread count:", error);
    res.status(500).json({ message: "Failed to fetch unread count" });
  }
};

// Get all conversations for the authenticated user
const getConversations = async (req, res) => {
  try {
    const userId = req.user.id;

    const sql = `
      SELECT 
        CASE 
          WHEN m.sender_id = ? THEN m.reciver_id 
          ELSE m.sender_id 
        END as user_id,
        u.name,
        u.profile_image,
        m.content as last_message,
        m.created_at as last_message_at,
        (SELECT COUNT(*) FROM messages 
         WHERE sender_id = CASE 
           WHEN m.sender_id = ? THEN m.reciver_id 
           ELSE m.sender_id 
         END
         AND reciver_id = ? 
         AND is_read = false) as unread_count
      FROM messages m
      INNER JOIN (
        SELECT 
          CASE 
            WHEN sender_id = ? THEN reciver_id 
            ELSE sender_id 
          END as other_user_id,
          MAX(created_at) as max_created_at
        FROM messages
        WHERE sender_id = ? OR reciver_id = ?
        GROUP BY other_user_id
      ) latest ON (
        (m.sender_id = ? AND m.reciver_id = latest.other_user_id) OR
        (m.reciver_id = ? AND m.sender_id = latest.other_user_id)
      ) AND m.created_at = latest.max_created_at
      INNER JOIN users u ON u.id = latest.other_user_id
      ORDER BY m.created_at DESC
    `;

    const [conversations] = await db.query(sql, [
      userId, userId, userId, userId, userId, userId, userId, userId
    ]);

    res.json({ conversations });
  } catch (error) {
    console.error("Error fetching conversations:", error);
    res.status(500).json({ message: "Failed to fetch conversations" });
  }
};

// Get messages between two users
const getMessages = async (req, res) => {
  try {
    const userId = req.user.id;
    const { reciver_id } = req.query;

    if (!reciver_id) {
      return res.status(400).json({ message: "reciver_id is required" });
    }

    const sql = `
      SELECT 
        m.id,
        m.sender_id,
        m.reciver_id,
        m.content,
        m.is_read,
        m.created_at,
        u.name as sender_name,
        u.profile_image as sender_image
      FROM messages m
      INNER JOIN users u ON u.id = m.sender_id
      WHERE (m.sender_id = ? AND m.reciver_id = ?) 
         OR (m.sender_id = ? AND m.reciver_id = ?)
      ORDER BY m.created_at ASC
    `;

    const [messages] = await db.query(sql, [
      userId, reciver_id, reciver_id, userId
    ]);

    res.json({ messages });
  } catch (error) {
    console.error("Error fetching messages:", error);
    res.status(500).json({ message: "Failed to fetch messages" });
  }
};

// Send a message
const sendMessage = async (req, res) => {
  try {
    const senderId = req.user.id;
    const { reciver_id, content } = req.body;

    if (!reciver_id || !content) {
      return res.status(400).json({ message: "reciver_id and content are required" });
    }

    const insertSql = `
      INSERT INTO messages (sender_id, reciver_id, content, is_read, created_at)
      VALUES (?, ?, ?, false, NOW())
    `;

    const [result] = await db.query(insertSql, [senderId, reciver_id, content]);

    // Create notification for the receiver
    await createMessageNotification(senderId, reciver_id, content);

    // Fetch the created message with sender info
    const [messages] = await db.query(
      `SELECT 
        m.id,
        m.sender_id,
        m.reciver_id,
        m.content,
        m.is_read,
        m.created_at,
        u.name as sender_name,
        u.profile_image as sender_image
      FROM messages m
      INNER JOIN users u ON u.id = m.sender_id
      WHERE m.id = ?`,
      [result.insertId]
    );

    res.status(201).json({
      message: "Message sent successfully",
      data: messages[0]
    });
  } catch (error) {
    console.error("Error sending message:", error);
    res.status(500).json({ message: "Failed to send message" });
  }
};

// Mark messages as read
const markMessagesRead = async (req, res) => {
  try {
    const userId = req.user.id;
    const { sender_id } = req.params;

    const sql = `
      UPDATE messages 
      SET is_read = true 
      WHERE sender_id = ? AND reciver_id = ? AND is_read = false
    `;

    await db.query(sql, [sender_id, userId]);

    res.json({ message: "Messages marked as read" });
  } catch (error) {
    console.error("Error marking messages as read:", error);
    res.status(500).json({ message: "Failed to mark messages as read" });
  }
};

module.exports = {
  getConversations,
  getMessages,
  sendMessage,
  markMessagesRead,
  getUnreadCount
};
