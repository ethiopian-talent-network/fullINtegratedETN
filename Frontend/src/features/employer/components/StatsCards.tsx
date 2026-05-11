import React from "react";
import { Briefcase, CheckCircle, FileText, Users } from "lucide-react";
import type { EmployerStats } from "../types/employer.types";

interface StatsCardsProps {
  stats: EmployerStats;
  darkMode?: boolean;
}

const cards = [
  {
    key: "totalJobs" as const,
    label: "Total Jobs",
    icon: Briefcase,
    color: "blue",
    bg: "bg-blue-50",
    iconColor: "text-blue-600",
    darkBg: "bg-blue-900/20",
    darkIcon: "text-blue-400",
    border: "border-blue-100",
    darkBorder: "border-blue-900/30",
  },
  {
    key: "activeJobs" as const,
    label: "Active Jobs",
    icon: CheckCircle,
    color: "green",
    bg: "bg-emerald-50",
    iconColor: "text-emerald-600",
    darkBg: "bg-emerald-900/20",
    darkIcon: "text-emerald-400",
    border: "border-emerald-100",
    darkBorder: "border-emerald-900/30",
  },
  {
    key: "totalProposals" as const,
    label: "Applications",
    icon: FileText,
    color: "purple",
    bg: "bg-violet-50",
    iconColor: "text-violet-600",
    darkBg: "bg-violet-900/20",
    darkIcon: "text-violet-400",
    border: "border-violet-100",
    darkBorder: "border-violet-900/30",
  },
  {
    key: "activeContracts" as const,
    label: "Active Contracts",
    icon: Users,
    color: "orange",
    bg: "bg-amber-50",
    iconColor: "text-amber-600",
    darkBg: "bg-amber-900/20",
    darkIcon: "text-amber-400",
    border: "border-amber-100",
    darkBorder: "border-amber-900/30",
  },
];

export const StatsCards: React.FC<StatsCardsProps> = ({ stats, darkMode = false }) => {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
      {cards.map(({ key, label, icon: Icon, bg, iconColor, darkBg, darkIcon, border, darkBorder }) => (
        <div
          key={key}
          className={`rounded-xl border p-5 transition-shadow hover:shadow-md ${
            darkMode
              ? `bg-gray-800 border-gray-700`
              : `bg-white border-slate-200 shadow-sm`
          }`}
        >
          <div className="flex items-start justify-between">
            <div>
              <p className={`text-xs font-semibold uppercase tracking-wider mb-1 ${darkMode ? "text-gray-400" : "text-gray-600"}`}>
                {label}
              </p>
              <p className={`text-2xl sm:text-3xl font-bold ${darkMode ? "text-white" : "text-gray-900"}`}>
                {stats[key]}
              </p>
            </div>
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${darkMode ? darkBg : bg} border ${darkMode ? darkBorder : border}`}>
              <Icon className={`w-5 h-5 ${darkMode ? darkIcon : iconColor}`} />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};
