import { useState, useEffect } from "react";
import { useParams, useNavigate, useLocation } from "react-router";
import { useDarkMode } from "../../contexts/DarkModeContext";
import { useAuth } from "../../contexts/AuthContext";
import { Header } from "../../features/employer/components/Header";
import { getApplicationsByJob } from "../../api/employer/employerApi";
import {
  ArrowLeft, FileText, CheckCircle, AlertCircle, Loader2,
  User, Mail, Briefcase, DollarSign, Calendar, Shield,
} from "lucide-react";

interface Proposal {
  id: number;
  talent_id: number;
  talent_name: string;
  talent_email: string;
  profile_image: string;
  job_id: number;
  applied_at: string;
  status: string;
}

export default function AgreementPage() {
  const { jobId } = useParams<{ jobId: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const { darkMode } = useDarkMode();
  const { token } = useAuth();
  const dm = darkMode;

  const applicationId: number | undefined = (location.state as any)?.application_id;
  const talentName: string | undefined = (location.state as any)?.talent_name;
  const talentEmail: string | undefined = (location.state as any)?.talent_email;
  const talentImage: string | undefined = (location.state as any)?.profile_image;

  const [proposal, setProposal] = useState<Proposal | null>(null);
  const [loading, setLoading] = useState(true);
  const [agreementAccepted, setAgreementAccepted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!applicationId || !jobId) {
      setError("Missing required information. Please go back and try again.");
      setLoading(false);
      return;
    }

    const fetchProposal = async () => {
      try {
        if (!token) throw new Error("No authentication token");
        const applications = await getApplicationsByJob(token, parseInt(jobId));
        const found = applications.find((app: any) => app.applicationID === applicationId);
        if (found) {
          setProposal({
            id: found.applicationID,
            talent_id: found.talent_id,
            talent_name: found.name,
            talent_email: found.email,
            profile_image: found.profile_image || "",
            job_id: parseInt(jobId),
            applied_at: found.applied_at,
            status: found.status,
          });
        }
      } catch (e: any) {
        setError(e.message);
      } finally {
        setLoading(false);
      }
    };

    fetchProposal();
  }, [applicationId, jobId, token]);

  const handleProceedToPayment = () => {
    if (!agreementAccepted) {
      setError("Please accept the agreement to proceed");
      return;
    }
    if (!applicationId) {
      setError("Application ID missing");
      return;
    }
    setSubmitting(true);
    navigate(`/escrow-payment/${jobId}`, {
      state: { application_id: applicationId },
    });
  };

  const card = dm ? "bg-gray-800 border-gray-700" : "bg-white border-slate-200";
  const text = dm ? "text-white" : "text-gray-900";
  const muted = dm ? "text-gray-400" : "text-gray-500";
  const bg = dm ? "bg-gray-900" : "bg-slate-100";

  if (loading) {
    return (
      <div className={`min-h-screen ${bg}`}>
        <Header />
        <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8 flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-[#0084ca]" />
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen ${bg} transition-colors duration-300`}>
      <Header />

      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8">
        <button
          onClick={() => navigate(-1)}
          className={`flex items-center gap-2 text-sm font-medium mb-6 transition-colors ${dm ? "text-gray-400 hover:text-white" : "text-gray-500 hover:text-gray-900"}`}
        >
          <ArrowLeft className="w-4 h-4" /> Back
        </button>

        <div className="flex items-center gap-4 mb-8">
          <div className="w-12 h-12 rounded-2xl bg-[#0084ca] flex items-center justify-center shadow-lg shadow-[#0084ca]/20">
            <FileText className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className={`text-2xl font-bold ${text}`}>Work Agreement</h1>
            <p className={`text-sm ${muted}`}>Review and accept the terms before proceeding to payment</p>
          </div>
        </div>

        {error && (
          <div className="mb-5 flex items-start gap-3 p-4 rounded-xl bg-red-50 border border-red-200 text-red-700">
            <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
            <p className="text-sm font-medium">{error}</p>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          <div className="lg:col-span-2 space-y-5">
            {(proposal || talentName) && (
              <div className={`rounded-xl border p-5 ${card}`}>
                <h2 className={`text-sm font-semibold uppercase tracking-wider mb-4 ${muted}`}>Talent Information</h2>
                <div className="flex items-center gap-4">
                  {(talentImage || proposal?.profile_image) && (
                    <img
                      src={talentImage || proposal?.profile_image}
                      alt={talentName || proposal?.talent_name}
                      className="w-16 h-16 rounded-full object-cover"
                    />
                  )}
                  {!(talentImage || proposal?.profile_image) && (
                    <div className={`w-16 h-16 rounded-full flex items-center justify-center text-2xl font-bold ${dm ? "bg-gray-700 text-gray-300" : "bg-slate-200 text-gray-600"}`}>
                      {(talentName || proposal?.talent_name)?.[0]?.toUpperCase()}
                    </div>
                  )}
                  <div>
                    <p className={`text-lg font-semibold ${text}`}>{talentName || proposal?.talent_name}</p>
                    <div className="flex items-center gap-1 text-sm mt-1">
                      <Mail className="w-4 h-4" />
                      <p className={muted}>{talentEmail || proposal?.talent_email}</p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            <div className={`rounded-xl border overflow-hidden ${card}`}>
              <div className={`px-5 py-4 border-b flex items-center gap-2 ${dm ? "border-gray-700 bg-gray-800/50" : "border-slate-100 bg-slate-50"}`}>
                <Shield className="w-5 h-5 text-[#0084ca]" />
                <h2 className={`font-semibold ${text}`}>Work Agreement Terms</h2>
              </div>

              <div className="p-6 space-y-6">
                <div>
                  <h3 className={`text-sm font-semibold mb-2 ${text}`}>1. Scope of Work</h3>
                  <p className={`text-sm leading-relaxed ${muted}`}>
                    The talent agrees to deliver the work as described in the job posting. The employer agrees to provide clear instructions and feedback throughout the project.
                  </p>
                </div>

                <div>
                  <h3 className={`text-sm font-semibold mb-2 ${text}`}>2. Payment Terms</h3>
                  <p className={`text-sm leading-relaxed ${muted}`}>
                    Payment will be held in secure escrow until the employer approves the completed work. Once approved, payment will be released to the talent's account within 24-48 hours.
                  </p>
                </div>

                <div>
                  <h3 className={`text-sm font-semibold mb-2 ${text}`}>3. Timeline & Deadlines</h3>
                  <p className={`text-sm leading-relaxed ${muted}`}>
                    Both parties agree to communicate any delays or issues promptly. The talent will deliver the work by the agreed deadline, and the employer will review and provide feedback within 5 business days.
                  </p>
                </div>

                <div>
                  <h3 className={`text-sm font-semibold mb-2 ${text}`}>4. Quality & Revisions</h3>
                  <p className={`text-sm leading-relaxed ${muted}`}>
                    The talent commits to delivering high-quality work. The employer may request reasonable revisions. Unlimited revision requests beyond the scope may be subject to additional fees.
                  </p>
                </div>

                <div>
                  <h3 className={`text-sm font-semibold mb-2 ${text}`}>5. Confidentiality</h3>
                  <p className={`text-sm leading-relaxed ${muted}`}>
                    Both parties agree to keep project details confidential and not disclose them to third parties without written consent.
                  </p>
                </div>

                <div>
                  <h3 className={`text-sm font-semibold mb-2 ${text}`}>6. Dispute Resolution</h3>
                  <p className={`text-sm leading-relaxed ${muted}`}>
                    In case of disputes, both parties agree to communicate and resolve issues amicably. If unresolved, ETN's dispute resolution team will mediate.
                  </p>
                </div>

                <div>
                  <h3 className={`text-sm font-semibold mb-2 ${text}`}>7. Cancellation Policy</h3>
                  <p className={`text-sm leading-relaxed ${muted}`}>
                    Either party may cancel the agreement with written notice. If cancelled before work begins, no payment is due. If cancelled after work has started, payment is due for work completed.
                  </p>
                </div>

                <div>
                  <h3 className={`text-sm font-semibold mb-2 ${text}`}>8. Intellectual Property</h3>
                  <p className={`text-sm leading-relaxed ${muted}`}>
                    Upon full payment, all work product and intellectual property rights transfer to the employer. The talent retains the right to use the work in their portfolio.
                  </p>
                </div>
              </div>
            </div>

            <div className={`rounded-xl border p-5 ${card}`}>
              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={agreementAccepted}
                  onChange={(e) => setAgreementAccepted(e.target.checked)}
                  className="w-5 h-5 rounded border-2 mt-0.5 cursor-pointer accent-[#0084ca]"
                />
                <div>
                  <p className={`text-sm font-medium ${text}`}>
                    I agree to the work agreement terms
                  </p>
                  <p className={`text-xs mt-1 ${muted}`}>
                    By checking this box, you confirm that you have read and agree to all terms outlined above.
                  </p>
                </div>
              </label>
            </div>

            <div className="flex gap-3 pt-2">
              <button
                onClick={() => navigate(-1)}
                className={`flex-1 py-3 rounded-xl border text-sm font-semibold transition-colors ${dm ? "border-gray-700 text-gray-300 hover:bg-gray-800" : "border-slate-300 text-gray-600 hover:bg-slate-50"}`}
              >
                Back
              </button>
              <button
                onClick={handleProceedToPayment}
                disabled={!agreementAccepted || submitting}
                className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl bg-[#0084ca] hover:bg-[#006ba6] text-white font-semibold text-sm transition-colors disabled:opacity-50 shadow-sm shadow-[#0084ca]/20"
              >
                {submitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" /> Processing...
                  </>
                ) : (
                  <>
                    <CheckCircle className="w-4 h-4" /> Proceed to Payment
                  </>
                )}
              </button>
            </div>
          </div>

          <div className="space-y-4">
            <div className={`rounded-xl border p-4 ${dm ? "bg-blue-900/20 border-blue-800" : "bg-blue-50 border-blue-200"}`}>
              <div className="flex items-center gap-2 mb-2">
                <Shield className="w-4 h-4 text-blue-600" />
                <p className="text-sm font-semibold text-blue-700">Protected Agreement</p>
              </div>
              <p className="text-xs text-blue-600 leading-relaxed">
                This agreement is binding and protects both you and the talent. All disputes are handled by ETN's support team.
              </p>
            </div>

            <div className={`rounded-xl border p-4 ${card}`}>
              <h3 className={`text-sm font-semibold mb-3 ${text}`}>Next Steps</h3>
              <div className="space-y-2">
                {[
                  { n: 1, text: "Accept agreement" },
                  { n: 2, text: "Fund escrow payment" },
                  { n: 3, text: "Talent starts work" },
                  { n: 4, text: "Review & approve" },
                  { n: 5, text: "Release payment" },
                ].map((step) => (
                  <div key={step.n} className="flex items-center gap-2">
                    <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${
                      step.n === 1 && agreementAccepted ? "bg-emerald-500 text-white" :
                      step.n === 1 ? "bg-[#0084ca] text-white" :
                      dm ? "bg-gray-700 text-gray-400" : "bg-slate-200 text-gray-500"
                    }`}>
                      {step.n}
                    </div>
                    <p className={`text-xs ${step.n === 1 && agreementAccepted ? "font-semibold text-emerald-600" : muted}`}>
                      {step.text}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
