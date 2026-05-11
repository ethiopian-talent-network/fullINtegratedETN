import React, { useState, useEffect } from "react";
import {
  X, MapPin, DollarSign, Mail, Briefcase, GraduationCap,
  Globe, Link2, GitBranch, FileText, Award, ExternalLink,
  Calendar, Code, Image as ImageIcon, BadgeCheck,
} from "lucide-react";
import { API_BASE_URL } from "../../../config/api";

interface Portfolio {
  id: number;
  title: string;
  description?: string;
  technologies: string[];
  image_url?: string;
  project_url?: string;
  github_url?: string;
}

interface Certificate {
  id: number;
  title: string;
  organization?: string;
  issue_date?: string;
  expiry_date?: string;
  credential_id?: string;
  credential_url?: string;
}

interface TalentDetail {
  id: number;
  name: string;
  email: string;
  profile_image?: string;
  fullName?: string;
  about?: string;
  experience?: string;
  education?: string;
  languages?: string;
  linkedin?: string;
  github?: string;
  resume_url?: string;
  Location?: string;
  HourlyRate?: number | string;
  skills: string[];
  portfolio: Portfolio[];
  certificates: Certificate[];
  created_at: string;
}

interface TalentProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  talentId: number | null;
  darkMode?: boolean;
}

type Tab = "overview" | "portfolio" | "certificates";

const getInitials = (name: string) =>
  name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);

