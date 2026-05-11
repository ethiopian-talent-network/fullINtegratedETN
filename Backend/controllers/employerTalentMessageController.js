const db = require("../config/db");

// Helper function to create message notification
const createEmployerTalentMessageNotification = async (senderId, receiverId, messageContent, senderType) => {
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
         VALUES (?, 'new_work_message', ?, ?, ?, false, NOW())`,
        [
          receiverId,
          `New work message from ${senderName}`,
          preview,
          senderId
        ]
      );
    }
  } catch (error) {
    console.error("Error creating employer-talent message notification:", error);
  }
};

// Helper function to verify hiring relationship
const verifyHiringRelationship = async (employerUserId, talentUserId) => {
  try {
    const [hiring] = await db.query(
      `SELECT h.id FROM hirings h
       JOIN employers e ON h.employer_id = e.id
       JOIN talents t ON h.talent_id = t.id
       WHERE e.user_id = ? AND t.user_id = ? AND h.status = 'active'`,
      [employerUserId, talentUserId]
    );
    
    return hiring.length > 0 ? hiring[0].id : null;
  } catch (error) {
    console.error("Error verifying hiring relationship:", error);
    return null;
  }
};

// GET /api/employer-talent-messages/conversations - Get all work conversations
const getWorkConversations = async (req, res) => {
  try {
    const userId = req.user.id;
    const userRole = req.user.role;

    let sql, params;

    if (userRole === 'employer') {
      // Get conversations with hired talents
      sql = `
        SELECT DISTINCT
          t.user_id as other_user_id,
          u.name,
          u.profile_image,
          h.id as hiring_id,
          j.title as job_title,
          (SELECT content FROM employer_talent_messages 
           WHERE hiring_id = h.id 
           ORDER BY created_at DESC LIMIT 1) as last_message,
          (SELECT created_at FROM employer_talent_messages 
           WHERE hiring_id = h.id 
           ORDER BY created_at DESC LIMIT 1) as last_message_at,
          (SELECT COUNT(*) FROM employer_talent_messages 
           WHERE hiring_id = h.id AND receiver_id = ? AND is_read = false) as unread_count
        FROM hirings h
        JOIN employers e ON h.employer_id = e.id
        JOIN talents t ON h.talent_id = t.id
        JOIN users u ON t.user_id = u.id
        JOIN jobs j ON h.job_id = j.id
        WHERE e.user_id = ? AND h.status = 'active'
        ORDER BY last_message_at DESC
      `;
      params = [userId, userId];
    } else {
      // Get conversations with employers who hired this talent
      sql = `
        SELECT DISTINCT
          e.user_id as other_user_id,
          u.name,
          u.profile_image,
          h.id as hiring_id,
          j.title as job_title,
          (SELECT content FROM employer_talent_messages 
           WHERE hiring_id = h.id 
           ORDER BY created_at DESC LIMIT 1) as last_message,
          (SELECT created_at FROM employer_talent_messages 
           WHERE hiring_id = h.id 
           ORDER BY created_at DESC LIMIT 1) as last_message_at,
          (SELECT COUNT(*) FROM employer_talent_messages 
           WHERE hiring_id = h.id AND receiver_id = ? AND is_read = false) as unread_count
        FROM hirings h
        JOIN employers e ON h.employer_id = e.id
        JOIN talents t ON h.talent_id = t.id
        JOIN users u ON e.user_id = u.id
        JOIN jobs j ON h.job_id = j.id
        WHERE t.user_id = ? AND h.status = 'active'
        ORDER BY last_message_at DESC
      `;
      params = [userId, userId];
    }

    const [conversations] = await db.query(sql, params);
    res.json({ conversations });
  } catch (error) {
    console.error("Error fetching work conversations:", error);
    res.status(500).json({ message: "Failed to fetch work conversations" });
  }
};

// GET /api/employer-talent-messages/:hiringId - Get messages for a specific hiring
const getWorkMessages = async (req, res) => {
  try {
    const userId = req.user.id;
    const { hiringId } = req.params;

    // Verify user is part of this hiring
    const [hiringCheck] = await db.query(
      `SELECT h.id FROM hirings h
       JOIN employers e ON h.employer_id = e.id
       JOIN talents t ON h.talent_id = t.id
       WHERE h.id = ? AND (e.user_id = ? OR t.user_id = ?)`,
      [hiringId, userId, userId]
    );

    if (hiringCheck.length === 0) {
      return res.status(403).json({ message: "Access denied to this conversation" });
    }

    const [messages] = await db.query(
      `SELECT 
        m.id,
        m.sender_id,
        m.receiver_id,
        m.sender_type,
        m.content,
        m.is_read,
        m.created_at,
        u.name as sender_name,
        u.profile_image as sender_image
       FROM employer_talent_messages m
       JOIN users u ON u.id = m.sender_id
       WHERE m.hiring_id = ?
       ORDER BY m.created_at ASC`,
      [hiringId]
    );

    res.json({ messages });
  } catch (error) {
    console.error("Error fetching work messages:", error);
    res.status(500).json({ message: "Failed to fetch work messages" });
  }
};

// POST /api/employer-talent-messages/send - Send a work message
const sendWorkMessage = async (req, res) => {
  try {
    const senderId = req.user.id;
    const senderRole = req.user.role;
    const { receiver_id, content, hiring_id } = req.body;

    if (!receiver_id || !content || !hiring_id) {
      return res.status(400).json({ message: "receiver_id, content, and hiring_id are required" });
    }

    // Verify hiring relationship exists and sender is part of it
    const [hiringCheck] = await db.query(
      `SELECT h.id FROM hirings h
       JOIN employers e ON h.employer_id = e.id
       JOIN talents t ON h.talent_id = t.id
       WHERE h.id = ? AND h.status = 'active' AND (e.user_id = ? OR t.user_id = ?)`,
      [hiring_id, senderId, senderId]
    );

    if (hiringCheck.length === 0) {
      return res.status(403).json({ message: "You can only message talents/employers you have an active hiring relationship with" });
    }

    // Verify receiver is the other party in the hiring
    const [receiverCheck] = await db.query(
      `SELECT h.id FROM hirings h
       JOIN employers e ON h.employer_id = e.id
       JOIN talents t ON h.talent_id = t.id
       WHERE h.id = ? AND (e.user_id = ? OR t.user_id = ?)`,
      [hiring_id, receiver_id, receiver_id]
    );

    if (receiverCheck.length === 0) {
      return res.status(403).json({ message: "Invalid receiver for this hiring relationship" });
    }

    const senderType = senderRole === 'employer' ? 'employer' : 'talent';

    const [result] = await db.query(
      `INSERT INTO employer_talent_messages (hiring_id, sender_id, receiver_id, sender_type, content, is_read, created_at)
       VALUES (?, ?, ?, ?, ?, false, NOW())`,
      [hiring_id, senderId, receiver_id, senderType, content]
    );

    // Create notification for the receiver
    await createEmployerTalentMessageNotification(senderId, receiver_id, content, senderType);

    // Fetch the created message with sender info
    const [messages] = await db.query(
      `SELECT 
        m.id,
        m.hiring_id,
        m.sender_id,
        m.receiver_id,
        m.sender_type,
        m.content,
        m.is_read,
        m.created_at,
        u.name as sender_name,
        u.profile_image as sender_image
       FROM employer_talent_messages m
       JOIN users u ON u.id = m.sender_id
       WHERE m.id = ?`,
      [result.insertId]
    );

    res.status(201).json({
      message: "Work message sent successfully",
      data: messages[0]
    });
  } catch (error) {
    console.error("Error sending work message:", error);
    res.status(500).json({ message: "Failed to send work message" });
  }
};

// PATCH /api/employer-talent-messages/:hiringId/read - Mark messages as read
const markWorkMessagesRead = async (req, res) => {
  try {
    const userId = req.user.id;
    const { hiringId } = req.params;

    // Verify user is part of this hiring
    const [hiringCheck] = await db.query(
      `SELECT h.id FROM hirings h
       JOIN employers e ON h.employer_id = e.id
       JOIN talents t ON h.talent_id = t.id
       WHERE h.id = ? AND (e.user_id = ? OR t.user_id = ?)`,
      [hiringId, userId, userId]
    );

    if (hiringCheck.length === 0) {
      return res.status(403).json({ message: "Access denied to this conversation" });
    }

    await db.query(
      `UPDATE employer_talent_messages 
       SET is_read = true 
       WHERE hiring_id = ? AND receiver_id = ? AND is_read = false`,
      [hiringId, userId]
    );

    res.json({ message: "Work messages marked as read" });
  } catch (error) {
    console.error("Error marking work messages as read:", error);
    res.status(500).json({ message: "Failed to mark work messages as read" });
  }
};

// GET /api/employer-talent-messages/unread-count - Get unread work message count
const getWorkUnreadCount = async (req, res) => {
  try {
    const userId = req.user.id;

    const [result] = await db.query(
      `SELECT COUNT(*) as total_unread
       FROM employer_talent_messages etm
       JOIN hirings h ON etm.hiring_id = h.id
       JOIN employers e ON h.employer_id = e.id
       JOIN talents t ON h.talent_id = t.id
       WHERE etm.receiver_id = ? AND etm.is_read = false 
       AND h.status = 'active'
       AND (e.user_id = ? OR t.user_id = ?)`,
      [userId, userId, userId]
    );

    const totalUnread = result[0]?.total_unread || 0;
    res.json({ unread_count: totalUnread });
  } catch (error) {
    console.error("Error fetching work unread count:", error);
    res.status(500).json({ message: "Failed to fetch work unread count" });
  }
};

module.exports = {
  getWorkConversations,
  getWorkMessages,
  sendWorkMessage,
  markWorkMessagesRead,
  getWorkUnreadCount
};