import { useState, useRef, useEffect } from "react";
import { Check, ChevronDown, ChevronUp, MapPin, X, Search } from "lucide-react";

interface LocationSelectorProps {
  value: string;
  onChange: (location: string) => void;
  placeholder?: string;
  darkMode?: boolean;
  disabled?: boolean;
}

const ETHIOPIAN_LOCATIONS: Record<string, string[]> = {
  "Addis Ababa": ["Addis Ababa"],
  Amhara: ["Bahir Dar", "Gondar", "Dessie", "Debre Birhan", "Debre Markos"],
  Oromia: ["Adama", "Jimma", "Shashamane", "Nekemte", "Bishoftu", "Sebeta", "Woliso", "Asella", "Ambo"],
  Tigray: ["Mekelle", "Axum", "Adigrat", "Shire", "Humera"],
  "Southern Nations": ["Arba Minch", "Sodo", "Hawassa", "Hosaena", "Dilla"],
  Sidama: ["Hawassa", "Yirgalem", "Aleta Wendo"],
  Somali: ["Jigjiga", "Gode", "Degahbur"],
  Afar: ["Semera", "Dubti", "Awash"],
  "Dire Dawa": ["Dire Dawa"],
  Harari: ["Harar"],
  Gambela: ["Gambela", "Itang"],
  "Benishangul-Gumuz": ["Assosa", "Mekane Selam"],
};

const INTERNATIONAL: { city: string; country: string }[] = [
  { city: "Nairobi", country: "Kenya" },
  { city: "London", country: "United Kingdom" },
  { city: "New York", country: "USA" },
  { city: "San Francisco", country: "USA" },
  { city: "Toronto", country: "Canada" },
  { city: "Dubai", country: "UAE" },
  { city: "Cairo", country: "Egypt" },
  { city: "Johannesburg", country: "South Africa" },
  { city: "Lagos", country: "Nigeria" },
  { city: "Kigali", country: "Rwanda" },
];

