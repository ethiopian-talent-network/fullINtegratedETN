import { useState, useEffect, useCallback } from "react";
import { useDarkMode } from "../../contexts/DarkModeContext";
import { X, MapPin, GitBranch, Link, UserPlus, Check, Loader2, Search, Clock, UserCheck } from "lucide-react";
import {
  getAllTalents,
  sendConnectionRequest,
  acceptConnectionRequest,
  getConnectionStatuses,
  type TalentCard,
} from "../../api/talent/talentApi";

type ConnStatus = { status: "pending" | "accepted" | "rejected"; direction: "sent" | "received"; connection_id: number };

export default function TalentDiscovery() {
  const { darkMode } = useDarkMode();
  const [talents, setTalents] = useState<TalentCard[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState<any>({});
  const [statuses, setStatuses] = useState<Record<number, ConnStatus>>({});
  const [actionId, setActionId] = useState<number | null>(null);
  const [selectedTalent, setSelectedTalent] = useState<TalentCard | null>(null);
  const [toast, setToast] = useState<{ msg: string; type: "success" | "error" } | null>(null);

  const loadStatuses = useCallback(async () => {
    try {
      const res = await getConnectionStatuses();
      setStatuses(res.statuses || {});
    } catch {}
  }, []);

  const loadTalents = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getAllTalents({ page, limit: 12, search: search || undefined });
      setTalents(res.talents);
      setPagination(res.pagination);
    } catch {
      showToast("Failed to load talents", "error");
    } finally {
      setLoading(false);
    }
  }, [page, search]);

  useEffect(() => {
    loadTalents();
    loadStatuses();
  }, [page]);

  const showToast = (msg: string, type: "success" | "error") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    loadTalents();
  };

  const handleConnect = async (talentId: number, e?: React.MouseEvent) => {
    e?.stopPropagation();
    setActionId(talentId);
    try {
      await sendConnectionRequest(talentId);
      setStatuses(prev => ({ ...prev, [talentId]: { status: "pending", direction: "sent" } }));
      showToast("Connection request sent!", "success");
    } catch (err: any) {
      showToast(err.message || "Failed to send request", "error");
    } finally {
      setActionId(null);
    }
  };

  const handleAccept = async (connectionId: number, talentId: number, e?: React.MouseEvent) => {
    e?.stopPropagation();
    setActionId(talentId);
    try {
      await acceptConnectionRequest(connectionId);
      setStatuses(prev => ({ ...prev, [talentId]: { status: "accepted", direction: "received" } }));
      showToast("Connection accepted!", "success");
    } catch (err: any) {
      showToast(err.message || "Failed to accept", "error");
    } finally {
      setActionId(null);
    }
  };

  const bg = darkMode ? "bg-gray-900" : "bg-gray-50";
  const card = darkMode ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200";
  const text = darkMode ? "text-white" : "text-gray-900";
  const muted = darkMode ? "text-gray-400" : "text-gray-500";
  const inputCls = darkMode
    ? "bg-gray-800 border-gray-600 text-white placeholder-gray-500 focus:border-[#0084ca]"
    : "bg-white border-gray-300 text-gray-900 placeholder-gray-400 focus:border-[#0084ca]";

  const ConnectButton = ({ talent, full = false }: { talent: TalentCard; full?: boolean }) => {
    const conn = statuses[talent.id];
    const isLoading = actionId === talent.id;
    const cls = `flex items-center gap-1.5 text-sm font-medium transition-all rounded-lg px-4 py-2 ${full ? "w-full justify-center" : ""}`;

    if (conn?.status === "accepted") {
      return (
        <span className={`flex items-center gap-1.5 text-sm font-medium text-emerald-600 dark:text-emerald-400 ${full ? "justify-center w-full py-2" : ""}`}>
          <Check className="w-4 h-4" /> Connected
        </span>
      );
    }

    if (conn?.status === "pending" && conn.direction === "sent") {
      return (
        <span className={`${cls} bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400 cursor-default`}>
          <Clock className="w-4 h-4" /> Pending
        </span>
      );
    }

    if (conn?.status === "pending" && conn.direction === "received") {
      return (
        <button
          onClick={(e) => handleAccept(conn.connection_id, talent.id, e)}
          disabled={isLoading}
          className={`${cls} bg-emerald-600 hover:bg-emerald-700 text-white active:scale-95 disabled:opacity-60`}
        >
          {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <UserCheck className="w-4 h-4" />}
          Accept Request
        </button>
      );
    }

    return (
      <button
        onClick={(e) => handleConnect(talent.id, e)}
        disabled={isLoading}
        className={`${cls} bg-[#0084ca] hover:bg-[#006ba6] text-white active:scale-95 disabled:opacity-60`}
      >
        {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <UserPlus className="w-4 h-4" />}
        {isLoading ? "Sending..." : "Connect"}
      </button>
    );
  };

  return (
    <div className={`min-h-screen ${bg} transition-colors duration-300`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

        {/* Header */}
        <div className="mb-8">
          <h1 className={`text-3xl font-bold ${text}`}>Discover Talents</h1>
          <p className={`mt-1 text-sm ${muted}`}>
            {pagination.total ? `${pagination.total} talents available` : "Browse and connect with talented professionals"}
          </p>
        </div>

        {/* Search */}
        <form onSubmit={handleSearch} className="flex gap-3 mb-8">
          <div className="relative flex-1">
            <Search className={`absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 ${muted}`} />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name, skill, or location..."
              className={`w-full pl-10 pr-4 py-2.5 rounded-lg border ${inputCls} focus:outline-none focus:ring-2 focus:ring-[#0084ca]/30 transition-colors`}
            />
          </div>
          <button type="submit" className="px-6 py-2.5 bg-[#0084ca] hover:bg-[#006ba6] text-white rounded-lg font-medium transition-colors active:scale-95">
            Search
          </button>
        </form>

        {/* Toast */}
        {toast && (
          <div className={`fixed top-20 right-4 z-50 px-5 py-3 rounded-lg shadow-lg text-white text-sm font-medium animate-fade-in ${
            toast.type === "success" ? "bg-green-600" : "bg-red-600"
          }`}>
            {toast.msg}
          </div>
        )}

        {/* Grid */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {Array.from({ length: 12 }).map((_, i) => (
              <div key={i} className={`${card} border rounded-xl p-5 animate-pulse`}>
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 rounded-full bg-gray-300 dark:bg-gray-600 flex-shrink-0" />
                  <div className="flex-1 space-y-2">
                    <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded w-3/4" />
                    <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/2" />
                  </div>
                </div>
                <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded-lg" />
              </div>
            ))}
          </div>
        ) : talents.length === 0 ? (
          <div className={`text-center py-24 ${muted}`}>
            <Search className="w-12 h-12 mx-auto mb-4 opacity-30" />
            <p className="text-lg font-medium">No talents found</p>
            <p className="text-sm mt-1">Try a different search term</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {talents.map((talent) => {
              const conn = statuses[talent.id];
              return (
                <div
                  key={talent.id}
                  onClick={() => setSelectedTalent(talent)}
                  className={`${card} border rounded-xl p-5 flex flex-col gap-3 cursor-pointer hover:shadow-md hover:border-[#0084ca]/40 transition-all duration-200 group`}
                >
                  {/* Avatar + Name */}
                  <div className="flex items-center gap-3">
                    {talent.profile_image ? (
                      <img src={talent.profile_image} alt={talent.name} className="w-12 h-12 rounded-full object-cover flex-shrink-0 ring-2 ring-transparent group-hover:ring-[#0084ca]/30 transition-all" />
                    ) : (
                      <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#0084ca] to-violet-500 flex items-center justify-center flex-shrink-0 text-white font-bold text-lg">
                        {talent.name.charAt(0).toUpperCase()}
                      </div>
                    )}
                    <div className="min-w-0">
                      <h3 className={`font-semibold truncate ${text} group-hover:text-[#0084ca] transition-colors`}>
                        {talent.name}
                      </h3>
                      {talent.location && (
                        <p className={`text-xs flex items-center gap-1 truncate ${muted}`}>
                          <MapPin className="w-3 h-3 flex-shrink-0" /> {talent.location}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* About */}
                  {talent.about && <p className={`text-xs line-clamp-2 ${muted}`}>{talent.about}</p>}

                  {/* Skills */}
                  {talent.skills.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {talent.skills.slice(0, 3).map((skill, i) => (
                        <span key={i} className="px-2 py-0.5 text-xs rounded-full bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300">
                          {skill}
                        </span>
                      ))}
                      {talent.skills.length > 3 && <span className={`text-xs px-1 ${muted}`}>+{talent.skills.length - 3}</span>}
                    </div>
                  )}

                  {/* Status badge for received requests */}
                  {conn?.status === "pending" && conn.direction === "received" && (
                    <div className={`flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full w-fit ${darkMode ? "bg-blue-900/30 text-blue-400" : "bg-blue-50 text-blue-600"}`}>
                      <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" />
                      Wants to connect
                    </div>
                  )}

                  {/* Connect button */}
                  <div className="mt-auto pt-1" onClick={(e) => e.stopPropagation()}>
                    <ConnectButton talent={talent} full />
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Pagination */}
        {!loading && (pagination.has_prev_page || pagination.has_next_page) && (
          <div className="flex justify-center items-center gap-4 mt-10">
            <button onClick={() => setPage((p) => p - 1)} disabled={!pagination.has_prev_page}
              className="px-5 py-2 rounded-lg bg-[#0084ca] text-white disabled:opacity-40 hover:bg-[#006ba6] transition-colors">
              ← Previous
            </button>
            <span className={`text-sm ${muted}`}>Page {page} of {Math.ceil((pagination.total || 1) / 12)}</span>
            <button onClick={() => setPage((p) => p + 1)} disabled={!pagination.has_next_page}
              className="px-5 py-2 rounded-lg bg-[#0084ca] text-white disabled:opacity-40 hover:bg-[#006ba6] transition-colors">
              Next →
            </button>
          </div>
        )}
      </div>

      {/* Profile Drawer */}
      {selectedTalent && (
        <div className="fixed inset-0 z-50 flex justify-end">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setSelectedTalent(null)} />
          <div className={`relative w-full max-w-md h-full overflow-y-auto shadow-2xl ${darkMode ? "bg-gray-900" : "bg-white"} animate-slide-in-right`}>
            <button onClick={() => setSelectedTalent(null)}
              className={`absolute top-4 right-4 p-2 rounded-full z-10 transition-colors ${darkMode ? "hover:bg-gray-800 text-gray-400" : "hover:bg-gray-100 text-gray-500"}`}>
              <X className="w-5 h-5" />
            </button>

            <div className="h-28 bg-gradient-to-r from-[#0084ca] to-violet-500" />
            <div className="px-6 pb-6">
              <div className="-mt-12 mb-4 flex items-end justify-between">
                {selectedTalent.profile_image ? (
                  <img src={selectedTalent.profile_image} alt={selectedTalent.name}
                    className={`w-20 h-20 rounded-full object-cover border-4 ${darkMode ? "border-gray-900" : "border-white"}`} />
                ) : (
                  <div className={`w-20 h-20 rounded-full bg-gradient-to-br from-[#0084ca] to-violet-500 flex items-center justify-center text-white font-bold text-2xl border-4 ${darkMode ? "border-gray-900" : "border-white"}`}>
                    {selectedTalent.name.charAt(0).toUpperCase()}
                  </div>
                )}
                <div onClick={(e) => e.stopPropagation()}>
                  <ConnectButton talent={selectedTalent} />
                </div>
              </div>

              <h2 className={`text-xl font-bold ${text}`}>{selectedTalent.name}</h2>
              {selectedTalent.location && (
                <p className={`flex items-center gap-1 text-sm mt-1 ${muted}`}>
                  <MapPin className="w-3.5 h-3.5" /> {selectedTalent.location}
                </p>
              )}

              {selectedTalent.about && (
                <div className="mt-5">
                  <h3 className={`text-xs font-bold uppercase tracking-wider mb-2 ${muted}`}>About</h3>
                  <p className={`text-sm leading-relaxed ${text}`}>{selectedTalent.about}</p>
                </div>
              )}

              {selectedTalent.skills.length > 0 && (
                <div className="mt-5">
                  <h3 className={`text-xs font-bold uppercase tracking-wider mb-3 ${muted}`}>Skills</h3>
                  <div className="flex flex-wrap gap-2">
                    {selectedTalent.skills.map((skill, i) => (
                      <span key={i} className="px-3 py-1 text-sm rounded-full bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300 font-medium">
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {(selectedTalent.linkedin || selectedTalent.github) && (
                <div className="mt-5">
                  <h3 className={`text-xs font-bold uppercase tracking-wider mb-3 ${muted}`}>Links</h3>
                  <div className="flex flex-col gap-2">
                    {selectedTalent.linkedin && (
                      <a href={selectedTalent.linkedin} target="_blank" rel="noopener noreferrer"
                        className="flex items-center gap-2 text-sm text-[#0084ca] hover:underline">
                        <Link className="w-4 h-4" /> LinkedIn Profile
                      </a>
                    )}
                    {selectedTalent.github && (
                      <a href={selectedTalent.github} target="_blank" rel="noopener noreferrer"
                        className={`flex items-center gap-2 text-sm hover:underline ${text}`}>
                        <GitBranch className="w-4 h-4" /> GitHub Profile
                      </a>
                    )}
                  </div>
                </div>
              )}

              {statuses[selectedTalent.id]?.status !== "accepted" && (
                <div className={`mt-8 pt-6 border-t ${darkMode ? "border-gray-700" : "border-gray-100"}`}>
                  <div onClick={(e) => e.stopPropagation()}>
                    <ConnectButton talent={selectedTalent} full />
                  </div>
                  {statuses[selectedTalent.id]?.status === "pending" && statuses[selectedTalent.id]?.direction === "sent" && (
                    <p className={`text-xs text-center mt-2 ${muted}`}>Request expires in 1 hour</p>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
