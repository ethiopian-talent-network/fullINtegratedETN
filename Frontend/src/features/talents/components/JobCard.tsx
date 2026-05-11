import {
  DollarSign,
  Clock,
  MapPin,
  Briefcase,
  Users,
  Heart,
  CheckCircle,
  ExternalLink,
} from "lucide-react";
import { Link } from "react-router";
import { Button } from "../../../components/ui/button";
import { VerifiedBadge } from "../../../components/ui/VerifiedBadge";
import { TALENT_ROUTES, buildRoute } from "../../../config/routes";
import type { Job, JobSection } from "../types";

interface JobCardProps {
  job: Job;
  darkMode: boolean;
  activeSection: JobSection;
  onSave: (jobId: number) => void;
  onViewDetails: (job: Job) => void;
}

export function JobCard({
  job,
  darkMode,
  activeSection,
  onSave,
  onViewDetails,
}: JobCardProps) {
  return (
    <div
      className={`border rounded-xl p-6 hover:shadow-xl transition-all duration-300 hover:border-[#0084ca] hover:-translate-y-1 ${
        darkMode ? "border-gray-700 bg-gray-800" : "border-slate-200 bg-white shadow-sm"
      }`}
    >
      {/* Job Header */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-4 mb-4">
        <div className="flex items-start gap-3">
          {job.companyLogo && (
            <img
              src={job.companyLogo}
              alt={job.company}
              className="w-10 h-10 sm:w-12 sm:h-12 rounded-lg object-cover flex-shrink-0"
            />
          )}
          <div className="min-w-0 flex-1">
            <h3 className={`text-base sm:text-lg font-semibold mb-1 ${
              darkMode ? "text-white" : "text-gray-900"
            }`}>
              {job.title}
            </h3>
            <div className={`flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2 text-xs sm:text-sm ${
              darkMode ? "text-gray-400" : "text-gray-600"
            }`}>
              <div className="flex items-center gap-2">
                <span>{job.company}</span>
                <VerifiedBadge verified={job.verified} size="sm" showText={false} />
              </div>
              <span className="hidden sm:inline">•</span>
              <span>{job.posted}</span>
              {job.urgent && (
                <span className="px-2 py-1 bg-red-100 text-red-700 text-xs rounded-full inline-block mt-1 sm:mt-0">
                  Urgent
                </span>
              )}
              {job.featured && (
                <span className="px-2 py-1 bg-purple-100 text-purple-700 text-xs rounded-full inline-block mt-1 sm:mt-0">
                  Featured
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          {activeSection === "best-matches" && (
            <span className="px-2 py-1 sm:px-3 sm:py-1 bg-gradient-to-r from-green-100 to-green-50 text-green-700 text-xs sm:text-sm font-semibold rounded-full border border-green-200">
              {job.match}% Match
            </span>
          )}
          {job.status === "new" && activeSection !== "applications" && (
            <span className="px-2 py-1 sm:px-3 sm:py-1 bg-gradient-to-r from-blue-100 to-blue-50 text-blue-700 text-xs sm:text-sm font-semibold rounded-full border border-blue-200">
              New
            </span>
          )}
          {job.status === "saved" && (
            <span className="px-2 py-1 sm:px-3 sm:py-1 bg-gradient-to-r from-yellow-100 to-yellow-50 text-yellow-700 text-xs sm:text-sm font-semibold rounded-full border border-yellow-200">
              Saved
            </span>
          )}
          {job.status === "applied" && (
            <span className="px-2 py-1 sm:px-3 sm:py-1 bg-gradient-to-r from-purple-100 to-purple-50 text-purple-700 text-xs sm:text-sm font-semibold rounded-full border border-purple-200">
              Applied
            </span>
          )}
        </div>
      </div>

      {/* Job Description */}
      <p
        className={`text-sm mb-4 ${darkMode ? "text-gray-300" : "text-gray-700"}`}
      >
        {job.description}
      </p>

      {/* Job Details */}
      <div className={`flex flex-wrap items-center gap-3 sm:gap-4 text-xs sm:text-sm mb-4 ${
        darkMode ? "text-gray-400" : "text-gray-600"
      }`}>
        <span className="flex items-center gap-1">
          <DollarSign className="w-3 h-3 sm:w-4 sm:h-4" />
          {job.budget}
        </span>
        <span className="flex items-center gap-1">
          <Clock className="w-3 h-3 sm:w-4 sm:h-4" />
          {job.duration}
        </span>
        <span className="flex items-center gap-1">
          <MapPin className="w-3 h-3 sm:w-4 sm:h-4" />
          {job.location}
        </span>
        {job.remote && (
          <span className="flex items-center gap-1">
            <Briefcase className="w-3 h-3 sm:w-4 sm:h-4" />
            Remote
          </span>
        )}
        <span className="flex items-center gap-1">
          <Users className="w-3 h-3 sm:w-4 sm:h-4" />
          {job.applicants} applicants
        </span>
      </div>

      {/* Skills Tags */}
      <div className="flex flex-wrap gap-2 mb-4">
        {(job.skills ?? []).map((skill, index) => (
          <span
            key={index}
            className={`px-2 py-1 text-xs rounded-full ${
              darkMode
                ? "bg-gray-700 text-gray-300"
                : "bg-slate-100 text-gray-700 border border-slate-200"
            }`}
          >
            {skill}
          </span>
        ))}
      </div>

      {/* Action Buttons */}
      <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
        {job.status !== "applied" ? (
          <>
            {job.id ? (
              <Link
                to={buildRoute(TALENT_ROUTES.APPLY_JOB, { jobId: job.id })}
                className="bg-gradient-to-r from-[#0084ca] to-[#006ba6] hover:from-[#006ba6] hover:to-[#005a8a] text-white shadow-md hover:shadow-lg transition-all duration-200 px-6 py-2 rounded-lg text-center font-medium w-full sm:w-auto"
              >
                Apply Now
              </Link>
            ) : (
              <button
                disabled
                className="bg-gradient-to-r from-gray-400 to-gray-500 text-white shadow-md px-6 py-2 rounded-lg text-center font-medium w-full sm:w-auto cursor-not-allowed"
              >
                Apply Now
              </button>
            )}
            <Button
              variant="outline"
              onClick={() => onSave(job.id)}
              className={
                job.status === "saved"
                  ? "text-yellow-600 border-yellow-600 w-full sm:w-auto"
                  : "w-full sm:w-auto"
              }
            >
              <Heart
                className={`w-4 h-4 mr-2 ${job.status === "saved" ? "fill-current" : ""}`}
              />
              {job.status === "saved" ? "Saved" : "Save"}
            </Button>
          </>
        ) : (
          <Button
            variant="outline"
            disabled
            className="text-green-600 border-green-600 w-full sm:w-auto"
          >
            <CheckCircle className="w-4 h-4 mr-2" />
            Applied
          </Button>
        )}
        <Button
          variant="outline"
          onClick={() => onViewDetails(job)}
          className="w-full sm:w-auto"
        >
          <ExternalLink className="w-4 h-4 mr-2" />
          View Details
        </Button>
      </div>
    </div>
  );
}
