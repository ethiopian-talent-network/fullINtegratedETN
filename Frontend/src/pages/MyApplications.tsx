import { useState, useEffect } from "react";
import { useDarkMode } from "../contexts/DarkModeContext";
import { Header } from "../features/talents/components/Header";
import {
  Clock, DollarSign, CheckCircle, XCircle, Hourglass,
  Calendar, MapPin, Briefcase, Search, FileText, ChevronLeft, ChevronRight,
} from "lucide-react";
import { getUserApplications } from "../api/jobs/jobApi";
import { getTalentProfile } from "../api/talent/talentApi";

type ApplicationStatus = "pending" | "reviewed" | "shortlisted" | "accepted" | "hired" | "rejected" | "withdrawn";

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string; icon: any }> = {
  pending:     { label: "Pending",     color: "text-yellow-700 dark:text-yellow-300",   bg: "bg-yellow-100 dark:bg-yellow-900/30",   icon: Hourglass },
  reviewed:    { label: "Reviewed",    color: "text-blue-700 dark:text-blue-300",       bg: "bg-blue-100 dark:bg-blue-900/30",       icon: Clock },
  shortlisted: { label: "Shortlisted", color: "text-violet-700 dark:text-violet-300",   bg: "bg-violet-100 dark:bg-violet-900/30",   icon: Clock },
  accepted:    { label: "Accepted",    color: "text-green-700 dark:text-green-300",     bg: "bg-green-100 dark:bg-green-900/30",     icon: CheckCircle },
  hired:       { label: "Hired",       color: "text-emerald-700 dark:text-emerald-300", bg: "bg-emerald-100 dark:bg-emerald-900/30", icon: CheckCircle },
  rejected:    { label: "Rejected",    color: "text-red-700 dark:text-red-300",         bg: "bg-red-100 dark:bg-red-900/30",         icon: XCircle },
  withdrawn:   { label: "Withdrawn",   color: "text-gray-600 dark:text-gray-400",       bg: "bg-gray-100 dark:bg-gray-700",          icon: XCircle },
};

interface Application {
  id: number;
  job_id: number;
  cover_letter: string;
  status: ApplicationStatus;
  applied_at: string;
  updated_at: string;
  tokens_used: number;
  proposal: string;
  job_title: string;
  job_salary: string;
  job_salary_type: string;
  company_name: string;
  company_location: string;
}


