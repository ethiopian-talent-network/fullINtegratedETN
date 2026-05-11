import React, { useState, useEffect } from 'react';
import { useParams, useSearchParams, useNavigate } from 'react-router';
import { useDarkMode } from '../../contexts/DarkModeContext';
import { useAuth } from '../../contexts/AuthContext';
import { Header } from '../../features/employer/components/Header';
import { getEscrowStatus, getPaymentReceipt, type EscrowInfo, type PaymentReceipt } from '../../api/payment/paymentApi';
import { 
  Clock, CheckCircle, AlertCircle, Loader2, ArrowLeft, 
  FileText, Printer, RefreshCw, MessageCircle, Users
} from 'lucide-react';

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string; border: string; icon: React.ElementType }> = {
  pending: { label: "Processing Payment", color: "text-blue-700", bg: "bg-blue-50", border: "border-blue-200", icon: Clock },
  pending_approval: { label: "Pending Admin Approval", color: "text-amber-700", bg: "bg-amber-50", border: "border-amber-200", icon: Clock },
  funded: { label: "Approved - Hired!", color: "text-emerald-700", bg: "bg-emerald-50", border: "border-emerald-200", icon: CheckCircle },
  released: { label: "Payment Released", color: "text-emerald-700", bg: "bg-emerald-50", border: "border-emerald-200", icon: CheckCircle },
  failed: { label: "Payment Failed", color: "text-red-700", bg: "bg-red-50", border: "border-red-200", icon: AlertCircle },
};

