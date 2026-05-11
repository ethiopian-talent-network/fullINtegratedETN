-- Notifications table schema for ETN platform
-- Supports both talent and employer notifications

CREATE TABLE IF NOT EXISTS notifications (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  type ENUM('new_application', 'license_result', 'connection_request', 'connection_accepted', 'new_message') NOT NULL,
  title VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  -- Optional fields for different notification types
  sender_user_id INT NULL,
  sender_talent_id INT NULL,
  connection_id INT NULL,
  
  -- Indexes for performance
  INDEX idx_user_id (user_id),
  INDEX idx_type (type),
  INDEX idx_is_read (is_read),
  INDEX idx_created_at (created_at),
  
  -- Foreign key constraints
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (sender_user_id) REFERENCES users(id) ON DELETE SET NULL,
  FOREIGN KEY (sender_talent_id) REFERENCES talents(id) ON DELETE SET NULL
);