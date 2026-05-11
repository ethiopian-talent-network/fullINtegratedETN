import { useState } from "react";
import { Link } from "react-router";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Separator } from "../components/ui/separator";
import { useDarkMode } from "../contexts/DarkModeContext";
import axios from "axios";
import { API_BASE_URL } from "../config/api";

export default function Signup() {
  const { darkMode, toggleDarkMode } = useDarkMode();
  const [firstName, setFirstName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [userType, setUserType] = useState<"employer" | "talent">("talent");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (password !== confirmPassword) {
      alert("password didnt match");
      return;
    }
    try {
      const response = await axios.post(`${API_BASE_URL}/api/auth/signup`, {
        name: firstName,
        email: email,
        password: password,
        passwordConfirm: confirmPassword,
        selectedRole: userType,
      });

      alert(response.data.message);

      // Redirect to OTP verification page with email parameter
      window.location.href = `/verify-otp?email=${encodeURIComponent(email)}`;

      console.log("Signup:", response.data);
    } catch (error) {
      console.log(error);
      alert(error.response?.data?.message || "signup failed");
    }
  };

  return (
    <div
      className={`min-h-screen flex transition-colors duration-300 ${
        darkMode ? "bg-gray-900" : "bg-white"
      }`}
    >
      {/* Left side - Form */}
      <div
        className={`flex-1 flex items-center justify-center px-4 sm:px-6 lg:px-8 py-12 transition-colors duration-300 ${
          darkMode ? "bg-gray-900" : "bg-white"
        }`}
      >
        <div className="w-full max-w-md">
          {/* Logo */}
          <div className="mb-8 animate-fade-in-down">
            <h1 className="text-[#0084ca] font-bold text-3xl animate-pulse-slow">
              ETN
            </h1>
            <p
              className={`text-sm mt-1 transition-colors duration-300 animate-fade-in-up ${
                darkMode ? "text-gray-400" : "text-gray-600"
              }`}
            >
              Ethiopian Talent Network
            </p>
          </div>

          {/* Title */}
          <div className="mb-6 animate-fade-in-up animation-delay-200">
            <h2
              className={`text-2xl font-medium mb-2 transition-colors duration-300 ${
                darkMode ? "text-white" : "text-gray-900"
              }`}
            >
              Sign up to find work you love
            </h2>
            <p
              className={`text-sm transition-colors duration-300 ${
                darkMode ? "text-gray-400" : "text-gray-600"
              }`}
            >
              Join thousands of Ethiopian professionals
            </p>
          </div>

          {/* Dark Mode Toggle */}
          <div className="flex justify-center mb-6 animate-fade-in-up animation-delay-400">
            <button
              onClick={toggleDarkMode}
              className={`p-3 rounded-lg transition-all duration-300 hover:scale-110 hover:rotate-12 animate-bounce-slow ${
                darkMode
                  ? "bg-gray-800 text-yellow-400 hover:bg-gray-700"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
            >
              {darkMode ? (
                <svg
                  className="w-6 h-6"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z"
                  />
                </svg>
              ) : (
                <svg
                  className="w-6 h-6"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"
                  />
                </svg>
              )}
            </button>
          </div>

          {/* User Type Selection */}
          <div className="mb-6 animate-fade-in-up animation-delay-600">
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setUserType("talent")}
                className={`p-4 border-2 rounded-lg text-left transition-all hover:scale-105 hover:shadow-lg transform hover:-translate-y-1 ${
                  userType === "talent"
                    ? "border-[#0084ca] bg-[#0084ca] text-white"
                    : `border-gray-300 hover:border-gray-400 ${
                        darkMode ? "text-gray-300 bg-gray-800" : "text-gray-700"
                      }`
                }`}
              >
                <div className="font-medium text-gray-900">I'm a talents</div>
                <div className="text-sm text-gray-600 mt-1">
                  Looking for work
                </div>
              </button>
              <button
                type="button"
                onClick={() => setUserType("employer")}
                className={`p-4 border-2 rounded-lg text-left transition-all hover:scale-105 hover:shadow-lg transform hover:-translate-y-1 animate-fade-in-up animation-delay-800 ${
                  userType === "employer"
                    ? "border-[#0084ca] bg-[#0084ca] text-white"
                    : `border-gray-300 hover:border-gray-400 ${
                        darkMode ? "text-gray-300 bg-gray-800" : "text-gray-700"
                      }`
                }`}
              >
                <div className="font-medium text-gray-900">I'm a employer</div>
                <div className="text-sm text-gray-600 mt-1">
                  Hiring for a project
                </div>
              </button>
            </div>
          </div>

          {/* Social Sign Up Buttons */}
          <div className="space-y-3 mb-6">
            <Button
              variant="outline"
              className={`w-full h-12 transition-colors duration-200 ${
                darkMode
                  ? "border-gray-600 hover:bg-gray-800 text-gray-300 hover:text-white"
                  : "border-gray-300 hover:bg-gray-50 text-gray-700"
              }`}
            >
              <svg className="w-5 h-5 mr-3" viewBox="0 0 24 24" fill="#4285F4">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                />
              </svg>
              Continue with Google
            </Button>

            <Button
              variant="outline"
              className={`w-full h-12 transition-colors duration-200 ${
                darkMode
                  ? "border-gray-600 hover:bg-gray-800 text-gray-300 hover:text-white"
                  : "border-gray-300 hover:bg-gray-50 text-gray-700"
              }`}
            >
              <svg className="w-5 h-5 mr-3" viewBox="0 0 24 24" fill="#000">
                <path d="M12.152 6.896c-.948 0-2.415-1.078-3.96-1.04-2.04.027-3.91 1.183-4.961 3.014-2.117 3.675-.546 9.103 1.519 12.09 1.013 1.454 2.208 3.09 3.792 3.039 1.52-.065 2.09-.987 3.935-.987 1.831 0 2.35.987 3.96.948 1.637-.026 2.676-1.48 3.676-2.948 1.156-1.688 1.636-3.325 1.662-3.415-.039-.013-3.182-1.221-3.22-4.857-.026-3.04 2.48-4.494 2.597-4.559-1.429-2.09-3.623-2.324-4.39-2.376-2-.156-3.675 1.09-4.61 1.09zM15.53 3.83c.843-1.012 1.4-2.427 1.245-3.83-1.207.052-2.662.805-3.532 1.818-.78.896-1.454 2.338-1.273 3.714 1.338.104 2.715-.688 3.559-1.701" />
              </svg>
              Continue with Apple
            </Button>
          </div>

          {/* Divider */}
          <div className="relative mb-6 animate-fade-in-up animation-delay-900">
            <Separator />
            <div className="absolute inset-0 flex items-center justify-center">
              <span
                className={`px-4 text-sm transition-colors duration-300 ${
                  darkMode
                    ? "bg-gray-900 text-gray-400"
                    : "bg-white text-gray-500"
                }`}
              >
                or
              </span>
            </div>
          </div>

          {/* Sign Up Form */}
          <form
            onSubmit={handleSubmit}
            className="space-y-4 animate-fade-in-up animation-delay-1000"
          >
            <div className="animate-slide-in-left animation-delay-1100">
              <Label
                htmlFor="name"
                className={`text-sm font-medium transition-colors duration-300 ${
                  darkMode ? "text-gray-300" : "text-gray-700"
                }`}
              >
                Full Name
              </Label>
              <Input
                id="name"
                type="text"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                className={`mt-1 h-12 transition-all duration-300 hover:scale-102 focus:scale-105 focus:shadow-lg ${
                  darkMode
                    ? "bg-gray-800 border-gray-600 text-white placeholder-gray-400"
                    : "border-gray-300"
                }`}
                placeholder="Enter your full name"
                required
              />
            </div>

            <div className="animate-slide-in-right animation-delay-1200">
              <Label
                htmlFor="email"
                className={`text-sm font-medium transition-colors duration-300 ${
                  darkMode ? "text-gray-300" : "text-gray-700"
                }`}
              >
                Email
              </Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className={`mt-1.5 h-12 transition-all duration-300 hover:scale-102 focus:scale-105 focus:shadow-lg ${
                  darkMode
                    ? "bg-gray-800 border-gray-600 text-white placeholder-gray-400"
                    : "border-gray-300"
                }`}
                placeholder="Email"
                required
              />
            </div>

            <div className="animate-slide-in-left animation-delay-1300">
              <Label
                htmlFor="password"
                className={`text-sm font-medium transition-colors duration-300 ${
                  darkMode ? "text-gray-300" : "text-gray-700"
                }`}
              >
                Password (8 or more characters)
              </Label>
              <Input
                id="password"
                autoComplete="current-password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className={`mt-1.5 h-12 transition-all duration-300 hover:scale-102 focus:scale-105 focus:shadow-lg ${
                  darkMode
                    ? "bg-gray-800 border-gray-600 text-white placeholder-gray-400"
                    : "border-gray-300"
                }`}
                placeholder="Password"
                minLength={8}
                required
              />
            </div>

            <div className="animate-slide-in-right animation-delay-1400">
              <Label
                htmlFor="passwordConfirm"
                className={`text-sm font-medium transition-colors duration-300 ${
                  darkMode ? "text-gray-300" : "text-gray-700"
                }`}
              >
                confirm your Password
              </Label>
              <Input
                id="passwordConfirm"
                type="password"
                autoComplete="current-password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className={`mt-1.5 h-12 transition-all duration-300 hover:scale-102 focus:scale-105 focus:shadow-lg ${
                  darkMode
                    ? "bg-gray-800 border-gray-600 text-white placeholder-gray-400"
                    : "border-gray-300"
                }`}
                placeholder="Confirm your password"
                minLength={8}
                required
              />
            </div>

            <div className="flex items-start pt-2">
              <input
                id="updates"
                type="checkbox"
                className="h-4 w-4 text-[#0084ca] focus:ring-[#0084ca] border-gray-300 rounded mt-0.5"
              />
              <label htmlFor="updates" className="ml-2 text-sm text-gray-600">
                Send me helpful emails to find rewarding work and job leads
              </label>
            </div>

            <div
              className={`flex items-center animate-fade-in-up animation-delay-1450 ${
                darkMode ? "text-gray-300" : "text-gray-600"
              }`}
            >
              <input
                id="terms"
                type="checkbox"
                className={`h-4 w-4 text-[#0084ca] focus:ring-[#0084ca] rounded transition-all duration-300 hover:scale-110 ${
                  darkMode ? "border-gray-600 bg-gray-800" : "border-gray-300"
                }`}
                required
              />
              <label htmlFor="terms" className="ml-2 text-sm">
                I agree to the ETN{" "}
                <button
                  type="button"
                  className={`text-[#0084ca] hover:underline transition-all duration-300 hover:scale-105 ${
                    darkMode ? "hover:text-[#0099e6]" : ""
                  }`}
                >
                  Terms of Service
                </button>{" "}
                and{" "}
                <button
                  type="button"
                  className={`text-[#0084ca] hover:underline transition-all duration-300 hover:scale-105 ${
                    darkMode ? "hover:text-[#0099e6]" : ""
                  }`}
                >
                  Privacy Policy
                </button>
                .
              </label>
            </div>

            <Button
              type="submit"
              className="w-full h-12 bg-[#0084ca] hover:bg-[#006ba6] text-white font-medium rounded-full transition-all duration-300 hover:scale-105 hover:shadow-lg transform hover:-translate-y-1 animate-pulse-slow animate-fade-in-up animation-delay-1500"
            >
              Create Account
            </Button>
          </form>

          {/* Sign in link */}
          <div className="mt-6 text-center animate-fade-in-up animation-delay-1600">
            <p
              className={`text-sm transition-colors duration-300 ${
                darkMode ? "text-gray-400" : "text-gray-600"
              }`}
            >
              Already have an ETN account?{" "}
              <Link
                to="/login"
                className={`text-[#0084ca] hover:underline font-medium transition-all duration-300 hover:scale-105 ${
                  darkMode ? "hover:text-[#0099e6]" : ""
                }`}
              >
                Sign In
              </Link>
            </p>
          </div>
        </div>
      </div>

      {/* Right side - Image/Illustration */}
      <div className="hidden lg:flex flex-1 relative overflow-hidden">
        {/* Background Image with Overlay */}
        <div className="absolute inset-0">
          <div className="absolute inset-0 bg-gradient-to-br from-[#0084ca]/90 to-[#006ba6]/90 z-10"></div>
          <img
            src="https://images.unsplash.com/photo-1556761175-5973dc0f32e7?w=1920&h=1080&fit=crop&crop=entropy&auto=format"
            alt="Professional talent and collaboration workspace"
            className="w-full h-full object-cover"
          />
        </div>
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 left-0 w-full h-full">
            <svg
              className="w-full h-full"
              viewBox="0 0 400 400"
              xmlns="http://www.w3.org/2000/svg"
            >
              <defs>
                <pattern
                  id="grid2"
                  width="40"
                  height="40"
                  patternUnits="userSpaceOnUse"
                >
                  <path
                    d="M 40 0 L 0 0 0 40"
                    fill="none"
                    stroke="white"
                    strokeWidth="1"
                  />
                </pattern>
              </defs>
              <rect width="100%" height="100%" fill="url(#grid2)" />
            </svg>
          </div>
        </div>

        {/* Floating Elements */}
        <div className="absolute top-10 right-10 w-32 h-32 bg-white/10 rounded-full blur-2xl animate-pulse-slow"></div>
        <div className="absolute bottom-20 left-10 w-48 h-48 bg-white/10 rounded-full blur-3xl animate-bounce-slow"></div>
        <div className="absolute top-1/3 right-1/4 w-24 h-24 bg-white/5 rounded-full blur-xl"></div>

        {/* Ethiopian Cultural Elements */}
        <div className="absolute top-20 left-20 opacity-20">
          <svg
            className="w-16 h-16 text-white"
            fill="currentColor"
            viewBox="0 0 24 24"
          >
            <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
          </svg>
        </div>
        <div className="absolute bottom-20 right-20 opacity-20">
          <svg
            className="w-20 h-20 text-white"
            fill="currentColor"
            viewBox="0 0 24 24"
          >
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
          </svg>
        </div>

        {/* Main Content */}
        <div className="relative z-10 flex items-center justify-center p-12 h-full">
          <div className="text-white max-w-lg animate-fade-in-up">
            <div className="mb-8">
              <div className="w-24 h-24 bg-white/20 rounded-2xl flex items-center justify-center mb-6 backdrop-blur-sm border border-white/30">
                <svg
                  className="w-12 h-12 text-white"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                  />
                </svg>
              </div>
            </div>

            <h2 className="text-5xl font-bold mb-6 bg-clip-text text-transparent bg-gradient-to-r from-white to-blue-100">
              Join ETN Today
            </h2>
            <p className="text-xl text-white/90 mb-12 leading-relaxed">
              Start your journey with Ethiopia's leading talent platform.
              Showcase your skills and connect with amazing opportunities.
            </p>

            <div className="space-y-6">
              <div className="flex items-start group hover:scale-105 transition-transform duration-300">
                <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center mr-4 backdrop-blur-sm border border-white/30 group-hover:bg-white/30 transition-colors duration-300">
                  <svg
                    className="w-6 h-6 text-white"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M13 10V3L4 14h7v7l9-11h-7z"
                    />
                  </svg>
                </div>
                <div>
                  <h3 className="text-lg font-semibold mb-1">
                    AI-Powered Matching
                  </h3>
                  <p className="text-white/80">
                    Get matched with perfect opportunities instantly
                  </p>
                </div>
              </div>

              <div className="flex items-start group hover:scale-105 transition-transform duration-300">
                <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center mr-4 backdrop-blur-sm border border-white/30 group-hover:bg-white/30 transition-colors duration-300">
                  <svg
                    className="w-6 h-6 text-white"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                </div>
                <div>
                  <h3 className="text-lg font-semibold mb-1">
                    Secure Payments
                  </h3>
                  <p className="text-white/80">
                    Local Ethiopian payment methods you trust
                  </p>
                </div>
              </div>

              <div className="flex items-start group hover:scale-105 transition-transform duration-300">
                <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center mr-4 backdrop-blur-sm border border-white/30 group-hover:bg-white/30 transition-colors duration-300">
                  <svg
                    className="w-6 h-6 text-white"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
                    />
                  </svg>
                </div>
                <div>
                  <h3 className="text-lg font-semibold mb-1">
                    Verified Platform
                  </h3>
                  <p className="text-white/80">
                    Trusted by thousands of Ethiopian professionals
                  </p>
                </div>
              </div>
            </div>

            {/* Stats Section */}
            <div className="mt-12 pt-8 border-t border-white/20">
              <div className="grid grid-cols-3 gap-6">
                <div className="text-center">
                  <div className="text-3xl font-bold text-white">5K+</div>
                  <div className="text-sm text-white/70">Active Projects</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-white">98%</div>
                  <div className="text-sm text-white/70">Satisfaction</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-white">24/7</div>
                  <div className="text-sm text-white/70">Support</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
