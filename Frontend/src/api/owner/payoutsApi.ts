import axios from 'axios';

const API_BASE_URL = 'http://localhost:5000/api/owner/payouts';

const getAuthHeaders = () => {
  const token = localStorage.getItem('internal_token') || localStorage.getItem('token');
  return {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json',
  };
};

// Get all talents for payouts
export const getTalentsForPayouts = async (params?: {
  page?: number;
  limit?: number;
  search?: string;
}) => {
  try {
    const response = await axios.get(`${API_BASE_URL}/talents`, {
      headers: getAuthHeaders(),
      params: params || {},
    });
    return response.data;
  } catch (error) {
    console.error('Error fetching talents:', error);
    throw error;
  }
};

// Get talent billing information
export const getTalentBillingInfo = async (talentId: number) => {
  try {
    const response = await axios.get(`${API_BASE_URL}/talent/${talentId}/billing`, {
      headers: getAuthHeaders(),
    });
    return response.data;
  } catch (error) {
    console.error('Error fetching talent billing info:', error);
    throw error;
  }
};

// Create payout (money held in escrow)
export const createPayout = async (data: {
  talent_id: number;
  job_id: number;
  payment_verification_id: number;
  gross_amount: number;
  bank_name?: string;
  account_number?: string;
  account_holder_name?: string;
  phone_number?: string;
  payout_method?: string;
  notes?: string;
}) => {
  try {
    const response = await axios.post(`${API_BASE_URL}/create`, data, {
      headers: getAuthHeaders(),
    });
    return response.data;
  } catch (error) {
    console.error('Error creating payout:', error);
    throw error;
  }
};

// Get all payouts
export const getAllPayouts = async (params?: {
  status?: string;
  page?: number;
  limit?: number;
  search?: string;
}) => {
  try {
    const response = await axios.get(`${API_BASE_URL}`, {
      headers: getAuthHeaders(),
      params: params || {},
    });
    return response.data;
  } catch (error) {
    console.error('Error fetching payouts:', error);
    throw error;
  }
};

// Get payout details
export const getPayoutDetails = async (payoutId: number) => {
  try {
    const response = await axios.get(`${API_BASE_URL}/${payoutId}`, {
      headers: getAuthHeaders(),
    });
    return response.data;
  } catch (error) {
    console.error('Error fetching payout details:', error);
    throw error;
  }
};

// Employer approves payout (work approval)
export const employerApprovePayout = async (
  payoutId: number,
  data: {
    approval_notes?: string;
  }
) => {
  try {
    const response = await axios.post(`${API_BASE_URL}/${payoutId}/employer-approve`, data, {
      headers: getAuthHeaders(),
    });
    return response.data;
  } catch (error) {
    console.error('Error approving payout:', error);
    throw error;
  }
};

// Process payout (owner releases from escrow)
export const processPayout = async (
  payoutId: number,
  data: {
    transaction_id?: string;
    notes?: string;
  }
) => {
  try {
    const response = await axios.post(`${API_BASE_URL}/${payoutId}/process`, data, {
      headers: getAuthHeaders(),
    });
    return response.data;
  } catch (error) {
    console.error('Error processing payout:', error);
    throw error;
  }
};

// Reject payout
export const rejectPayout = async (
  payoutId: number,
  data: {
    failed_reason: string;
  }
) => {
  try {
    const response = await axios.post(`${API_BASE_URL}/${payoutId}/reject`, data, {
      headers: getAuthHeaders(),
    });
    return response.data;
  } catch (error) {
    console.error('Error rejecting payout:', error);
    throw error;
  }
};

// Get payout summary
export const getPayoutSummary = async () => {
  try {
    const response = await axios.get(`${API_BASE_URL}/summary`, {
      headers: getAuthHeaders(),
    });
    return response.data;
  } catch (error) {
    console.error('Error fetching payout summary:', error);
    throw error;
  }
};

// Get talent payouts
export const getTalentPayouts = async (talentId: number) => {
  try {
    const response = await axios.get(`${API_BASE_URL}/talent/${talentId}`, {
      headers: getAuthHeaders(),
    });
    return response.data;
  } catch (error) {
    console.error('Error fetching talent payouts:', error);
    throw error;
  }
};
