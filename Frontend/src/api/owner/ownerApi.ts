import { API_BASE_URL } from "../../config/api";

const h = (token: string) => ({
  "Content-Type": "application/json",
  Authorization: `Bearer ${token}`,
});

export const getOwnerDashboard = (token: string) =>
  fetch(`${API_BASE_URL}/api/owner/dashboard`, { headers: h(token) }).then((r) => r.json());

export const getOwnerPayments = (token: string, params: Record<string, any> = {}) => {
  const q = new URLSearchParams(params).toString();
  return fetch(`${API_BASE_URL}/api/owner/payments?${q}`, { headers: h(token) }).then((r) => r.json());
};

export const getOwnerEscrow = (token: string, params: Record<string, any> = {}) => {
  const q = new URLSearchParams(params).toString();
  return fetch(`${API_BASE_URL}/api/owner/escrow?${q}`, { headers: h(token) }).then((r) => r.json());
};

export const verifyPaymentWithChapa = (token: string, id: number) =>
  fetch(`${API_BASE_URL}/api/owner/payments/${id}/verify`, { method: "POST", headers: h(token) }).then((r) => r.json());

export const approvePayment = (token: string, id: number) =>
  fetch(`${API_BASE_URL}/api/owner/payments/${id}/approve`, { method: "POST", headers: h(token) }).then((r) => r.json());

export const releaseEscrow = (token: string, id: number) =>
  fetch(`${API_BASE_URL}/api/owner/escrow/${id}/release`, { method: "POST", headers: h(token) }).then((r) => r.json());

export const getOwnerPayouts = (token: string, params: Record<string, any> = {}) => {
  const q = new URLSearchParams(params).toString();
  return fetch(`${API_BASE_URL}/api/owner/payouts?${q}`, { headers: h(token) }).then((r) => r.json());
};

export const processPayout = (token: string, id: number) =>
  fetch(`${API_BASE_URL}/api/owner/payouts/${id}/process`, { method: "POST", headers: h(token) }).then((r) => r.json());

export const completePayout = (token: string, id: number) =>
  fetch(`${API_BASE_URL}/api/owner/payouts/${id}/complete`, { method: "POST", headers: h(token) }).then((r) => r.json());

export const failPayout = (token: string, id: number) =>
  fetch(`${API_BASE_URL}/api/owner/payouts/${id}/fail`, { method: "POST", headers: h(token) }).then((r) => r.json());
