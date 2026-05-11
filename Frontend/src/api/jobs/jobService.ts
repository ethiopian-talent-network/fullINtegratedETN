import {
  getAllJobs,
  getJobById,
  getJobsByCategory,
  getRecentJobs,
  getSavedJobs,
  getAppliedJobs,
  saveJob as saveJobApi,
  unsaveJob as unsaveJobApi,
  applyToJob,
  getJobsBySection,
  type JobFilters,
  type JobResponse,
} from "./jobApi";
import type { Job, JobSection } from "../../features/talents/types";

export class JobService {
  // Cache for job data
  private jobsCache: Map<string, Job[]> = new Map();
  private jobDetailCache: Map<number, Job> = new Map();
  private cacheExpiry: Map<string, number> = new Map();
  private CACHE_DURATION = 0; // Always fetch fresh — skills and applicants must be live
  private inflightRequests: Map<string, Promise<Job[]>> = new Map();

  // Check if cache is valid (fresh)
  private isCacheValid(key: string): boolean {
    const expiry = this.cacheExpiry.get(key);
    return expiry ? Date.now() < expiry : false;
  }

  // Check if stale cache exists (usable while revalidating)
  private hasStaleCache(key: string): boolean {
    return this.jobsCache.has(key);
  }

  // Set cache with expiry
  private setCache<T>(key: string, data: T): void {
    this.jobsCache.set(key, data as Job[]);
    this.cacheExpiry.set(key, Date.now() + this.CACHE_DURATION);
  }

  // Get jobs by section with caching + stale-while-revalidate + request deduplication
  async getJobsBySection(section: JobSection): Promise<Job[]> {
    const cacheKey = `${section}`;

    // Return fresh cache immediately
    if (this.isCacheValid(cacheKey)) {
      return this.jobsCache.get(cacheKey) || [];
    }

    // Deduplicate inflight requests for the same key
    if (this.inflightRequests.has(cacheKey)) {
      return this.inflightRequests.get(cacheKey)!;
    }

    const fetchPromise = getJobsBySection(section)
      .then((jobs) => {
        this.setCache(cacheKey, jobs);
        this.inflightRequests.delete(cacheKey);
        return jobs;
      })
      .catch((error) => {
        this.inflightRequests.delete(cacheKey);
        // Return stale cache on error rather than throwing
        const stale = this.jobsCache.get(cacheKey);
        if (stale) return stale;
        throw error;
      });

    this.inflightRequests.set(cacheKey, fetchPromise);

    // Stale-while-revalidate: return stale data immediately, update in background
    if (this.hasStaleCache(cacheKey)) {
      fetchPromise.catch(() => {}); // background update, ignore errors
      return this.jobsCache.get(cacheKey)!;
    }

    return fetchPromise;
  }

  // Get all jobs with filtering
  async getAllJobs(filters: JobFilters = {}): Promise<JobResponse> {
    try {
      const response = await getAllJobs(filters);

      // Update cache for recent jobs
      if (!filters.page || filters.page === 1) {
        this.setCache("recent", response.jobs);
      }

      return response;
    } catch (error) {
      console.error("Error fetching all jobs:", error);
      throw error;
    }
  }

  // Get job by ID with caching
  async getJobById(id: number): Promise<Job> {
    if (this.jobDetailCache.has(id)) {
      return this.jobDetailCache.get(id)!;
    }

    try {
      const job = await getJobById(id);
      this.jobDetailCache.set(id, job);
      return job;
    } catch (error) {
      console.error("Error fetching job by ID:", error);
      throw error;
    }
  }

  // Get jobs by category
  async getJobsByCategory(
    categoryId: string,
    filters: JobFilters = {},
  ): Promise<JobResponse> {
    try {
      return await getJobsByCategory(categoryId, filters);
    } catch (error) {
      console.error("Error fetching jobs by category:", error);
      throw error;
    }
  }

  // Get recent jobs
  async getRecentJobs(limit: number = 10): Promise<Job[]> {
    const cacheKey = `recent-${limit}`;

    if (this.isCacheValid(cacheKey)) {
      return this.jobsCache.get(cacheKey) || [];
    }

    try {
      const jobs = await getRecentJobs(limit);
      this.setCache(cacheKey, jobs);
      return jobs;
    } catch (error) {
      console.error("Error fetching recent jobs:", error);
      // Return cached data if available
      const cachedJobs = this.jobsCache.get(cacheKey);
      if (cachedJobs) {
        console.warn("Using expired cache for recent jobs");
        return cachedJobs;
      }
      throw error;
    }
  }

