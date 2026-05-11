import { Search, MessageSquare, UserPlus, RefreshCw } from "lucide-react";
import type { Conversation } from "../../../api/talent/talentApi";

interface Props {
  conversations: Conversation[];
  activeUserId: number | null;
  search: string;
  onSearchChange: (v: string) => void;
  onSelect: (conv: Conversation) => void;
  onNewMessage: () => void;
  onRefresh: () => void;
  loading: boolean;
  darkMode: boolean;
}

const initials = (name: string) =>
  name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);

const formatTime = (d: string) => {
  const diff = Date.now() - new Date(d).getTime();
  const m = Math.floor(diff / 60000);
  const h = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);
  if (m < 1) return "now";
  if (m < 60) return `${m}m`;
  if (h < 24) return `${h}h`;
  if (days < 7) return `${days}d`;
  return new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric" });
};

export function ConversationList({ conversations, activeUserId, search, onSearchChange, onSelect, onNewMessage, onRefresh, loading, darkMode: dm }: Props) {
  const totalUnread = conversations.reduce((s, c) => s + (c.unread_count || 0), 0);

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className={`px-4 pt-5 pb-4 border-b ${dm ? "border-gray-800" : "border-slate-100"}`}>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2.5">
            <h2 className={`text-base font-bold ${dm ? "text-white" : "text-gray-900"}`}>Messages</h2>
            {totalUnread > 0 && (
              <span className="min-w-[20px] h-5 px-1.5 text-[11px] font-bold bg-[#0084ca] text-white rounded-full flex items-center justify-center">
                {totalUnread > 99 ? "99+" : totalUnread}
              </span>
            )}
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={onNewMessage}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-[#0084ca] hover:bg-[#006ba6] text-white text-xs font-semibold rounded-lg transition-colors"
            >
              <UserPlus className="w-3.5 h-3.5" /> New
            </button>
            <button
              onClick={onRefresh}
              className={`p-1.5 rounded-lg transition-colors ${dm ? "hover:bg-gray-800 text-gray-500" : "hover:bg-slate-100 text-gray-400"}`}
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
            </button>
          </div>
        </div>

        {/* Search */}
        <div className={`flex items-center gap-2 px-3 py-2.5 rounded-xl border ${dm ? "bg-gray-800 border-gray-700" : "bg-slate-50 border-slate-200"}`}>
          <Search className={`w-3.5 h-3.5 flex-shrink-0 ${dm ? "text-gray-500" : "text-gray-400"}`} />
          <input
            type="text"
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search conversations..."
            className={`flex-1 bg-transparent outline-none text-sm ${dm ? "text-white placeholder-gray-600" : "text-gray-900 placeholder-gray-400"}`}
          />
        </div>
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto">
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <div className="w-6 h-6 rounded-full border-2 border-[#0084ca]/20 border-t-[#0084ca] animate-spin" />
          </div>
        ) : conversations.length === 0 ? (
          <div className={`flex flex-col items-center justify-center py-16 px-6 text-center ${dm ? "text-gray-500" : "text-gray-400"}`}>
            <div className={`w-14 h-14 rounded-2xl flex items-center justify-center mb-4 ${dm ? "bg-gray-800" : "bg-slate-100"}`}>
              <MessageSquare className="w-7 h-7 opacity-40" />
            </div>
            <p className={`text-sm font-semibold mb-1 ${dm ? "text-gray-300" : "text-gray-600"}`}>No conversations yet</p>
            <p className="text-xs mb-5">Start chatting with your connections</p>
            <button
              onClick={onNewMessage}
              className="flex items-center gap-1.5 px-4 py-2 bg-[#0084ca] hover:bg-[#006ba6] text-white text-xs font-semibold rounded-lg transition-colors"
            >
              <UserPlus className="w-3.5 h-3.5" /> New Message
            </button>
          </div>
        ) : (
          conversations.map((conv) => {
            const isActive = activeUserId === conv.user_id;
            const hasUnread = conv.unread_count > 0;
            return (
              <button
                key={conv.user_id}
                onClick={() => onSelect(conv)}
                className={`w-full flex items-center gap-3 px-4 py-3.5 transition-all text-left border-b ${
                  dm ? "border-gray-800/60" : "border-slate-50"
                } ${
                  isActive
                    ? dm ? "bg-[#0084ca]/10 border-l-2 border-l-[#0084ca]" : "bg-[#0084ca]/8 border-l-2 border-l-[#0084ca]"
                    : dm ? "hover:bg-gray-800/60" : "hover:bg-slate-50"
                }`}
              >
                {/* Avatar */}
                <div className="relative flex-shrink-0">
                  {conv.profile_image ? (
                    <img src={conv.profile_image} alt={conv.name} className="w-11 h-11 rounded-full object-cover" />
                  ) : (
                    <div className="w-11 h-11 rounded-full bg-gradient-to-br from-[#0084ca] to-violet-500 flex items-center justify-center text-white text-sm font-bold">
                      {initials(conv.name)}
                    </div>
                  )}
                  {hasUnread && (
                    <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 bg-[#0084ca] text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                      {conv.unread_count > 9 ? "9+" : conv.unread_count}
                    </span>
                  )}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-0.5">
                    <p className={`text-sm font-semibold truncate ${isActive ? "text-[#0084ca]" : dm ? "text-white" : "text-gray-900"}`}>
                      {conv.name}
                    </p>
                    <span className={`text-[11px] flex-shrink-0 ml-2 ${dm ? "text-gray-600" : "text-gray-400"}`}>
                      {formatTime(conv.last_message_at)}
                    </span>
                  </div>
                  <p className={`text-xs truncate ${hasUnread ? (dm ? "text-gray-200 font-medium" : "text-gray-700 font-medium") : dm ? "text-gray-500" : "text-gray-400"}`}>
                    {conv.last_message || "No messages yet"}
                  </p>
                </div>
              </button>
            );
          })
        )}
      </div>
    </div>
  );
}
