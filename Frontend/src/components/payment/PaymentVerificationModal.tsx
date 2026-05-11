import React, { useState } from "react";
import { X, AlertCircle, CheckCircle, Loader } from "lucide-react";
import { submitPaymentForVerification } from "../../api/payment/paymentApi";

interface PaymentVerificationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  jobId: number;
  talentId: number;
  applicationId: number;
  talentName: string;
  jobTitle: string;
  darkMode?: boolean;
}

export const PaymentVerificationModal: React.FC<
  PaymentVerificationModalProps
> = ({
  isOpen,
  onClose,
  onSuccess,
  jobId,
  talentId,
  applicationId,
  talentName,
  jobTitle,
  darkMode = false,
}) => {
  const [amount, setAmount] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!amount || parseFloat(amount) <= 0) {
      setError("Please enter a valid amount");
      return;
    }

    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      if (!token) throw new Error("No authentication token found");

      await submitPaymentForVerification(token, {
        job_id: jobId,
        talent_id: talentId,
        application_id: applicationId,
        amount: parseFloat(amount),
        currency: "ETB",
        payment_method: "chapa",
      });

      setSuccess(true);
      setTimeout(() => {
        onSuccess();
        onClose();
        setAmount("");
        setSuccess(false);
        // Redirect to payment pending page after successful submission
        window.location.href = `/employer/payment-pending/${jobId}`;
      }, 2000);
    } catch (err: any) {
      setError(err.message || "Failed to submit payment");
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div
        className={`${
          darkMode ? "bg-gray-800" : "bg-white"
        } rounded-lg shadow-xl max-w-md w-full mx-4`}
      >
        {/* Header */}
        <div
          className={`flex justify-between items-center p-6 border-b ${
            darkMode ? "border-gray-700" : "border-gray-200"
          }`}
        >
          <h2
            className={`text-xl font-semibold ${
              darkMode ? "text-white" : "text-gray-900"
            }`}
          >
            Hire & Pay via Escrow
          </h2>
          <button
            onClick={onClose}
            className={`p-1 rounded-lg ${
              darkMode
                ? "hover:bg-gray-700 text-gray-400"
                : "hover:bg-gray-100 text-gray-500"
            }`}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6">
          {success ? (
            <div className="text-center py-8">
              <CheckCircle className="w-12 h-12 text-green-600 mx-auto mb-4" />
              <h3
                className={`text-lg font-semibold mb-2 ${
                  darkMode ? "text-white" : "text-gray-900"
                }`}
              >
                Payment Submitted!
              </h3>
              <p
                className={`text-sm ${
                  darkMode ? "text-gray-400" : "text-gray-600"
                }`}
              >
                Your payment has been submitted for verification. The admin will
                review it shortly.
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Talent Info */}
              <div
                className={`p-4 rounded-lg ${
                  darkMode ? "bg-gray-700" : "bg-gray-50"
                }`}
              >
                <p
                  className={`text-sm ${
                    darkMode ? "text-gray-400" : "text-gray-600"
                  }`}
                >
                  You are about to submit payment for:
                </p>
                <p
                  className={`font-semibold mt-1 ${
                    darkMode ? "text-white" : "text-gray-900"
                  }`}
                >
                  {talentName}
                </p>
                <p
                  className={`text-sm mt-1 ${
                    darkMode ? "text-gray-400" : "text-gray-600"
                  }`}
                >
                  Job: {jobTitle}
                </p>
              </div>

              {/* Amount Input */}
              <div>
                <label
                  htmlFor="amount"
                  className={`block text-sm font-medium mb-2 ${
                    darkMode ? "text-gray-300" : "text-gray-700"
                  }`}
                >
                  Payment Amount (ETB)
                </label>
                <input
                  id="amount"
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="Enter amount"
                  disabled={loading}
                  min="0"
                  step="0.01"
                  className={`w-full px-4 py-2 rounded-lg border ${
                    darkMode
                      ? "bg-gray-700 border-gray-600 text-white placeholder-gray-400"
                      : "bg-white border-gray-300 text-gray-900 placeholder-gray-500"
                  } focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50`}
                />
              </div>

              {/* Info Box */}
              <div
                className={`p-4 rounded-lg border ${
                  darkMode
                    ? "bg-blue-900 border-blue-700"
                    : "bg-blue-50 border-blue-200"
                }`}
              >
                <h4
                  className={`font-semibold mb-2 flex items-center ${
                    darkMode ? "text-blue-300" : "text-blue-900"
                  }`}
                >
                  <AlertCircle className="w-4 h-4 mr-2" />
                  How it works:
                </h4>
                <ol
                  className={`list-decimal list-inside text-sm space-y-1 ${
                    darkMode ? "text-blue-200" : "text-blue-800"
                  }`}
                >
                  <li>Payment is submitted for verification</li>
                  <li>Admin reviews and verifies the payment</li>
                  <li>Once verified, talent is marked as hired</li>
                  <li>Payment is held in escrow until work completion</li>
                </ol>
              </div>

              {/* Warning Box */}
              <div
                className={`p-4 rounded-lg border ${
                  darkMode
                    ? "bg-yellow-900 border-yellow-700"
                    : "bg-yellow-50 border-yellow-200"
                }`}
              >
                <p
                  className={`text-sm ${
                    darkMode ? "text-yellow-200" : "text-yellow-800"
                  }`}
                >
                  <strong>Note:</strong> The payment will be held in escrow and
                  only released after work completion and your approval.
                </p>
              </div>

              {/* Error Message */}
              {error && (
                <div className="p-4 rounded-lg bg-red-50 border border-red-200">
                  <p className="text-sm text-red-800 flex items-center">
                    <AlertCircle className="w-4 h-4 mr-2" />
                    {error}
                  </p>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex gap-3 pt-4 border-t border-gray-200">
                <button
                  type="button"
                  onClick={onClose}
                  disabled={loading}
                  className={`flex-1 px-4 py-2 rounded-lg font-medium transition-colors ${
                    darkMode
                      ? "bg-gray-700 text-white hover:bg-gray-600 disabled:opacity-50"
                      : "bg-gray-200 text-gray-900 hover:bg-gray-300 disabled:opacity-50"
                  }`}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading || !amount}
                  className={`flex-1 px-4 py-2 rounded-lg font-medium transition-colors flex items-center justify-center ${
                    loading || !amount ? "opacity-50 cursor-not-allowed" : ""
                  } bg-blue-600 text-white hover:bg-blue-700`}
                >
                  {loading ? (
                    <>
                      <Loader className="w-4 h-4 mr-2 animate-spin" />
                      Submitting...
                    </>
                  ) : (
                    "Submit Payment"
                  )}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default PaymentVerificationModal;
