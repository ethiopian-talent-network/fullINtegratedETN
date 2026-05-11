import { useState, useCallback } from "react";
import type { Job, JobFormData } from "../types/employer.types";
import {
  getEmployerJobs,
  createJob,
  updateJob,
  deleteJob,
} from "../../../api/employer/employerApi";

export const useJobs = () => {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState({
    total: 0,
    page: 1,
    limit: 10,
    has_next_page: false,
    has_prev_page: false,
  });

  const fetchJobs = useCallback(
    async (
      page: number = 1,
      limit: number = 10,
      status?: string,
      search?: string,
    ) => {
      setLoading(true);
      setError(null);

      try {
        const token = localStorage.getItem("token");
        if (!token) {
          throw new Error("No authentication token found");
        }

        const response = await getEmployerJobs(token, {
          page,
          limit,
          status,
          search,
        });
        setJobs(response.jobs || []);
        setPagination({
          total: response.pagination?.total || 0,
          page: response.pagination?.current || 1,
          limit: response.pagination?.pageSize || 10,
          has_next_page:
            (response.pagination?.current || 1) <
            (response.pagination?.pages || 1),
          has_prev_page: (response.pagination?.current || 1) > 1,
        });
      } catch (err: any) {
        setError(err.message || "Failed to fetch jobs");
      } finally {
        setLoading(false);
      }
    },
    [],
  );

  const createNewJob = useCallback(
    async (jobData: JobFormData) => {
      setLoading(true);
      setError(null);

      try {
        const token = localStorage.getItem("token");
        if (!token) {
          throw new Error("No authentication token found");
        }

        await createJob(token, jobData);
        await fetchJobs(pagination.page, pagination.limit);
        return true;
      } catch (err: any) {
        setError(err.message || "Failed to create job");
        return false;
      } finally {
        setLoading(false);
      }
    },
    [fetchJobs, pagination.page, pagination.limit],
  );

  const updateExistingJob = useCallback(
    async (jobId: number, jobData: Partial<JobFormData>) => {
      setLoading(true);
      setError(null);

      try {
        const token = localStorage.getItem("token");
        if (!token) {
          throw new Error("No authentication token found");
        }

        await updateJob(token, jobId, jobData);
        await fetchJobs(pagination.page, pagination.limit);
        return true;
      } catch (err: any) {
        setError(err.message || "Failed to update job");
        return false;
      } finally {
        setLoading(false);
      }
    },
    [fetchJobs, pagination.page, pagination.limit],
  );

  const deleteExistingJob = useCallback(
    async (jobId: number) => {
      setLoading(true);
      setError(null);

      try {
        const token = localStorage.getItem("token");
        if (!token) {
          throw new Error("No authentication token found");
        }

        await deleteJob(token, jobId);
        await fetchJobs(pagination.page, pagination.limit);
        return true;
      } catch (err: any) {
        setError(err.message || "Failed to delete job");
        return false;
      } finally {
        setLoading(false);
      }
    },
    [fetchJobs, pagination.page, pagination.limit],
  );

  const refreshJobs = useCallback(() => {
    return fetchJobs(pagination.page, pagination.limit);
  }, [fetchJobs, pagination.page, pagination.limit]);

  return {
    jobs,
    loading,
    error,
    pagination,
    fetchJobs,
    createNewJob,
    updateExistingJob,
    deleteExistingJob,
    refreshJobs,
  };
};
