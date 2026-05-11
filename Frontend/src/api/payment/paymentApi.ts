import { API_BASE_URL } from "../../config/api";

const authHeaders = (token: string) => ({
  "Content-Type": "application/json",
  Authorization: `Bearer ${token}`,
});

export interface EscrowInfo {
  id: number;
  job_id: number;
  talent_id: number;
  employer_id: number;
  amount: number;
  currency: string;
  status: "pending" | "funded" | "released" | "failed";
  treansaction_ref: string;
  talent_name: string;
  talent_email: string;
}

export interface PaymentReceipt {
  id: number;
  transaction_id: string;
  amount: number;
  currency: string;
  method: string;
  status: string;
  created_at: string;
  job_title: string;
  talent_name: string;
  talent_email: string;
  company_name: string;
  receipt_number: string;
  payment_date: string;
}

// POST /api/payment/initialize — employer funds escrow via Chapa
export const initializePayment = async (
  token: string,
  data: { job_id: number; amount: number; currency: string; method: string },
): Promise<{ check_url: string }> => {
  const res = await fetch(`${API_BASE_URL}/api/payment/initialize`, {
    method: "POST",
    headers: authHeaders(token),
    body: JSON.stringify(data),
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json.message || "Failed to initialize payment");
  return json;
};

// POST /api/payment/verify — verify Chapa transaction after redirect
export const verifyPayment = async (tx_ref: string): Promise<{ message: string }> => {
  const res = await fetch(`${API_BASE_URL}/api/payment/verify`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ tx_ref }),
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json.message || "Verification failed");
  return json;
};

// GET /api/payment/escrow/:job_id — get escrow status for a job
export const getEscrowStatus = async (
  token: string,
  job_id: number,
): Promise<{ escrow: EscrowInfo }> => {
  const res = await fetch(`${API_BASE_URL}/api/payment/escrow/${job_id}`, {
    headers: authHeaders(token),
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json.message || "Failed to fetch escrow");
  return json;
};

// POST /api/payment/release/:job_id — employer approves work and releases payment
export const releasePayment = async (
  token: string,
  job_id: number,
): Promise<{ message: string }> => {
  const res = await fetch(`${API_BASE_URL}/api/payment/release/${job_id}`, {
    method: "POST",
    headers: authHeaders(token),
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json.message || "Failed to release payment");
  return json;
};

// GET /api/payment/receipt/:tx_ref — get payment receipt
export const getPaymentReceipt = async (
  token: string,
  tx_ref: string,
): Promise<{ receipt: PaymentReceipt }> => {
  const res = await fetch(`${API_BASE_URL}/api/payment/receipt/${tx_ref}`, {
    headers: authHeaders(token),
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json.message || "Failed to fetch receipt");
  return json;
};

// GET /api/payment/owner/payments — get all payments for owner dashboard
export const getOwnerPayments = async (
  token: string,
): Promise<{ payments: any[] }> => {
  const res = await fetch(`${API_BASE_URL}/api/payment/owner/payments`, {
    headers: authHeaders(token),
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json.message || "Failed to fetch payments");
  return json;
};

// GET /api/payment/owner/payments/:talentId — get payments for specific talent
export const getOwnerPaymentsByTalent = async (
  token: string,
  talentId: number,
): Promise<{ payments: any[] }> => {
  const res = await fetch(`${API_BASE_URL}/api/payment/owner/payments/${talentId}`, {
    headers: authHeaders(token),
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json.message || "Failed to fetch talent payments");
  return json;
};
