import { useState, useEffect } from "react";
import { useDarkMode } from "../../contexts/DarkModeContext";
import { Header } from "./components/Header";
import { ProfileCard } from "./components/ProfileCard";
import { TokenCard } from "./components/TokenCard";
import { JobFilters } from "./components/JobFilters";
import { JobList } from "./components/JobList";
import { JobModal } from "./components/JobModal";
import { profileService } from "../../api/profile/profileService";
import { Footer } from "./components/Footer";
import type { Job, JobSection, JobFilter } from "./types";

export default function FreelancerDashboard() {
  const { darkMode, toggleDarkMode } = useDarkMode();
  const [userImage, setUserImage] = useState<string | undefined>(
    profileService.getCachedProfile()?.profile_image ||
    profileService.getCachedProfile()?.image
  );
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);
  const [showJobDetails, setShowJobDetails] = useState(false);

  // Sync profile image from cache when profile loads
  useEffect(() => {
    const cached = profileService.getCachedProfile();
    if (cached?.profile_image || cached?.image) {
      setUserImage(cached.profile_image || cached.image);
    }
  }, []);

  const [searchQuery, setSearchQuery] = useState("");
  const [jobFilter, setJobFilter] = useState<JobFilter>("all");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [activeSection, setActiveSection] =
    useState<JobSection>("most-recently");

  const handleImageUpload = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const result = e.target?.result as string;
      setUserImage(result);
      console.log("Uploading image:", file);
    };
    reader.readAsDataURL(file);
  };

  const handleViewDetails = (job: Job) => {
    setSelectedJob(job);
    setShowJobDetails(true);
  };

  const handleApplyToJob = async (jobId: number, coverLetter: string) => {
    try {
      // This would typically open a modal or form for the cover letter
      // For now, we'll just log it
      console.log("Applying to job:", jobId, "with cover letter:", coverLetter);
    } catch (error) {
      console.error("Failed to apply to job:", error);
    }
  };

  const handleSaveJob = async (jobId: number) => {
    try {
      console.log("Saving job:", jobId);
      // This will be handled by the JobList component internally
    } catch (error) {
      console.error("Failed to save job:", error);
    }
  };

  return (
    <div
      className={`min-h-screen flex flex-col transition-colors duration-300 ${
        darkMode ? "bg-gray-900" : "bg-slate-100"
      }`}
    >
      <Header
        darkMode={darkMode}
        toggleDarkMode={toggleDarkMode}
        userImage={userImage}
        onImageUpload={handleImageUpload}
      />

      <div className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 lg:gap-8">
          <div className="lg:col-span-1 space-y-6">
            <ProfileCard darkMode={darkMode} />
            <TokenCard />
          </div>

          <div className="lg:col-span-3 space-y-6">
            {/* Journey Section */}
            <div className="bg-white dark:bg-gray-800 rounded-xl border border-slate-200 dark:border-gray-700 shadow-sm p-4 sm:p-6">
              <h2
                className={`text-lg sm:text-xl font-bold mb-4 sm:mb-6 transition-colors duration-300 ${
                  darkMode ? "text-white" : "text-gray-900"
                }`}
              >
                Your Journey to Success
              </h2>
              <JourneySteps darkMode={darkMode} />
            </div>

            {/* Jobs Section */}
            <div
              className={`rounded-xl shadow-lg overflow-hidden transition-colors duration-300 ${
                darkMode
                  ? "bg-gray-800 border-gray-700"
                  : "bg-white border-slate-200"
              }`}
            >
              <JobFilters
                darkMode={darkMode}
                searchQuery={searchQuery}
                setSearchQuery={setSearchQuery}
                activeSection={activeSection}
                setActiveSection={setActiveSection}
                jobFilter={jobFilter}
                setJobFilter={setJobFilter}
                categoryFilter={categoryFilter}
                setCategoryFilter={setCategoryFilter}
              />

              <div className="px-4 sm:px-6 pb-4 sm:pb-6">
                <JobList
                  darkMode={darkMode}
                  activeSection={activeSection}
                  onViewDetails={handleViewDetails}
                />
              </div>

              {/* Job Details Modal */}
              {showJobDetails && selectedJob && (
                <JobModal
                  job={selectedJob}
                  darkMode={darkMode}
                  onClose={() => setShowJobDetails(false)}
                  onSave={handleSaveJob}
                  onApply={(job) => {
                    handleApplyToJob(
                      job.id,
                      "I am interested in this position and would like to apply.",
                    );
                    setShowJobDetails(false);
                  }}
                />
              )}
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
}

function JourneySteps({ darkMode }: { darkMode: boolean }) {
  const steps = [
    { number: 1, title: "Complete Profile", description: "Build your profile" },
    { number: 2, title: "Browse Jobs", description: "Find opportunities" },
    { number: 3, title: "Get Hired", description: "Apply & win projects" },
    { number: 4, title: "Grow Career", description: "Build reputation" },
  ];

  return (
    <div className="flex items-center justify-center gap-2 sm:gap-4 md:gap-6 flex-wrap">
      {steps.map((step, index) => (
        <div key={step.number} className="contents">
          <div className="flex flex-col items-center text-center group min-w-0 flex-1 max-w-[100px]">
            <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-[#0084ca] to-[#006ba6] text-white rounded-full flex items-center justify-center font-bold text-sm sm:text-base mb-2 shadow-lg group-hover:shadow-xl transition-all duration-300 group-hover:scale-110">
              {step.number}
            </div>
            <h3
              className={`text-xs sm:text-sm font-semibold mb-1 transition-colors duration-300 ${
                darkMode ? "text-white" : "text-gray-900"
              }`}
            >
              {step.title}
            </h3>
            <p
              className={`text-xs transition-colors duration-300 text-center ${
                darkMode ? "text-gray-400" : "text-gray-600"
              }`}
            >
              {step.description}
            </p>
          </div>

          {index < steps.length - 1 && (
            <div
              className={`text-lg sm:text-xl self-center animate-pulse transition-colors duration-300 ${
                darkMode ? "text-gray-600" : "text-gray-400"
              }`}
            >
              →
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
