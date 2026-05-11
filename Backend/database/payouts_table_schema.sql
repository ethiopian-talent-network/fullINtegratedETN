-- Payouts Table
CREATE TABLE IF NOT EXISTS payouts (
    id INT AUTO_INCREMENT PRIMARY KEY,
    talent_id INT NOT NULL,
    escrow_id INT NOT NULL,
    amount DECIMAL(15, 2) NOT NULL,
    currency VARCHAR(3) DEFAULT 'ETB',
    payout_method ENUM('bank', 'telebirr', 'cbe_birr') NOT NULL,
    account_info JSON,
    status ENUM('pending', 'processing', 'completed', 'failed') DEFAULT 'pending',
    transaction_ref VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMP NULL,
    FOREIGN KEY (talent_id) REFERENCES talents(id) ON DELETE CASCADE,
    FOREIGN KEY (escrow_id) REFERENCES escrow(id) ON DELETE CASCADE,
    INDEX idx_talent (talent_id),
    INDEX idx_status (status),
    INDEX idx_created (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
