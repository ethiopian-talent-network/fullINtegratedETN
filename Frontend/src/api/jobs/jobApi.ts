import type { Job } from "../../features/talents/types";
import { API_BASE_URL, validateApiConfig } from "../../config/api";

// Helper function to get auth headers
const getAuthHeaders = (): Record<string, string> => {
  const token = localStorage.getItem("token");
  return token ? { Authorization: `Bearer ${token}` } : {};
};

// Validate API configuration before making requests
const checkApiConfig = () => {
  const validation = validateApiConfig();
  if (!validation.valid) {
    console.error("API Configuration Error:", validation.error);
    throw new Error(`API Configuration Error: ${validation.error}`);
  }
  return true;
};

export interface JobFilters {
  page?: number;
  limit?: number;
  category?: string;
  experience?: string;
  location?: string;
  remote?: boolean;
  search?: string;
  sortBy?: "posted" | "title" | "salary" | "budget";
  sortOrder?: "ASC" | "DESC";
}

export interface JobResponse {
  jobs: Job[];
  pagination: {
    current: number;
    pageSize: number;
    total: number;
    pages: number;
  };
}

// Get all jobs with filtering and pagination
export const getAllJobs = async (filters: any = {}): Promise<JobResponse> => {
  try {
    // Validate API configuration before making request
    checkApiConfig();

    const params = new URLSearchParams();

    // Add filters to query params
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== "") {
        params.append(key, value.toString());
      }
    });

    const response = await fetch(`${API_BASE_URL}/api/jobs?${params}`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        // Add authentication header if needed
        // 'Authorization': `Bearer ${token}`
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error("Error fetching jobs:", error);
    throw error;
  }
};

// Get job by ID
export const getJobById = async (id: number): Promise<Job> => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/jobs/${id}`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        // 'Authorization': `Bearer ${token}`
      },
    });

    if (!response.ok) {
      if (response.status === 404) {
        throw new Error("Job not found");
      }
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return normalizeJob(data);
  } catch (error) {
    console.error("Error fetching job:", error);
    throw error;
  }
};

// Get jobs by category
export const getJobsByCategory = async (
  categoryId: string,
  filters: JobFilters = {},
): Promise<JobResponse> => {
  try {
    const params = new URLSearchParams();

    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== "") {
        params.append(key, value.toString());
      }
    });

    const response = await fetch(
      `${API_BASE_URL}/api/jobs/category/${categoryId}?${params}`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          // 'Authorization': `Bearer ${token}`
        },
      },
    );

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error("Error fetching jobs by category:", error);
    throw error;
  }
};

// Normalize a raw API job object to match the Job type
const normalizeJob = (job: any): Job => ({
  ...job,
  skills: Array.isArray(job.skills) ? job.skills.filter(Boolean) : [],
  applicants: parseInt(job.applicants) || 0,
  company: job.company || job.company_name || "Unknown Company",
  category: job.category || job.category_name || "",
  budget: job.budget || (job.budget_type === "fixed" ? `$${job.salary}` : `$${job.salary}/hour`),
  duration: job.duration || "Project-based",
  location: job.location || job.companyLocation || "Remote",
  remote: job.remote ?? true,
  posted: job.posted || job.created_at || "",
  match: job.match || Math.floor(Math.random() * 30) + 70,
  status: job.status === "active" ? "new" : (job.status || "new"),
  verified: job.verified || job.employerVerified || false, // Preserve verified status
});

// Fetch skills for a single job by id
const fetchJobSkills = async (jobId: number): Promise<string[]> => {
  try {
    const res = await fetch(`${API_BASE_URL}/api/jobs/${jobId}`, {
      headers: { "Content-Type": "application/json", ...getAuthHeaders() },
    });
    if (!res.ok) return [];
    const data = await res.json();
    return Array.isArray(data.skills) ? data.skills : [];
  } catch {
    return [];
  }
};

// Enrich jobs that have empty skills by fetching individual job details
const enrichJobsWithSkills = async (jobs: Job[]): Promise<Job[]> => {
  return Promise.all(
    jobs.map(async (job) => {
      if (!job.skills || job.skills.length === 0) {
        const skills = await fetchJobSkills(job.id);
        return { ...job, skills };
      }
      return job;
    })
  );
};

// Get recent jobs
export const getRecentJobs = async (limit: number = 20): Promise<Job[]> => {
  try {
    const response = await fetch(
      `${API_BASE_URL}/api/jobs/recent?limit=${limit}`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          ...getAuthHeaders(),
        },
      },
    );

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    const jobs = Array.isArray(data) ? data.map(normalizeJob) : [];
    return enrichJobsWithSkills(jobs);
  } catch (error) {
    console.error("Error fetching recent jobs:", error);
    throw error;
  }
};

// Get saved jobs for authenticated user
export const getSavedJobs = async (): Promise<Job[]> => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/jobs/saved/my`, {
      method: "GET",
      headers: { "Content-Type": "application/json", ...getAuthHeaders() },
    });
    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
    const data = await response.json();
    const jobs = Array.isArray(data) ? data.map(normalizeJob) : [];
    return enrichJobsWithSkills(jobs);
  } catch (error) {
    console.error("Error fetching saved jobs:", error);
    throw error;
  }
};

