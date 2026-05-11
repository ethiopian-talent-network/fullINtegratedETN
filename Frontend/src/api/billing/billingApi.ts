const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ;

export interface BillingInfo {
  id?: number;
  user_id?: number;
  full_name: string;
  email: string;
  phone: string;
  payout_method: 'telebirr' | 'cbe_birr' | 'bank';
  account_number?: string;
  bank_name?: string;
  meta?: any;
  is_verified?: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface BillingResponse {
  message: string;
  billing?: BillingInfo;
}

export interface AllBillingResponse {
  billing: BillingInfo[];
}

// Get billing information for the current user
export const getBillingInfo = async (token: string): Promise<BillingResponse> => {
  const response = await fetch(`${API_BASE_URL}/api/billing`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to fetch billing information');
  }

  return response.json();
};

// Create or update billing information
export const upsertBillingInfo = async (token: string, billingData: Omit<BillingInfo, 'id' | 'user_id' | 'is_verified' | 'created_at' | 'updated_at'>): Promise<BillingResponse> => {
  const response = await fetch(`${API_BASE_URL}/api/billing`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify(billingData),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to save billing information');
  }

  return response.json();
};

// Delete billing information
export const deleteBillingInfo = async (token: string): Promise<{ message: string }> => {
  const response = await fetch(`${API_BASE_URL}/api/billing`, {
    method: 'DELETE',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to delete billing information');
  }

  return response.json();
};

// Get all billing information (admin only)
export const getAllBillingInfo = async (token: string): Promise<AllBillingResponse> => {
  const response = await fetch(`${API_BASE_URL}/api/billing/all`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to fetch all billing information');
  }

  return response.json();
};

// Update verification status (admin only)
export const updateVerificationStatus = async (token: string, billingId: number, isVerified: boolean): Promise<{ message: string }> => {
  const response = await fetch(`${API_BASE_URL}/api/billing/${billingId}/verify`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify({ is_verified: isVerified }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to update verification status');
  }

  return response.json();
};
