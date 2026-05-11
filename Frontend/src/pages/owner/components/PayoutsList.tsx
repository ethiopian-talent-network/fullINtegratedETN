import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { API_BASE_URL } from '@/config/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Search, Loader2, CheckCircle, XCircle, Clock, AlertCircle, Lock, Unlock } from 'lucide-react';

interface Escrow {
  id: number;
  talent_id: number;
  job_id: number;
  amount: number;
  currency: string;
  status: string;
  payment_method: string;
  payment_date: string;
  released_at: string;
  talent_name: string;
  talent_email: string;
  job_title: string;
  employer_name: string;
  company_name: string;
}

interface Payout extends Escrow {
  reference_number: string;
  escrow_fee: number;
  net_amount: number;
}

interface PayoutsListProps {
  onRefresh: () => void;
  refreshTrigger: number;
}

const PayoutsList: React.FC<PayoutsListProps> = ({ onRefresh, refreshTrigger }) => {
  const { token } = useAuth();
  const internalToken = localStorage.getItem('internal_token') || '';
  const effectiveToken = internalToken || token || '';

  const [payouts, setPayouts] = useState<Payout[]>([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState('released');
  const [search, setSearch] = useState('');
  const [totalPages, setTotalPages] = useState(1);
  const [error, setError] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<number | null>(null);

  useEffect(() => {
    fetchPayouts();
  }, [page, status, search, refreshTrigger]);

  const fetchPayouts = async () => {
    if (!effectiveToken) return;
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '10',
        ...(status !== 'all' && { status }),
        ...(search && { search }),
      });

      const response = await fetch(`${API_BASE_URL}/api/payment/owner/escrow?${params}`, {
        headers: { Authorization: `Bearer ${effectiveToken}` },
      });

      if (!response.ok) throw new Error('Failed to fetch payouts');
      const data = await response.json();

      const payoutsData = (data.escrows || []).map((escrow: Escrow) => ({
        ...escrow,
        reference_number: `ESC-${escrow.id.toString().padStart(6, '0')}`,
        escrow_fee: escrow.amount * 0.05,
        net_amount: escrow.amount * 0.95,
      }));

      setPayouts(payoutsData);
      setTotalPages(data.pagination?.pages || 1);
    } catch (error: any) {
      console.error('Error fetching payouts:', error);
      setPayouts([]);
      setError(error.message || 'Failed to fetch payouts');
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'released':
        return 'bg-green-50 text-green-700 border-green-200';
      case 'funded':
        return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'pending':
        return 'bg-amber-50 text-amber-700 border-amber-200';
      default:
        return 'bg-slate-50 text-slate-700 border-slate-200';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'released':
        return <CheckCircle className="w-4 h-4 text-green-600" />;
      case 'funded':
        return <Lock className="w-4 h-4 text-blue-600" />;
      case 'pending':
        return <Clock className="w-4 h-4 text-amber-600" />;
      default:
        return null;
    }
  };

  return (
    <div className="space-y-4">
      {/* Error Alert */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-center gap-3">
          <AlertCircle className="w-5 h-5 text-red-600" />
          <p className="text-red-700">{error}</p>
        </div>
      )}

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-sm p-4 space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-900 mb-2">Status</label>
            <select
              value={status}
              onChange={(e) => {
                setStatus(e.target.value);
                setPage(1);
              }}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="released">Released</option>
              <option value="funded">Funded</option>
              <option value="pending">Pending</option>
              <option value="all">All</option>
            </select>
          </div>

          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-slate-900 mb-2">Search</label>
            <div className="relative">
              <Search className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
              <Input
                placeholder="Search by talent name, email, or job..."
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(1);
                }}
                className="pl-10"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Payouts Table */}
      <div className="bg-white rounded-lg shadow-sm overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-6 h-6 animate-spin text-blue-500" />
          </div>
        ) : payouts && payouts.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-slate-500">No payouts found</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50 border-b">
                <tr>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-slate-900">Reference</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-slate-900">Talent</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-slate-900">Job</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-slate-900">Amount</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-slate-900">Fee (5%)</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-slate-900">Net Amount</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-slate-900">Status</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-slate-900">Released</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-slate-900">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {payouts && payouts.map((payout) => (
                  <React.Fragment key={payout.id}>
                    <tr className="hover:bg-slate-50 transition">
                      <td className="px-6 py-4 text-sm font-mono text-slate-600">{payout.reference_number}</td>
                      <td className="px-6 py-4 text-sm">
                        <div>
                          <p className="font-medium text-slate-900">{payout.talent_name}</p>
                          <p className="text-xs text-slate-600">{payout.talent_email}</p>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm">
                        <div>
                          <p className="font-medium text-slate-900">{payout.job_title}</p>
                          <p className="text-xs text-slate-600">{payout.company_name}</p>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm font-semibold text-slate-900">
                        {payout.amount.toLocaleString()} {payout.currency}
                      </td>
                      <td className="px-6 py-4 text-sm text-red-600 font-medium">
                        {payout.escrow_fee.toFixed(2)} {payout.currency}
                      </td>
                      <td className="px-6 py-4 text-sm font-semibold text-green-600">
                        {payout.net_amount.toFixed(2)} {payout.currency}
                      </td>
                      <td className="px-6 py-4 text-sm">
                        <div className={`flex items-center gap-2 px-3 py-1 rounded-full border ${getStatusColor(payout.status)} w-fit`}>
                          {getStatusIcon(payout.status)}
                          <span className="capitalize font-medium text-xs">{payout.status}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-slate-600">
                        {payout.released_at ? new Date(payout.released_at).toLocaleDateString() : '—'}
                      </td>
                      <td className="px-6 py-4 text-sm">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setExpandedId(expandedId === payout.id ? null : payout.id)}
                          className="text-xs"
                        >
                          {expandedId === payout.id ? 'Hide' : 'Show'} Details
                        </Button>
                      </td>
                    </tr>

                    {/* Expanded Details Row */}
                    {expandedId === payout.id && (
                      <tr className="bg-slate-50">
                        <td colSpan={9} className="px-6 py-4">
                          <div className="space-y-4">
                            {/* Payout Details */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <div className="bg-white p-4 rounded-lg border border-slate-200">
                                <p className="text-xs font-semibold text-slate-600 mb-2">PAYOUT BREAKDOWN</p>
                                <div className="space-y-2 text-sm">
                                  <div className="flex justify-between">
                                    <span className="text-slate-600">Gross Amount:</span>
                                    <span className="font-semibold">{payout.amount.toLocaleString()} {payout.currency}</span>
                                  </div>
                                  <div className="flex justify-between text-red-600">
                                    <span>Escrow Fee (5%):</span>
                                    <span className="font-semibold">-{payout.escrow_fee.toFixed(2)} {payout.currency}</span>
                                  </div>
                                  <div className="border-t pt-2 flex justify-between text-green-600">
                                    <span className="font-semibold">Net to Talent:</span>
                                    <span className="font-bold">{payout.net_amount.toFixed(2)} {payout.currency}</span>
                                  </div>
                                </div>
                              </div>

                              <div className="bg-white p-4 rounded-lg border border-slate-200">
                                <p className="text-xs font-semibold text-slate-600 mb-2">PAYMENT DETAILS</p>
                                <div className="space-y-2 text-sm">
                                  <div>
                                    <span className="text-slate-600">Method:</span>
                                    <p className="font-medium capitalize">{payout.payment_method || 'N/A'}</p>
                                  </div>
                                  <div>
                                    <span className="text-slate-600">Payment Date:</span>
                                    <p className="font-medium">{payout.payment_date ? new Date(payout.payment_date).toLocaleString() : 'Pending'}</p>
                                  </div>
                                  <div>
                                    <span className="text-slate-600">Released:</span>
                                    <p className="font-medium">{payout.released_at ? new Date(payout.released_at).toLocaleString() : 'Not yet'}</p>
                                  </div>
                                </div>
                              </div>
                            </div>

                            {/* Employer Info */}
                            <div className="bg-white p-4 rounded-lg border border-slate-200">
                              <p className="text-xs font-semibold text-slate-600 mb-2">EMPLOYER INFORMATION</p>
                              <div className="space-y-1 text-sm">
                                <p className="font-medium text-slate-900">{payout.employer_name}</p>
                                <p className="text-slate-600">{payout.company_name}</p>
                              </div>
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center gap-2">
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
  );
};

export default PayoutsList;
