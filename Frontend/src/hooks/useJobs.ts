import { useState, useEffect, useCallback } from "react";
import { jobService } from "../api/jobs/jobService";
import { getUserApplications } from "../api/jobs/jobApi";
import type { Job, JobSection } from "../features/talents/types";
import type { JobFilters } from "../api/jobs/jobApi";

export interface UseJobsOptions {
  autoFetch?: boolean;
  section?: JobSection;
}

export interface UseJobsReturn {
  jobs: Job[];
  loading: boolean;
  error: string | null;

  // Actions
  fetchJobs: (section?: JobSection) => Promise<void>;
  searchJobs: (query: string, filters?: JobFilters) => Promise<void>;
  refreshJobs: () => Promise<void>;

  // Job actions
  saveJob: (jobId: number) => Promise<void>;
  unsaveJob: (jobId: number) => Promise<void>;
  applyToJob: (jobId: number, coverLetter: string) => Promise<void>;

  // Pagination
  pagination: {
    current: number;
    pageSize: number;
    total: number;
    pages: number;
  } | null;

  // Utility
  clearError: () => void;
  clearCache: () => void;
}

export function useJobs(options: UseJobsOptions = {}): UseJobsReturn {
  const { autoFetch = true, section = "most-recently" } = options;

  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] =
    useState<UseJobsReturn["pagination"]>(null);

  // Fetch user applications to mark applied jobs
  const fetchApplications = useCallback(async () => {
    try {
      const response = await getUserApplications({ page: 1, limit: 100 });
      return response.applications;
    } catch (err) {
      console.error("Error fetching applications:", err);
      return [];
    }
  }, []);

  // Fetch jobs by section
  const fetchJobs = useCallback(
    async (jobSection?: JobSection) => {
      const targetSection = jobSection || section;

      setLoading(true);
      setError(null);

      try {
        // Fetch jobs and applications in parallel
        const [fetchedJobs, applications] = await Promise.all([
          jobService.getJobsBySection(targetSection),
          fetchApplications(),
        ]);

        const appliedJobIds = applications.map((app) => app.job_id);

        const updatedJobs = fetchedJobs.map((job) => ({
          ...job,
          status: appliedJobIds.includes(job.id) ? "applied" : job.status,
        }));

        setJobs(updatedJobs);
        setPagination(null);
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : "Failed to fetch jobs";
        setError(errorMessage);
        console.error("Error fetching jobs:", err);
      } finally {
        setLoading(false);
      }
    },
    [section, fetchApplications],
  );

  // Search jobs
  const searchJobs = useCallback(
    async (query: string, jobFilters?: JobFilters) => {
      setLoading(true);
      setError(null);

      try {
        const response = await jobService.searchJobs(query, jobFilters);
        setJobs(response.jobs);
        setPagination(response.pagination);
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : "Failed to search jobs";
        setError(errorMessage);
        console.error("Error searching jobs:", err);
      } finally {
        setLoading(false);
      }
    },
    [],
  );

  // Refresh jobs
  const refreshJobs = useCallback(async () => {
    await fetchJobs();
  }, [fetchJobs]);

  // Save a job
  const saveJobAction = useCallback(async (jobId: number) => {
    try {
      await jobService.saveJob(jobId);

      // Update local state
      setJobs((prevJobs) =>
        prevJobs.map((job) =>
          job.id === jobId ? { ...job, status: "saved" as const } : job,
        ),
      );
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to save job";
      setError(errorMessage);
      console.error("Error saving job:", err);
      throw err;
    }
  }, []);

  // Unsave a job
  const unsaveJobAction = useCallback(async (jobId: number) => {
    try {
      await jobService.unsaveJob(jobId);

      // Update local state
      setJobs((prevJobs) =>
        prevJobs.map((job) =>
          job.id === jobId ? { ...job, status: "new" as const } : job,
        ),
      );
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to unsave job";
      setError(errorMessage);
      console.error("Error unsaving job:", err);
      throw err;
    }
  }, []);

  // Apply to a job
  const applyToJobAction = useCallback(
    async (jobId: number, coverLetter: string) => {
      try {
        await jobService.applyToJob(jobId, coverLetter);

        // Update local state
        setJobs((prevJobs) =>
          prevJobs.map((job) =>
            job.id === jobId ? { ...job, status: "applied" as const } : job,
          ),
        );
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : "Failed to apply to job";
        setError(errorMessage);
        console.error("Error applying to job:", err);
        throw err;
      }
    },
    [],
  );

  // Clear error
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  // Clear cache
  const clearCache = useCallback(() => {
    jobService.clearAllCaches();
  }, []);

  // Auto-fetch on mount
  useEffect(() => {
    if (autoFetch) {
      fetchJobs();
    }
  }, [autoFetch, fetchJobs]);

  return {
    jobs,
    loading,
    error,

    // Actions
    fetchJobs,
    searchJobs,
    refreshJobs,

    // Job actions
    saveJob: saveJobAction,
    unsaveJob: unsaveJobAction,
    applyToJob: applyToJobAction,

    // Pagination
    pagination,

    // Utility
    clearError,
    clearCache,
  };
}

// Hook for job details
export function useJobDetails(jobId: number | null) {
  const [job, setJob] = useState<Job | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchJobDetails = useCallback(async (id: number) => {
    setLoading(true);
    setError(null);

    try {
      const jobDetails = await jobService.getJobById(id);
      setJob(jobDetails);
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to fetch job details";
      setError(errorMessage);
      console.error("Error fetching job details:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  // Clear job details
  const clearJob = useCallback(() => {
    setJob(null);
    setError(null);
  }, []);

  // Auto-fetch when jobId changes
  useEffect(() => {
    if (jobId) {
      fetchJobDetails(jobId);
    } else {
      clearJob();
    }
  }, [jobId, fetchJobDetails, clearJob]);

  return {
    job,
    loading,
    error,
    fetchJobDetails,
    clearJob,
  };
}

// Hook for job statistics
export function useJobStatistics() {
  const [stats, setStats] = useState({
    totalJobs: 0,
    recentJobs: 0,
    savedJobs: 0,
    appliedJobs: 0,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchStats = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const jobStats = await jobService.getJobStatistics();
      setStats(jobStats);
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to fetch job statistics";
      setError(errorMessage);
      console.error("Error fetching job statistics:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  // Auto-fetch on mount
  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  return {
    stats,
    loading,
    error,
    refreshStats: fetchStats,
  };
}
