import { useState, useCallback } from "react";
import type { Proposal } from "../types/employer.types";
import {
  fetchAllApplications,
  updateApplicationStatus,
} from "../../../api/employer/employerApi";

export const useAllProposals = () => {
  const [proposals, setProposals] = useState<Proposal[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState({
    total: 0,
    page: 1,
    limit: 10,
    has_next_page: false,
    has_prev_page: false,
  });

  const fetchAllProposals = useCallback(
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

        console.log("Fetching proposals with params:", {
          page,
          limit,
          status,
          search,
        });
        const response = await fetchAllApplications(token, {
          page,
          limit,
          ...(status && status !== "all" ? { status } : {}),
          ...(search ? { search } : {}),
        });
        console.log("Response from API:", response);
        console.log("Applications count:", response.applications?.length || 0);
        setProposals(response.applications || []);
        setPagination(response.pagination);
      } catch (err: any) {
        console.error("Error fetching proposals:", err);
        setError(err.message || "Failed to fetch proposals");
      } finally {
        setLoading(false);
      }
    },
    [],
  );

  const updateProposalStatus = useCallback(
    async (applicationId: number, status: string) => {
      setLoading(true);
      setError(null);

      try {
        const token = localStorage.getItem("token");
        if (!token) throw new Error("No authentication token found");

        await updateApplicationStatus(token, applicationId, status);

        if (status === "hired") {
          // Backend rejected all others — do a full refresh to reflect that
          const response = await fetchAllApplications(token, {
            page: pagination.page,
            limit: pagination.limit,
          });
          setProposals(response.applications || []);
          setPagination(response.pagination);
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
    [pagination.page, pagination.limit],
  );

  const refreshProposals = useCallback(() => {
    return fetchAllProposals(pagination.page, pagination.limit);
  }, [fetchAllProposals, pagination.page, pagination.limit]);

  return {
    proposals,
    loading,
    error,
    pagination,
    fetchAllProposals,
    updateProposalStatus,
    refreshProposals,
  };
};
