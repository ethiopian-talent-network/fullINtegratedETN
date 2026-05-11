import { useState, useEffect } from "react";
import { useParams, useSearchParams, useNavigate, useLocation } from "react-router";
import { useDarkMode } from "../../contexts/DarkModeContext";
import { useAuth } from "../../contexts/AuthContext";
import { Header } from "../../features/employer/components/Header";
import {
  initializePayment,
  verifyPayment,
  getEscrowStatus,
  releasePayment,
  getPaymentReceipt,
  type EscrowInfo,
  type PaymentReceipt,
} from "../../api/payment/paymentApi";
import { updateApplicationStatus } from "../../api/employer/employerApi";
import {
  ShieldCheck, DollarSign, CheckCircle, Clock, AlertCircle,
  Loader2, ArrowLeft, Lock, Unlock, User, UserCheck,
  CreditCard, ChevronRight, Info, FileText, Download, Printer,
} from "lucide-react";

const CURRENCIES = ["ETB", "USD"];
const METHODS = [
  { value: "chapa", label: "Chapa", desc: "Pay via Chapa gateway", implemented: true },
  { value: "telebirr", label: "Telebirr", desc: "Mobile money", implemented: false },
  { value: "cbe_birr", label: "CBE Birr", desc: "Commercial Bank", implemented: false },
];

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string; border: string; icon: React.ElementType }> = {
  pending:  { label: "Awaiting Payment",  color: "text-amber-700",   bg: "bg-amber-50",   border: "border-amber-200",   icon: Clock },
  funded:   { label: "Funds in Escrow",   color: "text-blue-700",    bg: "bg-blue-50",    border: "border-blue-200",    icon: Lock },
  released: { label: "Payment Released",  color: "text-emerald-700", bg: "bg-emerald-50", border: "border-emerald-200", icon: Unlock },
  failed:   { label: "Payment Failed",    color: "text-red-700",     bg: "bg-red-50",     border: "border-red-200",     icon: AlertCircle },
};

const STEPS = [
  { n: 1, title: "Fund Escrow",    desc: "Deposit the agreed amount securely" },
  { n: 2, title: "Talent Works",   desc: "Talent delivers the project" },
  { n: 3, title: "You Approve",    desc: "Review & release payment" },
];

