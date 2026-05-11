import { useDarkMode } from "../contexts/DarkModeContext";
import { TalentProfile } from "../components/talent/TalentProfile";
import { Header } from "../features/talents/components/Header";
import { useState, useEffect } from "react";
import { getTalentProfile } from "../api/talent/talentApi";

export default function TalentProfilePage() {
  const { darkMode, toggleDarkMode } = useDarkMode();
  const [userImage, setUserImage] = useState<string | undefined>();

  useEffect(() => {
    getTalentProfile()
      .then((p) => { if (p.data.profile_image) setUserImage(p.data.profile_image); })
      .catch(() => {});
  }, []);

  return (
    <div className={`min-h-screen transition-colors duration-300 ${darkMode ? "bg-gray-900" : "bg-gray-50"}`}>
      <Header
        darkMode={darkMode}
        toggleDarkMode={toggleDarkMode}
        userImage={userImage}
        onImageUpload={(file) => {
          const reader = new FileReader();
          reader.onload = (e) => setUserImage(e.target?.result as string);
          reader.readAsDataURL(file);
        }}
      />
      <main className="py-8">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <TalentProfile darkMode={darkMode} />
        </div>
      </main>
    </div>
  );
}
