-- Payment Verification Schema for Owner Dashboard

-- Add verification columns to payments table if not exists
ALTER TABLE payments 
ADD COLUMN IF NOT EXISTS receipt_url VARCHAR(500),
ADD COLUMN IF NOT EXISTS receipt_number VARCHAR(50) UNIQUE,
ADD COLUMN IF NOT EXISTS verified_by INT NULL,
ADD COLUMN IF NOT EXISTS verified_at TIMESTAMP NULL,
ADD COLUMN IF NOT EXISTS verification_notes TEXT,
ADD COLUMN IF NOT EXISTS verification_status ENUM('pending', 'verified', 'rejected') DEFAULT 'pending',
ADD FOREIGN KEY (verified_by) REFERENCES users(id) ON DELETE SET NULL;

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
    FOREIGN KEY (payment_id) REFERENCES payments(id) ON DELETE CASCADE,
    FOREIGN KEY (job_id) REFERENCES jobs(id) ON DELETE CASCADE,
    FOREIGN KEY (employer_id) REFERENCES employers(id) ON DELETE CASCADE,
    FOREIGN KEY (talent_id) REFERENCES talents(id) ON DELETE CASCADE,
    FOREIGN KEY (verified_by) REFERENCES users(id) ON DELETE SET NULL,
    INDEX idx_status (verification_status),
    INDEX idx_job_talent (job_id, talent_id),
    INDEX idx_verified_by (verified_by),
    INDEX idx_created_at (created_at)
);

-- Create payment details view for easy querying
CREATE OR REPLACE VIEW payment_details_view AS
SELECT 
    pv.id as verification_id,
    pv.payment_id,
    pv.job_id,
    pv.talent_id,
    pv.amount,
    pv.currency,
    pv.receipt_number,
    pv.transaction_id,
    pv.payment_method,
    pv.payment_date,
    pv.verification_status,
    pv.verified_at,
    pv.verification_notes,
    j.title as job_title,
    j.salary as job_salary,
    j.budget_type,
    e.company_name as employer_company,
    e.location as employer_location,
    eu.name as employer_name,
    eu.email as employer_email,
    t.id as talent_id_check,
    tu.name as talent_name,
    tu.email as talent_email,
    tu.profile_image as talent_image,
    vu.name as verified_by_name,
    vu.email as verified_by_email
FROM payment_verifications pv
JOIN jobs j ON pv.job_id = j.id
JOIN employers e ON pv.employer_id = e.id
JOIN users eu ON e.user_id = eu.id
JOIN talents t ON pv.talent_id = t.id
JOIN users tu ON t.user_id = tu.id
LEFT JOIN users vu ON pv.verified_by = vu.id;

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
);

-- Create audit log for payment verifications
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
);
