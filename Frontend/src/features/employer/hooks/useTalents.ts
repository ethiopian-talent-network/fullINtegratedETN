import { useState, useCallback } from "react";
import type { Talent } from "../types/employer.types";
import { fetchTalents } from "../../../api/employer/employerApi";

export const useTalents = () => {
  const [talents, setTalents] = useState<Talent[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState({
    total: 0,
    page: 1,
    limit: 20,
    has_next_page: false,
    has_prev_page: false,
  });

  const getTalents = useCallback(
    async (options?: { page?: number; limit?: number; search?: string }) => {
      setLoading(true);
      setError(null);

      try {
        const token = localStorage.getItem("token");
        if (!token) {
          throw new Error("No authentication token found");
        }

        const response = await fetchTalents(token, options);
        setTalents(response.talents);
        setPagination(response.pagination);
      } catch (err: any) {
        setError(err.message || "Failed to fetch talents");
      } finally {
        setLoading(false);
      }
    },
    [],
  );

  const clearTalents = useCallback(() => {
    setTalents([]);
    setError(null);
  }, []);

  return {
    talents,
    loading,
    error,
    pagination,
    getTalents,
    clearTalents,
  };
};
