const db = require('../config/db');

class SecurityService {
  // Log admin actions for audit trail
  static async logAdminAction(adminId, actionType, targetType, targetId, details = {}, req = null) {
    try {
      const ipAddress = req ? (req.ip || req.connection.remoteAddress) : null;
      const userAgent = req ? req.get('User-Agent') : null;
      
      await db.query(
        `INSERT INTO admin_audit_log (admin_id, action_type, target_type, target_id, details, ip_address, user_agent)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [adminId, actionType, targetType, targetId, JSON.stringify(details), ipAddress, userAgent]
      );
    } catch (error) {
      console.error('Failed to log admin action:', error);
    }
  }

  // Log security events
  static async logSecurityEvent(eventType, userId = null, details = {}, severity = 'LOW', req = null) {
    try {
      const ipAddress = req ? (req.ip || req.connection.remoteAddress) : null;
      
      await db.query(
        `INSERT INTO security_events (event_type, user_id, ip_address, details, severity)
         VALUES (?, ?, ?, ?, ?)`,
        [eventType, userId, ipAddress, JSON.stringify(details), severity]
      );
    } catch (error) {
      console.error('Failed to log security event:', error);
    }
  }

  // Check for suspicious license submission patterns
  static async detectSuspiciousLicenseActivity(userId, licenseData) {
    try {
      // Check for multiple submissions in short time
      const [recentSubmissions] = await db.query(
        `SELECT COUNT(*) as count FROM employer_licenses 
         WHERE user_id = ? AND submitted_at > DATE_SUB(NOW(), INTERVAL 1 HOUR)`,
        [userId]
      );

      if (recentSubmissions[0].count > 2) {
        await this.logSecurityEvent(
          'SUSPICIOUS_LICENSE_ACTIVITY',
          userId,
          { reason: 'Multiple license submissions in short time', count: recentSubmissions[0].count },
          'MEDIUM'
        );
        return true;
      }

      // Check for duplicate license numbers
      const [duplicates] = await db.query(
        `SELECT COUNT(*) as count FROM employer_licenses 
         WHERE license_number = ? AND user_id != ?`,
        [licenseData.license_number, userId]
      );

      if (duplicates[0].count > 0) {
        await this.logSecurityEvent(
          'DUPLICATE_LICENSE_NUMBER',
          userId,
          { license_number: licenseData.license_number },
          'HIGH'
        );
        return true;
      }

      return false;
    } catch (error) {
      console.error('Error detecting suspicious activity:', error);
      return false;
    }
  }

  // Validate license document integrity
  static validateLicenseDocument(file) {
    const errors = [];
    
    // File type validation
    const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg', 'application/pdf'];
    if (!allowedTypes.includes(file.mimetype)) {
      errors.push('Invalid file type. Only JPEG, PNG, and PDF files are allowed.');
    }

    // File size validation (5MB max)
    const maxSize = 5 * 1024 * 1024;
    if (file.size > maxSize) {
      errors.push('File size exceeds 5MB limit.');
    }

    // Basic filename validation
    if (!/^[a-zA-Z0-9._-]+$/.test(file.originalname)) {
      errors.push('Invalid filename. Only alphanumeric characters, dots, hyphens, and underscores are allowed.');
    }

    return errors;
  }

  // Check rate limits
  static async checkRateLimit(identifier, endpoint, maxRequests = 100, windowMs = 15 * 60 * 1000) {
    try {
      const windowStart = new Date(Date.now() - windowMs);
      
      // Clean old entries
      await db.query(
        'DELETE FROM rate_limits WHERE window_start < ?',
        [windowStart]
      );

      // Check current count
      const [existing] = await db.query(
        'SELECT request_count FROM rate_limits WHERE identifier = ? AND endpoint = ?',
        [identifier, endpoint]
      );

      if (existing.length > 0) {
        const currentCount = existing[0].request_count;
        
        if (currentCount >= maxRequests) {
          await this.logSecurityEvent(
            'RATE_LIMIT_EXCEEDED',
            null,
            { identifier, endpoint, count: currentCount },
            'MEDIUM'
          );
          return false;
        }

        // Increment count
        await db.query(
          'UPDATE rate_limits SET request_count = request_count + 1 WHERE identifier = ? AND endpoint = ?',
          [identifier, endpoint]
        );
      } else {
        // Create new entry
        await db.query(
          'INSERT INTO rate_limits (identifier, endpoint, request_count) VALUES (?, ?, 1)',
          [identifier, endpoint]
        );
      }

      return true;
    } catch (error) {
      console.error('Rate limit check failed:', error);
      return true; // Allow request on error
    }
  }

  // Get security metrics for admin dashboard
  static async getSecurityMetrics(days = 30) {
    try {
      const [metrics] = await db.query(
        `SELECT * FROM admin_security_metrics WHERE date >= DATE_SUB(NOW(), INTERVAL ? DAY)`,
        [days]
      );

      const [totalEvents] = await db.query(
        `SELECT 
           COUNT(*) as total_events,
           SUM(CASE WHEN severity IN ('HIGH', 'CRITICAL') THEN 1 ELSE 0 END) as critical_events,
           COUNT(CASE WHEN resolved = FALSE THEN 1 END) as unresolved_events
         FROM security_events 
         WHERE created_at >= DATE_SUB(NOW(), INTERVAL ? DAY)`,
        [days]
      );

      const [recentActions] = await db.query(
        `SELECT 
           action_type,
           COUNT(*) as count
         FROM admin_audit_log 
         WHERE created_at >= DATE_SUB(NOW(), INTERVAL ? DAY)
         GROUP BY action_type
         ORDER BY count DESC`,
        [days]
      );

      return {
        daily_metrics: metrics,
        summary: totalEvents[0],
        admin_actions: recentActions
      };
    } catch (error) {
      console.error('Failed to get security metrics:', error);
      return null;
    }
  }

  // Validate admin permissions for sensitive actions
  static async validateAdminPermissions(adminId, action, targetId = null) {
    try {
      // Check if admin exists and is active
      const [admin] = await db.query(
        'SELECT role, is_verified FROM users WHERE id = ? AND role IN ("admin", "owner")',
        [adminId]
      );

      if (!admin.length || !admin[0].is_verified) {
        await this.logSecurityEvent(
          'UNAUTHORIZED_ADMIN_ACCESS',
          adminId,
          { action, targetId },
          'HIGH'
        );
        return false;
      }

      // Log the permission check
      await this.logAdminAction(
        adminId,
        'PERMISSION_CHECK',
        'SYSTEM',
        0,
        { action, targetId, result: 'GRANTED' }
      );

      return true;
    } catch (error) {
      console.error('Admin permission validation failed:', error);
      return false;
    }
  }
}

module.exports = SecurityService;