export default function EscrowPaymentPage() {
  const { job_id } = useParams<{ job_id: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { darkMode } = useDarkMode();
  const { token } = useAuth();
  const dm = darkMode;
  const jobId = Number(job_id);
  const applicationId: number | undefined = (location.state as any)?.application_id;

  const [escrow, setEscrow] = useState<EscrowInfo | null>(null);
  const [receipt, setReceipt] = useState<PaymentReceipt | null>(null);
  const [loadingEscrow, setLoadingEscrow] = useState(true);
  const [amount, setAmount] = useState("");
  const [currency, setCurrency] = useState("ETB");
  const [method, setMethod] = useState("chapa");
  const [submitting, setSubmitting] = useState(false);
  const [releasing, setReleasing] = useState(false);
  const [hiring, setHiring] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    const tx_ref = searchParams.get("tx_ref");
    if (tx_ref) {
      verifyPayment(tx_ref)
        .then(() => { 
          setSuccess("Payment verified! Funds are now held in escrow."); 
          loadEscrow();
          loadReceipt(tx_ref);
        })
        .catch((e) => setError(e.message));
    } else {
      loadEscrow();
    }
  }, []);

  const loadReceipt = async (tx_ref: string) => {
    if (!token) return;
    try {
      const res = await getPaymentReceipt(token, tx_ref);
      setReceipt(res.receipt);
    } catch (e: any) {
      console.error("Failed to load receipt:", e.message);
    }
  };

  const loadEscrow = async () => {
    if (!token) return;
    setLoadingEscrow(true);
    try {
      const res = await getEscrowStatus(token, jobId);
      setEscrow(res.escrow);
      // Load receipt if escrow is funded or released
      if (res.escrow && (res.escrow.status === "funded" || res.escrow.status === "released")) {
        loadReceipt(res.escrow.treansaction_ref);
      }
    } catch {
      setEscrow(null);
    } finally {
      setLoadingEscrow(false);
    }
  };

  const handleFundEscrow = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token || !amount) return;
    setError(null);
    setSubmitting(true);
    try {
      const res = await initializePayment(token, { job_id: jobId, amount: Number(amount), currency, method });
      window.location.href = res.check_url;
    } catch (e: any) {
      setError(e.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleConfirmHire = async () => {
    if (!token || !applicationId) {
      setError("Application ID missing. Please go back and click Hire again.");
      return;
    }
    setError(null);
    setHiring(true);
    try {
      await updateApplicationStatus(token, applicationId, "hired");
      setSuccess("Talent hired successfully! They have been notified.");
      loadEscrow();
    } catch (e: any) {
      setError(e.message);
    } finally {
      setHiring(false);
    }
  };

  const handleRelease = async () => {
    if (!token || !window.confirm("Release payment to the talent? This cannot be undone.")) return;
    setError(null);
    setReleasing(true);
    try {
      const res = await releasePayment(token, jobId);
      setSuccess(res.message);
      loadEscrow();
    } catch (e: any) {
      setError(e.message);
    } finally {
      setReleasing(false);
    }
  };

  const card = dm ? "bg-gray-800 border-gray-700" : "bg-white border-slate-200";
  const text = dm ? "text-white" : "text-gray-900";
  const muted = dm ? "text-gray-400" : "text-gray-500";
  const inputCls = dm
    ? "bg-gray-700 border-gray-600 text-white placeholder-gray-500 focus:border-[#0084ca]"
    : "bg-white border-slate-300 text-gray-900 placeholder-gray-400 focus:border-[#0084ca]";

  const currentStep = !escrow ? 1 : escrow.status === "funded" ? 2 : escrow.status === "released" ? 3 : 1;

  const StatusBadge = ({ status }: { status: string }) => {
    const cfg = STATUS_CONFIG[status] ?? STATUS_CONFIG.pending;
    const Icon = cfg.icon;
    return (
      <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-semibold border ${cfg.color} ${cfg.bg} ${cfg.border}`}>
        <Icon className="w-4 h-4" /> {cfg.label}
      </span>
    );
  };

  return (
    <div className={`min-h-screen ${dm ? "bg-gray-900" : "bg-slate-100"} transition-colors duration-300`}>
      <Header />

      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8">
        {/* Back */}
        <button
          onClick={() => navigate(-1)}
          className={`flex items-center gap-2 text-sm font-medium mb-6 transition-colors ${dm ? "text-gray-400 hover:text-white" : "text-gray-500 hover:text-gray-900"}`}
        >
          <ArrowLeft className="w-4 h-4" /> Back to Applications
        </button>

        {/* Page header */}
        <div className="flex items-center gap-4 mb-8">
          <div className="w-12 h-12 rounded-2xl bg-[#0084ca] flex items-center justify-center shadow-lg shadow-[#0084ca]/20">
            <ShieldCheck className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className={`text-2xl font-bold ${text}`}>Hire & Pay</h1>
            <p className={`text-sm ${muted}`}>Secure escrow payment — funds released only when you approve</p>
          </div>
        </div>

        {/* Alerts */}
        {error && (
          <div className="mb-5 flex items-start gap-3 p-4 rounded-xl bg-red-50 border border-red-200 text-red-700">
            <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
            <p className="text-sm font-medium">{error}</p>
          </div>
        )}
        {success && (
          <div className="mb-5 flex items-start gap-3 p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700">
            <CheckCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
            <p className="text-sm font-medium">{success}</p>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          {/* Left column — main content */}
          <div className="lg:col-span-2 space-y-5">

            {/* Progress steps */}
            <div className={`rounded-xl border p-5 ${card}`}>
              <h2 className={`text-sm font-semibold uppercase tracking-wider mb-5 ${muted}`}>Contract Progress</h2>
              <div className="flex items-start gap-0">
                {STEPS.map((step, idx) => {
                  const done = currentStep > step.n;
                  const active = currentStep === step.n;
                  return (
                    <div key={step.n} className="flex-1 flex flex-col items-center">
                      <div className="flex items-center w-full">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0 transition-all ${
                          done ? "bg-emerald-500 text-white" : active ? "bg-[#0084ca] text-white ring-4 ring-[#0084ca]/20" : dm ? "bg-gray-700 text-gray-400" : "bg-slate-200 text-gray-400"
                        }`}>
                          {done ? <CheckCircle className="w-4 h-4" /> : step.n}
                        </div>
                        {idx < STEPS.length - 1 && (
                          <div className={`flex-1 h-0.5 mx-1 ${done ? "bg-emerald-400" : dm ? "bg-gray-700" : "bg-slate-200"}`} />
                        )}
                      </div>
                      <div className="mt-2 text-center px-1">
                        <p className={`text-xs font-semibold ${active ? "text-[#0084ca]" : done ? "text-emerald-600" : muted}`}>{step.title}</p>
                        <p className={`text-[10px] mt-0.5 ${muted}`}>{step.desc}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Escrow status (if exists) */}
            {loadingEscrow ? (
              <div className={`rounded-xl border p-8 flex items-center justify-center ${card}`}>
                <Loader2 className="w-6 h-6 animate-spin text-[#0084ca]" />
              </div>
            ) : escrow ? (
              <div className={`rounded-xl border overflow-hidden ${card}`}>
                <div className={`px-5 py-4 border-b flex items-center justify-between ${dm ? "border-gray-700 bg-gray-800/50" : "border-slate-100 bg-slate-50"}`}>
                  <h2 className={`font-semibold ${text}`}>Escrow Details</h2>
                  <StatusBadge status={escrow.status} />
                </div>

                <div className="p-5 space-y-4">
                  {/* Talent info */}
                  <div className={`flex items-center gap-3 p-3 rounded-xl ${dm ? "bg-gray-700" : "bg-slate-50"}`}>
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#0084ca] to-violet-600 flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                      {escrow.talent_name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2)}
                    </div>
                    <div>
                      <p className={`text-sm font-semibold ${text}`}>{escrow.talent_name}</p>
                      <p className={`text-xs ${muted}`}>{escrow.talent_email}</p>
                    </div>
                    <div className="ml-auto text-right">
                      <p className={`text-lg font-bold ${text}`}>{escrow.amount.toLocaleString()}</p>
                      <p className={`text-xs ${muted}`}>{escrow.currency}</p>
                    </div>
                  </div>

                  {/* Tx ref */}
                  <div>
                    <p className={`text-xs font-medium mb-1 ${muted}`}>Transaction Reference</p>
                    <p className={`text-xs font-mono px-3 py-2 rounded-lg break-all ${dm ? "bg-gray-700 text-gray-300" : "bg-slate-100 text-gray-600"}`}>
                      {escrow.treansaction_ref}
                    </p>
                  </div>

                  {/* Receipt */}
                  {receipt && escrow.status === "funded" && (
                    <div className={`rounded-xl border overflow-hidden ${dm ? "bg-gray-700/50 border-gray-600" : "bg-slate-50 border-slate-200"}`}>
                      <div className={`px-4 py-3 border-b flex items-center justify-between ${dm ? "border-gray-600" : "border-slate-200"}`}>
                        <div className="flex items-center gap-2">
                          <FileText className="w-4 h-4 text-[#0084ca]" />
                          <p className={`text-sm font-semibold ${text}`}>Payment Receipt</p>
                        </div>
                        <button
                          onClick={() => window.print()}
                          className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors ${dm ? "bg-gray-600 text-gray-200 hover:bg-gray-500" : "bg-white text-gray-600 hover:bg-slate-100 border border-slate-200"}`}
                        >
                          <Printer className="w-3.5 h-3.5" /> Print
                        </button>
                      </div>
                      <div className="p-4 space-y-3">
                        <div className="grid grid-cols-2 gap-3 text-xs">
                          <div>
                            <p className={`font-medium ${muted}`}>Receipt Number</p>
                            <p className={`font-mono mt-0.5 ${text}`}>{receipt.receipt_number}</p>
                          </div>
                          <div>
                            <p className={`font-medium ${muted}`}>Payment Date</p>
                            <p className={`mt-0.5 ${text}`}>{new Date(receipt.payment_date).toLocaleDateString()}</p>
                          </div>
                          <div>
                            <p className={`font-medium ${muted}`}>Transaction ID</p>
                            <p className={`font-mono mt-0.5 text-[10px] break-all ${text}`}>{receipt.transaction_id}</p>
                          </div>
                          <div>
                            <p className={`font-medium ${muted}`}>Payment Method</p>
                            <p className={`mt-0.5 capitalize ${text}`}>{receipt.method}</p>
                          </div>
                          <div>
                            <p className={`font-medium ${muted}`}>Job Title</p>
                            <p className={`mt-0.5 ${text}`}>{receipt.job_title}</p>
                          </div>
                          <div>
                            <p className={`font-medium ${muted}`}>Amount Paid</p>
                            <p className={`mt-0.5 font-bold text-emerald-600`}>{receipt.amount.toLocaleString()} {receipt.currency}</p>
                          </div>
                        </div>
                        <div className={`pt-3 border-t text-center ${dm ? "border-gray-600" : "border-slate-200"}`}>
                          <p className={`text-xs ${muted}`}>Paid by {receipt.company_name}</p>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Actions */}
                  {escrow.status === "funded" && (
                    <div className="space-y-3 pt-2">
                      {applicationId && (
                        <button
                          onClick={handleConfirmHire}
                          disabled={hiring}
                          className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-[#0084ca] hover:bg-[#006ba6] text-white font-semibold transition-colors disabled:opacity-50 shadow-sm shadow-[#0084ca]/20"
                        >
                          {hiring ? <Loader2 className="w-4 h-4 animate-spin" /> : <UserCheck className="w-4 h-4" />}
                          {hiring ? "Confirming hire..." : "Confirm Hire"}
                        </button>
                      )}
                      <button
                        onClick={handleRelease}
                        disabled={releasing}
                        className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold transition-colors disabled:opacity-50"
                      >
                        {releasing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Unlock className="w-4 h-4" />}
                        {releasing ? "Releasing payment..." : "Approve Work & Release Payment"}
                      </button>
                      <p className={`text-xs text-center ${muted}`}>
                        Only release payment after you've reviewed and approved the delivered work.
                      </p>
                    </div>
                  )}

                  {escrow.status === "released" && (
                    <div className="flex items-center justify-center gap-2 py-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 font-semibold text-sm">
                      <CheckCircle className="w-4 h-4" /> Payment successfully released to talent
                    </div>
                  )}
                </div>
              </div>
            ) : null}

            {/* Fund escrow form */}
            {!loadingEscrow && (!escrow || escrow.status === "failed") && (
              <div className={`rounded-xl border overflow-hidden ${card}`}>
                <div className={`px-5 py-4 border-b ${dm ? "border-gray-700 bg-gray-800/50" : "border-slate-100 bg-slate-50"}`}>
                  <h2 className={`font-semibold ${text}`}>
                    {escrow?.status === "failed" ? "Retry Payment" : "Fund Escrow"}
                  </h2>
                  <p className={`text-xs mt-0.5 ${muted}`}>Enter the agreed contract amount to secure funds</p>
                </div>

                <form onSubmit={handleFundEscrow} className="p-5 space-y-5">
                  {/* Amount + Currency */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className={`block text-sm font-medium mb-1.5 ${dm ? "text-gray-300" : "text-gray-700"}`}>
                        Contract Amount *
                      </label>
                      <div className="relative">
                        <DollarSign className={`absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 ${muted}`} />
                        <input
                          type="number"
                          min="1"
                          value={amount}
                          onChange={(e) => setAmount(e.target.value)}
                          required
                          placeholder="0.00"
                          className={`w-full pl-9 pr-3 py-2.5 rounded-xl border text-sm outline-none focus:ring-2 focus:ring-[#0084ca]/20 transition-colors ${inputCls}`}
                        />
                      </div>
                    </div>
                    <div>
                      <label className={`block text-sm font-medium mb-1.5 ${dm ? "text-gray-300" : "text-gray-700"}`}>
                        Currency
                      </label>
                      <select
                        value={currency}
                        onChange={(e) => setCurrency(e.target.value)}
                        className={`w-full px-3 py-2.5 rounded-xl border text-sm outline-none focus:ring-2 focus:ring-[#0084ca]/20 transition-colors ${inputCls}`}
                      >
                        {CURRENCIES.map((c) => <option key={c} value={c}>{c}</option>)}
                      </select>
                    </div>
                  </div>

                  {/* Payment method */}
                  <div>
                    <label className={`block text-sm font-medium mb-2 ${dm ? "text-gray-300" : "text-gray-700"}`}>
                      Payment Method
                    </label>
                    <div className="grid grid-cols-3 gap-3">
                      {METHODS.map((m) => (
                        <button
                          key={m.value}
                          type="button"
                          onClick={() => m.implemented ? setMethod(m.value) : null}
                          disabled={!m.implemented}
                          className={`relative flex flex-col items-center gap-1 py-3 px-2 rounded-xl border text-sm font-medium transition-all ${
                            !m.implemented
                              ? "opacity-40 cursor-not-allowed " + (dm ? "border-gray-700 text-gray-500" : "border-slate-200 text-gray-400")
                              : method === m.value
                              ? "border-[#0084ca] bg-[#0084ca]/10 text-[#0084ca] shadow-sm"
                              : dm
                              ? "border-gray-600 text-gray-300 hover:border-gray-500 hover:bg-gray-700"
                              : "border-slate-300 text-gray-600 hover:border-slate-400 hover:bg-slate-50"
                          }`}
                        >
                          <CreditCard className="w-4 h-4" />
                          <span>{m.label}</span>
                          {!m.implemented && (
                            <span className="text-[9px] font-normal text-gray-400 leading-tight">Not available</span>
                          )}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Security note */}
                  <div className={`flex items-start gap-2.5 p-3.5 rounded-xl text-xs ${dm ? "bg-[#0084ca]/10 text-blue-300" : "bg-[#0084ca]/5 text-[#0084ca]"}`}>
                    <Info className="w-4 h-4 flex-shrink-0 mt-0.5" />
                    <span>
                      Funds are held securely in escrow and <strong>only released to the talent after you approve their work</strong>. You stay in full control.
                    </span>
                  </div>

                  {/* Submit */}
                  <button
                    type="submit"
                    disabled={submitting || !amount}
                    className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl bg-[#0084ca] hover:bg-[#006ba6] text-white font-semibold text-sm transition-colors disabled:opacity-50 shadow-sm shadow-[#0084ca]/20"
                  >
                    {submitting ? (
                      <><Loader2 className="w-4 h-4 animate-spin" /> Redirecting to Chapa...</>
                    ) : (
                      <><Lock className="w-4 h-4" /> Fund Escrow — {amount || "0"} {currency}</>
                    )}
                  </button>
                </form>
              </div>
            )}
          </div>

          {/* Right column — sidebar */}
          <div className="space-y-4">
            {/* How it works */}
            <div className={`rounded-xl border p-4 ${card}`}>
              <h3 className={`text-sm font-semibold mb-3 ${text}`}>How it works</h3>
              <div className="space-y-3">
                {[
                  { icon: Lock, title: "Secure Deposit", desc: "Your payment is locked in escrow — not charged to the talent yet." },
                  { icon: UserCheck, title: "Talent Delivers", desc: "The talent works knowing payment is secured." },
                  { icon: Unlock, title: "You Release", desc: "Approve the work to release funds to the talent." },
                ].map((item, i) => (
                  <div key={i} className="flex items-start gap-2.5">
                    <div className={`w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 ${dm ? "bg-gray-700" : "bg-slate-100"}`}>
                      <item.icon className="w-3.5 h-3.5 text-[#0084ca]" />
                    </div>
                    <div>
                      <p className={`text-xs font-semibold ${text}`}>{item.title}</p>
                      <p className={`text-xs mt-0.5 ${muted}`}>{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Protection badge */}
            <div className={`rounded-xl border p-4 ${dm ? "bg-emerald-900/20 border-emerald-800" : "bg-emerald-50 border-emerald-200"}`}>
              <div className="flex items-center gap-2 mb-2">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                <p className="text-sm font-semibold text-emerald-700">Payment Protection</p>
              </div>
              <p className="text-xs text-emerald-600 leading-relaxed">
                Your funds are protected. If the talent doesn't deliver, you can dispute and get a refund.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
