# Escrow Payment Verification - Visual Workflow

## Application Status Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                    APPLICATION LIFECYCLE                         │
└─────────────────────────────────────────────────────────────────┘

                          ┌──────────────┐
                          │   PENDING    │
                          │ (Initial)    │
                          └──────┬───────┘
                                 │
                    ┌────────────┼────────────┐
                    │            │            │
                    ▼            ▼            ▼
            ┌──────────────┐ ┌──────────┐ ┌──────────┐
            │ SHORTLISTED  │ │ REJECTED │ │ WITHDRAWN│
            └──────┬───────┘ └──────────┘ └──────────┘
                   │
                   │ Employer clicks "Hire & Pay via Escrow"
                   │
                   ▼
        ┌──────────────────────────┐
        │   PAYMENT_PENDING        │
        │ (Awaiting Admin Review)  │
        └──────┬───────────────────┘
               │
        ┌──────┴──────┐
        │             │
        ▼             ▼
    ┌────────┐   ┌──────────┐
    │ HIRED  │   │ REJECTED │
    │(Verified)  │(Resubmit)│
    └────────┘   └──────────┘
```

## Sequence Diagram

```
Employer          System           Owner/Admin        Talent
   │                │                  │                │
   │─ Click "Hire"─>│                  │                │
   │                │                  │                │
   │<─ Show Form ───│                  │                │
   │                │                  │                │
   │─ Submit ──────>│                  │                │
   │                │                  │                │
   │                ├─ Create Payment ─┤                │
   │                │                  │                │
   │                ├─ Create Verification Record      │
   │                │                  │                │
   │                ├─ Update App Status to payment_pending
   │                │                  │                │
   │<─ Success ─────│                  │                │
   │                │                  │                │
   │                ├─ Send Notification ──────────────>│
   │                │                  │                │
   │                │                  │<─ Notification │
   │                │                  │                │
   │                │                  │ Review Payment │
   │                │                  │                │
   │                │                  │─ Click Verify ─┤
   │                │                  │                │
   │                │<─ Verify Payment ┤                │
   │                │                  │                │
   │                ├─ Update App Status to hired
   │                │                  │                │
   │                ├─ Create Hiring Record
   │                │                  │                │
   │<─ Notification ┤                  │                │
   │                │                  │                │
   │                │                  │<─ Notification ┤
   │                │                  │                │
   │                │                  │                │ Hired!
```

## Data Flow

```
┌──────────────────────────────────────────────────────────────┐
│                    EMPLOYER SUBMITS PAYMENT                   │
└──────────────────────────────────────────────────────────────┘
                              │
                              ▼
                    ┌─────────────────────┐
                    │ POST /api/payment/  │
                    │ submit-for-         │
                    │ verification        │
                    └─────────┬───────────┘
                              │
                ┌─────────────┼─────────────┐
                │             │             │
                ▼             ▼             ▼
        ┌──────────────┐ ┌──────────┐ ┌──────────────┐
        │   Payments   │ │Payment   │ │Applications  │
        │   Table      │ │Verif.    │ │ Table        │
        │              │ │Table     │ │              │
        │ id: 1        │ │id: 1     │ │ id: 1        │
        │ status:      │ │status:   │ │ status:      │
        │ pending      │ │pending   │ │ payment_     │
        │              │ │          │ │ pending      │
        └──────────────┘ └──────────┘ └──────────────┘
                │             │             │
                └─────────────┼─────────────┘
                              │
                              ▼
                    ┌─────────────────────┐
                    │  Notifications      │
                    │  Sent to Owner/Admin│
                    └─────────────────────┘

┌──────────────────────────────────────────────────────────────┐
│                    OWNER/ADMIN VERIFIES PAYMENT               │
└──────────────────────────────────────────────────────────────┘
                              │
                              ▼
                    ┌─────────────────────┐
                    │ POST /api/payment-  │
                    │ verification/:id/   │
                    │ verify              │
                    └─────────┬───────────┘
                              │
                ┌─────────────┼─────────────┐
                │             │             │
                ▼             ▼             ▼
        ┌──────────────┐ ┌──────────┐ ┌──────────────┐
        │Payment Verif.│ │Hirings   │ │Applications  │
        │ Table        │ │Table     │ │ Table        │
        │              │ │          │ │              │
        │ status:      │ │ id: 1    │ │ status:      │
        │ verified     │ │ hired_at │ │ hired        │
        │ verified_by: │ │ status:  │ │ hired_at:    │
        │ owner_id     │ │ active   │ │ NOW()        │
        │ verified_at: │ │          │ │              │
        │ NOW()        │ │          │ │              │
        └──────────────┘ └──────────┘ └──────────────┘
                │             │             │
                └─────────────┼─────────────┘
                              │
                              ▼
                    ┌─────────────────────┐
                    │  Notifications      │
                    │  Sent to:           │
                    │  - Employer         │
                    │  - Talent           │
                    └─────────────────────┘
