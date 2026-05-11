import { useState, useEffect, useCallback } from "react";
import { useDarkMode } from "../../contexts/DarkModeContext";
import {
  getPendingPayouts,
  getPayoutDetails,
  approvePayout,
  releasePayout,
} from "../../api/agreements";
import {
  DollarSign,
  CheckCircle,
  AlertCircle,
  Loader2,
  Eye,
  ThumbsUp,
  Send,
  Clock,
  FileText,
} from "lucide-react";

interface Payout {
  id: number;
  agreement_id: number;
  amount: number;
  currency: string;
  status: string;
  talent_name: string;
  employer_name: string;
  job_title: string;
  created_at: string;
}

export default function PayoutsManagementPage() {
  const { darkMode } = useDarkMode();
  const dm = darkMode;

  const [payouts, setPayouts] = useState<Payout[]>([]);
  const [selectedPayout, setSelectedPayout] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState("pending");
  const [approvalNotes, setApprovalNotes] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("bank_transfer");
  const [page, setPage] = useState(1);

  const loadPayouts = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getPendingPayouts({
        status: statusFilter,
        page,
        limit: 15,
      });
      setPayouts(data.payouts || []);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [statusFilter, page]);

  useEffect(() => {
    loadPayouts();
  }, [loadPayouts]);

  const handleViewDetails = async (payoutId: number) => {
    try {
      const data = await getPayoutDetails(payoutId);
      setSelectedPayout(data.payout);
      setApprovalNotes("");
      setPaymentMethod("bank_transfer");
    } catch (e: any) {
      setError(e.message);
    }
  };

  const handleApprove = async () => {
    if (!selectedPayout) return;
    setActionLoading(true);
    try {
      await approvePayout(selectedPayout.id, approvalNotes);
      setSuccess("Payout approved successfully!");
      setSelectedPayout(null);
      loadPayouts();
    } catch (e: any) {
      setError(e.message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleRelease = async () => {
    if (!selectedPayout) return;
    setActionLoading(true);
    try {
      await releasePayout(selectedPayout.id, {
        payment_method: paymentMethod,
      });
      setSuccess("Payout released successfully!");
      setSelectedPayout(null);
      loadPayouts();
    } catch (e: any) {
      setError(e.message);
    } finally {
      setActionLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending":
        return "bg-yellow-50 text-yellow-700 border-yellow-200";
      case "approved":
        return "bg-blue-50 text-blue-700 border-blue-200";
      case "processing":
        return "bg-purple-50 text-purple-700 border-purple-200";
      case "completed":
        return "bg-emerald-50 text-emerald-700 border-emerald-200";
      case "failed":
        return "bg-red-50 text-red-700 border-red-200";
      default:
        return "bg-gray-50 text-gray-700 border-gray-200";
    }
  };

  const bg = dm ? "bg-gray-950" : "bg-slate-100";
  const card = dm ? "bg-gray-900 border-gray-800" : "bg-white border-slate-200";
  const text = dm ? "text-white" : "text-gray-900";
  const muted = dm ? "text-gray-400" : "text-gray-500";
  const inputCls = dm ? "bg-gray-800 border-gray-700 text-white placeholder-gray-500" : "bg-white border-slate-300 text-gray-900 placeholder-gray-400";

  return (
    <div className={`min-h-screen ${bg} transition-colors duration-300 py-8`}>
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className={`text-3xl font-bold ${text} flex items-center gap-3`}>
            <DollarSign className="w-8 h-8 text-emerald-500" />
            Payout Management
          </h1>
          <p className={`text-sm mt-1 ${muted}`}>
            Review and release payouts from escrow to talents
          </p>
        </div>

        {/* Alerts */}
        {error && (
          <div className="mb-5 flex items-center gap-3 p-4 rounded-xl bg-red-50 border border-red-200 text-red-700">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <p className="text-sm flex-1">{error}</p>
            <button onClick={() => setError(null)}>✕</button>
          </div>
        )}
        {success && (
          <div className="mb-5 flex items-center gap-3 p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700">
            <CheckCircle className="w-4 h-4 flex-shrink-0" />
            <p className="text-sm flex-1">{success}</p>
            <button onClick={() => setSuccess(null)}>✕</button>
          </div>
        )}

        {/* Filters */}
        <div className="mb-6 flex gap-3 flex-wrap">
          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setPage(1);
            }}
            className={`px-4 py-2 rounded-lg border text-sm outline-none ${inputCls}`}
          >
            <option value="pending">Pending Approval</option>
            <option value="approved">Approved</option>
            <option value="processing">Processing</option>
            <option value="completed">Completed</option>
            <option value="failed">Failed</option>
          </select>
        </div>

        {/* Payouts Table */}
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-emerald-500" />
          </div>
        ) : payouts.length === 0 ? (
          <div className={`rounded-xl border p-12 text-center ${card}`}>
            <DollarSign className="w-12 h-12 text-gray-400 mx-auto mb-3" />
            <p className={`font-medium ${text}`}>No payouts found</p>
            <p className={`text-sm mt-1 ${muted}`}>
              There are no {statusFilter} payouts at this time
            </p>
          </div>
        ) : (
          <div className={`rounded-xl border overflow-hidden ${card}`}>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr
                    className={`border-b ${
                      dm
                        ? "border-gray-800 bg-gray-900/60"
                        : "border-slate-200 bg-slate-50"
                    }`}
                  >
                    <th className={`px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider ${muted}`}>
                      Talent
                    </th>
                    <th className={`px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider ${muted}`}>
                      Job
                    </th>
                    <th className={`px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider ${muted}`}>
                      Amount
                    </th>
                    <th className={`px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider ${muted}`}>
                      Status
                    </th>
                    <th className={`px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider ${muted}`}>
                      Date
                    </th>
                    <th className={`px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider ${muted}`}>
                      Action
                    </th>
                  </tr>
                </thead>
                <tbody
                  className={`divide-y ${
                    dm ? "divide-gray-800" : "divide-slate-100"
                  }`}
                >
                  {payouts.map((payout) => (
                    <tr
                      key={payout.id}
                      className={`transition-colors ${
                        dm ? "hover:bg-gray-800/50" : "hover:bg-slate-50"
                      }`}
                    >
                      <td className={`px-4 py-3.5 text-sm ${text}`}>
                        <p className="font-medium">{payout.talent_name}</p>
                        <p className={`text-xs ${muted}`}>
                          {payout.employer_name}
                        </p>
                      </td>
                      <td className={`px-4 py-3.5 text-sm ${text}`}>
                        {payout.job_title}
                      </td>
                      <td className={`px-4 py-3.5 text-sm font-semibold text-emerald-600`}>
                        {payout.amount.toLocaleString()} {payout.currency}
                      </td>
                      <td className={`px-4 py-3.5 text-sm`}>
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border ${getStatusColor(
                            payout.status
                          )}`}
                        >
                          {payout.status}
                        </span>
                      </td>
                      <td className={`px-4 py-3.5 text-sm whitespace-nowrap ${muted}`}>
                        {new Date(payout.created_at).toLocaleDateString()}
                      </td>
                      <td className={`px-4 py-3.5 text-sm`}>
                        <button
                          onClick={() => handleViewDetails(payout.id)}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-500 hover:bg-blue-600 text-white text-xs font-semibold transition-colors"
                        >
                          <Eye className="w-3.5 h-3.5" /> View
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Details Modal */}
      {selectedPayout && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div
            className={`w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl border shadow-2xl ${card}`}
          >
            <div
              className={`sticky top-0 px-6 py-4 border-b flex items-center justify-between ${
                dm ? "bg-gray-900 border-gray-800" : "bg-white border-slate-200"
              }`}
            >
              <h2 className={`font-semibold text-lg ${text}`}>
                Payout Details
              </h2>
              <button
                onClick={() => setSelectedPayout(null)}
                className={`p-1.5 rounded-lg ${
                  dm
                    ? "hover:bg-gray-800 text-gray-400"
                    : "hover:bg-slate-100 text-gray-500"
                }`}
              >
                ✕
              </button>
            </div>

            <div className="p-6 space-y-6">
              {/* Amount and Status */}
              <div className={`p-6 rounded-xl text-center ${dm ? "bg-emerald-900/20 border border-emerald-800" : "bg-emerald-50 border border-emerald-200"}`}>
                <p className={`text-xs font-semibold uppercase tracking-wider mb-1 ${muted}`}>
                  Payout Amount
                </p>
                <p className="text-4xl font-bold text-emerald-600">
                  {selectedPayout.amount.toLocaleString()}{" "}
                  {selectedPayout.currency}
                </p>
                <span
                  className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold border mt-3 ${getStatusColor(
                    selectedPayout.status
                  )}`}
                >
                  {selectedPayout.status}
                </span>
              </div>

              {/* Details Grid */}
              <div className={`grid grid-cols-2 gap-4 p-4 rounded-xl ${dm ? "bg-gray-800" : "bg-slate-50"}`}>
                <div>
                  <p className={`text-xs font-semibold uppercase ${muted}`}>
                    Talent
                  </p>
                  <p className={`text-sm font-semibold ${text}`}>
                    {selectedPayout.talent_name}
                  </p>
                  <p className={`text-xs ${muted}`}>
                    {selectedPayout.talent_email}
                  </p>
                </div>
                <div>
                  <p className={`text-xs font-semibold uppercase ${muted}`}>
                    Employer
                  </p>
                  <p className={`text-sm font-semibold ${text}`}>
                    {selectedPayout.employer_name}
                  </p>
                  <p className={`text-xs ${muted}`}>
                    {selectedPayout.employer_email}
                  </p>
                </div>
                <div>
                  <p className={`text-xs font-semibold uppercase ${muted}`}>
                    Job
                  </p>
                  <p className={`text-sm font-semibold ${text}`}>
                    {selectedPayout.job_title}
                  </p>
                </div>
                <div>
                  <p className={`text-xs font-semibold uppercase ${muted}`}>
                    Agreement
                  </p>
                  <p className={`text-sm font-semibold ${text}`}>
                    {selectedPayout.agreement_title}
                  </p>
                </div>
              </div>

              {/* Agreement Details */}
              <div>
                <p className={`text-xs font-semibold uppercase mb-2 ${muted}`}>
                  Agreement Details
                </p>
                <div className={`p-4 rounded-lg border ${dm ? "border-gray-700 bg-gray-800/50" : "border-slate-200 bg-slate-50"}`}>
                  <p className={`text-sm ${text}`}>
                    {selectedPayout.job_description}
                  </p>
                  <div className="mt-3 grid grid-cols-2 gap-3 text-xs">
                    <div>
                      <p className={`font-semibold ${muted}`}>Start Date</p>
                      <p className={text}>
                        {new Date(selectedPayout.start_date).toLocaleDateString()}
                      </p>
                    </div>
                    <div>
                      <p className={`font-semibold ${muted}`}>End Date</p>
                      <p className={text}>
                        {new Date(selectedPayout.end_date).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Approval Section */}
              {selectedPayout.status === "pending" && (
                <div className="space-y-4 p-4 rounded-xl border border-yellow-200 bg-yellow-50">
                  <p className={`text-sm font-semibold text-yellow-800`}>
                    Approve this payout
                  </p>
                  <textarea
                    value={approvalNotes}
                    onChange={(e) => setApprovalNotes(e.target.value)}
                    placeholder="Add approval notes (optional)"
                    className={`w-full px-4 py-2.5 rounded-lg border text-sm outline-none ${inputCls}`}
                    rows={3}
                  />
                  <button
                    onClick={handleApprove}
                    disabled={actionLoading}
                    className="w-full flex items-center justify-center gap-2 py-2.5 rounded-lg bg-emerald-500 hover:bg-emerald-600 text-white text-sm font-semibold transition-colors disabled:opacity-50"
                  >
                    {actionLoading ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <ThumbsUp className="w-4 h-4" />
                    )}
                    Approve Payout
                  </button>
                </div>
              )}

              {/* Release Section */}
              {selectedPayout.status === "approved" && (
                <div className="space-y-4 p-4 rounded-xl border border-blue-200 bg-blue-50">
                  <p className={`text-sm font-semibold text-blue-800`}>
                    Release payout to talent
                  </p>
                  <select
                    value={paymentMethod}
                    onChange={(e) => setPaymentMethod(e.target.value)}
                    className={`w-full px-4 py-2.5 rounded-lg border text-sm outline-none ${inputCls}`}
                  >
                    <option value="bank_transfer">Bank Transfer</option>
                    <option value="mobile_money">Mobile Money</option>
                    <option value="wallet">Platform Wallet</option>
                  </select>
                  <button
                    onClick={handleRelease}
                    disabled={actionLoading}
                    className="w-full flex items-center justify-center gap-2 py-2.5 rounded-lg bg-blue-500 hover:bg-blue-600 text-white text-sm font-semibold transition-colors disabled:opacity-50"
                  >
                    {actionLoading ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Send className="w-4 h-4" />
                    )}
                    Release Payout
                  </button>
                </div>
              )}

              {/* Close Button */}
              <button
                onClick={() => setSelectedPayout(null)}
                className={`w-full py-2.5 rounded-lg border text-sm font-semibold transition-colors ${
                  dm
                    ? "border-gray-700 text-gray-300 hover:bg-gray-800"
                    : "border-slate-300 text-gray-600 hover:bg-slate-50"
                }`}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
