-- Hiring records table to track employer-talent hiring relationships
CREATE TABLE IF NOT EXISTS hirings (
    id INT AUTO_INCREMENT PRIMARY KEY,
    employer_id INT NOT NULL,
    talent_id INT NOT NULL,
    job_id INT NOT NULL,
    application_id INT,
    hired_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    status ENUM('active', 'completed', 'cancelled') DEFAULT 'active',
    FOREIGN KEY (employer_id) REFERENCES employers(id) ON DELETE CASCADE,
    FOREIGN KEY (talent_id) REFERENCES talents(id) ON DELETE CASCADE,
    FOREIGN KEY (job_id) REFERENCES jobs(id) ON DELETE CASCADE,
    FOREIGN KEY (application_id) REFERENCES applications(id) ON DELETE SET NULL,
    UNIQUE KEY unique_hiring (employer_id, talent_id, job_id),
    INDEX idx_employer (employer_id),
    INDEX idx_talent (talent_id),
    INDEX idx_job (job_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Employer-Talent conversations table (separate from talent-talent messaging)
CREATE TABLE IF NOT EXISTS employer_talent_messages (
    id INT AUTO_INCREMENT PRIMARY KEY,
    hiring_id INT NOT NULL,
    sender_id INT NOT NULL,
    receiver_id INT NOT NULL,
    sender_type ENUM('employer', 'talent') NOT NULL,
    content TEXT NOT NULL,
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (hiring_id) REFERENCES hirings(id) ON DELETE CASCADE,
    FOREIGN KEY (sender_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (receiver_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_hiring (hiring_id),
    INDEX idx_sender_receiver (sender_id, receiver_id),
    INDEX idx_created_at (created_at),
    INDEX idx_is_read (is_read)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;