import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import { useAllProposals } from "../hooks/useAllProposals";
import { TalentProfileModal } from "./TalentProfileModal";
import { EMPLOYER_ROUTES } from "../../../config/routes";
import {
  Search, Filter, ChevronDown, User, Briefcase, Calendar,
  Clock, CheckCircle, XCircle, Star, ShieldCheck, Eye,
  AlertCircle, Loader2, RefreshCw, DollarSign,
} from "lucide-react";

interface ProposalsPageProps { darkMode?: boolean; }

const STATUS_META: Record<string, { label: string; dot: string; badge: string }> = {
  pending:     { label: "Pending",     dot: "bg-amber-400",   badge: "bg-amber-50 text-amber-700 border-amber-200" },
  reviewed:    { label: "Reviewed",    dot: "bg-blue-400",    badge: "bg-blue-50 text-blue-700 border-blue-200" },
  shortlisted: { label: "Shortlisted", dot: "bg-violet-400",  badge: "bg-violet-50 text-violet-700 border-violet-200" },
  hired:       { label: "Hired",       dot: "bg-emerald-500", badge: "bg-emerald-50 text-emerald-700 border-emerald-200" },
  rejected:    { label: "Rejected",    dot: "bg-red-400",     badge: "bg-red-50 text-red-700 border-red-200" },
};

function getInitials(name: string | null | undefined) {
  if (!name) return "?";
  return name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);
}

