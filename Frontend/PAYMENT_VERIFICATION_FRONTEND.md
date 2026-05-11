# Frontend Implementation Examples

## React Components for Employer Dashboard

### 1. Applications Section with Status Tabs

```typescript
// ApplicationsSection.tsx
import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';

interface Application {
  applicationID: number;
  status: 'pending' | 'shortlisted' | 'accepted' | 'rejected' | 'withdrawn' | 'payment_pending' | 'hired';
  name: string;
  email: string;
  applied_at: string;
  hired_at?: string;
  cover_letter?: string;
}

interface ApplicationsSummary {
  total: number;
  hired: number;
  payment_pending: number;
  shortlisted: number;
  accepted: number;
  pending: number;
  rejected: number;
  withdrawn: number;
}

export const ApplicationsSection: React.FC = () => {
  const { jobId } = useParams<{ jobId: string }>();
  const [applications, setApplications] = useState<Record<string, Application[]>>({});
  const [summary, setSummary] = useState<ApplicationsSummary | null>(null);
  const [activeTab, setActiveTab] = useState<string>('hired');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchApplicationsByStatus();
  }, [jobId]);

  const fetchApplicationsByStatus = async () => {
    try {
      const response = await fetch(`/api/applications/job/${jobId}/by-status`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`
        }
      });
      const result = await response.json();
      setApplications(result.data);
      setSummary(result.summary);
    } catch (error) {
      console.error('Error fetching applications:', error);
    } finally {
      setLoading(false);
    }
  };

  const tabs = [
    { id: 'hired', label: 'Hired', count: summary?.hired || 0 },
    { id: 'payment_pending', label: 'Payment Pending', count: summary?.payment_pending || 0 },
    { id: 'shortlisted', label: 'Shortlisted', count: summary?.shortlisted || 0 },
    { id: 'accepted', label: 'Accepted', count: summary?.accepted || 0 },
    { id: 'pending', label: 'Pending', count: summary?.pending || 0 },
    { id: 'rejected', label: 'Rejected', count: summary?.rejected || 0 },
    { id: 'withdrawn', label: 'Withdrawn', count: summary?.withdrawn || 0 },
  ];

  if (loading) return <div>Loading...</div>;

  return (
    <div className="applications-section">
      <div className="tabs">
        {tabs.map(tab => (
          <button
            key={tab.id}
            className={`tab ${activeTab === tab.id ? 'active' : ''}`}
            onClick={() => setActiveTab(tab.id)}
          >
            {tab.label} ({tab.count})
          </button>
        ))}
      </div>

      <div className="applications-list">
        {applications[activeTab]?.map(app => (
          <ApplicationCard
            key={app.applicationID}
            application={app}
            jobId={jobId!}
            onPaymentSubmitted={fetchApplicationsByStatus}
          />
        ))}
      </div>
    </div>
  );
};
```

### 2. Application Card Component

```typescript
// ApplicationCard.tsx
import React, { useState } from 'react';
import { AlertCircle, CheckCircle, Clock } from 'lucide-react';

interface ApplicationCardProps {
  application: Application;
  jobId: string;
  onPaymentSubmitted: () => void;
}

