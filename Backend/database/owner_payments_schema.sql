-- Owner Payments Table
-- Stores payment records for owner dashboard tracking
-- Links talent_id, user_id, and payment information

CREATE TABLE IF NOT EXISTS owner_payments (
  id INT PRIMARY KEY AUTO_INCREMENT,
  talent_id INT NOT NULL,
  user_id INT NOT NULL,
  job_id INT NOT NULL,
  amount DECIMAL(12, 2) NOT NULL,
  currency VARCHAR(3) DEFAULT 'ETB',
  transaction_id VARCHAR(255) UNIQUE NOT NULL,
  status ENUM('pending', 'completed', 'failed', 'released') DEFAULT 'pending',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  -- Foreign keys
  FOREIGN KEY (talent_id) REFERENCES talents(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (job_id) REFERENCES jobs(id) ON DELETE CASCADE,
  
  -- Indexes for faster queries
  INDEX idx_talent_id (talent_id),
  INDEX idx_user_id (user_id),
  INDEX idx_job_id (job_id),
  INDEX idx_transaction_id (transaction_id),
  INDEX idx_status (status),
  INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
