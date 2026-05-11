import { useState, useCallback, useMemo } from "react";
import type { Job, Application, JobSection, JobFilter } from "../types";

const initialJobs: Job[] = [
  {
    id: 1,
    title: "Senior React Developer for E-commerce Platform",
    description:
      "Looking for an experienced React developer to build a modern SaaS dashboard with TypeScript and Tailwind CSS. The project involves creating a comprehensive e-commerce management system with real-time inventory tracking, payment processing, and customer analytics.",
    company: "TechCorp Ethiopia",
    category: "Web Development",
    experience: "Senior",
    budget: "$3,000 - $5,000",
    duration: "1-3 months",
    location: "Addis Ababa",
    remote: true,
    posted: "2 hours ago",
    applicants: 12,
    skills: ["React", "TypeScript", "Tailwind CSS", "Node.js", "MongoDB"],
    match: 95,
    status: "new",
    featured: true,
    companyLogo:
      "https://images.unsplash.com/photo-1560472354-b33ff0c44a43?w=100",
  },
  {
    id: 2,
    title: "UI/UX Designer for Mobile Banking App",
    description:
      "Need a talented UI/UX designer to create a modern mobile app design for our fintech startup. Great fit for your design skills! The app will serve thousands of Ethiopian users with secure banking features.",
    company: "StartupHub",
    category: "Design",
    experience: "Mid",
    budget: "$1,500 - $2,500",
    duration: "2-4 weeks",
    location: "Addis Ababa",
    remote: true,
    posted: "5 hours ago",
    applicants: 8,
    skills: [
      "Figma",
      "Adobe XD",
      "Mobile Design",
      "Prototyping",
      "User Research",
    ],
    match: 88,
    status: "new",
    urgent: true,
    companyLogo:
      "https://images.unsplash.com/photo-1611224923853-80b023f02d71?w=100",
  },
  {
    id: 3,
    title: "Full Stack Developer - Healthcare Platform",
    description:
      "Seeking a full stack developer for healthcare platform development with modern tech stack. Must have experience with HIPAA compliance and medical data security.",
    company: "Digital Agency",
    category: "Web Development",
    experience: "Senior",
    budget: "$2,500 - $4,000",
    duration: "2-3 weeks",
    location: "Addis Ababa",
    remote: false,
    posted: "1 hour ago",
    applicants: 15,
    skills: ["React", "Python", "Django", "PostgreSQL", "AWS"],
    match: 82,
    status: "new",
    companyLogo:
      "https://images.unsplash.com/photo-1496200186974-3a028e0a5998?w=100",
  },
  {
    id: 4,
    title: "Mobile App Developer - Fintech Application",
    description:
      "Looking for experienced mobile app developer for fintech application with React Native. Must have experience with payment gateways and security protocols.",
    company: "Innovation Lab",
    category: "Mobile Development",
    experience: "Mid",
    budget: "$3,000 - $5,000",
    duration: "1-2 months",
    location: "Bahir Dar",
    remote: true,
    posted: "3 hours ago",
    applicants: 6,
    skills: [
      "React Native",
      "Flutter",
      "iOS",
      "Android",
      "Payment Integration",
    ],
    match: 79,
    status: "saved",
    companyLogo:
      "https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=100",
  },
  {
    id: 5,
    title: "Content Writer - Ethiopian Business Blog",
    description:
      "Need experienced content writer for Ethiopian business blog. Must understand local market and be able to write engaging content about entrepreneurship and technology.",
    company: "Media House",
    category: "Writing",
    experience: "Mid",
    budget: "$500 - $800",
    duration: "Ongoing",
    location: "Addis Ababa",
    remote: true,
    posted: "1 day ago",
    applicants: 23,
    skills: ["Content Writing", "SEO", "Blog Writing", "Research", "Editing"],
    match: 75,
    status: "applied",
    companyLogo:
      "https://images.unsplash.com/photo-1504764828272-5019f4e9f9b5?w=100",
  },
];

