import React, { useState, useEffect, useRef } from "react";
import {
  Plus, Trash2, Edit2, ExternalLink, X, Upload, Loader,
  CheckCircle, AlertCircle, Briefcase, Code, Image as ImageIcon,
  Award, Calendar, Link2, BadgeCheck,
} from "lucide-react";
import {
  getPortfolio, createPortfolio, updatePortfolio, deletePortfolio,
  getMySkills, addSkills,
  getCertificates, addCertificate, updateCertificate, deleteCertificate,
  type PortfolioProject, type Skill, type Certificate,
} from "../api/talent/talentApi";

interface PortfolioProps {
  darkMode?: boolean;
}

const Portfolio: React.FC<PortfolioProps> = ({ darkMode = false }) => {
  const [projects, setProjects] = useState<PortfolioProject[]>([]);
  const [mySkills, setMySkills] = useState<Skill[]>([]);
  const [certificates, setCertificates] = useState<Certificate[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Certificate form state
  const [showCertForm, setShowCertForm] = useState(false);
  const [editingCert, setEditingCert] = useState<Certificate | null>(null);
  const [certForm, setCertForm] = useState<Omit<Certificate, "id" | "user_id" | "created_at">>({
    title: "", organization: "", issue_date: "", expiry_date: "",
    credential_id: "", credential_url: "",
  });
  const [savingCert, setSavingCert] = useState(false);

  // Form states
  const [showProjectForm, setShowProjectForm] = useState(false);
  const [showSkillForm, setShowSkillForm] = useState(false);
  const [editingProject, setEditingProject] = useState<PortfolioProject | null>(
    null,
  );
  const [projectForm, setProjectForm] = useState<Partial<PortfolioProject>>({
    title: "",
    description: "",
    technologies: [],
    project_url: "",
    github_url: "",
  });
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [newSkillName, setNewSkillName] = useState("");
  const [saving, setSaving] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const techInputRef = useRef<HTMLInputElement>(null);
  const [techInput, setTechInput] = useState("");

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [portfolioRes, mySkillsRes, certsRes] = await Promise.all([
        getPortfolio(),
        getMySkills(),
        getCertificates(),
      ]);

      // Ensure technologies is always an array for each project
      const processedProjects = (portfolioRes.data || []).map((project) => ({
        ...project,
        technologies: Array.isArray(project.technologies)
          ? project.technologies
          : typeof project.technologies === "string"
            ? JSON.parse(project.technologies || "[]")
            : [],
      }));

      setProjects(processedProjects);
      setMySkills(mySkillsRes.data || []);
      setCertificates(certsRes.data || []);
    } catch (err: any) {
      setError(err.message || "Failed to load portfolio data");
    } finally {
      setLoading(false);
    }
  };

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedImage(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleAddTechnology = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && techInput.trim()) {
      e.preventDefault();
      const tech = techInput.trim();
      if (!projectForm.technologies?.includes(tech)) {
        setProjectForm({
          ...projectForm,
          technologies: [...(projectForm.technologies || []), tech],
        });
      }
      setTechInput("");
    }
  };

  const handleRemoveTechnology = (tech: string) => {
    setProjectForm({
      ...projectForm,
      technologies: projectForm.technologies?.filter((t) => t !== tech) || [],
    });
  };

  const handleSaveProject = async () => {
    if (!projectForm.title?.trim()) {
      setError("Project title is required");
      return;
    }

    setSaving(true);
    setError(null);

    try {
      if (editingProject?.id) {
        await updatePortfolio(
          editingProject.id,
          projectForm,
          selectedImage || undefined,
        );
        setSuccess("Project updated successfully!");
      } else {
        await createPortfolio(
          projectForm as PortfolioProject,
          selectedImage || undefined,
        );
        setSuccess("Project created successfully!");
      }

      await fetchData();
      setShowProjectForm(false);
      resetProjectForm();
      setTimeout(() => setSuccess(null), 3000);
    } catch (err: any) {
      setError(err.message || "Failed to save project");
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteProject = async (projectId: number) => {
    if (!confirm("Are you sure you want to delete this project?")) return;

    try {
      await deletePortfolio(projectId);
      setSuccess("Project deleted successfully!");
      await fetchData();
      setTimeout(() => setSuccess(null), 3000);
    } catch (err: any) {
      setError(err.message || "Failed to delete project");
    }
  };

  const handleAddSkill = async () => {
    if (!newSkillName.trim()) return;

    try {
      await addSkills(newSkillName.trim());
      setSuccess("Skill added successfully!");
      setNewSkillName("");
      await fetchData();
      setTimeout(() => setSuccess(null), 3000);
    } catch (err: any) {
      setError(err.message || "Failed to add skill");
    }
  };

  // ── Certificate handlers ────────────────────────────────
  const resetCertForm = () => {
    setCertForm({ title: "", organization: "", issue_date: "", expiry_date: "", credential_id: "", credential_url: "" });
    setEditingCert(null);
  };

  const openCertForm = (cert?: Certificate) => {
    if (cert) {
      setEditingCert(cert);
      setCertForm({
        title: cert.title, organization: cert.organization || "",
        issue_date: cert.issue_date ? cert.issue_date.split("T")[0] : "",
        expiry_date: cert.expiry_date ? cert.expiry_date.split("T")[0] : "",
        credential_id: cert.credential_id || "", credential_url: cert.credential_url || "",
      });
    } else {
      resetCertForm();
    }
    setShowCertForm(true);
  };

  const handleSaveCert = async () => {
    if (!certForm.title.trim()) { setError("Certificate title is required"); return; }
    setSavingCert(true);
    setError(null);
    try {
      if (editingCert) {
        await updateCertificate(editingCert.id, certForm);
        setSuccess("Certificate updated!");
      } else {
        await addCertificate(certForm);
        setSuccess("Certificate added!");
      }
      const res = await getCertificates();
      setCertificates(res.data || []);
      setShowCertForm(false);
      resetCertForm();
      setTimeout(() => setSuccess(null), 3000);
    } catch (err: any) {
      setError(err.message || "Failed to save certificate");
    } finally {
      setSavingCert(false);
    }
  };

  const handleDeleteCert = async (id: number) => {
    if (!confirm("Delete this certificate?")) return;
    try {
      await deleteCertificate(id);
      setCertificates((prev) => prev.filter((c) => c.id !== id));
      setSuccess("Certificate deleted");
      setTimeout(() => setSuccess(null), 3000);
    } catch (err: any) {
      setError(err.message || "Failed to delete certificate");
    }
  };

  const openProjectForm = (project?: PortfolioProject) => {
    if (project) {
      setEditingProject(project);
      setProjectForm({
        title: project.title,
        description: project.description,
        technologies: project.technologies || [],
        project_url: project.project_url,
        github_url: project.github_url,
      });
      setImagePreview(project.image_url || null);
    } else {
      setEditingProject(null);
      resetProjectForm();
    }
    setShowProjectForm(true);
  };

  const resetProjectForm = () => {
    setProjectForm({
      title: "",
      description: "",
      technologies: [],
      project_url: "",
      github_url: "",
    });
    setSelectedImage(null);
    setImagePreview(null);
    setTechInput("");
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div
      className={`min-h-screen p-6 ${darkMode ? "bg-gray-900" : "bg-gray-50"}`}
    >
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1
            className={`text-3xl font-bold mb-2 ${darkMode ? "text-white" : "text-gray-900"}`}
          >
            Portfolio & Skills
          </h1>
          <p className={`${darkMode ? "text-gray-400" : "text-gray-600"}`}>
            Showcase your projects and manage your skills
          </p>
        </div>

        {/* Success/Error Messages */}
        {success && (
          <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg flex items-center">
            <CheckCircle className="w-5 h-5 text-green-600 mr-3" />
            <span className="text-green-700">{success}</span>
          </div>
        )}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center">
            <AlertCircle className="w-5 h-5 text-red-600 mr-3" />
            <span className="text-red-700">{error}</span>
          </div>
        )}

        {/* Skills Section */}
        <div
          className={`mb-8 p-6 rounded-xl ${darkMode ? "bg-gray-800" : "bg-white shadow-lg"}`}
        >
          <div className="flex items-center justify-between mb-6">
            <h2
              className={`text-xl font-semibold ${darkMode ? "text-white" : "text-gray-900"}`}
            >
              My Skills
            </h2>
            <button
              onClick={() => setShowSkillForm(!showSkillForm)}
              className="flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
            >
              <Plus className="w-4 h-4 mr-2" />
              {showSkillForm ? "Hide Form" : "Add Skill"}
            </button>
          </div>

          {/* Skills Display */}
          <div className="flex flex-wrap gap-2 mb-6">
            {mySkills.length === 0 ? (
              <p className={`${darkMode ? "text-gray-400" : "text-gray-500"}`}>
                No skills added yet. Click "Add Skill" to get started.
              </p>
            ) : (
              mySkills.map((skill) => (
                <span
                  key={skill.id}
                  className={`px-3 py-1 rounded-full text-sm font-medium ${
                    darkMode
                      ? "bg-green-900 text-green-200"
                      : "bg-green-100 text-green-800"
                  }`}
                >
                  {skill.skill_name}
                </span>
              ))
            )}
          </div>

          {/* Add Skill Form */}
          {showSkillForm && (
            <div
              className={`p-6 rounded-lg border ${darkMode ? "bg-gray-700 border-gray-600" : "bg-gray-50 border-gray-200"}`}
            >
              <div className="mb-4">
                <h3
                  className={`text-lg font-semibold mb-2 ${darkMode ? "text-white" : "text-gray-900"}`}
                >
                  Add New Skill
                </h3>
                <p
                  className={`text-sm ${darkMode ? "text-gray-400" : "text-gray-600"}`}
                >
                  Enhance your skill set by adding new technologies
                </p>
              </div>

              <div className="mb-4">
                <label
                  className={`block text-sm font-semibold mb-3 ${darkMode ? "text-gray-200" : "text-gray-700"}`}
                >
                  Skill Name
                </label>
                <input
                  type="text"
                  value={newSkillName}
                  onChange={(e) => setNewSkillName(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleAddSkill()}
                  className={`w-full px-4 py-3 rounded-lg border focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all duration-200 ${
                    darkMode
                      ? "bg-gray-600 border-gray-500 text-white placeholder-gray-400"
                      : "bg-white border-gray-300 text-gray-900 placeholder-gray-500"
                  }`}
                  placeholder="e.g., React, Node.js, Python, TypeScript"
                />
                <div
                  className={`mt-3 flex flex-wrap gap-2 ${darkMode ? "text-gray-400" : "text-gray-500"}`}
                >
                  <span className="text-xs">Popular skills:</span>
                  {["React", "JavaScript", "Python", "TypeScript"].map(
                    (skill) => (
                      <button
                        key={skill}
                        onClick={() => setNewSkillName(skill)}
                        className={`px-2 py-1 text-xs rounded-md transition-colors ${
                          darkMode
                            ? "bg-gray-600 hover:bg-gray-500"
                            : "bg-gray-100 hover:bg-gray-200"
                        }`}
                      >
                        {skill}
                      </button>
                    ),
                  )}
                </div>
              </div>

              <div
                className={`p-4 rounded-lg mb-4 ${darkMode ? "bg-gray-600" : "bg-gray-100"}`}
              >
                <div className="flex items-start space-x-3">
                  <AlertCircle
                    className={`w-5 h-5 mt-0.5 ${darkMode ? "text-blue-400" : "text-blue-600"}`}
                  />
                  <div>
                    <p
                      className={`text-sm font-medium mb-1 ${darkMode ? "text-gray-200" : "text-gray-700"}`}
                    >
                      Pro tip
                    </p>
                    <p
                      className={`text-xs ${darkMode ? "text-gray-400" : "text-gray-600"}`}
                    >
                      Add specific technologies and frameworks to showcase your
                      expertise. Include both frontend and backend skills.
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setShowSkillForm(false);
                    setNewSkillName("");
                  }}
                  className={`flex-1 py-3 px-6 rounded-lg font-medium transition-all duration-200 ${
                    darkMode
                      ? "bg-gray-600 text-gray-300 hover:bg-gray-500"
                      : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                  }`}
                >
                  Cancel
                </button>
                <button
                  onClick={handleAddSkill}
                  disabled={!newSkillName.trim()}
                  className="flex-1 py-3 px-6 bg-gradient-to-r from-green-600 to-green-700 text-white rounded-lg font-medium hover:from-green-700 hover:to-green-800 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Add Skill
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Projects Section */}
        <div
          className={`p-6 rounded-xl ${darkMode ? "bg-gray-800" : "bg-white shadow-lg"}`}
        >
          <div className="flex items-center justify-between mb-6">
            <h2
              className={`text-xl font-semibold ${darkMode ? "text-white" : "text-gray-900"}`}
            >
              Projects ({projects.length})
            </h2>
            <button
              onClick={() => openProjectForm()}
              className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Plus className="w-4 h-4 mr-2" />
              {showProjectForm ? "Hide Form" : "Add Project"}
            </button>
          </div>

          {/* Add/Edit Project Form */}
          {showProjectForm && (
            <div
              className={`mb-8 p-6 rounded-lg border ${darkMode ? "bg-gray-700 border-gray-600" : "bg-gray-50 border-gray-200"}`}
            >
              <div className="mb-6">
                <h3
                  className={`text-lg font-semibold mb-2 ${darkMode ? "text-white" : "text-gray-900"}`}
                >
                  {editingProject ? "Edit Project" : "Add New Project"}
                </h3>
                <p
                  className={`text-sm ${darkMode ? "text-gray-400" : "text-gray-600"}`}
                >
                  {editingProject
                    ? "Update your project details"
                    : "Showcase your amazing work"}
                </p>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Left Column */}
                <div className="space-y-6">
                  {/* Image Upload */}
                  <div>
                    <label
                      className={`block text-sm font-semibold mb-3 ${darkMode ? "text-gray-200" : "text-gray-700"}`}
                    >
                      Project Image
                    </label>
                    <div
                      onClick={() => fileInputRef.current?.click()}
                      className={`group relative w-full h-48 border-2 border-dashed rounded-xl flex flex-col items-center justify-center cursor-pointer transition-all duration-200 ${
                        darkMode
                          ? "border-gray-600 hover:border-blue-500 bg-gray-600/50 hover:bg-gray-600"
                          : "border-gray-300 hover:border-blue-400 bg-gray-100 hover:bg-gray-50"
                      }`}
                    >
                      {imagePreview ? (
                        <div className="relative w-full h-full">
                          <img
                            src={imagePreview}
                            alt="Preview"
                            className="w-full h-full object-cover rounded-lg"
                          />
                          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-200 rounded-lg flex items-center justify-center">
                            <div className="text-white text-center">
                              <Upload className="w-8 h-8 mx-auto mb-2" />
                              <p className="text-sm">Change image</p>
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div className="text-center">
                          <div
                            className={`w-16 h-16 mx-auto mb-3 rounded-full flex items-center justify-center ${
                              darkMode ? "bg-gray-500" : "bg-gray-200"
                            }`}
                          >
                            <ImageIcon
                              className={`w-8 h-8 ${darkMode ? "text-gray-400" : "text-gray-500"}`}
                            />
                          </div>
                          <p
                            className={`text-sm font-medium mb-1 ${darkMode ? "text-gray-300" : "text-gray-700"}`}
                          >
                            Upload project image
                          </p>
                          <p
                            className={`text-xs ${darkMode ? "text-gray-500" : "text-gray-400"}`}
                          >
                            PNG, JPG, GIF up to 10MB
                          </p>
                        </div>
                      )}
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        onChange={handleImageSelect}
                        className="hidden"
                      />
                    </div>
                  </div>

                  {/* Title */}
                  <div>
                    <label
                      className={`block text-sm font-semibold mb-3 ${darkMode ? "text-gray-200" : "text-gray-700"}`}
                    >
                      Project Title <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={projectForm.title || ""}
                      onChange={(e) =>
                        setProjectForm({
                          ...projectForm,
                          title: e.target.value,
                        })
                      }
                      className={`w-full px-4 py-3 rounded-lg border focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 ${
                        darkMode
                          ? "bg-gray-600 border-gray-500 text-white placeholder-gray-400"
                          : "bg-white border-gray-300 text-gray-900 placeholder-gray-500"
                      }`}
                      placeholder="e.g., E-commerce Platform, Mobile App"
                    />
                  </div>

                  {/* Description */}
                  <div>
                    <label
                      className={`block text-sm font-semibold mb-3 ${darkMode ? "text-gray-200" : "text-gray-700"}`}
                    >
                      Description
                    </label>
                    <textarea
                      value={projectForm.description || ""}
                      onChange={(e) =>
                        setProjectForm({
                          ...projectForm,
                          description: e.target.value,
                        })
                      }
                      rows={4}
                      className={`w-full px-4 py-3 rounded-lg border focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 resize-none ${
                        darkMode
                          ? "bg-gray-600 border-gray-500 text-white placeholder-gray-400"
                          : "bg-white border-gray-300 text-gray-900 placeholder-gray-500"
                      }`}
                      placeholder="Describe your project, its purpose, and what you accomplished..."
                    />
                  </div>
                </div>

                {/* Right Column */}
                <div className="space-y-6">
                  {/* Technologies */}
                  <div>
                    <label
                      className={`block text-sm font-semibold mb-3 ${darkMode ? "text-gray-200" : "text-gray-700"}`}
                    >
                      Technologies Used
                    </label>
                    <div
                      className={`flex flex-wrap gap-2 mb-3 min-h-[2rem] ${darkMode ? "text-white" : ""}`}
                    >
                      {projectForm.technologies?.map((tech) => (
                        <span
                          key={tech}
                          className={`group flex items-center px-3 py-1.5 rounded-full text-sm font-medium transition-all duration-200 ${
                            darkMode
                              ? "bg-gradient-to-r from-blue-900 to-purple-900 text-blue-200 hover:from-red-900 hover:to-red-800"
                              : "bg-gradient-to-r from-blue-100 to-purple-100 text-blue-800 hover:from-red-100 hover:to-red-100"
                          }`}
                        >
                          {tech}
                          <button
                            onClick={() => handleRemoveTechnology(tech)}
                            className="ml-2 opacity-60 group-hover:opacity-100 transition-opacity"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </span>
                      ))}
                    </div>
                    <input
                      ref={techInputRef}
                      type="text"
                      value={techInput}
                      onChange={(e) => setTechInput(e.target.value)}
                      onKeyDown={handleAddTechnology}
                      className={`w-full px-4 py-3 rounded-lg border focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 ${
                        darkMode
                          ? "bg-gray-600 border-gray-500 text-white placeholder-gray-400"
                          : "bg-white border-gray-300 text-gray-900 placeholder-gray-500"
                      }`}
                      placeholder="e.g., React, Node.js, TypeScript (press Enter to add)"
                    />
                  </div>

                  {/* URLs */}
                  <div className="space-y-4">
                    <div>
                      <label
                        className={`block text-sm font-semibold mb-3 ${darkMode ? "text-gray-200" : "text-gray-700"}`}
                      >
                        <div className="flex items-center space-x-2">
                          <ExternalLink className="w-4 h-4" />
                          <span>Live Demo URL</span>
                        </div>
                      </label>
                      <input
                        type="url"
                        value={projectForm.project_url || ""}
                        onChange={(e) =>
                          setProjectForm({
                            ...projectForm,
                            project_url: e.target.value,
                          })
                        }
                        className={`w-full px-4 py-3 rounded-lg border focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 ${
                          darkMode
                            ? "bg-gray-600 border-gray-500 text-white placeholder-gray-400"
                            : "bg-white border-gray-300 text-gray-900 placeholder-gray-500"
                        }`}
                        placeholder="https://your-project.com"
                      />
                    </div>
                    <div>
                      <label
                        className={`block text-sm font-semibold mb-3 ${darkMode ? "text-gray-200" : "text-gray-700"}`}
                      >
                        <div className="flex items-center space-x-2">
                          <Code className="w-4 h-4" />
                          <span>GitHub URL</span>
                        </div>
                      </label>
                      <input
                        type="url"
                        value={projectForm.github_url || ""}
                        onChange={(e) =>
                          setProjectForm({
                            ...projectForm,
                            github_url: e.target.value,
                          })
                        }
                        className={`w-full px-4 py-3 rounded-lg border focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 ${
                          darkMode
                            ? "bg-gray-600 border-gray-500 text-white placeholder-gray-400"
                            : "bg-white border-gray-300 text-gray-900 placeholder-gray-500"
                        }`}
                        placeholder="https://github.com/username/repo"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Form Actions */}
              <div
                className={`mt-6 pt-6 border-t ${darkMode ? "border-gray-600" : "border-gray-200"}`}
              >
                <div className="flex gap-3">
                  <button
                    onClick={() => {
                      setShowProjectForm(false);
                      resetProjectForm();
                    }}
                    className={`flex-1 py-3 px-6 rounded-lg font-medium transition-all duration-200 ${
                      darkMode
                        ? "bg-gray-600 text-gray-300 hover:bg-gray-500"
                        : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                    }`}
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSaveProject}
                    disabled={saving}
                    className="flex-1 py-3 px-6 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg font-medium hover:from-blue-700 hover:to-blue-800 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                  >
                    {saving ? (
                      <>
                        <Loader className="w-5 h-5 animate-spin mr-2" />
                        Saving...
                      </>
                    ) : editingProject ? (
                      "Update Project"
                    ) : (
                      "Create Project"
                    )}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Projects Display */}
          {projects.length === 0 && !showProjectForm ? (
            <div className="text-center py-12">
              <Briefcase className="w-16 h-16 mx-auto mb-4 text-gray-300" />
              <h3
                className={`text-lg font-medium mb-2 ${darkMode ? "text-gray-300" : "text-gray-700"}`}
              >
                No projects yet
              </h3>
              <p
                className={`${darkMode ? "text-gray-400" : "text-gray-500"} mb-4`}
              >
                Add your first project to showcase your work
              </p>
              <button
                onClick={() => openProjectForm()}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Add Your First Project
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {projects.map((project) => (
                <div
                  key={project.id}
                  className={`rounded-lg overflow-hidden border ${
                    darkMode
                      ? "bg-gray-700 border-gray-600"
                      : "bg-white border-gray-200"
                  }`}
                >
                  {/* Project Image */}
                  <div className="aspect-video bg-gray-200 relative">
                    {project.image_url ? (
                      <img
                        src={project.image_url}
                        alt={project.title}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-gray-100">
                        <ImageIcon className="w-12 h-12 text-gray-300" />
                      </div>
                    )}
                  </div>

                  {/* Project Info */}
                  <div className="p-4">
                    <h3
                      className={`font-semibold text-lg mb-2 ${darkMode ? "text-white" : "text-gray-900"}`}
                    >
                      {project.title}
                    </h3>
                    <p
                      className={`text-sm mb-3 line-clamp-2 ${darkMode ? "text-gray-300" : "text-gray-600"}`}
                    >
                      {project.description || "No description provided"}
                    </p>

                    {/* Technologies */}
                    {(() => {
                      const technologies = Array.isArray(project.technologies)
                        ? project.technologies
                        : typeof project.technologies === "string"
                          ? JSON.parse(project.technologies || "[]")
                          : [];

                      return (
                        technologies.length > 0 && (
                          <div className="flex flex-wrap gap-1 mb-3">
                            {technologies.slice(0, 4).map((tech, idx) => (
                              <span
                                key={idx}
                                className={`px-2 py-0.5 text-xs rounded ${
                                  darkMode
                                    ? "bg-gray-600 text-gray-200"
                                    : "bg-gray-100 text-gray-700"
                                }`}
                              >
                                {tech}
                              </span>
                            ))}
                            {technologies.length > 4 && (
                              <span
                                className={`text-xs px-2 py-0.5 ${darkMode ? "text-gray-400" : "text-gray-500"}`}
                              >
                                +{technologies.length - 4} more
                              </span>
                            )}
                          </div>
                        )
                      );
                    })()}

                    {/* Links */}
                    <div className="flex gap-3 mb-3">
                      {project.project_url && (
                        <a
                          href={project.project_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className={`flex items-center text-sm ${
                            darkMode
                              ? "text-blue-400 hover:text-blue-300"
                              : "text-blue-600 hover:text-blue-800"
                          }`}
                        >
                          <ExternalLink className="w-4 h-4 mr-1" />
                          Live Demo
                        </a>
                      )}
                      {project.github_url && (
                        <a
                          href={project.github_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className={`flex items-center text-sm ${
                            darkMode
                              ? "text-blue-400 hover:text-blue-300"
                              : "text-blue-600 hover:text-blue-800"
                          }`}
                        >
                          <Code className="w-4 h-4 mr-1" />
                          Source Code
                        </a>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="flex gap-2 pt-3 border-t border-gray-200 dark:border-gray-600">
                      <button
                        onClick={() => openProjectForm(project)}
                        className={`flex-1 flex items-center justify-center py-2 rounded-lg text-sm font-medium transition-colors ${
                          darkMode
                            ? "bg-gray-600 text-white hover:bg-gray-500"
                            : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                        }`}
                      >
                        <Edit2 className="w-4 h-4 mr-1" />
                        Edit
                      </button>
                      <button
                        onClick={() => handleDeleteProject(project.id)}
                        className="flex items-center justify-center px-3 py-2 rounded-lg text-sm font-medium bg-red-100 text-red-700 hover:bg-red-200 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Certificates Section */}
        <div className={`p-6 rounded-xl ${darkMode ? "bg-gray-800" : "bg-white shadow-lg relative top-2"}`}>
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-amber-100 flex items-center justify-center">
                <Award className="w-5 h-5 text-amber-600" />
              </div>
              <div>
                <h2 className={`text-xl font-semibold ${darkMode ? "text-white" : "text-gray-900"}`}>Certificates</h2>
                <p className={`text-sm ${darkMode ? "text-gray-400" : "text-gray-500"}`}>{certificates.length} certificate{certificates.length !== 1 ? "s" : ""}</p>
              </div>
            </div>
            <button onClick={() => openCertForm()}
              className="flex items-center px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white rounded-lg transition-colors text-sm font-medium">
              <Plus className="w-4 h-4 mr-2" />
              Add Certificate
            </button>
          </div>

          {/* Certificate Form */}
          {showCertForm && (
            <div className={`mb-6 p-6 rounded-xl border ${darkMode ? "bg-gray-700 border-gray-600" : "bg-amber-50 border-amber-200"}`}>
              <h3 className={`text-lg font-semibold mb-4 ${darkMode ? "text-white" : "text-gray-900"}`}>
                {editingCert ? "Edit Certificate" : "Add New Certificate"}
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <label className={`block text-sm font-medium mb-1.5 ${darkMode ? "text-gray-300" : "text-gray-700"}`}>Title <span className="text-red-500">*</span></label>
                  <input type="text" value={certForm.title}
                    onChange={(e) => setCertForm((p) => ({ ...p, title: e.target.value }))}
                    className={`w-full px-3 py-2.5 rounded-lg border text-sm outline-none focus:ring-2 focus:ring-amber-400 focus:border-amber-400 ${darkMode ? "bg-gray-600 border-gray-500 text-white" : "bg-white border-gray-300"}`}
                    placeholder="e.g. ALX Certified Developer" />
                </div>
                <div>
                  <label className={`block text-sm font-medium mb-1.5 ${darkMode ? "text-gray-300" : "text-gray-700"}`}>Issuing Organization</label>
                  <input type="text" value={certForm.organization || ""}
                    onChange={(e) => setCertForm((p) => ({ ...p, organization: e.target.value }))}
                    className={`w-full px-3 py-2.5 rounded-lg border text-sm outline-none focus:ring-2 focus:ring-amber-400 focus:border-amber-400 ${darkMode ? "bg-gray-600 border-gray-500 text-white" : "bg-white border-gray-300"}`}
                    placeholder="e.g. ALX" />
                </div>
                <div>
                  <label className={`block text-sm font-medium mb-1.5 ${darkMode ? "text-gray-300" : "text-gray-700"}`}>Credential ID</label>
                  <input type="text" value={certForm.credential_id || ""}
                    onChange={(e) => setCertForm((p) => ({ ...p, credential_id: e.target.value }))}
                    className={`w-full px-3 py-2.5 rounded-lg border text-sm outline-none focus:ring-2 focus:ring-amber-400 focus:border-amber-400 ${darkMode ? "bg-gray-600 border-gray-500 text-white" : "bg-white border-gray-300"}`}
                    placeholder="e.g. ABC-12345" />
                </div>
                <div>
                  <label className={`block text-sm font-medium mb-1.5 ${darkMode ? "text-gray-300" : "text-gray-700"}`}>Issue Date</label>
                  <input type="date" value={certForm.issue_date || ""}
                    onChange={(e) => setCertForm((p) => ({ ...p, issue_date: e.target.value }))}
                    className={`w-full px-3 py-2.5 rounded-lg border text-sm outline-none focus:ring-2 focus:ring-amber-400 focus:border-amber-400 ${darkMode ? "bg-gray-600 border-gray-500 text-white" : "bg-white border-gray-300"}`} />
                </div>
                <div>
                  <label className={`block text-sm font-medium mb-1.5 ${darkMode ? "text-gray-300" : "text-gray-700"}`}>Expiry Date <span className={`text-xs ${darkMode ? "text-gray-500" : "text-gray-400"}`}>(optional)</span></label>
                  <input type="date" value={certForm.expiry_date || ""}
                    onChange={(e) => setCertForm((p) => ({ ...p, expiry_date: e.target.value }))}
                    className={`w-full px-3 py-2.5 rounded-lg border text-sm outline-none focus:ring-2 focus:ring-amber-400 focus:border-amber-400 ${darkMode ? "bg-gray-600 border-gray-500 text-white" : "bg-white border-gray-300"}`} />
                </div>
                <div className="md:col-span-2">
                  <label className={`block text-sm font-medium mb-1.5 ${darkMode ? "text-gray-300" : "text-gray-700"}`}>Credential URL</label>
                  <input type="url" value={certForm.credential_url || ""}
                    onChange={(e) => setCertForm((p) => ({ ...p, credential_url: e.target.value }))}
                    className={`w-full px-3 py-2.5 rounded-lg border text-sm outline-none focus:ring-2 focus:ring-amber-400 focus:border-amber-400 ${darkMode ? "bg-gray-600 border-gray-500 text-white" : "bg-white border-gray-300"}`}
                    placeholder=" " />
                </div>
              </div>
              <div className="flex gap-3 mt-5">
                <button onClick={() => { setShowCertForm(false); resetCertForm(); }}
                  className={`flex-1 py-2.5 rounded-lg text-sm font-medium border transition-colors ${darkMode ? "border-gray-600 text-gray-300 hover:bg-gray-600" : "border-gray-300 text-gray-600 hover:bg-gray-100"}`}>
                  Cancel
                </button>
                <button onClick={handleSaveCert} disabled={savingCert || !certForm.title.trim()}
                  className="flex-1 py-2.5 bg-amber-500 hover:bg-amber-600 text-white rounded-lg text-sm font-medium flex items-center justify-center gap-2 disabled:opacity-50 transition-colors">
                  {savingCert ? <Loader className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
                  {savingCert ? "Saving..." : editingCert ? "Update" : "Add Certificate"}
                </button>
              </div>
            </div>
          )}

          {/* Certificates List */}
          {certificates.length === 0 && !showCertForm ? (
            <div className="text-center py-12">
              <div className="w-16 h-16 rounded-full bg-amber-100 flex items-center justify-center mx-auto mb-4">
                <Award className="w-8 h-8 text-amber-400" />
              </div>
              <h3 className={`text-lg font-medium mb-2 ${darkMode ? "text-gray-300" : "text-gray-700"}`}>No certificates yet</h3>
              <p className={`text-sm mb-4 ${darkMode ? "text-gray-400" : "text-gray-500"}`}>Add your certifications to boost your profile strength</p>
              <button onClick={() => openCertForm()}
                className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white rounded-lg text-sm transition-colors">
                Add Your First Certificate
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {certificates.map((cert) => (
                <div key={cert.id}
                  className={`rounded-xl border p-5 flex gap-4 ${darkMode ? "bg-gray-700 border-gray-600" : "bg-white border-gray-200"}`}>
                  <div className="w-12 h-12 rounded-xl bg-amber-100 flex items-center justify-center flex-shrink-0">
                    <BadgeCheck className="w-6 h-6 text-amber-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <h3 className={`font-semibold text-sm leading-tight ${darkMode ? "text-white" : "text-gray-900"}`}>{cert.title}</h3>
                      <div className="flex gap-1 flex-shrink-0">
                        <button onClick={() => openCertForm(cert)}
                          className={`p-1.5 rounded-lg transition-colors ${darkMode ? "hover:bg-gray-600 text-gray-400" : "hover:bg-gray-100 text-gray-500"}`}>
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button onClick={() => handleDeleteCert(cert.id)}
                          className="p-1.5 rounded-lg hover:bg-red-100 text-red-500 transition-colors">
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                    {cert.organization && (
                      <p className={`text-xs mt-0.5 ${darkMode ? "text-gray-400" : "text-gray-500"}`}>{cert.organization}</p>
                    )}
                    <div className="flex flex-wrap gap-3 mt-2">
                      {cert.issue_date && (
                        <span className={`flex items-center gap-1 text-xs ${darkMode ? "text-gray-400" : "text-gray-500"}`}>
                          <Calendar className="w-3 h-3" />
                          {new Date(cert.issue_date).toLocaleDateString("en-US", { month: "short", year: "numeric" })}
                          {cert.expiry_date && ` – ${new Date(cert.expiry_date).toLocaleDateString("en-US", { month: "short", year: "numeric" })}`}
                        </span>
                      )}
                      {cert.credential_id && (
                        <span className={`text-xs font-mono ${darkMode ? "text-gray-500" : "text-gray-400"}`}>ID: {cert.credential_id}</span>
                      )}
                    </div>
                    {cert.credential_url && (
                      <a href={cert.credential_url} target="_blank" rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 mt-2 text-xs text-amber-600 hover:text-amber-700 font-medium">
                        <Link2 className="w-3 h-3" /> Verify credential
                      </a>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>
    </div>
  );
};

export default Portfolio;
