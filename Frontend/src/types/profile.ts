export interface Language {
  name: string;
  level: "Native" | "Fluent" | "Basic";
}

export interface Education {
  id: number;
  degree: string;
  school: string;
  year: string;
  certificate?: string;
  transcript?: string;
}

export interface Certification {
  id: number;
  name: string;
  issuer: string;
  year: string;
  certificate?: string;
}

export interface Portfolio {
  id: number;
  title: string;
  description: string;
  image: string;
  url: string;
  role?: string;
  techStack?: string;
}

export interface ProfileData {
  name: string;
  title: string;
  location: string;
  hourlyRate: string;
  bio: string;
  image?: string;
  profile_image?: string;
  skills: string[];
  languages: Language[];
  education: Education[];
  certifications: Certification[];
  portfolio: Portfolio[];
  about?: string;
  educationText?: string;
  experience?: string;
  languagesText?: string;
  linkedin?: string;
  github?: string;
  resume_url?: string;
}

export type ProfileSection = "overview" | "skills" | "portfolio" | "education";

export interface ProfileStats {
  completedProjects: number;
  totalEarnings: string;
  successRate: string;
  responseTime: string;
}