  // Get saved jobs
  async getSavedJobs(): Promise<Job[]> {
    try {
      const jobs = await getSavedJobs();
      this.setCache("saved", jobs);
      return jobs;
    } catch (error) {
      console.error("Error fetching saved jobs:", error);
      throw error;
    }
  }

  // Get applied jobs
  async getAppliedJobs(): Promise<Job[]> {
    try {
      const jobs = await getAppliedJobs();
      this.setCache("applied", jobs);
      return jobs;
    } catch (error) {
      console.error("Error fetching applied jobs:", error);
      throw error;
    }
  }

  // Save a job
  async saveJob(jobId: number): Promise<void> {
    try {
      await saveJobApi(jobId);

      // Update cached job status
      this.updateJobStatus(jobId, "saved");

      // Clear relevant caches
      this.clearCache(["saved", "recent"]);
    } catch (error) {
      console.error("Error saving job:", error);
      throw error;
    }
  }

  // Unsave a job
  async unsaveJob(jobId: number): Promise<void> {
    try {
      await unsaveJobApi(jobId);

      // Update cached job status
      this.updateJobStatus(jobId, "new");

      // Clear relevant caches
      this.clearCache(["saved", "recent"]);
    } catch (error) {
      console.error("Error unsaving job:", error);
      throw error;
    }
  }

  // Apply to a job
  async applyToJob(jobId: number, coverLetter: string): Promise<void> {
    try {
      await applyToJob(jobId, coverLetter);

      // Update cached job status
      this.updateJobStatus(jobId, "applied");

      // Clear relevant caches
      this.clearCache(["applied", "recent", "saved"]);
    } catch (error) {
      console.error("Error applying to job:", error);
      throw error;
    }
  }

  // Update job status in cache
  private updateJobStatus(jobId: number, status: Job["status"]): void {
    // Update in detail cache
    if (this.jobDetailCache.has(jobId)) {
      const job = this.jobDetailCache.get(jobId)!;
      job.status = status;
      this.jobDetailCache.set(jobId, job);
    }

    // Update in list caches
    this.jobsCache.forEach((jobs) => {
      const jobIndex = jobs.findIndex((job) => job.id === jobId);
      if (jobIndex !== -1) {
        jobs[jobIndex].status = status;
      }
    });
  }

  // Clear specific caches
  private clearCache(keys: string[]): void {
    keys.forEach((key) => {
      this.jobsCache.delete(key);
      this.cacheExpiry.delete(key);
    });
  }

  // Clear all caches
  clearAllCaches(): void {
    this.jobsCache.clear();
    this.jobDetailCache.clear();
    this.cacheExpiry.clear();
  }

  // Search jobs
  async searchJobs(
    query: string,
    filters: JobFilters = {},
  ): Promise<JobResponse> {
    try {
      return await getAllJobs({ ...filters, search: query });
    } catch (error) {
      console.error("Error searching jobs:", error);
      throw error;
    }
  }

  // Get job recommendations (mock implementation)
  async getJobRecommendations(): Promise<Job[]> {
    try {
      // For now, return recent jobs
      // In a real implementation, this would use AI matching
      return await this.getRecentJobs(20);
    } catch (error) {
      console.error("Error fetching job recommendations:", error);
      throw error;
    }
  }

  // Get job statistics
  async getJobStatistics(): Promise<{
    totalJobs: number;
    recentJobs: number;
    savedJobs: number;
    appliedJobs: number;
  }> {
    try {
      const [recent, saved, applied] = await Promise.all([
        this.getRecentJobs(100),
        this.getSavedJobs().catch(() => []),
        this.getAppliedJobs().catch(() => []),
      ]);

      return {
        totalJobs: recent.length,
        recentJobs: recent.length,
        savedJobs: saved.length,
        appliedJobs: applied.length,
      };
    } catch (error) {
      console.error("Error fetching job statistics:", error);
      return {
        totalJobs: 0,
        recentJobs: 0,
        savedJobs: 0,
        appliedJobs: 0,
      };
    }
  }
}

// Export singleton instance
export const jobService = new JobService();