export const ProposalsPage: React.FC<ProposalsPageProps> = ({ darkMode = false }) => {
  const dm = darkMode;
  const navigate = useNavigate();

  const [selectedTalentId, setSelectedTalentId] = useState<number | null>(null);
  const [showTalentModal, setShowTalentModal] = useState(false);
  const [statusFilter, setStatusFilter] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [actionLoading, setActionLoading] = useState<number | null>(null);

  const { proposals, loading, error, pagination, fetchAllProposals, updateProposalStatus } = useAllProposals();

  useEffect(() => { fetchAllProposals(); }, [fetchAllProposals]);

  const filtered = proposals.filter((p) => {
    const matchStatus = statusFilter === "all" || p.status === statusFilter;
    const q = searchTerm.toLowerCase();
    const matchSearch = !q || p.talent_name.toLowerCase().includes(q) || p.job_title?.toLowerCase().includes(q) || p.cover_letter?.toLowerCase().includes(q);
    return matchStatus && matchSearch;
  });

  const counts = proposals.reduce<Record<string, number>>((acc, p) => {
    acc[p.status] = (acc[p.status] || 0) + 1;
    return acc;
  }, {});

  const handleAction = async (proposalId: number, status: string, jobId?: number, talentName?: string, talentEmail?: string, profileImage?: string) => {
    if (status === "hired" && jobId) {
      navigate(
        `/employer/agreement/${jobId}`,
        { 
          state: { 
            application_id: proposalId,
            talent_name: talentName,
            talent_email: talentEmail,
            profile_image: profileImage,
          } 
        }
      );
      return;
    }
    setActionLoading(proposalId);
    await updateProposalStatus(proposalId, status);
    setActionLoading(null);
  };

  const card = dm ? "bg-gray-800 border-gray-700" : "bg-white border-slate-200";
  const text = dm ? "text-white" : "text-gray-900";
  const muted = dm ? "text-gray-400" : "text-gray-500";
  const inputCls = dm ? "bg-gray-700 border-gray-600 text-white placeholder-gray-500" : "bg-white border-slate-300 text-gray-900 placeholder-gray-400";

  if (loading && proposals.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-3">
        <Loader2 className="w-8 h-8 animate-spin text-[#0084ca]" />
        <p className={`text-sm ${muted}`}>Loading proposals...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`rounded-xl border p-10 text-center ${card}`}>
        <AlertCircle className="w-10 h-10 mx-auto mb-3 text-red-400" />
        <p className={`font-medium mb-1 ${text}`}>Failed to load proposals</p>
        <p className={`text-sm mb-4 ${muted}`}>{error}</p>
        <button onClick={() => fetchAllProposals()} className="flex items-center gap-2 mx-auto px-4 py-2 bg-[#0084ca] text-white rounded-lg text-sm font-medium hover:bg-[#006ba6] transition-colors">
          <RefreshCw className="w-4 h-4" /> Try Again
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className={`text-xl font-bold ${text}`}>Applications</h2>
          <p className={`text-sm mt-0.5 ${muted}`}>{proposals.length} total application{proposals.length !== 1 ? "s" : ""}</p>
        </div>
        <button onClick={() => fetchAllProposals()} className={`p-2 rounded-lg transition-colors ${dm ? "hover:bg-gray-700 text-gray-400" : "hover:bg-slate-100 text-gray-500"}`}>
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      {/* Status filter tabs */}
      <div className={`flex items-center gap-1 p-1 rounded-xl overflow-x-auto ${dm ? "bg-gray-800" : "bg-slate-100"}`}>
        {[
          { key: "all", label: "All", count: proposals.length },
          { key: "pending", label: "Pending", count: counts.pending || 0 },
          { key: "reviewed", label: "Reviewed", count: counts.reviewed || 0 },
          { key: "shortlisted", label: "Shortlisted", count: counts.shortlisted || 0 },
          { key: "hired", label: "Hired", count: counts.hired || 0 },
          { key: "rejected", label: "Rejected", count: counts.rejected || 0 },
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => setStatusFilter(tab.key)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all ${
              statusFilter === tab.key
                ? "bg-white shadow-sm text-[#0084ca] dark:bg-gray-700"
                : dm ? "text-gray-400 hover:text-gray-200" : "text-gray-500 hover:text-gray-800"
            }`}
          >
            {tab.label}
            {tab.count > 0 && (
              <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-bold ${
                statusFilter === tab.key ? "bg-[#0084ca]/10 text-[#0084ca]" : dm ? "bg-gray-700 text-gray-400" : "bg-slate-200 text-gray-600"
              }`}>{tab.count}</span>
            )}
          </button>
        ))}
      </div>

      {/* Search */}
      <div className={`flex items-center gap-2 px-3 py-2.5 rounded-xl border ${dm ? "bg-gray-800 border-gray-700" : "bg-white border-slate-200"}`}>
        <Search className={`w-4 h-4 flex-shrink-0 ${muted}`} />
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Search by name, job, or cover letter..."
          className={`flex-1 bg-transparent outline-none text-sm ${dm ? "text-white placeholder-gray-500" : "text-gray-900 placeholder-gray-400"}`}
        />
      </div>

      {/* Empty state */}
      {filtered.length === 0 && (
        <div className={`rounded-xl border p-12 text-center ${card}`}>
          <Briefcase className={`w-10 h-10 mx-auto mb-3 opacity-20 ${text}`} />
          <p className={`font-medium ${text}`}>No applications found</p>
          <p className={`text-sm mt-1 ${muted}`}>
            {searchTerm || statusFilter !== "all" ? "Try adjusting your filters" : "Applications will appear here once talents apply"}
          </p>
        </div>
      )}

      {/* Proposal cards */}
      <div className="space-y-3">
        {filtered.map((proposal) => {
          const meta = STATUS_META[proposal.status] ?? STATUS_META.pending;
          const isExpanded = expandedId === proposal.id;
          const isActioning = actionLoading === proposal.id;

          return (
            <div key={proposal.id} className={`rounded-xl border overflow-hidden transition-shadow hover:shadow-md ${card}`}>
              {/* Card header */}
              <div className="p-5">
                <div className="flex items-start gap-4">
                  {/* Avatar */}
                  {proposal.profile_image ? (
                    <img
                      src={proposal.profile_image}
                      alt={proposal.talent_name || ""}
                      className="w-12 h-12 rounded-full object-cover flex-shrink-0 ring-2 ring-slate-200"
                    />
                  ) : (
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#0084ca] to-violet-600 flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                      {getInitials(proposal.talent_name)}
                    </div>
                  )}

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-3 flex-wrap">
                      <div>
                        <button
                          onClick={() => { setSelectedTalentId(proposal.talent_id); setShowTalentModal(true); }}
                          className={`font-semibold text-base hover:text-[#0084ca] transition-colors ${text}`}
                        >
                          {proposal.talent_name || "Unknown Talent"}
                        </button>
                        <p className={`text-sm ${muted}`}>{proposal.talent_email || "—"}</p>
                      </div>
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border flex-shrink-0 ${meta.badge}`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${meta.dot}`} />
                        {meta.label}
                      </span>
                    </div>

                    {/* Meta row */}
                    <div className={`flex flex-wrap items-center gap-x-4 gap-y-1 mt-2 text-xs ${muted}`}>
                      {proposal.job_title && (
                        <span className="flex items-center gap-1">
                          <Briefcase className="w-3.5 h-3.5" /> {proposal.job_title}
                        </span>
                      )}
                      {proposal.talent_location && (
                        <span className="flex items-center gap-1">
                          <span>📍</span> {proposal.talent_location}
                        </span>
                      )}
                      {proposal.hourly_rate && (
                        <span className="flex items-center gap-1 text-emerald-600 font-medium">
                          <DollarSign className="w-3 h-3" /> {proposal.hourly_rate}/hr
                        </span>
                      )}
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5" />
                        Applied {new Date(proposal.applied_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                      </span>
                    </div>

                    {/* About */}
                    {proposal.about && (
                      <p className={`text-xs mt-1.5 line-clamp-1 ${muted}`}>{proposal.about}</p>
                    )}
                  </div>
                </div>

                {/* Cover letter preview */}
                {proposal.cover_letter && (
                  <div className="mt-4">
                    <p className={`text-sm leading-relaxed ${dm ? "text-gray-300" : "text-gray-700"} ${!isExpanded ? "line-clamp-2" : ""}`}>
                      {proposal.cover_letter}
                    </p>
                    {proposal.cover_letter.length > 120 && (
                      <button
                        onClick={() => setExpandedId(isExpanded ? null : proposal.id)}
                        className="text-xs text-[#0084ca] hover:underline mt-1"
                      >
                        {isExpanded ? "Show less" : "Read more"}
                      </button>
                    )}
                  </div>
                )}

                {/* Actions */}
                <div className="flex flex-wrap items-center gap-2 mt-4 pt-4 border-t border-dashed border-slate-200 dark:border-gray-700">

                  {/* View profile */}
                  <button
                    onClick={() => { setSelectedTalentId(proposal.talent_id); setShowTalentModal(true); }}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${dm ? "bg-gray-700 text-gray-300 hover:bg-gray-600" : "bg-slate-100 text-gray-600 hover:bg-slate-200"}`}
                  >
                    <Eye className="w-3.5 h-3.5" /> View Profile
                  </button>

                  {/* Status-based actions */}
                  {proposal.status === "pending" && (
                    <>
                      <button
                        disabled={isActioning}
                        onClick={() => handleAction(proposal.id, "reviewed", proposal.job_id)}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-blue-50 text-blue-700 hover:bg-blue-100 transition-colors disabled:opacity-50"
                      >
                        {isActioning ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Clock className="w-3.5 h-3.5" />}
                        Mark Reviewed
                      </button>
                      <button
                        disabled={isActioning}
                        onClick={() => handleAction(proposal.id, "shortlisted", proposal.job_id)}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-violet-50 text-violet-700 hover:bg-violet-100 transition-colors disabled:opacity-50"
                      >
                        <Star className="w-3.5 h-3.5" /> Shortlist
                      </button>
                      <button
                        disabled={isActioning}
                        onClick={() => handleAction(proposal.id, "rejected", proposal.job_id)}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-red-50 text-red-600 hover:bg-red-100 transition-colors disabled:opacity-50"
                      >
                        <XCircle className="w-3.5 h-3.5" /> Decline
                      </button>
                    </>
                  )}

                  {proposal.status === "reviewed" && (
                    <>
                      <button
                        disabled={isActioning}
                        onClick={() => handleAction(proposal.id, "shortlisted", proposal.job_id)}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-violet-50 text-violet-700 hover:bg-violet-100 transition-colors disabled:opacity-50"
                      >
                        <Star className="w-3.5 h-3.5" /> Shortlist
                      </button>
                      <button
                        disabled={isActioning}
                        onClick={() => handleAction(proposal.id, "rejected", proposal.job_id)}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-red-50 text-red-600 hover:bg-red-100 transition-colors disabled:opacity-50"
                      >
                        <XCircle className="w-3.5 h-3.5" /> Decline
                      </button>
                    </>
                  )}

                  {proposal.status === "shortlisted" && (
                    <>
                      {/* Primary CTA — Hire & Pay */}
                      <button
                        onClick={() => handleAction(proposal.id, "hired", proposal.job_id, proposal.talent_name, proposal.talent_email, proposal.profile_image)}
                        className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-semibold bg-[#0084ca] hover:bg-[#006ba6] text-white transition-colors shadow-sm"
                      >
                        <ShieldCheck className="w-4 h-4" />
                        Hire &amp; Pay via Escrow
                      </button>
                      <button
                        disabled={isActioning}
                        onClick={() => handleAction(proposal.id, "rejected", proposal.job_id)}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-red-50 text-red-600 hover:bg-red-100 transition-colors disabled:opacity-50"
                      >
                        <XCircle className="w-3.5 h-3.5" /> Decline
                      </button>
                    </>
                  )}

                  {proposal.status === "hired" && proposal.job_id && (
                    <button
                      onClick={() => navigate(
                        EMPLOYER_ROUTES.ESCROW_PAYMENT.path.replace(":job_id", String(proposal.job_id)),
                        { state: { application_id: proposal.id } }
                      )}
                      className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-semibold bg-emerald-600 hover:bg-emerald-700 text-white transition-colors shadow-sm"
                    >
                      <ShieldCheck className="w-4 h-4" />
                      Manage Escrow &amp; Payment
                    </button>
                  )}

                  {proposal.status === "rejected" && (
                    <button
                      disabled={isActioning}
                      onClick={() => handleAction(proposal.id, "pending", proposal.job_id)}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors disabled:opacity-50 ${dm ? "bg-gray-700 text-gray-300 hover:bg-gray-600" : "bg-slate-100 text-gray-600 hover:bg-slate-200"}`}
                    >
                      Reconsider
                    </button>
                  )}
                </div>
              </div>

              {/* Hired banner */}
              {proposal.status === "hired" && (
                <div className="px-5 py-2.5 bg-emerald-50 border-t border-emerald-100 flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                  <p className="text-xs text-emerald-700 font-medium">
                    Talent hired — fund escrow to start the contract and secure payment.
                  </p>
                </div>
              )}

              {/* Shortlisted banner */}
              {proposal.status === "shortlisted" && (
                <div className="px-5 py-2.5 bg-violet-50 border-t border-violet-100 flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-violet-600 flex-shrink-0" />
                  <p className="text-xs text-violet-700 font-medium">
                    Ready to hire? Click "Hire &amp; Pay via Escrow" to fund the contract securely.
                  </p>
                </div>
              )}
            </div>
          );
        })}
      </div>

      <TalentProfileModal
        isOpen={showTalentModal}
        onClose={() => setShowTalentModal(false)}
        talentId={selectedTalentId}
        darkMode={dm}
      />
    </div>
  );
};

export default ProposalsPage;
