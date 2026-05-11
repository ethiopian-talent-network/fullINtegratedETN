import { useState, useMemo } from "react";
import { X, Plus, Search } from "lucide-react";

const MAX_SKILLS = 15;

// Comprehensive skill categories for better organization
const SKILL_CATEGORIES = {
  "Web Development": [
    "React",
    "Angular",
    "Vue.js",
    "Node.js",
    "PHP",
    "WordPress",
    "Shopify",
    "Laravel",
    "Django",
    "Ruby on Rails",
    "ASP.NET",
    "JavaScript",
    "TypeScript",
    "HTML",
    "CSS",
    "Next.js",
  ],
  "Mobile Development": [
    "iOS Development",
    "Android Development",
    "React Native",
    "Flutter",
    "Swift",
    "Kotlin",
    "Java",
    "Xamarin",
    "Ionic",
  ],
  "Design & Creative": [
    "UI/UX Design",
    "Graphic Design",
    "Logo Design",
    "Brand Identity",
    "Illustration",
    "Animation",
    "Video Editing",
    "3D Modeling",
    "Photoshop",
    "Figma",
    "Sketch",
    "Adobe XD",
    "InDesign",
  ],
  Writing: [
    "Content Writing",
    "Copywriting",
    "Technical Writing",
    "Blog Writing",
    "Article Writing",
    "SEO Writing",
    "Creative Writing",
    "Grant Writing",
    "Resume Writing",
    "Translation",
  ],
  "Data Science & Analytics": [
    "Data Analysis",
    "Machine Learning",
    "Python",
    "R Programming",
    "SQL",
    "Tableau",
    "Power BI",
    "Excel",
    "Statistics",
    "Data Visualization",
    "Deep Learning",
  ],
  "Digital Marketing": [
    "SEO",
    "SEM",
    "Social Media Marketing",
    "Content Marketing",
    "Email Marketing",
    "Google Analytics",
    "Facebook Ads",
    "Instagram Marketing",
    "LinkedIn Marketing",
  ],
  "Admin & Customer Support": [
    "Virtual Assistant",
    "Customer Service",
    "Data Entry",
    "Email Support",
    "Chat Support",
    "Phone Support",
    "Scheduling",
    "Research",
    "Transcription",
  ],
  "Sales & Business": [
    "Sales",
    "Lead Generation",
    "Business Development",
    "Market Research",
    "Account Management",
    "CRM",
    "Salesforce",
    "Negotiation",
    "Public Relations",
  ],
  "Finance & Accounting": [
    "Bookkeeping",
    "Accounting",
    "Financial Analysis",
    "Tax Preparation",
    "Payroll",
    "QuickBooks",
    "Xero",
    "Financial Modeling",
    "Budget Management",
  ],
  "IT & Networking": [
    "Technical Support",
    "Network Administration",
    "Cybersecurity",
    "Cloud Computing",
    "AWS",
    "Azure",
    "Google Cloud",
    "DevOps",
    "Linux",
    "Windows Server",
  ],
};

interface SkillsSectionProps {
  skills: string[];
  isEditing: boolean;
  onAddSpecificSkill: (skill: string) => void;
  onRemoveSkill: (skill: string) => void;
  darkMode?: boolean;
}

