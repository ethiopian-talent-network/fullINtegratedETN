import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router";
import { useDarkMode } from "../../contexts/DarkModeContext";
import {
  getAdminDashboard, getAdminUsers,
  createOwner, toggleUser, deleteUser,
  getVerificationRequests, reviewVerification, getTalentProfileForAdmin,
  getAllPayments,
} from "../../api/admin/adminApi";
import { API_BASE_URL } from "../../config/api";
import {
  Users, Briefcase, DollarSign, ShieldCheck, Search,
  RefreshCw, Loader2, AlertCircle, CheckCircle, XCircle,
  ToggleLeft, ToggleRight, Trash2, Sun, Moon, TrendingUp,
  Building2, Crown, FileText, ChevronLeft, ChevronRight,
  Eye, ThumbsUp, ThumbsDown, ExternalLink, Award, FolderOpen,
  Receipt, Printer, CreditCard,
} from "lucide-react";

function useInternalAuth() {
  const token = localStorage.getItem("internal_token") || "";
  const user = JSON.parse(localStorage.getItem("internal_user") || "null");
  return { token, user };
}

type ModalType = "owner" | null;

const ROLE_BADGE: Record<string, string> = {
  talent:   "bg-blue-50 text-blue-700 border-blue-200",
  employer: "bg-violet-50 text-violet-700 border-violet-200",
  admin:    "bg-amber-50 text-amber-700 border-amber-200",
  owner:    "bg-emerald-50 text-emerald-700 border-emerald-200",
};

