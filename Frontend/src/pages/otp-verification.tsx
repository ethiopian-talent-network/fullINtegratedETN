import { useState } from "react";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { useSearchParams } from "react-router";
import axios from "axios";
import { API_BASE_URL } from "../config/api";

export default function OtpVerification() {
  const [searchParams] = useSearchParams();
  const email = searchParams.get("email") || "";
  const [otp, setOtp] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");
    setMessage("");

    try {
      const response = await axios.post(`${API_BASE_URL}/api/auth/verify-otp`, {
        email: email,
        otp: otp,
      });

      setMessage(response.data.message);
      setTimeout(() => {
        window.location.href = "/login";
      }, 1000);
    } catch (error: any) {
      setError(error.response?.data?.message || "OTP verification failed");
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendOtp = async () => {
    setIsResending(true);
    setError("");
    setMessage("");

    try {
      const response = await axios.post(`${API_BASE_URL}/api/auth/resend-otp`, {
        email,
      });

      setMessage(response.data.message || "OTP has been resent to your email");
    } catch (error: any) {
      setError(error.response?.data?.message || "Failed to resend OTP");
    } finally {
      setIsResending(false);
    }
  };

  const handleOtpChange = (value: string) => {
    // Only allow numbers and limit to 6 digits
    const numericValue = value.replace(/\D/g, "").slice(0, 6);
    setOtp(numericValue);
  };

  return (
    <div className="min-h-screen bg-white flex">
      {/* Left side - Form */}
      <div className="flex-1 flex items-center justify-center px-4 sm:px-6 lg:px-8">
        <div className="w-full max-w-md">
          {/* Logo */}
          <div className="mb-8">
            <h1 className="text-[#0084ca] font-bold text-3xl">ETN</h1>
            <p className="text-sm text-gray-600 mt-1">
              Ethiopian Talent Network
            </p>
          </div>

          {/* Title */}
          <div className="mb-6">
            <h2 className="text-2xl font-medium text-gray-900 mb-2">
              Verify your email
            </h2>
            <p className="text-sm text-gray-600">
              We've sent a 6-digit code to {email}
            </p>
          </div>

          {/* Error/Success Messages */}
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
              {error}
            </div>
          )}
          {message && (
            <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg text-green-700 text-sm">
              {message}
            </div>
          )}

          {/* OTP Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label
                htmlFor="otp"
                className="text-sm font-medium text-gray-700"
              >
                Enter 6-digit code
              </Label>
              <Input
                id="otp"
                type="text"
                value={otp}
                onChange={(e) => handleOtpChange(e.target.value)}
                className="mt-1.5 h-12 border-gray-300 text-center text-lg font-mono"
                placeholder="000000"
                maxLength={6}
                required
              />
            </div>

            <Button
              type="submit"
              disabled={isLoading || otp.length !== 6}
              className="w-full h-12 bg-[#0084ca] hover:bg-[#006ba6] text-white font-medium rounded-full disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? "Verifying..." : "Verify Email"}
            </Button>

            <div className="text-center">
              <button
                type="button"
                onClick={handleResendOtp}
                disabled={isResending}
                className="text-sm text-[#0084ca] hover:underline disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isResending
                  ? "Resending..."
                  : "Didn't receive the code? Resend"}
              </button>
            </div>

            <div className="text-center">
              <a
                href="/login"
                className="text-sm text-gray-600 hover:text-gray-800"
              >
                ← Back to login
              </a>
            </div>
          </form>
        </div>
      </div>

      {/* Right side - Image/Illustration */}
      <div className="hidden lg:flex flex-1 bg-gradient-to-br from-[#0084ca] to-[#006ba6] items-center justify-center p-12">
        <div className="text-white max-w-lg">
          <h2 className="text-4xl font-bold mb-6">Verify your email address</h2>
          <p className="text-xl text-white/90 mb-8">
            We need to make sure you're the owner of this email address to keep
            your account secure.
          </p>
          <div className="space-y-4">
            <div className="flex items-start">
              <svg
                className="w-6 h-6 mr-3 mt-1 flex-shrink-0"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              <p className="text-lg">Keep your account secure</p>
            </div>
            <div className="flex items-start">
              <svg
                className="w-6 h-6 mr-3 mt-1 flex-shrink-0"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                />
              </svg>
              <p className="text-lg">Receive important notifications</p>
            </div>
            <div className="flex items-start">
              <svg
                className="w-6 h-6 mr-3 mt-1 flex-shrink-0"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                />
              </svg>
              <p className="text-lg">Protect your personal information</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