export function LocationSelector({
  value,
  onChange,
  placeholder = "Select location",
  darkMode = false,
  disabled = false,
}: LocationSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<"ethiopia" | "international">("ethiopia");
  const [expandedRegions, setExpandedRegions] = useState<Set<string>>(new Set(["Addis Ababa"]));
  const [search, setSearch] = useState("");
  const containerRef = useRef<HTMLDivElement>(null);
  const dm = darkMode;

  // Close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const toggleRegion = (region: string) => {
    const next = new Set(expandedRegions);
    next.has(region) ? next.delete(region) : next.add(region);
    setExpandedRegions(next);
  };

  const select = (location: string) => {
    onChange(location);
    setIsOpen(false);
    setSearch("");
  };

  const clear = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange("");
  };

  // Flatten for search
  const allEthiopian = Object.entries(ETHIOPIAN_LOCATIONS).flatMap(([region, cities]) =>
    cities.map((city) => ({ city, region }))
  );
  const searchResults = search.trim()
    ? [
        ...allEthiopian.filter((c) => c.city.toLowerCase().includes(search.toLowerCase())),
        ...INTERNATIONAL.filter((c) =>
          c.city.toLowerCase().includes(search.toLowerCase()) ||
          c.country.toLowerCase().includes(search.toLowerCase())
        ).map((c) => ({ city: `${c.city}, ${c.country}`, region: "International" })),
      ]
    : [];

  const triggerCls = `w-full flex items-center justify-between gap-2 px-3 py-2.5 rounded-lg border text-sm transition-colors ${
    disabled
      ? dm ? "bg-gray-700 border-gray-600 text-gray-500 cursor-not-allowed"
           : "bg-gray-100 border-gray-200 text-gray-400 cursor-not-allowed"
      : isOpen
      ? "border-[#0084ca] ring-2 ring-[#0084ca]/20 " + (dm ? "bg-gray-700" : "bg-white")
      : dm
      ? "bg-gray-700 border-gray-600 text-white hover:border-[#0084ca]"
      : "bg-white border-gray-300 text-gray-900 hover:border-[#0084ca]"
  }`;

  return (
    <div className="relative w-full" ref={containerRef}>

      {/* Trigger */}
      <button
        type="button"
        onClick={() => !disabled && setIsOpen((o) => !o)}
        disabled={disabled}
        className={triggerCls}
      >
        <div className="flex items-center gap-2 min-w-0">
          <MapPin className={`w-4 h-4 flex-shrink-0 ${value ? "text-[#0084ca]" : dm ? "text-gray-500" : "text-gray-400"}`} />
          <span className={`truncate ${value ? (dm ? "text-white" : "text-gray-900") : (dm ? "text-gray-500" : "text-gray-400")}`}>
            {value || placeholder}
          </span>
        </div>
        <div className="flex items-center gap-1 flex-shrink-0">
          {value && (
            <span
              onClick={clear}
              className={`p-0.5 rounded hover:bg-red-100 dark:hover:bg-red-900/30 cursor-pointer ${dm ? "text-gray-400 hover:text-red-400" : "text-gray-400 hover:text-red-500"}`}
            >
              <X className="w-3.5 h-3.5" />
            </span>
          )}
          <ChevronDown className={`w-4 h-4 transition-transform duration-200 ${isOpen ? "rotate-180" : ""} ${dm ? "text-gray-400" : "text-gray-400"}`} />
        </div>
      </button>

      {/* Dropdown */}
      {isOpen && (
        <div className={`absolute left-0 right-0 top-full mt-1.5 z-50 rounded-xl border shadow-2xl overflow-hidden ${
          dm ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200"
        }`}
          style={{ maxHeight: "320px", display: "flex", flexDirection: "column" }}
        >
          {/* Search */}
          <div className={`px-3 pt-3 pb-2 border-b ${dm ? "border-gray-700" : "border-gray-100"}`}>
            <div className="relative">
              <Search className={`absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 ${dm ? "text-gray-500" : "text-gray-400"}`} />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search city..."
                autoFocus
                className={`w-full pl-8 pr-3 py-1.5 text-sm rounded-lg border outline-none transition-colors ${
                  dm
                    ? "bg-gray-700 border-gray-600 text-white placeholder-gray-500 focus:border-[#0084ca]"
                    : "bg-gray-50 border-gray-200 text-gray-900 placeholder-gray-400 focus:border-[#0084ca]"
                }`}
              />
            </div>
          </div>

          {/* Search results */}
          {search.trim() ? (
            <div className="overflow-y-auto flex-1 p-2">
              {searchResults.length === 0 ? (
                <p className={`text-xs text-center py-4 ${dm ? "text-gray-500" : "text-gray-400"}`}>No results found</p>
              ) : (
                searchResults.map((r) => (
                  <button
                    key={r.city}
                    onClick={() => select(r.city)}
                    className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm transition-colors ${
                      value === r.city
                        ? "bg-[#0084ca] text-white"
                        : dm
                        ? "text-gray-300 hover:bg-gray-700"
                        : "text-gray-700 hover:bg-gray-50"
                    }`}
                  >
                    <div className="text-left">
                      <span className="font-medium">{r.city}</span>
                      <span className={`ml-2 text-xs ${value === r.city ? "text-white/70" : dm ? "text-gray-500" : "text-gray-400"}`}>
                        {r.region}
                      </span>
                    </div>
                    {value === r.city && <Check className="w-3.5 h-3.5 flex-shrink-0" />}
                  </button>
                ))
              )}
            </div>
          ) : (
            <>
              {/* Tabs */}
              <div className={`flex border-b ${dm ? "border-gray-700 bg-gray-800/50" : "border-gray-100 bg-gray-50"}`}>
                {(["ethiopia", "international"] as const).map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={`flex-1 py-2 text-xs font-semibold transition-colors capitalize ${
                      activeTab === tab
                        ? "text-[#0084ca] border-b-2 border-[#0084ca]"
                        : dm ? "text-gray-400 hover:text-gray-200" : "text-gray-500 hover:text-gray-700"
                    }`}
                  >
                    {tab === "ethiopia" ? "🇪🇹 Ethiopia" : "🌍 International"}
                  </button>
                ))}
              </div>

              {/* List */}
              <div className="overflow-y-auto flex-1 p-2">
                {activeTab === "ethiopia" ? (
                  Object.entries(ETHIOPIAN_LOCATIONS).map(([region, cities]) => (
                    <div key={region} className="mb-1">
                      <button
                        onClick={() => toggleRegion(region)}
                        className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-semibold uppercase tracking-wide transition-colors ${
                          dm ? "text-gray-400 hover:bg-gray-700" : "text-gray-500 hover:bg-gray-50"
                        }`}
                      >
                        <span>{region}</span>
                        {expandedRegions.has(region)
                          ? <ChevronUp className="w-3 h-3" />
                          : <ChevronDown className="w-3 h-3" />}
                      </button>
                      {expandedRegions.has(region) && (
                        <div className="ml-2 space-y-0.5">
                          {cities.map((city) => (
                            <button
                              key={city}
                              onClick={() => select(city)}
                              className={`w-full flex items-center justify-between px-3 py-1.5 rounded-lg text-sm transition-colors ${
                                value === city
                                  ? "bg-[#0084ca] text-white"
                                  : dm
                                  ? "text-gray-300 hover:bg-gray-700"
                                  : "text-gray-700 hover:bg-gray-50"
                              }`}
                            >
                              <span>{city}</span>
                              {value === city && <Check className="w-3.5 h-3.5" />}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  ))
                ) : (
                  INTERNATIONAL.map(({ city, country }) => {
                    const full = `${city}, ${country}`;
                    return (
                      <button
                        key={full}
                        onClick={() => select(full)}
                        className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm transition-colors ${
                          value === full
                            ? "bg-[#0084ca] text-white"
                            : dm
                            ? "text-gray-300 hover:bg-gray-700"
                            : "text-gray-700 hover:bg-gray-50"
                        }`}
                      >
                        <div className="text-left">
                          <span className="font-medium">{city}</span>
                          <span className={`ml-2 text-xs ${value === full ? "text-white/70" : dm ? "text-gray-500" : "text-gray-400"}`}>
                            {country}
                          </span>
                        </div>
                        {value === full && <Check className="w-3.5 h-3.5 flex-shrink-0" />}
                      </button>
                    );
                  })
                )}
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
