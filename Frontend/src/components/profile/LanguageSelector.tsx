import { useState, useRef, useEffect } from "react";
import { X, Search, ChevronDown, Check, Globe } from "lucide-react";

interface LanguageSelectorProps {
  value: string; // comma-separated e.g. "English, Amharic, French"
  onChange: (value: string) => void;
  darkMode?: boolean;
  placeholder?: string;
  maxLanguages?: number;
}

const LANGUAGES = [
  // Ethiopian
  "Amharic", "Oromo", "Tigrinya", "Somali", "Afar", "Sidama",
  "Wolaita", "Gurage", "Hadiya", "Silte",
  // International
  "English", "French", "Arabic", "Spanish", "Portuguese", "German",
  "Italian", "Chinese", "Japanese", "Korean", "Russian", "Turkish",
  "Swahili", "Hindi", "Urdu", "Dutch", "Swedish", "Norwegian",
  "Polish", "Greek",
];

const ETHIOPIAN_LANGS = new Set([
  "Amharic", "Oromo", "Tigrinya", "Somali", "Afar",
  "Sidama", "Wolaita", "Gurage", "Hadiya", "Silte",
]);

export function LanguageSelector({
  value,
  onChange,
  darkMode = false,
  placeholder = "Add languages...",
  maxLanguages = 8,
}: LanguageSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState("");
  const containerRef = useRef<HTMLDivElement>(null);
  const dm = darkMode;

  // Parse comma-separated string → array
  const selected = value
    ? value.split(",").map((l) => l.trim()).filter(Boolean)
    : [];

  // Close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
        setSearch("");
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const toggle = (lang: string) => {
    let next: string[];
    if (selected.includes(lang)) {
      next = selected.filter((l) => l !== lang);
    } else {
      if (selected.length >= maxLanguages) return;
      next = [...selected, lang];
    }
    onChange(next.join(", "));
  };

  const remove = (lang: string) => {
    const next = selected.filter((l) => l !== lang);
    onChange(next.join(", "));
  };

  const filtered = LANGUAGES.filter(
    (l) =>
      l.toLowerCase().includes(search.toLowerCase()) &&
      !selected.includes(l)
  );

  // Also allow custom entry
  const canAddCustom =
    search.trim().length > 1 &&
    !LANGUAGES.some((l) => l.toLowerCase() === search.toLowerCase()) &&
    !selected.includes(search.trim()) &&
    selected.length < maxLanguages;

  const addCustom = () => {
    const lang = search.trim();
    if (!lang) return;
    onChange([...selected, lang].join(", "));
    setSearch("");
  };

  const ethiopian = filtered.filter((l) => ETHIOPIAN_LANGS.has(l));
  const international = filtered.filter((l) => !ETHIOPIAN_LANGS.has(l));

  const inputCls = `w-full pl-8 pr-3 py-1.5 text-sm rounded-lg border outline-none transition-colors ${
    dm
      ? "bg-gray-700 border-gray-600 text-white placeholder-gray-500 focus:border-[#0084ca]"
      : "bg-gray-50 border-gray-200 text-gray-900 placeholder-gray-400 focus:border-[#0084ca]"
  }`;

  return (
    <div className="relative w-full" ref={containerRef}>

      {/* Selected tags + trigger */}
      <div
        onClick={() => setIsOpen((o) => !o)}
        className={`w-full min-h-[42px] flex flex-wrap items-center gap-1.5 px-3 py-2 rounded-lg border cursor-pointer transition-colors ${
          isOpen
            ? "border-[#0084ca] ring-2 ring-[#0084ca]/20 " + (dm ? "bg-gray-700" : "bg-white")
            : dm
            ? "bg-gray-700 border-gray-600 hover:border-[#0084ca]"
            : "bg-white border-gray-300 hover:border-[#0084ca]"
        }`}
      >
        <Globe className={`w-4 h-4 flex-shrink-0 ${selected.length ? "text-[#0084ca]" : dm ? "text-gray-500" : "text-gray-400"}`} />

        {selected.length === 0 && (
          <span className={`text-sm ${dm ? "text-gray-500" : "text-gray-400"}`}>{placeholder}</span>
        )}

        {selected.map((lang) => (
          <span
            key={lang}
            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${
              ETHIOPIAN_LANGS.has(lang)
                ? "bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-300"
                : "bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300"
            }`}
            onClick={(e) => e.stopPropagation()}
          >
            {lang}
            <button
              onClick={(e) => { e.stopPropagation(); remove(lang); }}
              className="hover:text-red-500 transition-colors"
            >
              <X className="w-3 h-3" />
            </button>
          </span>
        ))}

        <ChevronDown className={`w-4 h-4 ml-auto flex-shrink-0 transition-transform duration-200 ${isOpen ? "rotate-180" : ""} ${dm ? "text-gray-400" : "text-gray-400"}`} />
      </div>

      {/* Dropdown */}
      {isOpen && (
        <div className={`absolute left-0 right-0 top-full mt-1.5 z-50 rounded-xl border shadow-2xl overflow-hidden flex flex-col ${
          dm ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200"
        }`}
          style={{ maxHeight: "300px" }}
        >
          {/* Search */}
          <div className={`px-3 pt-3 pb-2 border-b flex-shrink-0 ${dm ? "border-gray-700" : "border-gray-100"}`}>
            <div className="relative">
              <Search className={`absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 ${dm ? "text-gray-500" : "text-gray-400"}`} />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && canAddCustom && addCustom()}
                placeholder="Search or type a language..."
                autoFocus
                className={inputCls}
              />
            </div>
            {selected.length >= maxLanguages && (
              <p className={`text-xs mt-1.5 ${dm ? "text-yellow-400" : "text-yellow-600"}`}>
                Maximum {maxLanguages} languages reached
              </p>
            )}
          </div>

          {/* List */}
          <div className="overflow-y-auto flex-1 p-2">

            {/* Add custom */}
            {canAddCustom && (
              <button
                onClick={addCustom}
                className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm mb-1 transition-colors ${
                  dm ? "text-[#60b4e8] hover:bg-gray-700" : "text-[#0084ca] hover:bg-blue-50"
                }`}
              >
                <span className="text-lg leading-none">+</span>
                Add "{search.trim()}"
              </button>
            )}

            {/* Selected already */}
            {selected.length > 0 && (
              <div className="mb-2">
                <p className={`text-xs font-semibold uppercase tracking-wide px-3 mb-1 ${dm ? "text-gray-500" : "text-gray-400"}`}>
                  Selected
                </p>
                {selected.map((lang) => (
                  <button
                    key={lang}
                    onClick={() => toggle(lang)}
                    className={`w-full flex items-center justify-between px-3 py-1.5 rounded-lg text-sm transition-colors bg-[#0084ca]/10 text-[#0084ca]`}
                  >
                    <span>{lang}</span>
                    <Check className="w-3.5 h-3.5" />
                  </button>
                ))}
              </div>
            )}

            {/* Ethiopian */}
            {ethiopian.length > 0 && (
              <div className="mb-2">
                <p className={`text-xs font-semibold uppercase tracking-wide px-3 mb-1 ${dm ? "text-gray-500" : "text-gray-400"}`}>
                  🇪🇹 Ethiopian
                </p>
                {ethiopian.map((lang) => (
                  <button
                    key={lang}
                    onClick={() => toggle(lang)}
                    disabled={selected.length >= maxLanguages}
                    className={`w-full flex items-center justify-between px-3 py-1.5 rounded-lg text-sm transition-colors disabled:opacity-40 ${
                      dm ? "text-gray-300 hover:bg-gray-700" : "text-gray-700 hover:bg-gray-50"
                    }`}
                  >
                    <span>{lang}</span>
                  </button>
                ))}
              </div>
            )}

            {/* International */}
            {international.length > 0 && (
              <div>
                <p className={`text-xs font-semibold uppercase tracking-wide px-3 mb-1 ${dm ? "text-gray-500" : "text-gray-400"}`}>
                  🌍 International
                </p>
                {international.map((lang) => (
                  <button
                    key={lang}
                    onClick={() => toggle(lang)}
                    disabled={selected.length >= maxLanguages}
                    className={`w-full flex items-center justify-between px-3 py-1.5 rounded-lg text-sm transition-colors disabled:opacity-40 ${
                      dm ? "text-gray-300 hover:bg-gray-700" : "text-gray-700 hover:bg-gray-50"
                    }`}
                  >
                    <span>{lang}</span>
                  </button>
                ))}
              </div>
            )}

            {filtered.length === 0 && !canAddCustom && search.trim() && (
              <p className={`text-xs text-center py-4 ${dm ? "text-gray-500" : "text-gray-400"}`}>
                No languages found
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
