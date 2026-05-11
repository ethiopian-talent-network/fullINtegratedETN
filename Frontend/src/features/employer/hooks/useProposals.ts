import { useState, useCallback } from "react";
import type { Proposal } from "../types/employer.types";
import {
  fetchAllApplications,
  updateApplicationStatus,
  getApplicationsByJob,
} from "../../../api/employer/employerApi";

export const useProposals = () => {
  const [proposals, setProposals] = useState<Proposal[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchProposals = useCallback(async (jobId: number) => {
    setLoading(true);
    setError(null);

    try {
      const token = localStorage.getItem("token");
      if (!token) {
        throw new Error("No authentication token found");
      }

      const applications = await getApplicationsByJob(token, jobId);
      console.log("Applications for job", jobId, ":", applications);

      const transformedProposals = applications.map((app: any) => ({
        id: app.applicationID,
        talent_id: app.talent_id || 0,
        talent_name: app.name,
        talent_email: app.email,
        cover_letter: app.cover_letter ?? "",
        proposal: app.proposal ?? "",
        status: app.status,
        applied_at: app.applied_at,
        tokens_used: app.tokens_used ?? 0,
        job_id: jobId,
      }));

      setProposals(transformedProposals);
    } catch (err: any) {
      setError(err.message || "Failed to fetch proposals");
    } finally {
      setLoading(false);
    }
  }, []);

  const updateProposalStatus = useCallback(
    async (applicationId: number, status: string) => {
      setLoading(true);
      setError(null);

      try {
        const token = localStorage.getItem("token");
        if (!token) throw new Error("No authentication token found");

        await updateApplicationStatus(
          token,
          applicationId,
          status as "pending" | "reviewed" | "shortlisted" | "rejected" | "hired",
        );

        if (status === "hired") {
          // Backend rejected all others for this job — re-fetch to reflect that
          const jobId = proposals.find((p) => p.id === applicationId)?.job_id;
          if (jobId) {
            const token2 = localStorage.getItem("token")!;
            const applications = await getApplicationsByJob(token2, jobId);
            const transformed = applications.map((app: any) => ({
              id: app.applicationID,
              talent_id: app.talent_id || 0,
              talent_name: app.name,
              talent_email: app.email,
              cover_letter: app.cover_letter ?? "",
              proposal: app.proposal ?? "",
              status: app.status,
              applied_at: app.applied_at,
              tokens_used: app.tokens_used ?? 0,
              job_id: jobId,
            }));
            setProposals(transformed);
          }
        } else {
          setProposals((prev) =>
            prev.map((p) =>
              p.id === applicationId ? { ...p, status: status as Proposal["status"] } : p,
            ),
          );
        }

        return true;
      } catch (err: any) {
        setError(err.message || "Failed to update proposal status");
        return false;
      } finally {
        setLoading(false);
      }
    },
    [proposals],
  );

  const clearProposals = useCallback(() => {
    setProposals([]);
    setError(null);
  }, []);

  return {
    proposals,
    loading,
    error,
    fetchProposals,
    updateProposalStatus,
    clearProposals,
  };
};
