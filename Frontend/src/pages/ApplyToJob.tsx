import { useState, useEffect } from "react";
import { Link, useParams, useNavigate } from "react-router";
import { useDarkMode } from "../contexts/DarkModeContext";
import {
  ArrowLeft, Clock, DollarSign, FileText, AlertCircle,
  CheckCircle, Loader, Briefcase, MapPin, ShieldCheck, Upload,
} from "lucide-react";
import { getJobApplicationDetails, submitApplication } from "../api/jobs/jobApi";
import { getVerificationStatus, requestVerification } from "../api/talent/talentApi";
import { TALENT_ROUTES, PUBLIC_ROUTES } from "../config/routes";
import AIApplicationAssistant from "../components/application/AIApplicationAssistant";
import { useTalentProfile } from "../hooks/useTalentProfile";

interface VerificationStatus {
  is_verified: boolean;
  request: { id: number; status: string; admin_note?: string; created_at: string } | null;
}

interface ApplicationDetails {
  job: Job & {
    salary?: string;
    budget_type?: string;
    token_cost?: number;
  };
  userTokens: number;
  hasEnoughTokens: boolean;
  alreadyApplied: boolean;
  canApply: boolean;
}

interface FormData {
  cover_letter: string;
  proposal: string;
  estimated_timeline: string;
  budget_proposal: string;
}

