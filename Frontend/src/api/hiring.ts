import { api } from '../config/api';

export interface Hiring {
  hiring_id: number;
  hired_at: string;
  hiring_status: 'active' | 'completed' | 'cancelled';
  talent_id?: number;
  talent_name?: string;
  talent_email?: string;
  profile_image?: string;
  employer_id?: number;
  employer_name?: string;
  employer_email?: string;
  company_name?: string;
  job_id: number;
  job_title: string;
  budget_min?: number;
  budget_max?: number;
  currency: string;
}

export interface HiringRequest {
  talent_id: number;
  job_id: number;
  application_id?: number;
}

export const hiringApi = {
  // Hire a talent (employer only)
  hireTalent: async (data: HiringRequest) => {
    const response = await api.post('/hiring/hire', data);
    return response.data;
  },

  // Get all talents hired by employer
  getMyHires: async (): Promise<{ hires: Hiring[] }> => {
    const response = await api.get('/hiring/my-hires');
    return response.data;
  },

  // Get all employers who hired this talent
  getMyEmployers: async (): Promise<{ employers: Hiring[] }> => {
    const response = await api.get('/hiring/my-employers');
    return response.data;
  }
};