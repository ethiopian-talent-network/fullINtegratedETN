import { useState } from "react";
import { Check, Globe, Plus } from "lucide-react";
import type { Language } from "../../types/profile";

interface LanguagesSectionProps {
  languages: Language[];
  onLanguagesChange: (languages: Language[]) => void;
  darkMode?: boolean;
}

const AVAILABLE_LANGUAGES = ["Afaan Oromo", "Amharic", "Somali", "English"];

const LANGUAGE_LEVELS = ["Basic", "Fluent", "Native"] as const;

export default function LanguagesSection({
  languages,
  onLanguagesChange,
  darkMode = false,
}: LanguagesSectionProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [selectedLanguages, setSelectedLanguages] =
    useState<Language[]>(languages);

  const handleLanguageToggle = (
    languageName: string,
    level: "Basic" | "Fluent" | "Native",
  ) => {
    setSelectedLanguages((prev) => {
      const existingIndex = prev.findIndex(
        (lang) => lang.name === languageName,
      );

      if (existingIndex >= 0) {
        // Language exists, remove it
        return prev.filter((lang) => lang.name !== languageName);
      } else {
        // Add new language
        return [...prev, { name: languageName, level }];
      }
    });
  };

  const handleLevelChange = (
    languageName: string,
    newLevel: "Basic" | "Fluent" | "Native",
  ) => {
    setSelectedLanguages((prev) =>
      prev.map((lang) =>
        lang.name === languageName ? { ...lang, level: newLevel } : lang,
      ),
    );
  };

  const handleSave = () => {
    onLanguagesChange(selectedLanguages);
    setIsEditing(false);
  };

  const handleCancel = () => {
    setSelectedLanguages(languages);
    setIsEditing(false);
  };

  const getLevelColor = (level: string) => {
    switch (level) {
      case "Native":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200";
      case "Fluent":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200";
      case "Basic":
        return "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200";
    }
  };

  if (isEditing) {
    return (
      <div>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white">
            Languages
          </h3>
          <div className="flex items-center gap-2">
            <button
              onClick={handleSave}
              className="px-3 py-1 text-sm bg-[#0084ca] text-white rounded-md hover:bg-[#006ba6] transition-colors"
            >
              Save
            </button>
            <button
              onClick={handleCancel}
              className="px-3 py-1 text-sm bg-gray-200 text-gray-700 dark:bg-gray-700 dark:text-gray-300 rounded-md hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>

        <div className="space-y-3">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {AVAILABLE_LANGUAGES.map((language) => {
              const isSelected = selectedLanguages.some(
                (lang) => lang.name === language,
              );
              const selectedLang = selectedLanguages.find(
                (lang) => lang.name === language,
              );

              return (
                <div
                  key={language}
                  className={`p-2 rounded-lg border transition-all cursor-pointer text-center ${
                    isSelected
                      ? "border-[#0084ca] bg-[#0084ca]10 dark:bg-[#0084ca]20"
                      : darkMode
                        ? "border-gray-700 bg-gray-800 hover:border-gray-600"
                        : "border-gray-200 bg-white hover:border-gray-300"
                  }`}
                  onClick={() => handleLanguageToggle(language, "Basic")}
                >
                  <div className="flex items-center justify-center gap-1 mb-1">
                    <div
                      className={`w-3 h-3 rounded border flex items-center justify-center ${
                        isSelected
                          ? "border-[#0084ca] bg-[#0084ca]"
                          : darkMode
                            ? "border-gray-600"
                            : "border-gray-400"
                      }`}
                    >
                      {isSelected && <Check className="w-2 h-2 text-white" />}
                    </div>
                    <span className="text-sm font-medium text-gray-900 dark:text-white">
                      {language}
                    </span>
                  </div>

                  {isSelected && (
                    <div className="mt-1">
                      <select
                        value={selectedLang?.level || "Basic"}
                        onChange={(e) => {
                          e.stopPropagation();
                          handleLevelChange(
                            language,
                            e.target.value as "Basic" | "Fluent" | "Native",
                          );
                        }}
                        className={`w-full px-1 py-0.5 text-xs rounded border ${
                          darkMode
                            ? "bg-gray-700 border-gray-600 text-white"
                            : "bg-white border-gray-300 text-gray-900"
                        }`}
                        onClick={(e) => e.stopPropagation()}
                      >
                        {LANGUAGE_LEVELS.map((level) => (
                          <option key={level} value={level}>
                            {level}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white">
          Languages
        </h3>
        <button
          onClick={() => setIsEditing(true)}
          className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors"
        >
          <Plus className="w-4 h-4" />
        </button>
      </div>

      {languages.length === 0 ? (
        <div
          className={`p-8 text-center rounded-lg border-2 border-dashed ${
            darkMode
              ? "border-gray-700 bg-gray-800"
              : "border-gray-300 bg-gray-50"
          }`}
        >
          <Globe className="w-12 h-12 text-gray-400 mx-auto mb-3" />
          <p className="text-gray-500 dark:text-gray-400 mb-3">
            No languages added yet
          </p>
          <button
            onClick={() => setIsEditing(true)}
            className="px-4 py-2 bg-[#0084ca] text-white rounded-md hover:bg-[#006ba6] transition-colors"
          >
            Add Languages
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {languages.map((lang) => (
            <div
              key={lang.name}
              className={`p-2 rounded-lg border text-center ${
                darkMode
                  ? "border-gray-700 bg-gray-800"
                  : "border-gray-200 bg-white"
              }`}
            >
              <div className="flex items-center justify-center gap-1 mb-1">
                <span className="text-sm font-medium text-gray-900 dark:text-white">
                  {lang.name}
                </span>
              </div>
              <div className="flex items-center justify-center gap-1">
                <div className="flex-1 bg-gray-200 dark:bg-gray-600 rounded-full h-1.5 max-w-8">
                  <div
                    className="bg-[#0084ca] h-1.5 rounded-full"
                    style={{
                      width:
                        lang.level === "Native"
                          ? "100%"
                          : lang.level === "Fluent"
                            ? "80%"
                            : "40%",
                    }}
                  />
                </div>
                <span
                  className={`text-xs px-1 py-0.5 rounded ${getLevelColor(
                    lang.level,
                  )}`}
                >
                  {lang.level}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