// Get applied jobs for authenticated user
export const getAppliedJobs = async (): Promise<Job[]> => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/jobs/applied/my`, {
      method: "GET",
      headers: { "Content-Type": "application/json", ...getAuthHeaders() },
    });
    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
    const data = await response.json();
    const jobs = Array.isArray(data) ? data.map(normalizeJob) : [];
    return enrichJobsWithSkills(jobs);
  } catch (error) {
    console.error("Error fetching applied jobs:", error);
    throw error;
  }
};

// Save a job
export const saveJob = async (jobId: number): Promise<void> => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/jobs/${jobId}/save`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...getAuthHeaders(),
      },
    });

    if (!response.ok) {
      if (response.status === 400) {
        const error = await response.json();
        throw new Error(error.message || "Job already saved");
      }
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    // Success, no response body expected
  } catch (error) {
    console.error("Error saving job:", error);
    throw error;
  }
};

// Unsave a job
export const unsaveJob = async (jobId: number): Promise<void> => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/jobs/${jobId}/save`, {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
        ...getAuthHeaders(),
      },
    });

    if (!response.ok) {
      if (response.status === 404) {
        throw new Error("Saved job not found");
      }
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    // Success, no response body expected
  } catch (error) {
    console.error("Error unsaving job:", error);
    throw error;
  }
};

// Get jobs by section (for dashboard)
export const getJobsBySection = async (section: string): Promise<Job[]> => {
  try {
    switch (section) {
      case "best-matches":
        // For now, return recent jobs. In a real app, this would use AI matching
        return await getRecentJobs(20);

      case "most-recently":
        return await getRecentJobs(20);

      case "saved-jobs":
        return await getSavedJobs();

      case "applications":
        return await getAppliedJobs();

      default:
        return await getRecentJobs(20);
    }
  } catch (error) {
    console.error("Error fetching jobs by section:", error);
    throw error;
  }
};

// Get job recommendations (mock implementation)
export const getJobRecommendations = async (): Promise<Job[]> => {
  try {
    // For now, return recent jobs
    // In a real implementation, this would use AI matching
    return await getRecentJobs(20);
  } catch (error) {
    console.error("Error fetching job recommendations:", error);
    throw error;
  }
};

// Apply to a job (using existing endpoint)
export const applyToJob = async (
  jobId: number,
  coverLetter: string,
): Promise<void> => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/talents/apply`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...getAuthHeaders(),
      },
      body: JSON.stringify({
        job_id: jobId,
        cover_letter: coverLetter,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || "Failed to apply to job");
    }

    // Success
  } catch (error) {
    console.error("Error applying to job:", error);
    throw error;
  }
};

// Get job application details (includes token cost and user balance)
export const getJobApplicationDetails = async (jobId: number) => {
  try {
    const response = await fetch(
      `${API_BASE_URL}/api/applications/job/${jobId}/details`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          ...getAuthHeaders(),
        },
      },
    );

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error("Error fetching job application details:", error);
    throw error;
  }
};

// Submit job application with proposal
export const submitApplication = async (
  jobId: number,
  applicationData: {
    cover_letter: string;
    proposal?: string;
    estimated_timeline?: string;
    budget_proposal?: string;
  },
) => {
  try {
    const response = await fetch(
      `${API_BASE_URL}/api/applications/job/${jobId}/submit`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...getAuthHeaders(),
        },
        body: JSON.stringify(applicationData),
      },
    );

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || "Failed to submit application");
    }

    return await response.json();
  } catch (error) {
    console.error("Error submitting application:", error);
    throw error;
  }
};

// Get user's applications
export const getUserApplications = async (
  params: {
    page?: number;
    limit?: number;
    status?: string;
  } = {},
) => {
  try {
    const queryParams = new URLSearchParams();
    if (params.page) queryParams.append("page", params.page.toString());
    if (params.limit) queryParams.append("limit", params.limit.toString());
    if (params.status) queryParams.append("status", params.status);

    const response = await fetch(
      `${API_BASE_URL}/api/applications/my?${queryParams}`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          ...getAuthHeaders(),
        },
      },
    );

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error("Error fetching user applications:", error);
    throw error;
  }
};

// Get application details
export const getApplicationDetails = async (applicationId: number) => {
  try {
    const response = await fetch(
      `${API_BASE_URL}/api/applications/${applicationId}`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          ...getAuthHeaders(),
        },
      },
    );

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error("Error fetching application details:", error);
    throw error;
  }
};

// Update application (withdraw or edit proposal)
export const updateApplication = async (
  applicationId: number,
  updateData: {
    cover_letter?: string;
    proposal?: string;
    estimated_timeline?: string;
    budget_proposal?: string;
    action?: "withdraw" | "update";
  },
) => {
  try {
    const response = await fetch(
      `${API_BASE_URL}/api/applications/${applicationId}`,
      {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          ...getAuthHeaders(),
        },
        body: JSON.stringify(updateData),
      },
    );

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || "Failed to update application");
    }

    return await response.json();
  } catch (error) {
    console.error("Error updating application:", error);
    throw error;
  }
};
