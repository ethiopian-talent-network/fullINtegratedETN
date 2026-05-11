import { Briefcase, AlertCircle, RefreshCw } from "lucide-react";
import type { Job, JobSection } from "../types";
import { JobCard } from "./JobCard";
import { useJobs } from "../../../hooks/useJobs";

interface JobListProps {
  darkMode: boolean;
  activeSection: JobSection;
  onViewDetails: (job: Job) => void;
}

export function JobList({
  darkMode,
  activeSection,
  onViewDetails,
}: JobListProps) {
  const { jobs, loading, error, saveJob, refreshJobs, clearError } = useJobs({
    autoFetch: true,
    section: activeSection,
  });

  // Handle save job action
  const handleSaveJob = async (jobId: number) => {
    try {
      await saveJob(jobId);
    } catch (error) {
      console.error("Failed to save job:", error);
    }
  };

  // Loading state
  if (loading) {
    return (
      <div className="text-center py-12">
        <div className="w-16 h-16 mx-auto mb-4 rounded-full flex items-center justify-center bg-[#0084ca]10 animate-pulse">
          <RefreshCw className="w-8 h-8 text-[#0084ca] animate-spin" />
        </div>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
          Loading jobs...
        </h3>
        <p className="text-gray-600 dark:text-gray-400">
          Fetching the latest opportunities for you
        </p>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="text-center py-12">
        <div className="w-16 h-16 mx-auto mb-4 rounded-full flex items-center justify-center bg-red-100 dark:bg-red-900/20">
          <AlertCircle className="w-8 h-8 text-red-500" />
        </div>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
          Error loading jobs
        </h3>
        <p className="text-gray-600 dark:text-gray-400 mb-4">{error}</p>
        <button
          onClick={() => {
            clearError();
            refreshJobs();
          }}
          className="px-4 py-2 bg-[#0084ca] text-white rounded-lg hover:bg-[#006ba6] transition-colors flex items-center gap-2 mx-auto"
        >
          <RefreshCw className="w-4 h-4" />
          Try Again
        </button>
      </div>
    );
  }

  // Empty state
  if (jobs.length === 0) {
    return (
      <div className="text-center py-12">
        <div
          className={`w-16 h-16 mx-auto mb-4 rounded-full flex items-center justify-center ${
            darkMode ? "bg-gray-700" : "bg-gray-100"
          }`}
        >
          <Briefcase className="w-8 h-8 text-gray-400" />
        </div>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
          No jobs found
        </h3>
        <p className="text-gray-600 dark:text-gray-400">
          {activeSection === "saved-jobs" &&
            "Start saving jobs you're interested in"}
          {activeSection === "applications" &&
            "Apply to jobs to track your applications"}
          {activeSection === "best-matches" &&
            "Check back later for new matching jobs"}
          {activeSection === "most-recently" &&
            "New jobs will appear here as they're posted"}
        </p>
      </div>
    );
  }

  // Jobs list
  return (
    <div className="grid grid-cols-1 gap-6">
      {jobs.map((job) => (
        <JobCard
          key={job.id}
          job={job}
          darkMode={darkMode}
          activeSection={activeSection}
          onSave={handleSaveJob}
          onViewDetails={onViewDetails}
        />
      ))}
    </div>
  );
}
