import { useState, useEffect, useRef } from "react";
import { useDarkMode } from "../../contexts/DarkModeContext";
import { useAuth } from "../../contexts/AuthContext";
import { Header } from "../../features/employer/components/Header";
import {
  Building2, MapPin, Globe, User, Mail, Edit3,
  Save, X, CheckCircle, AlertCircle, Loader2, Camera,
  Briefcase, Link as LinkIcon, ShieldCheck, Upload, BadgeCheck, Clock, ShieldAlert,
} from "lucide-react";
import { API_BASE_URL } from "../../config/api";
import { LocationSelector } from "../../components/profile/LocationSelector";

interface LicenseStatus {
  is_verified: boolean;
  license: {
    id: number;
    license_name: string;
    license_number?: string;
    issuing_authority?: string;
    license_image: string;
    status: "pending" | "approved" | "rejected";
    admin_note?: string;
    submitted_at: string;
  } | null;
}

interface EmployerProfileData {
  name: string;
  email: string;
  profile_image?: string;
  profile_url?: string;
  company_name?: string;
  company_discription?: string;
  website?: string;
  location?: string;
  username?: string;
}

const getAuthHeaders = (): Record<string, string> => {
  const token = localStorage.getItem("token");
  return token ? { Authorization: `Bearer ${token}` } : {};
};

