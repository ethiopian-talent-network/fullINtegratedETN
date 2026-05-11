export interface Job {
  id: number;
  title: string;
  description: string;
  company: string;
  category: string;
  experience: string;
  budget: string;
  duration: string;
  location: string;
  remote: boolean;
  posted: string;
  applicants: number;
  skills: string[];
  match: number;
  status: "new" | "applied" | "saved" | "interviewing";
  companyLogo?: string;
  featured?: boolean;
  urgent?: boolean;
  employer_verified?: boolean;
  verified?: boolean; // New field for employer verification
}

export interface Application {
  id: number;
  jobId: number;
  jobTitle: string;
  company: string;
  applied: string;
  status:
    | "pending"
    | "viewed"
    | "shortlisted"
    | "rejected"
    | "interviewing"
    | "hired";
  coverLetter: string;
  proposedRate: string;
}

export type JobSection = "best-matches" | "most-recently" | "saved-jobs" | "applications";
export type JobFilter = "all" | "remote" | "onsite" | "urgent";