export default function ApplyToJob() {
  const { darkMode } = useDarkMode();
  const { jobId } = useParams<{ jobId: string }>();
  const navigate = useNavigate();
  const { profile: talentProfile } = useTalentProfile();

  const [applicationDetails, setApplicationDetails] =
    useState<ApplicationDetails | null>(null);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [verification, setVerification] = useState<VerificationStatus | null>(null);
  const [nationalIdFile, setNationalIdFile] = useState<File | null>(null);
  const [verifMessage, setVerifMessage] = useState("");
  const [verifSubmitting, setVerifSubmitting] = useState(false);
  const [verifSuccess, setVerifSuccess] = useState(false);
  const [formData, setFormData] = useState<FormData>({
    cover_letter: "",
    proposal: "",
    estimated_timeline: "",
    budget_proposal: "",
  });

  useEffect(() => {
    if (jobId) {
      checkVerificationThenLoad();
    }
  }, [jobId]);

  const checkVerificationThenLoad = async () => {
    setLoading(true);
    try {
      const data = await getVerificationStatus();
      setVerification(data);
      if (data.is_verified) await fetchApplicationDetails();
    } catch {
      await fetchApplicationDetails();
    } finally {
      setLoading(false);
    }
  };

  const handleRequestVerification = async () => {
    if (!nationalIdFile) return;
    setVerifSubmitting(true);
    setError(null);
    try {
      await requestVerification(nationalIdFile, verifMessage);
      setVerifSuccess(true);
      setVerification((prev) => prev ? { ...prev, request: { id: 0, status: "pending", created_at: new Date().toISOString() } } : prev);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setVerifSubmitting(false);
    }
  };

  const fetchApplicationDetails = async () => {
    if (!jobId) return;

    setLoading(true);
    setError(null);

    try {
      const details = await getJobApplicationDetails(parseInt(jobId));
      setApplicationDetails(details);

      if (!details.canApply) {
        setError(
          details.alreadyApplied
            ? "You have already applied for this job"
            : "You cannot apply for this job",
        );
      }
    } catch (err: any) {
      setError(err.message || "Failed to load application details");
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: keyof FormData, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
    setError(null);
  };

  const handleAIContentGenerated = (content: string, type: 'cover_letter' | 'proposal') => {
    setFormData((prev) => ({
      ...prev,
      [type]: content,
    }));
  };

  const validateForm = (): boolean => {
    if (!formData.cover_letter.trim()) {
      setError("Cover letter is required");
      return false;
    }

    if (formData.cover_letter.length < 50) {
      setError("Cover letter must be at least 50 characters");
      return false;
    }

    if (formData.proposal && formData.proposal.length < 100) {
      setError("Proposal must be at least 100 characters if provided");
      return false;
    }

    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      await submitApplication(parseInt(jobId!), {
        cover_letter: formData.cover_letter.trim(),
        proposal: formData.proposal.trim() || undefined,
        estimated_timeline: formData.estimated_timeline.trim() || undefined,
        budget_proposal: formData.budget_proposal.trim() || undefined,
      });

      setSuccess(true);

      // Redirect after success
      setTimeout(() => {
        navigate("/my-applications");
      }, 3000);
    } catch (err: any) {
      setError(err.message || "Failed to submit application");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div
        className={`min-h-screen transition-colors duration-300 ${
          darkMode ? "bg-gray-900" : "bg-gray-50"
        }`}
      >
        <div className="flex items-center justify-center min-h-screen">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#0084ca]"></div>
          <span className="ml-4 text-gray-600 dark:text-gray-400">
            Loading application details...
          </span>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`min-h-screen transition-colors duration-300 ${
        darkMode ? "bg-gray-900" : "bg-gray-50"
      }`}
    >
      {/* Header */}
      <header
        className={`transition-colors duration-300 ${
          darkMode
            ? "bg-gray-800 border-gray-700"
            : "bg-white border-b border-gray-200"
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Link
              to={TALENT_ROUTES.DASHBOARD.path}
              className={`flex items-center gap-2 text-sm font-medium transition-colors duration-300 ${
                darkMode
                  ? "text-gray-300 hover:text-white"
                  : "text-gray-600 hover:text-gray-900"
              }`}
            >
              <ArrowLeft className="w-5 h-5" />
              <span>Back to Dashboard</span>
            </Link>

            <div className="flex items-center gap-4">
              <Link
                to={PUBLIC_ROUTES.HOME.path}
                className="text-2xl font-bold text-[#0084ca]"
              >
                ETN
              </Link>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Page Header */}
        <div className="mb-8">
          <h1
            className={`text-3xl font-bold mb-2 ${
              darkMode ? "text-white" : "text-gray-900"
            }`}
          >
            Apply for Job
          </h1>
          <p className={darkMode ? "text-gray-400" : "text-gray-600"}>
            Submit your application and proposal
          </p>
        </div>

        {/* Verification Gate */}
        {verification && !verification.is_verified ? (
          <div className={`max-w-lg mx-auto text-center p-10 rounded-2xl border ${
            darkMode ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200"
          }`}>
            <div className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-5 ${
              darkMode ? "bg-gray-700" : "bg-[#0084ca]/10"
            }`}>
              <ShieldCheck className="w-8 h-8 text-[#0084ca]" />
            </div>

            {verification.request?.status === "pending" || verifSuccess ? (
              <>
                <h2 className={`text-xl font-bold mb-2 ${darkMode ? "text-white" : "text-gray-900"}`}>Verification Pending</h2>
                <p className={`text-sm mb-6 ${darkMode ? "text-gray-400" : "text-gray-500"}`}>
                  Your verification request has been submitted. An admin will review it shortly.
                  You'll be notified once it's approved.
                </p>
                <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium ${
                  darkMode ? "bg-yellow-900/30 text-yellow-400" : "bg-yellow-50 text-yellow-700 border border-yellow-200"
                }`}>
                  <span className="w-2 h-2 rounded-full bg-yellow-400 animate-pulse" />
                  Awaiting admin review
                </div>
              </>
            ) : (
              <>
                <h2 className={`text-xl font-bold mb-2 ${darkMode ? "text-white" : "text-gray-900"}`}>
                  {verification.request?.status === "rejected" ? "Verification Rejected" : "Verification Required"}
                </h2>
                <p className={`text-sm mb-1 ${darkMode ? "text-gray-400" : "text-gray-500"}`}>
                  {verification.request?.status === "rejected"
                    ? "Your previous request was rejected. Please resubmit with a clear National ID photo."
                    : "Upload your Ethiopian National ID to get verified before applying for jobs."}
                </p>
                {verification.request?.admin_note && (
                  <p className={`text-xs mb-4 px-3 py-2 rounded-lg ${
                    darkMode ? "bg-red-900/20 text-red-400" : "bg-red-50 text-red-600"
                  }`}>{verification.request.admin_note}</p>
                )}

                {/* National ID upload */}
                <div className="mt-5 mb-4 text-left">
                  <label className={`block text-sm font-medium mb-2 ${darkMode ? "text-gray-300" : "text-gray-700"}`}>
                    National ID Photo <span className="text-red-500">*</span>
                  </label>
                  <label className={`flex flex-col items-center justify-center gap-2 w-full h-32 rounded-xl border-2 border-dashed cursor-pointer transition-colors ${
                    nationalIdFile
                      ? darkMode ? "border-emerald-600 bg-emerald-900/20" : "border-emerald-400 bg-emerald-50"
                      : darkMode ? "border-gray-600 hover:border-gray-500 bg-gray-700" : "border-gray-300 hover:border-[#0084ca] bg-gray-50"
                  }`}>
                    <input type="file" accept="image/*" className="hidden" onChange={e => setNationalIdFile(e.target.files?.[0] || null)} />
                    {nationalIdFile ? (
                      <>
                        <CheckCircle className="w-7 h-7 text-emerald-500" />
                        <p className={`text-sm font-medium ${darkMode ? "text-emerald-300" : "text-emerald-700"}`}>{nationalIdFile.name}</p>
                        <p className={`text-xs ${darkMode ? "text-gray-400" : "text-gray-500"}`}>Click to change</p>
                      </>
                    ) : (
                      <>
                        <Upload className={`w-7 h-7 ${darkMode ? "text-gray-500" : "text-gray-400"}`} />
                        <p className={`text-sm ${darkMode ? "text-gray-400" : "text-gray-500"}`}>Click to upload your National ID</p>
                      </>
                    )}
                  </label>
                </div>

                <textarea
                  value={verifMessage}
                  onChange={(e) => setVerifMessage(e.target.value)}
                  placeholder="Message to admin (optional)"
                  rows={2}
                  className={`w-full px-4 py-2.5 rounded-xl border text-sm outline-none mb-4 ${
                    darkMode ? "bg-gray-700 border-gray-600 text-white placeholder-gray-500" : "bg-gray-50 border-gray-200 text-gray-900 placeholder-gray-400"
                  }`}
                />
                {error && <p className="text-sm text-red-500 mb-3">{error}</p>}
                <button
                  onClick={handleRequestVerification}
                  disabled={verifSubmitting || !nationalIdFile}
                  className="flex items-center gap-2 px-6 py-2.5 bg-[#0084ca] hover:bg-[#006ba6] text-white text-sm font-semibold rounded-xl transition-colors disabled:opacity-50 mx-auto"
                >
                  {verifSubmitting ? <Loader className="w-4 h-4 animate-spin" /> : <ShieldCheck className="w-4 h-4" />}
                  {verification.request?.status === "rejected" ? "Resubmit Request" : "Submit Verification"}
                </button>
              </>
            )}
          </div>
        ) : error && !applicationDetails ? (
          <div
            className={`text-center p-12 rounded-xl border ${
              darkMode
                ? "bg-gray-800 border-gray-700"
                : "bg-white border-gray-200"
            }`}
          >
            <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
            <p className="text-red-600 mb-4">{error}</p>
            <button
              onClick={fetchApplicationDetails}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Try Again
            </button>
          </div>
        ) : success ? (
          <div
            className={`text-center p-12 rounded-xl border ${
              darkMode
                ? "bg-gray-800 border-gray-700"
                : "bg-white border-gray-200"
            }`}
          >
            <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
            <h3
              className={`text-xl font-semibold mb-2 ${
                darkMode ? "text-white" : "text-gray-900"
              }`}
            >
              Application Submitted!
            </h3>
            <p
              className={`${darkMode ? "text-gray-400" : "text-gray-600"} mb-4`}
            >
              Your proposal has been submitted successfully.{" "}
              {applicationDetails?.job.token_cost} tokens have been deducted
              from your balance.
            </p>
            <p className="text-sm text-gray-500">
              Redirecting to your applications...
            </p>
          </div>
        ) : (
          <>
            {/* Job Details & Token Info */}
            {applicationDetails && (
              <div
                className={`mb-8 p-6 rounded-xl border ${
                  darkMode
                    ? "bg-gray-800 border-gray-700"
                    : "bg-white border-gray-200"
                }`}
              >
                <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-6 mb-6">
                  <div className="flex-1">
                    <h3
                      className={`text-xl font-semibold mb-2 ${
                        darkMode ? "text-white" : "text-gray-900"
                      }`}
                    >
                      {applicationDetails.job.title}
                    </h3>
                    <p className={`text-gray-600 dark:text-gray-400 mb-3`}>
                      {applicationDetails.job.company}
                    </p>
                    <div className="flex flex-wrap gap-4 text-sm">
                      <div
                        className={`flex items-center gap-1 ${
                          darkMode ? "text-gray-400" : "text-gray-600"
                        }`}
                      >
                        <MapPin className="w-4 h-4" />
                        {applicationDetails.job.location}
                      </div>
                      <div
                        className={`flex items-center gap-1 ${
                          darkMode ? "text-gray-400" : "text-gray-600"
                        }`}
                      >
                        <Briefcase className="w-4 h-4" />
                        {applicationDetails.job.experience} level
                      </div>
                      <div
                        className={`flex items-center gap-1 ${
                          darkMode ? "text-gray-400" : "text-gray-600"
                        }`}
                      >
                        <DollarSign className="w-4 h-4" />
                        {applicationDetails.job.salary ||
                          applicationDetails.job.budget ||
                          "Negotiable"}
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div
                      className={`text-2xl font-bold ${
                        darkMode ? "text-white" : "text-gray-900"
                      }`}
                    >
                      {applicationDetails.job.salary ||
                        applicationDetails.job.budget ||
                        "Negotiable"}
                    </div>
                    <div
                      className={`text-sm ${
                        darkMode ? "text-gray-400" : "text-gray-600"
                      }`}
                    >
                      {applicationDetails.job.budget_type === "fixed" ||
                      applicationDetails.job.budget?.includes("$")
                        ? "Fixed Price"
                        : "Hourly"}
                    </div>
                  </div>
                </div>

                {/* Token Information */}
                <div
                  className={`border-t pt-6 ${
                    darkMode ? "border-gray-700" : "border-gray-200"
                  }`}
                >
                  <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                    <div>
                      <div
                        className={`flex items-center text-sm ${
                          darkMode ? "text-gray-400" : "text-gray-600"
                        } mb-1`}
                      >
                        <DollarSign className="w-4 h-4 mr-1" />
                        Your Token Balance
                      </div>
                      <div
                        className={`text-2xl font-bold ${
                          darkMode ? "text-white" : "text-gray-900"
                        }`}
                      >
                        {applicationDetails.userTokens} tokens
                      </div>
                    </div>
                    <div className="text-right">
                      <div
                        className={`flex items-center text-sm ${
                          darkMode ? "text-gray-400" : "text-gray-600"
                        } mb-1`}
                      >
                        <AlertCircle className="w-4 h-4 mr-1" />
                        Cost to Apply
                      </div>
                      <div className="text-2xl font-bold text-blue-600">
                        {applicationDetails.job.token_cost || 0} tokens
                      </div>
                    </div>
                  </div>

                  {applicationDetails.hasEnoughTokens ? (
                    <div
                      className={`mt-4 p-3 rounded-lg ${
                        darkMode
                          ? "bg-green-900/30 border border-green-700"
                          : "bg-green-50 border border-green-200"
                      }`}
                    >
                      <p
                        className={`text-sm ${
                          darkMode ? "text-green-300" : "text-green-700"
                        }`}
                      >
                        ✓ You have enough tokens to apply for this job
                      </p>
                    </div>
                  ) : (
                    <div
                      className={`mt-4 p-3 rounded-lg ${
                        darkMode
                          ? "bg-red-900/30 border border-red-700"
                          : "bg-red-50 border border-red-200"
                      }`}
                    >
                      <p
                        className={`text-sm ${
                          darkMode ? "text-red-300" : "text-red-700"
                        }`}
                      >
                        ✗ You need{" "}
                        {Math.max(
                          0,
                          (applicationDetails.job.token_cost || 0) -
                            applicationDetails.userTokens,
                        )}{" "}
                        more tokens to apply
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* AI Assistant */}
            {applicationDetails?.canApply && talentProfile && (
              <AIApplicationAssistant
                talentProfile={talentProfile}
                jobDetails={{
                  title: applicationDetails.job.title,
                  description: applicationDetails.job.description || '',
                  requirements: applicationDetails.job.requirements || '',
                  company: applicationDetails.job.company,
                  location: applicationDetails.job.location,
                  experience: applicationDetails.job.experience,
                  salary: applicationDetails.job.salary,
                  budget: applicationDetails.job.budget
                }}
                onContentGenerated={handleAIContentGenerated}
                darkMode={darkMode}
              />
            )}

            {/* Application Form */}
            {applicationDetails?.canApply && (
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Cover Letter */}
                <div
                  className={`p-6 rounded-xl border ${
                    darkMode
                      ? "bg-gray-800 border-gray-700"
                      : "bg-white border-gray-200"
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <label
                      className={`block text-sm font-medium ${
                        darkMode ? "text-gray-300" : "text-gray-700"
                      }`}
                    >
                      Cover Letter <span className="text-red-500">*</span>
                    </label>
                    {formData.cover_letter && (
                      <span className={`text-xs ${
                        darkMode ? "text-green-400" : "text-green-600"
                      }`}>
                        ✓ Content ready
                      </span>
                    )}
                  </div>
                  <textarea
                    value={formData.cover_letter}
                    onChange={(e) =>
                      handleInputChange("cover_letter", e.target.value)
                    }
                    className={`w-full px-4 py-3 rounded-lg border focus:ring-2 focus:ring-[#0084ca] focus:border-transparent ${
                      darkMode
                        ? "bg-gray-700 border-gray-600 text-white placeholder-gray-400"
                        : "bg-white border-gray-300 text-gray-900 placeholder-gray-500"
                    }`}
                    rows={6}
                    placeholder="Introduce yourself and explain why you're the perfect fit for this job..."
                    required
                  />
                  <p
                    className={`text-sm mt-2 ${
                      darkMode ? "text-gray-400" : "text-gray-500"
                    }`}
                  >
                    Minimum 50 characters ({formData.cover_letter.length}/50)
                  </p>
                </div>

                {/* Detailed Proposal */}
                <div
                  className={`p-6 rounded-xl border ${
                    darkMode
                      ? "bg-gray-800 border-gray-700"
                      : "bg-white border-gray-200"
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <label
                      className={`block text-sm font-medium flex items-center gap-2 ${
                        darkMode ? "text-gray-300" : "text-gray-700"
                      }`}
                    >
                      <FileText className="w-4 h-4" />
                      Detailed Proposal
                    </label>
                    {formData.proposal && (
                      <span className={`text-xs ${
                        darkMode ? "text-green-400" : "text-green-600"
                      }`}>
                        ✓ Content ready
                      </span>
                    )}
                  </div>
                  <textarea
                    value={formData.proposal}
                    onChange={(e) =>
                      handleInputChange("proposal", e.target.value)
                    }
                    className={`w-full px-4 py-3 rounded-lg border focus:ring-2 focus:ring-[#0084ca] focus:border-transparent ${
                      darkMode
                        ? "bg-gray-700 border-gray-600 text-white placeholder-gray-400"
                        : "bg-white border-gray-300 text-gray-900 placeholder-gray-500"
                    }`}
                    rows={8}
                    placeholder="Provide a detailed proposal explaining your approach, methodology, and how you plan to complete this project..."
                  />
                  <p
                    className={`text-sm mt-2 ${
                      darkMode ? "text-gray-400" : "text-gray-500"
                    }`}
                  >
                    Optional, but recommended (minimum 100 characters if
                    provided)
                  </p>
                </div>

                {/* Timeline and Budget */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div
                    className={`p-6 rounded-xl border ${
                      darkMode
                        ? "bg-gray-800 border-gray-700"
                        : "bg-white border-gray-200"
                    }`}
                  >
                    <label
                      className={`block text-sm font-medium mb-2 flex items-center gap-2 ${
                        darkMode ? "text-gray-300" : "text-gray-700"
                      }`}
                    >
                      <Clock className="w-4 h-4" />
                      Estimated Timeline
                    </label>
                    <input
                      type="text"
                      value={formData.estimated_timeline}
                      onChange={(e) =>
                        handleInputChange("estimated_timeline", e.target.value)
                      }
                      className={`w-full px-4 py-3 rounded-lg border focus:ring-2 focus:ring-[#0084ca] focus:border-transparent ${
                        darkMode
                          ? "bg-gray-700 border-gray-600 text-white placeholder-gray-400"
                          : "bg-white border-gray-300 text-gray-900 placeholder-gray-500"
                      }`}
                      placeholder="e.g., 2 weeks, 1 month, 3 days"
                    />
                  </div>

                  <div
                    className={`p-6 rounded-xl border ${
                      darkMode
                        ? "bg-gray-800 border-gray-700"
                        : "bg-white border-gray-200"
                    }`}
                  >
                    <label
                      className={`block text-sm font-medium mb-2 flex items-center gap-2 ${
                        darkMode ? "text-gray-300" : "text-gray-700"
                      }`}
                    >
                      <DollarSign className="w-4 h-4" />
                      Budget Proposal
                    </label>
                    <input
                      type="text"
                      value={formData.budget_proposal}
                      onChange={(e) =>
                        handleInputChange("budget_proposal", e.target.value)
                      }
                      className={`w-full px-4 py-3 rounded-lg border focus:ring-2 focus:ring-[#0084ca] focus:border-transparent ${
                        darkMode
                          ? "bg-gray-700 border-gray-600 text-white placeholder-gray-400"
                          : "bg-white border-gray-300 text-gray-900 placeholder-gray-500"
                      }`}
                      placeholder="e.g., $500, $50/hour, Negotiable"
                    />
                  </div>
                </div>

                {/* Error Message */}
                {error && (
                  <div
                    className={`p-4 rounded-lg ${
                      darkMode
                        ? "bg-red-900/30 border border-red-700"
                        : "bg-red-50 border border-red-200"
                    }`}
                  >
                    <p
                      className={`text-sm ${darkMode ? "text-red-300" : "text-red-600"}`}
                    >
                      {error}
                    </p>
                  </div>
                )}

                {/* Submit Button */}
                <div className="flex items-center justify-between pt-4">
                  <Link
                    to={TALENT_ROUTES.DASHBOARD.path}
                    className={`px-6 py-3 rounded-lg transition-colors ${
                      darkMode
                        ? "text-gray-400 hover:text-white"
                        : "text-gray-600 hover:text-gray-900"
                    }`}
                  >
                    Cancel
                  </Link>
                  <button
                    type="submit"
                    className="px-8 py-3 bg-[#0084ca] text-white rounded-lg hover:bg-[#006ba6] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
                    disabled={submitting}
                  >
                    {submitting ? (
                      <>
                        <Loader className="w-4 h-4 animate-spin mr-2" />
                        Submitting...
                      </>
                    ) : (
                      `Submit Application (${applicationDetails?.job.token_cost || 0} tokens)`
                    )}
                  </button>
                </div>
              </form>
            )}
          </>
        )}
      </div>
    </div>
  );
}
