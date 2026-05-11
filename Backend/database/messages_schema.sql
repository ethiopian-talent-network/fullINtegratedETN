-- Messages table for talent-to-talent messaging
CREATE TABLE IF NOT EXISTS messages (
  id INT AUTO_INCREMENT PRIMARY KEY,
  sender_id INT NOT NULL,
  reciver_id INT NOT NULL,
  content TEXT NOT NULL,
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (sender_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (reciver_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_sender_reciver (sender_id, reciver_id),
  INDEX idx_created_at (created_at),
  INDEX idx_is_read (is_read)
);
