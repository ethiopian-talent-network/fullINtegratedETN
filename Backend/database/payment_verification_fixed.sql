-- Payment Verification Schema for Owner Dashboard (Fixed)

-- Create payment verification table
CREATE TABLE IF NOT EXISTS payment_verifications (
    id INT AUTO_INCREMENT PRIMARY KEY,
    payment_id INT NOT NULL,
    job_id INT NOT NULL,
    employer_id INT NOT NULL,
    talent_id INT NOT NULL,
    amount DECIMAL(10, 2) NOT NULL,
    currency VARCHAR(10) DEFAULT 'ETB',
    receipt_url VARCHAR(500),
    receipt_number VARCHAR(50) UNIQUE,
    transaction_id VARCHAR(100),
    payment_method VARCHAR(50),
    payment_date TIMESTAMP,
    verified_by INT NULL,
    verified_at TIMESTAMP NULL,
    verification_status ENUM('pending', 'verified', 'rejected') DEFAULT 'pending',
    verification_notes TEXT,
    rejection_reason TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (job_id) REFERENCES jobs(id) ON DELETE CASCADE,
    FOREIGN KEY (employer_id) REFERENCES employers(id) ON DELETE CASCADE,
    FOREIGN KEY (talent_id) REFERENCES talents(id) ON DELETE CASCADE,
    FOREIGN KEY (verified_by) REFERENCES users(id) ON DELETE SET NULL,
    INDEX idx_status (verification_status),
    INDEX idx_job_talent (job_id, talent_id),
    INDEX idx_verified_by (verified_by),
    INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Create payment verification audit log
CREATE TABLE IF NOT EXISTS payment_verification_audit (
    id INT AUTO_INCREMENT PRIMARY KEY,
    verification_id INT NOT NULL,
    owner_id INT NOT NULL,
    action VARCHAR(50),
    old_status VARCHAR(50),
    new_status VARCHAR(50),
    notes TEXT,
    ip_address VARCHAR(45),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (verification_id) REFERENCES payment_verifications(id) ON DELETE CASCADE,
    FOREIGN KEY (owner_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_owner_action (owner_id, action),
    INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Create payment summary table for owner dashboard
CREATE TABLE IF NOT EXISTS payment_summary (
    id INT AUTO_INCREMENT PRIMARY KEY,
    owner_id INT NOT NULL,
    total_payments DECIMAL(15, 2) DEFAULT 0,
    total_verified DECIMAL(15, 2) DEFAULT 0,
    total_pending DECIMAL(15, 2) DEFAULT 0,
    total_rejected DECIMAL(15, 2) DEFAULT 0,
    pending_count INT DEFAULT 0,
    verified_count INT DEFAULT 0,
    rejected_count INT DEFAULT 0,
    last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (owner_id) REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE KEY unique_owner (owner_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