export const TalentProfileModal: React.FC<TalentProfileModalProps> = ({
  isOpen, onClose, talentId, darkMode = false,
}) => {
  const [talent, setTalent] = useState<TalentDetail | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<Tab>("overview");
  const dm = darkMode;

  useEffect(() => {
    if (isOpen && talentId) {
      setActiveTab("overview");
      fetchTalent(talentId);
    }
  }, [isOpen, talentId]);

  const fetchTalent = async (id: number) => {
    setLoading(true);
    setError(null);
    setTalent(null);
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${API_BASE_URL}/api/employer/talents/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("Failed to load profile");
      const data = await res.json();
      setTalent(data.talent || data);
    } catch (err: any) {
      setError(err.message || "Failed to load profile");
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => { setTalent(null); setError(null); onClose(); };

  if (!isOpen) return null;

  const tabs: { id: Tab; label: string; count?: number }[] = [
    { id: "overview", label: "Overview" },
    { id: "portfolio", label: "Portfolio", count: talent?.portfolio?.length },
    { id: "certificates", label: "Certificates", count: talent?.certificates?.length },
  ];

  const sectionTitle = (text: string, icon: React.ReactNode) => (
    <div className="flex items-center gap-2 mb-3">
      <div className={`w-7 h-7 rounded-lg flex items-center justify-center ${dm ? "bg-gray-700" : "bg-gray-100"}`}>
        {icon}
      </div>
      <h4 className={`text-sm font-bold uppercase tracking-wider ${dm ? "text-gray-300" : "text-gray-600"}`}>{text}</h4>
    </div>
  );

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 transition-opacity"
        onClick={handleClose}
      />

      {/* Slide-in panel */}
      <div className={`fixed top-0 right-0 h-full w-full max-w-2xl z-50 flex flex-col shadow-2xl transition-transform ${dm ? "bg-gray-900" : "bg-white"}`}>

        {/* Header */}
        <div className={`flex items-center justify-between px-6 py-4 border-b flex-shrink-0 ${dm ? "border-gray-800" : "border-gray-100"}`}>
          <span className={`text-sm font-semibold ${dm ? "text-gray-400" : "text-gray-500"}`}>Talent Profile</span>
          <button onClick={handleClose}
            className={`p-2 rounded-lg transition-colors ${dm ? "hover:bg-gray-800 text-gray-400" : "hover:bg-gray-100 text-gray-500"}`}>
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable content */}
        <div className="flex-1 overflow-y-auto">
          {loading && (
            <div className="flex flex-col items-center justify-center h-64 gap-3">
              <div className="w-10 h-10 rounded-full border-4 border-[#0084ca]/20 border-t-[#0084ca] animate-spin" />
              <p className={`text-sm ${dm ? "text-gray-400" : "text-gray-500"}`}>Loading profile...</p>
            </div>
          )}

          {error && (
            <div className="flex items-center justify-center h-64">
              <p className={`text-sm ${dm ? "text-red-400" : "text-red-600"}`}>{error}</p>
            </div>
          )}

          {talent && !loading && (
            <>
              {/* Hero section */}
              <div className={`px-6 py-6 border-b ${dm ? "border-gray-800 bg-gray-800/30" : "border-gray-100 bg-gray-50/50"}`}>
                <div className="flex items-start gap-4">
                  {/* Avatar */}
                  <div className="relative flex-shrink-0">
                    <div className="w-20 h-20 rounded-2xl overflow-hidden bg-gradient-to-br from-[#0084ca] to-[#006ba6] flex items-center justify-center shadow-lg">
                      {talent.profile_image ? (
                        <img src={talent.profile_image} alt={talent.name} className="w-full h-full object-cover" />
                      ) : (
                        <span className="text-white text-2xl font-bold">{getInitials(talent.name)}</span>
                      )}
                    </div>
                    <span className="absolute -bottom-1 -right-1 w-4 h-4 bg-emerald-400 border-2 border-white dark:border-gray-900 rounded-full" />
                  </div>

                  {/* Identity */}
                  <div className="flex-1 min-w-0">
                    <h2 className={`text-xl font-bold ${dm ? "text-white" : "text-gray-900"}`}>{talent.name}</h2>
                    {talent.fullName && talent.fullName !== talent.name && (
                      <p className={`text-sm ${dm ? "text-gray-400" : "text-gray-500"}`}>{talent.fullName}</p>
                    )}
                    <div className={`flex flex-wrap gap-x-4 gap-y-1 mt-2 text-sm ${dm ? "text-gray-400" : "text-gray-500"}`}>
                      <span className="flex items-center gap-1.5"><Mail className="w-3.5 h-3.5" />{talent.email}</span>
                      {talent.Location && <span className="flex items-center gap-1.5"><MapPin className="w-3.5 h-3.5" />{talent.Location}</span>}
                      {talent.HourlyRate && (
                        <span className={`flex items-center gap-1 font-semibold ${dm ? "text-emerald-400" : "text-emerald-600"}`}>
                          <DollarSign className="w-3.5 h-3.5" />{talent.HourlyRate}/hr
                        </span>
                      )}
                    </div>
                    <div className={`flex items-center gap-1 mt-1.5 text-xs ${dm ? "text-gray-500" : "text-gray-400"}`}>
                      <Calendar className="w-3 h-3" />
                      Member since {new Date(talent.created_at).toLocaleDateString("en-US", { month: "long", year: "numeric" })}
                    </div>
                  </div>
                </div>

                {/* Quick links */}
                {(talent.linkedin || talent.github || talent.resume_url) && (
                  <div className="flex flex-wrap gap-2 mt-4">
                    {talent.linkedin && (
                      <a href={talent.linkedin} target="_blank" rel="noopener noreferrer"
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-blue-600 text-white hover:bg-blue-700 transition-colors">
                        <Link2 className="w-3.5 h-3.5" /> LinkedIn
                      </a>
                    )}
                    {talent.github && (
                      <a href={talent.github} target="_blank" rel="noopener noreferrer"
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${dm ? "bg-gray-700 text-gray-200 hover:bg-gray-600" : "bg-gray-900 text-white hover:bg-gray-800"}`}>
                        <GitBranch className="w-3.5 h-3.5" /> GitHub
                      </a>
                    )}
                    {talent.resume_url && (
                      <a href={talent.resume_url} target="_blank" rel="noopener noreferrer"
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-red-600 text-white hover:bg-red-700 transition-colors">
                        <FileText className="w-3.5 h-3.5" /> Resume
                      </a>
                    )}
                  </div>
                )}
              </div>

              {/* Tabs */}
              <div className={`flex gap-1 px-6 py-3 border-b ${dm ? "border-gray-800" : "border-gray-100"}`}>
                {tabs.map((tab) => (
                  <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                      activeTab === tab.id
                        ? dm ? "bg-gray-700 text-white" : "bg-[#0084ca]/10 text-[#0084ca]"
                        : dm ? "text-gray-400 hover:text-gray-200" : "text-gray-500 hover:text-gray-800"
                    }`}>
                    {tab.label}
                    {tab.count !== undefined && tab.count > 0 && (
                      <span className={`px-1.5 py-0.5 text-xs rounded-full ${
                        activeTab === tab.id
                          ? dm ? "bg-gray-600 text-gray-300" : "bg-[#0084ca]/20 text-[#0084ca]"
                          : dm ? "bg-gray-700 text-gray-500" : "bg-gray-100 text-gray-500"
                      }`}>{tab.count}</span>
                    )}
                  </button>
                ))}
              </div>

              {/* Tab content */}
              <div className="px-6 py-6 space-y-6">

                {/* ── OVERVIEW ── */}
                {activeTab === "overview" && (
                  <>
                    {/* About */}
                    {talent.about && (
                      <div>
                        {sectionTitle("About", <Briefcase className="w-3.5 h-3.5 text-gray-500" />)}
                        <p className={`text-sm leading-relaxed ${dm ? "text-gray-300" : "text-gray-600"}`}>{talent.about}</p>
                      </div>
                    )}

                    {/* Skills */}
                    {talent.skills?.length > 0 && (
                      <div>
                        {sectionTitle("Skills", <Code className="w-3.5 h-3.5 text-gray-500" />)}
                        <div className="flex flex-wrap gap-2">
                          {talent.skills.map((skill, i) => (
                            <span key={i} className={`px-3 py-1.5 rounded-full text-xs font-semibold border ${
                              dm ? "bg-[#0084ca]/20 border-[#0084ca]/30 text-[#60b4e8]" : "bg-[#0084ca]/10 border-[#0084ca]/20 text-[#0084ca]"
                            }`}>{skill}</span>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Experience */}
                    {talent.experience && (
                      <div>
                        {sectionTitle("Experience", <Briefcase className="w-3.5 h-3.5 text-gray-500" />)}
                        <div className={`rounded-xl p-4 text-sm leading-relaxed whitespace-pre-line ${dm ? "bg-gray-800 text-gray-300" : "bg-gray-50 text-gray-700"}`}>
                          {talent.experience}
                        </div>
                      </div>
                    )}

                    {/* Education */}
                    {talent.education && (
                      <div>
                        {sectionTitle("Education", <GraduationCap className="w-3.5 h-3.5 text-gray-500" />)}
                        <div className={`rounded-xl p-4 text-sm leading-relaxed whitespace-pre-line ${dm ? "bg-gray-800 text-gray-300" : "bg-gray-50 text-gray-700"}`}>
                          {talent.education}
                        </div>
                      </div>
                    )}

                    {/* Languages */}
                    {talent.languages && (
                      <div>
                        {sectionTitle("Languages", <Globe className="w-3.5 h-3.5 text-gray-500" />)}
                        <div className="flex flex-wrap gap-2">
                          {talent.languages.split(",").map((lang, i) => (
                            <span key={i} className={`px-3 py-1.5 rounded-full text-xs font-medium ${dm ? "bg-green-900/30 text-green-400" : "bg-green-50 text-green-700 border border-green-200"}`}>
                              {lang.trim()}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {!talent.about && !talent.experience && !talent.education && (
                      <p className={`text-sm italic text-center py-8 ${dm ? "text-gray-500" : "text-gray-400"}`}>
                        This talent hasn't filled in their overview yet.
                      </p>
                    )}
                  </>
                )}

                {/* ── PORTFOLIO ── */}
                {activeTab === "portfolio" && (
                  <>
                    {(!talent.portfolio || talent.portfolio.length === 0) ? (
                      <div className="text-center py-12">
                        <div className={`w-14 h-14 rounded-full mx-auto mb-3 flex items-center justify-center ${dm ? "bg-gray-800" : "bg-gray-100"}`}>
                          <ImageIcon className={`w-6 h-6 ${dm ? "text-gray-600" : "text-gray-400"}`} />
                        </div>
                        <p className={`text-sm ${dm ? "text-gray-400" : "text-gray-500"}`}>No portfolio projects yet</p>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {talent.portfolio.map((project) => (
                          <div key={project.id}
                            className={`rounded-xl border overflow-hidden group ${dm ? "bg-gray-800 border-gray-700" : "bg-white border-gray-100 shadow-sm"}`}>
                            {/* Project image */}
                            <div className={`aspect-video flex items-center justify-center ${dm ? "bg-gray-700" : "bg-gray-100"}`}>
                              {project.image_url ? (
                                <img src={project.image_url} alt={project.title} className="w-full h-full object-cover" />
                              ) : (
                                <ImageIcon className={`w-8 h-8 ${dm ? "text-gray-600" : "text-gray-300"}`} />
                              )}
                            </div>
                            <div className="p-4">
                              <h4 className={`text-sm font-bold mb-1 ${dm ? "text-white" : "text-gray-900"}`}>{project.title}</h4>
                              {project.description && (
                                <p className={`text-xs leading-relaxed line-clamp-2 mb-3 ${dm ? "text-gray-400" : "text-gray-500"}`}>
                                  {project.description}
                                </p>
                              )}
                              {(() => {
                                const techs = Array.isArray(project.technologies)
                                  ? project.technologies
                                  : typeof project.technologies === "string"
                                    ? (() => { try { return JSON.parse(project.technologies); } catch { return []; } })()
                                    : [];
                                return techs.length > 0 ? (
                                  <div className="flex flex-wrap gap-1 mb-3">
                                    {techs.slice(0, 4).map((tech: string, i: number) => (
                                      <span key={i} className={`px-1.5 py-0.5 rounded text-xs ${dm ? "bg-gray-700 text-gray-300" : "bg-gray-100 text-gray-600"}`}>
                                        {tech}
                                      </span>
                                    ))}
                                  </div>
                                ) : null;
                              })()}
                              <div className="flex gap-2">
                                {project.project_url && (
                                  <a href={project.project_url} target="_blank" rel="noopener noreferrer"
                                    className="flex items-center gap-1 text-xs text-[#0084ca] hover:underline">
                                    <ExternalLink className="w-3 h-3" /> Live Demo
                                  </a>
                                )}
                                {project.github_url && (
                                  <a href={project.github_url} target="_blank" rel="noopener noreferrer"
                                    className={`flex items-center gap-1 text-xs hover:underline ${dm ? "text-gray-400" : "text-gray-500"}`}>
                                    <GitBranch className="w-3 h-3" /> Source
                                  </a>
                                )}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </>
                )}

                {/* ── CERTIFICATES ── */}
                {activeTab === "certificates" && (
                  <>
                    {(!talent.certificates || talent.certificates.length === 0) ? (
                      <div className="text-center py-12">
                        <div className={`w-14 h-14 rounded-full mx-auto mb-3 flex items-center justify-center ${dm ? "bg-gray-800" : "bg-gray-100"}`}>
                          <Award className={`w-6 h-6 ${dm ? "text-gray-600" : "text-gray-400"}`} />
                        </div>
                        <p className={`text-sm ${dm ? "text-gray-400" : "text-gray-500"}`}>No certificates added yet</p>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {talent.certificates.map((cert) => (
                          <div key={cert.id}
                            className={`flex gap-4 p-4 rounded-xl border ${dm ? "bg-gray-800 border-gray-700" : "bg-white border-gray-100 shadow-sm"}`}>
                            <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center flex-shrink-0">
                              <BadgeCheck className="w-5 h-5 text-amber-600" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <h4 className={`text-sm font-semibold ${dm ? "text-white" : "text-gray-900"}`}>{cert.title}</h4>
                              {cert.organization && (
                                <p className={`text-xs mt-0.5 ${dm ? "text-gray-400" : "text-gray-500"}`}>{cert.organization}</p>
                              )}
                              <div className={`flex flex-wrap gap-3 mt-1.5 text-xs ${dm ? "text-gray-500" : "text-gray-400"}`}>
                                {cert.issue_date && (
                                  <span className="flex items-center gap-1">
                                    <Calendar className="w-3 h-3" />
                                    {new Date(cert.issue_date).toLocaleDateString("en-US", { month: "short", year: "numeric" })}
                                    {cert.expiry_date && ` – ${new Date(cert.expiry_date).toLocaleDateString("en-US", { month: "short", year: "numeric" })}`}
                                  </span>
                                )}
                                {cert.credential_id && <span className="font-mono">ID: {cert.credential_id}</span>}
                              </div>
                              {cert.credential_url && (
                                <a href={cert.credential_url} target="_blank" rel="noopener noreferrer"
                                  className="inline-flex items-center gap-1 mt-1.5 text-xs text-amber-600 hover:text-amber-700 font-medium">
                                  <ExternalLink className="w-3 h-3" /> Verify credential
                                </a>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </>
                )}
              </div>
            </>
          )}
        </div>

        {/* Footer actions */}
        {talent && !loading && (
          <div className={`flex gap-3 px-6 py-4 border-t flex-shrink-0 ${dm ? "border-gray-800 bg-gray-900" : "border-gray-100 bg-white"}`}>
            <button
              onClick={handleClose}
              className={`flex-1 py-2.5 rounded-lg text-sm font-semibold border transition-colors ${dm ? "border-gray-700 text-gray-300 hover:bg-gray-800" : "border-gray-200 text-gray-600 hover:bg-gray-50"}`}>
              Close
            </button>
            <button
              className="flex-1 py-2.5 rounded-lg text-sm font-semibold bg-gradient-to-r from-[#0084ca] to-[#006ba6] text-white hover:opacity-90 transition-opacity">
              Send Message
            </button>
          </div>
        )}
      </div>
    </>
  );
};
