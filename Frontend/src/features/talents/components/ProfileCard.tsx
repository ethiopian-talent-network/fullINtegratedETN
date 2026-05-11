import { useState, useEffect, useCallback } from "react";
import { Link } from "react-router";
import { useAuth } from "../../../contexts/AuthContext";
import { profileService } from "../../../api/profile/profileService";
import { getUserApplications } from "../../../api/jobs/jobApi";
import { getVerificationStatus } from "../../../api/talent/talentApi";
import { TALENT_ROUTES } from "../../../config/routes";
import type { ProfileData } from "../../../types/profile";
import { CheckCircle, Circle, ChevronRight, ShieldCheck } from "lucide-react";

interface ProfileCardProps {
  darkMode: boolean;
}

interface ChecklistItem {
  label: string;
  done: boolean;
  to: string;
}

const getInitials = (name: string) =>
  name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);

const buildChecklist = (profile: ProfileData, hasApplied: boolean, isVerified: boolean): ChecklistItem[] => [
  {
    label: "Complete your profile",
    done: !!(profile.name?.trim() && profile.location?.trim() && profile.hourlyRate?.trim()),
    to: TALENT_ROUTES.PROFILE.path,
  },
  {
    label: "Add your skills",
    done: profile.skills?.length > 0,
    to: TALENT_ROUTES.PROFILE.path,
  },
  {
    label: "Add portfolio projects",
    done: profile.portfolio?.length > 0,
    to: TALENT_ROUTES.PORTFOLIO.path,
  },
  {
    label: "Add certificates",
    done: profile.certifications?.length > 0,
    to: TALENT_ROUTES.PROFILE.path,
  },
  {
    label: "Get identity verified",
    done: isVerified,
    to: TALENT_ROUTES.VERIFY_IDENTITY.path,
  },
  {
    label: "Apply for a job",
    done: hasApplied,
    to: TALENT_ROUTES.DASHBOARD.path,
  },
];

