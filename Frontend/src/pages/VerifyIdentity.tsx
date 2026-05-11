import { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import { useDarkMode } from "../contexts/DarkModeContext";
import { ShieldCheck, Upload, CheckCircle, Clock, AlertCircle, ArrowLeft, Loader, ShieldAlert } from "lucide-react";
import { getVerificationStatus, requestVerification } from "../api/talent/talentApi";
import { TALENT_ROUTES } from "../config/routes";

export default function VerifyIdentity() {
  const { darkMode: dm } = useDarkMode();
  const navigate = useNavigate();

  const [status, setStatus] = useState<{ is_verified: boolean; request: any } | null>(null);
  const [loading, setLoading] = useState(true);
  const [nationalIdFile, setNationalIdFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    getVerificationStatus()
      .then(setStatus)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const handleFileChange = (file: File | null) => {
    setNationalIdFile(file);
    setError(null);
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => setPreview(e.target?.result as string);
      reader.readAsDataURL(file);
    } else {
      setPreview(null);
    }
  };

  const handleSubmit = async () => {
    if (!nationalIdFile) { setError("Please upload your National ID photo."); return; }
    setSubmitting(true);
    setError(null);
    try {
      await requestVerification(nationalIdFile, message);
      setSuccess(true);
      setStatus({ is_verified: false, request: { status: "pending", created_at: new Date().toISOString() } });
    } catch (e: any) {
      setError(e.message);
    } finally {
      setSubmitting(false);
    }
  };

  const bg = dm ? "bg-gray-900" : "bg-slate-100";
  const card = dm ? "bg-gray-800 border-gray-700" : "bg-white border-slate-200";
  const text = dm ? "text-white" : "text-gray-900";
  const muted = dm ? "text-gray-400" : "text-gray-500";
  const inputCls = `w-full px-4 py-2.5 rounded-xl border text-sm outline-none focus:ring-2 focus:ring-[#0084ca]/30 focus:border-[#0084ca] transition-colors ${dm ? "bg-gray-700 border-gray-600 text-white placeholder-gray-500" : "bg-white border-gray-200 text-gray-900 placeholder-gray-400"}`;

  if (loading) {
    return (
      <div className={`min-h-screen flex items-center justify-center ${bg}`}>
        <Loader className="w-8 h-8 animate-spin text-[#0084ca]" />
      </div>
    );
  }

  return (
    <div className={`min-h-screen ${bg} transition-colors duration-300`}>
      {/* Header */}
      <header className={`sticky top-0 z-10 border-b shadow-sm ${dm ? "bg-gray-900 border-gray-800" : "bg-white border-slate-200"}`}>
        <div className="max-w-2xl mx-auto px-4 h-14 flex items-center gap-3">
          <button onClick={() => navigate(TALENT_ROUTES.PROFILE.path)} className={`p-1.5 rounded-lg transition-colors ${dm ? "hover:bg-gray-800 text-gray-400" : "hover:bg-slate-100 text-gray-500"}`}>
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-[#0084ca]" />
            <span className={`font-semibold ${text}`}>Identity Verification</span>
          </div>
        </div>
      </header>

      <div className="max-w-2xl mx-auto px-4 py-8 space-y-6">

        {/* Already verified */}
        {status?.is_verified && (
          <div className={`rounded-2xl border p-8 text-center ${card}`}>
            <div className="w-16 h-16 rounded-full bg-emerald-100 flex items-center justify-center mx-auto mb-4">
              <ShieldCheck className="w-8 h-8 text-emerald-500" />
            </div>
            <h2 className={`text-xl font-bold mb-2 ${text}`}>You're Verified!</h2>
            <p className={`text-sm mb-6 ${muted}`}>Your identity has been verified. You can now apply for jobs on ETN.</p>
            <button onClick={() => navigate(TALENT_ROUTES.DASHBOARD.path)}
              className="px-6 py-2.5 bg-[#0084ca] hover:bg-[#006ba6] text-white text-sm font-semibold rounded-xl transition-colors">
              Browse Jobs
            </button>
          </div>
        )}

        {/* Pending */}
        {!status?.is_verified && (status?.request?.status === "pending" || success) && (
          <div className={`rounded-2xl border p-8 text-center ${card}`}>
            <div className="w-16 h-16 rounded-full bg-amber-100 flex items-center justify-center mx-auto mb-4">
              <Clock className="w-8 h-8 text-amber-500" />
            </div>
            <h2 className={`text-xl font-bold mb-2 ${text}`}>Under Review</h2>
            <p className={`text-sm mb-6 ${muted}`}>
              Your verification request has been submitted. An admin will review your National ID and notify you once it's approved.
            </p>
            <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium ${dm ? "bg-amber-900/30 text-amber-300" : "bg-amber-50 text-amber-700 border border-amber-200"}`}>
              <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
              Awaiting admin review
            </div>
          </div>
        )}

        {/* Not verified / rejected — show form */}
        {!status?.is_verified && status?.request?.status !== "pending" && !success && (
          <>
            {/* Info banner */}
            <div className={`rounded-xl border p-5 ${card}`}>
              <div className="flex items-start gap-4">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${dm ? "bg-blue-900/30" : "bg-blue-50"}`}>
                  <ShieldCheck className="w-5 h-5 text-[#0084ca]" />
                </div>
                <div>
                  <p className={`font-semibold text-sm mb-1 ${text}`}>Why verification is required</p>
                  <p className={`text-sm ${muted}`}>
                    ETN requires all talents to verify their identity with an Ethiopian National ID (Fayda ID or old ID card) before applying for jobs. This ensures trust and safety on the platform.
                  </p>
                </div>
              </div>
            </div>

            {/* Rejected note */}
            {status?.request?.status === "rejected" && (
              <div className={`rounded-xl border p-4 flex items-start gap-3 ${dm ? "bg-red-900/20 border-red-800" : "bg-red-50 border-red-200"}`}>
                <ShieldAlert className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-semibold text-red-500">Previous request rejected</p>
                  {status.request.admin_note && (
                    <p className={`text-sm mt-0.5 ${dm ? "text-red-300" : "text-red-600"}`}>{status.request.admin_note}</p>
                  )}
                  <p className={`text-sm mt-1 ${muted}`}>Please resubmit with a clearer photo.</p>
                </div>
              </div>
            )}

            {/* Upload form */}
            <div className={`rounded-2xl border p-6 space-y-5 ${card}`}>
              <h2 className={`font-bold text-lg ${text}`}>Upload Your National ID</h2>

              {/* File drop area */}
              <div>
                <label className={`block text-sm font-medium mb-2 ${dm ? "text-gray-300" : "text-gray-700"}`}>
                  National ID Photo <span className="text-red-500">*</span>
                </label>
                <label className={`flex flex-col items-center justify-center gap-3 w-full rounded-xl border-2 border-dashed cursor-pointer transition-colors overflow-hidden ${
                  nationalIdFile
                    ? dm ? "border-emerald-600 bg-emerald-900/20" : "border-emerald-400 bg-emerald-50"
                    : dm ? "border-gray-600 hover:border-[#0084ca] bg-gray-700/50" : "border-gray-300 hover:border-[#0084ca] bg-gray-50"
                }`} style={{ minHeight: "160px" }}>
                  <input type="file" accept="image/*" className="hidden" onChange={e => handleFileChange(e.target.files?.[0] || null)} />
                  {preview ? (
                    <div className="w-full">
                      <img src={preview} alt="National ID preview" className="w-full max-h-56 object-contain p-2" />
                      <p className={`text-xs text-center pb-2 ${muted}`}>Click to change</p>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center gap-2 py-8 px-4 text-center">
                      <Upload className={`w-10 h-10 ${dm ? "text-gray-500" : "text-gray-400"}`} />
                      <p className={`text-sm font-medium ${dm ? "text-gray-300" : "text-gray-600"}`}>Click to upload your National ID</p>
                      <p className={`text-xs ${muted}`}>JPG or PNG — front side of your ID card</p>
                    </div>
                  )}
                </label>
              </div>

              {/* Optional message */}
              <div>
                <label className={`block text-sm font-medium mb-2 ${dm ? "text-gray-300" : "text-gray-700"}`}>
                  Message to Admin <span className={`text-xs font-normal ${muted}`}>(optional)</span>
                </label>
                <textarea
                  value={message}
                  onChange={e => setMessage(e.target.value)}
                  rows={3}
                  placeholder="Any additional information for the admin..."
                  className={`${inputCls} resize-none`}
                />
              </div>

              {error && (
                <div className="flex items-center gap-2 p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" /> {error}
                </div>
              )}

              <button
                onClick={handleSubmit}
                disabled={!nationalIdFile || submitting}
                className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-[#0084ca] hover:bg-[#006ba6] text-white font-semibold transition-colors disabled:opacity-50"
              >
                {submitting
                  ? <><Loader className="w-4 h-4 animate-spin" /> Submitting...</>
                  : <><CheckCircle className="w-4 h-4" /> Submit Verification Request</>
                }
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
