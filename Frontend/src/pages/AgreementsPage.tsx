import { useState, useEffect, useCallback } from "react";
import { useDarkMode } from "../contexts/DarkModeContext";
import { useAuth } from "../contexts/AuthContext";
import {
  getAgreements,
  getAgreementDetails,
  acceptAgreement,
  completeAgreement,
  confirmCompletion,
} from "../api/agreements";
import {
  FileText,
  CheckCircle,
  Clock,
  AlertCircle,
  Loader2,
  ChevronRight,
  Calendar,
  DollarSign,
  User,
  Eye,
  ThumbsUp,
  CheckCheck,
} from "lucide-react";

interface Agreement {
  id: number;
  title: string;
  description: string;
  budget: number;
  currency: string;
  status: string;
  employer_name: string;
  talent_name: string;
  start_date: string;
  end_date: string;
  created_at: string;
  employer_accepted_at: string;
  talent_accepted_at: string;
  completed_at: string;
}

export default function AgreementsPage() {
  const { darkMode } = useDarkMode();
  const { user } = useAuth();
  const dm = darkMode;

  const [agreements, setAgreements] = useState<Agreement[]>([]);
  const [selectedAgreement, setSelectedAgreement] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState("all");
  const [page, setPage] = useState(1);

  const loadAgreements = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getAgreements({
        role: user?.role,
        status: statusFilter !== "all" ? statusFilter : undefined,
        page,
        limit: 10,
      });
      setAgreements(data.agreements || []);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [user?.role, statusFilter, page]);

  useEffect(() => {
    loadAgreements();
  }, [loadAgreements]);

  const handleViewDetails = async (agreementId: number) => {
    try {
      const data = await getAgreementDetails(agreementId);
      setSelectedAgreement(data.agreement);
    } catch (e: any) {
      setError(e.message);
    }
  };

  const handleAccept = async () => {
    if (!selectedAgreement) return;
    setActionLoading(true);
    try {
      await acceptAgreement(selectedAgreement.id);
      setSuccess("Agreement accepted successfully!");
      setSelectedAgreement(null);
      loadAgreements();
    } catch (e: any) {
      setError(e.message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleComplete = async () => {
    if (!selectedAgreement) return;
    setActionLoading(true);
    try {
      await completeAgreement(selectedAgreement.id);
      setSuccess("Work marked as completed!");
      setSelectedAgreement(null);
      loadAgreements();
    } catch (e: any) {
      setError(e.message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleConfirmCompletion = async () => {
    if (!selectedAgreement) return;
    setActionLoading(true);
    try {
      await confirmCompletion(selectedAgreement.id);
      setSuccess("Completion confirmed. Payout pending approval.");
      setSelectedAgreement(null);
      loadAgreements();
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
      case "employer_accepted":
      case "talent_accepted":
        return "bg-blue-50 text-blue-700 border-blue-200";
      case "active":
        return "bg-green-50 text-green-700 border-green-200";
      case "completed":
        return "bg-purple-50 text-purple-700 border-purple-200";
      case "paid":
        return "bg-emerald-50 text-emerald-700 border-emerald-200";
      default:
        return "bg-gray-50 text-gray-700 border-gray-200";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "pending":
        return <Clock className="w-4 h-4" />;
      case "active":
        return <CheckCircle className="w-4 h-4" />;
      case "completed":
        return <CheckCheck className="w-4 h-4" />;
      case "paid":
        return <DollarSign className="w-4 h-4" />;
      default:
        return <FileText className="w-4 h-4" />;
    }
  };

  const bg = dm ? "bg-gray-950" : "bg-slate-100";
  const card = dm ? "bg-gray-900 border-gray-800" : "bg-white border-slate-200";
  const text = dm ? "text-white" : "text-gray-900";
  const muted = dm ? "text-gray-400" : "text-gray-500";
  const inputCls = dm ? "bg-gray-800 border-gray-700 text-white" : "bg-white border-slate-300 text-gray-900";

  return (
    <div className={`min-h-screen ${bg} transition-colors duration-300 py-8`}>
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className={`text-3xl font-bold ${text} flex items-center gap-3`}>
            <FileText className="w-8 h-8 text-blue-500" />
            Agreements
          </h1>
          <p className={`text-sm mt-1 ${muted}`}>
            Manage your project agreements and track their status
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
            <option value="all">All Status</option>
            <option value="pending">Pending</option>
            <option value="employer_accepted">Employer Accepted</option>
            <option value="talent_accepted">Talent Accepted</option>
            <option value="active">Active</option>
            <option value="completed">Completed</option>
            <option value="paid">Paid</option>
          </select>
        </div>

        {/* Agreements List */}
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
          </div>
        ) : agreements.length === 0 ? (
          <div className={`rounded-xl border p-12 text-center ${card}`}>
            <FileText className="w-12 h-12 text-gray-400 mx-auto mb-3" />
            <p className={`font-medium ${text}`}>No agreements found</p>
            <p className={`text-sm mt-1 ${muted}`}>
              {statusFilter !== "all"
                ? "No agreements match the selected filter"
                : "You don't have any agreements yet"}
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {agreements.map((agreement) => (
              <div
                key={agreement.id}
                className={`rounded-xl border p-5 ${card} hover:shadow-lg transition-shadow`}
              >
                <div className="flex items-start justify-between gap-4 flex-wrap">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className={`text-lg font-semibold ${text}`}>
                        {agreement.title}
                      </h3>
                      <span
                        className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border ${getStatusColor(
                          agreement.status
                        )}`}
                      >
                        {getStatusIcon(agreement.status)}
                        {agreement.status.replace(/_/g, " ")}
                      </span>
                    </div>

                    <p className={`text-sm ${muted} mb-3`}>
                      {agreement.description}
                    </p>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-3">
                      <div>
                        <p className={`text-xs font-semibold uppercase ${muted}`}>
                          Budget
                        </p>
                        <p className={`text-sm font-semibold ${text}`}>
                          {agreement.budget.toLocaleString()} {agreement.currency}
                        </p>
                      </div>
                      <div>
                        <p className={`text-xs font-semibold uppercase ${muted}`}>
                          {user?.role === "employer" ? "Talent" : "Employer"}
                        </p>
                        <p className={`text-sm font-semibold ${text}`}>
                          {user?.role === "employer"
                            ? agreement.talent_name
                            : agreement.employer_name}
                        </p>
                      </div>
                      {agreement.start_date && (
                        <div>
                          <p className={`text-xs font-semibold uppercase ${muted}`}>
                            Start Date
                          </p>
                          <p className={`text-sm font-semibold ${text}`}>
                            {new Date(agreement.start_date).toLocaleDateString()}
                          </p>
                        </div>
                      )}
                      {agreement.end_date && (
                        <div>
                          <p className={`text-xs font-semibold uppercase ${muted}`}>
                            End Date
                          </p>
                          <p className={`text-sm font-semibold ${text}`}>
                            {new Date(agreement.end_date).toLocaleDateString()}
                          </p>
                        </div>
                      )}
                    </div>

                    <div className="flex items-center gap-2 text-xs">
                      {agreement.employer_accepted_at && (
                        <span className="flex items-center gap-1 text-emerald-600">
                          <CheckCircle className="w-3 h-3" /> Employer accepted
                        </span>
                      )}
                      {agreement.talent_accepted_at && (
                        <span className="flex items-center gap-1 text-emerald-600">
                          <CheckCircle className="w-3 h-3" /> Talent accepted
                        </span>
                      )}
                    </div>
                  </div>

                  <button
                    onClick={() => handleViewDetails(agreement.id)}
                    className="flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-500 hover:bg-blue-600 text-white text-sm font-semibold transition-colors whitespace-nowrap"
                  >
                    <Eye className="w-4 h-4" /> View Details
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Details Modal */}
      {selectedAgreement && (
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
                Agreement Details
              </h2>
              <button
                onClick={() => setSelectedAgreement(null)}
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
              {/* Title and Status */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <h3 className={`text-2xl font-bold ${text}`}>
                    {selectedAgreement.title}
                  </h3>
                  <span
                    className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border ${getStatusColor(
                      selectedAgreement.status
                    )}`}
                  >
                    {getStatusIcon(selectedAgreement.status)}
                    {selectedAgreement.status.replace(/_/g, " ")}
                  </span>
                </div>
                <p className={`text-sm ${muted}`}>
                  {selectedAgreement.description}
                </p>
              </div>

              {/* Key Details */}
              <div className={`grid grid-cols-2 gap-4 p-4 rounded-xl ${dm ? "bg-gray-800" : "bg-slate-50"}`}>
                <div>
                  <p className={`text-xs font-semibold uppercase ${muted}`}>
                    Budget
                  </p>
                  <p className={`text-lg font-bold text-emerald-600`}>
                    {selectedAgreement.budget.toLocaleString()}{" "}
                    {selectedAgreement.currency}
                  </p>
                </div>
                <div>
                  <p className={`text-xs font-semibold uppercase ${muted}`}>
                    Job
                  </p>
                  <p className={`text-sm font-semibold ${text}`}>
                    {selectedAgreement.job_title}
                  </p>
                </div>
                <div>
                  <p className={`text-xs font-semibold uppercase ${muted}`}>
                    Employer
                  </p>
                  <p className={`text-sm font-semibold ${text}`}>
                    {selectedAgreement.employer_name}
                  </p>
                </div>
                <div>
                  <p className={`text-xs font-semibold uppercase ${muted}`}>
                    Talent
                  </p>
                  <p className={`text-sm font-semibold ${text}`}>
                    {selectedAgreement.talent_name}
                  </p>
                </div>
              </div>

              {/* Dates */}
              {(selectedAgreement.start_date || selectedAgreement.end_date) && (
                <div className="grid grid-cols-2 gap-4">
                  {selectedAgreement.start_date && (
                    <div>
                      <p className={`text-xs font-semibold uppercase ${muted}`}>
                        Start Date
                      </p>
                      <p className={`text-sm font-semibold ${text}`}>
                        {new Date(
                          selectedAgreement.start_date
                        ).toLocaleDateString()}
                      </p>
                    </div>
                  )}
                  {selectedAgreement.end_date && (
                    <div>
                      <p className={`text-xs font-semibold uppercase ${muted}`}>
                        End Date
                      </p>
                      <p className={`text-sm font-semibold ${text}`}>
                        {new Date(selectedAgreement.end_date).toLocaleDateString()}
                      </p>
                    </div>
                  )}
                </div>
              )}

              {/* Acceptance Status */}
              <div className={`p-4 rounded-xl border ${dm ? "border-gray-700 bg-gray-800/50" : "border-slate-200 bg-slate-50"}`}>
                <p className={`text-xs font-semibold uppercase mb-3 ${muted}`}>
                  Acceptance Status
                </p>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className={`text-sm ${text}`}>Employer</span>
                    {selectedAgreement.employer_accepted_at ? (
                      <span className="flex items-center gap-1 text-emerald-600 text-sm font-semibold">
                        <CheckCircle className="w-4 h-4" /> Accepted
                      </span>
                    ) : (
                      <span className={`text-sm ${muted}`}>Pending</span>
                    )}
                  </div>
                  <div className="flex items-center justify-between">
                    <span className={`text-sm ${text}`}>Talent</span>
                    {selectedAgreement.talent_accepted_at ? (
                      <span className="flex items-center gap-1 text-emerald-600 text-sm font-semibold">
                        <CheckCircle className="w-4 h-4" /> Accepted
                      </span>
                    ) : (
                      <span className={`text-sm ${muted}`}>Pending</span>
                    )}
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 pt-4">
                <button
                  onClick={() => setSelectedAgreement(null)}
                  className={`flex-1 py-2.5 rounded-lg border text-sm font-semibold transition-colors ${
                    dm
                      ? "border-gray-700 text-gray-300 hover:bg-gray-800"
                      : "border-slate-300 text-gray-600 hover:bg-slate-50"
                  }`}
                >
                  Close
                </button>

                {selectedAgreement.status === "pending" &&
                  !selectedAgreement.employer_accepted_at &&
                  user?.role === "employer" && (
                    <button
                      onClick={handleAccept}
                      disabled={actionLoading}
                      className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg bg-emerald-500 hover:bg-emerald-600 text-white text-sm font-semibold transition-colors disabled:opacity-50"
                    >
                      {actionLoading ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <ThumbsUp className="w-4 h-4" />
                      )}
                      Accept Agreement
                    </button>
                  )}

                {selectedAgreement.status === "pending" &&
                  !selectedAgreement.talent_accepted_at &&
                  user?.role === "talent" && (
                    <button
                      onClick={handleAccept}
                      disabled={actionLoading}
                      className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg bg-emerald-500 hover:bg-emerald-600 text-white text-sm font-semibold transition-colors disabled:opacity-50"
                    >
                      {actionLoading ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <ThumbsUp className="w-4 h-4" />
                      )}
                      Accept Agreement
                    </button>
                  )}

                {selectedAgreement.status === "active" &&
                  user?.role === "talent" && (
                    <button
                      onClick={handleComplete}
                      disabled={actionLoading}
                      className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg bg-blue-500 hover:bg-blue-600 text-white text-sm font-semibold transition-colors disabled:opacity-50"
                    >
                      {actionLoading ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <CheckCheck className="w-4 h-4" />
                      )}
                      Mark as Completed
                    </button>
                  )}

                {selectedAgreement.status === "completed" &&
                  user?.role === "employer" && (
                    <button
                      onClick={handleConfirmCompletion}
                      disabled={actionLoading}
                      className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg bg-purple-500 hover:bg-purple-600 text-white text-sm font-semibold transition-colors disabled:opacity-50"
                    >
                      {actionLoading ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <DollarSign className="w-4 h-4" />
                      )}
                      Confirm & Release Payout
                    </button>
                  )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
