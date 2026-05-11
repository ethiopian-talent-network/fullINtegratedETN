export interface Job {
  id: number;
  title: string;
  description: string;
  category_id: number;
  category_name?: string;
  experience_level: string;
  salary: string;
  budget_type: string;
  duration: string;
  location: string;
  remote_allowed: boolean;
  employer_id: number;
  status: "active" | "draft" | "closed" | "paused";
  created_at: string;
  updated_at?: string;
  applications_count?: number;
  skills?: number[];
}

export interface Category {
  id: number;
  name: string;
  create_at: string;
  description?: string;
}

export interface Proposal {
  id: number;
  talent_id: number;
  talent_name: string;
  talent_email: string;
  profile_image?: string;
  about?: string;
  talent_location?: string;
  hourly_rate?: number;
  cover_letter: string;
  proposal?: string;
  status: "pending" | "reviewed" | "shortlisted" | "rejected" | "hired";
  applied_at: string;
  tokens_used: number;
  job_id?: number;
  job_title?: string;
  company_name?: string;
  company_location?: string;
}

export interface Talent {
  id: number;
  name: string;
  email: string;
  profile_title?: string;
  profile_image?: string;
  hourly_rate?: number;
  location?: string;
  skills?: string[];
  created_at: string;
}

export interface Contract {
  id: number;
  job_id: number;
  talent_id: number;
  talent_name: string;
  job_title: string;
  status: "active" | "completed" | "cancelled" | "disputed";
  start_date: string;
  end_date?: string;
  total_value: number;
  earnings?: number;
  progress?: number;
  created_at: string;
}

export interface JobFormData {
  title: string;
  description: string;
  category_id: number;
  experience_level: string;
  salary: string;
  budget_type: string;
  duration: string;
  location: string;
  remote_allowed: boolean;
  skills?: number[];
  token_cost?: number;
}

export interface PaginationInfo {
  total: number;
  page: number;
  limit: number;
  has_next_page: boolean;
  has_prev_page: boolean;
}

export interface JobsResponse {
  message: string;
  jobs: Job[];
  pagination: PaginationInfo;
}

export interface ProposalsResponse {
  message: string;
  applications: Proposal[];
  pagination: PaginationInfo;
}

export type TabType = "jobs" | "proposals" | "talents" | "contracts";

export interface EmployerStats {
  totalJobs: number;
  activeJobs: number;
  totalProposals: number;
  activeContracts: number;
}
