import React, { useState, useEffect } from "react";
import {
  GraduationCap, Briefcase, Globe, FileText, Plus, Loader,
  CheckCircle, AlertCircle, ArrowRight, FolderOpen, GitBranch,
  Link2, X, Coins, ExternalLink, ShieldCheck, ShieldAlert, Clock, Upload,
} from "lucide-react";
import { TALENT_ROUTES } from "../../config/routes";
import {
  getTalentProfile, updateTalentProfile, addSkills, getTokenBalance,
  uploadProfileImage, getVerificationStatus, requestVerification,
  type TalentProfile as TalentProfileType,
  type UpdateProfileData,
} from "../../api/talent/talentApi";
import { ProfileHeader } from "../profile/ProfileHeader";
import type { ProfileData } from "../../types/profile";
import { useNavigate } from "react-router";
import { LanguageSelector } from "../profile/LanguageSelector";

interface TalentProfileProps {
  darkMode?: boolean;
}

export const TalentProfile: React.FC<TalentProfileProps> = ({ darkMode = false }) => {
  const navigate = useNavigate();
  const [profile, setProfile] = useState<TalentProfileType | null>(null);
  const [profileData, setProfileData] = useState<ProfileData | null>(null);
  const [tokenBalance, setTokenBalance] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [newSkill, setNewSkill] = useState("");
  const [addingSkill, setAddingSkill] = useState(false);
  const [formData, setFormData] = useState<UpdateProfileData>({});
  const [completionPercentage, setCompletionPercentage] = useState(0);
  const [isIncomplete, setIsIncomplete] = useState(false);

  // Verification state
  const [verifStatus, setVerifStatus] = useState<{ is_verified: boolean; request: any } | null>(null);
  const [verifModal, setVerifModal] = useState(false);
  const [nationalIdFile, setNationalIdFile] = useState<File | null>(null);
  const [verifMessage, setVerifMessage] = useState("");
  const [verifLoading, setVerifLoading] = useState(false);

  const dm = darkMode;

  useEffect(() => { fetchProfileData(); }, []);

  const fetchProfileData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [profileResponse, tokenResponse, verifResponse] = await Promise.all([
        getTalentProfile(),
        getTokenBalance(),
        getVerificationStatus().catch(() => null),
      ]);

      if (verifResponse) setVerifStatus(verifResponse);

      if (profileResponse.incomplete) {
        setIsIncomplete(true);
        setEditing(true);
      } else {
        setIsIncomplete(false);
      }

      const data = profileResponse.data;
      setProfile(data);
      setTokenBalance(tokenResponse.balance);

      const mapped: ProfileData = {
        name: data.name || "",
        title: data.name || "Talent",
        location: data.Location || "",
        hourlyRate: data.HourlyRate ? data.HourlyRate.toString() : "",
        bio: data.about || "",
        image: data.profile_image || "",
        skills: data.skills || [],
        languages: [],
        education: [],
        certifications: [],
        portfolio: [],
        about: data.about,
        educationText: data.education,
        experience: data.experience,
        languagesText: data.languages,
        linkedin: data.linkedin,
        github: data.github,
        resume_url: data.resume_url,
      };
      setProfileData(mapped);

      const fields = [mapped.name, mapped.bio, mapped.location, mapped.hourlyRate, mapped.educationText, mapped.experience, mapped.languagesText, mapped.linkedin, mapped.github];
      const filled = fields.filter((f) => f && f.trim().length > 0).length;
      const hasSkills = (data.skills || []).length > 0;
      setCompletionPercentage(Math.round(((filled + (hasSkills ? 1 : 0)) / 10) * 100));

      setFormData({
        about: data.about || "",
        education: data.education || "",
        experience: data.experience || "",
        languages: data.languages || "",
        linkedin: data.linkedin || "",
        github: data.github || "",
        resume_url: data.resume_url || "",
        Location: data.Location || "",
        HourlyRate: data.HourlyRate ? data.HourlyRate.toString() : "",
      });
    } catch (err: any) {
      setError(err.message || "Failed to load profile");
    } finally {
      setLoading(false);
    }
  };

  const handleSaveProfile = async () => {
    setSaving(true);
    setError(null);
    setSuccess(null);
    try {
      await updateTalentProfile(formData);
      await fetchProfileData();
      if (isIncomplete) {
        setIsIncomplete(false);
        setSuccess("Profile completed! Redirecting to dashboard...");
        setTimeout(() => navigate("/talent-dashboard"), 2000);
      } else {
        setEditing(false);
        setSuccess("Profile updated successfully");
        setTimeout(() => setSuccess(null), 3000);
      }
    } catch (err: any) {
      setError(err.message || "Failed to update profile");
    } finally {
      setSaving(false);
    }
  };

  const handleAddSkill = async () => {
    if (!newSkill.trim()) return;
    setAddingSkill(true);
    try {
      await addSkills(newSkill.trim());
      setNewSkill("");
      await fetchProfileData();
      setSuccess("Skill added");
      setTimeout(() => setSuccess(null), 2000);
    } catch (err: any) {
      setError(err.message || "Failed to add skill");
    } finally {
      setAddingSkill(false);
    }
  };

  const handleSubmitVerification = async () => {
    if (!nationalIdFile) return;
    setVerifLoading(true);
    try {
      await requestVerification(nationalIdFile, verifMessage);
      setVerifModal(false);
      setNationalIdFile(null);
      setVerifMessage("");
      const updated = await getVerificationStatus();
      setVerifStatus(updated);
      setSuccess("Verification request submitted! The admin will review it shortly.");
      setTimeout(() => setSuccess(null), 4000);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setVerifLoading(false);
    }
  };

  const handleCancelEdit = () => {
    if (profile) {
      setFormData({
        about: profile.about || "",
        education: profile.education || "",
        experience: profile.experience || "",
        languages: profile.languages || "",
        linkedin: profile.linkedin || "",
        github: profile.github || "",
        resume_url: profile.resume_url || "",
        Location: profile.Location || "",
        HourlyRate: profile.HourlyRate ? profile.HourlyRate.toString() : "",
      });
    }
    setEditing(false);
    setError(null);
  };

  const inputCls = `w-full px-3 py-2.5 rounded-lg border text-sm outline-none transition-all focus:ring-2 focus:ring-[#0084ca]/30 focus:border-[#0084ca] ${
    dm ? "bg-gray-700 border-gray-600 text-white placeholder-gray-500" : "bg-white border-gray-200 text-gray-900 placeholder-gray-400"
  }`;

  const textareaCls = `${inputCls} resize-none`;

  const sectionCls = `rounded-xl border p-5 ${dm ? "bg-gray-800 border-gray-700" : "bg-white border-gray-100 shadow-sm"}`;

  const labelCls = `flex items-center gap-2 text-xs font-semibold uppercase tracking-wider mb-2 ${dm ? "text-gray-400" : "text-gray-500"}`;

  // ── Loading ──────────────────────────────────────────────
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-3">
        <div className="w-12 h-12 rounded-full border-4 border-[#0084ca]/20 border-t-[#0084ca] animate-spin" />
        <p className={`text-sm ${dm ? "text-gray-400" : "text-gray-500"}`}>Loading your profile...</p>
      </div>
    );
  }

  if (error && !profile) {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-4">
        <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center">
          <AlertCircle className="w-8 h-8 text-red-500" />
        </div>
        <p className={`text-sm ${dm ? "text-gray-300" : "text-gray-600"}`}>{error}</p>
        <button onClick={fetchProfileData}
          className="px-5 py-2 bg-[#0084ca] text-white rounded-lg text-sm hover:bg-[#006ba6] transition-colors">
          Try Again
        </button>
      </div>
    );
  }

  if (!profile) return null;

  // ── Incomplete / Setup view ──────────────────────────────
  if (isIncomplete) {
    return (
      <div className={`max-w-2xl mx-auto rounded-2xl p-8 ${dm ? "bg-gray-800 border border-gray-700" : "bg-white shadow-lg"}`}>
        <div className="text-center mb-8">
          <div className="w-20 h-20 rounded-full bg-gradient-to-br from-[#0084ca] to-[#006ba6] mx-auto mb-4 flex items-center justify-center shadow-lg">
            <span className="text-white text-2xl font-bold">{profile.name?.charAt(0).toUpperCase() || "?"}</span>
          </div>
          <h2 className={`text-2xl font-bold mb-1 ${dm ? "text-white" : "text-gray-900"}`}>Welcome, {profile.name}!</h2>
          <p className={`text-sm ${dm ? "text-gray-400" : "text-gray-500"}`}>Complete your profile to start getting hired</p>
        </div>

        {/* Progress bar */}
        <div className="mb-8">
          <div className={`flex justify-between text-xs mb-1.5 ${dm ? "text-gray-400" : "text-gray-500"}`}>
            <span>Profile completion</span><span>{completionPercentage}%</span>
          </div>
          <div className={`h-2 rounded-full ${dm ? "bg-gray-700" : "bg-gray-100"}`}>
            <div className="h-2 rounded-full bg-gradient-to-r from-[#0084ca] to-[#006ba6] transition-all duration-500"
              style={{ width: `${completionPercentage}%` }} />
          </div>
        </div>

        {success && (
          <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg flex items-center gap-2 text-sm text-green-700">
            <CheckCircle className="w-4 h-4 flex-shrink-0" />{success}
          </div>
        )}
        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2 text-sm text-red-700">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />{error}
          </div>
        )}

        <div className="space-y-4">
          {[
            { label: "About Yourself", field: "about" as const, icon: <Briefcase className="w-4 h-4" />, rows: 4, placeholder: "Tell us about your expertise and what you're looking for..." },
            { label: "Education", field: "education" as const, icon: <GraduationCap className="w-4 h-4" />, rows: 2, placeholder: "Your educational background..." },
            { label: "Experience", field: "experience" as const, icon: <Briefcase className="w-4 h-4" />, rows: 3, placeholder: "Describe your work experience..." },
            { label: "Languages", field: "languages" as const, icon: <Globe className="w-4 h-4" />, rows: 1, placeholder: "e.g. English, Amharic, French", isLanguage: true },
          ].map(({ label, field, icon, rows, placeholder, isLanguage }: any) => (
            <div key={field}>
              <label className={labelCls}>{icon}{label}</label>
              {isLanguage ? (
                <LanguageSelector
                  value={formData[field] || ""}
                  onChange={(val) => setFormData((p) => ({ ...p, [field]: val }))}
                  darkMode={dm}
                />
              ) : rows === 1 ? (
                <input type="text" value={formData[field] || ""} onChange={(e) => setFormData((p) => ({ ...p, [field]: e.target.value }))}
                  className={inputCls} placeholder={placeholder} />
              ) : (
                <textarea value={formData[field] || ""} onChange={(e) => setFormData((p) => ({ ...p, [field]: e.target.value }))}
                  className={textareaCls} rows={rows} placeholder={placeholder} />
              )}
            </div>
          ))}

          <button onClick={handleSaveProfile} disabled={saving}
            className="w-full py-3 bg-gradient-to-r from-[#0084ca] to-[#006ba6] text-white rounded-xl font-semibold text-sm hover:opacity-90 transition-opacity flex items-center justify-center gap-2 disabled:opacity-60">
            {saving ? <Loader className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
            {saving ? "Saving..." : "Complete Profile"}
          </button>
        </div>
      </div>
    );
  }

  // ── Main profile view ────────────────────────────────────
  return (
    <div className="max-w-5xl mx-auto space-y-6">

      {/* Toast messages */}
      {(success || error) && (
        <div className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium ${
          success ? "bg-green-50 border border-green-200 text-green-700" : "bg-red-50 border border-red-200 text-red-700"
        }`}>
          {success ? <CheckCircle className="w-4 h-4 flex-shrink-0" /> : <AlertCircle className="w-4 h-4 flex-shrink-0" />}
          <span className="flex-1">{success || error}</span>
          <button onClick={() => { setSuccess(null); setError(null); }}><X className="w-4 h-4" /></button>
        </div>
      )}

      {/* Profile Header Card */}
      {profileData && (
        <ProfileHeader
          profile={profileData}
          isEditing={editing}
          onEdit={() => setEditing(true)}
          onSave={handleSaveProfile}
          onCancel={handleCancelEdit}
          onProfileChange={(updated) => {
            setProfileData(updated);
            // Keep formData in sync with location/hourlyRate edits from ProfileHeader
            setFormData((prev) => ({
              ...prev,
              Location: updated.location || "",
              HourlyRate: updated.hourlyRate || "",
            }));
          }}
          onImageUpload={async (file) => {
            const res = await uploadProfileImage(file);
            return res.imageUrl;
          }}
          completionPercentage={completionPercentage}
          darkMode={dm}
        />
      )}

      {/* Token Balance Banner */}
      <div className={`flex items-center gap-4 px-5 py-4 rounded-xl border ${dm ? "bg-gray-800 border-gray-700" : "bg-gradient-to-r from-amber-50 to-yellow-50 border-amber-200"}`}>
        <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center flex-shrink-0">
          <Coins className="w-5 h-5 text-amber-600" />
        </div>
        <div className="flex-1">
          <p className={`text-xs font-semibold uppercase tracking-wider ${dm ? "text-gray-400" : "text-amber-700"}`}>Token Balance</p>
          <p className={`text-2xl font-bold ${dm ? "text-white" : "text-amber-900"}`}>{tokenBalance}</p>
        </div>
        <button onClick={() => navigate(TALENT_ROUTES.BILLING.path)}
          className="text-xs font-medium text-amber-600 hover:text-amber-700 flex items-center gap-1">
          Top up <ArrowRight className="w-3 h-3" />
        </button>
      </div>

      {/* Verification Status Card */}
      {verifStatus && !verifStatus.is_verified && (
        <div className={`flex items-center gap-4 px-5 py-4 rounded-xl border ${
          verifStatus.request?.status === "pending"
            ? dm ? "bg-amber-900/20 border-amber-700" : "bg-amber-50 border-amber-200"
            : verifStatus.request?.status === "rejected"
            ? dm ? "bg-red-900/20 border-red-700" : "bg-red-50 border-red-200"
            : dm ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200"
        }`}>
          <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${
            verifStatus.request?.status === "pending" ? "bg-amber-100" :
            verifStatus.request?.status === "rejected" ? "bg-red-100" : "bg-gray-100"
          }`}>
            {verifStatus.request?.status === "pending"
              ? <Clock className="w-5 h-5 text-amber-600" />
              : verifStatus.request?.status === "rejected"
              ? <ShieldAlert className="w-5 h-5 text-red-500" />
              : <ShieldAlert className="w-5 h-5 text-gray-400" />}
          </div>
          <div className="flex-1">
            <p className={`text-xs font-semibold uppercase tracking-wider ${
              verifStatus.request?.status === "pending" ? dm ? "text-amber-400" : "text-amber-700" :
              verifStatus.request?.status === "rejected" ? "text-red-500" :
              dm ? "text-gray-400" : "text-gray-500"
            }`}>
              {verifStatus.request?.status === "pending" ? "Verification Pending" :
               verifStatus.request?.status === "rejected" ? "Verification Rejected" :
               "Account Not Verified"}
            </p>
            <p className={`text-sm mt-0.5 ${
              verifStatus.request?.status === "pending" ? dm ? "text-amber-300" : "text-amber-800" :
              verifStatus.request?.status === "rejected" ? dm ? "text-red-300" : "text-red-700" :
              dm ? "text-gray-300" : "text-gray-600"
            }`}>
              {verifStatus.request?.status === "pending"
                ? "Your request is under review. You'll be notified once approved."
                : verifStatus.request?.status === "rejected"
                ? verifStatus.request.admin_note || "Your request was rejected. You may resubmit."
                : "Get verified to apply for jobs. Upload your Ethiopian National ID."}
            </p>
          </div>
          {verifStatus.request?.status !== "pending" && (
            <button
              onClick={() => setVerifModal(true)}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-semibold whitespace-nowrap transition-colors ${
                verifStatus.request?.status === "rejected"
                  ? "bg-red-500 hover:bg-red-600 text-white"
                  : "bg-[#0084ca] hover:bg-[#006ba6] text-white"
              }`}
            >
              <ShieldCheck className="w-4 h-4" />
              {verifStatus.request?.status === "rejected" ? "Resubmit" : "Get Verified"}
            </button>
          )}
        </div>
      )}

      {verifStatus?.is_verified && (
        <div className={`flex items-center gap-3 px-5 py-3 rounded-xl border ${
          dm ? "bg-emerald-900/20 border-emerald-700" : "bg-emerald-50 border-emerald-200"
        }`}>
          <ShieldCheck className="w-5 h-5 text-emerald-500 flex-shrink-0" />
          <p className={`text-sm font-medium ${dm ? "text-emerald-300" : "text-emerald-700"}`}>
            Your account is verified — you can apply for jobs.
          </p>
        </div>
      )}

      {/* Two-column grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Left column — 2/3 */}
        <div className="lg:col-span-2 space-y-6">

          {/* About */}
          <div className={sectionCls}>
            <h3 className={`text-sm font-bold uppercase tracking-wider mb-4 ${dm ? "text-gray-300" : "text-gray-700"}`}>About</h3>
            {editing ? (
              <textarea value={formData.about || ""} onChange={(e) => setFormData((p) => ({ ...p, about: e.target.value }))}
                className={textareaCls} rows={4} placeholder="Write about yourself..." />
            ) : (
              <p className={`text-sm leading-relaxed ${dm ? "text-gray-300" : "text-gray-600"}`}>
                {profile.about || <span className="italic text-gray-400">No bio added yet.</span>}
              </p>
            )}
          </div>

          {/* Experience */}
          <div className={sectionCls}>
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center">
                <Briefcase className="w-4 h-4 text-blue-600" />
              </div>
              <h3 className={`text-sm font-bold uppercase tracking-wider ${dm ? "text-gray-300" : "text-gray-700"}`}>Experience</h3>
            </div>
            {editing ? (
              <textarea value={formData.experience || ""} onChange={(e) => setFormData((p) => ({ ...p, experience: e.target.value }))}
                className={textareaCls} rows={5} placeholder="Describe your work experience..." />
            ) : (
              <p className={`text-sm leading-relaxed whitespace-pre-line ${dm ? "text-gray-300" : "text-gray-600"}`}>
                {profile.experience || <span className="italic text-gray-400">No experience added yet.</span>}
              </p>
            )}
          </div>

          {/* Education */}
          <div className={sectionCls}>
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 rounded-lg bg-purple-100 flex items-center justify-center">
                <GraduationCap className="w-4 h-4 text-purple-600" />
              </div>
              <h3 className={`text-sm font-bold uppercase tracking-wider ${dm ? "text-gray-300" : "text-gray-700"}`}>Education</h3>
            </div>
            {editing ? (
              <textarea value={formData.education || ""} onChange={(e) => setFormData((p) => ({ ...p, education: e.target.value }))}
                className={textareaCls} rows={3} placeholder="Your educational background..." />
            ) : (
              <p className={`text-sm leading-relaxed whitespace-pre-line ${dm ? "text-gray-300" : "text-gray-600"}`}>
                {profile.education || <span className="italic text-gray-400">No education added yet.</span>}
              </p>
            )}
          </div>

          {/* Skills */}
          <div className={sectionCls}>
            <h3 className={`text-sm font-bold uppercase tracking-wider mb-4 ${dm ? "text-gray-300" : "text-gray-700"}`}>Skills</h3>
            <div className="flex flex-wrap gap-2 mb-4">
              {(profile.skills || []).length > 0 ? (
                profile.skills.map((skill, i) => (
                  <span key={i}
                    className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-colors ${
                      dm ? "bg-[#0084ca]/20 border-[#0084ca]/40 text-[#60b4e8]" : "bg-[#0084ca]/10 border-[#0084ca]/20 text-[#0084ca]"
                    }`}>
                    {skill}
                  </span>
                ))
              ) : (
                <p className={`text-sm italic ${dm ? "text-gray-500" : "text-gray-400"}`}>No skills added yet.</p>
              )}
            </div>
            <div className="flex gap-2">
              <input type="text" value={newSkill} onChange={(e) => setNewSkill(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleAddSkill()}
                className={`${inputCls} flex-1`} placeholder="Add a skill (press Enter)" />
              <button onClick={handleAddSkill} disabled={addingSkill || !newSkill.trim()}
                className="px-4 py-2.5 bg-[#0084ca] hover:bg-[#006ba6] text-white rounded-lg text-sm font-medium flex items-center gap-1.5 transition-colors disabled:opacity-50">
                {addingSkill ? <Loader className="w-3.5 h-3.5 animate-spin" /> : <Plus className="w-3.5 h-3.5" />}
                Add
              </button>
            </div>
          </div>

          {/* Save / Cancel bar when editing */}
          {editing && (
            <div className={`flex gap-3 p-4 rounded-xl border ${dm ? "bg-gray-800 border-gray-700" : "bg-gray-50 border-gray-200"}`}>
              <button onClick={handleSaveProfile} disabled={saving}
                className="flex-1 py-2.5 bg-gradient-to-r from-[#0084ca] to-[#006ba6] text-white rounded-lg text-sm font-semibold flex items-center justify-center gap-2 hover:opacity-90 transition-opacity disabled:opacity-60">
                {saving ? <Loader className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
                {saving ? "Saving..." : "Save Changes"}
              </button>
              <button onClick={handleCancelEdit}
                className={`px-5 py-2.5 rounded-lg text-sm font-semibold border transition-colors ${dm ? "border-gray-600 text-gray-300 hover:bg-gray-700" : "border-gray-300 text-gray-600 hover:bg-gray-100"}`}>
                Cancel
              </button>
            </div>
          )}
        </div>

        {/* Right column — 1/3 */}
        <div className="space-y-6">

          {/* Languages */}
          <div className={sectionCls}>
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 rounded-lg bg-green-100 flex items-center justify-center">
                <Globe className="w-4 h-4 text-green-600" />
              </div>
              <h3 className={`text-sm font-bold uppercase tracking-wider ${dm ? "text-gray-300" : "text-gray-700"}`}>Languages</h3>
            </div>
            {editing ? (
              <LanguageSelector
                value={formData.languages || ""}
                onChange={(val) => setFormData((p) => ({ ...p, languages: val }))}
                darkMode={dm}
              />
            ) : (
              <div className="flex flex-wrap gap-2">
                {profile.languages ? (
                  profile.languages.split(",").map((lang, i) => (
                    <span key={i} className={`px-3 py-1.5 rounded-full text-xs font-medium ${dm ? "bg-green-900/30 text-green-400" : "bg-green-50 text-green-700 border border-green-200"}`}>
                      {lang.trim()}
                    </span>
                  ))
                ) : (
                  <p className={`text-sm italic ${dm ? "text-gray-500" : "text-gray-400"}`}>Not specified</p>
                )}
              </div>
            )}
          </div>

          {/* Links */}
          <div className={sectionCls}>
            <h3 className={`text-sm font-bold uppercase tracking-wider mb-4 ${dm ? "text-gray-300" : "text-gray-700"}`}>Links</h3>
            <div className="space-y-3">
              {editing ? (
                <>
                  {[
                    { field: "linkedin" as const, icon: <Link2 className="w-4 h-4" />, placeholder: "LinkedIn URL", color: "text-blue-600" },
                    { field: "github" as const, icon: <GitBranch className="w-4 h-4" />, placeholder: "GitHub URL", color: "text-gray-700" },
                    { field: "resume_url" as const, icon: <FileText className="w-4 h-4" />, placeholder: "Resume URL", color: "text-red-600" },
                  ].map(({ field, icon, placeholder }) => (
                    <div key={field} className="flex items-center gap-2">
                      <span className={`${dm ? "text-gray-400" : "text-gray-500"}`}>{icon}</span>
                      <input type="url" value={formData[field] || ""} onChange={(e) => setFormData((p) => ({ ...p, [field]: e.target.value }))}
                        className={`${inputCls} flex-1`} placeholder={placeholder} />
                    </div>
                  ))}
                </>
              ) : (
                <>
                  {[
                    { href: profile.linkedin, icon: <Link2 className="w-4 h-4" />, label: "LinkedIn", color: "text-blue-600 hover:text-blue-700" },
                    { href: profile.github, icon: <GitBranch className="w-4 h-4" />, label: "GitHub", color: dm ? "text-gray-300 hover:text-white" : "text-gray-700 hover:text-gray-900" },
                    { href: profile.resume_url, icon: <FileText className="w-4 h-4" />, label: "Resume", color: "text-red-600 hover:text-red-700" },
                  ].map(({ href, icon, label, color }) => (
                    href ? (
                      <a key={label} href={href} target="_blank" rel="noopener noreferrer"
                        className={`flex items-center gap-2.5 text-sm font-medium ${color} group`}>
                        {icon}
                        <span className="flex-1 truncate">{label}</span>
                        <ExternalLink className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                      </a>
                    ) : (
                      <div key={label} className={`flex items-center gap-2.5 text-sm ${dm ? "text-gray-600" : "text-gray-400"}`}>
                        {icon}<span className="italic">Not added</span>
                      </div>
                    )
                  ))}
                </>
              )}
            </div>
          </div>

          {/* Portfolio CTA */}
          <button onClick={() => navigate(TALENT_ROUTES.PORTFOLIO.path)}
            className="w-full flex items-center gap-3 px-5 py-4 rounded-xl bg-gradient-to-r from-[#0084ca] to-[#006ba6] text-white hover:opacity-90 transition-opacity shadow-md shadow-[#0084ca]/20 group">
            <div className="w-9 h-9 rounded-lg bg-white/20 flex items-center justify-center flex-shrink-0">
              <FolderOpen className="w-5 h-5" />
            </div>
            <div className="flex-1 text-left">
              <p className="text-sm font-semibold">Portfolio & Skills</p>
              <p className="text-xs text-white/70">Manage your projects</p>
            </div>
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </button>
        </div>
      </div>

      {/* Verification Modal */}
      {verifModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={() => !verifLoading && setVerifModal(false)}>
          <div className={`w-full max-w-md rounded-2xl border shadow-2xl ${dm ? "bg-gray-900 border-gray-800" : "bg-white border-slate-200"}`} onClick={e => e.stopPropagation()}>
            <div className={`px-6 py-4 border-b flex items-center justify-between ${dm ? "border-gray-800" : "border-slate-200"}`}>
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-[#0084ca]" />
                <h2 className={`font-semibold ${dm ? "text-white" : "text-gray-900"}`}>Identity Verification</h2>
              </div>
              <button onClick={() => !verifLoading && setVerifModal(false)} className={`p-1.5 rounded-lg ${dm ? "hover:bg-gray-800 text-gray-400" : "hover:bg-slate-100 text-gray-500"}`}>
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-6 space-y-5">
              <div className={`p-3 rounded-xl text-sm ${dm ? "bg-blue-900/20 text-blue-300" : "bg-blue-50 text-blue-700"}`}>
                Upload a clear photo of your <strong>Ethiopian National ID</strong> (Fayda ID or old ID card). Your ID will only be used for identity verification.
              </div>

              {/* National ID upload */}
              <div>
                <label className={`block text-sm font-medium mb-2 ${dm ? "text-gray-300" : "text-gray-700"}`}>
                  National ID Photo <span className="text-red-500">*</span>
                </label>
                <label className={`flex flex-col items-center justify-center gap-2 w-full h-36 rounded-xl border-2 border-dashed cursor-pointer transition-colors ${
                  nationalIdFile
                    ? dm ? "border-emerald-600 bg-emerald-900/20" : "border-emerald-400 bg-emerald-50"
                    : dm ? "border-gray-600 hover:border-gray-500 bg-gray-800" : "border-gray-300 hover:border-[#0084ca] bg-gray-50"
                }`}>
                  <input type="file" accept="image/*" className="hidden" onChange={e => setNationalIdFile(e.target.files?.[0] || null)} />
                  {nationalIdFile ? (
                    <>
                      <CheckCircle className="w-8 h-8 text-emerald-500" />
                      <p className={`text-sm font-medium ${dm ? "text-emerald-300" : "text-emerald-700"}`}>{nationalIdFile.name}</p>
                      <p className={`text-xs ${dm ? "text-gray-400" : "text-gray-500"}`}>Click to change</p>
                    </>
                  ) : (
                    <>
                      <Upload className={`w-8 h-8 ${dm ? "text-gray-500" : "text-gray-400"}`} />
                      <p className={`text-sm ${dm ? "text-gray-400" : "text-gray-500"}`}>Click to upload your National ID</p>
                      <p className={`text-xs ${dm ? "text-gray-500" : "text-gray-400"}`}>JPG, PNG or PDF</p>
                    </>
                  )}
                </label>
              </div>

              {/* Optional message */}
              <div>
                <label className={`block text-sm font-medium mb-2 ${dm ? "text-gray-300" : "text-gray-700"}`}>Message to Admin <span className={`text-xs font-normal ${dm ? "text-gray-500" : "text-gray-400"}`}>(optional)</span></label>
                <textarea
                  value={verifMessage}
                  onChange={e => setVerifMessage(e.target.value)}
                  rows={3}
                  placeholder="Any additional information for the admin..."
                  className={`w-full px-3 py-2.5 rounded-lg border text-sm outline-none resize-none transition-all focus:ring-2 focus:ring-[#0084ca]/30 focus:border-[#0084ca] ${
                    dm ? "bg-gray-700 border-gray-600 text-white placeholder-gray-500" : "bg-white border-gray-200 text-gray-900 placeholder-gray-400"
                  }`}
                />
              </div>

              {error && (
                <div className="flex items-center gap-2 p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" /> {error}
                </div>
              )}

              <div className="flex gap-3">
                <button onClick={() => !verifLoading && setVerifModal(false)}
                  className={`flex-1 py-2.5 rounded-xl border text-sm font-medium transition-colors ${dm ? "border-gray-700 text-gray-300 hover:bg-gray-800" : "border-slate-300 text-gray-600 hover:bg-slate-50"}`}>
                  Cancel
                </button>
                <button onClick={handleSubmitVerification} disabled={!nationalIdFile || verifLoading}
                  className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-[#0084ca] hover:bg-[#006ba6] text-white text-sm font-semibold transition-colors disabled:opacity-50">
                  {verifLoading ? <><Loader className="w-4 h-4 animate-spin" /> Submitting...</> : <><ShieldCheck className="w-4 h-4" /> Submit Request</>}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

