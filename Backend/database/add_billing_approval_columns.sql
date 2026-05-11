-- Add approval workflow columns to billing table
ALTER TABLE billing 
ADD COLUMN approval_status ENUM('pending', 'approved', 'rejected') DEFAULT 'pending' AFTER is_verified,
ADD COLUMN admin_note TEXT AFTER approval_status,
ADD COLUMN approved_by INT AFTER admin_note,
ADD COLUMN approved_at TIMESTAMP NULL AFTER approved_by,
ADD FOREIGN KEY (approved_by) REFERENCES users(id) ON DELETE SET NULL;

-- Add index for approval_status
CREATE INDEX idx_approval_status ON billing(approval_status);
