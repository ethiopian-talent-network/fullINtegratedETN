import React, { useState, useMemo } from "react";
import { Search, Plus, ChevronUp, ChevronDown, Edit2, Trash2, Eye, Users, Calendar, DollarSign } from "lucide-react";
import type { Job } from "../types/employer.types";
import { useNavigate } from "react-router";
import { EMPLOYER_ROUTES } from "../../../config/routes";

interface JobListProps {
  jobs: Job[];
  loading?: boolean;
  error?: string | null;
  darkMode?: boolean;
  onViewDetails: (job: Job) => void;
  onEdit: (job: Job) => void;
  onDelete: (job: Job) => void;
  onViewProposals: (job: Job) => void;
}

type SortKey = "title" | "created_at" | "applications_count";

const statusConfig: Record<string, { label: string; dot: string; cls: string }> = {
  active:  { label: "Active",  dot: "bg-emerald-500", cls: "bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-400 dark:border-emerald-800" },
  draft:   { label: "Draft",   dot: "bg-gray-400",    cls: "bg-gray-100 text-gray-600 border border-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:border-gray-600" },
  closed:  { label: "Closed",  dot: "bg-red-500",     cls: "bg-red-50 text-red-700 border border-red-200 dark:bg-red-900/30 dark:text-red-400 dark:border-red-800" },
  paused:  { label: "Paused",  dot: "bg-amber-500",   cls: "bg-amber-50 text-amber-700 border border-amber-200 dark:bg-amber-900/30 dark:text-amber-400 dark:border-amber-800" },
};

