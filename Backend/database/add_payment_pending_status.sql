-- Add payment_pending status to applications table
-- This status is used when employer submits payment for verification

ALTER TABLE applications MODIFY COLUMN status ENUM(
  'pending',
  'shortlisted',
  'accepted',
  'rejected',
  'withdrawn',
  'payment_pending',
  'hired'
) DEFAULT 'pending';

-- Add index for payment_pending status queries
ALTER TABLE applications ADD INDEX idx_status_payment_pending (status);

-- Add columns to track payment verification in applications
ALTER TABLE applications ADD COLUMN IF NOT EXISTS payment_verification_id INT NULL AFTER status;
ALTER TABLE applications ADD COLUMN IF NOT EXISTS hired_at TIMESTAMP NULL AFTER payment_verification_id;

-- Add foreign key for payment verification
ALTER TABLE applications ADD CONSTRAINT fk_payment_verification 
FOREIGN KEY (payment_verification_id) REFERENCES payment_verifications(id) ON DELETE SET NULL;
