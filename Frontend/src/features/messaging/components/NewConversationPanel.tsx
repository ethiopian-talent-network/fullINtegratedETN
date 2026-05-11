import { useState } from "react";
import { Search, Users, X, Send } from "lucide-react";
import type { Connection } from "../../../api/talent/talentApi";

interface Props {
  connections: Connection[];
  onSelect: (conn: Connection) => void;
  onClose: () => void;
  darkMode: boolean;
}

const initials = (name: string) =>
  name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);

export function NewConversationPanel({ connections, onSelect, onClose, darkMode: dm }: Props) {
  const [query, setQuery] = useState("");

  const filtered = connections.filter((c) =>
    !query || c.name.toLowerCase().includes(query.toLowerCase())
  );

  return (
    <div className={`border-t ${dm ? "border-gray-800 bg-gray-900" : "border-slate-100 bg-white"}`}>
      {/* Panel header */}
      <div className={`flex items-center justify-between px-4 py-3 border-b ${dm ? "border-gray-800" : "border-slate-100"}`}>
        <p className={`text-xs font-bold uppercase tracking-widest ${dm ? "text-gray-400" : "text-gray-500"}`}>
          New Conversation
        </p>
        <button
          onClick={onClose}
          className={`p-1 rounded-lg transition-colors ${dm ? "hover:bg-gray-800 text-gray-500" : "hover:bg-slate-100 text-gray-400"}`}
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Search */}
      <div className={`px-4 py-2.5 border-b ${dm ? "border-gray-800" : "border-slate-100"}`}>
        <div className={`flex items-center gap-2 px-3 py-2 rounded-lg border ${dm ? "bg-gray-800 border-gray-700" : "bg-slate-50 border-slate-200"}`}>
          <Search className={`w-3.5 h-3.5 ${dm ? "text-gray-500" : "text-gray-400"}`} />
          <input
            autoFocus
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search connections..."
            className={`flex-1 bg-transparent outline-none text-sm ${dm ? "text-white placeholder-gray-600" : "text-gray-900 placeholder-gray-400"}`}
          />
        </div>
      </div>

      {/* Connections */}
      <div className="max-h-56 overflow-y-auto">
        {filtered.length === 0 ? (
          <div className={`flex flex-col items-center justify-center py-8 ${dm ? "text-gray-600" : "text-gray-400"}`}>
            <Users className="w-7 h-7 mb-2 opacity-30" />
            <p className="text-xs">{query ? "No results" : "No connections yet"}</p>
          </div>
        ) : (
          filtered.map((conn) => (
            <button
              key={conn.id}
              onClick={() => onSelect(conn)}
              className={`w-full flex items-center gap-3 px-4 py-3 transition-colors text-left ${dm ? "hover:bg-gray-800" : "hover:bg-slate-50"}`}
            >
              {conn.profile_image ? (
                <img src={conn.profile_image} alt={conn.name} className="w-9 h-9 rounded-full object-cover flex-shrink-0" />
              ) : (
                <div className="w-9 h-9 rounded-full bg-gradient-to-br from-[#0084ca] to-violet-500 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                  {initials(conn.name)}
                </div>
              )}
              <div className="flex-1 min-w-0">
                <p className={`text-sm font-medium truncate ${dm ? "text-white" : "text-gray-900"}`}>{conn.name}</p>
                {conn.about && <p className={`text-xs truncate ${dm ? "text-gray-500" : "text-gray-400"}`}>{conn.about}</p>}
              </div>
              <Send className={`w-3.5 h-3.5 flex-shrink-0 ${dm ? "text-gray-600" : "text-gray-300"}`} />
            </button>
          ))
        )}
      </div>
    </div>
  );
}