export default function PaymentPendingPage() {
  const { job_id } = useParams<{ job_id: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { darkMode } = useDarkMode();
  const { token } = useAuth();
  const dm = darkMode;
  const jobId = Number(job_id);
  const tx_ref = searchParams.get('tx_ref');

  const [escrow, setEscrow] = useState<EscrowInfo | null>(null);
  const [receipt, setReceipt] = useState<PaymentReceipt | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadData();
    // Auto-refresh every 30 seconds to check for approval
    const interval = setInterval(loadData, 30000);
    return () => clearInterval(interval);
  }, []);

  const loadData = async () => {
    if (!token) {
      setError('Unable to load payment status. Please sign in again.');
      setLoading(false);
      return;
    }

    if (Number.isNaN(jobId)) {
      setError('Invalid job identifier.');
      setLoading(false);
      return;
    }
    
    try {
      setError(null);
      const [escrowRes, receiptRes] = await Promise.all([
        getEscrowStatus(token, jobId).catch(() => null),
        tx_ref ? getPaymentReceipt(token, tx_ref).catch(() => null) : null
      ]);
      
      if (escrowRes) setEscrow(escrowRes.escrow);
      if (receiptRes) setReceipt(receiptRes.receipt);
      
      // If payment is approved and hiring is complete, redirect to hired tab
      if (escrowRes?.escrow?.status === 'funded') {
        // Check if hiring record exists (payment approved)
        setTimeout(() => {
          navigate('/employer/dashboard?tab=hired', { replace: true });
        }, 2000);
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    loadData();
  };

  const card = dm ? 'bg-gray-800 border-gray-700' : 'bg-white border-slate-200';
  const text = dm ? 'text-white' : 'text-gray-900';
  const muted = dm ? 'text-gray-400' : 'text-gray-500';

  if (loading) {
    return (
      <div className={`min-h-screen ${dm ? 'bg-gray-900' : 'bg-slate-100'}`}>
        <Header />
        <div className="max-w-2xl mx-auto px-4 py-16">
          <div className="flex items-center justify-center">
            <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen ${dm ? 'bg-gray-900' : 'bg-slate-100'} transition-colors duration-300`}>
      <Header />

      <div className="max-w-2xl mx-auto px-4 sm:px-6 py-8">
        {/* Back Button */}
        <button
          onClick={() => navigate('/employer/dashboard')}
          className={`flex items-center gap-2 text-sm font-medium mb-6 transition-colors ${
            dm ? 'text-gray-400 hover:text-white' : 'text-gray-500 hover:text-gray-900'
          }`}
        >
          <ArrowLeft className="w-4 h-4" /> Back to Dashboard
        </button>

        {/* Status Card */}
        <div className={`rounded-xl border overflow-hidden ${card} mb-6`}>
          <div className={`px-6 py-5 border-b ${dm ? 'border-gray-700 bg-gray-800/50' : 'border-slate-100 bg-slate-50'}`}>
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-amber-100 flex items-center justify-center">
                <Clock className="w-6 h-6 text-amber-600" />
              </div>
              <div>
                <h1 className={`text-xl font-bold ${text}`}>Payment Pending Approval</h1>
                <p className={`text-sm ${muted} mt-1`}>
                  Your payment has been submitted and is awaiting admin approval
                </p>
              </div>
            </div>
          </div>

          <div className="p-6">
            {error && (
              <div className="mb-4 flex items-start gap-3 p-4 rounded-xl bg-red-50 border border-red-200 text-red-700">
                <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                <p className="text-sm font-medium">{error}</p>
              </div>
            )}

            {/* Current Status */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className={`text-sm font-medium ${text}`}>Status</span>
                <div className="flex items-center gap-2">
                  {escrow?.status && (
                    <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-semibold border ${
                      STATUS_CONFIG[escrow.status]?.color || 'text-gray-700'
                    } ${
                      STATUS_CONFIG[escrow.status]?.bg || 'bg-gray-50'
                    } ${
                      STATUS_CONFIG[escrow.status]?.border || 'border-gray-200'
                    }`}>
                      {React.createElement(STATUS_CONFIG[escrow.status]?.icon || Clock, { className: 'w-4 h-4' })}
                      {STATUS_CONFIG[escrow.status]?.label || escrow.status}
                    </span>
                  )}
                  <button
                    onClick={handleRefresh}
                    disabled={refreshing}
                    className={`p-2 rounded-lg transition-colors ${
                      dm ? 'hover:bg-gray-700' : 'hover:bg-slate-100'
                    }`}
                    title="Refresh status"
                  >
                    <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''} ${muted}`} />
                  </button>
                </div>
              </div>

              {/* Payment Details */}
              {receipt && (
                <div className={`rounded-lg border p-4 ${dm ? 'bg-gray-700/50 border-gray-600' : 'bg-slate-50 border-slate-200'}`}>
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <FileText className="w-4 h-4 text-blue-600" />
                      <span className={`text-sm font-semibold ${text}`}>Payment Details</span>
                    </div>
                    <button
                      onClick={() => window.print()}
                      className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                        dm ? 'bg-gray-600 text-gray-200 hover:bg-gray-500' : 'bg-white text-gray-600 hover:bg-slate-100 border border-slate-200'
                      }`}
                    >
                      <Printer className="w-3.5 h-3.5" /> Print Receipt
                    </button>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div>
                      <p className={`font-medium ${muted}`}>Amount</p>
                      <p className={`font-bold text-blue-600`}>{receipt.amount.toLocaleString()} {receipt.currency}</p>
                    </div>
                    <div>
                      <p className={`font-medium ${muted}`}>Job</p>
                      <p className={text}>{receipt.job_title}</p>
                    </div>
                    <div>
                      <p className={`font-medium ${muted}`}>Talent</p>
                      <p className={text}>{receipt.talent_name}</p>
                    </div>
                    <div>
                      <p className={`font-medium ${muted}`}>Receipt #</p>
                      <p className={`font-mono text-xs ${text}`}>{receipt.receipt_number}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* What's Next */}
              <div className={`rounded-lg border p-4 ${dm ? 'bg-blue-900/20 border-blue-800' : 'bg-blue-50 border-blue-200'}`}>
                <h3 className={`text-sm font-semibold mb-3 ${dm ? 'text-blue-300' : 'text-blue-900'}`}>
                  What happens next?
                </h3>
                <div className="space-y-2">
                  <div className="flex items-start gap-3">
                    <div className="w-6 h-6 rounded-full bg-blue-600 text-white text-xs font-bold flex items-center justify-center flex-shrink-0 mt-0.5">
                      1
                    </div>
                    <div>
                      <p className={`text-sm font-medium ${dm ? 'text-blue-200' : 'text-blue-800'}`}>
                        Admin Review
                      </p>
                      <p className={`text-xs ${dm ? 'text-blue-300' : 'text-blue-600'}`}>
                        Our admin team will verify your payment within 24 hours
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-6 h-6 rounded-full bg-blue-600 text-white text-xs font-bold flex items-center justify-center flex-shrink-0 mt-0.5">
                      2
                    </div>
                    <div>
                      <p className={`text-sm font-medium ${dm ? 'text-blue-200' : 'text-blue-800'}`}>
                        Automatic Hiring
                      </p>
                      <p className={`text-xs ${dm ? 'text-blue-300' : 'text-blue-600'}`}>
                        Once approved, the talent will be automatically hired and notified
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-6 h-6 rounded-full bg-blue-600 text-white text-xs font-bold flex items-center justify-center flex-shrink-0 mt-0.5">
                      3
                    </div>
                    <div>
                      <p className={`text-sm font-medium ${dm ? 'text-blue-200' : 'text-blue-800'}`}>
                        Start Collaboration
                      </p>
                      <p className={`text-xs ${dm ? 'text-blue-300' : 'text-blue-600'}`}>
                        You'll be redirected to the "Hired" tab where you can message the talent
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 pt-2">
                <button
                  onClick={() => navigate('/employer/dashboard')}
                  className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl border font-medium transition-colors ${
                    dm 
                      ? 'border-gray-600 text-gray-300 hover:bg-gray-700' 
                      : 'border-slate-300 text-gray-700 hover:bg-slate-50'
                  }`}
                >
                  <Users className="w-4 h-4" />
                  View All Applications
                </button>
                
                {escrow?.status === 'funded' && (
                  <button
                    onClick={() => navigate('/employer/dashboard?tab=hired')}
                    className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-medium transition-colors"
                  >
                    <MessageCircle className="w-4 h-4" />
                    Go to Hired Tab
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Auto-refresh Notice */}
        <div className={`text-center text-xs ${muted}`}>
          <p>This page automatically refreshes every 30 seconds to check for approval status</p>
        </div>
      </div>
    </div>
  );
}