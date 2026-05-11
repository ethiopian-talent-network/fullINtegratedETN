import { API_BASE_URL } from "../../config/api";

import type {
  Proposal,
  JobFormData,
  Talent,
} from "../../features/employer/types/employer.types";

// API function for fetching all applications
export const fetchAllApplications = async (
  token: string,
  options?: {
    page?: number;
    limit?: number;
    status?: string;
    search?: string;
  },
) => {
  const params = new URLSearchParams();
  if (options?.page) params.append("page", options.page.toString());
  if (options?.limit) params.append("limit", options.limit.toString());
  if (options?.status && options.status !== "all")
    params.append("status", options.status);
  if (options?.search && options.search.trim()) params.append("search", options.search);

  const url = `${API_BASE_URL}/api/employer/proposals-and-applications?${params}`;

  const response = await fetch(url, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(
      `Failed to fetch applications: ${response.statusText} - ${errorText}`,
    );
  }

  const data = await response.json();

  // Transform the API response to match the Proposal interface
  // The new endpoint returns data grouped by job, so we need to flatten it
  const allApplications: any[] = [];

  if (data.data && Array.isArray(data.data)) {
    data.data.forEach((jobGroup: any) => {
      if (jobGroup.applications && Array.isArray(jobGroup.applications)) {
        jobGroup.applications.forEach((app: any) => {
          allApplications.push({
            ...app,
            job_id: jobGroup.job_id,
            job_title: jobGroup.job_title,
            company_name: jobGroup.company_name,
            company_location: jobGroup.company_location,
          });
        });
      }
    });
  }

  const applications: Proposal[] = allApplications.map((app: any) => {
    const firstProposal = app.proposals?.[0] ?? {};
    return {
      id: app.application_id,
      talent_id: app.talent_id,
      talent_name: app.talent_name,
      talent_email: app.talent_email,
      profile_image: app.talent_profile_image,
      about: app.talent_about,
      talent_location: app.talent_location,
      hourly_rate: app.talent_hourly_rate,
      cover_letter: firstProposal.cover_letter ?? "",
      proposal: firstProposal.proposal ?? "",
      status: app.application_status,
      applied_at: app.applied_at,
      tokens_used: firstProposal.tokens_used ?? 0,
      job_id: app.job_id,
      job_title: app.job_title,
      company_name: app.company_name,
      company_location: app.company_location,
    };
  });

  return {
    message: data.message,
    applications,
    pagination: data.pagination,
  };
};

// API function for updating status
export const updateApplicationStatus = async (
  token: string,
  applicationId: number,
  status: string,
) => {
  const response = await fetch(
    `${API_BASE_URL}/api/jobs/employer/applications/${applicationId}/status`,
    {
      method: "PUT",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ status }),
    },
  );

  if (!response.ok) {
    throw new Error(`Failed to update status: ${response.statusText}`);
  }

  return await response.json();
};

// API function for fetching all proposals and applications for employer
export const getAllProposalsAndApplications = async (
  token: string,
  options?: {
    page?: number;
    limit?: number;
    status?: string;
    search?: string;
    job_id?: number;
  },
) => {
  const params = new URLSearchParams();
  if (options?.page) params.append("page", options.page.toString());
  if (options?.limit) params.append("limit", options.limit.toString());
  if (options?.status && options.status !== "all")
    params.append("status", options.status);
  if (options?.search && options.search.trim()) params.append("search", options.search);
  if (options?.job_id) params.append("job_id", options.job_id.toString());

  const response = await fetch(
    `${API_BASE_URL}/api/employer/proposals-and-applications?${params}`,
    {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    },
  );

  if (!response.ok) {
    throw new Error(
      `Failed to fetch proposals and applications: ${response.statusText}`,
    );
  }

  return await response.json();
};

