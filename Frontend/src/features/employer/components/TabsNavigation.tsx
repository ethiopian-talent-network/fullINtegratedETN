import React from "react";
import { Briefcase, FileText, Users, ScrollText } from "lucide-react";
import type { TabType } from "../types/employer.types";

interface TabsNavigationProps {
  activeTab: TabType;
  setActiveTab: (tab: TabType) => void;
  darkMode?: boolean;
  counts?: { jobs?: number; proposals?: number; talents?: number; contracts?: number };
}

const tabs: { id: TabType; label: string; icon: React.ElementType }[] = [
  { id: "jobs", label: "My Jobs", icon: Briefcase },
  { id: "proposals", label: "Applications", icon: FileText },
  { id: "talents", label: "Talent Pool", icon: Users },
  { id: "contracts", label: "Contracts", icon: ScrollText },
];

export const TabsNavigation: React.FC<TabsNavigationProps> = ({
  activeTab,
  setActiveTab,
  darkMode = false,
  counts = {},
}) => {
  return (
    <div className={`flex items-center gap-1 p-1 rounded-xl overflow-x-auto scrollbar-hide ${darkMode ? "bg-gray-800" : "bg-slate-200"}`}>
      {tabs.map(({ id, label, icon: Icon }) => {
        const count = counts[id];
        const isActive = activeTab === id;
        return (
          <button
            key={id}
            onClick={() => setActiveTab(id)}
            className={`flex items-center gap-1.5 px-3 sm:px-4 py-2 rounded-lg text-xs sm:text-sm font-medium transition-all whitespace-nowrap flex-shrink-0 ${
              isActive
                ? "bg-white shadow-sm text-[#0084ca] dark:bg-gray-700 dark:text-[#60b4e8]"
                : darkMode
                  ? "text-gray-400 hover:text-gray-200"
                  : "text-gray-600 hover:text-gray-900"
            }`}
            style={isActive && !darkMode ? { backgroundColor: "white" } : {}}
          >
            <Icon className="w-4 h-4" />
            <span className="hidden xs:inline sm:inline">{label}</span>
            {count !== undefined && count > 0 && (
              <span className={`px-1.5 py-0.5 text-xs rounded-full font-semibold ${
                isActive
                  ? "bg-[#0084ca]/10 text-[#0084ca]"
                  : darkMode ? "bg-gray-700 text-gray-400" : "bg-slate-300 text-gray-600"
              }`}>
                {count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
};