export default function AdminDashboard() {
  const { darkMode, toggleDarkMode } = useDarkMode();
  const navigate = useNavigate();
  const { token, user } = useInternalAuth();
  const dm = darkMode;

  const [tab, setTab] = useState<"overview" | "users" | "verification" | "licenses" | "payments" | "billing">("overview");
  const [stats, setStats] = useState<any>(null);
  const [users, setUsers] = useState<any[]>([]);
  const [verificationRequests, setVerificationRequests] = useState<any[]>([]);
  const [verifLoading, setVerifLoading] = useState(false);
  const [actionVerifId, setActionVerifId] = useState<number | null>(null);
  const [adminNote, setAdminNote] = useState<Record<number, string>>({});
  const [profileModal, setProfileModal] = useState<any>(null);
  const [profileLoading, setProfileLoading] = useState(false);
  const [licenseRequests, setLicenseRequests] = useState<any[]>([]);
  const [licenseLoading, setLicenseLoading] = useState(false);
  const [actionLicenseId, setActionLicenseId] = useState<number | null>(null);
  const [licenseNote, setLicenseNote] = useState<Record<number, string>>({});
  const [payments, setPayments] = useState<any[]>([]);
  const [paymentsLoading, setPaymentsLoading] = useState(false);
  const [paymentsPagination, setPaymentsPagination] = useState({ page: 1, pages: 1, total: 0 });
  const [paymentStatusFilter, setPaymentStatusFilter] = useState("all");
  const [receiptModal, setReceiptModal] = useState<any>(null);
  const [billingList, setBillingList] = useState<any[]>([]);
  const [billingLoading, setBillingLoading] = useState(false);
  const [pagination, setPagination] = useState({ page: 1, pages: 1, total: 0 });
  const [roleFilter, setRoleFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [actionId, setActionId] = useState<number | null>(null);
  const [modal, setModal] = useState<ModalType>(null);
  const [form, setForm] = useState<Record<string, string>>({});
  const [formLoading, setFormLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Redirect if not admin or owner
  useEffect(() => {
    if (!token || (user?.role !== "admin" && user?.role !== "owner")) navigate("/admin/login");
  }, [token, user]);

  const loadStats = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getAdminDashboard(token);
      setStats(res.stats);
    } catch (e: any) { setError(e.message); }
    finally { setLoading(false); }
  }, [token]);

  const loadUsers = useCallback(async (page = 1) => {
    try {
      const res = await getAdminUsers(token, {
        page, limit: 15,
        ...(roleFilter !== "all" ? { role: roleFilter } : {}),
        ...(search ? { search } : {}),
      });
      setUsers(res.users || []);
      setPagination(res.pagination || { page: 1, pages: 1, total: 0 });
    } catch (e: any) { setError(e.message); }
  }, [token, roleFilter, search]);

  useEffect(() => { loadStats(); }, [loadStats]);
  useEffect(() => { if (tab === "users") loadUsers(1); }, [tab, loadUsers]);
  const loadVerifications = useCallback(async () => {
    setVerifLoading(true);
    try {
      const d = await getVerificationRequests(token);
      setVerificationRequests(d.requests || []);
    } catch {}
    finally { setVerifLoading(false); }
  }, [token]);

  const loadLicenses = useCallback(async () => {
    setLicenseLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/admin/license-requests?status=pending`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const d = await res.json();
      setLicenseRequests(d.requests || []);
    } catch {}
    finally { setLicenseLoading(false); }
  }, [token]);

  const loadPayments = useCallback(async (page = 1) => {
    setPaymentsLoading(true);
    try {
      const res = await getAllPayments(token, {
        page,
        limit: 15,
        ...(paymentStatusFilter !== "all" ? { status: paymentStatusFilter } : {}),
      });
      setPayments(res.payments || []);
      setPaymentsPagination(res.pagination || { page: 1, pages: 1, total: 0 });
    } catch (e: any) { setError(e.message); }
    finally { setPaymentsLoading(false); }
  }, [token, paymentStatusFilter]);

  const loadBilling = useCallback(async () => {
    setBillingLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/billing/all`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const d = await res.json();
      setBillingList(d.billing || []);
    } catch {}
    finally { setBillingLoading(false); }
  }, [token]);

  useEffect(() => {
    if (tab === "verification") loadVerifications();
    if (tab === "licenses") loadLicenses();
    if (tab === "payments") loadPayments(1);
    if (tab === "billing") loadBilling();
  }, [tab, loadVerifications, loadLicenses, loadPayments, loadBilling]);

  const handleToggle = async (id: number) => {
    setActionId(id);
    const res = await toggleUser(token, id);
    setActionId(null);
    if (res.message) { setSuccess(res.message); loadUsers(pagination.page); }
    else setError(res.message);
  };

  const handleDelete = async (id: number, name: string) => {
    if (!window.confirm(`Delete user "${name}"? This cannot be undone.`)) return;
    setActionId(id);
    const res = await deleteUser(token, id);
    setActionId(null);
    if (res.message) { setSuccess(res.message); loadUsers(pagination.page); loadStats(); }
    else setError(res.message);
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormLoading(true);
    setError(null);
    try {
      const res = await createOwner(token, form);
      if (res.message && !res.message.toLowerCase().includes("error")) {
        setSuccess(res.message);
        setModal(null);
        setForm({});
        loadStats();
        if (tab === "users") loadUsers(1);
      } else {
        setError(res.message);
      }
    } catch (e: any) { setError(e.message); }
    finally { setFormLoading(false); }
  };

  const handleVerification = async (id: number, action: "approve" | "reject") => {
    setActionVerifId(id);
    try {
      const data = await reviewVerification(token, id, action, adminNote[id] || "");
      if (data.message?.toLowerCase().includes("error")) throw new Error(data.message);
      setSuccess(data.message);
      setVerificationRequests(prev => prev.filter(r => r.id !== id));
      setProfileModal(null);
      loadStats();
    } catch (e: any) { setError(e.message); }
    finally { setActionVerifId(null); }
  };

  const handleLicense = async (id: number, action: "approve" | "reject") => {
    setActionLicenseId(id);
    try {
      const res = await fetch(`${API_BASE_URL}/api/admin/license-requests/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ action, admin_note: licenseNote[id] || "" }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      setSuccess(data.message);
      setLicenseRequests(prev => prev.filter(r => r.id !== id));
      loadStats();
    } catch (e: any) { setError(e.message); }
    finally { setActionLicenseId(null); }
  };

  const openProfile = async (req: any) => {
    setProfileLoading(true);
    setProfileModal({ request: req, data: null });
    try {
      const d = await getTalentProfileForAdmin(token, req.user_id);
      setProfileModal({ request: req, data: d });
    } catch { setProfileModal(null); setError("Failed to load talent profile"); }
    finally { setProfileLoading(false); }
  };

  const logout = () => {
    localStorage.removeItem("internal_token");
    localStorage.removeItem("internal_user");
    navigate("/admin/login");
  };

  const bg = dm ? "bg-gray-950" : "bg-slate-100";
  const card = dm ? "bg-gray-900 border-gray-800" : "bg-white border-slate-200";
  const text = dm ? "text-white" : "text-gray-900";
  const muted = dm ? "text-gray-400" : "text-gray-500";
  const inputCls = dm ? "bg-gray-800 border-gray-700 text-white placeholder-gray-500" : "bg-white border-slate-300 text-gray-900 placeholder-gray-400";
  const thCls = `px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider ${dm ? "text-gray-400" : "text-gray-500"}`;
  const tdCls = `px-4 py-3.5 text-sm ${dm ? "text-gray-300" : "text-gray-700"}`;

  const STAT_CARDS = stats ? [
    { label: "Total Talents",    value: stats.total_talents,      icon: Users,      color: "text-blue-600",    bg: dm ? "bg-blue-900/20" : "bg-blue-50" },
    { label: "Total Employers",  value: stats.total_employers,    icon: Building2,  color: "text-violet-600",  bg: dm ? "bg-violet-900/20" : "bg-violet-50" },
    { label: "Platform Owners",  value: stats.total_owners,       icon: Crown,      color: "text-amber-600",   bg: dm ? "bg-amber-900/20" : "bg-amber-50" },
    { label: "Active Jobs",      value: stats.active_jobs,        icon: Briefcase,  color: "text-[#0084ca]",   bg: dm ? "bg-[#0084ca]/10" : "bg-[#0084ca]/5" },
    { label: "Applications",     value: stats.total_applications, icon: FileText,   color: "text-emerald-600", bg: dm ? "bg-emerald-900/20" : "bg-emerald-50" },
    { label: "Total Revenue",    value: `${Number(stats.total_revenue).toLocaleString()} ETB`, icon: TrendingUp, color: "text-emerald-600", bg: dm ? "bg-emerald-900/20" : "bg-emerald-50" },
    { label: "Paid Transactions",value: stats.total_payments,     icon: DollarSign, color: "text-emerald-600", bg: dm ? "bg-emerald-900/20" : "bg-emerald-50" },
    { label: "Pending Payments", value: stats.pending_payments,   icon: AlertCircle,color: "text-amber-600",   bg: dm ? "bg-amber-900/20" : "bg-amber-50" },
  ] : [];

  return (
    <div className={`min-h-screen ${bg} transition-colors duration-300`}>
      {/* Header */}
      <header className={`sticky top-0 z-40 border-b ${dm ? "bg-gray-900 border-gray-800" : "bg-white border-slate-200"} shadow-sm`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center">
              <ShieldCheck className="w-4 h-4 text-white" />
            </div>
            <div>
              <span className={`text-base font-bold ${text}`}>ETN Admin</span>
              <span className={`ml-2 text-xs px-2 py-0.5 rounded-full ${dm ? "bg-amber-900/40 text-amber-300" : "bg-amber-100 text-amber-700"}`}>
                {user?.name || "Admin"}
              </span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => navigate("/admin/talents")}
              className={`hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${dm ? "bg-gray-800 text-gray-300 hover:bg-gray-700" : "bg-slate-100 text-gray-600 hover:bg-slate-200"}`}
            >
              <Users className="w-3.5 h-3.5" /> Talents
            </button>
            <button
              onClick={() => navigate("/owner")}
              className={`hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${dm ? "bg-gray-800 text-gray-300 hover:bg-gray-700" : "bg-slate-100 text-gray-600 hover:bg-slate-200"}`}
            >
              <Crown className="w-3.5 h-3.5" /> Owner Panel
            </button>
            <button onClick={toggleDarkMode} className={`p-2 rounded-lg transition-colors ${dm ? "hover:bg-gray-800 text-gray-400" : "hover:bg-slate-100 text-gray-500"}`}>
              {dm ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>
            <button onClick={logout} className="px-3 py-1.5 text-xs font-medium text-red-600 hover:bg-red-50 rounded-lg transition-colors">
              Logout
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Alerts */}
        {error && (
          <div className="mb-5 flex items-center gap-3 p-4 rounded-xl bg-red-50 border border-red-200 text-red-700">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <p className="text-sm flex-1">{error}</p>
            <button onClick={() => setError(null)}><XCircle className="w-4 h-4" /></button>
          </div>
        )}
        {success && (
          <div className="mb-5 flex items-center gap-3 p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700">
            <CheckCircle className="w-4 h-4 flex-shrink-0" />
            <p className="text-sm flex-1">{success}</p>
            <button onClick={() => setSuccess(null)}><XCircle className="w-4 h-4" /></button>
          </div>
        )}

        {/* Tabs + actions */}
        <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
          <div className={`flex items-center gap-1 p-1 rounded-xl ${dm ? "bg-gray-800" : "bg-slate-200"}`}>
            {(["overview", "users", "verification", "licenses", "payments", "billing"] as const).map((t) => {
              let label: React.ReactNode = t;
              if (t === "verification") {
                label = (
                  <span className="flex items-center gap-1.5">
                    Verification
                    {verificationRequests.length > 0 && tab !== "verification" && (
                      <span className="w-4 h-4 rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center">
                        {verificationRequests.length}
                      </span>
                    )}
                  </span>
                );
              } else if (t === "licenses") {
                label = (
                  <span className="flex items-center gap-1.5">
                    Licenses
                    {licenseRequests.length > 0 && tab !== "licenses" && (
                      <span className="w-4 h-4 rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center">
                        {licenseRequests.length}
                      </span>
                    )}
                  </span>
                );
              } else if (t === "payments") {
                label = "Payments";
              } else if (t === "billing") {
                label = "Billing";
              }
              return (
                <button key={t} onClick={() => setTab(t)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium capitalize transition-all ${
                    tab === t ? "bg-white shadow-sm text-amber-600 dark:bg-gray-700" : dm ? "text-gray-400 hover:text-gray-200" : "text-gray-600 hover:text-gray-900"
                  }`}
                >
                  {label}
                </button>
              );
            })}
          </div>

          <button
            onClick={() => { setModal("owner"); setForm({}); setError(null); }}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-sm font-semibold transition-colors shadow-sm"
          >
            <Crown className="w-4 h-4" /> Create Owner
          </button>
        </div>

        {/* ── OVERVIEW ── */}
        {tab === "overview" && (
          <>
            <div className="flex items-center justify-between mb-5">
              <h1 className={`text-xl font-bold ${text}`}>Platform Overview</h1>
              <button onClick={loadStats} className={`flex items-center gap-1.5 text-sm px-3 py-1.5 rounded-lg transition-colors ${dm ? "hover:bg-gray-800 text-gray-400" : "hover:bg-slate-200 text-gray-500"}`}>
                <RefreshCw className="w-4 h-4" /> Refresh
              </button>
            </div>
            {loading ? (
              <div className="flex items-center justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-amber-500" /></div>
            ) : (
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {STAT_CARDS.map(({ label, value, icon: Icon, color, bg: ibg }) => (
                  <div key={label} className={`rounded-xl border p-5 ${card}`}>
                    <div className="flex items-start justify-between">
                      <div>
                        <p className={`text-xs font-semibold uppercase tracking-wider mb-1 ${muted}`}>{label}</p>
                        <p className={`text-2xl font-bold ${text}`}>{value}</p>
                      </div>
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${ibg}`}>
                        <Icon className={`w-5 h-5 ${color}`} />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}

        {/* ── USERS ── */}
        {tab === "users" && (
          <>
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-5">
              <h1 className={`text-xl font-bold ${text}`}>User Management</h1>
              <div className="flex gap-2 flex-wrap">
                <div className={`flex items-center gap-2 px-3 py-2 rounded-lg border text-sm ${dm ? "bg-gray-800 border-gray-700" : "bg-white border-slate-300"}`}>
                  <Search className={`w-4 h-4 ${muted}`} />
                  <input
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && loadUsers(1)}
                    placeholder="Search..."
                    className={`bg-transparent outline-none w-32 text-sm ${dm ? "text-white placeholder-gray-500" : "text-gray-900 placeholder-gray-400"}`}
                  />
                </div>
                <select value={roleFilter} onChange={(e) => setRoleFilter(e.target.value)}
                  className={`px-3 py-2 rounded-lg border text-sm outline-none ${inputCls}`}>
                  <option value="all">All Roles</option>
                  <option value="talent">Talent</option>
                  <option value="employer">Employer</option>
                  <option value="owner">Owner</option>
                  <option value="admin">Admin</option>
                </select>
                <button onClick={() => loadUsers(1)} className="px-3 py-2 rounded-lg bg-amber-500 text-white text-sm hover:bg-amber-600 transition-colors">
                  <RefreshCw className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div className={`rounded-xl border overflow-hidden ${card}`}>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className={`border-b ${dm ? "border-gray-800 bg-gray-900/60" : "border-slate-200 bg-slate-50"}`}>
                      <th className={thCls}>Name</th>
                      <th className={thCls}>Email</th>
                      <th className={thCls}>Role</th>
                      <th className={thCls}>Status</th>
                      <th className={thCls}>Joined</th>
                      <th className={thCls}>Actions</th>
                    </tr>
                  </thead>
                  <tbody className={`divide-y ${dm ? "divide-gray-800" : "divide-slate-100"}`}>
                    {users.length === 0 ? (
                      <tr><td colSpan={6} className={`text-center py-12 text-sm ${muted}`}>No users found</td></tr>
                    ) : users.map((u) => (
                      <tr key={u.id} className={`transition-colors ${dm ? "hover:bg-gray-800/50" : "hover:bg-slate-50"}`}>
                        <td className={tdCls}><p className="font-medium">{u.name}</p></td>
                        <td className={`${tdCls} ${muted}`}>{u.email}</td>
                        <td className={tdCls}>
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border capitalize ${ROLE_BADGE[u.role] ?? "bg-gray-100 text-gray-600 border-gray-200"}`}>
                            {u.role}
                          </span>
                        </td>
                        <td className={tdCls}>
                          <span className={`inline-flex items-center gap-1 text-xs font-medium ${u.is_verified ? "text-emerald-600" : "text-red-500"}`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${u.is_verified ? "bg-emerald-500" : "bg-red-400"}`} />
                            {u.is_verified ? "Active" : "Inactive"}
                          </span>
                        </td>
                        <td className={`${tdCls} whitespace-nowrap`}>
                          {new Date(u.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                        </td>
                        <td className={tdCls}>
                          {!["admin", "owner"].includes(u.role) && (
                            <div className="flex items-center gap-1.5">
                              <button
                                onClick={() => handleToggle(u.id)}
                                disabled={actionId === u.id}
                                title={u.is_verified ? "Deactivate" : "Activate"}
                                className={`p-1.5 rounded-lg transition-colors disabled:opacity-50 ${u.is_verified ? "text-amber-600 hover:bg-amber-50" : "text-emerald-600 hover:bg-emerald-50"}`}
                              >
                                {actionId === u.id ? <Loader2 className="w-4 h-4 animate-spin" /> : u.is_verified ? <ToggleRight className="w-4 h-4" /> : <ToggleLeft className="w-4 h-4" />}
                              </button>
                              <button
                                onClick={() => handleDelete(u.id, u.name)}
                                disabled={actionId === u.id}
                                className="p-1.5 rounded-lg text-red-500 hover:bg-red-50 transition-colors disabled:opacity-50"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {pagination.pages > 1 && (
                <div className={`flex items-center justify-between px-4 py-3 border-t text-sm ${dm ? "border-gray-800 text-gray-400" : "border-slate-200 text-gray-500"}`}>
                  <span>{pagination.total} total users</span>
                  <div className="flex items-center gap-2">
                    <button onClick={() => loadUsers(pagination.page - 1)} disabled={pagination.page === 1}
                      className={`p-1.5 rounded-lg disabled:opacity-40 ${dm ? "hover:bg-gray-800" : "hover:bg-slate-100"}`}>
                      <ChevronLeft className="w-4 h-4" />
                    </button>
                    <span>Page {pagination.page} of {pagination.pages}</span>
                    <button onClick={() => loadUsers(pagination.page + 1)} disabled={pagination.page === pagination.pages}
                      className={`p-1.5 rounded-lg disabled:opacity-40 ${dm ? "hover:bg-gray-800" : "hover:bg-slate-100"}`}>
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}
            </div>
          </>
        )}
        {/* ── VERIFICATION ── */}
        {tab === "verification" && (
          <>
            <div className="flex items-center justify-between mb-5">
              <h1 className={`text-xl font-bold ${text}`}>Verification Requests</h1>
              <button onClick={loadVerifications} className={`flex items-center gap-1.5 text-sm px-3 py-1.5 rounded-lg transition-colors ${dm ? "hover:bg-gray-800 text-gray-400" : "hover:bg-slate-200 text-gray-500"}`}>
                <RefreshCw className="w-4 h-4" /> Refresh
              </button>
            </div>
            {verifLoading ? (
              <div className="flex items-center justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-amber-500" /></div>
            ) : verificationRequests.length === 0 ? (
              <div className={`rounded-xl border p-16 text-center ${card}`}>
                <CheckCircle className="w-10 h-10 text-emerald-400 mx-auto mb-3" />
                <p className={`font-medium ${text}`}>No pending requests</p>
                <p className={`text-sm mt-1 ${muted}`}>All verification requests have been reviewed.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {verificationRequests.map((req) => (
                  <div key={req.id} className={`rounded-xl border p-5 ${card}`}>
                    <div className="flex items-start gap-4">
                      {req.profile_image ? (
                        <img src={req.profile_image} alt={req.name} className="w-12 h-12 rounded-full object-cover flex-shrink-0" />
                      ) : (
                        <div className={`w-12 h-12 rounded-full flex items-center justify-center text-lg font-bold flex-shrink-0 ${dm ? "bg-gray-700 text-gray-300" : "bg-slate-200 text-gray-600"}`}>
                          {req.name?.[0]?.toUpperCase()}
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2 flex-wrap">
                          <div>
                            <p className={`font-semibold ${text}`}>{req.name}</p>
                            <p className={`text-sm ${muted}`}>{req.email}</p>
                          </div>
                          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${dm ? "bg-amber-900/30 text-amber-300" : "bg-amber-100 text-amber-700"}`}>
                            {new Date(req.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                          </span>
                        </div>
                        {req.message && (
                          <p className={`text-sm mt-2 italic ${muted}`}>"{req.message}"</p>
                        )}
                        <div className="mt-3 flex flex-wrap gap-2">
                          <button
                            onClick={() => openProfile(req)}
                            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${dm ? "bg-gray-700 text-gray-200 hover:bg-gray-600" : "bg-slate-100 text-gray-700 hover:bg-slate-200"}`}
                          >
                            <Eye className="w-3.5 h-3.5" /> View Profile
                          </button>
                          <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs flex-1 min-w-[160px] ${dm ? "bg-gray-800 border-gray-700" : "bg-white border-slate-300"}`}>
                            <input
                              value={adminNote[req.id] || ""}
                              onChange={(e) => setAdminNote(n => ({ ...n, [req.id]: e.target.value }))}
                              placeholder="Note (optional)"
                              className={`bg-transparent outline-none flex-1 ${dm ? "text-white placeholder-gray-500" : "text-gray-900 placeholder-gray-400"}`}
                            />
                          </div>
                          <button
                            onClick={() => handleVerification(req.id, "approve")}
                            disabled={actionVerifId === req.id}
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-semibold transition-colors disabled:opacity-50"
                          >
                            {actionVerifId === req.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <ThumbsUp className="w-3.5 h-3.5" />}
                            Approve
                          </button>
                          <button
                            onClick={() => handleVerification(req.id, "reject")}
                            disabled={actionVerifId === req.id}
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-500 hover:bg-red-600 text-white text-xs font-semibold transition-colors disabled:opacity-50"
                          >
                            <ThumbsDown className="w-3.5 h-3.5" /> Reject
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}

        {/* ── LICENSES ── */}
        {tab === "licenses" && (
          <>
            <div className="flex items-center justify-between mb-5">
              <h1 className={`text-xl font-bold ${text}`}>Employer License Requests</h1>
              <button onClick={loadLicenses} className={`flex items-center gap-1.5 text-sm px-3 py-1.5 rounded-lg transition-colors ${dm ? "hover:bg-gray-800 text-gray-400" : "hover:bg-slate-200 text-gray-500"}`}>
                <RefreshCw className="w-4 h-4" /> Refresh
              </button>
            </div>
            {licenseLoading ? (
              <div className="flex items-center justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-amber-500" /></div>
            ) : licenseRequests.length === 0 ? (
              <div className={`rounded-xl border p-16 text-center ${card}`}>
                <CheckCircle className="w-10 h-10 text-emerald-400 mx-auto mb-3" />
                <p className={`font-medium ${text}`}>No pending license requests</p>
              </div>
            ) : (
              <div className="space-y-4">
                {licenseRequests.map((req) => (
                  <div key={req.id} className={`rounded-xl border p-5 ${card}`}>
                    <div className="flex items-start gap-4">
                      <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 text-lg font-bold ${dm ? "bg-gray-700 text-gray-300" : "bg-slate-100 text-gray-600"}`}>
                        {(req.company_name || req.name || "E")[0].toUpperCase()}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2 flex-wrap">
                          <div>
                            <p className={`font-semibold ${text}`}>{req.company_name || req.name}</p>
                            <p className={`text-sm ${muted}`}>{req.email}</p>
                          </div>
                          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${dm ? "bg-amber-900/30 text-amber-300" : "bg-amber-100 text-amber-700"}`}>
                            {new Date(req.submitted_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                          </span>
                        </div>
                        <div className={`mt-2 text-sm ${muted} space-y-0.5`}>
                          <p><span className="font-medium">License:</span> {req.license_name}</p>
                          {req.license_number && <p><span className="font-medium">Number:</span> {req.license_number}</p>}
                          {req.issuing_authority && <p><span className="font-medium">Issued by:</span> {req.issuing_authority}</p>}
                        </div>
                        {req.license_image && (
                          <a href={req.license_image} target="_blank" rel="noreferrer" className="mt-3 block">
                            <img src={req.license_image} alt="License" className="w-full max-h-48 object-contain rounded-xl border cursor-pointer hover:opacity-90 transition-opacity" />
                            <p className={`text-xs mt-1 ${muted}`}>Click to open full size</p>
                          </a>
                        )}
                        <div className="mt-3 flex flex-wrap gap-2">
                          <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs flex-1 min-w-[160px] ${dm ? "bg-gray-800 border-gray-700" : "bg-white border-slate-300"}`}>
                            <input
                              value={licenseNote[req.id] || ""}
                              onChange={(e) => setLicenseNote(n => ({ ...n, [req.id]: e.target.value }))}
                              placeholder="Note (optional)"
                              className={`bg-transparent outline-none flex-1 ${dm ? "text-white placeholder-gray-500" : "text-gray-900 placeholder-gray-400"}`}
                            />
                          </div>
                          <button onClick={() => handleLicense(req.id, "approve")} disabled={actionLicenseId === req.id}
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-semibold transition-colors disabled:opacity-50">
                            {actionLicenseId === req.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <ThumbsUp className="w-3.5 h-3.5" />} Approve
                          </button>
                          <button onClick={() => handleLicense(req.id, "reject")} disabled={actionLicenseId === req.id}
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-500 hover:bg-red-600 text-white text-xs font-semibold transition-colors disabled:opacity-50">
                            <ThumbsDown className="w-3.5 h-3.5" /> Reject
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}

        {/* ── BILLING ── */}
        {tab === "billing" && (
          <>
            <div className="flex items-center justify-between mb-5">
              <h1 className={`text-xl font-bold ${text}`}>Talent Billing Information</h1>
              <button onClick={loadBilling} className={`flex items-center gap-1.5 text-sm px-3 py-1.5 rounded-lg transition-colors ${dm ? "hover:bg-gray-800 text-gray-400" : "hover:bg-slate-200 text-gray-500"}`}>
                <RefreshCw className="w-4 h-4" /> Refresh
              </button>
            </div>
            {billingLoading ? (
              <div className="flex items-center justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-amber-500" /></div>
            ) : billingList.length === 0 ? (
              <div className={`rounded-xl border p-16 text-center ${card}`}>
                <CreditCard className="w-10 h-10 text-gray-400 mx-auto mb-3" />
                <p className={`font-medium ${text}`}>No billing information</p>
                <p className={`text-sm mt-1 ${muted}`}>No talents have added billing information yet.</p>
              </div>
            ) : (
              <div className={`rounded-xl border overflow-hidden ${card}`}>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className={`border-b ${dm ? "border-gray-800 bg-gray-900/60" : "border-slate-200 bg-slate-50"}`}>
                        <th className={thCls}>Talent Name</th>
                        <th className={thCls}>Email</th>
                        <th className={thCls}>Phone</th>
                        <th className={thCls}>Payout Method</th>
                        <th className={thCls}>Account</th>
                        <th className={thCls}>Verified</th>
                      </tr>
                    </thead>
                    <tbody className={`divide-y ${dm ? "divide-gray-800" : "divide-slate-100"}`}>
                      {billingList.map((b) => (
                        <tr key={b.id} className={`transition-colors ${dm ? "hover:bg-gray-800/50" : "hover:bg-slate-50"}`}>
                          <td className={tdCls}>
                            <p className="font-medium">{b.user_name}</p>
                          </td>
                          <td className={`${tdCls} ${muted}`}>{b.user_email}</td>
                          <td className={tdCls}>{b.phone}</td>
                          <td className={tdCls}>
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border capitalize ${
                              b.payout_method === "telebirr" ? "bg-blue-50 text-blue-700 border-blue-200" :
                              b.payout_method === "cbe_birr" ? "bg-purple-50 text-purple-700 border-purple-200" :
                              "bg-emerald-50 text-emerald-700 border-emerald-200"
                            }`}>
                              {b.payout_method === "telebirr" ? "Telebirr" : b.payout_method === "cbe_birr" ? "CBE Birr" : "Bank"}
                            </span>
                          </td>
                          <td className={tdCls}>
                            <p className="font-mono text-xs">{b.payout_method === "bank" ? b.bank_name : b.account_number}</p>
                          </td>
                          <td className={tdCls}>
                            <span className={`inline-flex items-center gap-1 text-xs font-medium ${b.is_verified ? "text-emerald-600" : "text-amber-600"}`}>
                              <span className={`w-1.5 h-1.5 rounded-full ${b.is_verified ? "bg-emerald-500" : "bg-amber-500"}`} />
                              {b.is_verified ? "Verified" : "Pending"}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </>
        )}
        {/* ── PAYMENTS ── */}
        {tab === "payments" && (
          <>
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-5">
              <h1 className={`text-xl font-bold ${text}`}>Payment Receipts</h1>
              <div className="flex gap-2 flex-wrap">
                <select value={paymentStatusFilter} onChange={(e) => setPaymentStatusFilter(e.target.value)}
                  className={`px-3 py-2 rounded-lg border text-sm outline-none ${inputCls}`}>
                  <option value="all">All Status</option>
                  <option value="success">Success</option>
                  <option value="pending">Pending</option>
                  <option value="failed">Failed</option>
                </select>
                <button onClick={() => loadPayments(1)} className="px-3 py-2 rounded-lg bg-amber-500 text-white text-sm hover:bg-amber-600 transition-colors">
                  <RefreshCw className="w-4 h-4" />
                </button>
              </div>
            </div>

            {paymentsLoading ? (
              <div className="flex items-center justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-amber-500" /></div>
            ) : payments.length === 0 ? (
              <div className={`rounded-xl border p-16 text-center ${card}`}>
                <Receipt className="w-10 h-10 text-gray-400 mx-auto mb-3" />
                <p className={`font-medium ${text}`}>No payments found</p>
              </div>
            ) : (
              <>
                <div className={`rounded-xl border overflow-hidden ${card}`}>
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className={`border-b ${dm ? "border-gray-800 bg-gray-900/60" : "border-slate-200 bg-slate-50"}`}>
                          <th className={thCls}>Transaction ID</th>
                          <th className={thCls}>Employer</th>
                          <th className={thCls}>Job</th>
                          <th className={thCls}>Amount</th>
                          <th className={thCls}>Status</th>
                          <th className={thCls}>Date</th>
                          <th className={thCls}>Actions</th>
                        </tr>
                      </thead>
                      <tbody className={`divide-y ${dm ? "divide-gray-800" : "divide-slate-100"}`}>
                        {payments.map((p) => (
                          <tr key={p.id} className={`transition-colors ${dm ? "hover:bg-gray-800/50" : "hover:bg-slate-50"}`}>
                            <td className={tdCls}>
                              <p className="font-mono text-xs">{p.transaction_id}</p>
                            </td>
                            <td className={tdCls}>
                              <p className="font-medium">{p.company_name}</p>
                              <p className={`text-xs ${muted}`}>{p.employer_email}</p>
                            </td>
                            <td className={tdCls}>
                              <p className="font-medium">{p.job_title}</p>
                            </td>
                            <td className={tdCls}>
                              <p className="font-semibold">{p.amount.toLocaleString()} {p.currency}</p>
                            </td>
                            <td className={tdCls}>
                              <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                                p.status === "success" ? "bg-emerald-50 text-emerald-700 border border-emerald-200" :
                                p.status === "pending" ? "bg-amber-50 text-amber-700 border border-amber-200" :
                                "bg-red-50 text-red-700 border border-red-200"
                              }`}>
                                <span className={`w-1.5 h-1.5 rounded-full ${
                                  p.status === "success" ? "bg-emerald-500" :
                                  p.status === "pending" ? "bg-amber-500" : "bg-red-500"
                                }`} />
                                {p.status}
                              </span>
                            </td>
                            <td className={`${tdCls} whitespace-nowrap`}>
                              {new Date(p.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                            </td>
                            <td className={tdCls}>
                              <button
                                onClick={() => setReceiptModal(p)}
                                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${dm ? "bg-gray-700 text-gray-200 hover:bg-gray-600" : "bg-slate-100 text-gray-700 hover:bg-slate-200"}`}
                              >
                                <Receipt className="w-3.5 h-3.5" /> View Receipt
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {paymentsPagination.pages > 1 && (
                    <div className={`flex items-center justify-between px-4 py-3 border-t text-sm ${dm ? "border-gray-800 text-gray-400" : "border-slate-200 text-gray-500"}`}>
                      <span>{paymentsPagination.total} total payments</span>
                      <div className="flex items-center gap-2">
                        <button onClick={() => loadPayments(paymentsPagination.page - 1)} disabled={paymentsPagination.page === 1}
                          className={`p-1.5 rounded-lg disabled:opacity-40 ${dm ? "hover:bg-gray-800" : "hover:bg-slate-100"}`}>
                          <ChevronLeft className="w-4 h-4" />
                        </button>
                        <span>Page {paymentsPagination.page} of {paymentsPagination.pages}</span>
                        <button onClick={() => loadPayments(paymentsPagination.page + 1)} disabled={paymentsPagination.page === paymentsPagination.pages}
                          className={`p-1.5 rounded-lg disabled:opacity-40 ${dm ? "hover:bg-gray-800" : "hover:bg-slate-100"}`}>
                          <ChevronRight className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </>
            )}
          </>
        )}
      </div>
      {profileModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={() => setProfileModal(null)}>
          <div className={`w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl border shadow-2xl ${dm ? "bg-gray-900 border-gray-800" : "bg-white border-slate-200"}`} onClick={e => e.stopPropagation()}>
            <div className={`sticky top-0 px-6 py-4 border-b flex items-center justify-between ${dm ? "bg-gray-900 border-gray-800" : "bg-white border-slate-200"}`}>
              <h2 className={`font-semibold ${text}`}>Talent Profile Review</h2>
              <button onClick={() => setProfileModal(null)} className={`p-1.5 rounded-lg ${dm ? "hover:bg-gray-800 text-gray-400" : "hover:bg-slate-100 text-gray-500"}`}>
                <XCircle className="w-4 h-4" />
              </button>
            </div>
            {profileLoading || !profileModal.data ? (
              <div className="flex items-center justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-amber-500" /></div>
            ) : (() => {
              const { profile, portfolio, certificates } = profileModal.data;
              const req = profileModal.request;
              return (
                <div className="p-6 space-y-6">
                  {/* Basic info */}
                  <div className="flex items-center gap-4">
                    {profile.profile_image ? (
                      <img src={profile.profile_image} alt={profile.name} className="w-16 h-16 rounded-full object-cover" />
                    ) : (
                      <div className={`w-16 h-16 rounded-full flex items-center justify-center text-2xl font-bold ${dm ? "bg-gray-700 text-gray-300" : "bg-slate-200 text-gray-600"}`}>
                        {profile.name?.[0]?.toUpperCase()}
                      </div>
                    )}
                    <div>
                      <p className={`text-lg font-bold ${text}`}>{profile.name}</p>
                      <p className={`text-sm ${muted}`}>{profile.email}</p>
                      {profile.Location && <p className={`text-sm ${muted}`}>{profile.Location}</p>}
                      {profile.HourlyRate && <p className={`text-sm font-medium text-emerald-500`}>{profile.HourlyRate} ETB/hr</p>}
                    </div>
                  </div>

                  {/* About */}
                  {profile.about && (
                    <div>
                      <p className={`text-xs font-semibold uppercase tracking-wider mb-1.5 ${muted}`}>About</p>
                      <p className={`text-sm ${text}`}>{profile.about}</p>
                    </div>
                  )}

                  {/* Skills */}
                  {profile.skills?.length > 0 && (
                    <div>
                      <p className={`text-xs font-semibold uppercase tracking-wider mb-2 ${muted}`}>Skills</p>
                      <div className="flex flex-wrap gap-1.5">
                        {profile.skills.map((s: string) => (
                          <span key={s} className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${dm ? "bg-blue-900/30 text-blue-300" : "bg-blue-50 text-blue-700"}`}>{s}</span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Education & Experience */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {profile.education && (
                      <div>
                        <p className={`text-xs font-semibold uppercase tracking-wider mb-1 ${muted}`}>Education</p>
                        <p className={`text-sm ${text}`}>{profile.education}</p>
                      </div>
                    )}
                    {profile.experience && (
                      <div>
                        <p className={`text-xs font-semibold uppercase tracking-wider mb-1 ${muted}`}>Experience</p>
                        <p className={`text-sm ${text}`}>{profile.experience}</p>
                      </div>
                    )}
                  </div>

                  {/* Links */}
                  {(profile.linkedin || profile.github || profile.resume_url) && (
                    <div className="flex flex-wrap gap-3">
                      {profile.linkedin && <a href={profile.linkedin} target="_blank" rel="noreferrer" className="flex items-center gap-1 text-xs text-blue-500 hover:underline"><ExternalLink className="w-3 h-3" /> LinkedIn</a>}
                      {profile.github && <a href={profile.github} target="_blank" rel="noreferrer" className="flex items-center gap-1 text-xs text-blue-500 hover:underline"><ExternalLink className="w-3 h-3" /> GitHub</a>}
                      {profile.resume_url && <a href={profile.resume_url} target="_blank" rel="noreferrer" className="flex items-center gap-1 text-xs text-blue-500 hover:underline"><ExternalLink className="w-3 h-3" /> Resume</a>}
                    </div>
                  )}

                  {/* Portfolio */}
                  {portfolio?.length > 0 && (
                    <div>
                      <p className={`text-xs font-semibold uppercase tracking-wider mb-2 ${muted} flex items-center gap-1.5`}><FolderOpen className="w-3.5 h-3.5" /> Portfolio ({portfolio.length})</p>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {portfolio.map((p: any) => (
                          <div key={p.id} className={`rounded-lg border p-3 ${dm ? "border-gray-700 bg-gray-800/50" : "border-slate-200 bg-slate-50"}`}>
                            <p className={`text-sm font-medium ${text}`}>{p.title}</p>
                            {p.description && <p className={`text-xs mt-0.5 line-clamp-2 ${muted}`}>{p.description}</p>}
                            {p.technologies?.length > 0 && (
                              <div className="flex flex-wrap gap-1 mt-1.5">
                                {p.technologies.map((t: string) => (
                                  <span key={t} className={`text-[10px] px-1.5 py-0.5 rounded ${dm ? "bg-gray-700 text-gray-300" : "bg-slate-200 text-gray-600"}`}>{t}</span>
                                ))}
                              </div>
                            )}
                            {(p.project_url || p.github_url) && (
                              <div className="flex gap-2 mt-1.5">
                                {p.project_url && <a href={p.project_url} target="_blank" rel="noreferrer" className="text-[10px] text-blue-500 hover:underline flex items-center gap-0.5"><ExternalLink className="w-2.5 h-2.5" /> Live</a>}
                                {p.github_url && <a href={p.github_url} target="_blank" rel="noreferrer" className="text-[10px] text-blue-500 hover:underline flex items-center gap-0.5"><ExternalLink className="w-2.5 h-2.5" /> GitHub</a>}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Certificates */}
                  {certificates?.length > 0 && (
                    <div>
                      <p className={`text-xs font-semibold uppercase tracking-wider mb-2 ${muted} flex items-center gap-1.5`}><Award className="w-3.5 h-3.5" /> Certificates ({certificates.length})</p>
                      <div className="space-y-2">
                        {certificates.map((c: any, i: number) => (
                          <div key={i} className={`flex items-center justify-between rounded-lg border px-3 py-2 ${dm ? "border-gray-700 bg-gray-800/50" : "border-slate-200 bg-slate-50"}`}>
                            <div>
                              <p className={`text-sm font-medium ${text}`}>{c.title}</p>
                              {c.organization && <p className={`text-xs ${muted}`}>{c.organization}</p>}
                            </div>
                            {c.credential_url && <a href={c.credential_url} target="_blank" rel="noreferrer" className="text-xs text-blue-500 hover:underline flex items-center gap-0.5"><ExternalLink className="w-3 h-3" /></a>}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Talent's message */}
                  {req.message && (
                    <div className={`rounded-lg p-3 ${dm ? "bg-gray-800" : "bg-slate-50"}`}>
                      <p className={`text-xs font-semibold uppercase tracking-wider mb-1 ${muted}`}>Talent's Message</p>
                      <p className={`text-sm italic ${text}`}>"{req.message}"</p>
                    </div>
                  )}

                  {/* National ID */}
                  {req.national_id_image && (
                    <div>
                      <p className={`text-xs font-semibold uppercase tracking-wider mb-2 ${muted}`}>National ID</p>
                      <a href={req.national_id_image} target="_blank" rel="noreferrer">
                        <img src={req.national_id_image} alt="National ID" className="w-full max-h-56 object-contain rounded-xl border cursor-pointer hover:opacity-90 transition-opacity" />
                      </a>
                      <p className={`text-xs mt-1 ${muted}`}>Click to open full size</p>
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex flex-col gap-2 pt-2">
                    <input
                      value={adminNote[req.id] || ""}
                      onChange={(e) => setAdminNote(n => ({ ...n, [req.id]: e.target.value }))}
                      placeholder="Admin note (optional, sent to talent)"
                      className={`w-full px-4 py-2.5 rounded-xl border text-sm outline-none ${inputCls}`}
                    />
                    <div className="flex gap-3">
                      <button
                        onClick={() => handleVerification(req.id, "reject")}
                        disabled={actionVerifId === req.id}
                        className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-red-500 hover:bg-red-600 text-white text-sm font-semibold transition-colors disabled:opacity-50"
                      >
                        {actionVerifId === req.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <ThumbsDown className="w-4 h-4" />} Reject
                      </button>
                      <button
                        onClick={() => handleVerification(req.id, "approve")}
                        disabled={actionVerifId === req.id}
                        className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white text-sm font-semibold transition-colors disabled:opacity-50"
                      >
                        {actionVerifId === req.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <ThumbsUp className="w-4 h-4" />} Approve
                      </button>
                    </div>
                  </div>
                </div>
              );
            })()}
          </div>
        </div>
      )}
      {modal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className={`w-full max-w-md rounded-2xl border shadow-2xl ${dm ? "bg-gray-900 border-gray-800" : "bg-white border-slate-200"}`}>
            <div className={`px-6 py-4 border-b flex items-center justify-between ${dm ? "border-gray-800" : "border-slate-200"}`}>
              <div className="flex items-center gap-2">
                <Crown className="w-5 h-5 text-amber-500" />
                <h2 className={`font-semibold ${text}`}>Create Owner Account</h2>
              </div>
              <button onClick={() => { setModal(null); setError(null); }} className={`p-1.5 rounded-lg ${dm ? "hover:bg-gray-800 text-gray-400" : "hover:bg-slate-100 text-gray-500"}`}>
                <XCircle className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleFormSubmit} className="p-6 space-y-4">
              {error && (
                <div className="flex items-center gap-2 p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" /> {error}
                </div>
              )}

              {[
                { key: "name", label: "Full Name", type: "text", placeholder: "John Doe" },
                { key: "email", label: "Email Address", type: "email", placeholder: "john@company.com" },
                { key: "password", label: "Password", type: "password", placeholder: "Min 8 characters" },
              ].map(({ key, label, type, placeholder }) => (
                <div key={key}>
                  <label className={`block text-sm font-medium mb-1.5 ${dm ? "text-gray-300" : "text-gray-700"}`}>{label}</label>
                  <input
                    type={type}
                    value={form[key] || ""}
                    onChange={(e) => setForm((f) => ({ ...f, [key]: e.target.value }))}
                    required={key !== "location"}
                    placeholder={placeholder}
                    className={`w-full px-4 py-2.5 rounded-xl border text-sm outline-none focus:ring-2 focus:ring-[#0084ca]/20 transition-colors ${inputCls}`}
                  />
                </div>
              ))}

              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => { setModal(null); setError(null); }}
                  className={`flex-1 py-2.5 rounded-xl border text-sm font-medium transition-colors ${dm ? "border-gray-700 text-gray-300 hover:bg-gray-800" : "border-slate-300 text-gray-600 hover:bg-slate-50"}`}>
                  Cancel
                </button>
                <button type="submit" disabled={formLoading}
                  className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-sm font-semibold transition-colors disabled:opacity-50">
                  {formLoading ? <><Loader2 className="w-4 h-4 animate-spin" /> Creating...</> : "Create Owner"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Receipt Modal ── */}
      {receiptModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={() => setReceiptModal(null)}>
          <div className={`w-full max-w-2xl rounded-2xl border shadow-2xl ${dm ? "bg-gray-900 border-gray-800" : "bg-white border-slate-200"}`} onClick={e => e.stopPropagation()}>
            <div className={`px-6 py-4 border-b flex items-center justify-between ${dm ? "bg-gray-900 border-gray-800" : "bg-white border-slate-200"}`}>
              <div className="flex items-center gap-2">
                <Receipt className="w-5 h-5 text-emerald-500" />
                <h2 className={`font-semibold ${text}`}>Payment Receipt</h2>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => window.print()}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${dm ? "bg-gray-700 text-gray-200 hover:bg-gray-600" : "bg-slate-100 text-gray-700 hover:bg-slate-200"}`}
                >
                  <Printer className="w-4 h-4" /> Print
                </button>
                <button onClick={() => setReceiptModal(null)} className={`p-1.5 rounded-lg ${dm ? "hover:bg-gray-800 text-gray-400" : "hover:bg-slate-100 text-gray-500"}`}>
                  <XCircle className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div className="p-8 space-y-6">
              {/* Header */}
              <div className="text-center border-b pb-6">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center mx-auto mb-3">
                  <ShieldCheck className="w-6 h-6 text-white" />
                </div>
                <h3 className={`text-2xl font-bold ${text}`}>ETN Payment Receipt</h3>
                <p className={`text-sm mt-1 ${muted}`}>Ethiopian Talent Network</p>
              </div>

              {/* Receipt Details */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className={`text-xs font-semibold uppercase tracking-wider mb-1 ${muted}`}>Receipt Number</p>
                  <p className={`text-sm font-mono ${text}`}>RCP-{receiptModal.id.toString().padStart(6, '0')}</p>
                </div>
                <div>
                  <p className={`text-xs font-semibold uppercase tracking-wider mb-1 ${muted}`}>Transaction ID</p>
                  <p className={`text-sm font-mono ${text}`}>{receiptModal.transaction_id}</p>
                </div>
                <div>
                  <p className={`text-xs font-semibold uppercase tracking-wider mb-1 ${muted}`}>Payment Date</p>
                  <p className={`text-sm ${text}`}>{new Date(receiptModal.created_at).toLocaleString("en-US", { month: "long", day: "numeric", year: "numeric", hour: "2-digit", minute: "2-digit" })}</p>
                </div>
                <div>
                  <p className={`text-xs font-semibold uppercase tracking-wider mb-1 ${muted}`}>Payment Method</p>
                  <p className={`text-sm capitalize ${text}`}>{receiptModal.method}</p>
                </div>
              </div>

              {/* Parties */}
              <div className={`grid grid-cols-2 gap-4 p-4 rounded-xl ${dm ? "bg-gray-800" : "bg-slate-50"}`}>
                <div>
                  <p className={`text-xs font-semibold uppercase tracking-wider mb-2 ${muted}`}>From (Employer)</p>
                  <p className={`text-sm font-semibold ${text}`}>{receiptModal.company_name}</p>
                  <p className={`text-xs ${muted}`}>{receiptModal.employer_email}</p>
                </div>
                {receiptModal.talent_name && (
                  <div>
                    <p className={`text-xs font-semibold uppercase tracking-wider mb-2 ${muted}`}>To (Talent)</p>
                    <p className={`text-sm font-semibold ${text}`}>{receiptModal.talent_name}</p>
                    <p className={`text-xs ${muted}`}>{receiptModal.talent_email}</p>
                  </div>
                )}
              </div>

              {/* Job Details */}
              <div>
                <p className={`text-xs font-semibold uppercase tracking-wider mb-2 ${muted}`}>Job Title</p>
                <p className={`text-sm ${text}`}>{receiptModal.job_title}</p>
              </div>

              {/* Amount */}
              <div className={`p-6 rounded-xl text-center ${dm ? "bg-emerald-900/20 border border-emerald-800" : "bg-emerald-50 border border-emerald-200"}`}>
                <p className={`text-xs font-semibold uppercase tracking-wider mb-1 ${muted}`}>Total Amount Paid</p>
                <p className="text-3xl font-bold text-emerald-600">{receiptModal.amount.toLocaleString()} {receiptModal.currency}</p>
              </div>

              {/* Status */}
              <div className="flex items-center justify-center gap-2">
                <span className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold ${
                  receiptModal.status === "success" ? "bg-emerald-50 text-emerald-700 border border-emerald-200" :
                  receiptModal.status === "pending" ? "bg-amber-50 text-amber-700 border border-amber-200" :
                  "bg-red-50 text-red-700 border border-red-200"
                }`}>
                  <CheckCircle className="w-4 h-4" />
                  Payment {receiptModal.status === "success" ? "Successful" : receiptModal.status}
                </span>
              </div>

              {/* Escrow Status */}
              {receiptModal.escrow_status && (
                <div className={`text-center text-xs ${muted}`}>
                  <p>Escrow Status: <span className="font-semibold capitalize">{receiptModal.escrow_status}</span></p>
                </div>
              )}

              {/* Footer */}
              <div className={`text-center text-xs pt-4 border-t ${dm ? "border-gray-800" : "border-slate-200"} ${muted}`}>
                <p>This is an official receipt from Ethiopian Talent Network</p>
                <p className="mt-1">For support, contact: support@etn.com</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