// API function for fetching applications for a specific job
export const getApplicationsByJob = async (token: string, jobId: number) => {
  const response = await fetch(
    `${API_BASE_URL}/api/employer/jobApplicants/${jobId}`,
    {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    },
  );

  if (!response.ok) {
    throw new Error(`Failed to fetch job applications: ${response.statusText}`);
  }

  return await response.json();
};

// API function for fetching employer jobs
export const getEmployerJobs = async (
  token: string,
  options?: {
    page?: number;
    limit?: number;
    status?: string;
    search?: string;
  },
) => {
  const params = new URLSearchParams();
  if (options?.page) params.append("page", options.page.toString());
  if (options?.limit) params.append("limit", options.limit.toString());
  if (options?.status && options.status !== "all")
    params.append("status", options.status);
  if (options?.search) params.append("search", options.search);

  const response = await fetch(
    `${API_BASE_URL}/api/jobs/employer/jobs?${params}`,
    {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    },
  );

  if (!response.ok) {
    throw new Error(`Failed to fetch jobs: ${response.statusText}`);
  }

  return await response.json();
};

// API function for creating a job
export const createJob = async (token: string, jobData: JobFormData) => {
  const response = await fetch(`${API_BASE_URL}/api/jobs/employer/jobs`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(jobData),
  });

  if (!response.ok) {
    throw new Error(`Failed to create job: ${response.statusText}`);
  }

  return await response.json();
};

// API function for updating a job
export const updateJob = async (
  token: string,
  jobId: number,
  jobData: Partial<JobFormData>,
) => {
  const response = await fetch(
    `${API_BASE_URL}/api/jobs/employer/jobs/${jobId}`,
    {
      method: "PUT",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(jobData),
    },
  );

  if (!response.ok) {
    throw new Error(`Failed to update job: ${response.statusText}`);
  }

  return await response.json();
};

// API function for deleting a job
export const deleteJob = async (token: string, jobId: number) => {
  const response = await fetch(
    `${API_BASE_URL}/api/jobs/employer/jobs/${jobId}`,
    {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    },
  );

  if (!response.ok) {
    throw new Error(`Failed to delete job: ${response.statusText}`);
  }

  return await response.json();
};

// API function for fetching contracts
export const fetchContracts = async (token: string, status?: string) => {
  const params = new URLSearchParams();
  if (status && status !== "all") params.append("status", status);
  const response = await fetch(`${API_BASE_URL}/api/contracts?${params}`, {
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
  });
  if (!response.ok) throw new Error("Failed to fetch contracts");
  return response.json();
};

// API function for fetching milestones for a contract
export const fetchMilestones = async (token: string, contractId: number) => {
  const response = await fetch(`${API_BASE_URL}/api/contracts/${contractId}/milestones`, {
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
  });
  if (!response.ok) throw new Error("Failed to fetch milestones");
  return response.json();
};

// API function for fetching all talents
export const fetchTalents = async (
  token: string,
  options?: {
    page?: number;
    limit?: number;
    search?: string;
  },
) => {
  const params = new URLSearchParams();
  if (options?.page) params.append("page", options.page.toString());
  if (options?.limit) params.append("limit", options.limit.toString());
  if (options?.search) params.append("search", options.search);

  const response = await fetch(
    `${API_BASE_URL}/api/employer/talents?${params}`,
    {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    },
  );

  if (!response.ok) {
    throw new Error(`Failed to fetch talents: ${response.statusText}`);
  }

  const data = await response.json();

  // Transform the API response to match the Talent interface
  const talents: Talent[] = data.talents.map((talent: any) => ({
    id: talent.id,
    name: talent.name,
    email: talent.email,
    profile_title: talent.profile_title || "Talent",
    profile_image: talent.profile_image || talent.avatar,
    hourly_rate: talent.hourly_rate,
    location: talent.location,
    skills: talent.skills || [],
    created_at: talent.created_at,
  }));

  return {
    message: data.message,
    talents,
    pagination: data.pagination,
  };
};