export const ApplicationCard: React.FC<ApplicationCardProps> = ({
  application,
  jobId,
  onPaymentSubmitted
}) => {
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [amount, setAmount] = useState('');
  const [loading, setLoading] = useState(false);

  const getStatusBadge = () => {
    const statusConfig = {
      hired: { color: 'bg-green-100 text-green-800', icon: CheckCircle, label: 'Hired' },
      payment_pending: { color: 'bg-yellow-100 text-yellow-800', icon: Clock, label: 'Awaiting Verification' },
      shortlisted: { color: 'bg-blue-100 text-blue-800', icon: null, label: 'Shortlisted' },
      accepted: { color: 'bg-green-100 text-green-800', icon: null, label: 'Accepted' },
      pending: { color: 'bg-gray-100 text-gray-800', icon: null, label: 'Pending' },
      rejected: { color: 'bg-red-100 text-red-800', icon: null, label: 'Rejected' },
      withdrawn: { color: 'bg-gray-100 text-gray-800', icon: null, label: 'Withdrawn' },
    };

    const config = statusConfig[application.status];
    const Icon = config.icon;

    return (
      <div className={`badge ${config.color}`}>
        {Icon && <Icon className="w-4 h-4 inline mr-1" />}
        {config.label}
      </div>
    );
  };

  const handleSubmitPayment = async () => {
    if (!amount) {
      alert('Please enter an amount');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('/api/payment/submit-for-verification', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          job_id: parseInt(jobId),
          talent_id: application.talent_id,
          application_id: application.applicationID,
          amount: parseFloat(amount),
          currency: 'ETB',
          payment_method: 'chapa'
        })
      });

      if (response.ok) {
        alert('Payment submitted for verification successfully!');
        setShowPaymentModal(false);
        setAmount('');
        onPaymentSubmitted();
      } else {
        const error = await response.json();
        alert(`Error: ${error.message}`);
      }
    } catch (error) {
      console.error('Error submitting payment:', error);
      alert('Failed to submit payment');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="application-card">
      <div className="card-header">
        <div className="talent-info">
          <h3>{application.name}</h3>
          <p>{application.email}</p>
        </div>
        {getStatusBadge()}
      </div>

      <div className="card-body">
        {application.cover_letter && (
          <div className="cover-letter">
            <h4>Cover Letter</h4>
            <p>{application.cover_letter}</p>
          </div>
        )}
        <p className="applied-date">Applied: {new Date(application.applied_at).toLocaleDateString()}</p>
        {application.hired_at && (
          <p className="hired-date">Hired: {new Date(application.hired_at).toLocaleDateString()}</p>
        )}
      </div>

      <div className="card-actions">
        {application.status === 'pending' && (
          <>
            <button className="btn btn-primary" onClick={() => setShowPaymentModal(true)}>
              Hire & Pay via Escrow
            </button>
            <button className="btn btn-secondary">Shortlist</button>
          </>
        )}
        {application.status === 'shortlisted' && (
          <>
            <button className="btn btn-primary" onClick={() => setShowPaymentModal(true)}>
              Hire & Pay via Escrow
            </button>
          </>
        )}
        {application.status === 'payment_pending' && (
          <div className="status-info">
            <AlertCircle className="w-5 h-5 text-yellow-600" />
            <span>Awaiting admin verification. You'll be notified once verified.</span>
          </div>
        )}
        {application.status === 'hired' && (
          <>
            <button className="btn btn-secondary">View Contract</button>
            <button className="btn btn-secondary">Message</button>
          </>
        )}
      </div>

      {showPaymentModal && (
        <PaymentModal
          talentName={application.name}
          onClose={() => setShowPaymentModal(false)}
          onSubmit={handleSubmitPayment}
          amount={amount}
          setAmount={setAmount}
          loading={loading}
        />
      )}
    </div>
  );
};
```

### 3. Payment Modal Component

```typescript
// PaymentModal.tsx
import React from 'react';
import { X } from 'lucide-react';

interface PaymentModalProps {
  talentName: string;
  onClose: () => void;
  onSubmit: () => void;
  amount: string;
  setAmount: (amount: string) => void;
  loading: boolean;
}

export const PaymentModal: React.FC<PaymentModalProps> = ({
  talentName,
  onClose,
  onSubmit,
  amount,
  setAmount,
  loading
}) => {
  return (
    <div className="modal-overlay">
      <div className="modal">
        <div className="modal-header">
          <h2>Hire & Pay via Escrow</h2>
          <button onClick={onClose} className="close-btn">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="modal-body">
          <p className="mb-4">
            You are about to submit payment for <strong>{talentName}</strong>
          </p>

          <div className="form-group">
            <label htmlFor="amount">Payment Amount (ETB)</label>
            <input
              id="amount"
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="Enter amount"
              disabled={loading}
              min="0"
              step="0.01"
            />
          </div>

          <div className="info-box">
            <h4>How it works:</h4>
            <ol>
              <li>Payment is submitted for verification</li>
              <li>Admin reviews and verifies the payment</li>
              <li>Once verified, talent is marked as hired</li>
              <li>Payment is held in escrow until work completion</li>
            </ol>
          </div>

          <div className="warning-box">
            <p>
              <strong>Note:</strong> The payment will be held in escrow and only released
              after work completion and your approval.
            </p>
          </div>
        </div>

        <div className="modal-footer">
          <button
            onClick={onClose}
            className="btn btn-secondary"
            disabled={loading}
          >
            Cancel
          </button>
          <button
            onClick={onSubmit}
            className="btn btn-primary"
            disabled={loading || !amount}
          >
            {loading ? 'Submitting...' : 'Submit Payment'}
          </button>
        </div>
      </div>
    </div>
  );
};
```

## API Service Functions

```typescript
// paymentService.ts
import { API_BASE_URL } from '../config';

