# Quick Setup Guide - Escrow Payment Verification

## Step 1: Run Database Migration

Execute this SQL to add the new columns and status:

```sql
-- Add payment_pending status to applications table
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
```

Or run the migration file:
```bash
cd Backend
mysql -u root -p etn_db < database/add_payment_pending_status.sql
```

## Step 2: Verify Implementation

Check that the following files have been updated:

1. ✅ `Backend/controllers/paymentControllers.js` - Contains `submitPaymentForVerification` function
2. ✅ `Backend/controllers/paymentVerificationController.js` - Enhanced `verifyPayment` function
3. ✅ `Backend/controllers/applicationController.js` - Contains `getApplicationsByStatus` function
4. ✅ `Backend/routes/paymentRoutes.js` - Contains new route
5. ✅ `Backend/routes/applicationRoutes.js` - Contains new route

## Step 3: Test the Workflow

### Test 1: Submit Payment for Verification
```bash
curl -X POST http://localhost:5000/api/payment/submit-for-verification \
  -H "Authorization: Bearer {employer_token}" \
  -H "Content-Type: application/json" \
  -d '{
    "job_id": 1,
    "talent_id": 1,
    "application_id": 1,
    "amount": 5000,
    "currency": "ETB",
    "payment_method": "chapa"
  }'
```

Expected Response:
```json
{
  "message": "Payment submitted for verification successfully",
  "verification_id": 1,
  "payment_id": 1,
  "status": "payment_pending"
}
```

### Test 2: Check Application Status
```bash
curl -X GET http://localhost:5000/api/applications/job/1/by-status \
  -H "Authorization: Bearer {employer_token}"
```

Expected Response:
```json
{
  "message": "Applications retrieved successfully",
  "data": {
    "hired": [],
    "payment_pending": [
      {
        "applicationID": 1,
        "status": "payment_pending",
        "name": "Talent Name",
        ...
      }
    ],
    ...
  },
  "summary": {
    "total": 1,
    "hired": 0,
    "payment_pending": 1,
    ...
  }
}
```

### Test 3: Verify Payment (Owner/Admin)
```bash
curl -X POST http://localhost:5000/api/payment-verification/1/verify \
  -H "Authorization: Bearer {owner_token}" \
  -H "Content-Type: application/json" \
  -d '{
    "verification_notes": "Payment verified successfully"
  }'
```

Expected Response:
```json
{
  "message": "Payment verified successfully",
  "verification_id": 1
}
```

### Test 4: Check Application Status After Verification
```bash
curl -X GET http://localhost:5000/api/applications/job/1/by-status \
  -H "Authorization: Bearer {employer_token}"
```

Expected Response:
```json
{
  "data": {
    "hired": [
      {
        "applicationID": 1,
        "status": "hired",
        "hired_at": "2024-01-15T10:30:00Z",
        ...
      }
    ],
    "payment_pending": [],
    ...
  },
  "summary": {
    "total": 1,
    "hired": 1,
    "payment_pending": 0,
    ...
  }
}
```

## Step 4: Frontend Integration

### Display Applications by Status in Employer Dashboard

```typescript
// Fetch applications grouped by status
const fetchApplicationsByStatus = async (jobId: string) => {
  const response = await fetch(`/api/applications/job/${jobId}/by-status`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  return response.json();
};

// Use in component
const { data, summary } = await fetchApplicationsByStatus(jobId);

// Display tabs
const tabs = [
  { label: 'Hired', count: summary.hired, applications: data.hired },
  { label: 'Payment Pending', count: summary.payment_pending, applications: data.payment_pending },
  { label: 'Shortlisted', count: summary.shortlisted, applications: data.shortlisted },
  // ... other tabs
];
```

### Submit Payment for Verification

```typescript
const submitPaymentForVerification = async (
  jobId: number,
  talentId: number,
  applicationId: number,
  amount: number
) => {
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

  const result = await response.json();
  
  if (response.ok) {
    // Show success message
    // Application status is now 'payment_pending'
    // Refresh applications list
  } else {
    // Show error message
  }
};
```

## Workflow Status Indicators

### For Employer Dashboard

| Status | Display | Action |
|--------|---------|--------|
| `pending` | "Pending Review" | Can shortlist or reject |
| `shortlisted` | "Shortlisted" | Can hire & pay |
| `payment_pending` | "Awaiting Admin Verification" | Cannot take action (waiting for owner) |
| `hired` | "Hired" | View contract/messaging |
| `rejected` | "Rejected" | Cannot take action |
| `withdrawn` | "Withdrawn" | Cannot take action |

### For Owner/Admin Dashboard

| Status | Display | Action |
|--------|---------|--------|
| `pending` | "Pending Verification" | Verify or Reject |
| `verified` | "Verified" | View details |
| `rejected` | "Rejected" | View rejection reason |

## Troubleshooting

### Issue: "Employer profile not found"
- Ensure employer has completed profile setup
- Check that user_id is correctly linked to employer

### Issue: "Job not found or does not belong to you"
- Verify job_id is correct
- Ensure employer owns the job

### Issue: "Talent not found"
- Verify talent_id is correct
- Ensure talent profile exists

### Issue: Application status not updating
- Check database transaction completed successfully
- Verify payment_verifications table has the record
- Check application_id is correct

## Documentation Files

- `Backend/ESCROW_PAYMENT_WORKFLOW.md` - Detailed workflow documentation
- `Backend/IMPLEMENTATION_SUMMARY.md` - Implementation overview
- `Backend/QUICK_SETUP.md` - This file

## Support

For issues or questions, refer to:
1. ESCROW_PAYMENT_WORKFLOW.md for detailed workflow
2. IMPLEMENTATION_SUMMARY.md for implementation details
3. Check database logs for transaction errors
4. Review notification logs to verify notifications are sent
