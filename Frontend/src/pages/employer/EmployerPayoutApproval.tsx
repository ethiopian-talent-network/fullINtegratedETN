import React, { useState, useEffect } from 'react';
import { employerApprovePayout, getAllPayouts } from '@/api/owner/payoutsApi';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Search, Loader2, CheckCircle, Clock, AlertCircle, Lock } from 'lucide-react';

interface Payout {
  id: number;
  talent_id: number;
  job_id: number;
  gross_amount: number;
  escrow_fee: number;
  net_amount: number;
  currency: string;
  status: string;
  escrow_status: string;
  employer_approval_status: string;
  reference_number: string;
  created_at: string;
  talent_name: string;
  talent_email: string;
  job_title: string;
}

const EmployerPayoutApproval: React.FC = () => {
  const [payouts, setPayouts] = useState<Payout[]>([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [totalPages, setTotalPages] = useState(1);
  const [approvingId, setApprovingId] = useState<number | null>(null);
  const [approvalNotes, setApprovalNotes] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<number | null>(null);

  useEffect(() => {
    fetchPendingPayouts();
  }, [page, search]);

  const fetchPendingPayouts = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await getAllPayouts({
        status: 'pending',
        page,
        limit: 10,
        search: search || undefined,
      });
      
      if (response && response.payouts && Array.isArray(response.payouts)) {
        // Filter for payouts awaiting employer approval
        const pendingApproval = response.payouts.filter(
          (p: Payout) => p.employer_approval_status === 'pending' && p.escrow_status === 'held'
        );
        setPayouts(pendingApproval);
        setTotalPages(response.pagination?.pages || 1);
      } else {
        setPayouts([]);
        setError('Invalid response format from server');
      }
    } catch (error: any) {
      console.error('Error fetching payouts:', error);
      setPayouts([]);
      setError(error.message || 'Failed to fetch payouts');
    } finally {
      setLoading(false);
    }
  };

  const handleApprovePayout = async (payoutId: number) => {
    setApprovingId(payoutId);
    try {
      await employerApprovePayout(payoutId, { approval_notes: approvalNotes });
      alert('Payout approved successfully! The owner will now release the payment.');
      setApprovalNotes('');
      fetchPendingPayouts();
    } catch (error: any) {
      alert(error.response?.data?.message || 'Failed to approve payout');
    } finally {
      setApprovingId(null);
    }
  };

  return (
    <div className="w-full h-full bg-gradient-to-br from-slate-50 to-slate-100 p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-slate-900 mb-2">Payout Approvals</h1>
          <p className="text-slate-600">Review and approve talent payouts for your jobs</p>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-center gap-3 mb-6">
            <AlertCircle className="w-5 h-5 text-red-600" />
            <p className="text-red-700">{error}</p>
          </div>
        )}

        {/* Search */}
        <div className="bg-white rounded-lg shadow-sm p-4 mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
            <Input
              placeholder="Search by talent name, job title, or reference..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              className="pl-10"
            />
          </div>
        </div>

        {/* Payouts List */}
        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-6 h-6 animate-spin text-blue-500" />
            </div>
          ) : payouts && payouts.length === 0 ? (
            <div className="text-center py-12">
              <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-4" />
              <p className="text-slate-600 font-medium">No pending approvals</p>
              <p className="text-slate-500 text-sm">All payouts have been approved or there are no pending payouts.</p>
            </div>
          ) : (
            <div className="divide-y">
              {payouts && payouts.map((payout) => (
                <div key={payout.id} className="p-6 hover:bg-slate-50 transition">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <Lock className="w-5 h-5 text-blue-600" />
                        <h3 className="text-lg font-semibold text-slate-900">{payout.job_title}</h3>
                        <span className="text-sm font-mono text-slate-500 bg-slate-100 px-2 py-1 rounded">
                          {payout.reference_number}
                        </span>
                      </div>
                      <p className="text-sm text-slate-600">
                        Talent: <span className="font-medium">{payout.talent_name}</span> ({payout.talent_email})
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-bold text-green-600">
                        ETB {(payout.net_amount || 0).toFixed(2)}
                      </p>
                      <p className="text-xs text-slate-500">
                        Gross: ETB {(payout.gross_amount || 0).toFixed(2)} | Fee: ETB {(payout.escrow_fee || 0).toFixed(2)}
                      </p>
                    </div>
                  </div>

                  {/* Status Badges */}
                  <div className="flex gap-2 mb-4">
                    <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 border border-blue-200">
                      <Lock className="w-3 h-3 text-blue-600" />
                      <span className="text-xs font-medium text-blue-700">In Escrow</span>
                    </div>
                    <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-yellow-50 border border-yellow-200">
                      <Clock className="w-3 h-3 text-yellow-600" />
                      <span className="text-xs font-medium text-yellow-700">Awaiting Your Approval</span>
                    </div>
                  </div>

                  {/* Timeline */}
                  <div className="bg-slate-50 rounded-lg p-3 mb-4 text-sm">
                    <p className="text-slate-600">
                      Created: <span className="font-medium">{new Date(payout.created_at).toLocaleString()}</span>
                    </p>
                  </div>

                  {/* Expand Button */}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setExpandedId(expandedId === payout.id ? null : payout.id)}
                    className="w-full"
                  >
                    {expandedId === payout.id ? 'Hide Details' : 'Show Details & Approve'}
                  </Button>

                  {/* Expanded Approval Section */}
                  {expandedId === payout.id && (
                    <div className="mt-4 pt-4 border-t space-y-4">
                      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                        <p className="text-sm font-semibold text-blue-900 mb-2">Work Details</p>
                        <p className="text-sm text-blue-800">
                          Please review the work completed by {payout.talent_name} for "{payout.job_title}". 
                          If the work meets your requirements, approve the payout to release the payment from escrow.
                        </p>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-slate-900 mb-2">
                          Approval Notes (Optional)
                        </label>
                        <textarea
                          placeholder="Add any notes about the work quality or approval..."
                          value={approvalNotes}
                          onChange={(e) => setApprovalNotes(e.target.value)}
                          className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 text-sm"
                          rows={3}
                        />
                      </div>

                      <div className="flex gap-3">
                        <Button
                          onClick={() => handleApprovePayout(payout.id)}
                          disabled={approvingId === payout.id}
                          className="flex-1 bg-green-600 hover:bg-green-700 text-white"
                        >
                          {approvingId === payout.id ? (
                            <>
                              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                              Approving...
                            </>
                          ) : (
                            <>
                              <CheckCircle className="w-4 h-4 mr-2" />
                              Approve & Release Payment
                            </>
                          )}
                        </Button>
                        <Button
                          variant="outline"
                          onClick={() => setExpandedId(null)}
                          className="flex-1"
                        >
                          Cancel
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex justify-center gap-2 mt-6">
            <Button
              variant="outline"
              onClick={() => setPage(Math.max(1, page - 1))}
              disabled={page === 1}
            >
              Previous
            </Button>
            <div className="flex items-center gap-2">
              <span className="text-sm text-slate-600">
                Page {page} of {totalPages}
              </span>
            </div>
            <Button
              variant="outline"
              onClick={() => setPage(Math.min(totalPages, page + 1))}
              disabled={page === totalPages}
            >
              Next
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};

export default EmployerPayoutApproval;