```

## Status Transition Matrix

```
┌─────────────────┬──────────────┬──────────────┬──────────────┐
│ Current Status  │ Trigger      │ New Status   │ Action       │
├─────────────────┼──────────────┼──────────────┼──────────────┤
│ pending         │ Employer     │ payment_     │ Create       │
│                 │ submits      │ pending      │ payment      │
│                 │ payment      │              │ verification │
├─────────────────┼──────────────┼──────────────┼──────────────┤
│ payment_pending │ Owner        │ hired        │ Create       │
│                 │ verifies     │              │ hiring       │
│                 │ payment      │              │ record       │
├─────────────────┼──────────────┼──────────────┼──────────────┤
│ payment_pending │ Owner        │ payment_     │ Log          │
│                 │ rejects      │ pending      │ rejection    │
│                 │ payment      │              │ reason       │
├─────────────────┼──────────────┼──────────────┼──────────────┤
│ pending         │ Employer     │ shortlisted  │ Shortlist    │
│                 │ shortlists   │              │ talent       │
├─────────────────┼──────────────┼──────────────┼──────────────┤
│ pending         │ Employer     │ rejected     │ Reject       │
│                 │ rejects      │              │ application  │
├─────────────────┼──────────────┼──────────────┼──────────────┤
│ pending         │ Talent       │ withdrawn    │ Refund       │
│                 │ withdraws    │              │ tokens       │
└─────────────────┴──────────────┴──────────────┴──────────────┘
```

## Database Relationships

```
┌──────────────────┐
│   applications   │
├──────────────────┤
│ id (PK)          │
│ job_id (FK)      │
│ talent_id (FK)   │
│ status           │◄─────────────────────┐
│ payment_verif_id │◄──────────┐          │
│ hired_at         │           │          │
│ applied_at       │           │          │
│ updated_at       │           │          │
└──────────────────┘           │          │
                               │          │
                    ┌──────────┴──────────┴──────────┐
                    │                                 │
                    ▼                                 ▼
        ┌──────────────────────┐        ┌──────────────────────┐
        │payment_verifications │        │      hirings         │
        ├──────────────────────┤        ├──────────────────────┤
        │ id (PK)              │        │ id (PK)              │
        │ payment_id (FK)      │        │ employer_id (FK)     │
        │ job_id (FK)          │        │ talent_id (FK)       │
        │ employer_id (FK)     │        │ job_id (FK)          │
        │ talent_id (FK)       │        │ application_id (FK)  │
        │ amount               │        │ hired_at             │
        │ currency             │        │ status               │
        │ verification_status  │        │ created_at           │
        │ verified_by (FK)     │        └──────────────────────┘
        │ verified_at          │
        │ verification_notes   │
        │ rejection_reason     │
        │ created_at           │
        └──────────────────────┘
```

## Notification Flow

```
┌─────────────────────────────────────────────────────────────┐
│              NOTIFICATION DISTRIBUTION                       │
└─────────────────────────────────────────────────────────────┘

Step 1: Payment Submitted
┌──────────────────────────────────────────────────────────────┐
│ Recipient: Owner/Admin                                       │
│ Type: payment_pending_verification                           │
│ Title: Payment Pending Verification                          │
│ Message: Payment of {amount} {currency} for "{job_title}"    │
│          from {talent_name} is pending your verification.    │
└──────────────────────────────────────────────────────────────┘

Step 2: Payment Verified
┌──────────────────────────────────────────────────────────────┐
│ Recipient: Employer                                          │
│ Type: payment_verified                                       │
│ Title: Payment Verified                                      │
│ Message: Your payment of {amount} {currency} for job has     │
│          been verified by the owner.                         │
├──────────────────────────────────────────────────────────────┤
│ Recipient: Talent                                            │
│ Type: payment_verified                                       │
│ Title: Payment Verified                                      │
│ Message: Payment of {amount} {currency} has been verified    │
│          and will be processed.                              │
├──────────────────────────────────────────────────────────────┤
│ Recipient: Talent                                            │
│ Type: hired                                                  │
│ Title: Congratulations! You've been hired!                   │
│ Message: {company_name} has hired you for "{job_title}".     │
│          Payment has been verified and secured in escrow.    │
└──────────────────────────────────────────────────────────────┘

Step 3: Payment Rejected
┌──────────────────────────────────────────────────────────────┐
│ Recipient: Employer                                          │
│ Type: payment_rejected                                       │
│ Title: Payment Rejected                                      │
│ Message: Your payment of {amount} {currency} has been        │
│          rejected. Reason: {rejection_reason}                │
└──────────────────────────────────────────────────────────────┘
```

## API Endpoint Summary

```
┌─────────────────────────────────────────────────────────────┐
│                    API ENDPOINTS                             │
└─────────────────────────────────────────────────────────────┘

EMPLOYER ENDPOINTS:
├─ POST /api/payment/submit-for-verification
│  └─ Submit payment for verification
│
└─ GET /api/applications/job/:jobId/by-status
   └─ Get applications grouped by status

OWNER/ADMIN ENDPOINTS:
├─ GET /api/payment-verification/
│  └─ Get all payments for verification
│
├─ GET /api/payment-verification/:id
│  └─ Get payment details
│
├─ POST /api/payment-verification/:id/verify
│  └─ Verify payment (marks talent as hired)
│
└─ POST /api/payment-verification/:id/reject
   └─ Reject payment with reason
```

## Key Metrics

```
┌─────────────────────────────────────────────────────────────┐
│                    DASHBOARD METRICS                         │
└─────────────────────────────────────────────────────────────┘

EMPLOYER DASHBOARD:
├─ Total Applications: Count of all applications
├─ Hired: Count of applications with status = 'hired'
├─ Payment Pending: Count of applications with status = 'payment_pending'
├─ Shortlisted: Count of applications with status = 'shortlisted'
├─ Accepted: Count of applications with status = 'accepted'
├─ Pending: Count of applications with status = 'pending'
├─ Rejected: Count of applications with status = 'rejected'
└─ Withdrawn: Count of applications with status = 'withdrawn'

OWNER/ADMIN DASHBOARD:
├─ Total Payments: Count of all payment verifications
├─ Pending: Count with verification_status = 'pending'
├─ Verified: Count with verification_status = 'verified'
├─ Rejected: Count with verification_status = 'rejected'
├─ Total Amount Pending: Sum of amounts with status = 'pending'
├─ Total Amount Verified: Sum of amounts with status = 'verified'
└─ Total Amount Rejected: Sum of amounts with status = 'rejected'
```
