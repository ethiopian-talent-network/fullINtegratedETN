-- Employer License Verification Table
CREATE TABLE IF NOT EXISTS employer_licenses (
    id INT AUTO_INCREMENT PRIMARY KEY,
    employer_id INT NOT NULL,
    user_id INT NOT NULL,
    license_name VARCHAR(255) NOT NULL,
    license_number VARCHAR(255),
    issuing_authority VARCHAR(255),
    license_image VARCHAR(500) NOT NULL,
    status ENUM('pending', 'approved', 'rejected') DEFAULT 'pending',
    admin_note TEXT,
    submitted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    reviewed_at TIMESTAMP NULL,
    FOREIGN KEY (employer_id) REFERENCES employers(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_employer (employer_id),
    INDEX idx_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Add is_verified column to employers table
ALTER TABLE employers ADD COLUMN IF NOT EXISTS is_verified TINYINT(1) DEFAULT 0;