export default function EmployerProfilePage() {
  const { darkMode } = useDarkMode();
  const { user } = useAuth();
  const dm = darkMode;
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [profile, setProfile] = useState<EmployerProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [incomplete, setIncomplete] = useState(false);
  const [toast, setToast] = useState<{ msg: string; type: "success" | "error" } | null>(null);

  // License state
  const [licenseStatus, setLicenseStatus] = useState<LicenseStatus | null>(null);
  const [licenseModal, setLicenseModal] = useState(false);
  const [licenseFile, setLicenseFile] = useState<File | null>(null);
  const [licensePreview, setLicensePreview] = useState<string | null>(null);
  const [licenseForm, setLicenseForm] = useState({ license_name: "", license_number: "", issuing_authority: "" });
  const [licenseSubmitting, setLicenseSubmitting] = useState(false);
  const licenseFileRef = useRef<HTMLInputElement>(null);

  const [form, setForm] = useState({
    company_name: "",
    company_discription: "",
    website: "",
    location: "",
    username: "",
  });

  useEffect(() => { fetchProfile(); fetchLicenseStatus(); }, []);

  const fetchLicenseStatus = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/employer/license`, {
        headers: { "Content-Type": "application/json", ...getAuthHeaders() },
      });
      const data = await res.json();
      setLicenseStatus(data);
    } catch {}
  };

  const handleLicenseFileChange = (file: File | null) => {
    setLicenseFile(file);
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => setLicensePreview(e.target?.result as string);
      reader.readAsDataURL(file);
    } else setLicensePreview(null);
  };

  const handleLicenseSubmit = async () => {
    if (!licenseFile || !licenseForm.license_name.trim()) {
      showToast("License name and image are required", "error"); return;
    }
    setLicenseSubmitting(true);
    try {
      const fd = new FormData();
      fd.append("license_image", licenseFile);
      fd.append("license_name", licenseForm.license_name);
      if (licenseForm.license_number) fd.append("license_number", licenseForm.license_number);
      if (licenseForm.issuing_authority) fd.append("issuing_authority", licenseForm.issuing_authority);
      const res = await fetch(`${API_BASE_URL}/api/employer/license`, {
        method: "POST",
        headers: { ...getAuthHeaders() },
        body: fd,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      showToast(data.message, "success");
      setLicenseModal(false);
      setLicenseFile(null);
      setLicensePreview(null);
      setLicenseForm({ license_name: "", license_number: "", issuing_authority: "" });
      fetchLicenseStatus();
    } catch (err: any) {
      showToast(err.message, "error");
    } finally {
      setLicenseSubmitting(false);
    }
  };

  const fetchProfile = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/employer/employerProfile`, {
        headers: { "Content-Type": "application/json", ...getAuthHeaders() },
      });
      const data = await res.json();
      setProfile(data.data);
      setIncomplete(!!data.incomplete);
      if (data.data) {
        setForm({
          company_name: data.data.company_name || "",
          company_discription: data.data.company_discription || "",
          website: data.data.website || "",
          location: data.data.location || "",
          username: data.data.username || "",
        });
      }
    } catch {
      showToast("Failed to load profile", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!form.company_name.trim()) {
      showToast("Company name is required", "error");
      return;
    }
    setSaving(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/employer/employerProfile`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", ...getAuthHeaders() },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to update");
      setProfile(data.data);
      setIncomplete(false);
      setEditing(false);
      showToast("Profile updated successfully", "success");
    } catch (err: any) {
      showToast(err.message || "Failed to update profile", "error");
    } finally {
      setSaving(false);
    }
  };

  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/") && !file.name.match(/\.(heic|heif)$/i)) {
      showToast("Please select a valid image (JPG, PNG, WEBP, HEIC)", "error");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      showToast("Image must be less than 5MB", "error");
      return;
    }
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("image", file);
      const res = await fetch(`${API_BASE_URL}/api/employer/upload-profile`, {
        method: "POST",
        headers: { ...getAuthHeaders() },
        body: formData,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Upload failed");
      setProfile((prev) => prev ? { ...prev, profile_url: data.imageUrl } : prev);
      window.dispatchEvent(new CustomEvent("employer-profile-updated", { detail: data.imageUrl }));
      showToast("Logo updated!", "success");
    } catch (err: any) {
      showToast(err.message || "Failed to upload image", "error");
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const showToast = (msg: string, type: "success" | "error") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  };

  const avatarUrl = profile?.profile_url;
  const initials = (profile?.company_name || user?.name || "E").charAt(0).toUpperCase();

  const bg = dm ? "bg-gray-900" : "bg-gray-50";
  const card = dm ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200";
  const text = dm ? "text-white" : "text-gray-900";
  const muted = dm ? "text-gray-400" : "text-gray-500";
  const inputCls = dm
    ? "bg-gray-700 border-gray-600 text-white placeholder-gray-500 focus:border-[#0084ca]"
    : "bg-white border-gray-300 text-gray-900 placeholder-gray-400 focus:border-[#0084ca]";
  const labelCls = dm ? "text-gray-300" : "text-gray-700";

  if (loading) {
    return (
      <div className={`min-h-screen ${bg}`}>
        <Header />
        <div className="flex items-center justify-center min-h-[60vh]">
          <Loader2 className="w-8 h-8 animate-spin text-[#0084ca]" />
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen ${bg} transition-colors duration-300`}>
      <Header />

      {/* Toast */}
      {toast && (
        <div className={`fixed top-20 right-4 z-50 flex items-center gap-2 px-5 py-3 rounded-xl shadow-xl text-white text-sm font-medium ${
          toast.type === "success" ? "bg-green-600" : "bg-red-600"
        }`}>
          {toast.type === "success" ? <CheckCircle className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
          {toast.msg}
        </div>
      )}

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

        {/* Incomplete banner */}
        {incomplete && (
          <div className={`mb-6 p-4 rounded-xl border flex items-start gap-3 ${
            dm ? "bg-yellow-900/20 border-yellow-700" : "bg-yellow-50 border-yellow-200"
          }`}>
            <AlertCircle className="w-5 h-5 text-yellow-500 flex-shrink-0 mt-0.5" />
            <div>
              <p className={`text-sm font-semibold ${dm ? "text-yellow-300" : "text-yellow-800"}`}>
                Complete your company profile
              </p>
              <p className={`text-xs mt-0.5 ${dm ? "text-yellow-400" : "text-yellow-600"}`}>
                Talents will see this info when they apply to your jobs.
              </p>
            </div>
          </div>
        )}

        {/* ── Profile Card ── */}
        <div className={`${card} border rounded-2xl overflow-hidden mb-6`}>

          {/* Banner */}
          <div className="relative h-36 bg-gradient-to-r from-[#0084ca] via-[#0070b0] to-purple-600">
            {/* subtle pattern overlay */}
            <div className="absolute inset-0 opacity-10"
              style={{ backgroundImage: "radial-gradient(circle at 20% 50%, white 1px, transparent 1px), radial-gradient(circle at 80% 20%, white 1px, transparent 1px)", backgroundSize: "40px 40px" }}
            />
          </div>

          {/* Avatar — overlaps banner */}
          <div className="px-6 pb-6">
            <div className="flex items-end justify-between -mt-12 mb-4">
              {/* Avatar */}
              <div className="relative flex-shrink-0">
                <div className={`w-24 h-24 rounded-2xl overflow-hidden border-4 shadow-lg ${dm ? "border-gray-800" : "border-white"}`}>
                  {avatarUrl ? (
                    <img src={avatarUrl} alt={profile?.company_name || "Company"} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-[#0084ca] to-purple-600 flex items-center justify-center text-white text-3xl font-bold">
                      {initials}
                    </div>
                  )}
                </div>
                {/* Camera button */}
                <button
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploading}
                  className="absolute -bottom-1 -right-1 w-8 h-8 bg-[#0084ca] hover:bg-[#006ba6] rounded-full flex items-center justify-center shadow-lg transition-colors disabled:opacity-60 border-2 border-white dark:border-gray-800"
                  title="Upload company logo"
                >
                  {uploading
                    ? <Loader2 className="w-3.5 h-3.5 text-white animate-spin" />
                    : <Camera className="w-3.5 h-3.5 text-white" />
                  }
                </button>
                <input ref={fileInputRef} type="file" accept="image/*,.heic,.heif" onChange={handleImageChange} className="hidden" />
              </div>

              {/* Edit / Save buttons — clearly outside banner */}
              <div className="flex items-center gap-2 pb-1">
                {editing ? (
                  <>
                    <button
                      onClick={() => setEditing(false)}
                      className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium border transition-colors ${
                        dm ? "border-gray-600 text-gray-300 hover:bg-gray-700" : "border-gray-300 text-gray-600 hover:bg-gray-50"
                      }`}
                    >
                      <X className="w-4 h-4" /> Cancel
                    </button>
                    <button
                      onClick={handleSave}
                      disabled={saving}
                      className="flex items-center gap-1.5 px-4 py-2 bg-[#0084ca] hover:bg-[#006ba6] text-white rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
                    >
                      {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                      {saving ? "Saving..." : "Save"}
                    </button>
                  </>
                ) : (
                  <button
                    onClick={() => setEditing(true)}
                    className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium border transition-colors ${
                      dm
                        ? "border-gray-600 text-gray-300 hover:bg-gray-700 hover:text-white"
                        : "border-gray-300 text-gray-700 hover:bg-gray-50 hover:border-gray-400"
                    }`}
                  >
                    <Edit3 className="w-4 h-4" /> Edit Profile
                  </button>
                )}
              </div>
            </div>

            {/* Company name & meta — view mode */}
            {!editing && (
              <div>
                <h1 className={`text-xl font-bold ${text}`}>
                  {profile?.company_name || user?.name || "Your Company"}
                </h1>
                {profile?.username && (
                  <p className={`text-sm ${muted} mt-0.5`}>@{profile.username}</p>
                )}
                <div className={`flex flex-wrap items-center gap-4 mt-3 text-sm ${muted}`}>
                  {profile?.location && (
                    <span className="flex items-center gap-1.5">
                      <MapPin className="w-4 h-4" /> {profile.location}
                    </span>
                  )}
                  {profile?.website && (
                    <a href={profile.website} target="_blank" rel="noopener noreferrer"
                      className="flex items-center gap-1.5 text-[#0084ca] hover:underline">
                      <Globe className="w-4 h-4" /> {profile.website.replace(/^https?:\/\//, "")}
                    </a>
                  )}
                  <span className="flex items-center gap-1.5">
                    <Mail className="w-4 h-4" /> {profile?.email || user?.email}
                  </span>
                </div>
                {profile?.company_discription && (
                  <p className={`mt-4 text-sm leading-relaxed ${muted} max-w-2xl`}>
                    {profile.company_discription}
                  </p>
                )}
                {!profile?.company_name && (
                  <p className={`mt-3 text-sm italic ${muted}`}>
                    No company info yet — click Edit Profile to get started.
                  </p>
                )}
              </div>
            )}

            {/* Edit form — inline below avatar row */}
            {editing && (
              <div className={`mt-2 pt-5 border-t ${dm ? "border-gray-700" : "border-gray-100"}`}>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Company Name */}
                  <div className="sm:col-span-2">
                    <label className={`block text-xs font-semibold uppercase tracking-wide mb-1.5 ${labelCls}`}>
                      Company Name <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <Building2 className={`absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 ${muted}`} />
                      <input type="text" value={form.company_name}
                        onChange={(e) => setForm({ ...form, company_name: e.target.value })}
                        placeholder="Your company name"
                        className={`w-full pl-10 pr-4 py-2.5 rounded-lg border ${inputCls} focus:outline-none focus:ring-2 focus:ring-[#0084ca]/30 transition-colors`}
                      />
                    </div>
                  </div>

                  {/* Username */}
                  <div>
                    <label className={`block text-xs font-semibold uppercase tracking-wide mb-1.5 ${labelCls}`}>Username</label>
                    <div className="relative">
                      <span className={`absolute left-3 top-1/2 -translate-y-1/2 text-sm font-medium ${muted}`}>@</span>
                      <input type="text" value={form.username}
                        onChange={(e) => setForm({ ...form, username: e.target.value })}
                        placeholder="company_handle"
                        className={`w-full pl-8 pr-4 py-2.5 rounded-lg border ${inputCls} focus:outline-none focus:ring-2 focus:ring-[#0084ca]/30 transition-colors`}
                      />
                    </div>
                  </div>

                  {/* Location */}
                  <div>
                    <label className={`block text-xs font-semibold uppercase tracking-wide mb-1.5 ${labelCls}`}>Location</label>
                    <LocationSelector
                      value={form.location}
                      onChange={(val) => setForm({ ...form, location: val })}
                      darkMode={dm}
                      placeholder="Select location"
                    />
                  </div>

                  {/* Website */}
                  <div className="sm:col-span-2">
                    <label className={`block text-xs font-semibold uppercase tracking-wide mb-1.5 ${labelCls}`}>Website</label>
                    <div className="relative">
                      <LinkIcon className={`absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 ${muted}`} />
                      <input type="url" value={form.website}
                        onChange={(e) => setForm({ ...form, website: e.target.value })}
                        placeholder="https://yourcompany.com"
                        className={`w-full pl-10 pr-4 py-2.5 rounded-lg border ${inputCls} focus:outline-none focus:ring-2 focus:ring-[#0084ca]/30 transition-colors`}
                      />
                    </div>
                  </div>

                  {/* Description */}
                  <div className="sm:col-span-2">
                    <label className={`block text-xs font-semibold uppercase tracking-wide mb-1.5 ${labelCls}`}>About the Company</label>
                    <textarea value={form.company_discription}
                      onChange={(e) => setForm({ ...form, company_discription: e.target.value })}
                      placeholder="Tell talents what your company does, your culture, and what makes you a great employer..."
                      rows={4}
                      className={`w-full px-4 py-2.5 rounded-lg border ${inputCls} focus:outline-none focus:ring-2 focus:ring-[#0084ca]/30 transition-colors resize-none`}
                    />
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* ── Bottom info cards ── */}
        {!editing && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">

            {/* Account card */}
            <div className={`${card} border rounded-xl p-5`}>
              <h3 className={`text-sm font-semibold mb-4 flex items-center gap-2 ${text}`}>
                <User className="w-4 h-4 text-[#0084ca]" /> Account Details
              </h3>
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${dm ? "bg-gray-700" : "bg-gray-100"}`}>
                    <User className={`w-4 h-4 ${muted}`} />
                  </div>
                  <div>
                    <p className={`text-xs ${muted}`}>Full Name</p>
                    <p className={`text-sm font-medium ${text}`}>{profile?.name || user?.name || "—"}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${dm ? "bg-gray-700" : "bg-gray-100"}`}>
                    <Mail className={`w-4 h-4 ${muted}`} />
                  </div>
                  <div className="min-w-0">
                    <p className={`text-xs ${muted}`}>Email</p>
                    <p className={`text-sm font-medium truncate ${text}`}>{profile?.email || user?.email || "—"}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Company quick stats */}
            <div className={`${card} border rounded-xl p-5`}>
              <h3 className={`text-sm font-semibold mb-4 flex items-center gap-2 ${text}`}>
                <Briefcase className="w-4 h-4 text-[#0084ca]" /> Profile Status
              </h3>
              <div className="space-y-3">
                {[
                  { label: "Company Name", done: !!profile?.company_name },
                  { label: "Location", done: !!profile?.location },
                  { label: "Website", done: !!profile?.website },
                  { label: "Description", done: !!profile?.company_discription },
                  { label: "Logo", done: !!profile?.profile_url },
                ].map(({ label, done }) => (
                  <div key={label} className="flex items-center justify-between">
                    <span className={`text-sm ${muted}`}>{label}</span>
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                      done
                        ? "bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-400"
                        : "bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400"
                    }`}>
                      {done ? "✓ Set" : "Missing"}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ── License Verification Card ── */}
        {!editing && (
          <div className={`mt-4 ${card} border rounded-xl p-5`}>
            <div className="flex items-center justify-between mb-4">
              <h3 className={`text-sm font-semibold flex items-center gap-2 ${text}`}>
                <ShieldCheck className="w-4 h-4 text-[#0084ca]" /> Business License Verification
              </h3>
              {licenseStatus?.is_verified && (
                <span className="flex items-center gap-1.5 text-xs font-semibold text-emerald-600 bg-emerald-50 dark:bg-emerald-900/30 px-3 py-1 rounded-full">
                  <BadgeCheck className="w-3.5 h-3.5" /> Verified
                </span>
              )}
            </div>

            {licenseStatus?.is_verified ? (
              <div className={`flex items-center gap-3 p-3 rounded-xl ${dm ? "bg-emerald-900/20" : "bg-emerald-50"}`}>
                <BadgeCheck className="w-5 h-5 text-emerald-500 flex-shrink-0" />
                <p className={`text-sm ${dm ? "text-emerald-300" : "text-emerald-700"}`}>
                  Your business is verified. A verified badge appears on all your job postings.
                </p>
              </div>
            ) : licenseStatus?.license?.status === "pending" ? (
              <div className={`flex items-center gap-3 p-3 rounded-xl ${dm ? "bg-amber-900/20" : "bg-amber-50"}`}>
                <Clock className="w-5 h-5 text-amber-500 flex-shrink-0" />
                <div>
                  <p className={`text-sm font-medium ${dm ? "text-amber-300" : "text-amber-700"}`}>Under Review</p>
                  <p className={`text-xs mt-0.5 ${dm ? "text-amber-400" : "text-amber-600"}`}>
                    Submitted: {new Date(licenseStatus.license.submitted_at).toLocaleDateString()}
                  </p>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                {licenseStatus?.license?.status === "rejected" && (
                  <div className={`flex items-start gap-3 p-3 rounded-xl ${dm ? "bg-red-900/20" : "bg-red-50"}`}>
                    <ShieldAlert className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className={`text-sm font-medium text-red-500`}>License Rejected</p>
                      {licenseStatus.license.admin_note && (
                        <p className={`text-xs mt-0.5 ${dm ? "text-red-300" : "text-red-600"}`}>{licenseStatus.license.admin_note}</p>
                      )}
                    </div>
                  </div>
                )}
                <p className={`text-sm ${muted}`}>
                  Submit your business license or trade certificate to get a verified badge on your job postings.
                </p>
                <button
                  onClick={() => setLicenseModal(true)}
                  className="flex items-center gap-2 px-4 py-2 bg-[#0084ca] hover:bg-[#006ba6] text-white text-sm font-semibold rounded-xl transition-colors"
                >
                  <Upload className="w-4 h-4" />
                  {licenseStatus?.license?.status === "rejected" ? "Resubmit License" : "Submit License"}
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* ── License Modal ── */}
      {licenseModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={() => !licenseSubmitting && setLicenseModal(false)}>
          <div className={`w-full max-w-md rounded-2xl border shadow-2xl ${dm ? "bg-gray-900 border-gray-800" : "bg-white border-slate-200"}`} onClick={e => e.stopPropagation()}>
            <div className={`px-6 py-4 border-b flex items-center justify-between ${dm ? "border-gray-800" : "border-slate-200"}`}>
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-[#0084ca]" />
                <h2 className={`font-semibold ${text}`}>Submit Business License</h2>
              </div>
              <button onClick={() => !licenseSubmitting && setLicenseModal(false)} className={`p-1.5 rounded-lg ${dm ? "hover:bg-gray-800 text-gray-400" : "hover:bg-slate-100 text-gray-500"}`}>
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div className={`p-3 rounded-xl text-sm ${dm ? "bg-blue-900/20 text-blue-300" : "bg-blue-50 text-blue-700"}`}>
                Upload your business registration certificate, trade license, or any official document that verifies your company.
              </div>

              {/* License image upload */}
              <div>
                <label className={`block text-sm font-medium mb-2 ${dm ? "text-gray-300" : "text-gray-700"}`}>
                  License Document <span className="text-red-500">*</span>
                </label>
                <label className={`flex flex-col items-center justify-center gap-2 w-full rounded-xl border-2 border-dashed cursor-pointer transition-colors overflow-hidden ${
                  licenseFile
                    ? dm ? "border-emerald-600 bg-emerald-900/20" : "border-emerald-400 bg-emerald-50"
                    : dm ? "border-gray-600 hover:border-[#0084ca] bg-gray-800" : "border-gray-300 hover:border-[#0084ca] bg-gray-50"
                }`} style={{ minHeight: "120px" }}>
                  <input ref={licenseFileRef} type="file" accept="image/*" className="hidden" onChange={e => handleLicenseFileChange(e.target.files?.[0] || null)} />
                  {licensePreview ? (
                    <div className="w-full">
                      <img src={licensePreview} alt="License preview" className="w-full max-h-40 object-contain p-2" />
                      <p className={`text-xs text-center pb-2 ${muted}`}>Click to change</p>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center gap-2 py-6">
                      <Upload className={`w-8 h-8 ${muted}`} />
                      <p className={`text-sm ${muted}`}>Click to upload license image</p>
                    </div>
                  )}
                </label>
              </div>

              {[{ key: "license_name", label: "License / Certificate Name", required: true, placeholder: "e.g. Business Registration Certificate" },
                { key: "license_number", label: "License Number", required: false, placeholder: "e.g. BR-2024-001234" },
                { key: "issuing_authority", label: "Issuing Authority", required: false, placeholder: "e.g. Ministry of Trade, Addis Ababa" },
              ].map(({ key, label, required, placeholder }) => (
                <div key={key}>
                  <label className={`block text-sm font-medium mb-1.5 ${dm ? "text-gray-300" : "text-gray-700"}`}>
                    {label} {required && <span className="text-red-500">*</span>}
                  </label>
                  <input
                    type="text"
                    value={licenseForm[key as keyof typeof licenseForm]}
                    onChange={e => setLicenseForm(f => ({ ...f, [key]: e.target.value }))}
                    placeholder={placeholder}
                    className={`w-full px-4 py-2.5 rounded-xl border text-sm outline-none focus:ring-2 focus:ring-[#0084ca]/30 focus:border-[#0084ca] transition-colors ${
                      dm ? "bg-gray-800 border-gray-700 text-white placeholder-gray-500" : "bg-white border-gray-200 text-gray-900 placeholder-gray-400"
                    }`}
                  />
                </div>
              ))}

              <div className="flex gap-3 pt-2">
                <button onClick={() => !licenseSubmitting && setLicenseModal(false)}
                  className={`flex-1 py-2.5 rounded-xl border text-sm font-medium transition-colors ${dm ? "border-gray-700 text-gray-300 hover:bg-gray-800" : "border-slate-300 text-gray-600 hover:bg-slate-50"}`}>
                  Cancel
                </button>
                <button onClick={handleLicenseSubmit} disabled={!licenseFile || !licenseForm.license_name.trim() || licenseSubmitting}
                  className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-[#0084ca] hover:bg-[#006ba6] text-white text-sm font-semibold transition-colors disabled:opacity-50">
                  {licenseSubmitting ? <><Loader2 className="w-4 h-4 animate-spin" /> Submitting...</> : <><CheckCircle className="w-4 h-4" /> Submit</>}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
