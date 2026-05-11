import { Search, Filter } from "lucide-react";
import { Input } from "../../../components/ui/input";
import { Button } from "../../../components/ui/button";
import type { JobSection, JobFilter } from "../types";

interface JobFiltersProps {
  darkMode: boolean;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  activeSection: JobSection;
  setActiveSection: (section: JobSection) => void;
  jobFilter: JobFilter;
  setJobFilter: (filter: JobFilter) => void;
  categoryFilter: string;
  setCategoryFilter: (category: string) => void;
}

export function JobFilters({
  darkMode,
  searchQuery,
  setSearchQuery,
  activeSection,
  setActiveSection,
  jobFilter,
  setJobFilter,
  categoryFilter,
  setCategoryFilter,
}: JobFiltersProps) {
  return (
    <div className="p-4 sm:p-6">
      <div>
        {/* Navigation Links */}
        <div className="mb-4 sm:mb-6">
          <div className="flex flex-wrap gap-2 sm:gap-4 mb-3 sm:mb-4">
            <button
              onClick={() => setActiveSection("best-matches")}
              className={`text-xs sm:text-sm font-medium transition-colors duration-200 whitespace-nowrap px-2 py-1 rounded-lg ${
                activeSection === "best-matches"
                  ? "bg-[#0084ca] text-white"
                  : darkMode
                  ? "text-gray-300 hover:text-[#0084ca] hover:bg-gray-700"
                  : "text-gray-600 hover:text-[#0084ca] hover:bg-slate-200"
              }`}
            >
              Best Matches
            </button>
            <button
              onClick={() => setActiveSection("most-recently")}
              className={`text-xs sm:text-sm font-medium transition-colors duration-200 whitespace-nowrap px-2 py-1 rounded-lg ${
                activeSection === "most-recently"
                  ? "bg-[#0084ca] text-white"
                  : darkMode
                  ? "text-gray-300 hover:text-[#0084ca] hover:bg-gray-700"
                  : "text-gray-600 hover:text-[#0084ca] hover:bg-slate-200"
              }`}
            >
              Most Recent
            </button>
            <button
              onClick={() => setActiveSection("saved-jobs")}
              className={`text-xs sm:text-sm font-medium transition-colors duration-200 whitespace-nowrap px-2 py-1 rounded-lg ${
                activeSection === "saved-jobs"
                  ? "bg-[#0084ca] text-white"
                  : darkMode
                  ? "text-gray-300 hover:text-[#0084ca] hover:bg-gray-700"
                  : "text-gray-600 hover:text-[#0084ca] hover:bg-slate-200"
              }`}
            >
              Saved Jobs
            </button>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="mb-4 sm:mb-6">
          <div className="flex flex-col gap-3 mb-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 sm:w-5 sm:h-5 text-gray-400" />
              <Input
                type="text"
                placeholder="Search jobs by title, company, or skills..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 text-sm"
              />
            </div>
            <Button
              variant="outline"
              className="flex items-center justify-center gap-2 w-full"
            >
              <Filter className="w-4 h-4" />
              Filters
            </Button>
          </div>

          {/* Filter Pills */}
          <div className="space-y-3">
            <div className="flex flex-wrap items-center gap-2">
              <span className={`text-xs sm:text-sm ${darkMode ? "text-gray-300" : "text-gray-600"}`}>Type:</span>
              <div className="flex flex-wrap gap-1">
                {["all", "remote", "onsite", "urgent"].map((filter) => (
                  <button
                    key={filter}
                    onClick={() => setJobFilter(filter as JobFilter)}
                    className={`px-2 py-1 text-xs rounded-full transition-colors ${
                      jobFilter === filter
                        ? "bg-[#0084ca] text-white"
                        : darkMode
                          ? "bg-gray-700 text-gray-300 hover:bg-gray-600"
                          : "bg-slate-200 text-gray-700 hover:bg-slate-300"
                    }`}
                  >
                    {filter.charAt(0).toUpperCase() + filter.slice(1)}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <span className={`text-xs sm:text-sm ${darkMode ? "text-gray-300" : "text-gray-600"}`}>
                Category:
              </span>
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className={`text-xs px-2 py-1 rounded-full border ${
                  darkMode
                    ? "bg-gray-700 text-gray-300 border-gray-600"
                    : "bg-white text-gray-700 border-slate-300"
                }`}
              >
                <option value="all">All Categories</option>
                <option value="Web Development">Web Development</option>
                <option value="Mobile Development">Mobile Development</option>
                <option value="Design">Design</option>
                <option value="Writing">Writing</option>
              </select>
            </div>
          </div>
        </div>

        {/* Section Headers */}
        <div className="mb-4">
          <h3 className={`text-lg font-semibold ${darkMode ? "text-white" : "text-gray-900"}`}>
            {activeSection === "best-matches" && "Best Matches for You"}
            {activeSection === "most-recently" && "Most Recently Posted"}
            {activeSection === "saved-jobs" && "Saved Jobs"}
            {activeSection === "applications" && "Your Applications"}
          </h3>
          <p className={`text-sm ${darkMode ? "text-gray-400" : "text-gray-600"}`}>
            {activeSection === "best-matches" &&
              "Jobs that match your skills and experience"}
            {activeSection === "most-recently" &&
              "Latest job postings from top companies"}
            {activeSection === "saved-jobs" && "Jobs you've saved for later"}
            {activeSection === "applications" &&
              "Track your job application status"}
          </p>
        </div>
      </div>
    </div>
  );
}
