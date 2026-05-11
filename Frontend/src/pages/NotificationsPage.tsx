import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router";
import { useDarkMode } from "../contexts/DarkModeContext";
import { Header } from "../features/talents/components/Header";
import {
  Bell, Check, X, Users, UserPlus, CheckCircle,
  Loader2, RefreshCw, BellOff, MessageSquare,
} from "lucide-react";
import {
  getNotifications,
  markAllNotificationsRead,
  markNotificationRead,
  acceptConnectionNotification,
  declineConnectionNotification,
  getTalentProfile,
  type Notification,
} from "../api/talent/talentApi";
import { SHARED_ROUTES } from "../config/routes";

export default function NotificationsPage() {
  const { darkMode, toggleDarkMode } = useDarkMode();
  const navigate = useNavigate();
  const [userImage, setUserImage] = useState<string | undefined>();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [actioningId, setActioningId] = useState<number | null>(null);
  const [filter, setFilter] = useState<"all" | "unread" | "connection_request" | "connection_accepted" | "new_message">("all");
  const [toast, setToast] = useState<{ msg: string; type: "success" | "error" } | null>(null);

  const dm = darkMode;
  const bg = dm ? "bg-gray-900" : "bg-gray-50";
  const card = dm ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200";
  const text = dm ? "text-white" : "text-gray-900";
  const muted = dm ? "text-gray-400" : "text-gray-500";

  useEffect(() => {
    getTalentProfile()
      .then((p) => { if (p.data.profile_image) setUserImage(p.data.profile_image); })
      .catch(() => {});
    load();
  }, []);

  const load = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    else setRefreshing(true);
    try {
      const res = await getNotifications();
      setNotifications(res.notifications || []);
    } catch {
      showToast("Failed to load notifications", "error");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  const showToast = (msg: string, type: "success" | "error") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  const handleAccept = async (notif: Notification) => {
    setActioningId(notif.id);
    try {
      await acceptConnectionNotification(notif.connection_id);
      await markNotificationRead(notif.id);
      showToast("Connection accepted!", "success");
      await load(true);
    } catch (err: any) {
      showToast(err.message || "Failed to accept", "error");
    } finally {
      setActioningId(null);
    }
  };

  const handleDecline = async (notif: Notification) => {
    setActioningId(notif.id);
    try {
      await declineConnectionNotification(notif.connection_id);
      await markNotificationRead(notif.id);
      showToast("Connection declined", "success");
      await load(true);
    } catch (err: any) {
      showToast(err.message || "Failed to decline", "error");
    } finally {
      setActioningId(null);
    }
  };

  const handleMarkRead = async (notif: Notification) => {
    if (notif.is_read) return;
    try {
      await markNotificationRead(notif.id);
      setNotifications((prev) =>
        prev.map((n) => n.id === notif.id ? { ...n, is_read: true } : n)
      );
    } catch {}
  };

  const handleNotifClick = async (notif: Notification) => {
    await handleMarkRead(notif);
    if (notif.type === "new_message") {
      navigate(SHARED_ROUTES.MESSAGES.path);
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await markAllNotificationsRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
      showToast("All marked as read", "success");
    } catch {
      showToast("Failed to mark all as read", "error");
    }
  };

  const filtered = notifications.filter((n) => {
    if (filter === "unread") return !n.is_read;
    if (filter === "connection_request") return n.type === "connection_request";
    if (filter === "connection_accepted") return n.type === "connection_accepted";
    if (filter === "new_message") return n.type === "new_message";
    return true;
  });

  const unreadCount = notifications.filter((n) => !n.is_read).length;
  const msgCount = notifications.filter((n) => n.type === "new_message" && !n.is_read).length;

  const formatTime = (dateStr: string) => {
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);
    if (mins < 1) return "Just now";
    if (mins < 60) return `${mins}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days < 7) return `${days}d ago`;
    return new Date(dateStr).toLocaleDateString("en-US", { month: "short", day: "numeric" });
  };

  const NotifIcon = ({ type }: { type: string }) => {
    if (type === "connection_request") return (
      <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900/40 flex items-center justify-center flex-shrink-0">
        <UserPlus className="w-5 h-5 text-blue-600 dark:text-blue-400" />
      </div>
    );
    if (type === "connection_accepted") return (
      <div className="w-10 h-10 rounded-full bg-green-100 dark:bg-green-900/40 flex items-center justify-center flex-shrink-0">
        <Users className="w-5 h-5 text-green-600 dark:text-green-400" />
      </div>
    );
    if (type === "new_message") return (
      <div className="w-10 h-10 rounded-full bg-purple-100 dark:bg-purple-900/40 flex items-center justify-center flex-shrink-0">
        <MessageSquare className="w-5 h-5 text-purple-600 dark:text-purple-400" />
      </div>
    );
    return (
      <div className="w-10 h-10 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center flex-shrink-0">
        <Bell className="w-5 h-5 text-gray-500" />
      </div>
    );
  };

  const FILTERS = [
    { key: "all" as const, label: "All" },
    { key: "unread" as const, label: `Unread${unreadCount > 0 ? ` (${unreadCount})` : ""}` },
    { key: "new_message" as const, label: `Messages${msgCount > 0 ? ` (${msgCount})` : ""}` },
    { key: "connection_request" as const, label: "Requests" },
    { key: "connection_accepted" as const, label: "Accepted" },
  ];

  if (loading) {
    return (
      <div className={`min-h-screen ${bg}`}>
        <Header darkMode={dm} toggleDarkMode={toggleDarkMode} userImage={userImage} onImageUpload={() => {}} />
        <div className="flex items-center justify-center min-h-[60vh]">
          <Loader2 className="w-8 h-8 animate-spin text-[#0084ca]" />
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen ${bg} transition-colors duration-300`}>
      <Header darkMode={dm} toggleDarkMode={toggleDarkMode} userImage={userImage} onImageUpload={() => {}} />

      {/* Toast */}
      {toast && (
        <div className={`fixed top-20 right-4 z-50 flex items-center gap-2 px-5 py-3 rounded-xl shadow-xl text-white text-sm font-medium ${
          toast.type === "success" ? "bg-green-600" : "bg-red-600"
        }`}>
          {toast.type === "success" ? <CheckCircle className="w-4 h-4" /> : <X className="w-4 h-4" />}
          {toast.msg}
        </div>
      )}

      <div className="max-w-2xl mx-auto px-4 sm:px-6 py-8">

        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className={`text-2xl font-bold ${text}`}>Notifications</h1>
            <p className={`text-sm mt-0.5 ${muted}`}>
              {unreadCount > 0 ? `${unreadCount} unread` : "All caught up"}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => load(true)}
              disabled={refreshing}
              className={`p-2 rounded-lg transition-colors ${dm ? "hover:bg-gray-700 text-gray-400" : "hover:bg-gray-100 text-gray-500"}`}
              title="Refresh"
            >
              <RefreshCw className={`w-4 h-4 ${refreshing ? "animate-spin" : ""}`} />
            </button>
            {unreadCount > 0 && (
              <button
                onClick={handleMarkAllRead}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-[#0084ca] hover:bg-[#0084ca]/10 rounded-lg transition-colors"
              >
                <Check className="w-3.5 h-3.5" /> Mark all read
              </button>
            )}
          </div>
        </div>

        {/* Filter tabs */}
        <div className={`flex gap-1 p-1 rounded-xl mb-5 overflow-x-auto scrollbar-hide ${dm ? "bg-gray-800" : "bg-gray-100"}`}>
          {FILTERS.map(({ key, label }) => (
            <button
              key={key}
              onClick={() => setFilter(key)}
              className={`flex-shrink-0 px-4 py-2 rounded-lg text-xs font-semibold transition-all whitespace-nowrap ${
                filter === key
                  ? dm ? "bg-gray-700 text-white shadow-sm" : "bg-white text-[#0084ca] shadow-sm"
                  : dm ? "text-gray-400 hover:text-gray-200" : "text-gray-500 hover:text-gray-700"
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {/* Notifications list */}
        {filtered.length === 0 ? (
          <div className={`${card} border rounded-2xl text-center py-20`}>
            <BellOff className={`w-12 h-12 mx-auto mb-4 opacity-25 ${muted}`} />
            <p className={`font-semibold ${text}`}>No notifications</p>
            <p className={`text-sm mt-1 ${muted}`}>
              {filter !== "all" ? "Try switching to 'All'" : "You're all caught up!"}
            </p>
          </div>
        ) : (
          <div className={`${card} border rounded-2xl overflow-hidden`}>
            {filtered.map((notif, idx) => (
              <div
                key={notif.id}
                onClick={() => handleNotifClick(notif)}
                className={`relative flex gap-4 p-4 sm:p-5 transition-colors cursor-pointer ${
                  idx < filtered.length - 1 ? `border-b ${dm ? "border-gray-700" : "border-gray-100"}` : ""
                } ${
                  !notif.is_read
                    ? dm ? "bg-blue-900/10 hover:bg-blue-900/20" : "bg-blue-50/50 hover:bg-blue-50"
                    : dm ? "hover:bg-gray-700/50" : "hover:bg-gray-50"
                }`}
              >
                {/* Unread dot */}
                {!notif.is_read && (
                  <span className="absolute top-4 right-4 w-2 h-2 rounded-full bg-[#0084ca]" />
                )}

                {/* Avatar or icon */}
                {notif.sender_image ? (
                  <img
                    src={notif.sender_image}
                    alt={notif.sender_name || ""}
                    className="w-10 h-10 rounded-full object-cover flex-shrink-0 ring-2 ring-[#0084ca]/20"
                  />
                ) : (
                  <NotifIcon type={notif.type} />
                )}

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <p className={`text-sm font-semibold leading-snug ${text}`}>
                    {notif.title}
                  </p>
                  {notif.message && (
                    <p className={`text-xs mt-0.5 line-clamp-2 ${muted}`}>{notif.message}</p>
                  )}
                  <p className={`text-xs mt-1 ${muted}`}>{formatTime(notif.created_at)}</p>

                  {/* Message CTA */}
                  {notif.type === "new_message" && (
                    <span className="inline-flex items-center gap-1 mt-2 text-xs font-medium text-purple-600 dark:text-purple-400">
                      <MessageSquare className="w-3.5 h-3.5" /> Tap to open messages
                    </span>
                  )}

                  {/* Accept / Decline for pending connection requests */}
                  {notif.type === "connection_request" && !notif.is_read && (
                    <div className="flex gap-2 mt-3" onClick={(e) => e.stopPropagation()}>
                      <button
                        onClick={() => handleAccept(notif)}
                        disabled={actioningId === notif.id}
                        className="flex items-center gap-1.5 px-4 py-1.5 bg-[#0084ca] hover:bg-[#006ba6] text-white text-xs font-semibold rounded-lg transition-colors disabled:opacity-50"
                      >
                        {actioningId === notif.id
                          ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          : <Check className="w-3.5 h-3.5" />}
                        Accept
                      </button>
                      <button
                        onClick={() => handleDecline(notif)}
                        disabled={actioningId === notif.id}
                        className={`flex items-center gap-1.5 px-4 py-1.5 text-xs font-semibold rounded-lg transition-colors disabled:opacity-50 ${
                          dm ? "bg-gray-700 hover:bg-gray-600 text-gray-300" : "bg-gray-100 hover:bg-gray-200 text-gray-700"
                        }`}
                      >
                        <X className="w-3.5 h-3.5" /> Decline
                      </button>
                    </div>
                  )}

                  {/* Accepted badge */}
                  {notif.type === "connection_accepted" && (
                    <span className="inline-flex items-center gap-1 mt-2 text-xs font-medium text-green-600 dark:text-green-400">
                      <CheckCircle className="w-3.5 h-3.5" /> Now connected
                    </span>
                  )}

                  {/* Already actioned request */}
                  {notif.type === "connection_request" && notif.is_read && (
                    <span className={`inline-block mt-2 text-xs ${muted}`}>Already responded</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