export function ProfileCard({ darkMode: dm }: ProfileCardProps) {
  const { user } = useAuth();
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [hasApplied, setHasApplied] = useState(false);
  const [isVerified, setIsVerified] = useState(false);
  const [verifPending, setVerifPending] = useState(false);
  const [loading, setLoading] = useState(true);

  const loadProfile = useCallback(async () => {
    try {
      const cached = profileService.getCachedProfile();
      if (cached) { setProfile(cached); setLoading(false); }
      const [fresh, appsRes, verifRes] = await Promise.all([
        profileService.getProfile(false),
        getUserApplications({ page: 1, limit: 1 }).catch(() => ({ applications: [] })),
        getVerificationStatus().catch(() => null),
      ]);
      setProfile(fresh);
      setHasApplied((appsRes.applications?.length ?? 0) > 0);
      if (verifRes) {
        setIsVerified(verifRes.is_verified);
        setVerifPending(verifRes.request?.status === "pending");
      }
    } catch {}
    finally { setLoading(false); }
  }, []);

  useEffect(() => { loadProfile(); }, [loadProfile]);

  if (loading) {
    return (
      <div className={`rounded-xl border shadow-sm p-5 animate-pulse ${dm ? "bg-gray-800 border-gray-700" : "bg-white border-slate-200"}`}>
        <div className="flex items-center gap-3 mb-4">
          <div className="w-12 h-12 rounded-full bg-gray-200 dark:bg-gray-700 flex-shrink-0" />
          <div className="flex-1 space-y-2">
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4" />
            <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/2" />
          </div>
        </div>
        <div className="space-y-2">
          <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded w-full" />
          <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-2/3" />
        </div>
      </div>
    );
  }

  const checklist = profile ? buildChecklist(profile, hasApplied, isVerified) : [];
  const doneCount = checklist.filter((i) => i.done).length;
  const total = checklist.length;
  const pct = Math.round((doneCount / total) * 100);

  const barColor =
    pct === 100 ? "bg-emerald-500" :
    pct >= 75   ? "bg-[#0084ca]" :
    pct >= 50   ? "bg-yellow-500" :
                  "bg-orange-500";

  const pctColor =
    pct === 100 ? "text-emerald-500" :
    pct >= 75   ? "text-[#0084ca]" :
    pct >= 50   ? "text-yellow-500" :
                  "text-orange-500";

  return (
    <div className={`rounded-xl border shadow-sm overflow-hidden ${dm ? "bg-gray-800 border-gray-700" : "bg-white border-slate-200"}`}>

      {/* Avatar + name */}
      <div className={`px-5 pt-5 pb-4 border-b ${dm ? "border-gray-700" : "border-slate-100"}`}>
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-full overflow-hidden flex-shrink-0 bg-gradient-to-br from-[#0084ca] to-violet-500 flex items-center justify-center shadow-sm">
            {profile?.image || profile?.profile_image ? (
              <img src={profile.image || profile.profile_image} alt={profile.name} className="w-full h-full object-cover" />
            ) : (
              <span className="text-white text-sm font-bold">
                {getInitials(profile?.name || user?.name || "U")}
              </span>
            )}
          </div>
          <div className="min-w-0">
            <p className={`text-sm font-bold truncate ${dm ? "text-white" : "text-gray-900"}`}>
              {profile?.name || user?.name || "Your Name"}
            </p>
            <p className={`text-xs truncate ${dm ? "text-gray-400" : "text-gray-500"}`}>
              {profile?.location || "Add your location"}
            </p>
          </div>
        </div>
      </div>

      {/* Progress */}
      <div className="px-5 pt-4 pb-3">
        <div className="flex items-center justify-between mb-2">
          <p className={`text-xs font-semibold ${dm ? "text-gray-300" : "text-gray-700"}`}>
            Profile Progress
          </p>
          <span className={`text-sm font-bold ${pctColor}`}>{pct}%</span>
        </div>
        <div className={`w-full h-1.5 rounded-full ${dm ? "bg-gray-700" : "bg-slate-100"}`}>
          <div
            className={`h-1.5 rounded-full transition-all duration-500 ${barColor}`}
            style={{ width: `${pct}%` }}
          />
        </div>
        <p className={`text-xs mt-1.5 ${dm ? "text-gray-500" : "text-gray-400"}`}>
          {pct === 100 ? "Profile completed! 🎉" : `${doneCount} of ${total} steps completed`}
        </p>
      </div>

      {/* Checklist - Only show if not 100% complete */}
      {pct < 100 && (
        <div className={`px-5 pb-5 space-y-1`}>
          {checklist.map(({ label, done, to }) => (
            <Link
              key={label}
              to={to}
              className={`flex items-center gap-2.5 px-3 py-2.5 rounded-lg transition-colors group ${
                done
                  ? dm ? "opacity-60 hover:opacity-80" : "opacity-60 hover:opacity-80"
                  : dm ? "hover:bg-gray-700" : "hover:bg-slate-50"
              }`}
            >
              {done ? (
                <CheckCircle className="w-4 h-4 text-emerald-500 flex-shrink-0" />
              ) : label === "Get identity verified" && verifPending ? (
                <ShieldCheck className="w-4 h-4 text-amber-400 flex-shrink-0" />
              ) : (
                <Circle className={`w-4 h-4 flex-shrink-0 ${dm ? "text-gray-600" : "text-gray-300"}`} />
              )}
              <span className={`text-xs flex-1 font-medium ${
                done
                  ? dm ? "text-gray-400 line-through" : "text-gray-400 line-through"
                  : label === "Get identity verified" && verifPending
                  ? "text-amber-400"
                  : dm ? "text-gray-200" : "text-gray-700"
              }`}>
                {label}{label === "Get identity verified" && verifPending ? " (pending review)" : ""}
              </span>
              {!done && (
                <ChevronRight className={`w-3.5 h-3.5 flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity ${dm ? "text-gray-400" : "text-gray-400"}`} />
              )}
            </Link>
          ))}
        </div>
      )}

    </div>
  );
}
