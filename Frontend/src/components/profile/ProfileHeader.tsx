import { useState } from "react";
import { Camera, MapPin, DollarSign, Loader, Edit3, Save, X } from "lucide-react";
import type { ProfileData } from "../../types/profile";
import { LocationSelector } from "./LocationSelector";

interface ProfileHeaderProps {
  profile: ProfileData;
  isEditing: boolean;
  onEdit: () => void;
  onSave: () => void;
  onCancel: () => void;
  onProfileChange: (p: ProfileData) => void;
  onImageUpload: (file: File) => Promise<string>;
  completionPercentage: number;
  darkMode: boolean;
}

export function ProfileHeader({
  profile,
  isEditing,
  onEdit,
  onSave,
  onCancel,
  onProfileChange,
  onImageUpload,
  completionPercentage,
  darkMode,
}: ProfileHeaderProps) {
  const [uploading, setUploading] = useState(false);
  const dm = darkMode;

  const handleChange = (field: keyof ProfileData, value: string) =>
    onProfileChange({ ...profile, [field]: value });

  const handleFileChange = async (file: File) => {
    if (!file) return;
    try {
      setUploading(true);
      const url = await onImageUpload(file);
      onProfileChange({ ...profile, image: url });
    } catch (err) {
      console.error("Upload failed", err);
    } finally {
      setUploading(false);
    }
  };

  const getInitials = (name: string) =>
    name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);

  const circumference = 2 * Math.PI * 28;
  const strokeDashoffset = circumference - (completionPercentage / 100) * circumference;
  const completionColor =
    completionPercentage === 100 ? "#22c55e" :
    completionPercentage >= 75  ? "#3b82f6" :
    completionPercentage >= 50  ? "#f59e0b" : "#f97316";

  return (
    <div className={`relative rounded-2xl overflow-hidden ${dm ? "bg-gray-800 border border-gray-700" : "bg-white border border-gray-100 shadow-sm"}`}>

      {/* ── Banner ── */}
      <div className="h-28 bg-gradient-to-r from-[#0084ca] via-[#0099e6] to-purple-600 relative">
        {/* dot pattern */}
        <div className="absolute inset-0 opacity-10"
          style={{ backgroundImage: "radial-gradient(circle at 20% 50%, white 1px, transparent 1px), radial-gradient(circle at 80% 20%, white 1px, transparent 1px)", backgroundSize: "36px 36px" }}
        />

        {/* Edit / Save / Cancel — pinned top-right INSIDE banner, always on top */}
        <div className="absolute top-1/2 right-4 z-10 flex items-center gap-2">
          {isEditing ? (
            <>
              <button
                onClick={onCancel}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-white/20 hover:bg-white/30 text-white backdrop-blur-sm border border-white/30 transition-colors"
              >
                <X className="w-3.5 h-3.5" /> Cancel
              </button>
              <button
                onClick={onSave}
                disabled={uploading}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-white text-[#0084ca] hover:bg-white/90 shadow transition-colors disabled:opacity-60"
              >
                {uploading
                  ? <Loader className="w-3.5 h-3.5 animate-spin" />
                  : <Save className="w-3.5 h-3.5" />}
                Save
              </button>
            </>
          ) : (
            <button
              onClick={onEdit}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-white/20 hover:bg-white/30 text-white backdrop-blur-sm border border-white/30 transition-colors"
            >
              <Edit3 className="w-3.5 h-3.5" /> Edit Profile
            </button>
          )}
        </div>
      </div>

      {/* ── Content below banner ── */}
      <div className="px-6 pb-6">

        {/* Avatar row — only avatar + completion badge here, NO buttons */}
        <div className="flex items-end justify-between -mt-12 mb-5">

          {/* Avatar with completion ring */}
          <div className="relative flex-shrink-0">
            <svg className="absolute -inset-2 w-[88px] h-[88px] -rotate-90" viewBox="2 0 65 58">
              <circle cx="32" cy="32" r="28" fill="none" stroke={dm ? "#374151" : "#e5e7eb"} strokeWidth="3" />
              <circle cx="32" cy="32" r="28" fill="none" stroke={completionColor} strokeWidth="3"
                strokeDasharray={circumference} strokeDashoffset={strokeDashoffset}
                strokeLinecap="round" style={{ transition: "stroke-dashoffset 0.6s ease" }}
              />
            </svg>
            <div className={`w-20 h-20 rounded-full overflow-hidden border-4 shadow-lg ${dm ? "border-gray-800" : "border-white"} bg-gradient-to-br from-[#0084ca] to-[#006ba6] flex items-center justify-center`}>
              {uploading ? (
                <Loader className="w-6 h-6 text-white animate-spin" />
              ) : profile.image ? (
                <img src={profile.image} alt={profile.name} className="w-full h-full object-cover" />
              ) : (
                <span className="text-white text-xl font-bold">{getInitials(profile.name || "U")}</span>
              )}
            </div>
            {/* Camera — always visible */}
            <label
              className={`absolute bottom-0 right-0 w-7 h-7 rounded-full flex items-center justify-center cursor-pointer shadow-md transition-colors border-2 ${dm ? "border-gray-800" : "border-white"} ${uploading ? "bg-gray-400 cursor-not-allowed" : "bg-[#0084ca] hover:bg-[#006ba6]"}`}
              title="Change profile photo"
            >
              <Camera className="w-3.5 h-3.5 text-white" />
              <input type="file" className="hidden" accept="image/*,.heic,.heif"
                disabled={uploading}
                onChange={(e) => e.target.files?.[0] && handleFileChange(e.target.files[0])} />
            </label>
          </div>

          {/* Completion badge */}
          <div className="text-right relative top-2">
            <div className="text-xs font-semibold" style={{ color: completionColor }}>
              {completionPercentage === 100 ? "Complete ✓" : `${completionPercentage}% complete`}
            </div>
            <div className={`text-xs ${dm ? "text-gray-500" : "text-gray-400"}`}>
              {completionPercentage < 100 ? "Fill in missing fields" : "Profile fully optimized"}
            </div>
          </div>
        </div>

        {/* Name & title */}
        <div className="space-y-1 mb-4">
          {isEditing ? (
            <div className="space-y-2">
              <input
                value={profile.name}
                onChange={(e) => handleChange("name", e.target.value)}
                className={`text-2xl font-bold w-full bg-transparent border-b-2 border-[#0084ca] outline-none pb-0.5 ${dm ? "text-white" : "text-gray-900"}`}
                placeholder="Your full name"
              />
              <input
                value={profile.title}
                onChange={(e) => handleChange("title", e.target.value)}
                className={`text-sm w-full bg-transparent border-b border-gray-300 dark:border-gray-600 outline-none pb-0.5 ${dm ? "text-gray-300" : "text-gray-600"}`}
                placeholder="Your professional title"
              />
            </div>
          ) : (
            <>
              <h2 className={`text-2xl font-bold ${dm ? "text-white" : "text-gray-900"}`}>
                {profile.name || "Your Name"}
              </h2>
              <p className={`text-sm font-medium ${dm ? "text-[#60b4e8]" : "text-[#0084ca]"}`}>
                {profile.title || "Add your professional title"}
              </p>
            </>
          )}
        </div>

        {/* Location & rate chips */}
        <div className="flex flex-wrap gap-2 mb-4">
          {isEditing ? (
            <>
              <div className="w-full sm:w-64">
                <LocationSelector
                  value={profile.location}
                  onChange={(val) => handleChange("location", val)}
                  darkMode={dm}
                  placeholder="Select location"
                />
              </div>
              <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-sm ${dm ? "border-gray-600 bg-gray-700" : "border-gray-200 bg-gray-50"}`}>
                <DollarSign className="w-3.5 h-3.5 text-gray-400" />
                <input value={profile.hourlyRate} onChange={(e) => handleChange("hourlyRate", e.target.value)}
                  className={`bg-transparent outline-none w-16 text-sm ${dm ? "text-gray-300" : "text-gray-700"}`}
                  placeholder="Rate" />
                <span className={`text-xs ${dm ? "text-gray-500" : "text-gray-400"}`}>/hr</span>
              </div>
            </>
          ) : (
            <>
              {profile.location && (
                <span className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium ${dm ? "bg-gray-700 text-gray-300" : "bg-gray-100 text-gray-600"}`}>
                  <MapPin className="w-3 h-3" /> {profile.location}
                </span>
              )}
              {profile.hourlyRate && profile.hourlyRate !== "0" && (
                <span className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium ${dm ? "bg-gray-700 text-gray-300" : "bg-gray-100 text-gray-600"}`}>
                  <DollarSign className="w-3 h-3" /> ${profile.hourlyRate}/hr
                </span>
              )}
            </>
          )}
        </div>

        {/* Bio */}
        <div className={`rounded-xl p-4 ${dm ? "bg-gray-700/50" : "bg-gray-50"}`}>
          <h4 className={`text-xs font-semibold uppercase tracking-wider mb-2 ${dm ? "text-gray-400" : "text-gray-500"}`}>About</h4>
          {isEditing ? (
            <textarea value={profile.bio} onChange={(e) => handleChange("bio", e.target.value)}
              className={`w-full bg-transparent outline-none text-sm leading-relaxed resize-none ${dm ? "text-gray-300 placeholder-gray-600" : "text-gray-700 placeholder-gray-400"}`}
              rows={3} placeholder="Write a short bio about yourself..." />
          ) : (
            <p className={`text-sm leading-relaxed ${dm ? "text-gray-300" : "text-gray-600"}`}>
              {profile.bio || <span className="italic text-gray-400">No bio added yet. Click Edit Profile to add one.</span>}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