export const paymentService = {
  // Submit payment for verification
  submitPaymentForVerification: async (
    jobId: number,
    talentId: number,
    applicationId: number,
    amount: number,
    currency: string = 'ETB'
  ) => {
    const response = await fetch(`${API_BASE_URL}/api/payment/submit-for-verification`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${localStorage.getItem('token')}`
      },
      body: JSON.stringify({
        job_id: jobId,
        talent_id: talentId,
        application_id: applicationId,
        amount,
        currency,
        payment_method: 'chapa'
      })
    });

    if (!response.ok) {
      throw new Error('Failed to submit payment');
    }

    return response.json();
  },

  // Get applications by status
  getApplicationsByStatus: async (jobId: number) => {
    const response = await fetch(
      `${API_BASE_URL}/api/applications/job/${jobId}/by-status`,
      {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`
        }
      }
    );

    if (!response.ok) {
      throw new Error('Failed to fetch applications');
    }

    return response.json();
  },

  // Get all payments for verification (Owner/Admin)
  getPaymentsForVerification: async (status: string = 'pending', page: number = 1) => {
    const response = await fetch(
      `${API_BASE_URL}/api/payment-verification/?status=${status}&page=${page}&limit=20`,
      {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`
        }
      }
    );

    if (!response.ok) {
      throw new Error('Failed to fetch payments');
    }

    return response.json();
  },

  // Verify payment (Owner/Admin)
  verifyPayment: async (verificationId: number, notes?: string) => {
    const response = await fetch(
      `${API_BASE_URL}/api/payment-verification/${verificationId}/verify`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          verification_notes: notes
        })
      }
    );

    if (!response.ok) {
      throw new Error('Failed to verify payment');
    }

    return response.json();
  },

  // Reject payment (Owner/Admin)
  rejectPayment: async (verificationId: number, reason: string, notes?: string) => {
    const response = await fetch(
      `${API_BASE_URL}/api/payment-verification/${verificationId}/reject`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          rejection_reason: reason,
          verification_notes: notes
        })
      }
    );

    if (!response.ok) {
      throw new Error('Failed to reject payment');
    }

    return response.json();
  }
};
```

## Owner/Admin Dashboard Component

```typescript
// PaymentVerificationDashboard.tsx
import React, { useState, useEffect } from 'react';
import { CheckCircle, XCircle, Clock } from 'lucide-react';
import { paymentService } from '../services/paymentService';

interface PaymentVerification {
  id: number;
  amount: number;
  currency: string;
  job_title: string;
  talent_name: string;
  talent_email: string;
  verification_status: 'pending' | 'verified' | 'rejected';
  created_at: string;
}

export const PaymentVerificationDashboard: React.FC = () => {
  const [payments, setPayments] = useState<PaymentVerification[]>([]);
  const [status, setStatus] = useState<'pending' | 'verified' | 'rejected' | 'all'>('pending');
  const [loading, setLoading] = useState(true);
  const [selectedPayment, setSelectedPayment] = useState<PaymentVerification | null>(null);
  const [verificationNotes, setVerificationNotes] = useState('');
  const [rejectionReason, setRejectionReason] = useState('');

  useEffect(() => {
    fetchPayments();
  }, [status]);

  const fetchPayments = async () => {
    try {
      setLoading(true);
      const result = await paymentService.getPaymentsForVerification(status);
      setPayments(result.payments);
    } catch (error) {
      console.error('Error fetching payments:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async (paymentId: number) => {
    try {
      await paymentService.verifyPayment(paymentId, verificationNotes);
      alert('Payment verified successfully!');
      setSelectedPayment(null);
      setVerificationNotes('');
      fetchPayments();
    } catch (error) {
      alert('Failed to verify payment');
    }
  };

  const handleReject = async (paymentId: number) => {
    if (!rejectionReason.trim()) {
      alert('Please provide a rejection reason');
      return;
    }

    try {
      await paymentService.rejectPayment(paymentId, rejectionReason);
      alert('Payment rejected successfully!');
      setSelectedPayment(null);
      setRejectionReason('');
      fetchPayments();
    } catch (error) {
      alert('Failed to reject payment');
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'verified':
        return <CheckCircle className="w-5 h-5 text-green-600" />;
      case 'rejected':
        return <XCircle className="w-5 h-5 text-red-600" />;
      case 'pending':
        return <Clock className="w-5 h-5 text-yellow-600" />;
      default:
        return null;
    }
  };

  if (loading) return <div>Loading...</div>;

  return (
    <div className="payment-verification-dashboard">
      <h1>Payment Verification</h1>

      <div className="filters">
        {['pending', 'verified', 'rejected', 'all'].map(s => (
          <button
            key={s}
            className={`filter-btn ${status === s ? 'active' : ''}`}
            onClick={() => setStatus(s as any)}
          >
            {s.charAt(0).toUpperCase() + s.slice(1)}
          </button>
        ))}
      </div>

      <div className="payments-table">
        <table>
          <thead>
            <tr>
              <th>Status</th>
              <th>Talent</th>
              <th>Job</th>
              <th>Amount</th>
              <th>Date</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {payments.map(payment => (
              <tr key={payment.id}>
                <td>
                  <div className="status-cell">
                    {getStatusIcon(payment.verification_status)}
                    <span>{payment.verification_status}</span>
                  </div>
                </td>
                <td>{payment.talent_name}</td>
                <td>{payment.job_title}</td>
                <td>{payment.amount} {payment.currency}</td>
                <td>{new Date(payment.created_at).toLocaleDateString()}</td>
                <td>
                  {payment.verification_status === 'pending' && (
                    <button
                      className="btn btn-sm btn-primary"
                      onClick={() => setSelectedPayment(payment)}
                    >
                      Review
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {selectedPayment && (
        <PaymentReviewModal
          payment={selectedPayment}
          onClose={() => setSelectedPayment(null)}
          onVerify={() => handleVerify(selectedPayment.id)}
          onReject={() => handleReject(selectedPayment.id)}
          verificationNotes={verificationNotes}
          setVerificationNotes={setVerificationNotes}
          rejectionReason={rejectionReason}
          setRejectionReason={setRejectionReason}
        />
      )}
    </div>
  );
};
```

## Styling (Tailwind CSS)

```css
/* ApplicationCard.css */
.application-card {
  @apply bg-white rounded-lg shadow-md p-6 mb-4;
}

.card-header {
  @apply flex justify-between items-start mb-4;
}

.talent-info h3 {
  @apply text-lg font-semibold text-gray-900;
}

.talent-info p {
  @apply text-sm text-gray-600;
}

.badge {
  @apply px-3 py-1 rounded-full text-sm font-medium;
}

.card-body {
  @apply mb-4;
}

.cover-letter {
  @apply mb-4 p-3 bg-gray-50 rounded;
}

.cover-letter h4 {
  @apply font-semibold text-gray-900 mb-2;
}

.cover-letter p {
  @apply text-gray-700 text-sm;
}

.card-actions {
  @apply flex gap-2;
}

.btn {
  @apply px-4 py-2 rounded font-medium transition-colors;
}

.btn-primary {
  @apply bg-blue-600 text-white hover:bg-blue-700;
}

.btn-secondary {
  @apply bg-gray-200 text-gray-900 hover:bg-gray-300;
}

.status-info {
  @apply flex items-center gap-2 text-yellow-700 bg-yellow-50 p-3 rounded;
}

/* Modal */
.modal-overlay {
  @apply fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50;
}

.modal {
  @apply bg-white rounded-lg shadow-xl max-w-md w-full;
}

.modal-header {
  @apply flex justify-between items-center p-6 border-b;
}

.modal-body {
  @apply p-6;
}

.form-group {
  @apply mb-4;
}

.form-group label {
  @apply block text-sm font-medium text-gray-900 mb-2;
}

.form-group input {
  @apply w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500;
}

.info-box {
  @apply bg-blue-50 p-4 rounded-lg mb-4;
}

.info-box h4 {
  @apply font-semibold text-blue-900 mb-2;
}

.info-box ol {
  @apply list-decimal list-inside text-sm text-blue-800;
}

.warning-box {
  @apply bg-yellow-50 p-4 rounded-lg;
}

.warning-box p {
  @apply text-sm text-yellow-800;
}

.modal-footer {
  @apply flex gap-2 justify-end p-6 border-t;
}
```

## Usage Example

```typescript
// In your employer dashboard page
import { ApplicationsSection } from '../components/ApplicationsSection';

export const EmployerDashboard: React.FC = () => {
  const { jobId } = useParams<{ jobId: string }>();

  return (
    <div className="dashboard">
      <h1>Job Applications</h1>
      <ApplicationsSection />
    </div>
  );
};
```
