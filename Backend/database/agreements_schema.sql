-- Agreements and Escrow Management Schema

-- Create agreements table
CREATE TABLE IF NOT EXISTS agreements (
    id INT AUTO_INCREMENT PRIMARY KEY,
    job_id INT NOT NULL,
    employer_id INT NOT NULL,
    talent_id INT NOT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    terms TEXT,
    budget DECIMAL(12, 2) NOT NULL,
    currency VARCHAR(10) DEFAULT 'ETB',
    start_date DATE,
    end_date DATE,
    status ENUM('pending', 'employer_accepted', 'talent_accepted', 'active', 'completed', 'paid', 'cancelled') DEFAULT 'pending',
    employer_accepted_at TIMESTAMP NULL,
    talent_accepted_at TIMESTAMP NULL,
    started_at TIMESTAMP NULL,
    completed_at TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (job_id) REFERENCES jobs(id) ON DELETE CASCADE,
    FOREIGN KEY (employer_id) REFERENCES employers(id) ON DELETE CASCADE,
    FOREIGN KEY (talent_id) REFERENCES talents(id) ON DELETE CASCADE,
    INDEX idx_status (status),
    INDEX idx_job (job_id),
    INDEX idx_employer (employer_id),
    INDEX idx_talent (talent_id),
    INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Create escrow table for holding funds
CREATE TABLE IF NOT EXISTS escrow_accounts (
    id INT AUTO_INCREMENT PRIMARY KEY,
    agreement_id INT NOT NULL UNIQUE,
    job_id INT NOT NULL,
    employer_id INT NOT NULL,
    talent_id INT NOT NULL,
    amount DECIMAL(12, 2) NOT NULL,
    currency VARCHAR(10) DEFAULT 'ETB',
    status ENUM('pending', 'funded', 'held', 'released', 'refunded', 'disputed') DEFAULT 'pending',
    funded_at TIMESTAMP NULL,
    released_at TIMESTAMP NULL,
    refunded_at TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (agreement_id) REFERENCES agreements(id) ON DELETE CASCADE,
    FOREIGN KEY (job_id) REFERENCES jobs(id) ON DELETE CASCADE,
    FOREIGN KEY (employer_id) REFERENCES employers(id) ON DELETE CASCADE,
    FOREIGN KEY (talent_id) REFERENCES talents(id) ON DELETE CASCADE,
    INDEX idx_status (status),
    INDEX idx_agreement (agreement_id),
    INDEX idx_job (job_id),
    INDEX idx_employer (employer_id),
    INDEX idx_talent (talent_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Create payout history table
CREATE TABLE IF NOT EXISTS payout_history (
    id INT AUTO_INCREMENT PRIMARY KEY,
    agreement_id INT NOT NULL,
    escrow_id INT NOT NULL,
    talent_id INT NOT NULL,
    employer_id INT NOT NULL,
    amount DECIMAL(12, 2) NOT NULL,
    currency VARCHAR(10) DEFAULT 'ETB',
    payout_type ENUM('completion', 'milestone', 'refund') DEFAULT 'completion',
    status ENUM('pending', 'approved', 'processing', 'completed', 'failed') DEFAULT 'pending',
    transaction_id VARCHAR(100),
    payment_method VARCHAR(50),
    approved_by INT,
    approved_at TIMESTAMP NULL,
    processed_at TIMESTAMP NULL,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (agreement_id) REFERENCES agreements(id) ON DELETE CASCADE,
    FOREIGN KEY (escrow_id) REFERENCES escrow_accounts(id) ON DELETE CASCADE,
    FOREIGN KEY (talent_id) REFERENCES talents(id) ON DELETE CASCADE,
    FOREIGN KEY (employer_id) REFERENCES employers(id) ON DELETE CASCADE,
    FOREIGN KEY (approved_by) REFERENCES users(id) ON DELETE SET NULL,
    INDEX idx_status (status),
    INDEX idx_talent (talent_id),
    INDEX idx_employer (employer_id),
    INDEX idx_agreement (agreement_id),
    INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Create agreement milestones table (optional, for tracking progress)
CREATE TABLE IF NOT EXISTS agreement_milestones (
    id INT AUTO_INCREMENT PRIMARY KEY,
    agreement_id INT NOT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    due_date DATE,
    status ENUM('pending', 'in_progress', 'completed', 'approved') DEFAULT 'pending',
    completed_at TIMESTAMP NULL,
    approved_at TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (agreement_id) REFERENCES agreements(id) ON DELETE CASCADE,
    INDEX idx_agreement (agreement_id),
    INDEX idx_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Create agreement activity log
CREATE TABLE IF NOT EXISTS agreement_activity_log (
    id INT AUTO_INCREMENT PRIMARY KEY,
    agreement_id INT NOT NULL,
    user_id INT NOT NULL,
    action VARCHAR(100),
    description TEXT,
    old_status VARCHAR(50),
    new_status VARCHAR(50),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (agreement_id) REFERENCES agreements(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_agreement (agreement_id),
    INDEX idx_user (user_id),
    INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
