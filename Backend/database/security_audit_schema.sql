-- Security audit and logging tables for license verification system

-- Add reviewed_by column to track which admin processed the request
ALTER TABLE employer_licenses 
ADD COLUMN reviewed_by INT NULL,
ADD FOREIGN KEY (reviewed_by) REFERENCES users(id) ON DELETE SET NULL;

-- Create audit log table for tracking admin actions
CREATE TABLE IF NOT EXISTS admin_audit_log (
    id INT AUTO_INCREMENT PRIMARY KEY,
    admin_id INT NOT NULL,
    action_type VARCHAR(50) NOT NULL,
    target_type VARCHAR(50) NOT NULL,
    target_id INT NOT NULL,
    details JSON,
    ip_address VARCHAR(45),
    user_agent TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (admin_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_admin_actions (admin_id, created_at),
    INDEX idx_action_type (action_type),
    INDEX idx_target (target_type, target_id)
);

-- Create security events table for monitoring suspicious activities
CREATE TABLE IF NOT EXISTS security_events (
    id INT AUTO_INCREMENT PRIMARY KEY,
    event_type VARCHAR(50) NOT NULL,
    user_id INT NULL,
    ip_address VARCHAR(45),
    details JSON,
    severity ENUM('LOW', 'MEDIUM', 'HIGH', 'CRITICAL') DEFAULT 'LOW',
    resolved BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
    INDEX idx_event_type (event_type),
    INDEX idx_severity (severity),
    INDEX idx_unresolved (resolved, created_at)
);

-- Create rate limiting table for tracking API usage
CREATE TABLE IF NOT EXISTS rate_limits (
    id INT AUTO_INCREMENT PRIMARY KEY,
    identifier VARCHAR(100) NOT NULL, -- IP or user_id
    endpoint VARCHAR(100) NOT NULL,
    request_count INT DEFAULT 1,
    window_start TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY unique_limit (identifier, endpoint),
    INDEX idx_window (window_start)
);

-- Add indexes for better performance on license verification queries
ALTER TABLE employer_licenses 
ADD INDEX idx_status_submitted (status, submitted_at),
ADD INDEX idx_user_status (user_id, status);

-- Create view for admin dashboard security metrics
CREATE OR REPLACE VIEW admin_security_metrics AS
SELECT 
    DATE(created_at) as date,
    COUNT(*) as total_events,
    SUM(CASE WHEN severity = 'HIGH' OR severity = 'CRITICAL' THEN 1 ELSE 0 END) as critical_events,
    COUNT(DISTINCT user_id) as affected_users,
    COUNT(DISTINCT ip_address) as unique_ips
FROM security_events 
WHERE created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)
GROUP BY DATE(created_at)
ORDER BY date DESC;