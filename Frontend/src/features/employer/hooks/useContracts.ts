import { useState, useCallback } from "react";
import { fetchContracts } from "../../../api/employer/employerApi";

export interface RealContract {
  id: number;
  job_id: number;
  talent_id: number;
  talent_name: string;
  employer_name: string;
  job_title: string;
  status: "draft" | "sent" | "negotiating" | "signed" | "active" | "completed" | "cancelled" | "disputed";
  start_date: string | null;
  end_date: string | null;
  total_amount: number;
  created_at: string;
  milestones_total: number;
  milestones_completed: number;
}

export function useContracts() {
  const [contracts, setContracts] = useState<RealContract[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const getContracts = useCallback(async (status?: string) => {
    setLoading(true);
    setError(null);
    try {
      const token = localStorage.getItem("token") || "";
      const data = await fetchContracts(token, status);
      setContracts(data.contracts || []);
    } catch (e: any) {
      setError(e.message);
      setContracts([]);
    } finally {
      setLoading(false);
    }
  }, []);

  return { contracts, loading, error, getContracts };
}
