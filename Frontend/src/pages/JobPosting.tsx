import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router";
import {
  ArrowLeft, Plus, X, DollarSign, Clock, Users,
  FileText, CheckCircle, AlertCircle, ChevronRight,
} from "lucide-react";
import { API_BASE_URL } from "../config/api";

export default function JobPosting() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [categories, setCategories] = useState<{ id: number; name: string }[]>([]);
  const [currentSkill, setCurrentSkill] = useState("");

  const [jobData, setJobData] = useState({
    title: "",
    category: "",
    category_id: 0,
    description: "",
    skills: [] as string[],
    scope: "medium",
    duration: "",
    experience: "intermediate",
    budget: { type: "fixed", min: "", max: "", fixed: "" },
  });

  useEffect(() => {
    fetch(`${API_BASE_URL}/api/jobs/categories`)
      .then((r) => r.json())
      .then((data) => setCategories(data.data || []))
      .catch(() => {});
  }, []);

  const addSkill = () => {
    const s = currentSkill.trim();
    if (s && !jobData.skills.includes(s)) {
      setJobData({ ...jobData, skills: [...jobData.skills, s] });
      setCurrentSkill("");
    }
  };

  const removeSkill = (skill: string) =>
    setJobData({ ...jobData, skills: jobData.skills.filter((s) => s !== skill) });

  const validateStep = (s: number): boolean => {
    const e: Record<string, string> = {};
    if (s === 1) {
      if (!jobData.title.trim()) e.title = "Job title is required";
      else if (jobData.title.length < 10) e.title = "At least 10 characters";
      if (!jobData.category_id) e.category = "Please select a category";
      if (!jobData.description.trim()) e.description = "Description is required";
      else if (jobData.description.length < 50) e.description = "At least 50 characters";
    }
    if (s === 2 && jobData.skills.length === 0) e.skills = "Add at least one skill";
    if (s === 3) {
      if (!jobData.duration) e.duration = "Please select a duration";
      if (jobData.budget.type === "hourly") {
        if (!jobData.budget.min || !jobData.budget.max) e.budget = "Enter both min and max rates";
        else if (parseInt(jobData.budget.min) >= parseInt(jobData.budget.max)) e.budget = "Max must be greater than min";
      } else if (!jobData.budget.fixed) e.budget = "Please enter a budget";
    }
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const next = () => { if (validateStep(step)) setStep(step + 1); };
  const back = () => { setStep(step - 1); setErrors({}); };

  const handleSubmit = async () => {
    if (!validateStep(4)) return;
    setIsSubmitting(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/jobs/employer/jobs`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify({
          title: jobData.title,
          description: jobData.description,
          category_id: jobData.category_id,
          experience_level: jobData.experience,
          salary: jobData.budget.type === "fixed"
            ? jobData.budget.fixed
            : `${jobData.budget.min}-${jobData.budget.max}`,
          budget_type: jobData.budget.type,
          duration: jobData.duration,
          location: "Remote",
          remote_allowed: true,
          token_cost: 10,
          skills: jobData.skills,
        }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message || "Failed to create job");
      }
      navigate("/employer-dashboard");
    } catch (err: any) {
      setErrors({ submit: err.message || "Failed to post job. Please try again." });
    } finally {
      setIsSubmitting(false);
    }
  };

  const STEPS = ["Job Details", "Skills", "Scope & Budget", "Review"];

  const POPULAR_SKILLS = ["JavaScript", "React", "Node.js", "Python", "UI/UX Design", "WordPress", "TypeScript", "Figma"];

  const field = (label: string, error?: string, children?: React.ReactNode) => (
    <div>
      <label className="block text-sm font-semibold text-gray-700 mb-1.5">{label}</label>
      {children}
      {error && (
        <p className="flex items-center gap-1 text-xs text-red-500 mt-1.5">
          <AlertCircle className="w-3.5 h-3.5" /> {error}
        </p>
      )}
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-50">

      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <Link to="/employer-dashboard" className="flex items-center gap-2 text-sm font-medium text-gray-500 hover:text-gray-900 transition-colors">
            <ArrowLeft className="w-4 h-4" /> Back
          </Link>
          <span className="etn-brand-fancy text-2xl">ETN</span>
          <span className="text-sm text-gray-400">Step {step} of 4</span>
        </div>
      </header>

      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-10">

        {/* Progress */}
        <div className="mb-10">
          <div className="flex items-center gap-0">
            {STEPS.map((label, i) => {
              const s = i + 1;
              const done = s < step;
              const active = s === step;
              return (
                <div key={s} className="flex items-center flex-1 last:flex-none">
                  <div className="flex flex-col items-center gap-1.5">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-all ${
                      done ? "bg-[#0084ca] text-white" : active ? "bg-[#0084ca] text-white ring-4 ring-[#0084ca]/20" : "bg-white border-2 border-gray-200 text-gray-400"
                    }`}>
                      {done ? <CheckCircle className="w-4 h-4" /> : s}
                    </div>
                    <span className={`text-xs font-medium hidden sm:block ${active ? "text-[#0084ca]" : done ? "text-gray-500" : "text-gray-400"}`}>
                      {label}
                    </span>
                  </div>
                  {s < 4 && (
                    <div className={`flex-1 h-0.5 mx-2 mb-5 transition-all ${done ? "bg-[#0084ca]" : "bg-gray-200"}`} />
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Card */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">

          {/* Card header */}
          <div className="px-8 py-6 border-b border-gray-100">
            <h1 className="text-xl font-bold text-gray-900">
              {step === 1 && "Job Details"}
              {step === 2 && "Required Skills"}
              {step === 3 && "Scope & Budget"}
              {step === 4 && "Review & Post"}
            </h1>
            <p className="text-sm text-gray-500 mt-1">
              {step === 1 && "Give your job post a clear title and description."}
              {step === 2 && "Add skills that candidates should have."}
              {step === 3 && "Set the project size, timeline, and budget."}
              {step === 4 && "Review everything before publishing."}
            </p>
          </div>

          <div className="px-8 py-8 space-y-6">

            {/* ── Step 1 ── */}
            {step === 1 && (
              <>
                {field("Job Title", errors.title,
                  <input
                    type="text"
                    value={jobData.title}
                    onChange={(e) => { setJobData({ ...jobData, title: e.target.value }); setErrors({ ...errors, title: "" }); }}
                    placeholder="e.g. Build a responsive website for my business"
                    className={`w-full px-4 py-2.5 rounded-xl border text-sm outline-none transition-colors focus:border-[#0084ca] focus:ring-2 focus:ring-[#0084ca]/10 ${errors.title ? "border-red-400" : "border-gray-200"}`}
                  />
                )}

                {field("Category", errors.category,
                  <select
                    value={jobData.category_id}
                    onChange={(e) => {
                      const sel = categories.find((c) => c.id === parseInt(e.target.value));
                      setJobData({ ...jobData, category_id: parseInt(e.target.value), category: sel?.name || "" });
                      setErrors({ ...errors, category: "" });
                    }}
                    className={`w-full px-4 py-2.5 rounded-xl border text-sm outline-none transition-colors focus:border-[#0084ca] focus:ring-2 focus:ring-[#0084ca]/10 bg-white ${errors.category ? "border-red-400" : "border-gray-200"}`}
                  >
                    <option value={0}>Select a category</option>
                    {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                )}

                {field("Description", errors.description,
                  <>
                    <textarea
                      value={jobData.description}
                      onChange={(e) => { setJobData({ ...jobData, description: e.target.value }); setErrors({ ...errors, description: "" }); }}
                      rows={7}
                      placeholder="Describe your project in detail — requirements, deliverables, and what success looks like..."
                      className={`w-full px-4 py-2.5 rounded-xl border text-sm outline-none transition-colors focus:border-[#0084ca] focus:ring-2 focus:ring-[#0084ca]/10 resize-none ${errors.description ? "border-red-400" : "border-gray-200"}`}
                    />
                    <p className="text-xs text-gray-400 mt-1 text-right">{jobData.description.length} / 5000</p>
                  </>
                )}
              </>
            )}

            {/* ── Step 2 ── */}
            {step === 2 && (
              <>
                {field("Add Skills", errors.skills,
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={currentSkill}
                      onChange={(e) => setCurrentSkill(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addSkill())}
                      placeholder="e.g. React, Node.js, Figma"
                      className="flex-1 px-4 py-2.5 rounded-xl border border-gray-200 text-sm outline-none focus:border-[#0084ca] focus:ring-2 focus:ring-[#0084ca]/10 transition-colors"
                    />
                    <button
                      onClick={addSkill}
                      className="px-4 py-2.5 bg-[#0084ca] hover:bg-[#006ba6] text-white rounded-xl transition-colors"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>
                )}

                {/* Selected skills */}
                {jobData.skills.length > 0 && (
                  <div>
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
                      Selected · {jobData.skills.length}
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {jobData.skills.map((skill) => (
                        <span key={skill} className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-50 border border-gray-200 text-gray-700 rounded-lg text-sm font-medium">
                          {skill}
                          <button onClick={() => removeSkill(skill)} className="text-gray-400 hover:text-red-500 transition-colors">
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Suggestions */}
                <div className={`rounded-xl border p-4 ${jobData.skills.length > 0 ? "border-gray-100 bg-gray-50" : "border-[#0084ca]/20 bg-[#0084ca]/5"}`}>
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Popular Skills</p>
                  <div className="flex flex-wrap gap-2">
                    {POPULAR_SKILLS.filter((s) => !jobData.skills.includes(s)).map((skill) => (
                      <button
                        key={skill}
                        onClick={() => setJobData({ ...jobData, skills: [...jobData.skills, skill] })}
                        className="px-3 py-1.5 bg-white border border-gray-200 text-gray-600 rounded-lg text-sm hover:border-[#0084ca] hover:text-[#0084ca] transition-colors"
                      >
                        + {skill}
                      </button>
                    ))}
                  </div>
                </div>
              </>
            )}

            {/* ── Step 3 ── */}
            {step === 3 && (
              <>
                {/* Project size */}
                <div>
                  <p className="text-sm font-semibold text-gray-700 mb-3">Project Size</p>
                  <div className="grid grid-cols-3 gap-3">
                    {[
                      { value: "small", icon: FileText, label: "Small", desc: "Quick task" },
                      { value: "medium", icon: Users, label: "Medium", desc: "Defined scope" },
                      { value: "large", icon: Clock, label: "Large", desc: "Complex project" },
                    ].map(({ value, icon: Icon, label, desc }) => (
                      <button
                        key={value}
                        onClick={() => setJobData({ ...jobData, scope: value })}
                        className={`p-4 rounded-xl border-2 text-left transition-all ${
                          jobData.scope === value
                            ? "border-[#0084ca] bg-[#0084ca]/5"
                            : "border-gray-200 hover:border-gray-300 bg-white"
                        }`}
                      >
                        <Icon className={`w-5 h-5 mb-2 ${jobData.scope === value ? "text-[#0084ca]" : "text-gray-400"}`} />
                        <p className={`text-sm font-semibold ${jobData.scope === value ? "text-[#0084ca]" : "text-gray-700"}`}>{label}</p>
                        <p className="text-xs text-gray-400 mt-0.5">{desc}</p>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Duration */}
                <div>
                  <p className="text-sm font-semibold text-gray-700 mb-3">Duration</p>
                  <select
                    value={jobData.duration}
                    onChange={(e) => { setJobData({ ...jobData, duration: e.target.value }); setErrors({ ...errors, duration: "" }); }}
                    className={`w-full px-4 py-2.5 rounded-xl border text-sm outline-none bg-white transition-colors focus:border-[#0084ca] focus:ring-2 focus:ring-[#0084ca]/10 ${errors.duration ? "border-red-400" : "border-gray-200"}`}
                  >
                    <option value="">Select duration</option>
                    <option value="less-than-1-month">Less than 1 month</option>
                    <option value="1-3-months">1 – 3 months</option>
                    <option value="3-6-months">3 – 6 months</option>
                    <option value="more-than-6-months">More than 6 months</option>
                  </select>
                  {errors.duration && <p className="flex items-center gap-1 text-xs text-red-500 mt-1.5"><AlertCircle className="w-3.5 h-3.5" />{errors.duration}</p>}
                </div>

                {/* Experience */}
                <div>
                  <p className="text-sm font-semibold text-gray-700 mb-3">Experience Level</p>
                  <div className="space-y-2">
                    {[
                      { value: "entry", label: "Entry Level", desc: "New to the field" },
                      { value: "intermediate", label: "Intermediate", desc: "Solid experience" },
                      { value: "expert", label: "Expert", desc: "Deep expertise" },
                    ].map(({ value, label, desc }) => (
                      <button
                        key={value}
                        onClick={() => setJobData({ ...jobData, experience: value })}
                        className={`w-full flex items-center justify-between px-4 py-3 rounded-xl border-2 text-left transition-all ${
                          jobData.experience === value
                            ? "border-[#0084ca] bg-[#0084ca]/5"
                            : "border-gray-200 hover:border-gray-300 bg-white"
                        }`}
                      >
                        <div>
                          <p className={`text-sm font-semibold ${jobData.experience === value ? "text-[#0084ca]" : "text-gray-700"}`}>{label}</p>
                          <p className="text-xs text-gray-400">{desc}</p>
                        </div>
                        {jobData.experience === value && <CheckCircle className="w-4 h-4 text-[#0084ca] flex-shrink-0" />}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Budget */}
                <div>
                  <p className="text-sm font-semibold text-gray-700 mb-3">Budget</p>
                  <div className="flex gap-2 mb-4">
                    {["fixed", "hourly"].map((type) => (
                      <button
                        key={type}
                        onClick={() => setJobData({ ...jobData, budget: { ...jobData.budget, type } })}
                        className={`px-5 py-2 rounded-lg text-sm font-medium transition-colors ${
                          jobData.budget.type === type
                            ? "bg-gray-900 text-white"
                            : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                        }`}
                      >
                        {type === "fixed" ? "Fixed Price" : "Hourly Rate"}
                      </button>
                    ))}
                  </div>

                  {jobData.budget.type === "hourly" ? (
                    <div className="grid grid-cols-2 gap-3">
                      {[
                        { key: "min", label: "Min ($/hr)", placeholder: "15" },
                        { key: "max", label: "Max ($/hr)", placeholder: "50" },
                      ].map(({ key, label, placeholder }) => (
                        <div key={key}>
                          <p className="text-xs text-gray-500 mb-1.5">{label}</p>
                          <div className="relative">
                            <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                            <input
                              type="number"
                              value={jobData.budget[key as "min" | "max"]}
                              onChange={(e) => setJobData({ ...jobData, budget: { ...jobData.budget, [key]: e.target.value } })}
                              placeholder={placeholder}
                              className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-gray-200 text-sm outline-none focus:border-[#0084ca] focus:ring-2 focus:ring-[#0084ca]/10 transition-colors"
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="relative">
                      <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <input
                        type="number"
                        value={jobData.budget.fixed}
                        onChange={(e) => setJobData({ ...jobData, budget: { ...jobData.budget, fixed: e.target.value } })}
                        placeholder="5000"
                        className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-gray-200 text-sm outline-none focus:border-[#0084ca] focus:ring-2 focus:ring-[#0084ca]/10 transition-colors"
                      />
                    </div>
                  )}
                  {errors.budget && <p className="flex items-center gap-1 text-xs text-red-500 mt-1.5"><AlertCircle className="w-3.5 h-3.5" />{errors.budget}</p>}
                </div>
              </>
            )}

            {/* ── Step 4: Review ── */}
            {step === 4 && (
              <div className="space-y-5">
                {/* Title + category */}
                <div className="rounded-xl border border-gray-200 p-5">
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">Job Title</p>
                  <p className="text-base font-bold text-gray-900">{jobData.title}</p>
                  <p className="text-sm text-gray-500 mt-0.5">{jobData.category}</p>
                </div>

                {/* Description */}
                <div className="rounded-xl border border-gray-200 p-5">
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Description</p>
                  <p className="text-sm text-gray-700 whitespace-pre-wrap leading-relaxed">{jobData.description}</p>
                </div>

                {/* Skills */}
                <div className="rounded-xl border border-gray-200 p-5">
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Skills</p>
                  <div className="flex flex-wrap gap-2">
                    {jobData.skills.map((skill) => (
                      <span key={skill} className="px-3 py-1.5 bg-gray-50 border border-gray-200 text-gray-700 rounded-lg text-sm font-medium">
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Details grid */}
                <div className="rounded-xl border border-gray-200 p-5 grid grid-cols-2 gap-4">
                  {[
                    { label: "Project Size", value: jobData.scope.charAt(0).toUpperCase() + jobData.scope.slice(1) },
                    { label: "Duration", value: jobData.duration.replace(/-/g, " ") },
                    { label: "Experience", value: jobData.experience.charAt(0).toUpperCase() + jobData.experience.slice(1) },
                    {
                      label: "Budget",
                      value: jobData.budget.type === "fixed"
                        ? `$${jobData.budget.fixed} (Fixed)`
                        : `$${jobData.budget.min} – $${jobData.budget.max}/hr`,
                    },
                  ].map(({ label, value }) => (
                    <div key={label}>
                      <p className="text-xs text-gray-400 mb-0.5">{label}</p>
                      <p className="text-sm font-semibold text-gray-800">{value}</p>
                    </div>
                  ))}
                </div>

                {/* What's next */}
                <div className="rounded-xl bg-[#0084ca]/5 border border-[#0084ca]/20 p-5">
                  <p className="text-sm font-semibold text-gray-800 mb-3">What happens next?</p>
                  <ul className="space-y-2">
                    {[
                      "Your job will be visible to qualified freelancers",
                      "You'll start receiving proposals within 24 hours",
                      "Review candidates and find the perfect fit",
                    ].map((item) => (
                      <li key={item} className="flex items-start gap-2 text-sm text-gray-600">
                        <CheckCircle className="w-4 h-4 text-[#0084ca] flex-shrink-0 mt-0.5" />
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>

                {errors.submit && (
                  <p className="flex items-center gap-2 text-sm text-red-600 bg-red-50 border border-red-200 rounded-xl px-4 py-3">
                    <AlertCircle className="w-4 h-4 flex-shrink-0" /> {errors.submit}
                  </p>
                )}
              </div>
            )}
          </div>

          {/* Footer actions */}
          <div className={`px-8 py-5 border-t border-gray-100 flex items-center ${step > 1 ? "justify-between" : "justify-end"}`}>
            {step > 1 && (
              <button onClick={back} className="px-5 py-2.5 rounded-xl border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors">
                Back
              </button>
            )}
            {step < 4 ? (
              <button
                onClick={next}
                className="flex items-center gap-2 px-6 py-2.5 bg-[#0084ca] hover:bg-[#006ba6] text-white text-sm font-semibold rounded-xl transition-colors disabled:opacity-50"
              >
                Continue <ChevronRight className="w-4 h-4" />
              </button>
            ) : (
              <button
                onClick={handleSubmit}
                disabled={isSubmitting}
                className="flex items-center gap-2 px-6 py-2.5 bg-[#0084ca] hover:bg-[#006ba6] text-white text-sm font-semibold rounded-xl transition-colors disabled:opacity-50"
              >
                {isSubmitting ? "Posting..." : "Post Job"}
                {!isSubmitting && <CheckCircle className="w-4 h-4" />}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
