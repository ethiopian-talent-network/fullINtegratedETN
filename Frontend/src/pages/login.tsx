import { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Separator } from "../components/ui/separator";
import { useDarkMode } from "../contexts/DarkModeContext";
import { useAuth } from "../contexts/AuthContext";
import axios from "axios";
import { API_BASE_URL } from "../config/api";

export default function Login() {
  const { darkMode, toggleDarkMode } = useDarkMode();
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from = (location.state as any)?.from;
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const response = await axios.post(`${API_BASE_URL}/api/auth/login`, {
        email: email,
        password: password,
      });

      const token = response.data.token;
      const role = response.data.role;
      const user = {
        id: response.data.user_id,
        email: email,
        name: response.data.name || email.split("@")[0],
        role: role,
      };

      // Navigate BEFORE setting auth state so PublicOnlyRoute
      // doesn't redirect while we're still on /login
      const destination = from
        ? from
        : role === "employer"
          ? "/employer-dashboard"
          : role === "owner"
          ? "/owner"
          : "/talent-dashboard";

      navigate(destination, { replace: true });
      await login(token, user);
    } catch (error: any) {
      if (axios.isAxiosError(error)) {
        if (error.code === "ERR_NETWORK") {
          alert("Network error. Please check your connection.");
        } else {
          alert(
            error.response?.data?.message || "Login failed. Please try again.",
          );
        }
      } else {
        alert("An unexpected error occurred. Please try again.");
      }
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
        className={`flex-1 flex items-center justify-center px-4 sm:px-6 lg:px-8 transition-colors duration-300 ${
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
          <div className="mb-8 animate-fade-in-up animation-delay-200">
            <h2
              className={`text-3xl font-bold transition-colors duration-300 ${
                darkMode ? "text-white" : "text-gray-900"
              }`}
            >
              Welcome back
            </h2>
            <p
              className={`mt-2 text-sm transition-colors duration-300 animate-fade-in-up ${
                darkMode ? "text-gray-400" : "text-gray-600"
              }`}
            >
              Sign in to your ETN account
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

          {/* Social Login Buttons */}
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
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
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
              <svg className="w-5 h-5 mr-3" viewBox="0 0 24 24" fill="#0A66C2">
                <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
              </svg>
              Continue with LinkedIn
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
          <div className="relative mb-6">
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

          {/* Login Form */}
          <form
            onSubmit={handleSubmit}
            className="space-y-5 animate-fade-in-up animation-delay-800"
          >
            <div className="">
              <Label
                htmlFor="email"
                className={`text-sm font-medium  ${
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
                className={`mt-1.5 h-12  ${
                  darkMode
                    ? "bg-gray-800 border-gray-600 text-white placeholder-gray-400"
                    : "border-gray-300"
                }`}
                placeholder="Email"
                required
              />
            </div>

            <div className="">
              <Label
                htmlFor="password"
                className={`text-sm font-medium${
                  darkMode ? "text-gray-300" : "text-gray-700"
                }`}
              >
                Password
              </Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className={`mt-1.5 h-12 ${
                  darkMode
                    ? "bg-gray-800 border-gray-600 text-white placeholder-gray-400"
                    : "border-gray-300"
                }`}
                placeholder="Password"
                required
              />
            </div>

            <div className="flex items-center justify-between animate-fade-in-up animation-delay-1100">
              <div className="flex items-center">
                <input
                  id="remember"
                  type="checkbox"
                  className={`h-4 w-4 text-[#0084ca] focus:ring-[#0084ca] rounded transition-all duration-300 hover:scale-110 ${
                    darkMode ? "border-gray-600 bg-gray-800" : "border-gray-300"
                  }`}
                />
                <label
                  htmlFor="remember"
                  className={`ml-2 text-sm transition-colors duration-300 ${
                    darkMode ? "text-gray-300" : "text-gray-700"
                  }`}
                >
                  Keep me logged in
                </label>
              </div>
              <button
                type="button"
                className={`text-sm transition-all duration-300 hover:underline hover:scale-105 ${
                  darkMode
                    ? "text-[#0084ca] hover:text-[#0099e6]"
                    : "text-[#0084ca]"
                }`}
              >
                Forgot password?
              </button>
            </div>

            <Button
              type="submit"
              className="w-full h-12 bg-[#0084ca] hover:bg-[#006ba6] text-white font-medium rounded-full transition-all duration-300 hover:scale-105 hover:shadow-lg transform hover:-translate-y-1 animate-pulse-slow"
            >
              Log in
            </Button>
          </form>

          {/* Sign up link */}
          <div className="mt-8 text-center animate-fade-in-up animation-delay-1200">
            <p
              className={`text-sm transition-colors duration-300 ${
                darkMode ? "text-gray-400" : "text-gray-600"
              }`}
            >
              Don't have an ETN account?{" "}
              <Link
                to="/signup"
                className={`font-medium transition-all duration-300 hover:underline hover:scale-105 ${
                  darkMode
                    ? "text-[#0084ca] hover:text-[#0099e6]"
                    : "text-[#0084ca]"
                }`}
              >
                Sign Up
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
            src="https://images.unsplash.com/photo-1611224923853-80b023f02d71?w=1920&h=1080&fit=crop&crop=entropy&auto=format"
            alt="Professional workspace with Ethiopian context"
            className="w-full h-full object-cover"
          />
        </div>
        {/* Animated Background Pattern */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 left-0 w-full h-full animate-pulse-slow">
            <svg
              className="w-full h-full"
              viewBox="0 0 400 400"
              xmlns="http://www.w3.org/2000/svg"
            >
              <defs>
                <pattern
                  id="grid"
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
              <rect width="100%" height="100%" fill="url(#grid)" />
            </svg>
          </div>
        </div>

        {/* Enhanced Floating Elements with Better Animations */}
        <div className="absolute top-10 right-10 w-32 h-32 bg-white/10 rounded-full blur-2xl animate-float"></div>
        <div className="absolute bottom-20 left-10 w-48 h-48 bg-white/10 rounded-full blur-3xl animate-float-delayed"></div>
        <div className="absolute top-1/3 right-1/4 w-24 h-24 bg-white/5 rounded-full blur-xl animate-pulse-slow"></div>
        <div className="absolute top-2/3 left-1/3 w-20 h-20 bg-white/5 rounded-full blur-lg animate-float-reverse"></div>

        {/* Animated Ethiopian Cultural Elements */}
        <div className="absolute top-20 left-20 opacity-20 animate-spin-slow">
          <svg
            className="w-16 h-16 text-white"
            fill="currentColor"
            viewBox="0 0 24 24"
          >
            <path d="M12 2L2 7v10c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V7l-10-5z" />
          </svg>
        </div>
        <div className="absolute bottom-20 right-20 opacity-20 animate-bounce-slow">
          <svg
            className="w-20 h-20 text-white"
            fill="currentColor"
            viewBox="0 0 24 24"
          >
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
          </svg>
        </div>

        {/* Animated Particles */}
        <div className="absolute top-1/4 left-1/4 w-2 h-2 bg-white/30 rounded-full animate-particle-1"></div>
        <div className="absolute top-3/4 right-1/3 w-2 h-2 bg-white/30 rounded-full animate-particle-2"></div>
        <div className="absolute bottom-1/3 left-1/2 w-2 h-2 bg-white/30 rounded-full animate-particle-3"></div>

        {/* Main Content with Enhanced Animations */}
        <div className="relative z-10 flex items-center justify-center p-12 h-full">
          <div className="text-white max-w-lg animate-slide-in-right">
            <div className="mb-8 animate-fade-in-up animation-delay-200">
              <div className="w-24 h-24 bg-white/20 rounded-2xl flex items-center justify-center mb-6 backdrop-blur-sm border border-white/30 animate-pulse-slow hover:scale-110 transition-transform duration-300">
                <svg
                  className="w-12 h-12 text-white animate-spin-slow"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                  />
                </svg>
              </div>
            </div>

            <h2 className="text-5xl font-bold mb-6 bg-clip-text text-transparent bg-gradient-to-r from-white to-blue-100 animate-fade-in-up animation-delay-400">
              Welcome to ETN
            </h2>
            <p className="text-xl text-white/90 mb-12 leading-relaxed animate-fade-in-up animation-delay-600">
              Connect with Ethiopia's finest talent and transform your business
              with AI-powered matching and secure local payments.
            </p>

            <div className="space-y-6">
              <div className="flex items-start group hover:scale-105 transition-all duration-300 animate-fade-in-up animation-delay-800">
                <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center mr-4 backdrop-blur-sm border border-white/30 group-hover:bg-white/30 transition-all duration-300 group-hover:rotate-12">
                  <svg
                    className="w-6 h-6 text-white group-hover:scale-110 transition-transform duration-300"
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
                </div>
                <div>
                  <h3 className="text-lg font-semibold mb-1">
                    Verified Professionals
                  </h3>
                  <p className="text-white/80">
                    Every talent is thoroughly vetted and verified
                  </p>
                </div>
              </div>

              <div className="flex items-start group hover:scale-105 transition-all duration-300 animate-fade-in-up animation-delay-1000">
                <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center mr-4 backdrop-blur-sm border border-white/30 group-hover:bg-white/30 transition-all duration-300 group-hover:rotate-12">
                  <svg
                    className="w-6 h-6 text-white group-hover:scale-110 transition-transform duration-300"
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
                    Local Payment Methods
                  </h3>
                  <p className="text-white/80">
                    Support for Ethiopian banks and mobile money
                  </p>
                </div>
              </div>

              <div className="flex items-start group hover:scale-105 transition-all duration-300 animate-fade-in-up animation-delay-1200">
                <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center mr-4 backdrop-blur-sm border border-white/30 group-hover:bg-white/30 transition-all duration-300 group-hover:rotate-12">
                  <svg
                    className="w-6 h-6 text-white group-hover:scale-110 transition-transform duration-300"
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
                    Smart algorithms connect you with the perfect talent
                  </p>
                </div>
              </div>
            </div>

            {/* Enhanced Stats Section */}
            <div className="mt-12 pt-8 border-t border-white/20 animate-fade-in-up animation-delay-1400">
              <div className="grid grid-cols-3 gap-6">
                <div className="text-center group hover:scale-110 transition-transform duration-300">
                  <div className="text-3xl font-bold text-white animate-count-up">
                    10K+
                  </div>
                  <div className="text-sm text-white/70">Active Talents</div>
                </div>
                <div className="text-center group hover:scale-110 transition-transform duration-300">
                  <div className="text-3xl font-bold text-white animate-count-up">
                    95%
                  </div>
                  <div className="text-sm text-white/70">Success Rate</div>
                </div>
                <div className="text-center group hover:scale-110 transition-transform duration-300">
                  <div className="text-3xl font-bold text-white animate-count-up">
                    24/7
                  </div>
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
