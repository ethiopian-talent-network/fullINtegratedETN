import { useState, useEffect } from "react";
import { Link } from "react-router";
import { useDarkMode } from "../../contexts/DarkModeContext";
import {
  MapPin, GitBranch, Link as LinkIcon, MessageSquare,
  Users, Search, Compass, X, Mail,
} from "lucide-react";
import { getMyConnections, type Connection } from "../../api/talent/talentApi";
import { SHARED_ROUTES, TALENT_ROUTES } from "../../config/routes";

export default function TalentNetwork() {
  const { darkMode } = useDarkMode();
  const [connections, setConnections] = useState<Connection[]>([]);
  const [filtered, setFiltered] = useState<Connection[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<Connection | null>(null);

  useEffect(() => { loadConnections(); }, []);

  useEffect(() => {
    const q = search.toLowerCase();
    setFiltered(
      q
        ? connections.filter(
            (c) =>
              c.name.toLowerCase().includes(q) ||
              c.skills?.toLowerCase().includes(q) ||
              c.about?.toLowerCase().includes(q)
          )
        : connections
    );
  }, [search, connections]);

  const loadConnections = async () => {
    setLoading(true);
    try {
      const res = await getMyConnections();
      setConnections(res.connections || []);
    } catch {
      // silently fail
    } finally {
      setLoading(false);
    }
  };

  const bg = darkMode ? "bg-gray-900" : "bg-gray-50";
  const card = darkMode ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200";
  const text = darkMode ? "text-white" : "text-gray-900";
  const muted = darkMode ? "text-gray-400" : "text-gray-500";
  const inputCls = darkMode
    ? "bg-gray-800 border-gray-600 text-white placeholder-gray-500 focus:border-[#0084ca]"
    : "bg-white border-gray-300 text-gray-900 placeholder-gray-400 focus:border-[#0084ca]";

  const Avatar = ({ conn, size = "md", clickable = false }: { conn: Connection; size?: "sm" | "md" | "lg"; clickable?: boolean }) => {
    const sizes = { sm: "w-10 h-10 text-base", md: "w-14 h-14 text-xl", lg: "w-20 h-20 text-2xl" };
    const cls = `${sizes[size]} rounded-full object-cover flex-shrink-0 ring-2 ring-[#0084ca]/20 ${clickable ? "cursor-pointer hover:ring-[#0084ca]/60 transition-all" : ""}`;
    return conn.profile_image ? (
      <img src={conn.profile_image} alt={conn.name} className={cls} />
    ) : (
      <div className={`${sizes[size]} rounded-full bg-gradient-to-br from-[#0084ca] to-purple-600 flex items-center justify-center text-white font-bold flex-shrink-0 ring-2 ring-[#0084ca]/20 ${clickable ? "cursor-pointer hover:ring-[#0084ca]/60 transition-all" : ""}`}>
        {conn.name.charAt(0).toUpperCase()}
      </div>
    );
  };

  return (
    <div className={`min-h-screen ${bg} transition-colors duration-300`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

        {/* Header */}
        <div className="flex items-start justify-between mb-8">
          <div>
            <h1 className={`text-3xl font-bold ${text}`}>My Network</h1>
            <p className={`mt-1 text-sm ${muted}`}>
              {loading ? "Loading..." : `${connections.length} connection${connections.length !== 1 ? "s" : ""}`}
            </p>
          </div>
          <Link
            to={TALENT_ROUTES.DISCOVER.path}
            className="flex items-center gap-2 px-4 py-2 bg-[#0084ca] hover:bg-[#006ba6] text-white rounded-lg text-sm font-medium transition-colors active:scale-95"
          >
            <Compass className="w-4 h-4" /> Discover Talents
          </Link>
        </div>

        {/* Search */}
        {!loading && connections.length > 0 && (
          <div className="relative mb-8 max-w-md">
            <Search className={`absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 ${muted}`} />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search connections..."
              className={`w-full pl-10 pr-4 py-2.5 rounded-lg border ${inputCls} focus:outline-none focus:ring-2 focus:ring-[#0084ca]/30 transition-colors`}
            />
          </div>
        )}

        {/* States */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className={`${card} border rounded-xl p-5 animate-pulse`}>
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-14 h-14 rounded-full bg-gray-300 dark:bg-gray-600 flex-shrink-0" />
                  <div className="flex-1 space-y-2">
                    <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded w-3/4" />
                    <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/2" />
                  </div>
                </div>
                <div className="space-y-2 mb-4">
                  <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded" />
                  <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-4/5" />
                </div>
                <div className="h-9 bg-gray-200 dark:bg-gray-700 rounded-lg" />
              </div>
            ))}
          </div>
        ) : connections.length === 0 ? (
          <div className={`text-center py-24 ${muted}`}>
            <Users className="w-14 h-14 mx-auto mb-4 opacity-25" />
            <p className="text-lg font-semibold">No connections yet</p>
            <p className="text-sm mt-1 mb-6">Start building your network by discovering talents</p>
            <Link
              to={TALENT_ROUTES.DISCOVER.path}
              className="inline-flex items-center gap-2 px-6 py-2.5 bg-[#0084ca] hover:bg-[#006ba6] text-white rounded-lg font-medium transition-colors"
            >
              <Compass className="w-4 h-4" /> Discover Talents
            </Link>
          </div>
        ) : filtered.length === 0 ? (
          <div className={`text-center py-16 ${muted}`}>
            <Search className="w-10 h-10 mx-auto mb-3 opacity-25" />
            <p className="font-medium">No connections match "{search}"</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {filtered.map((conn) => {
              const skills = conn.skills
                ? conn.skills.split(",").map((s) => s.trim()).filter(Boolean)
                : [];

              return (
                <div
                  key={conn.id}
                  className={`${card} border rounded-xl p-5 flex flex-col gap-4 hover:shadow-md transition-all duration-200`}
                >
                  {/* Avatar (clickable) + Name */}
                  <div className="flex items-center gap-3">
                    <div onClick={() => setSelected(conn)} title="View profile">
                      <Avatar conn={conn} size="md" clickable />
                    </div>
                    <div className="min-w-0">
                      <h3
                        className={`font-semibold truncate cursor-pointer hover:text-[#0084ca] transition-colors ${text}`}
                        onClick={() => setSelected(conn)}
                      >
                        {conn.name}
                      </h3>
                      <span className="inline-flex items-center gap-1 text-xs text-green-600 dark:text-green-400 font-medium">
                        <span className="w-1.5 h-1.5 rounded-full bg-green-500 inline-block" />
                        Connected
                      </span>
                    </div>
                  </div>

                  {/* About */}
                  {conn.about && (
                    <p className={`text-sm line-clamp-2 ${muted}`}>{conn.about}</p>
                  )}

                  {/* Skills */}
                  {skills.length > 0 && (
                    <div className="flex flex-wrap gap-1.5">
                      {skills.slice(0, 4).map((skill, i) => (
                        <span key={i} className="px-2 py-0.5 text-xs rounded-full bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300">
                          {skill}
                        </span>
                      ))}
                      {skills.length > 4 && (
                        <span className={`text-xs px-1 ${muted}`}>+{skills.length - 4}</span>
                      )}
                    </div>
                  )}

                  {/* Links */}
                  {(conn.linkedin || conn.github) && (
                    <div className="flex gap-3">
                      {conn.linkedin && (
                        <a href={conn.linkedin} target="_blank" rel="noopener noreferrer"
                          className="flex items-center gap-1 text-xs text-[#0084ca] hover:underline">
                          <LinkIcon className="w-3.5 h-3.5" /> LinkedIn
                        </a>
                      )}
                      {conn.github && (
                        <a href={conn.github} target="_blank" rel="noopener noreferrer"
                          className={`flex items-center gap-1 text-xs hover:underline ${muted}`}>
                          <GitBranch className="w-3.5 h-3.5" /> GitHub
                        </a>
                      )}
                    </div>
                  )}

                  {/* Message Button */}
                  <Link
                    to={SHARED_ROUTES.MESSAGES.path}
                    className="mt-auto flex items-center justify-center gap-2 w-full py-2 rounded-lg text-sm font-medium bg-[#0084ca]/10 hover:bg-[#0084ca]/20 text-[#0084ca] transition-colors"
                  >
                    <MessageSquare className="w-4 h-4" /> Message
                  </Link>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ── Profile Detail Drawer ── */}
      {selected && (
        <div className="fixed inset-0 z-50 flex justify-end">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => setSelected(null)}
          />

          {/* Drawer */}
          <div className={`relative w-full max-w-sm h-full overflow-y-auto shadow-2xl animate-slide-in-right ${darkMode ? "bg-gray-900" : "bg-white"}`}>

            {/* Close */}
            <button
              onClick={() => setSelected(null)}
              className={`absolute top-4 right-4 z-10 p-2 rounded-full transition-colors ${darkMode ? "hover:bg-gray-800 text-gray-400" : "hover:bg-gray-100 text-gray-500"}`}
            >
              <X className="w-5 h-5" />
            </button>

            {/* Cover */}
            <div className="h-28 bg-gradient-to-r from-[#0084ca] to-purple-600" />

            <div className="px-6 pb-8">
              {/* Avatar overlapping cover */}
              <div className="-mt-10 mb-4 flex items-end justify-between">
                <div onClick={() => {}} className="flex-shrink-0">
                  {selected.profile_image ? (
                    <img
                      src={selected.profile_image}
                      alt={selected.name}
                      className={`w-20 h-20 rounded-full object-cover border-4 shadow-lg ${darkMode ? "border-gray-900" : "border-white"}`}
                    />
                  ) : (
                    <div className={`w-20 h-20 rounded-full bg-gradient-to-br from-[#0084ca] to-purple-600 flex items-center justify-center text-white font-bold text-2xl border-4 shadow-lg ${darkMode ? "border-gray-900" : "border-white"}`}>
                      {selected.name.charAt(0).toUpperCase()}
                    </div>
                  )}
                </div>

                {/* Message CTA */}
                <Link
                  to={SHARED_ROUTES.MESSAGES.path}
                  onClick={() => setSelected(null)}
                  className="flex items-center gap-1.5 px-4 py-2 bg-[#0084ca] hover:bg-[#006ba6] text-white rounded-lg text-sm font-medium transition-colors"
                >
                  <MessageSquare className="w-4 h-4" /> Message
                </Link>
              </div>

              {/* Name */}
              <h2 className={`text-xl font-bold ${text}`}>{selected.name}</h2>
              <span className="inline-flex items-center gap-1 text-xs text-green-600 dark:text-green-400 font-medium mt-1">
                <span className="w-1.5 h-1.5 rounded-full bg-green-500 inline-block" />
                Connected
              </span>

              {/* About */}
              {selected.about && (
                <div className="mt-5">
                  <h3 className={`text-xs font-semibold uppercase tracking-wider mb-2 ${muted}`}>About</h3>
                  <p className={`text-sm leading-relaxed ${text}`}>{selected.about}</p>
                </div>
              )}

              {/* Skills */}
              {selected.skills && (
                <div className="mt-5">
                  <h3 className={`text-xs font-semibold uppercase tracking-wider mb-3 ${muted}`}>Skills</h3>
                  <div className="flex flex-wrap gap-2">
                    {selected.skills.split(",").map((s, i) => (
                      <span key={i} className="px-3 py-1 text-xs rounded-full bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300 font-medium">
                        {s.trim()}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Links */}
              {(selected.linkedin || selected.github) && (
                <div className="mt-5">
                  <h3 className={`text-xs font-semibold uppercase tracking-wider mb-3 ${muted}`}>Links</h3>
                  <div className="flex flex-col gap-2">
                    {selected.linkedin && (
                      <a href={selected.linkedin} target="_blank" rel="noopener noreferrer"
                        className="flex items-center gap-2 text-sm text-[#0084ca] hover:underline">
                        <LinkIcon className="w-4 h-4" /> LinkedIn Profile
                      </a>
                    )}
                    {selected.github && (
                      <a href={selected.github} target="_blank" rel="noopener noreferrer"
                        className={`flex items-center gap-2 text-sm hover:underline ${text}`}>
                        <GitBranch className="w-4 h-4" /> GitHub Profile
                      </a>
                    )}
                  </div>
                </div>
              )}

              {/* Divider + full message CTA */}
              <div className={`mt-8 pt-6 border-t ${darkMode ? "border-gray-700" : "border-gray-100"}`}>
                <Link
                  to={SHARED_ROUTES.MESSAGES.path}
                  onClick={() => setSelected(null)}
                  className="flex items-center justify-center gap-2 w-full py-2.5 rounded-lg text-sm font-medium bg-[#0084ca]/10 hover:bg-[#0084ca]/20 text-[#0084ca] transition-colors"
                >
                  <MessageSquare className="w-4 h-4" /> Send a Message
                </Link>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
