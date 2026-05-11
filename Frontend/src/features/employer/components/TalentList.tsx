import React, { useState, useMemo } from "react";
import { Search, MapPin, DollarSign, Star, ChevronRight } from "lucide-react";
import type { Talent } from "../types/employer.types";

interface TalentListProps {
  talents: Talent[];
  loading?: boolean;
  error?: string | null;
  darkMode?: boolean;
  onInviteTalent?: (talent: Talent) => void;
  onViewProfile?: (talentId: number) => void;
}

const getInitials = (name: string) =>
  name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);

const avatarColors = [
  "from-blue-500 to-blue-700",
  "from-violet-500 to-violet-700",
  "from-emerald-500 to-emerald-700",
  "from-amber-500 to-amber-700",
  "from-rose-500 to-rose-700",
  "from-cyan-500 to-cyan-700",
];

export const TalentList: React.FC<TalentListProps> = ({
  talents, loading = false, error = null, darkMode = false,
  onInviteTalent, onViewProfile,
}) => {
  const dm = darkMode;
  const [search, setSearch] = useState("");
  const [skillFilter, setSkillFilter] = useState("");

  const allSkills = useMemo(() => {
    const set = new Set<string>();
    talents.forEach((t) => t.skills?.forEach((s) => set.add(s)));
    return Array.from(set).sort().slice(0, 20);
  }, [talents]);

  const filtered = useMemo(() => {
    let list = [...talents];
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(
        (t) => t.name.toLowerCase().includes(q) ||
          t.profile_title?.toLowerCase().includes(q) ||
          t.skills?.some((s) => s.toLowerCase().includes(q))
      );
    }
    if (skillFilter) list = list.filter((t) => t.skills?.includes(skillFilter));
    return list;
  }, [talents, search, skillFilter]);

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {[...Array(6)].map((_, i) => (
          <div key={i} className={`rounded-xl border p-5 animate-pulse ${dm ? "bg-gray-800 border-gray-700" : "bg-white border-slate-200"}`}>
            <div className="flex items-center gap-3 mb-4">
              <div className={`w-12 h-12 rounded-full ${dm ? "bg-gray-700" : "bg-gray-200"}`} />
              <div className="flex-1 space-y-2">
                <div className={`h-3.5 rounded w-2/3 ${dm ? "bg-gray-700" : "bg-gray-200"}`} />
                <div className={`h-3 rounded w-1/2 ${dm ? "bg-gray-700" : "bg-gray-200"}`} />
              </div>
            </div>
            <div className={`h-3 rounded w-full mb-2 ${dm ? "bg-gray-700" : "bg-gray-200"}`} />
            <div className={`h-3 rounded w-4/5 ${dm ? "bg-gray-700" : "bg-gray-200"}`} />
          </div>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className={`rounded-xl border p-8 text-center text-sm ${dm ? "bg-gray-800 border-gray-700 text-red-400" : "bg-red-50 border-red-200 text-red-600"}`}>
        {error}
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className={`flex items-center gap-2 flex-1 px-3 py-2.5 rounded-lg border text-sm ${dm ? "bg-gray-800 border-gray-700" : "bg-white border-slate-300 shadow-sm"}`}>
          <Search className="w-4 h-4 text-gray-400 flex-shrink-0" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name, title, or skill..."
            className={`flex-1 bg-transparent outline-none ${dm ? "text-white placeholder-gray-500" : "text-gray-900 placeholder-gray-400"}`}
          />
        </div>
        <select
          value={skillFilter}
          onChange={(e) => setSkillFilter(e.target.value)}
          className={`px-3 py-2.5 rounded-lg border text-sm outline-none ${dm ? "bg-gray-800 border-gray-700 text-white" : "bg-white border-slate-300 text-gray-800 shadow-sm"}`}
        >
          <option value="">All Skills</option>
          {allSkills.map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
      </div>

      {/* Count */}
      <p className={`text-xs font-medium ${dm ? "text-gray-500" : "text-gray-400"}`}>
        {filtered.length} talent{filtered.length !== 1 ? "s" : ""} found
      </p>

      {filtered.length === 0 ? (
        <div className={`rounded-xl border py-16 text-center ${dm ? "bg-gray-800 border-gray-700" : "bg-white border-slate-200 shadow-sm"}`}>
          <div className={`w-14 h-14 rounded-full mx-auto mb-4 flex items-center justify-center ${dm ? "bg-gray-700" : "bg-gray-100"}`}>
            <Search className={`w-6 h-6 ${dm ? "text-gray-500" : "text-gray-400"}`} />
          </div>
          <p className={`text-sm font-medium ${dm ? "text-gray-300" : "text-gray-700"}`}>No talents match your filters</p>
          <p className={`text-xs mt-1 ${dm ? "text-gray-500" : "text-gray-400"}`}>Try adjusting your search or skill filter</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filtered.map((talent, idx) => (
            <div
              key={talent.id}
              onClick={() => onViewProfile?.(talent.id)}
              className={`group relative cursor-pointer rounded-xl border transition-all duration-200 hover:shadow-lg hover:-translate-y-0.5 ${
                dm ? "bg-gray-800 border-gray-700 hover:border-gray-600" : "bg-white border-slate-200 shadow-sm hover:border-[#0084ca]/40 hover:shadow-[#0084ca]/10"
              }`}
            >
              {/* Top accent line */}
              <div className="absolute top-0 left-0 right-0 h-0.5 rounded-t-xl bg-gradient-to-r from-[#0084ca] to-[#006ba6] opacity-0 group-hover:opacity-100 transition-opacity" />

              <div className="p-5">
                {/* Header */}
                <div className="flex items-start gap-3 mb-4">
                  <div className="relative flex-shrink-0">
                    {talent.profile_image ? (
                      <img src={talent.profile_image} alt={talent.name}
                        className="w-12 h-12 rounded-full object-cover ring-2 ring-offset-2 ring-[#0084ca]/20" />
                    ) : (
                      <div className={`w-12 h-12 rounded-full flex items-center justify-center text-sm font-bold text-white bg-gradient-to-br ${avatarColors[idx % avatarColors.length]}`}>
                        {getInitials(talent.name)}
                      </div>
                    )}
                    <span className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-emerald-400 border-2 border-white dark:border-gray-800 rounded-full" />
                  </div>

                  <div className="flex-1 min-w-0">
                    <h3 className={`text-sm font-bold truncate group-hover:text-[#0084ca] transition-colors ${dm ? "text-white" : "text-gray-900"}`}>
                      {talent.name}
                    </h3>
                    <p className={`text-xs truncate mt-0.5 ${dm ? "text-[#60b4e8]" : "text-[#0084ca]"}`}>
                      {talent.profile_title || "Talent"}
                    </p>
                  </div>

                  {talent.hourly_rate && (
                    <div className={`flex-shrink-0 flex items-center gap-0.5 text-xs font-semibold px-2 py-1 rounded-lg ${dm ? "bg-emerald-900/30 text-emerald-400" : "bg-emerald-50 text-emerald-700"}`}>
                      <DollarSign className="w-3 h-3" />
                      {talent.hourly_rate}/hr
                    </div>
                  )}
                </div>

                {/* Meta */}
                <div className={`flex flex-wrap gap-x-3 gap-y-1 text-xs mb-4 ${dm ? "text-gray-400" : "text-gray-500"}`}>
                  {talent.location && (
                    <span className="flex items-center gap-1">
                      <MapPin className="w-3 h-3" />{talent.location}
                    </span>
                  )}
                  <span className="flex items-center gap-1">
                    <Star className="w-3 h-3 text-amber-400" />
                    Available
                  </span>
                </div>

                {/* Skills */}
                {talent.skills && talent.skills.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mb-4">
                    {talent.skills.slice(0, 4).map((skill, i) => (
                      <span key={i} className={`px-2 py-0.5 rounded-md text-xs font-medium ${
                        dm ? "bg-gray-700 text-gray-300" : "bg-slate-100 text-gray-700"
                      }`}>
                        {skill}
                      </span>
                    ))}
                    {talent.skills.length > 4 && (
                      <span className={`px-2 py-0.5 rounded-md text-xs ${dm ? "text-gray-500" : "text-gray-400"}`}>
                        +{talent.skills.length - 4}
                      </span>
                    )}
                  </div>
                )}

                {/* Footer */}
                <div className={`flex items-center justify-between pt-3 border-t ${dm ? "border-gray-700" : "border-slate-200"}`}>
                  <span className={`text-xs ${dm ? "text-gray-500" : "text-gray-400"}`}>
                    Joined {new Date(talent.created_at).toLocaleDateString("en-US", { month: "short", year: "numeric" })}
                  </span>
                  <span className={`flex items-center gap-1 text-xs font-semibold ${dm ? "text-[#60b4e8]" : "text-[#0084ca]"}`}>
                    View Profile <ChevronRight className="w-3.5 h-3.5" />
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
