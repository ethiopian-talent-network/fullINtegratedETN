# Escrow Payment Verification Workflow

## Overview

This document describes the complete workflow for hiring talent through the escrow payment verification system. The process ensures secure payment handling with owner/admin verification before talent is marked as hired.

## Workflow Stages

### Stage 1: Application Submission
- Talent applies for a job
- Application status: `pending`
- Tokens are deducted from talent's balance

### Stage 2: Employer Initiates Payment
- Employer clicks "Hire & Pay via Escrow" button
- Employer submits payment details via `/api/payment/submit-for-verification`
- **Application status changes to: `payment_pending`**
- Payment verification record is created with status `pending`
- Owner/Admin receives notification about pending payment verification

### Stage 3: Owner/Admin Verification
- Owner/Admin reviews payment in verification dashboard
- Owner/Admin can:
  - **Verify Payment**: Payment is approved
  - **Reject Payment**: Payment is declined with reason

### Stage 4: Payment Approved (After Verification)
- Owner/Admin clicks "Verify" on payment
- Payment verification status: `verified`
- **Application status changes to: `hired`**
- Hiring record is automatically created
- Talent receives notification: "Congratulations! You've been hired!"
- Employer receives notification: "Payment verified and secured in escrow"
- Payment is held in escrow until work completion

### Stage 5: Payment Rejected (Alternative)
- Owner/Admin clicks "Reject" with reason
- Payment verification status: `rejected`
- **Application status remains: `payment_pending`** (or can be reverted to `pending`)
- Employer receives notification with rejection reason
- Employer can resubmit payment or cancel

## API Endpoints

### 1. Submit Payment for Verification (Employer)
```
POST /api/payment/submit-for-verification
Authorization: Bearer {token}
Content-Type: application/json

{
  "job_id": 123,
  "talent_id": 456,
  "application_id": 789,
  "amount": 5000,
  "currency": "ETB",
  "payment_method": "chapa",
  "transaction_id": "tx_ref_12345"
}

Response:
{
  "message": "Payment submitted for verification successfully",
  "verification_id": 1,
  "payment_id": 1,
  "status": "payment_pending"
}
```

### 2. Get Applications by Status (Employer Dashboard)
```
GET /api/applications/job/:jobId/by-status
Authorization: Bearer {token}

Response:
{
  "message": "Applications retrieved successfully",
  "data": {
    "hired": [...],
    "payment_pending": [...],
    "shortlisted": [...],
    "accepted": [...],
    "pending": [...],
    "rejected": [...],
    "withdrawn": [...]
  },
  "summary": {
    "total": 10,
    "hired": 2,
    "payment_pending": 1,
    "shortlisted": 3,
    ...
  }
}
```

### 3. Get All Payments for Verification (Owner/Admin)
```
GET /api/payment-verification/?status=pending&page=1&limit=20
Authorization: Bearer {token}
Role: owner or admin

Response:
{
  "message": "Payments retrieved successfully",
  "payments": [
    {
      "id": 1,
      "payment_id": 1,
      "job_id": 123,
      "talent_id": 456,
      "amount": 5000,
      "currency": "ETB",
      "verification_status": "pending",
      "job_title": "Web Development",
      "talent_name": "John Doe",
      "talent_email": "john@example.com",
      ...
    }
  ],
  "pagination": {...}
}
```

### 4. Verify Payment (Owner/Admin)
```
POST /api/payment-verification/:id/verify
Authorization: Bearer {token}
Role: owner or admin
Content-Type: application/json

{
  "verification_notes": "Payment verified successfully"
}

Response:
{
  "message": "Payment verified successfully",
  "verification_id": 1
}
```

### 5. Reject Payment (Owner/Admin)
```
POST /api/payment-verification/:id/reject
Authorization: Bearer {token}
Role: owner or admin
Content-Type: application/json

{
  "rejection_reason": "Payment amount does not match job budget",
  "verification_notes": "Additional notes"
}

Response:
{
  "message": "Payment rejected successfully",
  "verification_id": 1
}
```

## Database Schema

### Applications Table
```sql
ALTER TABLE applications MODIFY COLUMN status ENUM(
  'pending',
  'shortlisted',
  'accepted',
  'rejected',
  'withdrawn',
  'payment_pending',  -- NEW: Payment submitted for verification
  'hired'             -- NEW: Payment verified, talent hired
) DEFAULT 'pending';

ALTER TABLE applications ADD COLUMN payment_verification_id INT NULL;
ALTER TABLE applications ADD COLUMN hired_at TIMESTAMP NULL;
```

