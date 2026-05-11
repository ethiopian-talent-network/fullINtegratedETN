-- Payouts Schema with 5% Escrow Fee

-- Create payouts table
CREATE TABLE IF NOT EXISTS payouts (
    id INT AUTO_INCREMENT PRIMARY KEY,
    talent_id INT NOT NULL,
    job_id INT NOT NULL,
    payment_verification_id INT NOT NULL,
    gross_amount DECIMAL(10, 2) NOT NULL,
    escrow_fee DECIMAL(10, 2) NOT NULL,
    net_amount DECIMAL(10, 2) NOT NULL,
    currency VARCHAR(10) DEFAULT 'ETB',
    bank_name VARCHAR(100),
    account_number VARCHAR(50),
    account_holder_name VARCHAR(100),
    phone_number VARCHAR(20),
    payout_method ENUM('bank_transfer', 'mobile_money', 'check') DEFAULT 'bank_transfer',
    status ENUM('pending', 'processing', 'completed', 'failed', 'cancelled') DEFAULT 'pending',
    escrow_status ENUM('held', 'released', 'disputed') DEFAULT 'held',
    employer_approval_status ENUM('pending', 'approved', 'rejected') DEFAULT 'pending',
    transaction_id VARCHAR(100),
    reference_number VARCHAR(100) UNIQUE,
    processed_by INT NULL,
    processed_at TIMESTAMP NULL,
    released_at TIMESTAMP NULL,
    employer_approved_by INT NULL,
    employer_approved_at TIMESTAMP NULL,
    employer_approval_notes TEXT,
    failed_reason TEXT,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (talent_id) REFERENCES talents(id) ON DELETE CASCADE,
    FOREIGN KEY (job_id) REFERENCES jobs(id) ON DELETE CASCADE,
    FOREIGN KEY (payment_verification_id) REFERENCES payment_verifications(id) ON DELETE CASCADE,
    FOREIGN KEY (processed_by) REFERENCES users(id) ON DELETE SET NULL,
    FOREIGN KEY (employer_approved_by) REFERENCES users(id) ON DELETE SET NULL,
    INDEX idx_talent (talent_id),
    INDEX idx_status (status),
    INDEX idx_created_at (created_at),
    INDEX idx_job (job_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Create payout audit log
CREATE TABLE IF NOT EXISTS payout_audit_log (
    id INT AUTO_INCREMENT PRIMARY KEY,
    payout_id INT NOT NULL,
    owner_id INT NOT NULL,
    action VARCHAR(50),
    old_status VARCHAR(50),
    new_status VARCHAR(50),
    notes TEXT,
    ip_address VARCHAR(45),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (payout_id) REFERENCES payouts(id) ON DELETE CASCADE,
    FOREIGN KEY (owner_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_payout (payout_id),
    INDEX idx_owner (owner_id),
    INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Create escrow transactions table
CREATE TABLE IF NOT EXISTS escrow_transactions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    payout_id INT NOT NULL,
    transaction_type ENUM('hold', 'release', 'dispute') NOT NULL,
    amount DECIMAL(10, 2) NOT NULL,
    status ENUM('pending', 'completed', 'failed') DEFAULT 'pending',
    transaction_id VARCHAR(100),
    notes TEXT,
    created_by INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (payout_id) REFERENCES payouts(id) ON DELETE CASCADE,
    FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL,
    INDEX idx_payout (payout_id),
    INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Create payout summary view
CREATE OR REPLACE VIEW payout_summary_view AS
SELECT 
    p.id,
    p.talent_id,
    p.job_id,
    p.gross_amount,
    p.escrow_fee,
    p.net_amount,
    p.currency,
    p.status,
    p.escrow_status,
    p.employer_approval_status,
    p.payout_method,
    p.created_at,
    p.processed_at,
    p.released_at,
    t.user_id as talent_user_id,
    u.name as talent_name,
    u.email as talent_email,
    u.profile_image as talent_image,
    j.title as job_title,
    j.salary as job_salary,
    pv.amount as verified_amount,
    pv.verification_status
FROM payouts p
JOIN talents t ON p.talent_id = t.id
JOIN users u ON t.user_id = u.id
JOIN jobs j ON p.job_id = j.id
JOIN payment_verifications pv ON p.payment_verification_id = pv.id;

-- Create escrow fee summary table
CREATE TABLE IF NOT EXISTS escrow_fee_summary (
    id INT AUTO_INCREMENT PRIMARY KEY,
    owner_id INT NOT NULL,
    total_gross_amount DECIMAL(15, 2) DEFAULT 0,
    total_escrow_fees DECIMAL(15, 2) DEFAULT 0,
    total_net_payouts DECIMAL(15, 2) DEFAULT 0,
    total_payouts_count INT DEFAULT 0,
    completed_payouts_count INT DEFAULT 0,
    pending_payouts_count INT DEFAULT 0,
    last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (owner_id) REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE KEY unique_owner (owner_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
