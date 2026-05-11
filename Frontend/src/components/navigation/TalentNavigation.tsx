import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useDarkMode } from "../../contexts/DarkModeContext";
import { useAuth } from "../../contexts/AuthContext";

export function TalentNavigation() {
  const { darkMode, toggleDarkMode } = useDarkMode();
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const isActive = (path: string) => location.pathname === path;

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const navItems = [
    { label: "Dashboard", path: "/talent-dashboard" },
    { label: "Network", path: "/talent-network" },
    { label: "Discover", path: "/discover-talents" },
    { label: "Messages", path: "/messages" },
    { label: "Profile", path: "/talent-profile" },
    { label: "Portfolio", path: "/portfolio" },
    { label: "Applications", path: "/my-applications" },
  ];

  const bgClass = darkMode ? "bg-gray-900 border-gray-800" : "bg-white border-gray-200";
  const textClass = darkMode ? "text-white" : "text-gray-900";
  const mutedClass = darkMode ? "text-gray-400" : "text-gray-600";
  const hoverClass = darkMode
    ? "hover:bg-gray-800 hover:text-white"
    : "hover:bg-gray-100 hover:text-gray-900";
  const activeClass = "text-blue-600 border-b-2 border-blue-600";

  return (
    <nav className={`${bgClass} border-b sticky top-0 z-40 transition-colors duration-300`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/talent-dashboard" className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-blue-800 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-lg">T</span>
            </div>
            <span className={`font-bold text-lg hidden sm:inline ${textClass}`}>
              ETN
            </span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-1">
            {navItems.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  isActive(item.path)
                    ? activeClass
                    : `${mutedClass} ${hoverClass}`
                }`}
              >
                {item.label}
              </Link>
            ))}
          </div>

          {/* Right side - Dark mode toggle and user menu */}
          <div className="flex items-center gap-4">
            {/* Dark mode toggle */}
            <button
              onClick={toggleDarkMode}
              className={`p-2 rounded-lg transition-colors ${hoverClass}`}
              title="Toggle dark mode"
            >
              {darkMode ? "☀️" : "🌙"}
            </button>

            {/* User menu */}
            <div className="flex items-center gap-2">
              {user && (
                <span className={`text-sm hidden sm:inline ${mutedClass}`}>
                  {user.name || user.email}
                </span>
              )}
              <button
                onClick={handleLogout}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm font-medium"
              >
                Logout
              </button>
            </div>

            {/* Mobile menu button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className={`md:hidden p-2 rounded-lg ${hoverClass}`}
            >
              {mobileMenuOpen ? "✕" : "☰"}
            </button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {mobileMenuOpen && (
          <div className={`md:hidden pb-4 space-y-2 ${darkMode ? "bg-gray-800" : "bg-gray-50"}`}>
            {navItems.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                onClick={() => setMobileMenuOpen(false)}
                className={`block px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  isActive(item.path)
                    ? `${activeClass} ${textClass}`
                    : `${mutedClass} ${hoverClass}`
                }`}
              >
                {item.label}
              </Link>
            ))}
          </div>
        )}
      </div>
    </nav>
  );
}