export function SkillsSection({
  skills,
  isEditing,
  onAddSpecificSkill,
  onRemoveSkill,
  darkMode = false,
}: SkillsSectionProps) {
  const [search, setSearch] = useState("");

  // Flatten all skills
  const ALL_SKILLS = useMemo(() => {
    return Object.values(SKILL_CATEGORIES).flat();
  }, []);

  // Filtered skills (search)
  const filteredSkills = useMemo(() => {
    return ALL_SKILLS.filter((skill) =>
      skill.toLowerCase().includes(search.toLowerCase()),
    );
  }, [search]);

  const isSelected = (skill: string) => skills.includes(skill);

  const handleSelect = (skill: string) => {
    if (isSelected(skill)) {
      onRemoveSkill(skill);
    } else {
      if (skills.length >= MAX_SKILLS) return;
      onAddSpecificSkill(skill);
    }
  };

  if (!isEditing) {
    return (
      <div>
        <h3 className="font-semibold mb-3 sm:mb-4 text-base sm:text-lg">
          Skills
        </h3>
        {skills.length === 0 ? (
          <p className="text-gray-500 text-sm">No skills added yet</p>
        ) : (
          <div className="flex flex-wrap gap-1.5 sm:gap-2">
            {skills.map((skill) => (
              <span
                key={skill}
                className="px-2.5 sm:px-3 py-1 bg-[#0084ca] text-white rounded-full text-xs sm:text-sm"
              >
                {skill}
              </span>
            ))}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      <div>
        <h3 className="font-semibold text-base sm:text-lg mb-2">
          Skills & Expertise
        </h3>
        <p className="text-xs sm:text-sm text-gray-500">
          Select up to {MAX_SKILLS} skills that best represent your expertise
        </p>
      </div>

      {/* Selected Skills */}
      {skills.length > 0 && (
        <div className="p-3 sm:p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
          <div className="flex items-center justify-between mb-2 sm:mb-3">
            <h4 className="font-medium text-xs sm:text-sm">
              Selected Skills ({skills.length}/{MAX_SKILLS})
            </h4>
          </div>
          <div className="flex flex-wrap gap-1.5 sm:gap-2">
            {skills.map((skill) => (
              <div
                key={skill}
                className="flex items-center gap-1.5 sm:gap-2 px-2 sm:px-3 py-1 bg-[#0084ca] text-white rounded-full text-xs sm:text-sm group"
              >
                <span className="truncate max-w-24 sm:max-w-none">{skill}</span>
                <button
                  onClick={() => onRemoveSkill(skill)}
                  className="hover:bg-white/20 rounded-full p-0.5 transition-colors flex-shrink-0"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Search Input */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input
          type="text"
          placeholder="Search for skills (e.g., React, UI Design, Python...)"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className={`w-full pl-10 pr-4 py-2 sm:py-3 rounded-lg border text-sm ${
            darkMode
              ? "bg-gray-800 border-gray-700 text-white placeholder-gray-400"
              : "bg-white border-gray-300 text-gray-900 placeholder-gray-500"
          } focus:outline-none focus:ring-2 focus:ring-[#0084ca] focus:border-transparent`}
        />
      </div>

      {/* Skills by Categories */}
      <div className="space-y-3 sm:space-y-4 max-h-80 sm:max-h-96 overflow-y-auto">
        {Object.entries(SKILL_CATEGORIES).map(([category, categorySkills]) => {
          const filteredCategorySkills = categorySkills.filter((skill) =>
            skill.toLowerCase().includes(search.toLowerCase()),
          );

          if (filteredCategorySkills.length === 0) return null;

          return (
            <div key={category} className="border rounded-lg overflow-hidden">
              <div
                className={`px-3 sm:px-4 py-2 font-medium text-xs sm:text-sm ${
                  darkMode
                    ? "bg-gray-800 text-gray-200"
                    : "bg-gray-50 text-gray-700"
                }`}
              >
                {category}
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-1 p-2">
                {filteredCategorySkills.map((skill) => {
                  const selected = isSelected(skill);
                  const canAdd = !selected && skills.length < MAX_SKILLS;

                  return (
                    <button
                      key={skill}
                      onClick={() => handleSelect(skill)}
                      disabled={!canAdd && !selected}
                      className={`flex items-center justify-between px-2 sm:px-3 py-1.5 sm:py-2 text-xs sm:text-sm rounded transition-all ${
                        selected
                          ? "bg-[#0084ca] text-white"
                          : canAdd
                            ? "hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300"
                            : "opacity-50 cursor-not-allowed text-gray-400"
                      }`}
                    >
                      <span className="truncate">{skill}</span>
                      {selected ? (
                        <X className="w-3 h-3 flex-shrink-0" />
                      ) : canAdd ? (
                        <Plus className="w-3 h-3 flex-shrink-0" />
                      ) : (
                        <span className="text-xs">MAX</span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })}

        {filteredSkills.length === 0 && search && (
          <div className="text-center py-8 text-gray-500">
            <Search className="w-8 h-8 mx-auto mb-2 opacity-50" />
            <p>No skills found for "{search}"</p>
            <p className="text-sm">Try a different search term</p>
          </div>
        )}
      </div>

      {/* Quick Add Popular Skills */}
      {!search && (
        <div>
          <h4 className="font-medium text-xs sm:text-sm mb-2">
            Popular Skills
          </h4>
          <div className="flex flex-wrap gap-1.5 sm:gap-2">
            {[
              "JavaScript",
              "Python",
              "React",
              "UI/UX Design",
              "Project Management",
            ].map((skill) => {
              const selected = isSelected(skill);
              const canAdd = !selected && skills.length < MAX_SKILLS;

              return (
                <button
                  key={skill}
                  onClick={() => handleSelect(skill)}
                  disabled={!canAdd && !selected}
                  className={`px-2 sm:px-3 py-1 text-xs rounded-full border transition-all ${
                    selected
                      ? "bg-[#0084ca] text-white border-[#0084ca]"
                      : canAdd
                        ? "border-gray-300 hover:border-[#0084ca] text-gray-600 hover:text-[#0084ca]"
                        : "opacity-50 cursor-not-allowed border-gray-200 text-gray-400"
                  }`}
                >
                  {skill}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
