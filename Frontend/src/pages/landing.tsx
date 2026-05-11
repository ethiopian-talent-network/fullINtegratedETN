import { useState } from "react";
import { Link, useNavigate } from "react-router";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { useDarkMode } from "../contexts/DarkModeContext";
import { useAuth } from "../contexts/AuthContext";
import {
  Search,
  Code,
  Palette,
  TrendingUp,
  Users,
  Scale,
  GraduationCap,
  Wrench,
  DollarSign,
  ChevronRight,
  Menu,
  X,
  Shield,
  Zap,
  Globe,
  Award,
  CheckCircle,
  Star,
  Sparkles,
  CreditCard,
  Brain,
  Moon,
  Sun,
} from "lucide-react";

export default function Landing() {
  const { darkMode, toggleDarkMode } = useDarkMode();
  const { isAuthenticated, user, logout } = useAuth();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const [userMode, setUserMode] = useState<"hire" | "work">("hire");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const categories = [
    {
      icon: Code,
      title: "Development & IT",
      jobs: "2,453",
      color: "text-[#0084ca]",
    },
    {
      icon: Palette,
      title: "Design & Creative",
      jobs: "1,876",
      color: "text-[#0084ca]",
    },
    {
      icon: TrendingUp,
      title: "Sales & Marketing",
      jobs: "1,234",
      color: "text-[#0084ca]",
    },
    {
      icon: Users,
      title: "Admin & Support",
      jobs: "987",
      color: "text-[#0084ca]",
    },
    {
      icon: DollarSign,
      title: "Finance & Accounting",
      jobs: "765",
      color: "text-[#0084ca]",
    },
    { icon: Scale, title: "Legal", jobs: "543", color: "text-[#0084ca]" },
    {
      icon: GraduationCap,
      title: "HR & Training",
      jobs: "432",
      color: "text-[#0084ca]",
    },
    {
      icon: Wrench,
      title: "Engineering & Architecture",
      jobs: "654",
      color: "text-[#0084ca]",
    },
  ];

  const features = [
    {
      icon: Brain,
      title: "AI-Powered Matching",
      description:
        "Our intelligent system matches you with the perfect talent based on skills and requirements",
      category: "Technology",
    },
    {
      icon: CreditCard,
      title: "Local Payments",
      description:
        "Pay securely with Chapa, Telebirr, CBE Birr, and other Ethiopian payment methods",
      category: "Payment",
    },
    {
      icon: Shield,
      title: "Verified Profiles",
      description:
        "All freelancers verified with Ethiopian ID and professional credentials",
      category: "Security",
    },
    {
      icon: Zap,
      title: "Quick Hiring",
      description: "Post jobs and receive qualified proposals within 24 hours",
      category: "Hiring",
    },
  ];

  const stats = [
    { value: "15,000+", label: "Ethiopian Freelancers" },
    { value: "8,500+", label: "Jobs Completed" },
    { value: "98%", label: "Client Satisfaction" },
    { value: "4.9/5", label: "Average Rating" },
  ];

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    console.log("Search:", searchQuery);
  };

  return (
    <div
      className={`min-h-screen transition-colors duration-300 ${darkMode ? "dark bg-gray-900" : "bg-white"}`}
    >
      {/* Navigation */}
      <nav
        className={`border-b sticky top-0 z-50 transition-colors duration-300 ${darkMode ? "border-gray-700 bg-gray-800" : "border-gray-200 bg-white"}`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Link to="/" className="flex items-center gap-2">
              <div className="w-10 h-10 bg-gradient-to-br from-[#0084ca] to-[#006ba6] rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-xl">E</span>
              </div>
              <span
                className={`text-2xl font-bold ${darkMode ? "text-white" : "text-gray-900"}`}
              >
                ETN<span className="text-[#0084ca]">.</span>
              </span>
            </Link>

            <div className="hidden md:flex items-center space-x-8">
              <Link
                to="/freelancer-dashboard"
                className={`text-sm font-medium transition-colors ${darkMode ? "text-gray-300 hover:text-white" : "text-gray-700 hover:text-gray-900"}`}
              >
                Find Talent
              </Link>
              <Link
                to="/freelancer-dashboard"
                className={`text-sm font-medium transition-colors ${darkMode ? "text-gray-300 hover:text-white" : "text-gray-700 hover:text-gray-900"}`}
              >
                Find Work
              </Link>
              <button
                className={`text-sm font-medium transition-colors ${darkMode ? "text-gray-300 hover:text-white" : "text-gray-700 hover:text-gray-900"}`}
              >
                Why ETN
              </button>
              <Link
                to="/login"
                className={`text-sm font-medium transition-colors ${darkMode ? "text-gray-300 hover:text-white" : "text-gray-700 hover:text-gray-900"}`}
              >
                Log in
              </Link>

              {/* Dark Mode Toggle */}
              <button
                onClick={toggleDarkMode}
                className={`p-2 rounded-lg transition-all duration-300 hover:scale-110 ${
                  darkMode
                    ? "bg-gray-700 text-yellow-400 hover:bg-gray-600"
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                }`}
              >
                {darkMode ? (
                  <Sun className="w-5 h-5" />
                ) : (
                  <Moon className="w-5 h-5" />
                )}
              </button>

              {isAuthenticated && user ? (
                <>
                  <Link
                    to={
                      user.role === "employer"
                        ? "/employer-dashboard"
                        : "/talent-dashboard"
                    }
                    className={`text-sm font-medium transition-colors ${darkMode ? "text-gray-300 hover:text-white" : "text-gray-700 hover:text-gray-900"}`}
                  >
                    Dashboard
                  </Link>
                  <button
                    onClick={() => {
                      logout();
                      navigate("/login");
                    }}
                    className={`text-sm font-medium transition-colors ${darkMode ? "text-gray-300 hover:text-white" : "text-gray-700 hover:text-gray-900"}`}
                  >
                    Log out
                  </button>
                </>
              ) : (
                <>
                  <Link
                    to="/login"
                    className={`text-sm font-medium transition-colors ${darkMode ? "text-gray-300 hover:text-white" : "text-gray-700 hover:text-gray-900"}`}
                  >
                    Log in
                  </Link>
                  <Link to="/signup">
                    <Button className="bg-[#0084ca] hover:bg-[#006ba6] text-white rounded-full px-6">
                      Sign up free
                    </Button>
                  </Link>
                </>
              )}
            </div>

            <button
              className="md:hidden"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? <X /> : <Menu />}
            </button>
          </div>
        </div>

        {mobileMenuOpen && (
          <div
            className={`md:hidden border-t transition-colors duration-300 ${darkMode ? "border-gray-700 bg-gray-800" : "border-gray-200 bg-white"}`}
          >
            <div className="px-4 py-4 space-y-3">
              <Link
                to="/freelancer-dashboard"
                className={`block py-2 font-medium transition-colors ${darkMode ? "text-gray-300 hover:text-white" : "text-gray-700 hover:text-gray-900"}`}
              >
                Find Talent
              </Link>
              <Link
                to="/freelancer-dashboard"
                className={`block py-2 font-medium transition-colors ${darkMode ? "text-gray-300 hover:text-white" : "text-gray-700 hover:text-gray-900"}`}
              >
                Find Work
              </Link>
              {!isAuthenticated && (
                <Link
                  to="/login"
                  className={`block py-2 font-medium transition-colors ${darkMode ? "text-gray-300 hover:text-white" : "text-gray-700 hover:text-gray-900"}`}
                >
                  Log in
                </Link>
              )}
              <div className="flex items-center justify-between py-2">
                <span
                  className={`text-sm font-medium ${darkMode ? "text-gray-300" : "text-gray-700"}`}
                >
                  Dark Mode
                </span>
                <button
                  onClick={toggleDarkMode}
                  className={`p-2 rounded-lg transition-all duration-300 hover:scale-110 ${
                    darkMode
                      ? "bg-gray-700 text-yellow-400 hover:bg-gray-600"
                      : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                  }`}
                >
                  {darkMode ? (
                    <Sun className="w-4 h-4" />
                  ) : (
                    <Moon className="w-4 h-4" />
                  )}
                </button>
              </div>
              {isAuthenticated && user ? (
                <>
                  <Link
                    to={
                      user.role === "employer"
                        ? "/employer-dashboard"
                        : "/talent-dashboard"
                    }
                    className="block"
                  >
                    <Button className="w-full bg-[#0084ca] hover:bg-[#006ba6] text-white rounded-full">
                      Go to Dashboard
                    </Button>
                  </Link>
                  <button
                    onClick={() => {
                      logout();
                      navigate("/login");
                    }}
                    className={`block w-full text-left py-2 font-medium transition-colors ${darkMode ? "text-gray-300 hover:text-white" : "text-gray-700 hover:text-gray-900"}`}
                  >
                    Log out
                  </button>
                </>
              ) : (
                <Link to="/signup" className="block">
                  <Button className="w-full bg-[#0084ca] hover:bg-[#006ba6] text-white rounded-full">
                    Sign up free
                  </Button>
                </Link>
              )}
            </div>
          </div>
        )}
      </nav>

      {/* Banner */}
      <div className="bg-gradient-to-r from-[#0084ca] to-[#006ba6]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
          <div className="flex items-center justify-center md:justify-between">
            <p className="text-sm text-white font-medium flex items-center gap-2">
              <span className="hidden sm:inline">🇪🇹</span>
              Ethiopia's Premier AI-Powered Freelance Platform
              <span className="hidden md:inline">
                • Local Payments • Verified Talent
              </span>
            </p>
            <Link
              to="/signup"
              className="hidden md:flex text-sm text-white hover:underline items-center font-medium"
            >
              Join Now <ChevronRight className="w-4 h-4 ml-1" />
            </Link>
          </div>
        </div>
      </div>

      {/* Hero Section */}
      <section
        className={`relative overflow-hidden py-20 transition-colors duration-300 ${
          darkMode
            ? "bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900"
            : "bg-gradient-to-br from-blue-50 via-white to-blue-50"
        }`}
      >
        <div className="absolute inset-0 overflow-hidden">
          <div
            className={`absolute -top-40 -right-40 w-80 h-80 rounded-full blur-3xl transition-opacity duration-300 ${
              darkMode ? "bg-blue-500 opacity-5" : "bg-[#0084ca] opacity-10"
            }`}
          ></div>
          <div
            className={`absolute -bottom-40 -left-40 w-80 h-80 rounded-full blur-3xl transition-opacity duration-300 ${
              darkMode ? "bg-blue-600 opacity-5" : "bg-[#006ba6] opacity-10"
            }`}
          ></div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <div
                className={`inline-flex items-center gap-2 px-4 py-2 rounded-full mb-6 shadow-sm border transition-colors duration-300 ${
                  darkMode
                    ? "bg-gray-800 border-gray-700"
                    : "bg-white border-gray-200"
                }`}
              >
                <Sparkles className="w-4 h-4 text-[#0084ca]" />
                <span
                  className={`text-sm font-medium transition-colors duration-300 ${
                    darkMode ? "text-gray-300" : "text-gray-700"
                  }`}
                >
                  AI-Powered Talent Matching
                </span>
              </div>

              <h1
                className={`text-5xl lg:text-6xl font-bold mb-6 leading-tight transition-colors duration-300 ${
                  darkMode ? "text-white" : "text-gray-900"
                }`}
              >
                Ethiopia's Top Talent,{" "}
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#0084ca] to-[#006ba6]">
                  One Platform
                </span>
              </h1>

              <p
                className={`text-xl mb-8 leading-relaxed transition-colors duration-300 ${
                  darkMode ? "text-gray-300" : "text-gray-600"
                }`}
              >
                Connect with verified Ethiopian freelancers through AI-powered
                matching. Pay with local methods and build your dream team
                today.
              </p>

              <div
                className={`inline-flex rounded-full p-1 shadow-md border mb-8 transition-colors duration-300 ${
                  darkMode
                    ? "bg-gray-800 border-gray-700"
                    : "bg-white border-gray-200"
                }`}
              >
                <button
                  onClick={() => setUserMode("hire")}
                  className={`px-8 py-3 rounded-full text-sm font-medium transition-all ${
                    userMode === "hire"
                      ? "bg-gradient-to-r from-[#0084ca] to-[#006ba6] text-white shadow-lg"
                      : darkMode
                        ? "text-gray-300 hover:text-white"
                        : "text-gray-700 hover:text-gray-900"
                  }`}
                >
                  I want to hire
                </button>
                <button
                  onClick={() => setUserMode("work")}
                  className={`px-8 py-3 rounded-full text-sm font-medium transition-all ${
                    userMode === "work"
                      ? "bg-gradient-to-r from-[#0084ca] to-[#006ba6] text-white shadow-lg"
                      : darkMode
                        ? "text-gray-300 hover:text-white"
                        : "text-gray-700 hover:text-gray-900"
                  }`}
                >
                  I want to work
                </button>
              </div>

              <form onSubmit={handleSearch} className="mb-6">
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <Input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder={
                        userMode === "hire"
                          ? "Search for skills, e.g., React Developer..."
                          : "Search for jobs, e.g., Web Design..."
                      }
                      className={`pl-12 h-14 text-base border-2 rounded-xl shadow-sm focus:border-[#0084ca] transition-colors duration-300 ${
                        darkMode
                          ? "bg-gray-800 border-gray-700 text-white placeholder-gray-400"
                          : "bg-white border-gray-200"
                      }`}
                    />
                  </div>
                  <Button
                    type="submit"
                    className="h-14 px-8 bg-gradient-to-r from-[#0084ca] to-[#006ba6] hover:from-[#006ba6] hover:to-[#0084ca] text-white rounded-xl shadow-lg"
                  >
                    Search
                  </Button>
                </div>
              </form>

              <div className="flex flex-wrap gap-2">
                <span
                  className={`text-sm transition-colors duration-300 ${
                    darkMode ? "text-gray-400" : "text-gray-600"
                  }`}
                >
                  Popular:
                </span>
                {[
                  "AI Development",
                  "Web Design",
                  "Mobile Apps",
                  "Content Writing",
                ].map((tag) => (
                  <button
                    key={tag}
                    className={`px-4 py-2 text-sm rounded-full transition-colors shadow-sm ${
                      darkMode
                        ? "bg-gray-800 border-gray-700 text-gray-300 hover:border-[#0084ca] hover:text-[#0084ca]"
                        : "bg-white border-gray-200 hover:border-[#0084ca] hover:text-[#0084ca]"
                    }`}
                  >
                    {tag}
                  </button>
                ))}
              </div>
            </div>

            <div className="relative hidden lg:block">
              <div className="absolute -top-4 -left-4 w-full h-full bg-gradient-to-br from-[#0084ca] to-[#006ba6] rounded-3xl opacity-20"></div>
              <div className="relative aspect-square rounded-3xl overflow-hidden shadow-2xl">
                <img
                  src="https://images.unsplash.com/photo-1522071820081-009f0129c71c?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=1080"
                  alt="Ethiopian professionals collaborating"
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    e.currentTarget.src =
                      "https://images.unsplash.com/photo-1521737604893-d14cc237f11d?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=1080";
                  }}
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section
        className={`py-12 border-y transition-colors duration-300 ${
          darkMode ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200"
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((stat, index) => (
              <div key={index} className="text-center">
                <div className="text-4xl font-bold text-[#0084ca] mb-2">
                  {stat.value}
                </div>
                <div
                  className={`text-sm transition-colors duration-300 ${
                    darkMode ? "text-gray-400" : "text-gray-600"
                  }`}
                >
                  {stat.label}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section
        className={`py-20 transition-colors duration-300 ${
          darkMode ? "bg-gray-800" : "bg-gray-50"
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2
              className={`text-3xl font-bold mb-4 transition-colors duration-300 ${
                darkMode ? "text-white" : "text-gray-900"
              }`}
            >
              Why Choose ETN?
            </h2>
            <p
              className={`text-xl max-w-3xl mx-auto transition-colors duration-300 ${
                darkMode ? "text-gray-300" : "text-gray-600"
              }`}
            >
              Ethiopia's premier talent platform connecting businesses with top
              professionals
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <div
                key={index}
                className={`rounded-2xl p-8 shadow-sm hover:shadow-xl transition-shadow border transition-colors duration-300 ${
                  darkMode
                    ? "bg-gray-900 border-gray-700"
                    : "bg-white border-gray-100"
                }`}
              >
                <div className="flex items-center justify-between mb-4">
                  <feature.icon className="w-8 h-8 text-[#0084ca]" />
                  <span
                    className={`text-xs font-medium transition-colors duration-300 ${
                      darkMode ? "text-gray-400" : "text-gray-500"
                    }`}
                  >
                    {feature.category}
                  </span>
                </div>
                <h3
                  className={`font-semibold text-lg mb-2 transition-colors duration-300 ${
                    darkMode ? "text-white" : "text-gray-900"
                  }`}
                >
                  {feature.title}
                </h3>
                <p
                  className={`transition-colors duration-300 ${
                    darkMode ? "text-gray-300" : "text-gray-600"
                  }`}
                >
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Categories Section */}
      <section
        className={`py-20 transition-colors duration-300 ${
          darkMode ? "bg-gray-800" : "bg-white"
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2
            className={`text-4xl font-bold mb-12 transition-colors duration-300 ${
              darkMode ? "text-white" : "text-gray-900"
            }`}
          >
            Explore by Category
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {categories.map((category, index) => {
              const Icon = category.icon;
              return (
                <button
                  key={index}
                  className={`p-6 border-2 rounded-2xl hover:shadow-lg hover:border-[#0084ca] transition-all text-left group ${
                    darkMode
                      ? "bg-gray-900 border-gray-700"
                      : "bg-white border-gray-200"
                  }`}
                >
                  <div className="flex items-center justify-between mb-4">
                    <Icon
                      className={`w-8 h-8 ${category.color} group-hover:scale-110 transition-transform`}
                    />
                    <span
                      className={`text-xs font-medium transition-colors duration-300 ${
                        darkMode ? "text-gray-400" : "text-gray-500"
                      }`}
                    >
                      {category.jobs} jobs
                    </span>
                  </div>
                  <h3
                    className={`font-semibold group-hover:text-[#0084ca] transition-colors duration-300 ${
                      darkMode ? "text-gray-100" : "text-gray-900"
                    }`}
                  >
                    {category.title}
                  </h3>
                </button>
              );
            })}
          </div>
        </div>
      </section>

      {/* How it Works Section */}
      <section
        className={`py-20 transition-colors duration-300 ${
          darkMode
            ? "bg-gradient-to-br from-gray-800 to-gray-900"
            : "bg-gradient-to-br from-blue-50 to-white"
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2
              className={`text-4xl font-bold mb-4 transition-colors duration-300 ${
                darkMode ? "text-white" : "text-gray-900"
              }`}
            >
              How ETN Works
            </h2>
            <p
              className={`text-xl transition-colors duration-300 ${
                darkMode ? "text-gray-300" : "text-gray-600"
              }`}
            >
              Get started in three simple steps
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                step: "1",
                title: "Post Your Job or Create Profile",
                desc: "Describe what you need or showcase your skills. AI helps optimize your listing.",
                bg: "from-yellow-100 to-orange-100",
              },
              {
                step: "2",
                title: "AI Matches & Connect",
                desc: "Our AI matches jobs with talent. Review proposals or get discovered by clients.",
                bg: "from-green-100 to-emerald-100",
              },
              {
                step: "3",
                title: "Work & Get Paid Securely",
                desc: "Collaborate seamlessly and pay/get paid through local Ethiopian payment methods.",
                bg: "from-blue-100 to-cyan-100",
              },
            ].map((item, index) => (
              <div
                key={index}
                className={`rounded-2xl overflow-hidden shadow-lg transition-colors duration-300 ${
                  darkMode ? "bg-gray-800" : "bg-white"
                }`}
              >
                <div
                  className={`bg-gradient-to-br ${item.bg} h-48 flex items-center justify-center`}
                >
                  <div className="text-center">
                    <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center mx-auto mb-3 shadow-lg">
                      <span className="text-4xl font-bold text-[#0084ca]">
                        {item.step}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="p-6">
                  <h3
                    className={`text-xl font-semibold mb-2 transition-colors duration-300 ${
                      darkMode ? "text-white" : "text-gray-900"
                    }`}
                  >
                    {item.title}
                  </h3>
                  <p
                    className={`transition-colors duration-300 ${
                      darkMode ? "text-gray-300" : "text-gray-600"
                    }`}
                  >
                    {item.desc}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-r from-[#0084ca] to-[#006ba6] relative overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 left-1/4 w-96 h-96 bg-white rounded-full blur-3xl"></div>
          <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-white rounded-full blur-3xl"></div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative">
          <h2 className="text-4xl font-bold text-white mb-4">
            Ready to Transform Your Business?
          </h2>
          <p className="text-xl text-blue-100 mb-8 max-w-2xl mx-auto">
            Join thousands of Ethiopian businesses and freelancers already
            working on ETN
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/signup">
              <Button className="bg-white text-[#0084ca] hover:bg-gray-100 px-8 h-14 rounded-xl font-semibold text-lg shadow-xl">
                Get Started Free
              </Button>
            </Link>
            <Button
              variant="outline"
              className="border-2 border-white text-white hover:bg-white hover:text-[#0084ca] px-8 h-14 rounded-xl font-semibold text-lg"
            >
              Learn More
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-300 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-8">
            <div>
              <h3 className="text-white font-semibold mb-4">For Clients</h3>
              <ul className="space-y-2 text-sm">
                <li>
                  <Link
                    to="/post-job"
                    className="hover:text-white transition-colors duration-200"
                  >
                    Post a Job
                  </Link>
                </li>
                <li>
                  <button className="hover:text-white transition-colors duration-200">
                    Browse Talent
                  </button>
                </li>
                <li>
                  <button className="hover:text-white transition-colors duration-200">
                    Enterprise
                  </button>
                </li>
              </ul>
            </div>

            <div>
              <h3 className="text-white font-semibold mb-4">For Freelancers</h3>
              <ul className="space-y-2 text-sm">
                <li>
                  <Link
                    to="/freelancer-dashboard"
                    className="hover:text-white transition-colors duration-200"
                  >
                    Find Work
                  </Link>
                </li>
                <li>
                  <Link
                    to="/freelancer-profile"
                    className="hover:text-white transition-colors duration-200"
                  >
                    Create Profile
                  </Link>
                </li>
                <li>
                  <button className="hover:text-white transition-colors duration-200">
                    Success Stories
                  </button>
                </li>
              </ul>
            </div>

            <div>
              <h3 className="text-white font-semibold mb-4">Resources</h3>
              <ul className="space-y-2 text-sm">
                <li>
                  <button className="hover:text-white transition-colors duration-200">
                    Help & Support
                  </button>
                </li>
                <li>
                  <button className="hover:text-white transition-colors duration-200">
                    Blog
                  </button>
                </li>
                <li>
                  <button className="hover:text-white transition-colors duration-200">
                    Community
                  </button>
                </li>
              </ul>
            </div>

            <div>
              <h3 className="text-white font-semibold mb-4">Company</h3>
              <ul className="space-y-2 text-sm">
                <li>
                  <button className="hover:text-white transition-colors duration-200">
                    About ETN
                  </button>
                </li>
                <li>
                  <button className="hover:text-white transition-colors duration-200">
                    Careers
                  </button>
                </li>
                <li>
                  <button className="hover:text-white transition-colors duration-200">
                    Contact
                  </button>
                </li>
              </ul>
            </div>
          </div>

          <div className="border-t border-gray-800 pt-8">
            <div className="flex flex-col md:flex-row justify-between items-center">
              <div className="flex items-center gap-2 mb-4 md:mb-0">
                <div className="w-8 h-8 bg-gradient-to-br from-[#0084ca] to-[#006ba6] rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold">E</span>
                </div>
                <span className="text-white font-bold text-xl">ETN</span>
              </div>
              <p className="text-sm text-gray-500 mb-4 md:mb-0">
                © 2026 ETN - Ethiopian Talent Network. All rights reserved.
              </p>
              <div className="flex gap-6 text-sm">
                <button className="hover:text-white transition-colors duration-200">
                  Terms
                </button>
                <button className="hover:text-white transition-colors duration-200">
                  Privacy
                </button>
                <button className="hover:text-white transition-colors duration-200">
                  Cookies
                </button>
              </div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
