import { useState, useEffect } from "react";
import { Link } from "react-router";
import { useDarkMode } from "../contexts/DarkModeContext";
import {
  Clock,
  DollarSign,
  ArrowRight,
  Calendar,
  Briefcase,
  Search,
  User,
  FileText,
  ChevronDown,
  ChevronUp,
} from "lucide-react";

type ApplicationStatus = "pending" | "accepted" | "rejected" | "reviewed";

interface Applicant {
  id: number;
  name: string;
  email: string;
  avatar?: string;
  profile_completion: number;
}

interface JobApplication {
  id: number;
  job: {
    id: number;
    title: string;
    location: string;
    salary: string;
    budget_type: string;
  };
  applicant: Applicant;
  status: ApplicationStatus;
  submitted_at: string;
  cover_letter: string;
  proposal?: string;
  estimated_timeline?: string;
  budget_proposal?: string;
}

export default function JobApplications() {
  const { darkMode } = useDarkMode();
  const [applications, setApplications] = useState<JobApplication[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<ApplicationStatus | "all">("all");
  const [search, setSearch] = useState("");
  const [expandedApplication, setExpandedApplication] = useState<number | null>(
    null,
  );

  // Mock data - replace with actual API call
  useEffect(() => {
    const mockApplications: JobApplication[] = [
      {
        id: 1,
        job: {
          id: 1,
          title: "Senior React Developer",
          location: "Remote",
          salary: "$80,000 - $120,000",
          budget_type: "annual",
        },
        applicant: {
          id: 1,
          name: "John Doe",
          email: "john@example.com",
          avatar: "https://via.placeholder.com/150",
          profile_completion: 85,
        },
        status: "pending",
        submitted_at: "2024-04-15T10:30:00Z",
        cover_letter:
          "I am excited to apply for this position as I have 5 years of experience in React development...",
        proposal:
          "I propose to build the application using React, TypeScript, and Node.js with a focus on performance and scalability...",
        estimated_timeline: "3 months",
        budget_proposal: "$100,000",
      },
      {
        id: 2,
        job: {
          id: 1,
          title: "Senior React Developer",
          location: "Remote",
          salary: "$80,000 - $120,000",
          budget_type: "annual",
        },
        applicant: {
          id: 2,
          name: "Jane Smith",
          email: "jane@example.com",
          avatar: "https://via.placeholder.com/150",
          profile_completion: 92,
        },
        status: "reviewed",
        submitted_at: "2024-04-14T15:45:00Z",
        cover_letter:
          "With my extensive experience in building scalable React applications...",
        proposal:
          "My approach includes implementing a component library, optimizing bundle size, and setting up comprehensive testing...",
        estimated_timeline: "2.5 months",
        budget_proposal: "$95,000",
      },
      {
        id: 3,
        job: {
          id: 2,
          title: "Full Stack Developer",
          location: "New York, NY",
          salary: "$90,000 - $130,000",
          budget_type: "annual",
        },
        applicant: {
          id: 3,
          name: "Mike Johnson",
          email: "mike@example.com",
          avatar: "https://via.placeholder.com/150",
          profile_completion: 78,
        },
        status: "accepted",
        submitted_at: "2024-04-10T09:20:00Z",
        cover_letter:
          "I am a full-stack developer with expertise in MERN stack...",
        proposal:
          "I will build a robust backend using Node.js and Express, with a React frontend...",
        estimated_timeline: "4 months",
        budget_proposal: "$110,000",
      },
    ];

    setTimeout(() => {
      setApplications(mockApplications);
      setLoading(false);
    }, 1000);
  }, []);

  const filteredApplications = applications.filter((app) => {
    const matchesFilter = filter === "all" || app.status === filter;
    const matchesSearch =
      search === "" ||
      app.applicant.name.toLowerCase().includes(search.toLowerCase()) ||
      app.job.title.toLowerCase().includes(search.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const statusColors = {
    pending:
      "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300",
    accepted:
      "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300",
    rejected: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300",
    reviewed:
      "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300",
  };

  const handleStatusChange = (
    applicationId: number,
    newStatus: ApplicationStatus,
  ) => {
    setApplications((prev) =>
      prev.map((app) =>
        app.id === applicationId ? { ...app, status: newStatus } : app,
      ),
    );
  };

  const toggleExpand = (applicationId: number) => {
    setExpandedApplication(
      expandedApplication === applicationId ? null : applicationId,
    );
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
              to="/employer-dashboard"
              className={`flex items-center gap-2 text-sm font-medium transition-colors duration-300 ${
                darkMode
                  ? "text-gray-300 hover:text-white"
                  : "text-gray-600 hover:text-gray-900"
              }`}
            >
              <ArrowRight className="w-5 h-5 rotate-180" />
              <span>Back to Dashboard</span>
            </Link>

            <div className="flex items-center gap-4">
              <Link to="/" className="text-2xl font-bold text-[#0084ca]">
                ETN
              </Link>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Page Header */}
        <div className="mb-8">
          <h1
            className={`text-3xl font-bold mb-2 ${
              darkMode ? "text-white" : "text-gray-900"
            }`}
          >
            Job Applications
          </h1>
          <p className={darkMode ? "text-gray-400" : "text-gray-600"}>
            Review and manage applications for your posted jobs
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div
            className={`p-4 rounded-xl border ${
              darkMode
                ? "bg-gray-800 border-gray-700"
                : "bg-white border-gray-200"
            }`}
          >
            <div className="text-2xl font-bold text-[#0084ca]">
              {applications.length}
            </div>
            <div
              className={`text-sm ${
                darkMode ? "text-gray-400" : "text-gray-600"
              }`}
            >
              Total Applications
            </div>
          </div>
          <div
            className={`p-4 rounded-xl border ${
              darkMode
                ? "bg-gray-800 border-gray-700"
                : "bg-white border-gray-200"
            }`}
          >
            <div className="text-2xl font-bold text-yellow-600">
              {applications.filter((a) => a.status === "pending").length}
            </div>
            <div
              className={`text-sm ${
                darkMode ? "text-gray-400" : "text-gray-600"
              }`}
            >
              Pending Review
            </div>
          </div>
          <div
            className={`p-4 rounded-xl border ${
              darkMode
                ? "bg-gray-800 border-gray-700"
                : "bg-white border-gray-200"
            }`}
          >
            <div className="text-2xl font-bold text-blue-600">
              {applications.filter((a) => a.status === "reviewed").length}
            </div>
            <div
              className={`text-sm ${
                darkMode ? "text-gray-400" : "text-gray-600"
              }`}
            >
              Reviewed
            </div>
          </div>
          <div
            className={`p-4 rounded-xl border ${
              darkMode
                ? "bg-gray-800 border-gray-700"
                : "bg-white border-gray-200"
            }`}
          >
            <div className="text-2xl font-bold text-green-600">
              {applications.filter((a) => a.status === "accepted").length}
            </div>
            <div
              className={`text-sm ${
                darkMode ? "text-gray-400" : "text-gray-600"
              }`}
            >
              Accepted
            </div>
          </div>
        </div>

        {/* Search and Filter */}
        <div
          className={`p-4 rounded-xl border mb-6 ${
            darkMode
              ? "bg-gray-800 border-gray-700"
              : "bg-white border-gray-200"
          }`}
        >
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <Search
                className={`absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 ${
                  darkMode ? "text-gray-400" : "text-gray-500"
                }`}
              />
              <input
                type="text"
                placeholder="Search applications..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className={`w-full pl-10 pr-4 py-2 rounded-lg border text-sm ${
                  darkMode
                    ? "bg-gray-700 border-gray-600 text-white placeholder-gray-400"
                    : "bg-white border-gray-300 text-gray-900 placeholder-gray-500"
                } focus:outline-none focus:ring-2 focus:ring-[#0084ca]`}
              />
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setFilter("all")}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  filter === "all"
                    ? "bg-[#0084ca] text-white"
                    : darkMode
                      ? "bg-gray-700 text-gray-300 hover:bg-gray-600"
                      : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                All
              </button>
              <button
                onClick={() => setFilter("pending")}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  filter === "pending"
                    ? "bg-[#0084ca] text-white"
                    : darkMode
                      ? "bg-gray-700 text-gray-300 hover:bg-gray-600"
                      : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                Pending
              </button>
              <button
                onClick={() => setFilter("reviewed")}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  filter === "reviewed"
                    ? "bg-[#0084ca] text-white"
                    : darkMode
                      ? "bg-gray-700 text-gray-300 hover:bg-gray-600"
                      : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                Reviewed
              </button>
              <button
                onClick={() => setFilter("accepted")}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  filter === "accepted"
                    ? "bg-[#0084ca] text-white"
                    : darkMode
                      ? "bg-gray-700 text-gray-300 hover:bg-gray-600"
                      : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                Accepted
              </button>
            </div>
          </div>
        </div>

        {/* Applications List */}
        {filteredApplications.length === 0 ? (
          <div
            className={`text-center p-12 rounded-xl border ${
              darkMode
                ? "bg-gray-800 border-gray-700"
                : "bg-white border-gray-200"
            }`}
          >
            <Briefcase
              className={`w-16 h-16 mx-auto mb-4 ${
                darkMode ? "text-gray-600" : "text-gray-400"
              }`}
            />
            <h3
              className={`text-xl font-semibold mb-2 ${
                darkMode ? "text-white" : "text-gray-900"
              }`}
            >
              No Applications Found
            </h3>
            <p className={darkMode ? "text-gray-400" : "text-gray-600"}>
              {search || filter !== "all"
                ? "Try adjusting your search or filter"
                : "Applications will appear here when candidates apply to your jobs"}
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredApplications.map((application) => {
              const isExpanded = expandedApplication === application.id;

              return (
                <div
                  key={application.id}
                  className={`p-6 rounded-xl border transition-all duration-200 ${
                    darkMode
                      ? "bg-gray-800 border-gray-700 hover:border-gray-600"
                      : "bg-white border-gray-200 hover:border-gray-300"
                  } hover:shadow-xl transform hover:-translate-y-1`}
                >
                  <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-start gap-4">
                        <div className="relative">
                          <img
                            src={
                              application.applicant.avatar ||
                              "https://via.placeholder.com/150"
                            }
                            alt={application.applicant.name}
                            className="w-12 h-12 rounded-full object-cover"
                          />
                          <div
                            className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 ${
                              application.applicant.profile_completion >= 80
                                ? "bg-green-500 border-gray-800 dark:border-gray-700"
                                : application.applicant.profile_completion >= 50
                                  ? "bg-yellow-500 border-gray-800 dark:border-gray-700"
                                  : "bg-red-500 border-gray-800 dark:border-gray-700"
                            }`}
                          />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1 flex-wrap">
                            <h3
                              className={`text-lg font-semibold ${
                                darkMode ? "text-white" : "text-gray-900"
                              }`}
                            >
                              {application.applicant.name}
                            </h3>
                            <span
                              className={`px-2 py-0.5 rounded-full text-xs font-medium capitalize ${statusColors[application.status]}`}
                            >
                              {application.status}
                            </span>
                          </div>
                          <p
                            className={`text-sm mb-1 ${
                              darkMode ? "text-gray-400" : "text-gray-600"
                            }`}
                          >
                            {application.applicant.email}
                          </p>
                          <p
                            className={`text-sm font-medium mb-2 ${
                              darkMode ? "text-gray-300" : "text-gray-700"
                            }`}
                          >
                            {application.job.title}
                          </p>
                          <div className="flex flex-wrap gap-4 text-sm">
                            <div
                              className={`flex items-center gap-1 ${
                                darkMode ? "text-gray-400" : "text-gray-600"
                              }`}
                            >
                              <Calendar className="w-4 h-4" />
                              Applied {formatDate(application.submitted_at)}
                            </div>
                            <div
                              className={`flex items-center gap-1 ${
                                darkMode ? "text-gray-400" : "text-gray-600"
                              }`}
                            >
                              <User className="w-4 h-4" />
                              Profile {application.applicant.profile_completion}
                              % complete
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Expandable Details */}
                      {isExpanded && (
                        <div className="mt-4 space-y-4">
                          <div
                            className={`p-4 rounded-lg ${
                              darkMode ? "bg-gray-700" : "bg-gray-50"
                            }`}
                          >
                            <h4
                              className={`font-medium mb-2 flex items-center gap-2 ${
                                darkMode ? "text-white" : "text-gray-900"
                              }`}
                            >
                              <FileText className="w-4 h-4" />
                              Cover Letter
                            </h4>
                            <p
                              className={`text-sm ${
                                darkMode ? "text-gray-300" : "text-gray-700"
                              }`}
                            >
                              {application.cover_letter}
                            </p>
                          </div>

                          {application.proposal && (
                            <div
                              className={`p-4 rounded-lg ${
                                darkMode ? "bg-gray-700" : "bg-gray-50"
                              }`}
                            >
                              <h4
                                className={`font-medium mb-2 flex items-center gap-2 ${
                                  darkMode ? "text-white" : "text-gray-900"
                                }`}
                              >
                                <FileText className="w-4 h-4" />
                                Detailed Proposal
                              </h4>
                              <p
                                className={`text-sm ${
                                  darkMode ? "text-gray-300" : "text-gray-700"
                                }`}
                              >
                                {application.proposal}
                              </p>
                            </div>
                          )}

                          <div className="grid grid-cols-2 gap-4">
                            {application.estimated_timeline && (
                              <div
                                className={`p-3 rounded-lg ${
                                  darkMode ? "bg-gray-700" : "bg-gray-50"
                                }`}
                              >
                                <div
                                  className={`text-xs mb-1 flex items-center gap-1 ${
                                    darkMode ? "text-gray-400" : "text-gray-600"
                                  }`}
                                >
                                  <Clock className="w-3 h-3" />
                                  Timeline
                                </div>
                                <p
                                  className={`text-sm font-medium ${
                                    darkMode ? "text-white" : "text-gray-900"
                                  }`}
                                >
                                  {application.estimated_timeline}
                                </p>
                              </div>
                            )}
                            {application.budget_proposal && (
                              <div
                                className={`p-3 rounded-lg ${
                                  darkMode ? "bg-gray-700" : "bg-gray-50"
                                }`}
                              >
                                <div
                                  className={`text-xs mb-1 flex items-center gap-1 ${
                                    darkMode ? "text-gray-400" : "text-gray-600"
                                  }`}
                                >
                                  <DollarSign className="w-3 h-3" />
                                  Budget
                                </div>
                                <p
                                  className={`text-sm font-medium ${
                                    darkMode ? "text-white" : "text-gray-900"
                                  }`}
                                >
                                  {application.budget_proposal}
                                </p>
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="flex flex-col items-end gap-3">
                      <button
                        onClick={() => toggleExpand(application.id)}
                        className={`flex items-center gap-1 text-sm ${
                          darkMode
                            ? "text-gray-400 hover:text-white"
                            : "text-gray-600 hover:text-gray-900"
                        }`}
                      >
                        {isExpanded ? (
                          <>
                            <ChevronUp className="w-4 h-4" />
                            Hide Details
                          </>
                        ) : (
                          <>
                            <ChevronDown className="w-4 h-4" />
                            View Details
                          </>
                        )}
                      </button>

                      {application.status === "pending" && (
                        <div className="flex gap-2">
                          <button
                            onClick={() =>
                              handleStatusChange(application.id, "reviewed")
                            }
                            className="px-3 py-1.5 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors"
                          >
                            Mark Reviewed
                          </button>
                          <button
                            onClick={() =>
                              handleStatusChange(application.id, "accepted")
                            }
                            className="px-3 py-1.5 bg-green-600 text-white text-sm rounded-lg hover:bg-green-700 transition-colors"
                          >
                            Accept
                          </button>
                          <button
                            onClick={() =>
                              handleStatusChange(application.id, "rejected")
                            }
                            className="px-3 py-1.5 bg-red-600 text-white text-sm rounded-lg hover:bg-red-700 transition-colors"
                          >
                            Reject
                          </button>
                        </div>
                      )}

                      {application.status === "reviewed" && (
                        <div className="flex gap-2">
                          <button
                            onClick={() =>
                              handleStatusChange(application.id, "accepted")
                            }
                            className="px-3 py-1.5 bg-green-600 text-white text-sm rounded-lg hover:bg-green-700 transition-colors"
                          >
                            Accept
                          </button>
                          <button
                            onClick={() =>
                              handleStatusChange(application.id, "rejected")
                            }
                            className="px-3 py-1.5 bg-red-600 text-white text-sm rounded-lg hover:bg-red-700 transition-colors"
                          >
                            Reject
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
