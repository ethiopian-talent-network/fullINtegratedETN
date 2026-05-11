import React, { useState, useRef, useEffect, useCallback } from "react";
import { useNavigate } from "react-router";
import { Plus, Bell, Moon, Sun, LogOut, Building2, User, ChevronDown, Briefcase, ShieldCheck, X, CheckCheck } from "lucide-react";
import { useDarkMode } from "../../../contexts/DarkModeContext";
import { useAuth } from "../../../contexts/AuthContext";
import { EMPLOYER_ROUTES } from "../../../config/routes";
import { API_BASE_URL } from "../../../config/api";

interface EmployerNotification {
  id: number;
  type: string;
  title: string;
  message: string;
  is_read: boolean;
  created_at: string;
  sender_name?: string;
  sender_image?: string;
}

const getAuthHeaders = (): Record<string, string> => {
  const token = localStorage.getItem("token");
  return token ? { Authorization: `Bearer ${token}` } : {};
};

export const Header: React.FC = () => {
  const { darkMode, toggleDarkMode } = useDarkMode();
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [profileImage, setProfileImage] = useState<string | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const [notifOpen, setNotifOpen] = useState(false);
  const [notifications, setNotifications] = useState<EmployerNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const notifRef = useRef<HTMLDivElement>(null);



  const fetchNotifications = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/notifications/employer`, {
        headers: { ...getAuthHeaders() },
      });
      if (!res.ok) return;
      const data = await res.json();
      setNotifications(data.notifications || []);
      setUnreadCount(data.unread_count || 0);
    } catch {}
  }, []);

  const markAllRead = async () => {
    try {
      await fetch(`${API_BASE_URL}/api/notifications/read-all`, {
        method: "POST", headers: { ...getAuthHeaders() },
      });
      setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
      setUnreadCount(0);
    } catch {}
  };

  const markOneRead = async (id: number) => {
    try {
      await fetch(`${API_BASE_URL}/api/notifications/${id}/read`, {
        method: "POST", headers: { ...getAuthHeaders() },
      });
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n));
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch {}
  };

  const getInitials = (name: string) =>
    name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);

  // Fetch employer profile image on mount
  useEffect(() => {
    const fetchImage = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/api/employer/employerProfile`, {
          headers: { "Content-Type": "application/json", ...getAuthHeaders() },
        });
        if (!res.ok) return;
        const data = await res.json();
        if (data.data?.profile_url) setProfileImage(data.data.profile_url);
      } catch {}
    };
    fetchImage();
  }, []);

  // Listen for profile image updates from the profile page
  useEffect(() => {
    const handler = (e: CustomEvent) => setProfileImage(e.detail);
    window.addEventListener("employer-profile-updated" as any, handler);
    return () => window.removeEventListener("employer-profile-updated" as any, handler);
  }, []);

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }, [fetchNotifications]);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setNotifOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const dm = darkMode;

  return (
    <header className={`sticky top-0 z-40 border-b ${dm ? "bg-gray-900 border-gray-800" : "bg-white border-gray-200"}`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">

          {/* Logo */}
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-gradient-to-br from-[#0084ca] to-[#006ba6] rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">E</span>
            </div>
            <span className={`text-lg font-bold ${dm ? "text-white" : "text-gray-900"}`}>
              ETN<span className="text-[#0084ca]">.</span>
            </span>
          </div>

          {/* Right actions */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => navigate(EMPLOYER_ROUTES.POST_JOB.path)}
              className="flex items-center gap-2 px-3 sm:px-4 py-2 bg-[#0084ca] hover:bg-[#006ba6] text-white text-sm font-semibold rounded-lg transition-colors"
            >
              <Plus className="w-4 h-4 flex-shrink-0" />
              <span className="hidden sm:inline">Post a Job</span>
            </button>

            <button
              onClick={toggleDarkMode}
              className={`p-2 rounded-lg transition-colors ${dm ? "text-gray-400 hover:text-white hover:bg-gray-800" : "text-gray-500 hover:text-gray-900 hover:bg-gray-100"}`}
            >
              {dm ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            </button>

            <div className="relative" ref={notifRef}>
              <button
                onClick={() => setNotifOpen(o => !o)}
                className={`relative p-2 rounded-lg transition-colors ${dm ? "text-gray-400 hover:text-white hover:bg-gray-800" : "text-gray-500 hover:text-gray-900 hover:bg-gray-100"}`}
              >
                <Bell className="w-5 h-5" />
                {unreadCount > 0 && (
                  <span className="absolute top-1 right-1 min-w-[16px] h-4 px-0.5 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                    {unreadCount > 9 ? "9+" : unreadCount}
                  </span>
                )}
              </button>

              {notifOpen && (
                <div className={`absolute right-0 top-full mt-2 w-80 rounded-xl shadow-2xl border z-50 overflow-hidden ${dm ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200"}`}>
                  <div className={`flex items-center justify-between px-4 py-3 border-b ${dm ? "border-gray-700" : "border-gray-100"}`}>
                    <h3 className={`font-semibold text-sm ${dm ? "text-white" : "text-gray-900"}`}>Notifications</h3>
                    {unreadCount > 0 && (
                      <button onClick={markAllRead} className="text-xs text-[#0084ca] hover:underline">
                        Mark all read
                      </button>
                    )}
                  </div>

                  <div className="max-h-96 overflow-y-auto">
                    {notifications.length === 0 ? (
                      <div className={`text-center py-10 text-sm ${dm ? "text-gray-500" : "text-gray-400"}`}>
                        <Bell className="w-8 h-8 mx-auto mb-2 opacity-30" />
                        No notifications
                      </div>
                    ) : (
                      notifications.map((notif) => (
                        <div
                          key={notif.id}
                          onClick={() => {
                            markOneRead(notif.id);
                            if (notif.type === "new_application") {
                              setNotifOpen(false);
                              navigate(EMPLOYER_ROUTES.ALL_PROPOSALS.path);
                            }
                          }}
                          className={`px-4 py-3 border-b last:border-0 cursor-pointer ${dm ? "border-gray-700 hover:bg-gray-700" : "border-gray-50 hover:bg-gray-50"} ${!notif.is_read ? (dm ? "bg-blue-900/20" : "bg-blue-50/60") : ""}`}
                        >
                          <div className="flex items-start gap-3">
                            {notif.sender_image ? (
                              <img src={notif.sender_image} alt={notif.sender_name} className="w-9 h-9 rounded-full object-cover flex-shrink-0" />
                            ) : (
                              <div className="w-9 h-9 rounded-full bg-gradient-to-br from-[#0084ca] to-purple-600 flex items-center justify-center flex-shrink-0">
                                <Briefcase className="w-4 h-4 text-white" />
                              </div>
                            )}
                            <div className="flex-1 min-w-0">
                              <p className={`text-sm font-medium leading-snug ${dm ? "text-white" : "text-gray-900"}`}>{notif.title}</p>
                              <p className={`text-xs mt-0.5 ${dm ? "text-gray-400" : "text-gray-500"}`}>{notif.message}</p>
                              <p className={`text-xs mt-1 ${dm ? "text-gray-500" : "text-gray-400"}`}>{new Date(notif.created_at).toLocaleDateString()}</p>
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

            <div className={`h-6 w-px mx-1 ${dm ? "bg-gray-700" : "bg-gray-200"}`} />

            {/* Avatar dropdown */}
            <div className="relative" ref={dropdownRef}>
              <button
                onClick={() => setDropdownOpen((o) => !o)}
                className={`flex items-center gap-2 px-2 py-1.5 rounded-lg transition-colors ${
                  dm ? "hover:bg-gray-800" : "hover:bg-gray-100"
                }`}
              >
                <div className="w-8 h-8 rounded-full overflow-hidden flex-shrink-0 ring-2 ring-[#0084ca]/30">
                  {profileImage ? (
                    <img src={profileImage} alt={user?.name || ""} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-[#0084ca] to-[#006ba6] flex items-center justify-center">
                      <span className="text-white text-xs font-bold">{getInitials(user?.name || "E")}</span>
                    </div>
                  )}
                </div>
                <span className={`text-sm font-medium hidden sm:block ${dm ? "text-gray-300" : "text-gray-700"}`}>
                  {user?.name}
                </span>
                <ChevronDown className={`w-3.5 h-3.5 hidden sm:block transition-transform duration-200 ${
                  dropdownOpen ? "rotate-180" : ""
                } ${dm ? "text-gray-400" : "text-gray-500"}`} />
              </button>

              {dropdownOpen && (
                <div className={`absolute right-0 top-full mt-2 w-52 rounded-xl shadow-2xl border z-50 overflow-hidden ${
                  dm ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200"
                }`}>
                  {/* User info */}
                  <div className={`px-4 py-3 border-b ${dm ? "border-gray-700" : "border-gray-100"}`}>
                    <div className="flex items-center gap-3 mb-2">
                      <div className="w-10 h-10 rounded-full overflow-hidden flex-shrink-0 ring-2 ring-[#0084ca]/20">
                        {profileImage ? (
                          <img src={profileImage} alt={user?.name || ""} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full bg-gradient-to-br from-[#0084ca] to-[#006ba6] flex items-center justify-center">
                            <span className="text-white text-sm font-bold">{getInitials(user?.name || "E")}</span>
                          </div>
                        )}
                      </div>
                      <div className="min-w-0">
                        <p className={`text-sm font-semibold truncate ${dm ? "text-white" : "text-gray-900"}`}>
                          {user?.name}
                        </p>
                        <p className={`text-xs truncate mt-0.5 ${dm ? "text-gray-400" : "text-gray-500"}`}>
                          {user?.email}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Menu items */}
                  <div className="py-1.5">
                    <button
                      onClick={() => { navigate(EMPLOYER_ROUTES.PROFILE.path); setDropdownOpen(false); }}
                      className={`flex items-center gap-3 w-full px-4 py-2.5 text-sm transition-colors ${
                        dm
                          ? "text-gray-300 hover:bg-gray-700 hover:text-white"
                          : "text-gray-700 hover:bg-gray-50 hover:text-gray-900"
                      }`}
                    >
                      <Building2 className="w-4 h-4 flex-shrink-0" />
                      Company Profile
                    </button>

                    <button
                      onClick={() => { navigate(EMPLOYER_ROUTES.DASHBOARD.path); setDropdownOpen(false); }}
                      className={`flex items-center gap-3 w-full px-4 py-2.5 text-sm transition-colors ${
                        dm
                          ? "text-gray-300 hover:bg-gray-700 hover:text-white"
                          : "text-gray-700 hover:bg-gray-50 hover:text-gray-900"
                      }`}
                    >
                      <User className="w-4 h-4 flex-shrink-0" />
                      Dashboard
                    </button>
                  </div>

                  {/* Logout */}
                  <div className={`border-t py-1.5 ${dm ? "border-gray-700" : "border-gray-100"}`}>
                    <button
                      onClick={() => { logout(); navigate("/login"); }}
                      className={`flex items-center gap-3 w-full px-4 py-2.5 text-sm transition-colors ${
                        dm ? "text-red-400 hover:bg-red-900/30" : "text-red-600 hover:bg-red-50"
                      }`}
                    >
                      <LogOut className="w-4 h-4 flex-shrink-0" />
                      Log Out
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};
