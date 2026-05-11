-- Escrow Workflow Schema
-- Money flow: Payment verified → Held in escrow → Employer approves → Released to talent

-- Update payouts table to support escrow workflow
ALTER TABLE payouts ADD COLUMN IF NOT EXISTS escrow_status ENUM('held', 'approved', 'released', 'disputed') DEFAULT 'held' AFTER status;
ALTER TABLE payouts ADD COLUMN IF NOT EXISTS employer_approval_status ENUM('pending', 'approved', 'rejected') DEFAULT 'pending' AFTER escrow_status;
ALTER TABLE payouts ADD COLUMN IF NOT EXISTS employer_approved_by INT NULL AFTER employer_approval_status;
ALTER TABLE payouts ADD COLUMN IF NOT EXISTS employer_approved_at TIMESTAMP NULL AFTER employer_approved_by;
ALTER TABLE payouts ADD COLUMN IF NOT EXISTS employer_approval_notes TEXT AFTER employer_approved_at;
ALTER TABLE payouts ADD COLUMN IF NOT EXISTS released_at TIMESTAMP NULL AFTER employer_approval_notes;
ALTER TABLE payouts ADD COLUMN IF NOT EXISTS dispute_reason TEXT AFTER released_at;

-- Add foreign key for employer approval
ALTER TABLE payouts ADD CONSTRAINT fk_employer_approval FOREIGN KEY (employer_approved_by) REFERENCES users(id) ON DELETE SET NULL;

-- Create escrow transactions log
CREATE TABLE IF NOT EXISTS escrow_transactions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    payout_id INT NOT NULL,
    transaction_type ENUM('hold', 'release', 'dispute', 'refund') NOT NULL,
    amount DECIMAL(10, 2) NOT NULL,
    from_account VARCHAR(50),
    to_account VARCHAR(50),
    status ENUM('pending', 'completed', 'failed') DEFAULT 'pending',
    transaction_id VARCHAR(100),
    notes TEXT,
    created_by INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMP NULL,
    FOREIGN KEY (payout_id) REFERENCES payouts(id) ON DELETE CASCADE,
    FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_payout (payout_id),
    INDEX idx_type (transaction_type),
    INDEX idx_status (status),
    INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Create escrow disputes table
CREATE TABLE IF NOT EXISTS escrow_disputes (
    id INT AUTO_INCREMENT PRIMARY KEY,
    payout_id INT NOT NULL,
    raised_by INT NOT NULL,
    dispute_type ENUM('quality_issue', 'incomplete_work', 'other') NOT NULL,
    description TEXT NOT NULL,
    status ENUM('open', 'resolved', 'closed') DEFAULT 'open',
    resolution TEXT,
    resolved_by INT NULL,
    resolved_at TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (payout_id) REFERENCES payouts(id) ON DELETE CASCADE,
    FOREIGN KEY (raised_by) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (resolved_by) REFERENCES users(id) ON DELETE SET NULL,
    INDEX idx_payout (payout_id),
    INDEX idx_status (status),
    INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Add indexes for new columns
ALTER TABLE payouts ADD INDEX idx_escrow_status (escrow_status);
ALTER TABLE payouts ADD INDEX idx_employer_approval (employer_approval_status);
