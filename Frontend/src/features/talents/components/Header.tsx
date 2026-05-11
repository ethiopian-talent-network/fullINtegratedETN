import { Link, useNavigate, useLocation } from "react-router";
import { MessageSquare, Bell, Moon, Sun, Menu, X, Users, Compass, Network, ChevronDown, Check, UserPlus } from "lucide-react";
import {
  PUBLIC_ROUTES,
  SHARED_ROUTES,
  TALENT_ROUTES,
} from "../../../config/routes";
import DropdownMenu from "../../../components/ui/DropdownMenu";
import { useState, useRef, useEffect, useCallback } from "react";
import { useAuth } from "../../../contexts/AuthContext";
import { logout } from "../../../api/auth/authApi";
import {
  getNotifications,
  markAllNotificationsRead,
  markNotificationRead,
  acceptConnectionNotification,
  declineConnectionNotification,
  type Notification,
} from "../../../api/talent/talentApi";
import { API_BASE_URL } from "../../../config/api";

interface HeaderProps {
  darkMode: boolean;
  toggleDarkMode: () => void;
  userImage?: string;
  onImageUpload: (file: File) => void;
}

export function Header({
  darkMode,
  toggleDarkMode,
  userImage,
  onImageUpload,
}: HeaderProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [networkOpen, setNetworkOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [messageUnreadCount, setMessageUnreadCount] = useState(0);
  const [actioningId, setActioningId] = useState<number | null>(null);
  const networkRef = useRef<HTMLDivElement>(null);
  const notifRef = useRef<HTMLDivElement>(null);
  const { user, token, logout: authLogout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const isNetworkActive =
    location.pathname === TALENT_ROUTES.NETWORK.path ||
    location.pathname === TALENT_ROUTES.DISCOVER.path;

  const loadNotifications = useCallback(async () => {
    try {
      const res = await getNotifications();
      setNotifications(res.notifications);
      setUnreadCount(res.unread_count);
    } catch {}
  }, []);

  const loadMessageUnreadCount = useCallback(async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) return;
      
      const response = await fetch(`${API_BASE_URL}/api/messages/unread-count`, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });
      
      if (response.ok) {
        const data = await response.json();
        setMessageUnreadCount(data.unread_count || 0);
      }
    } catch {}
  }, []);

  useEffect(() => {
    loadNotifications();
    loadMessageUnreadCount();
    const interval = setInterval(() => {
      loadNotifications();
      loadMessageUnreadCount();
    }, 30000);
    return () => clearInterval(interval);
  }, [loadNotifications, loadMessageUnreadCount]);

  // Listen for message read events to refresh count
  useEffect(() => {
    const handleMessageRead = () => {
      loadMessageUnreadCount();
    };
    
    window.addEventListener('messages-read', handleMessageRead);
    window.addEventListener('focus', loadMessageUnreadCount);
    
    return () => {
      window.removeEventListener('messages-read', handleMessageRead);
      window.removeEventListener('focus', loadMessageUnreadCount);
    };
  }, [loadMessageUnreadCount]);

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (networkRef.current && !networkRef.current.contains(e.target as Node))
        setNetworkOpen(false);
      if (notifRef.current && !notifRef.current.contains(e.target as Node))
        setNotifOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const handleAccept = async (notif: Notification) => {
    setActioningId(notif.id);
    try {
      await acceptConnectionNotification(notif.connection_id);
      await markNotificationRead(notif.id);
      await loadNotifications();
    } catch {}
    setActioningId(null);
  };

  const handleDecline = async (notif: Notification) => {
    setActioningId(notif.id);
    try {
      await declineConnectionNotification(notif.connection_id);
      await markNotificationRead(notif.id);
      await loadNotifications();
    } catch {}
    setActioningId(null);
  };

  const handleMarkAllRead = async () => {
    await markAllNotificationsRead();
    await loadNotifications();
  };

  const handleLogout = async () => {
    try {
      if (token) {
        await logout(token);
      }
      authLogout();
      navigate("/");
    } catch (error) {
      console.error("Logout error:", error);
      // Still logout locally even if API call fails
      authLogout();
      navigate("/");
    }
  };

  return (
    <header
      className={`sticky top-0 z-50 shadow-sm transition-colors duration-300 ${
        darkMode
          ? "bg-gray-800 border-gray-700"
          : "bg-white border-b border-gray-200"
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center gap-4">
            <Link
              to={PUBLIC_ROUTES.HOME.path}
              className="flex items-center group"
            >
              <span className="etn-brand-fancy text-xl sm:text-2xl transition-transform group-hover:scale-105">
                ETN
              </span>
            </Link>

            {/* Mobile menu button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
            >
              {mobileMenuOpen ? (
                <X className="w-5 h-5" />
              ) : (
                <Menu className="w-5 h-5" />
              )}
            </button>

            <div className="hidden md:flex items-center gap-6 lg:gap-8">
              <Link
                to={TALENT_ROUTES.DASHBOARD.path}
                className={`text-sm font-medium transition-all duration-200 hover:scale-105 ${
                  darkMode
                    ? "text-gray-300 hover:text-[#0084ca]"
                    : "text-gray-700 hover:text-[#0084ca]"
                }`}
              >
                Find Jobs
              </Link>
              <Link
                to={TALENT_ROUTES.APPLICATIONS.path}
                className={`text-sm font-medium transition-all duration-200 hover:scale-105 ${
                  darkMode
                    ? "text-gray-300 hover:text-[#0084ca]"
                    : "text-gray-700 hover:text-[#0084ca]"
                }`}
              >
                My Applications
              </Link>
              <button
                className={`text-sm font-medium transition-all duration-200 hover:scale-105 ${
                  darkMode
                    ? "text-gray-300 hover:text-[#0084ca]"
                    : "text-gray-700 hover:text-[#0084ca]"
                }`}
              >
                Deliver Works
              </button>

              {/* Network Dropdown */}
              <div className="relative" ref={networkRef}>
                <button
                  onClick={() => setNetworkOpen((o) => !o)}
                  className={`flex items-center gap-1.5 text-sm font-medium transition-all duration-200 hover:scale-105 px-3 py-1.5 rounded-lg ${
                    isNetworkActive
                      ? "bg-[#0084ca]/10 text-[#0084ca]"
                      : darkMode
                      ? "text-gray-300 hover:text-[#0084ca] hover:bg-gray-700"
                      : "text-gray-700 hover:text-[#0084ca] hover:bg-gray-100"
                  }`}
                >
                  <Network className="w-4 h-4" />
                  Network
                  <ChevronDown
                    className={`w-3.5 h-3.5 transition-transform duration-200 ${
                      networkOpen ? "rotate-180" : ""
                    }`}
                  />
                </button>

                {networkOpen && (
                  <div
                    className={`absolute top-full left-0 mt-2 w-64 rounded-xl shadow-xl border overflow-hidden z-50 ${
                      darkMode
                        ? "bg-gray-800 border-gray-700"
                        : "bg-white border-gray-200"
                    }`}
                  >
                    <div className="p-2 space-y-1">
                      <Link
                        to={TALENT_ROUTES.NETWORK.path}
                        onClick={() => setNetworkOpen(false)}
                        className={`flex items-center gap-3 px-3 py-3 rounded-lg transition-all duration-150 group ${
                          location.pathname === TALENT_ROUTES.NETWORK.path
                            ? "bg-[#0084ca]/10 text-[#0084ca]"
                            : darkMode
                            ? "text-gray-300 hover:bg-gray-700 hover:text-white"
                            : "text-gray-700 hover:bg-gray-50 hover:text-gray-900"
                        }`}
                      >
                        <div className={`p-2 rounded-lg ${
                          location.pathname === TALENT_ROUTES.NETWORK.path
                            ? "bg-[#0084ca]/20"
                            : darkMode ? "bg-gray-700 group-hover:bg-gray-600" : "bg-gray-100 group-hover:bg-gray-200"
                        }`}>
                          <Users className="w-4 h-4" />
                        </div>
                        <div>
                          <p className="text-sm font-medium">My Network</p>
                          <p className={`text-xs ${
                            darkMode ? "text-gray-400" : "text-gray-500"
                          }`}>Connect with talents</p>
                        </div>
                      </Link>

                      <Link
                        to={TALENT_ROUTES.DISCOVER.path}
                        onClick={() => setNetworkOpen(false)}
                        className={`flex items-center gap-3 px-3 py-3 rounded-lg transition-all duration-150 group ${
                          location.pathname === TALENT_ROUTES.DISCOVER.path
                            ? "bg-[#0084ca]/10 text-[#0084ca]"
                            : darkMode
                            ? "text-gray-300 hover:bg-gray-700 hover:text-white"
                            : "text-gray-700 hover:bg-gray-50 hover:text-gray-900"
                        }`}
                      >
                        <div className={`p-2 rounded-lg ${
                          location.pathname === TALENT_ROUTES.DISCOVER.path
                            ? "bg-[#0084ca]/20"
                            : darkMode ? "bg-gray-700 group-hover:bg-gray-600" : "bg-gray-100 group-hover:bg-gray-200"
                        }`}>
                          <Compass className="w-4 h-4" />
                        </div>
                        <div>
                          <p className="text-sm font-medium">Discover Talents</p>
                          <p className={`text-xs ${
                            darkMode ? "text-gray-400" : "text-gray-500"
                          }`}>Find & explore profiles</p>
                        </div>
                      </Link>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-1 sm:gap-2">
            {/* Dark Mode Toggle */}
            <button
              onClick={toggleDarkMode}
              className={`p-1.5 sm:p-2 rounded-lg transition-all duration-200 hover:scale-105 ${
                darkMode
                  ? "bg-gray-700 text-yellow-400 hover:bg-gray-600"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
            >
              {darkMode ? (
                <Sun className="w-4 h-4 sm:w-5 sm:h-5" />
              ) : (
                <Moon className="w-4 h-4 sm:w-5 sm:h-5" />
              )}
            </button>

            {/* Notification Bell */}
            <div className="relative" ref={notifRef}>
              <button
                onClick={() => { setNotifOpen((o) => !o); }}
                className={`relative p-1.5 sm:p-2 rounded-lg transition-all duration-200 ${
                  darkMode
                    ? "text-gray-400 hover:text-gray-300 hover:bg-gray-700"
                    : "text-gray-400 hover:text-gray-600 hover:bg-gray-50"
                }`}
              >
                <Bell className="w-4 h-4 sm:w-5 sm:h-5" />
                {unreadCount > 0 && (
                  <span className="absolute top-0.5 right-0.5 min-w-[16px] h-4 px-0.5 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                    {unreadCount > 9 ? "9+" : unreadCount}
                  </span>
                )}
              </button>

              {notifOpen && (
                <div className={`absolute right-0 top-full mt-2 w-80 rounded-xl shadow-2xl border z-50 overflow-hidden ${
                  darkMode ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200"
                }`}>
                  <div className={`flex items-center justify-between px-4 py-3 border-b ${
                    darkMode ? "border-gray-700" : "border-gray-100"
                  }`}>
                    <h3 className={`font-semibold text-sm ${
                      darkMode ? "text-white" : "text-gray-900"
                    }`}>Notifications</h3>
                    {unreadCount > 0 && (
                      <button onClick={handleMarkAllRead} className="text-xs text-[#0084ca] hover:underline">
                        Mark all read
                      </button>
                    )}
                  </div>

                  <div className="max-h-96 overflow-y-auto">
                    {notifications.length === 0 ? (
                      <div className={`text-center py-10 text-sm ${
                        darkMode ? "text-gray-500" : "text-gray-400"
                      }`}>
                        <Bell className="w-8 h-8 mx-auto mb-2 opacity-30" />
                        No notifications
                      </div>
                    ) : (
                      notifications.map((notif) => (
                        <div
                          key={notif.id}
                          onClick={() => {
                            if (notif.type === "new_message") {
                              markNotificationRead(notif.id).catch(() => {});
                              setNotifOpen(false);
                              navigate("/messages");
                            }
                          }}
                          className={`px-4 py-3 border-b last:border-0 ${
                            notif.type === "new_message" ? "cursor-pointer" : ""
                          } ${
                            darkMode ? "border-gray-700" : "border-gray-50"
                          } ${
                            !notif.is_read
                              ? darkMode ? "bg-blue-900/20" : "bg-blue-50/60"
                              : ""
                          }`}
                        >
                          <div className="flex items-start gap-3">
                            {notif.sender_image ? (
                              <img src={notif.sender_image} alt={notif.sender_name}
                                className="w-9 h-9 rounded-full object-cover flex-shrink-0" />
                            ) : (
                              <div className="w-9 h-9 rounded-full bg-gradient-to-br from-[#0084ca] to-purple-600 flex items-center justify-center flex-shrink-0">
                                <UserPlus className="w-4 h-4 text-white" />
                              </div>
                            )}
                            <div className="flex-1 min-w-0">
                              <p className={`text-sm font-medium leading-snug ${
                                darkMode ? "text-white" : "text-gray-900"
                              }`}>{notif.title}</p>
                              <p className={`text-xs mt-0.5 ${
                                darkMode ? "text-gray-400" : "text-gray-500"
                              }`}>{new Date(notif.created_at).toLocaleDateString()}</p>

                              {notif.type === "connection_request" && !notif.is_read && (
                                <div className="flex gap-2 mt-2">
                                  <button
                                    onClick={() => handleAccept(notif)}
                                    disabled={actioningId === notif.id}
                                    className="flex items-center gap-1 px-3 py-1 text-xs font-medium bg-[#0084ca] hover:bg-[#006ba6] text-white rounded-lg transition-colors disabled:opacity-50"
                                  >
                                    <Check className="w-3 h-3" />
                                    {actioningId === notif.id ? "..." : "Accept"}
                                  </button>
                                  <button
                                    onClick={() => handleDecline(notif)}
                                    disabled={actioningId === notif.id}
                                    className={`flex items-center gap-1 px-3 py-1 text-xs font-medium rounded-lg transition-colors disabled:opacity-50 ${
                                      darkMode ? "bg-gray-700 hover:bg-gray-600 text-gray-300" : "bg-gray-100 hover:bg-gray-200 text-gray-700"
                                    }`}
                                  >
                                    <X className="w-3 h-3" /> Decline
                                  </button>
                                </div>
                              )}

                              {notif.type === "connection_accepted" && (
                                <p className="text-xs text-green-600 dark:text-green-400 mt-1 font-medium">✓ Now connected</p>
                              )}

                              {notif.type === "new_message" && (
                                <p className="text-xs text-purple-600 dark:text-purple-400 mt-1 font-medium">→ Tap to open messages</p>
                              )}
                            </div>
                            {!notif.is_read && (
                              <span className="w-2 h-2 rounded-full bg-[#0084ca] flex-shrink-0 mt-1" />
                            )}
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>

            <Link to={SHARED_ROUTES.MESSAGES.path}>
              <button
                className={`relative p-1.5 sm:p-2 rounded-lg transition-all duration-200 group ${
                  darkMode
                    ? "text-gray-400 hover:text-gray-300 hover:bg-gray-700"
                    : "text-gray-400 hover:text-gray-600 hover:bg-gray-50"
                }`}
              >
                <MessageSquare
                  className={`w-4 h-4 sm:w-5 sm:h-5 ${darkMode ? "group-hover:text-gray-300" : "group-hover:text-gray-700"}`}
                />
                {messageUnreadCount > 0 && (
                  <span className="absolute top-0.5 right-0.5 min-w-[16px] h-4 px-0.5 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                    {messageUnreadCount > 9 ? "9+" : messageUnreadCount}
                  </span>
                )}
                <span className="sr-only">Messages</span>
              </button>
            </Link>

            {/* Mobile Menu */}
            {mobileMenuOpen && (
              <div className="md:hidden absolute top-16 left-0 right-0 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 z-40">
                <div className="flex flex-col p-4 space-y-1">
                  <Link
                    to={TALENT_ROUTES.DASHBOARD.path}
                    onClick={() => setMobileMenuOpen(false)}
                    className={`text-sm font-medium text-left px-3 py-2 rounded-lg ${
                      darkMode
                        ? "text-gray-300 hover:text-[#0084ca] hover:bg-gray-700"
                        : "text-gray-700 hover:text-[#0084ca] hover:bg-gray-50"
                    }`}
                  >
                    Find Jobs
                  </Link>
                  <Link
                    to={TALENT_ROUTES.APPLICATIONS.path}
                    onClick={() => setMobileMenuOpen(false)}
                    className={`text-sm font-medium text-left px-3 py-2 rounded-lg ${
                      darkMode
                        ? "text-gray-300 hover:text-[#0084ca] hover:bg-gray-700"
                        : "text-gray-700 hover:text-[#0084ca] hover:bg-gray-50"
                    }`}
                  >
                    My Applications
                  </Link>
                  <button
                    className={`text-sm font-medium text-left px-3 py-2 rounded-lg ${
                      darkMode
                        ? "text-gray-300 hover:text-[#0084ca] hover:bg-gray-700"
                        : "text-gray-700 hover:text-[#0084ca] hover:bg-gray-50"
                    }`}
                  >
                    Deliver Works
                  </button>

                  {/* Network section in mobile */}
                  <div className={`pt-2 mt-1 border-t ${
                    darkMode ? "border-gray-700" : "border-gray-100"
                  }`}>
                    <p className={`text-xs font-semibold uppercase tracking-wider px-3 mb-2 ${
                      darkMode ? "text-gray-500" : "text-gray-400"
                    }`}>Network</p>
                    <Link
                      to={TALENT_ROUTES.NETWORK.path}
                      onClick={() => setMobileMenuOpen(false)}
                      className={`flex items-center gap-2 text-sm font-medium px-3 py-2 rounded-lg ${
                        location.pathname === TALENT_ROUTES.NETWORK.path
                          ? "bg-[#0084ca]/10 text-[#0084ca]"
                          : darkMode
                          ? "text-gray-300 hover:text-[#0084ca] hover:bg-gray-700"
                          : "text-gray-700 hover:text-[#0084ca] hover:bg-gray-50"
                      }`}
                    >
                      <Users className="w-4 h-4" /> My Network
                    </Link>
                    <Link
                      to={TALENT_ROUTES.DISCOVER.path}
                      onClick={() => setMobileMenuOpen(false)}
                      className={`flex items-center gap-2 text-sm font-medium px-3 py-2 rounded-lg ${
                        location.pathname === TALENT_ROUTES.DISCOVER.path
                          ? "bg-[#0084ca]/10 text-[#0084ca]"
                          : darkMode
                          ? "text-gray-300 hover:text-[#0084ca] hover:bg-gray-700"
                          : "text-gray-700 hover:text-[#0084ca] hover:bg-gray-50"
                      }`}
                    >
                      <Compass className="w-4 h-4" /> Discover Talents
                    </Link>
                  </div>
                </div>
              </div>
            )}

            <div className="hidden sm:block">
              <DropdownMenu
                userName={user?.name || "Current User"}
                userEmail={user?.email || "user@example.com"}
                userImage={userImage}
                userId={user?.id?.toString() || "current-user"}
                onImageUpload={onImageUpload}
                onLogout={handleLogout}
              />
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
