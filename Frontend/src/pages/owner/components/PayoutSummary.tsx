import React, { useState, useEffect } from 'react';
import { getPayoutSummary } from '@/api/owner/payoutsApi';
import { Loader2, TrendingUp, DollarSign, CheckCircle, Clock, XCircle, AlertCircle, Lock } from 'lucide-react';

interface Summary {
  total_payouts: number;
  completed_count: number;
  pending_count: number;
  failed_count: number;
  held_in_escrow_count: number;
  awaiting_approval_count: number;
  total_gross_amount: number;
  total_escrow_fees: number;
  total_net_payouts: number;
  completed_payouts_amount: number;
  pending_payouts_amount: number;
  held_in_escrow_amount: number;
  awaiting_approval_amount: number;
}

interface PayoutSummaryProps {
  refreshTrigger: number;
}

const PayoutSummary: React.FC<PayoutSummaryProps> = ({ refreshTrigger }) => {
  const [summary, setSummary] = useState<Summary | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchSummary();
  }, [refreshTrigger]);

  const fetchSummary = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await getPayoutSummary();
      if (response && response.summary) {
        setSummary(response.summary);
      } else {
        setError('Invalid response format from server');
      }
    } catch (error: any) {
      console.error('Error fetching summary:', error);
      setError(error.message || 'Failed to fetch summary');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-6 h-6 animate-spin text-blue-500" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-center gap-3">
        <AlertCircle className="w-5 h-5 text-red-600" />
        <p className="text-red-700">{error}</p>
      </div>
    );
  }

  if (!summary) {
    return (
      <div className="text-center py-12">
        <p className="text-slate-500">No data available</p>
      </div>
    );
  }

  const StatCard = (
    {
      icon: Icon,
      title,
      value,
      subtitle,
      color,
    }: {
      icon: React.ReactNode;
      title: string;
      value: string | number;
      subtitle?: string;
      color: string;
    }
  ) => (
    <div className={`bg-white rounded-lg shadow-sm p-6 border-l-4 ${color}`}>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-slate-600 mb-1">{title}</p>
          <p className="text-3xl font-bold text-slate-900">{value}</p>
          {subtitle && <p className="text-xs text-slate-500 mt-1">{subtitle}</p>}
        </div>
        <div className={`p-3 rounded-lg ${color.replace('border-', 'bg-').replace('-600', '-50')}`}>
          {Icon}
        </div>
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Main Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          icon={<DollarSign className="w-6 h-6 text-blue-600" />}
          title="Total Payouts"
          value={summary.total_payouts || 0}
          color="border-blue-600"
        />
        <StatCard
          icon={<CheckCircle className="w-6 h-6 text-green-600" />}
          title="Completed"
          value={summary.completed_count || 0}
          subtitle={`ETB ${(summary.completed_payouts_amount || 0).toFixed(2)}`}
          color="border-green-600"
        />
        <StatCard
          icon={<Clock className="w-6 h-6 text-amber-600" />}
          title="Awaiting Approval"
          value={summary.awaiting_approval_count || 0}
          subtitle={`ETB ${(summary.awaiting_approval_amount || 0).toFixed(2)}`}
          color="border-amber-600"
        />
        <StatCard
          icon={<XCircle className="w-6 h-6 text-red-600" />}
          title="Failed"
          value={summary.failed_count || 0}
          color="border-red-600"
        />
      </div>

      {/* Financial Summary */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Amounts */}
        <div className="bg-white rounded-lg shadow-sm p-6 space-y-4">
          <h3 className="text-lg font-semibold text-slate-900 flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-blue-600" />
            Financial Summary
          </h3>

          <div className="space-y-3">
            <div className="flex justify-between items-center pb-3 border-b">
              <span className="text-slate-600">Total Gross Amount</span>
              <span className="font-semibold text-slate-900">
                ETB {(summary.total_gross_amount || 0).toFixed(2)}
              </span>
            </div>

            <div className="flex justify-between items-center pb-3 border-b bg-amber-50 p-3 rounded">
              <span className="text-amber-900 font-medium">Total Escrow Fees (5%)</span>
              <span className="font-bold text-amber-700">
                ETB {(summary.total_escrow_fees || 0).toFixed(2)}
              </span>
            </div>

            <div className="flex justify-between items-center pt-3 bg-green-50 p-3 rounded">
              <span className="text-green-900 font-medium">Total Net Payouts</span>
              <span className="font-bold text-green-700 text-lg">
                ETB {(summary.total_net_payouts || 0).toFixed(2)}
              </span>
            </div>
          </div>
        </div>

        {/* Breakdown */}
        <div className="bg-white rounded-lg shadow-sm p-6 space-y-4">
          <h3 className="text-lg font-semibold text-slate-900">Payout Breakdown</h3>

          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
              <div className="flex items-center gap-3">
                <CheckCircle className="w-5 h-5 text-green-600" />
                <span className="text-slate-900 font-medium">Completed Payouts</span>
              </div>
              <div className="text-right">
                <p className="font-bold text-green-600">ETB {(summary.completed_payouts_amount || 0).toFixed(2)}</p>
                <p className="text-xs text-slate-600">{summary.completed_count || 0} payouts</p>
              </div>
            </div>

            <div className="flex items-center justify-between p-3 bg-amber-50 rounded-lg">
              <div className="flex items-center gap-3">
                <Clock className="w-5 h-5 text-amber-600" />
                <span className="text-slate-900 font-medium">Pending Payouts</span>
              </div>
              <div className="text-right">
                <p className="font-bold text-amber-600">ETB {(summary.pending_payouts_amount || 0).toFixed(2)}</p>
                <p className="text-xs text-slate-600">{summary.pending_count || 0} payouts</p>
              </div>
            </div>

            <div className="flex items-center justify-between p-3 bg-red-50 rounded-lg">
              <div className="flex items-center gap-3">
                <XCircle className="w-5 h-5 text-red-600" />
                <span className="text-slate-900 font-medium">Failed Payouts</span>
              </div>
              <div className="text-right">
                <p className="font-bold text-red-600">{summary.failed_count || 0}</p>
                <p className="text-xs text-slate-600">Requires attention</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Escrow Workflow Status */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-blue-900 mb-4">Escrow Workflow Status</h3>
          <div className="space-y-3">
            <div className="flex justify-between items-center p-3 bg-white rounded-lg">
              <span className="text-slate-700 font-medium">Held in Escrow</span>
              <div className="text-right">
                <p className="font-bold text-blue-600">{summary.held_in_escrow_count || 0}</p>
                <p className="text-xs text-slate-600">ETB {(summary.held_in_escrow_amount || 0).toFixed(2)}</p>
              </div>
            </div>
            <div className="flex justify-between items-center p-3 bg-white rounded-lg">
              <span className="text-slate-700 font-medium">Awaiting Employer Approval</span>
              <div className="text-right">
                <p className="font-bold text-amber-600">{summary.awaiting_approval_count || 0}</p>
                <p className="text-xs text-slate-600">ETB {(summary.awaiting_approval_amount || 0).toFixed(2)}</p>
              </div>
            </div>
          </div>
          <p className="text-sm text-blue-700 mt-4">
            Money is held in escrow until the employer approves the work, then released to the talent.
          </p>
        </div>

        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-blue-900 mb-4">Escrow Fee Information</h3>
          <div className="space-y-3">
            <div className="flex justify-between items-center p-3 bg-white rounded-lg">
              <span className="text-slate-700 font-medium">Fee Rate</span>
              <p className="text-2xl font-bold text-blue-900">5%</p>
            </div>
            <div className="flex justify-between items-center p-3 bg-white rounded-lg">
              <span className="text-slate-700 font-medium">Total Fees Collected</span>
              <p className="font-bold text-amber-600">ETB {(summary.total_escrow_fees || 0).toFixed(2)}</p>
            </div>
            <div className="flex justify-between items-center p-3 bg-white rounded-lg">
              <span className="text-slate-700 font-medium">Avg Fee per Payout</span>
              <p className="font-bold text-slate-900">
                ETB {(summary.total_payouts > 0 ? (summary.total_escrow_fees || 0) / summary.total_payouts : 0).toFixed(2)}
              </p>
            </div>
          </div>
          <p className="text-sm text-blue-700 mt-4">
            The 5% escrow fee ensures platform security and compliance.
          </p>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <h3 className="text-lg font-semibold text-slate-900 mb-4">Quick Statistics</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center p-4 bg-slate-50 rounded-lg">
            <p className="text-2xl font-bold text-slate-900">
              {summary.total_payouts > 0
                ? ((summary.completed_count / summary.total_payouts) * 100).toFixed(1)
                : 0}
              %
            </p>
            <p className="text-xs text-slate-600 mt-1">Completion Rate</p>
          </div>

          <div className="text-center p-4 bg-slate-50 rounded-lg">
            <p className="text-2xl font-bold text-slate-900">
              {summary.total_payouts > 0
                ? ((summary.total_gross_amount || 0) / summary.total_payouts).toFixed(0)
                : 0}
            </p>
            <p className="text-xs text-slate-600 mt-1">Avg Payout (ETB)</p>
          </div>

          <div className="text-center p-4 bg-slate-50 rounded-lg">
            <p className="text-2xl font-bold text-slate-900">
              {(summary.total_gross_amount || 0) > 0
                ? (((summary.total_escrow_fees || 0) / (summary.total_gross_amount || 0)) * 100).toFixed(2)
                : 0}
              %
            </p>
            <p className="text-xs text-slate-600 mt-1">Fee Percentage</p>
          </div>

          <div className="text-center p-4 bg-slate-50 rounded-lg">
            <p className="text-2xl font-bold text-slate-900">
              {summary.awaiting_approval_count || 0}
            </p>
            <p className="text-xs text-slate-600 mt-1">Awaiting Approval</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PayoutSummary;
