import { API_BASE_URL } from "../../config/api";

const h = (token: string) => ({
  "Content-Type": "application/json",
  Authorization: `Bearer ${token}`,
});

export const internalLogin = async (email: string, password: string) => {
  const res = await fetch(`${API_BASE_URL}/api/internal/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || "Login failed");
  return data;
};

export const getAdminDashboard = (token: string) =>
  fetch(`${API_BASE_URL}/api/admin/dashboard`, { headers: h(token) }).then((r) => r.json());

export const getAdminUsers = (token: string, params: Record<string, any> = {}) => {
  const q = new URLSearchParams(params).toString();
  return fetch(`${API_BASE_URL}/api/admin/users?${q}`, { headers: h(token) }).then((r) => r.json());
};

export const createOwner = (token: string, data: Record<string, string>) =>
  fetch(`${API_BASE_URL}/api/admin/create-owner`, {
    method: "POST", headers: h(token), body: JSON.stringify(data),
  }).then((r) => r.json());

export const toggleUser = (token: string, id: number) =>
  fetch(`${API_BASE_URL}/api/admin/users/${id}/toggle`, {
    method: "PATCH", headers: h(token),
  }).then((r) => r.json());

export const deleteUser = (token: string, id: number) =>
  fetch(`${API_BASE_URL}/api/admin/users/${id}`, {
    method: "DELETE", headers: h(token),
  }).then((r) => r.json());

export const getVerificationRequests = (token: string, status = "pending") =>
  fetch(`${API_BASE_URL}/api/admin/verification-requests?status=${status}`, { headers: h(token) }).then((r) => r.json());

export const reviewVerification = (token: string, id: number, action: "approve" | "reject", admin_note?: string) =>
  fetch(`${API_BASE_URL}/api/admin/verification-requests/${id}`, {
    method: "PATCH", headers: h(token), body: JSON.stringify({ action, admin_note }),
  }).then((r) => r.json());

export const getTalentProfileForAdmin = (token: string, userId: number) =>
  fetch(`${API_BASE_URL}/api/admin/talent-profile/${userId}`, { headers: h(token) }).then((r) => r.json());

export const getAllPayments = (token: string, params: Record<string, any> = {}) => {
  const q = new URLSearchParams(params).toString();
  return fetch(`${API_BASE_URL}/api/admin/payments?${q}`, { headers: h(token) }).then((r) => r.json());
};