export default function MyApplications() {
  const { darkMode, toggleDarkMode } = useDarkMode();
  const [userImage, setUserImage] = useState<string | undefined>();
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<ApplicationStatus | "all">("all");
  const [search, setSearch] = useState("");
  const [expanded, setExpanded] = useState<number | null>(null);
  const [pagination, setPagination] = useState({ current: 1, pageSize: 10, total: 0, pages: 0 });

  useEffect(() => {
    getTalentProfile()
      .then((p) => { if (p.data.profile_image) setUserImage(p.data.profile_image); })
      .catch(() => {});
    fetchApplications();
  }, [pagination.current]);

  const fetchApplications = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await getUserApplications({ page: pagination.current, limit: pagination.pageSize });
      setApplications(res.applications);
      setPagination(res.pagination);
    } catch (err: any) {
      setError(err.message || "Failed to fetch applications");
    } finally {
      setLoading(false);
    }
  };

  const filtered = applications.filter((app) => {
    const matchFilter = filter === "all" || app.status === filter;
    const matchSearch = !search ||
      app.job_title.toLowerCase().includes(search.toLowerCase()) ||
      app.company_name.toLowerCase().includes(search.toLowerCase());
    return matchFilter && matchSearch;
  });

  const count = (s: ApplicationStatus) => applications.filter((a) => a.status === s).length;

  const formatDate = (d: string) =>
    new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });

  const dm = darkMode;
  const bg = dm ? "bg-gray-900" : "bg-gray-50";
  const card = dm ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200";
  const text = dm ? "text-white" : "text-gray-900";
  const muted = dm ? "text-gray-400" : "text-gray-500";
  const inputCls = dm
    ? "bg-gray-700 border-gray-600 text-white placeholder-gray-500 focus:border-[#0084ca]"
    : "bg-white border-gray-300 text-gray-900 placeholder-gray-400 focus:border-[#0084ca]";

  const STATS = [
    { label: "Total", value: pagination.total, color: "text-[#0084ca]" },
    { label: "Pending", value: count("pending"), color: "text-yellow-600" },
    { label: "Accepted", value: count("accepted"), color: "text-green-600" },
    { label: "Rejected", value: count("rejected"), color: "text-red-500" },
  ];

  const FILTERS: { key: ApplicationStatus | "all"; label: string }[] = [
    { key: "all", label: "All" },
    { key: "pending", label: "Pending" },
    { key: "reviewed", label: "Reviewed" },
    { key: "shortlisted", label: "Shortlisted" },
    { key: "hired", label: "Hired" },
    { key: "accepted", label: "Accepted" },
    { key: "rejected", label: "Rejected" },
  ];

  if (loading) {
    return (
      <div className={`min-h-screen ${bg}`}>
        <Header darkMode={dm} toggleDarkMode={toggleDarkMode} userImage={userImage} onImageUpload={() => {}} />
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[#0084ca]" />
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen ${bg} transition-colors duration-300`}>
      <Header darkMode={dm} toggleDarkMode={toggleDarkMode} userImage={userImage} onImageUpload={() => {}} />

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">

        {/* Page title */}
        <div className="mb-6">
          <h1 className={`text-2xl sm:text-3xl font-bold ${text}`}>My Applications</h1>
          <p className={`text-sm mt-1 ${muted}`}>Track and manage all your job applications</p>
        </div>

        {/* Error */}
        {error && (
          <div className="mb-5 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700 rounded-xl text-sm text-red-700 dark:text-red-300">
            {error}
          </div>
        )}

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
          {STATS.map(({ label, value, color }) => (
            <div key={label} className={`${card} border rounded-xl p-4`}>
              <div className={`text-2xl font-bold ${color}`}>{value}</div>
              <div className={`text-xs mt-0.5 ${muted}`}>{label}</div>
            </div>
          ))}
        </div>

        {/* Search + Filters */}
        <div className={`${card} border rounded-xl p-4 mb-5`}>
          {/* Search */}
          <div className="relative mb-3">
            <Search className={`absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 ${muted}`} />
            <input
              type="text"
              placeholder="Search by job title or company..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className={`w-full pl-9 pr-4 py-2.5 rounded-lg border text-sm ${inputCls} focus:outline-none focus:ring-2 focus:ring-[#0084ca]/30 transition-colors`}
            />
          </div>

          {/* Filter pills — scrollable on mobile */}
          <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
            {FILTERS.map(({ key, label }) => (
              <button
                key={key}
                onClick={() => setFilter(key)}
                className={`flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                  filter === key
                    ? "bg-[#0084ca] text-white"
                    : dm
                    ? "bg-gray-700 text-gray-300 hover:bg-gray-600"
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                }`}
              >
                {label}
                {key !== "all" && (
                  <span className={`ml-1.5 ${filter === key ? "text-white/70" : muted}`}>
                    {count(key as ApplicationStatus)}
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Applications list */}
        {filtered.length === 0 ? (
          <div className={`${card} border rounded-xl text-center py-16 px-4`}>
            <Briefcase className={`w-12 h-12 mx-auto mb-3 opacity-30 ${muted}`} />
            <h3 className={`text-lg font-semibold mb-1 ${text}`}>No applications found</h3>
            <p className={`text-sm ${muted}`}>
              {search || filter !== "all" ? "Try adjusting your search or filter" : "Start applying to jobs to see them here"}
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map((app) => {
              const cfg = STATUS_CONFIG[app.status] ?? { label: app.status, color: "text-gray-600", bg: "bg-gray-100", icon: Clock };
              const Icon = cfg.icon;
              const isExpanded = expanded === app.id;

              return (
                <div
                  key={app.id}
                  className={`${card} border rounded-xl overflow-hidden transition-shadow hover:shadow-md`}
                >
                  {/* Main row */}
                  <div className="p-4 sm:p-5">
                    <div className="flex items-start gap-3">
                      {/* Status icon */}
                      <div className={`p-2 rounded-lg flex-shrink-0 ${cfg.bg}`}>
                        <Icon className={`w-4 h-4 ${cfg.color}`} />
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2 flex-wrap">
                          <h3 className={`font-semibold text-sm sm:text-base leading-tight ${text}`}>
                            {app.job_title}
                          </h3>
                          <span className={`flex-shrink-0 px-2.5 py-0.5 rounded-full text-xs font-semibold capitalize ${cfg.bg} ${cfg.color}`}>
                            {cfg.label}
                          </span>
                        </div>

                        <p className={`text-sm mt-0.5 ${muted}`}>{app.company_name}</p>

                        {/* Meta chips */}
                        <div className={`flex flex-wrap gap-x-4 gap-y-1 mt-2 text-xs ${muted}`}>
                          {app.company_location && (
                            <span className="flex items-center gap-1">
                              <MapPin className="w-3 h-3" /> {app.company_location}
                            </span>
                          )}
                          {app.job_salary && (
                            <span className="flex items-center gap-1">
                              <DollarSign className="w-3 h-3" /> {app.job_salary}
                            </span>
                          )}
                          <span className="flex items-center gap-1">
                            <Calendar className="w-3 h-3" /> {formatDate(app.applied_at)}
                          </span>
                          <span className="flex items-center gap-1">
                            <DollarSign className="w-3 h-3" /> {app.tokens_used} tokens
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Expand toggle */}
                    {(app.cover_letter || app.proposal) && (
                      <button
                        onClick={() => setExpanded(isExpanded ? null : app.id)}
                        className={`mt-3 flex items-center gap-1 text-xs font-medium transition-colors ${
                          dm ? "text-gray-400 hover:text-gray-200" : "text-gray-500 hover:text-gray-700"
                        }`}
                      >
                        <FileText className="w-3.5 h-3.5" />
                        {isExpanded ? "Hide details" : "View cover letter & proposal"}
                      </button>
                    )}
                  </div>

                  {/* Expanded details */}
                  {isExpanded && (
                    <div className={`px-4 sm:px-5 pb-4 sm:pb-5 pt-0 border-t ${dm ? "border-gray-700" : "border-gray-100"}`}>
                      <div className="pt-4 space-y-3">
                        {app.cover_letter && (
                          <div>
                            <p className={`text-xs font-semibold uppercase tracking-wide mb-1.5 ${muted}`}>Cover Letter</p>
                            <p className={`text-sm leading-relaxed ${dm ? "text-gray-300" : "text-gray-700"}`}>
                              {app.cover_letter}
                            </p>
                          </div>
                        )}
                        {app.proposal && (
                          <div>
                            <p className={`text-xs font-semibold uppercase tracking-wide mb-1.5 ${muted}`}>Proposal</p>
                            <p className={`text-sm leading-relaxed ${dm ? "text-gray-300" : "text-gray-700"}`}>
                              {app.proposal}
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* Pagination */}
        {pagination.pages > 1 && (
          <div className="flex items-center justify-center gap-3 mt-8">
            <button
              onClick={() => setPagination((p) => ({ ...p, current: p.current - 1 }))}
              disabled={pagination.current === 1}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-40 ${
                dm ? "bg-gray-700 text-gray-300 hover:bg-gray-600" : "bg-white border border-gray-300 text-gray-700 hover:bg-gray-50"
              }`}
            >
              <ChevronLeft className="w-4 h-4" /> Previous
            </button>
            <span className={`text-sm ${muted}`}>
              Page {pagination.current} of {pagination.pages}
            </span>
            <button
              onClick={() => setPagination((p) => ({ ...p, current: p.current + 1 }))}
              disabled={pagination.current === pagination.pages}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-40 ${
                dm ? "bg-gray-700 text-gray-300 hover:bg-gray-600" : "bg-white border border-gray-300 text-gray-700 hover:bg-gray-50"
              }`}
            >
              Next <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
