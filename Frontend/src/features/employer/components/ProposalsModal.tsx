import React from "react";
import { Button } from "../../../components/ui/button";
import type { Proposal } from "../types/employer.types";

interface ProposalsModalProps {
  isOpen: boolean;
  onClose: () => void;
  proposals: Proposal[];
  loading?: boolean;
  error?: string | null;
  onUpdateStatus: (proposalId: number, status: string) => void;
  onViewProfile?: (talentId: number) => void;
  darkMode?: boolean;
}

export const ProposalsModal: React.FC<ProposalsModalProps> = ({
  isOpen,
  onClose,
  proposals,
  loading = false,
  error = null,
  onUpdateStatus,
  onViewProfile,
  darkMode = false,
}) => {
  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending":
        return "bg-yellow-100 text-yellow-800";
      case "reviewed":
        return "bg-blue-100 text-blue-800";
      case "shortlisted":
        return "bg-purple-100 text-purple-800";
      case "rejected":
        return "bg-red-100 text-red-800";
      case "hired":
        return "bg-green-100 text-green-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getStatusActions = (status: string) => {
    switch (status) {
      case "pending":
        return [
          { label: "Mark as Reviewed", status: "reviewed", color: "blue" },
          { label: "Shortlist", status: "shortlisted", color: "purple" },
          { label: "Reject", status: "rejected", color: "red" },
        ];
      case "reviewed":
        return [
          { label: "Shortlist", status: "shortlisted", color: "purple" },
          { label: "Reject", status: "rejected", color: "red" },
        ];
      case "shortlisted":
        return [
          { label: "Hire", status: "hired", color: "green" },
          { label: "Reject", status: "rejected", color: "red" },
        ];
      default:
        return [];
    }
  };

  const getActionColor = (color: string) => {
    switch (color) {
      case "blue":
        return "bg-blue-50 hover:bg-blue-100 text-blue-600";
      case "purple":
        return "bg-purple-50 hover:bg-purple-100 text-purple-600";
      case "red":
        return "bg-red-50 hover:bg-red-100 text-red-600";
      case "green":
        return "bg-green-50 hover:bg-green-100 text-green-600";
      default:
        return "bg-gray-50 hover:bg-gray-100 text-gray-600";
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div
        className={`max-w-4xl w-full max-h-[90vh] overflow-y-auto rounded-lg ${
          darkMode ? "bg-gray-800" : "bg-white"
        }`}
      >
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h2
              className={`text-2xl font-bold ${darkMode ? "text-white" : "text-gray-900"}`}
            >
              Job Proposals
            </h2>
            <button
              onClick={onClose}
              className={`p-2 rounded-lg ${darkMode ? "hover:bg-gray-700" : "hover:bg-gray-100"}`}
            >
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>

          {loading && (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-4"></div>
              <p className={`text-gray-500 ${darkMode ? "text-gray-400" : ""}`}>
                Loading proposals...
              </p>
            </div>
          )}

          {error && (
            <div
              className={`text-center py-8 px-4 rounded-lg border ${
                darkMode
                  ? "bg-red-900/20 border-red-800 text-red-400"
                  : "bg-red-50 border-red-200 text-red-600"
              }`}
            >
              <svg
                className="w-12 h-12 mx-auto mb-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              <h3 className="text-lg font-medium mb-2">
                Error Loading Proposals
              </h3>
              <p className="text-sm">{error}</p>
            </div>
          )}

          {!loading && !error && proposals.length === 0 && (
            <div
              className={`text-center py-12 px-4 rounded-lg border ${
                darkMode
                  ? "bg-gray-800 border-gray-700"
                  : "bg-gray-50 border-gray-200"
              }`}
            >
              <svg
                className={`w-12 h-12 mx-auto mb-4 ${darkMode ? "text-gray-400" : "text-gray-400"}`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"
                />
              </svg>
              <h3
                className={`text-lg font-medium mb-2 ${darkMode ? "text-white" : "text-gray-900"}`}
              >
                No Proposals Yet
              </h3>
              <p
                className={`text-sm ${darkMode ? "text-gray-400" : "text-gray-600"}`}
              >
                No one has applied to this job yet. Check back later!
              </p>
            </div>
          )}

          {!loading && !error && proposals.length > 0 && (
            <div className="space-y-4">
              {proposals.map((proposal) => (
                <div
                  key={proposal.id}
                  className={`border rounded-lg p-6 ${
                    darkMode
                      ? "border-gray-700 bg-gray-700"
                      : "border-gray-200 bg-gray-50"
                  }`}
                >
                  <div className="flex justify-between items-start mb-4">
                    <div
                      className="flex items-center gap-4 cursor-pointer hover:opacity-80 transition-opacity"
                      onClick={() => onViewProfile?.(proposal.talent_id)}
                    >
                      {proposal.profile_image && (
                        <img
                          src={proposal.profile_image}
                          alt={proposal.talent_name}
                          className="w-12 h-12 rounded-full object-cover"
                        />
                      )}
                      <div>
                        <h3
                          className={`font-semibold ${darkMode ? "text-white" : "text-gray-900"} hover:underline`}
                        >
                          {proposal.talent_name}
                        </h3>
                        <p
                          className={`text-sm ${darkMode ? "text-gray-400" : "text-gray-600"}`}
                        >
                          {proposal.talent_email}
                        </p>
                        {proposal.profile_title && (
                          <p
                            className={`text-sm ${darkMode ? "text-gray-400" : "text-gray-600"}`}
                          >
                            {proposal.profile_title}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span
                        className={`px-3 py-1 text-xs font-medium rounded-full ${getStatusColor(proposal.status)}`}
                      >
                        {proposal.status}
                      </span>
                    </div>
                  </div>

                  {proposal.cover_letter && (
                    <div className="mb-4">
                      <h4
                        className={`font-medium mb-2 ${darkMode ? "text-white" : "text-gray-900"}`}
                      >
                        Cover Letter
                      </h4>
                      <p
                        className={`text-sm ${darkMode ? "text-gray-300" : "text-gray-700"}`}
                      >
                        {proposal.cover_letter}
                      </p>
                    </div>
                  )}

                  {proposal.proposal && (
                    <div className="mb-4">
                      <h4
                        className={`font-medium mb-2 ${darkMode ? "text-white" : "text-gray-900"}`}
                      >
                        Proposal
                      </h4>
                      <p
                        className={`text-sm ${darkMode ? "text-gray-300" : "text-gray-700"}`}
                      >
                        {proposal.proposal}
                      </p>
                    </div>
                  )}

                  <div className="flex items-center gap-4 text-sm text-gray-600 mb-4">
                    {proposal.hourly_rate && (
                      <span className="flex items-center gap-1">
                        <svg
                          className="w-4 h-4"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1"
                          />
                        </svg>
                        {proposal.hourly_rate}/hour
                      </span>
                    )}
                    {proposal.talent_location && (
                      <span className="flex items-center gap-1">
                        <svg
                          className="w-4 h-4"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                          />
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                          />
                        </svg>
                        {proposal.talent_location}
                      </span>
                    )}
                    <span className="flex items-center gap-1">
                      <svg
                        className="w-4 h-4"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                        />
                      </svg>
                      Applied{" "}
                      {new Date(proposal.applied_at).toLocaleDateString()}
                    </span>
                  </div>

                  <div className="flex gap-2">
                    {getStatusActions(proposal.status).map((action) => (
                      <Button
                        key={action.status}
                        size="sm"
                        onClick={() =>
                          onUpdateStatus(proposal.id, action.status)
                        }
                        className={getActionColor(action.color)}
                      >
                        {action.label}
                      </Button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
