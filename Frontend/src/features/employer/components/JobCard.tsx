import React from "react";
import { Edit2, Trash2, Eye, Users, Calendar, DollarSign } from "lucide-react";
import type { Job } from "../types/employer.types";

interface JobCardProps {
  job: Job;
  darkMode?: boolean;
  onViewDetails: (job: Job) => void;
  onEdit: (job: Job) => void;
  onDelete: (job: Job) => void;
  onViewProposals: (job: Job) => void;
}

const statusConfig: Record<string, { label: string; cls: string }> = {
  active:  { label: "Active",  cls: "bg-emerald-50 text-emerald-700 border border-emerald-200" },
  draft:   { label: "Draft",   cls: "bg-gray-100 text-gray-600 border border-gray-200" },
  closed:  { label: "Closed",  cls: "bg-red-50 text-red-700 border border-red-200" },
  paused:  { label: "Paused",  cls: "bg-amber-50 text-amber-700 border border-amber-200" },
};

export const JobCard: React.FC<JobCardProps> = ({
  job, darkMode = false, onViewDetails, onEdit, onDelete, onViewProposals,
}) => {
  const status = statusConfig[job.status] ?? statusConfig.draft;
  const dm = darkMode;

  return (
    <tr className={`group transition-colors ${dm ? "hover:bg-gray-750 border-gray-700" : "hover:bg-gray-50 border-gray-100"}`}>
      {/* Title + category */}
      <td className="py-4 pl-6 pr-4">
        <div className="flex flex-col gap-0.5">
          <button
            onClick={() => onViewDetails(job)}
            className={`text-sm font-semibold text-left hover:text-[#0084ca] transition-colors ${dm ? "text-white" : "text-gray-900"}`}
          >
            {job.title}
          </button>
          <span className={`text-xs ${dm ? "text-gray-400" : "text-gray-500"}`}>
            {job.category_name || "Uncategorized"} · {job.experience_level}
          </span>
        </div>
      </td>

      {/* Status badge */}
      <td className="py-4 px-4">
        <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold ${status.cls}`}>
          <span className={`w-1.5 h-1.5 rounded-full mr-1.5 ${
            job.status === "active" ? "bg-emerald-500" :
            job.status === "closed" ? "bg-red-500" :
            job.status === "paused" ? "bg-amber-500" : "bg-gray-400"
          }`} />
          {status.label}
        </span>
      </td>

      {/* Budget */}
      <td className="py-4 px-4">
        <div className={`flex items-center gap-1 text-sm ${dm ? "text-gray-300" : "text-gray-700"}`}>
          <DollarSign className="w-3.5 h-3.5 text-gray-400" />
          <span>{job.salary || "—"}</span>
          <span className={`text-xs ${dm ? "text-gray-500" : "text-gray-400"}`}>
            {job.budget_type === "hourly" ? "/hr" : " fixed"}
          </span>
        </div>
      </td>

      {/* Applications */}
      <td className="py-4 px-4">
        <button
          onClick={() => onViewProposals(job)}
          className="flex items-center gap-1.5 group/btn"
        >
          <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-sm font-medium transition-colors ${
            (job.applications_count ?? 0) > 0
              ? dm ? "bg-blue-900/30 text-blue-400 hover:bg-blue-900/50" : "bg-blue-50 text-blue-700 hover:bg-blue-100"
              : dm ? "text-gray-500" : "text-gray-400"
          }`}>
            <Users className="w-3.5 h-3.5" />
            {job.applications_count ?? 0}
            <span className="text-xs font-normal">applicants</span>
          </div>
        </button>
      </td>

      {/* Posted date */}
      <td className="py-4 px-4">
        <div className={`flex items-center gap-1 text-xs ${dm ? "text-gray-400" : "text-gray-500"}`}>
          <Calendar className="w-3.5 h-3.5" />
          {new Date(job.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
        </div>
      </td>

      {/* Actions */}
      <td className="py-4 pl-4 pr-6">
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            onClick={() => onViewProposals(job)}
            title="View Applications"
            className={`p-1.5 rounded-lg transition-colors ${dm ? "hover:bg-gray-700 text-gray-400 hover:text-white" : "hover:bg-gray-100 text-gray-500 hover:text-gray-900"}`}
          >
            <Eye className="w-4 h-4" />
          </button>
          <button
            onClick={() => onEdit(job)}
            title="Edit Job"
            className={`p-1.5 rounded-lg transition-colors ${dm ? "hover:bg-gray-700 text-gray-400 hover:text-white" : "hover:bg-gray-100 text-gray-500 hover:text-gray-900"}`}
          >
            <Edit2 className="w-4 h-4" />
          </button>
          <button
            onClick={() => onDelete(job)}
            title="Delete Job"
            className="p-1.5 rounded-lg transition-colors hover:bg-red-50 text-gray-400 hover:text-red-600"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </td>
    </tr>
  );
};
