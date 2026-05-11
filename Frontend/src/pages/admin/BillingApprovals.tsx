import React, { useState, useEffect } from 'react';
import { API_BASE_URL } from '../../config/api';
import { CheckCircle, XCircle, Loader2, AlertCircle, RefreshCw } from 'lucide-react';

interface BillingApproval {
  id: number;
  user_id: number;
  user_name: string;
  user_email: string;
  phone: string;
  payout_method: string;
  account_number: string;
  bank_name: string;
  approval_status: string;
  created_at: string;
}

interface BillingApprovalsProps {
  token: string;
  darkMode: boolean;
}

export default function BillingApprovals({ token, darkMode }: BillingApprovalsProps) {
  const dm = darkMode;
  const [billings, setBillings] = useState<BillingApproval[]>([]);
  const [loading, setLoading] = useState(false);
  const [actionId, setActionId] = useState<number | null>(null);
  const [notes, setNotes] = useState<Record<number, string>>({});
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    loadBillings();
  }, []);

  const loadBillings = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/billing/admin/pending`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      setBillings(data.billings || []);
    } catch (e: any) {
      setError(e.message || 'Failed to load billing approvals');
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (billingId: number) => {
    setActionId(billingId);
    try {
      const res = await fetch(`${API_BASE_URL}/api/billing/admin/${billingId}/approve`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ admin_note: notes[billingId] || '' }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      setSuccess('Billing information approved successfully');
      setBillings(prev => prev.filter(b => b.id !== billingId));
      setNotes(prev => {
        const newNotes = { ...prev };
        delete newNotes[billingId];
        return newNotes;
      });
    } catch (e: any) {
      setError(e.message || 'Failed to approve billing');
    } finally {
      setActionId(null);
    }
  };

  const handleReject = async (billingId: number) => {
    if (!notes[billingId]?.trim()) {
      setError('Please provide a rejection reason');
      return;
    }
    setActionId(billingId);
    try {
      const res = await fetch(`${API_BASE_URL}/api/billing/admin/${billingId}/reject`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ admin_note: notes[billingId] }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      setSuccess('Billing information rejected');
      setBillings(prev => prev.filter(b => b.id !== billingId));
      setNotes(prev => {
        const newNotes = { ...prev };
        delete newNotes[billingId];
        return newNotes;
      });
    } catch (e: any) {
      setError(e.message || 'Failed to reject billing');
    } finally {
      setActionId(null);
    }
  };

  const bg = dm ? 'bg-gray-900' : 'bg-white';
  const card = dm ? 'bg-gray-800 border-gray-700' : 'bg-slate-50 border-slate-200';
  const text = dm ? 'text-white' : 'text-gray-900';
  const muted = dm ? 'text-gray-400' : 'text-gray-500';
  const inputCls = dm ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-500' : 'bg-white border-slate-300 text-gray-900 placeholder-gray-400';

  return (
    <div className="space-y-4">
      {error && (
        <div className="flex items-center gap-3 p-4 rounded-xl bg-red-50 border border-red-200 text-red-700">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <p className="text-sm flex-1">{error}</p>
          <button onClick={() => setError(null)}><XCircle className="w-4 h-4" /></button>
        </div>
      )}
      {success && (
        <div className="flex items-center gap-3 p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700">
          <CheckCircle className="w-4 h-4 flex-shrink-0" />
          <p className="text-sm flex-1">{success}</p>
          <button onClick={() => setSuccess(null)}><XCircle className="w-4 h-4" /></button>
        </div>
      )}

      <div className="flex items-center justify-between mb-5">
        <h2 className={`text-lg font-bold ${text}`}>Pending Billing Approvals</h2>
        <button
          onClick={loadBillings}
          className={`flex items-center gap-1.5 text-sm px-3 py-1.5 rounded-lg transition-colors ${dm ? 'hover:bg-gray-700 text-gray-400' : 'hover:bg-slate-200 text-gray-500'}`}
        >
          <RefreshCw className="w-4 h-4" /> Refresh
        </button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-6 h-6 animate-spin text-blue-500" />
        </div>
      ) : billings.length === 0 ? (
        <div className={`rounded-xl border p-12 text-center ${card}`}>
          <CheckCircle className="w-10 h-10 text-emerald-400 mx-auto mb-3" />
          <p className={`font-medium ${text}`}>No pending approvals</p>
          <p className={`text-sm mt-1 ${muted}`}>All billing information has been reviewed.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {billings.map((billing) => (
            <div key={billing.id} className={`rounded-xl border p-5 ${card}`}>
              <div className="flex items-start justify-between gap-4 mb-4">
                <div>
                  <p className={`font-semibold ${text}`}>{billing.user_name}</p>
                  <p className={`text-sm ${muted}`}>{billing.user_email}</p>
                </div>
                <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${dm ? 'bg-amber-900/30 text-amber-300' : 'bg-amber-100 text-amber-700'}`}>
                  {new Date(billing.created_at).toLocaleDateString()}
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
                <div>
                  <p className={`text-xs font-semibold uppercase tracking-wider mb-1 ${muted}`}>Phone</p>
                  <p className={`text-sm ${text}`}>{billing.phone}</p>
                </div>
                <div>
                  <p className={`text-xs font-semibold uppercase tracking-wider mb-1 ${muted}`}>Payout Method</p>
                  <p className={`text-sm capitalize ${text}`}>{billing.payout_method}</p>
                </div>
                {billing.bank_name && (
                  <div>
                    <p className={`text-xs font-semibold uppercase tracking-wider mb-1 ${muted}`}>Bank</p>
                    <p className={`text-sm ${text}`}>{billing.bank_name}</p>
                  </div>
                )}
                {billing.account_number && (
                  <div>
                    <p className={`text-xs font-semibold uppercase tracking-wider mb-1 ${muted}`}>Account</p>
                    <p className={`text-sm font-mono ${text}`}>{billing.account_number}</p>
                  </div>
                )}
              </div>

              <div className="mb-4">
                <label className={`block text-xs font-semibold uppercase tracking-wider mb-2 ${muted}`}>
                  Admin Note
                </label>
                <textarea
                  value={notes[billing.id] || ''}
                  onChange={(e) => setNotes(prev => ({ ...prev, [billing.id]: e.target.value }))}
                  placeholder="Add a note (required for rejection)"
                  className={`w-full px-3 py-2 rounded-lg border text-sm outline-none focus:ring-2 focus:ring-blue-500/20 ${inputCls}`}
                  rows={2}
                />
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => handleReject(billing.id)}
                  disabled={actionId === billing.id}
                  className="flex-1 flex items-center justify-center gap-2 py-2 rounded-lg bg-red-500 hover:bg-red-600 text-white text-sm font-semibold transition-colors disabled:opacity-50"
                >
                  {actionId === billing.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <XCircle className="w-4 h-4" />}
                  Reject
                </button>
                <button
                  onClick={() => handleApprove(billing.id)}
                  disabled={actionId === billing.id}
                  className="flex-1 flex items-center justify-center gap-2 py-2 rounded-lg bg-emerald-500 hover:bg-emerald-600 text-white text-sm font-semibold transition-colors disabled:opacity-50"
                >
                  {actionId === billing.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
                  Approve
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
