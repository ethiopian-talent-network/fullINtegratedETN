import { useState, useRef, useEffect } from "react";
import { Link } from "react-router";
import {
  User,
  Settings,
  Bell,
  LogOut,
  Camera,
  CreditCard,
  HelpCircle,
  Shield,
} from "lucide-react";
import { useDarkMode } from "../../contexts/DarkModeContext";

interface DropdownMenuProps {
  userName: string;
  userEmail: string;
  userImage?: string;
  userId?: string;
  onImageUpload?: (file: File) => void;
  onLogout?: () => void;
}

export default function DropdownMenu({
  userName,
  userEmail,
  userImage,
  userId,
  onImageUpload,
  onLogout,
}: DropdownMenuProps) {
  const { darkMode } = useDarkMode();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && onImageUpload) {
      if (!file.type.startsWith("image/")) {
        alert("Please select a valid image file");
        return;
      }
      if (file.size > 5 * 1024 * 1024) {
        alert("Image size should be less than 5MB");
        return;
      }
      onImageUpload(file);
    }
    setIsOpen(false);
  };

  const menuItems = [
    {
      icon: User,
      label: "Profile",
      href: userId ? `/talent-profile/${userId}` : "/talent-profile",
      description: "View and edit your profile",
    },
    {
      icon: CreditCard,
      label: "Billing",
      href: "/billing",
      description: "Manage payment methods",
    },
    {
      icon: Bell,
      label: "Notifications",
      href: "/notifications",
      description: "Configure notifications",
    },
    {
      icon: Settings,
      label: "Settings",
      href: "/settings",
      description: "Account and preferences",
    },
    {
      icon: Shield,
      label: "Privacy & Security",
      href: "/security",
      description: "Manage your security settings",
    },
    {
      icon: HelpCircle,
      label: "Help & Support",
      href: "/help",
      description: "Get help and contact support",
    },
  ];

  const dm = darkMode;

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Trigger Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`flex items-center gap-2 p-1 rounded-full transition-colors ${
          dm ? "hover:bg-gray-700" : "hover:bg-gray-100"
        }`}
        aria-label="Profile menu"
        aria-expanded={isOpen}
      >
        <div className="relative">
          {userImage ? (
            <img
              src={userImage}
              alt={userName}
              className="w-8 h-8 rounded-full object-cover ring-2 ring-[#0084ca]/30"
            />
          ) : (
            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
              dm ? "bg-gray-700" : "bg-gray-200"
            }`}>
              <User className={`w-5 h-5 ${dm ? "text-gray-300" : "text-gray-600"}`} />
            </div>
          )}
          <div className={`absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-500 rounded-full border-2 ${
            dm ? "border-gray-800" : "border-white"
          }`} />
        </div>
      </button>

      {/* Dropdown */}
      {isOpen && (
        <div className={`absolute right-0 mt-2 w-64 rounded-xl shadow-2xl border z-50 overflow-hidden ${
          dm
            ? "bg-gray-800 border-gray-700 shadow-black/40"
            : "bg-white border-gray-200 shadow-gray-200/80"
        }`}>

          {/* User Info Header */}
          <div className={`p-4 border-b ${dm ? "border-gray-700" : "border-gray-100"}`}>
            <div className="flex items-center gap-3">
              <div className="relative flex-shrink-0">
                {userImage ? (
                  <img
                    src={userImage}
                    alt={userName}
                    className="w-11 h-11 rounded-full object-cover ring-2 ring-[#0084ca]/30"
                  />
                ) : (
                  <div className={`w-11 h-11 rounded-full flex items-center justify-center ${
                    dm ? "bg-gray-700" : "bg-gray-100"
                  }`}>
                    <User className={`w-5 h-5 ${dm ? "text-gray-300" : "text-gray-500"}`} />
                  </div>
                )}
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="absolute bottom-0 right-0 w-5 h-5 bg-[#0084ca] rounded-full flex items-center justify-center hover:bg-[#006ba6] transition-colors shadow"
                  title="Change profile picture"
                >
                  <Camera className="w-2.5 h-2.5 text-white" />
                </button>
              </div>
              <div className="flex-1 min-w-0">
                <p className={`text-sm font-semibold truncate ${dm ? "text-white" : "text-gray-900"}`}>
                  {userName}
                </p>
                <p className={`text-xs truncate mt-0.5 ${dm ? "text-gray-400" : "text-gray-500"}`}>
                  {userEmail}
                </p>
                <span className="inline-flex items-center gap-1 mt-1 text-xs text-green-500 font-medium">
                  <span className="w-1.5 h-1.5 rounded-full bg-green-500 inline-block" />
                  Online
                </span>
              </div>
            </div>
          </div>

          {/* Menu Items */}
          <div className="py-1.5">
            {menuItems.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.label}
                  to={item.href}
                  onClick={() => setIsOpen(false)}
                  className={`flex items-center gap-3 px-3 py-2.5 transition-colors group ${
                    dm
                      ? "hover:bg-gray-700 text-gray-300 hover:text-white"
                      : "hover:bg-gray-50 text-gray-700 hover:text-gray-900"
                  }`}
                >
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center transition-colors flex-shrink-0 ${
                    dm
                      ? "bg-gray-700 group-hover:bg-gray-600"
                      : "bg-gray-100 group-hover:bg-gray-200"
                  }`}>
                    <Icon className={`w-4 h-4 ${dm ? "text-gray-400 group-hover:text-gray-200" : "text-gray-500 group-hover:text-gray-700"}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium">{item.label}</p>
                    <p className={`text-xs truncate ${dm ? "text-gray-500" : "text-gray-400"}`}>
                      {item.description}
                    </p>
                  </div>
                </Link>
              );
            })}
          </div>

          {/* Logout */}
          <div className={`border-t p-1.5 ${dm ? "border-gray-700" : "border-gray-100"}`}>
            <button
              onClick={() => {
                onLogout?.();
                setIsOpen(false);
              }}
              className={`flex items-center gap-3 w-full px-3 py-2.5 rounded-lg transition-colors group ${
                dm ? "hover:bg-red-900/30" : "hover:bg-red-50"
              }`}
            >
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center transition-colors flex-shrink-0 ${
                dm
                  ? "bg-red-900/40 group-hover:bg-red-900/60"
                  : "bg-red-100 group-hover:bg-red-200"
              }`}>
                <LogOut className="w-4 h-4 text-red-500" />
              </div>
              <p className="text-sm font-medium text-red-500">Log Out</p>
            </button>
          </div>
        </div>
      )}

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleImageUpload}
        className="hidden"
      />
    </div>
  );
}
