import React from "react";
import { FileText, User, Calendar, TrendingUp, CheckCircle2, Clock } from "lucide-react";
import type { RealContract } from "../hooks/useContracts";

interface ContractListProps {
  contracts: RealContract[];
  loading?: boolean;
  error?: string | null;
  darkMode?: boolean;
  onViewDetails?: (contract: RealContract) => void;
}

const STATUS_STYLES: Record<string, string> = {
  draft:       "bg-gray-100 text-gray-700",
  sent:        "bg-blue-100 text-blue-700",
  negotiating: "bg-yellow-100 text-yellow-700",
  signed:      "bg-purple-100 text-purple-700",
  active:      "bg-green-100 text-green-700",
  completed:   "bg-emerald-100 text-emerald-700",
  cancelled:   "bg-red-100 text-red-700",
  disputed:    "bg-orange-100 text-orange-700",
};

export const ContractList: React.FC<ContractListProps> = ({
  contracts, loading = false, error = null, darkMode: dm = false, onViewDetails,
}) => {
  const card = dm ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200";
  const text = dm ? "text-white" : "text-gray-900";
  const muted = dm ? "text-gray-400" : "text-gray-500";

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16 gap-3">
        <div className="w-7 h-7 rounded-full border-4 border-[#0084ca]/20 border-t-[#0084ca] animate-spin" />
        <span className={`text-sm ${muted}`}>Loading contracts...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`text-center py-12 px-4 rounded-xl border ${dm ? "bg-red-900/20 border-red-800 text-red-400" : "bg-red-50 border-red-200 text-red-600"}`}>
        <p className="text-sm">{error}</p>
      </div>
    );
  }

  if (contracts.length === 0) {
    return (
      <div className={`text-center py-16 px-4 rounded-xl border ${card}`}>
        <div className={`w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-4 ${dm ? "bg-gray-700" : "bg-slate-100"}`}>
          <FileText className={`w-7 h-7 ${muted}`} />
        </div>
        <h3 className={`font-semibold mb-1 ${text}`}>No Contracts Yet</h3>
        <p className={`text-sm ${muted}`}>
          Contracts will appear here once you hire a talent from your job proposals.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {contracts.map((contract) => {
        const progress = contract.milestone_count > 0
          ? Math.round((contract.milestones_completed / contract.milestone_count) * 100)
          : 0;

        const barColor =
          contract.status === "completed" ? "bg-emerald-500" :
          contract.status === "active"    ? "bg-[#0084ca]" :
          contract.status === "cancelled" ? "bg-red-400" : "bg-gray-400";

        return (
          <div key={contract.id} className={`rounded-xl border p-5 transition-shadow hover:shadow-md ${card}`}>
            <div className="flex items-start justify-between gap-4 flex-wrap">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1 flex-wrap">
                  <h3 className={`font-semibold truncate ${text}`}>{contract.job_title}</h3>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium capitalize ${STATUS_STYLES[contract.status] ?? "bg-gray-100 text-gray-700"}`}>
                    {contract.status}
                  </span>
                </div>

                <div className={`flex flex-wrap gap-4 text-sm ${muted}`}>
                  <span className="flex items-center gap-1.5">
                    <User className="w-3.5 h-3.5" /> {contract.talent_name}
                  </span>
                  {contract.start_date && (
                    <span className="flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5" />
                      {new Date(contract.start_date).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                    </span>
                  )}
                  <span className="flex items-center gap-1.5">
                    <TrendingUp className="w-3.5 h-3.5" />
                    {Number(contract.total_amount).toLocaleString()} ETB
                  </span>
                </div>
              </div>

              {/* Milestone progress */}
              {contract.milestone_count > 0 && (
                <div className="text-right flex-shrink-0">
                  <p className={`text-xs font-medium mb-1 ${muted}`}>
                    {contract.milestones_completed}/{contract.milestone_count} milestones
                  </p>
                  <div className={`w-32 h-1.5 rounded-full ${dm ? "bg-gray-700" : "bg-gray-200"}`}>
                    <div className={`h-1.5 rounded-full transition-all ${barColor}`} style={{ width: `${progress}%` }} />
                  </div>
                  <p className={`text-xs mt-1 ${muted}`}>{progress}% complete</p>
                </div>
              )}
            </div>

            {/* Status indicators */}
            <div className={`flex items-center justify-between mt-4 pt-4 border-t ${dm ? "border-gray-700" : "border-gray-100"}`}>
              <div className="flex items-center gap-3">
                {contract.status === "active" && (
                  <span className="flex items-center gap-1 text-xs text-green-500 font-medium">
                    <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" /> In Progress
                  </span>
                )}
                {contract.status === "completed" && (
                  <span className="flex items-center gap-1 text-xs text-emerald-500 font-medium">
                    <CheckCircle2 className="w-3.5 h-3.5" /> Completed
                  </span>
                )}
                {["draft", "sent", "negotiating", "signed"].includes(contract.status) && (
                  <span className="flex items-center gap-1 text-xs text-blue-500 font-medium">
                    <Clock className="w-3.5 h-3.5" /> Awaiting activation
                  </span>
                )}
              </div>
              <button
                onClick={() => onViewDetails?.(contract)}
                className={`text-xs font-medium px-3 py-1.5 rounded-lg transition-colors ${dm ? "bg-gray-700 hover:bg-gray-600 text-gray-300" : "bg-slate-100 hover:bg-slate-200 text-gray-700"}`}
              >
                View Details
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
};