### Payment Verifications Table
```sql
CREATE TABLE payment_verifications (
  id INT AUTO_INCREMENT PRIMARY KEY,
  payment_id INT NOT NULL,
  job_id INT NOT NULL,
  employer_id INT NOT NULL,
  talent_id INT NOT NULL,
  amount DECIMAL(10, 2) NOT NULL,
  currency VARCHAR(10) DEFAULT 'ETB',
  verification_status ENUM('pending', 'verified', 'rejected') DEFAULT 'pending',
  verified_by INT NULL,
  verified_at TIMESTAMP NULL,
  verification_notes TEXT,
  rejection_reason TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  ...
);
```

## Status Flow Diagram

```
Application Submitted
        ↓
    pending
        ↓
Employer clicks "Hire & Pay via Escrow"
        ↓
    payment_pending ← Payment submitted for verification
        ↓
Owner/Admin Reviews Payment
        ├─→ VERIFY ─→ hired ← Payment verified, talent hired
        └─→ REJECT ─→ payment_pending (can resubmit)
```

## Notifications

### To Owner/Admin
- **Type**: `payment_pending_verification`
- **Trigger**: When employer submits payment
- **Message**: "Payment of {amount} {currency} for '{job_title}' from {talent_name} is pending your verification."

### To Employer
- **Type**: `payment_verified`
- **Trigger**: When owner verifies payment
- **Message**: "Your payment of {amount} {currency} for job has been verified by the owner."

- **Type**: `payment_rejected`
- **Trigger**: When owner rejects payment
- **Message**: "Your payment of {amount} {currency} has been rejected. Reason: {rejection_reason}"

### To Talent
- **Type**: `payment_verified`
- **Trigger**: When owner verifies payment
- **Message**: "Payment of {amount} {currency} has been verified and will be processed."

- **Type**: `hired`
- **Trigger**: When payment is verified
- **Message**: "Congratulations! You've been hired! {company_name} has hired you for '{job_title}'. Payment has been verified and secured in escrow."

## Implementation Notes

1. **Transaction Safety**: All database operations use transactions to ensure data consistency
2. **Validation**: Employer must own the job, talent must exist, and payment amount must be valid
3. **Idempotency**: Multiple payment submissions for same job are handled gracefully
4. **Audit Trail**: All verification actions are logged in `payment_verification_audit` table
5. **Security**: Only owner/admin can verify or reject payments

## Frontend Integration

### Employer Dashboard - Applications Section

```typescript
// Get applications grouped by status
const response = await fetch(`/api/applications/job/${jobId}/by-status`, {
  headers: { Authorization: `Bearer ${token}` }
});

const { data, summary } = await response.json();

// Display tabs for each status
// - Hired (data.hired)
// - Payment Pending (data.payment_pending)
// - Shortlisted (data.shortlisted)
// - etc.

// For each application in payment_pending:
// Show "Awaiting Admin Verification" status
// Disable further actions until verification complete
```

### Submit Payment Flow

```typescript
// When employer clicks "Hire & Pay via Escrow"
const submitPayment = async (jobId, talentId, applicationId, amount) => {
  const response = await fetch('/api/payment/submit-for-verification', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`
    },
    body: JSON.stringify({
      job_id: jobId,
      talent_id: talentId,
      application_id: applicationId,
      amount: amount,
      currency: 'ETB',
      payment_method: 'chapa'
    })
  });

  const { status, verification_id } = await response.json();
  // status will be 'payment_pending'
  // Show confirmation: "Payment submitted for verification"
};
```

## Testing Checklist

- [ ] Employer can submit payment for verification
- [ ] Application status changes to `payment_pending`
- [ ] Owner/Admin receives notification
- [ ] Owner/Admin can view pending payments
- [ ] Owner/Admin can verify payment
- [ ] Application status changes to `hired` after verification
- [ ] Talent receives "hired" notification
- [ ] Employer receives "verified" notification
- [ ] Owner/Admin can reject payment with reason
- [ ] Employer receives rejection notification
- [ ] Applications are properly grouped by status in dashboard
- [ ] Payment verification audit log is created