const initialApplications: Application[] = [
  {
    id: 1,
    jobId: 5,
    jobTitle: "Content Writer - Ethiopian Business Blog",
    company: "Media House",
    applied: "2 days ago",
    status: "viewed",
    coverLetter:
      "Experienced content writer with deep understanding of Ethiopian business landscape...",
    proposedRate: "$25/hr",
  },
  {
    id: 2,
    jobId: 2,
    jobTitle: "UI/UX Designer for Mobile Banking App",
    company: "StartupHub",
    applied: "1 week ago",
    status: "shortlisted",
    coverLetter:
      "Passionate about creating intuitive mobile banking experiences...",
    proposedRate: "$35/hr",
  },
];

export function useJobs() {
  const [jobs, setJobs] = useState<Job[]>(initialJobs);
  const [applications, setApplications] = useState<Application[]>(initialApplications);
  const [searchQuery, setSearchQuery] = useState("");
  const [jobFilter, setJobFilter] = useState<JobFilter>("all");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [activeSection, setActiveSection] = useState<JobSection>("best-matches");

  const handleSaveJob = useCallback((jobId: number) => {
    setJobs((prevJobs) =>
      prevJobs.map((job) =>
        job.id === jobId
          ? { ...job, status: job.status === "saved" ? "new" : "saved" }
          : job,
      ),
    );
  }, []);

  const handleApplyToJob = useCallback((jobId: number) => {
    const job = jobs.find((j) => j.id === jobId);
    if (job) {
      const application: Application = {
        id: applications.length + 1,
        jobId: job.id,
        jobTitle: job.title,
        company: job.company,
        applied: "Just now",
        status: "pending",
        coverLetter: "",
        proposedRate: "",
      };
      setApplications((prev) => [...prev, application]);
      setJobs((prevJobs) =>
        prevJobs.map((j) =>
          j.id === jobId
            ? { ...j, status: "applied", applicants: j.applicants + 1 }
            : j,
        ),
      );
    }
  }, [jobs, applications.length]);

  const filteredJobs = useMemo(() => {
    return jobs.filter((job) => {
      let matchesFilter = true;

      if (jobFilter === "remote") matchesFilter = job.remote;
      else if (jobFilter === "onsite") matchesFilter = !job.remote;
      else if (jobFilter === "urgent") matchesFilter = job.urgent || false;

      if (categoryFilter !== "all")
        matchesFilter = matchesFilter && job.category === categoryFilter;

      if (searchQuery) {
        matchesFilter =
          matchesFilter &&
          (job.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
            job.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
            job.company.toLowerCase().includes(searchQuery.toLowerCase()) ||
            job.skills.some((skill) =>
              skill.toLowerCase().includes(searchQuery.toLowerCase()),
            ));
      }

      return matchesFilter;
    });
  }, [jobs, jobFilter, categoryFilter, searchQuery]);

  const getJobsBySection = useCallback(() => {
    switch (activeSection) {
      case "best-matches":
        return filteredJobs
          .filter((job) => job.status !== "applied")
          .sort((a, b) => b.match - a.match);
      case "most-recently":
        return filteredJobs
          .filter((job) => job.status !== "applied")
          .sort((a, b) => {
            const timeA = a.posted.includes("hour")
              ? parseInt(a.posted)
              : a.posted.includes("day")
                ? parseInt(a.posted) * 24
                : 999;
            const timeB = b.posted.includes("hour")
              ? parseInt(b.posted)
              : b.posted.includes("day")
                ? parseInt(b.posted) * 24
                : 999;
            return timeA - timeB;
          });
      case "saved-jobs":
        return filteredJobs.filter((job) => job.status === "saved");
      case "applications":
        return filteredJobs.filter((job) => job.status === "applied");
      default:
        return filteredJobs;
    }
  }, [filteredJobs, activeSection]);

  return {
    jobs,
    applications,
    searchQuery,
    setSearchQuery,
    jobFilter,
    setJobFilter,
    categoryFilter,
    setCategoryFilter,
    activeSection,
    setActiveSection,
    handleSaveJob,
    handleApplyToJob,
    getJobsBySection,
  };
}
