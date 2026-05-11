import { API_BASE_URL } from "../config/api";

const getAuthHeaders = () => {
  const token = localStorage.getItem("internal_token") || localStorage.getItem("token");
  return {
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`,
  };
};

// Agreements API
export const createAgreement = async (data: any) => {
  const response = await fetch(`${API_BASE_URL}/api/agreements`, {
    method: "POST",
    headers: getAuthHeaders(),
    body: JSON.stringify(data),
  });
  return response.json();
};

export const getAgreements = async (params: any = {}) => {
  const query = new URLSearchParams(params).toString();
  const response = await fetch(`${API_BASE_URL}/api/agreements?${query}`, {
    headers: getAuthHeaders(),
  });
  return response.json();
};

export const getAgreementDetails = async (id: number) => {
  const response = await fetch(`${API_BASE_URL}/api/agreements/${id}`, {
    headers: getAuthHeaders(),
  });
  return response.json();
};

export const acceptAgreement = async (id: number) => {
  const response = await fetch(`${API_BASE_URL}/api/agreements/${id}/accept`, {
    method: "PATCH",
    headers: getAuthHeaders(),
  });
  return response.json();
};

export const completeAgreement = async (id: number) => {
  const response = await fetch(`${API_BASE_URL}/api/agreements/${id}/complete`, {
    method: "PATCH",
    headers: getAuthHeaders(),
  });
  return response.json();
};

export const confirmCompletion = async (id: number) => {
  const response = await fetch(`${API_BASE_URL}/api/agreements/${id}/confirm-completion`, {
    method: "PATCH",
    headers: getAuthHeaders(),
  });
  return response.json();
};

// Payouts API
export const getPendingPayouts = async (params: any = {}) => {
  const query = new URLSearchParams(params).toString();
  const response = await fetch(`${API_BASE_URL}/api/payouts/pending?${query}`, {
    headers: getAuthHeaders(),
  });
  return response.json();
};

export const getPayoutDetails = async (id: number) => {
  const response = await fetch(`${API_BASE_URL}/api/payouts/${id}`, {
    headers: getAuthHeaders(),
  });
  return response.json();
};

export const approvePayout = async (id: number, notes?: string) => {
  const response = await fetch(`${API_BASE_URL}/api/payouts/${id}/approve`, {
    method: "PATCH",
    headers: getAuthHeaders(),
    body: JSON.stringify({ notes }),
  });
  return response.json();
};

export const releasePayout = async (id: number, data: any = {}) => {
  const response = await fetch(`${API_BASE_URL}/api/payouts/${id}/release`, {
    method: "PATCH",
    headers: getAuthHeaders(),
    body: JSON.stringify(data),
  });
  return response.json();
};

export const getTalentPayoutHistory = async (talentId: number, params: any = {}) => {
  const query = new URLSearchParams(params).toString();
  const response = await fetch(`${API_BASE_URL}/api/payouts/history/talent/${talentId}?${query}`, {
    headers: getAuthHeaders(),
  });
  return response.json();
};

export const getEmployerPayoutHistory = async (employerId: number, params: any = {}) => {
  const query = new URLSearchParams(params).toString();
  const response = await fetch(`${API_BASE_URL}/api/payouts/history/employer/${employerId}?${query}`, {
    headers: getAuthHeaders(),
  });
  return response.json();
};
