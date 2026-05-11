-- Fix database schema issues
-- Run this script to resolve the current errors

-- 1. Add missing is_verified column to employers table
ALTER TABLE employers ADD COLUMN IF NOT EXISTS is_verified TINYINT(1) DEFAULT 0;

-- 2. Create missing security_events table
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

-- 3. Create admin_audit_log table if not exists
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

-- 4. Add reviewed_by column to employer_licenses if not exists
ALTER TABLE employer_licenses 
ADD COLUMN IF NOT EXISTS reviewed_by INT NULL,
ADD CONSTRAINT fk_reviewed_by FOREIGN KEY (reviewed_by) REFERENCES users(id) ON DELETE SET NULL;

-- 5. Add indexes for better performance
ALTER TABLE employer_licenses 
ADD INDEX IF NOT EXISTS idx_status_submitted (status, submitted_at),
ADD INDEX IF NOT EXISTS idx_user_status (user_id, status);

-- 6. Create rate limiting table
CREATE TABLE IF NOT EXISTS rate_limits (
    id INT AUTO_INCREMENT PRIMARY KEY,
    identifier VARCHAR(100) NOT NULL,
    endpoint VARCHAR(100) NOT NULL,
    request_count INT DEFAULT 1,
    window_start TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY unique_limit (identifier, endpoint),
    INDEX idx_window (window_start)
);