export const JobList: React.FC<JobListProps> = ({
  jobs, loading = false, error = null, darkMode = false,
  onViewDetails, onEdit, onDelete, onViewProposals,
}) => {
  const navigate = useNavigate();
  const dm = darkMode;
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [sortKey, setSortKey] = useState<SortKey>("created_at");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");

  const filtered = useMemo(() => {
    let list = [...jobs];
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter((j) => j.title.toLowerCase().includes(q) || j.category_name?.toLowerCase().includes(q));
    }
    if (statusFilter !== "all") list = list.filter((j) => j.status === statusFilter);
    list.sort((a, b) => {
      let av: any = a[sortKey] ?? 0;
      let bv: any = b[sortKey] ?? 0;
      if (sortKey === "created_at") { av = new Date(av).getTime(); bv = new Date(bv).getTime(); }
      return sortDir === "asc" ? (av > bv ? 1 : -1) : (av < bv ? 1 : -1);
    });
    return list;
  }, [jobs, search, statusFilter, sortKey, sortDir]);

  const toggleSort = (key: SortKey) => {
    if (sortKey === key) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else { setSortKey(key); setSortDir("desc"); }
  };

  const SortIcon = ({ k }: { k: SortKey }) =>
    sortKey === k
      ? sortDir === "asc" ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />
      : <ChevronDown className="w-3.5 h-3.5 opacity-30" />;

  const cardBg = dm ? "bg-gray-800 border-gray-700" : "bg-white border-slate-200 shadow-sm";
  const thCls = `px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider ${dm ? "text-gray-400" : "text-gray-600"}`;

  if (loading) {
    return (
      <div className={`rounded-xl border ${cardBg}`}>
        {[...Array(4)].map((_, i) => (
          <div key={i} className={`flex gap-4 p-5 border-b last:border-0 animate-pulse ${dm ? "border-gray-700" : "border-slate-200"}`}>
            <div className={`h-4 rounded w-1/3 ${dm ? "bg-gray-700" : "bg-gray-200"}`} />
            <div className={`h-4 rounded w-16 ${dm ? "bg-gray-700" : "bg-gray-200"}`} />
            <div className={`h-4 rounded w-20 ml-auto ${dm ? "bg-gray-700" : "bg-gray-200"}`} />
          </div>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className={`rounded-xl border p-8 text-center ${dm ? "bg-gray-800 border-gray-700 text-red-400" : "bg-red-50 border-red-200 text-red-600"}`}>
        <p className="text-sm">{error}</p>
      </div>
    );
  }

  return (
    <div className={`rounded-xl border overflow-hidden ${cardBg}`}>
      {/* Toolbar */}
      <div className={`flex flex-col sm:flex-row gap-3 p-4 border-b ${dm ? "border-gray-700" : "border-slate-200"}`}>
        <div className={`flex items-center gap-2 flex-1 px-3 py-2 rounded-lg border text-sm ${dm ? "bg-gray-700 border-gray-600" : "bg-white border-slate-300"}`}>
          <Search className="w-4 h-4 text-gray-400 flex-shrink-0" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search jobs..."
            className={`flex-1 bg-transparent outline-none ${dm ? "text-white placeholder-gray-500" : "text-gray-900 placeholder-gray-400"}`}
          />
        </div>
        <div className="flex gap-2">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className={`flex-1 sm:flex-none px-3 py-2 rounded-lg border text-sm outline-none ${dm ? "bg-gray-700 border-gray-600 text-white" : "bg-white border-slate-300 text-gray-800"}`}
          >
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="draft">Draft</option>
            <option value="paused">Paused</option>
            <option value="closed">Closed</option>
          </select>
          <button
            onClick={() => navigate(EMPLOYER_ROUTES.POST_JOB.path)}
            className="flex items-center gap-2 px-4 py-2 bg-[#0084ca] hover:bg-[#006ba6] text-white text-sm font-semibold rounded-lg transition-colors whitespace-nowrap"
          >
            <Plus className="w-4 h-4" />
            <span className="hidden sm:inline">Post Job</span>
          </button>
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="py-16 text-center">
          <div className={`w-14 h-14 rounded-full mx-auto mb-4 flex items-center justify-center ${dm ? "bg-gray-700" : "bg-gray-100"}`}>
            <Search className={`w-6 h-6 ${dm ? "text-gray-500" : "text-gray-400"}`} />
          </div>
          <p className={`text-sm font-medium mb-1 ${dm ? "text-gray-300" : "text-gray-700"}`}>
            {jobs.length === 0 ? "No jobs posted yet" : "No jobs match your filters"}
          </p>
          <p className={`text-xs ${dm ? "text-gray-500" : "text-gray-400"}`}>
            {jobs.length === 0 ? "Post your first job to start receiving applications" : "Try adjusting your search or filter"}
          </p>
        </div>
      ) : (
        <>
          {/* Desktop table */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className={`border-b ${dm ? "border-gray-700 bg-gray-800/50" : "border-slate-200 bg-slate-50"}`}>
                  <th className={`${thCls} pl-6`}>
                    <button className="flex items-center gap-1" onClick={() => toggleSort("title")}>
                      Job Title <SortIcon k="title" />
                    </button>
                  </th>
                  <th className={thCls}>Status</th>
                  <th className={thCls}>Budget</th>
                  <th className={thCls}>
                    <button className="flex items-center gap-1" onClick={() => toggleSort("applications_count")}>
                      Applications <SortIcon k="applications_count" />
                    </button>
                  </th>
                  <th className={thCls}>
                    <button className="flex items-center gap-1" onClick={() => toggleSort("created_at")}>
                      Posted <SortIcon k="created_at" />
                    </button>
                  </th>
                  <th className={`${thCls} pr-6`}>Actions</th>
                </tr>
              </thead>
              <tbody className={`divide-y ${dm ? "divide-gray-700" : "divide-slate-200"}`}>
                {filtered.map((job) => {
                  const st = statusConfig[job.status] ?? statusConfig.draft;
                  return (
                    <tr key={job.id} className={`group transition-colors ${dm ? "hover:bg-gray-750" : "hover:bg-slate-50"}`}>
                      <td className="py-4 pl-6 pr-4">
                        <div className="flex flex-col gap-0.5">
                          <button onClick={() => onViewDetails(job)}
                            className={`text-sm font-semibold text-left hover:text-[#0084ca] transition-colors ${dm ? "text-white" : "text-gray-900"}`}>
                            {job.title}
                          </button>
                          <span className={`text-xs ${dm ? "text-gray-400" : "text-gray-600"}`}>
                            {job.category_name || "Uncategorized"} · {job.experience_level}
                          </span>
                        </div>
                      </td>
                      <td className="py-4 px-4">
                        <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold ${st.cls}`}>
                          <span className={`w-1.5 h-1.5 rounded-full mr-1.5 ${st.dot}`} />{st.label}
                        </span>
                      </td>
                      <td className="py-4 px-4">
                        <div className={`flex items-center gap-1 text-sm ${dm ? "text-gray-300" : "text-gray-800"}`}>
                          <DollarSign className="w-3.5 h-3.5 text-gray-400" />
                          {job.salary || "—"}
                          <span className={`text-xs ${dm ? "text-gray-500" : "text-gray-500"}`}>
                            {job.budget_type === "hourly" ? "/hr" : " fixed"}
                          </span>
                        </div>
                      </td>
                      <td className="py-4 px-4">
                        <button onClick={() => onViewProposals(job)}
                          className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-sm font-medium transition-colors ${
                            (job.applications_count ?? 0) > 0
                              ? dm ? "bg-blue-900/30 text-blue-400 hover:bg-blue-900/50" : "bg-blue-50 text-blue-700 hover:bg-blue-100"
                              : dm ? "text-gray-500" : "text-gray-400"
                          }`}>
                          <Users className="w-3.5 h-3.5" />
                          {job.applications_count ?? 0}
                          <span className="text-xs font-normal">applicants</span>
                        </button>
                      </td>
                      <td className="py-4 px-4">
                        <div className={`flex items-center gap-1 text-xs ${dm ? "text-gray-400" : "text-gray-600"}`}>
                          <Calendar className="w-3.5 h-3.5" />
                          {new Date(job.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                        </div>
                      </td>
                      <td className="py-4 pl-4 pr-6">
                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button onClick={() => onViewProposals(job)} title="View Applications"
                            className={`p-1.5 rounded-lg transition-colors ${dm ? "hover:bg-gray-700 text-gray-400 hover:text-white" : "hover:bg-slate-100 text-gray-500 hover:text-gray-900"}`}>
                            <Eye className="w-4 h-4" />
                          </button>
                          <button onClick={() => onEdit(job)} title="Edit"
                            className={`p-1.5 rounded-lg transition-colors ${dm ? "hover:bg-gray-700 text-gray-400 hover:text-white" : "hover:bg-slate-100 text-gray-500 hover:text-gray-900"}`}>
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button onClick={() => onDelete(job)} title="Delete"
                            className="p-1.5 rounded-lg transition-colors hover:bg-red-50 text-gray-400 hover:text-red-600">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Mobile cards */}
          <div className="md:hidden divide-y divide-slate-200 dark:divide-gray-700">
            {filtered.map((job) => {
              const st = statusConfig[job.status] ?? statusConfig.draft;
              return (
                <div key={job.id} className={`p-4 ${dm ? "hover:bg-gray-750" : "hover:bg-gray-50"}`}>
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <button onClick={() => onViewDetails(job)}
                      className={`text-sm font-semibold text-left hover:text-[#0084ca] transition-colors flex-1 ${dm ? "text-white" : "text-gray-900"}`}>
                      {job.title}
                    </button>
                    <span className={`flex-shrink-0 inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold ${st.cls}`}>
                      <span className={`w-1.5 h-1.5 rounded-full mr-1 ${st.dot}`} />{st.label}
                    </span>
                  </div>

                  <p className={`text-xs mb-3 ${dm ? "text-gray-400" : "text-gray-500"}`}>
                    {job.category_name || "Uncategorized"} · {job.experience_level}
                  </p>

                  <div className={`flex flex-wrap gap-x-4 gap-y-1 text-xs mb-3 ${dm ? "text-gray-400" : "text-gray-500"}`}>
                    <span className="flex items-center gap-1">
                      <DollarSign className="w-3 h-3" />{job.salary || "—"} {job.budget_type === "hourly" ? "/hr" : "fixed"}
                    </span>
                    <span className="flex items-center gap-1">
                      <Users className="w-3 h-3" />{job.applications_count ?? 0} applicants
                    </span>
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      {new Date(job.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                    </span>
                  </div>

                  <div className="flex gap-2">
                    <button onClick={() => onViewProposals(job)}
                      className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                        dm ? "bg-blue-900/30 text-blue-400 hover:bg-blue-900/50" : "bg-blue-50 text-blue-700 hover:bg-blue-100"
                      }`}>
                      <Eye className="w-3.5 h-3.5" /> Applications
                    </button>
                    <button onClick={() => onEdit(job)}
                      className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                        dm ? "bg-gray-700 text-gray-300 hover:bg-gray-600" : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                      }`}>
                      <Edit2 className="w-3.5 h-3.5" /> Edit
                    </button>
                    <button onClick={() => onDelete(job)}
                      className="px-3 py-1.5 rounded-lg text-xs font-medium bg-red-50 text-red-600 hover:bg-red-100 transition-colors">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          <div className={`px-4 sm:px-6 py-3 border-t text-xs ${dm ? "border-gray-700 text-gray-500" : "border-slate-200 text-gray-500"}`}>
            Showing {filtered.length} of {jobs.length} jobs
          </div>
        </>
      )}
    </div>
  );
};
