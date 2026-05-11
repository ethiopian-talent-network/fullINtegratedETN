import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router";
import {
  ArrowLeft,
  User,
  Mail,
  Calendar,
  Briefcase,
  FileText,
} from "lucide-react";
import {
  getApplicationsByJob,
  updateApplicationStatus,
} from "../../api/employer/employerApi";
import { useDarkMode } from "../../contexts/DarkModeContext";
import ApplicationsByStatus from "../../components/payment/ApplicationsByStatus";

interface Proposal {
  id: number;
  talent_id: number;
  talent_name: string;
  talent_email: string;
  profile_image: string;
  profile_title: string;
  hourly_rate: string;
  talent_location: string;
  cover_letter: string;
  proposal: string;
  status: string;
  applied_at: string;
  job_id: number;
  fullName?: string;
  about?: string;
  skills?: string;
  experience?: string;
  education?: string;
  languages?: string;
  linkedin?: string;
  github?: string;
  resume_url?: string;
}

const ProposalsPage: React.FC = () => {
  const { jobId } = useParams<{ jobId: string }>();
  const navigate = useNavigate();
  const { darkMode } = useDarkMode();
  const [useNewView, setUseNewView] = useState(true);
  const [proposals, setProposals] = useState<Proposal[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedProposal, setSelectedProposal] = useState<Proposal | null>(
    null,
  );

  useEffect(() => {
    if (jobId) {
      fetchProposals();
    }
  }, [jobId]);

  const fetchProposals = async () => {
    try {
      setLoading(true);
      setError(null);

      const token = localStorage.getItem("token");
      if (!token) {
        throw new Error("No authentication token found");
      }

      const applications = await getApplicationsByJob(token, parseInt(jobId!));

      // Transform the response to match the Proposal interface
      const transformedProposals = applications.map((app: any) => ({
        id: app.applicationID,
        talent_id: app.talent_id || 0,
        talent_name: app.name,
        talent_email: app.email,
        profile_image: app.profile_image || "",
        profile_title: "",
        hourly_rate: "",
        talent_location: "",
        cover_letter: app.cover_letter,
        proposal: app.proposal,
        status: app.status,
        applied_at: app.applied_at,
        job_id: parseInt(jobId!),
        fullName: app.talent_full_name,
        about: app.about,
        skills: app.skills,
        experience: app.experience,
        education: app.education,
        languages: app.languages,
        linkedin: app.linkedin,
        github: app.github,
        resume_url: app.resume_url,
      }));
      setProposals(transformedProposals);
    } catch (err: any) {
      setError(err.message || "Failed to fetch proposals");
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending":
        return "bg-yellow-100 text-yellow-800";
      case "reviewed":
        return "bg-blue-100 text-blue-800";
      case "shortlisted":
        return "bg-green-100 text-green-800";
      case "rejected":
        return "bg-red-100 text-red-800";
      case "hired":
        return "bg-purple-100 text-purple-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const handleStatusUpdate = async (
    applicationId: number,
    newStatus: string,
  ) => {
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        throw new Error("No authentication token found");
      }

      await updateApplicationStatus(token, applicationId, newStatus);

      // Update the local state to reflect the change
      setProposals((prev) =>
        prev.map((proposal) =>
          proposal.id === applicationId
            ? { ...proposal, status: newStatus }
            : proposal,
        ),
      );

      // Update selected proposal if it's the one being updated
      if (selectedProposal && selectedProposal.id === applicationId) {
        setSelectedProposal({ ...selectedProposal, status: newStatus });
      }

      console.log(
        `Successfully updated application ${applicationId} to ${newStatus}`,
      );
    } catch (error: any) {
      console.error("Error updating application status:", error);
      alert(`Failed to update status: ${error.message}`);
    }
  };

  const handleAccept = () => {
    if (selectedProposal) {
      navigate(`/employer/agreement/${selectedProposal.job_id}`, {
        state: {
          application_id: selectedProposal.id,
          talent_name: selectedProposal.talent_name,
          talent_email: selectedProposal.talent_email,
          profile_image: selectedProposal.profile_image,
        },
      });
    }
  };

  const handleShortlist = () => {
    if (selectedProposal) {
      handleStatusUpdate(selectedProposal.id, "shortlisted");
    }
  };

  const handleReject = () => {
    if (selectedProposal) {
      handleStatusUpdate(selectedProposal.id, "rejected");
    }
  };

  // New view with status grouping
  if (useNewView && jobId) {
    return (
      <div
        className={`min-h-screen ${darkMode ? "bg-gray-900" : "bg-gray-50"}`}
      >
        {/* Header */}
        <div
          className={`${darkMode ? "bg-gray-800" : "bg-white"} shadow-sm border-b ${darkMode ? "border-gray-700" : "border-gray-200"}`}
        >
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-16">
              <div className="flex items-center">
                <button
                  onClick={() => navigate("/employer-dashboard")}
                  className={`flex items-center ${darkMode ? "text-gray-400 hover:text-gray-300" : "text-gray-600 hover:text-gray-900"} mr-4`}
                >
                  <ArrowLeft className="h-5 w-5 mr-2" />
                  Back to Dashboard
                </button>
                <h1
                  className={`text-xl font-semibold ${darkMode ? "text-white" : "text-gray-900"}`}
                >
                  Applications for Job #{jobId}
                </h1>
              </div>
              <button
                onClick={() => setUseNewView(false)}
                className={`text-sm px-3 py-1 rounded ${darkMode ? "bg-gray-700 text-gray-300 hover:bg-gray-600" : "bg-gray-200 text-gray-700 hover:bg-gray-300"}`}
              >
                Classic View
              </button>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <ApplicationsByStatus
            jobId={parseInt(jobId)}
            darkMode={darkMode}
            onRefresh={() => {}}
          />
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading proposals...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-600 mb-4">Error: {error}</div>
          <button
            onClick={() => navigate("/employer-dashboard")}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center">
              <button
                onClick={() => navigate("/employer-dashboard")}
                className="flex items-center text-gray-600 hover:text-gray-900 mr-4"
              >
                <ArrowLeft className="h-5 w-5 mr-2" />
                Back to Dashboard
              </button>
              <h1 className="text-xl font-semibold text-gray-900">
                Proposals for Job #{jobId}
              </h1>
            </div>
            <div className="text-sm text-gray-500">
              {proposals.length} proposal{proposals.length !== 1 ? "s" : ""}{" "}
              found
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {proposals.length === 0 ? (
          <div className="bg-white rounded-lg shadow-sm p-8 text-center">
            <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              No Proposals Yet
            </h3>
            <p className="text-gray-600">
              No proposals have been submitted for this job yet.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Proposals List */}
            <div className="lg:col-span-1">
              <div className="bg-white rounded-lg shadow-sm">
                <div className="p-4 border-b">
                  <h2 className="text-lg font-medium text-gray-900">
                    All Proposals
                  </h2>
                </div>
                <div className="divide-y">
                  {proposals.map((proposal) => (
                    <div
                      key={proposal.id}
                      className={`p-4 cursor-pointer hover:bg-gray-50 ${
                        selectedProposal?.id === proposal.id ? "bg-blue-50" : ""
                      }`}
                      onClick={() => setSelectedProposal(proposal)}
                    >
                      <div className="flex items-start space-x-3">
                        <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center overflow-hidden flex-shrink-0">
                          {proposal.profile_image ? (
                            <img
                              src={proposal.profile_image}
                              alt={proposal.talent_name}
                              className="h-10 w-10 rounded-full object-cover"
                            />
                          ) : (
                            <span className="text-blue-600 font-semibold text-sm">
                              {proposal.talent_name?.charAt(0).toUpperCase() ||
                                "?"}
                            </span>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-medium text-gray-900 truncate">
                            {proposal.talent_name}
                          </h3>
                          <div className="flex items-center text-sm text-gray-500 mt-1">
                            <Mail className="h-3 w-3 mr-1" />
                            <span className="truncate">
                              {proposal.talent_email}
                            </span>
                          </div>
                          <div className="flex items-center justify-between mt-2">
                            <span className="text-xs text-gray-400">
                              {new Date(
                                proposal.applied_at,
                              ).toLocaleDateString()}
                            </span>
                            <span
                              className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${getStatusColor(proposal.status)}`}
                            >
                              {proposal.status}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Proposal Details */}
            <div className="lg:col-span-2">
              {selectedProposal ? (
                <div className="bg-white rounded-lg shadow-sm">
                  <div className="p-6 border-b">
                    <div className="flex items-center justify-between mb-4">
                      <h2 className="text-xl font-semibold text-gray-900">
                        Proposal Details
                      </h2>
                      <span
                        className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(selectedProposal.status)}`}
                      >
                        {selectedProposal.status}
                      </span>
                    </div>
                    {/* Talent Profile Card */}
                    <div className="flex items-start space-x-4 mb-6 bg-gray-50 rounded-lg p-4">
                      <div className="h-16 w-16 rounded-full bg-blue-100 flex items-center justify-center border-2 border-white shadow-sm overflow-hidden flex-shrink-0">
                        {selectedProposal.profile_image ? (
                          <img
                            src={selectedProposal.profile_image}
                            alt={selectedProposal.talent_name}
                            className="h-16 w-16 rounded-full object-cover"
                          />
                        ) : (
                          <span className="text-blue-600 font-bold text-xl">
                            {selectedProposal.talent_name
                              ?.charAt(0)
                              .toUpperCase() || "?"}
                          </span>
                        )}
                      </div>
                      <div className="flex-1">
                        <h3 className="text-lg font-semibold text-gray-900">
                          {selectedProposal.talent_name}
                        </h3>
                        <div className="flex items-center text-sm text-gray-500 mt-1">
                          <Mail className="h-4 w-4 mr-1" />
                          {selectedProposal.talent_email}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center text-sm text-gray-500">
                      <Calendar className="h-4 w-4 mr-1" />
                      Applied on{" "}
                      {new Date(
                        selectedProposal.applied_at,
                      ).toLocaleDateString()}{" "}
                      at{" "}
                      {new Date(
                        selectedProposal.applied_at,
                      ).toLocaleTimeString()}
                    </div>
                  </div>

                  <div className="p-6 space-y-6">
                    {/* About Talent */}
                    {selectedProposal.about && (
                      <div>
                        <h3 className="text-lg font-medium text-gray-900 mb-3 flex items-center">
                          <User className="h-5 w-5 mr-2" />
                          About Talent
                        </h3>
                        <div className="bg-gray-50 rounded-lg p-4">
                          <p className="text-gray-700 whitespace-pre-wrap">
                            {selectedProposal.about}
                          </p>
                        </div>
                      </div>
                    )}

                    {/* Skills */}
                    {selectedProposal.skills && (
                      <div>
                        <h3 className="text-lg font-medium text-gray-900 mb-3 flex items-center">
                          <svg
                            className="h-5 w-5 mr-2"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
                            />
                          </svg>
                          Skills
                        </h3>
                        <div className="flex flex-wrap gap-2">
                          {selectedProposal.skills
                            .split(",")
                            .map((skill: string, idx: number) => (
                              <span
                                key={idx}
                                className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-medium"
                              >
                                {skill.trim()}
                              </span>
                            ))}
                        </div>
                      </div>
                    )}

                    {/* Experience */}
                    {selectedProposal.experience && (
                      <div>
                        <h3 className="text-lg font-medium text-gray-900 mb-3 flex items-center">
                          <Briefcase className="h-5 w-5 mr-2" />
                          Experience
                        </h3>
                        <div className="bg-gray-50 rounded-lg p-4">
                          <p className="text-gray-700 whitespace-pre-wrap">
                            {selectedProposal.experience}
                          </p>
                        </div>
                      </div>
                    )}

                    {/* Education */}
                    {selectedProposal.education && (
                      <div>
                        <h3 className="text-lg font-medium text-gray-900 mb-3 flex items-center">
                          <svg
                            className="h-5 w-5 mr-2"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M12 14l9-5-9-5-9 5 9 5z"
                            />
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z"
                            />
                          </svg>
                          Education
                        </h3>
                        <div className="bg-gray-50 rounded-lg p-4">
                          <p className="text-gray-700 whitespace-pre-wrap">
                            {selectedProposal.education}
                          </p>
                        </div>
                      </div>
                    )}

                    {/* Languages */}
                    {selectedProposal.languages && (
                      <div>
                        <h3 className="text-lg font-medium text-gray-900 mb-3 flex items-center">
                          <svg
                            className="h-5 w-5 mr-2"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 9h7M11 21l5-10 5 10M12.751 5C11.783 10.77 8.07 15.61 3 18.129"
                            />
                          </svg>
                          Languages
                        </h3>
                        <div className="flex flex-wrap gap-2">
                          {selectedProposal.languages
                            .split(",")
                            .map((lang: string, idx: number) => (
                              <span
                                key={idx}
                                className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm font-medium"
                              >
                                {lang.trim()}
                              </span>
                            ))}
                        </div>
                      </div>
                    )}

                    {/* Links */}
                    {(selectedProposal.linkedin ||
                      selectedProposal.github ||
                      selectedProposal.resume_url) && (
                      <div>
                        <h3 className="text-lg font-medium text-gray-900 mb-3 flex items-center">
                          <svg
                            className="h-5 w-5 mr-2"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"
                            />
                          </svg>
                          Links
                        </h3>
                        <div className="flex flex-wrap gap-3">
                          {selectedProposal.linkedin && (
                            <a
                              href={selectedProposal.linkedin}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm"
                            >
                              <svg
                                className="h-4 w-4 mr-2"
                                fill="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z" />
                              </svg>
                              LinkedIn
                            </a>
                          )}
                          {selectedProposal.github && (
                            <a
                              href={selectedProposal.github}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center px-4 py-2 bg-gray-800 text-white rounded-lg hover:bg-gray-900 text-sm"
                            >
                              <svg
                                className="h-4 w-4 mr-2"
                                fill="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
                              </svg>
                              GitHub
                            </a>
                          )}
                          {selectedProposal.resume_url && (
                            <a
                              href={selectedProposal.resume_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 text-sm"
                            >
                              <svg
                                className="h-4 w-4 mr-2"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                                />
                              </svg>
                              Resume
                            </a>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Cover Letter */}
                    <div>
                      <h3 className="text-lg font-medium text-gray-900 mb-3 flex items-center">
                        <FileText className="h-5 w-5 mr-2" />
                        Cover Letter
                      </h3>
                      <div className="bg-gray-50 rounded-lg p-4">
                        <p className="text-gray-700 whitespace-pre-wrap">
                          {selectedProposal.cover_letter ||
                            "No cover letter provided"}
                        </p>
                      </div>
                    </div>

                    {/* Proposal */}
                    <div>
                      <h3 className="text-lg font-medium text-gray-900 mb-3 flex items-center">
                        <Briefcase className="h-5 w-5 mr-2" />
                        Proposal
                      </h3>
                      <div className="bg-gray-50 rounded-lg p-4">
                        <p className="text-gray-700 whitespace-pre-wrap">
                          {selectedProposal.proposal ||
                            "No proposal details provided"}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex space-x-3 pt-4 border-t">
                    <button
                      onClick={handleAccept}
                      className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
                      disabled={!selectedProposal}
                    >
                      Accept
                    </button>
                    <button
                      onClick={handleShortlist}
                      className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                      disabled={!selectedProposal}
                    >
                      Shortlist
                    </button>
                    <button
                      onClick={handleReject}
                      className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
                      disabled={!selectedProposal}
                    >
                      Reject
                    </button>
                  </div>
                </div>
              ) : (
                <div className="bg-white rounded-lg shadow-sm p-8 text-center">
                  <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    Select a Proposal
                  </h3>
                  <p className="text-gray-600">
                    Choose a proposal from the list to view details
                  </p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProposalsPage;
