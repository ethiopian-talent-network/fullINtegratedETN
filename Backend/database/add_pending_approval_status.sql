-- Add pending_approval status to escrow table
ALTER TABLE escrow 
MODIFY COLUMN status ENUM('pending', 'pending_approval', 'funded', 'released', 'failed') DEFAULT 'pending';