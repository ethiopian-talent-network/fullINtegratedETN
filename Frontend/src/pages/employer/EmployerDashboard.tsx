import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import { useDarkMode } from "../../contexts/DarkModeContext";
import { EMPLOYER_ROUTES } from "../../config/routes";
import { useJobs } from "../../features/employer/hooks/useJobs";
import { useProposals } from "../../features/employer/hooks/useProposals";
import { useCategories } from "../../features/employer/hooks/useCategories";
import { useTalents } from "../../features/employer/hooks/useTalents";
import { useContracts } from "../../features/employer/hooks/useContracts";
import { StatsCards } from "../../features/employer/components/StatsCards";
import { TabsNavigation } from "../../features/employer/components/TabsNavigation";
import { JobList } from "../../features/employer/components/JobList";
import { JobFormModal } from "../../features/employer/components/JobFormModal";
import { ProposalsModal } from "../../features/employer/components/ProposalsModal";
import { ProposalsPage } from "../../features/employer/components/ProposalsPage";
import { TalentProfileModal } from "../../features/employer/components/TalentProfileModal";
import { TalentList } from "../../features/employer/components/TalentList";
import { ContractList } from "../../features/employer/components/ContractList";
import { Header } from "../../features/employer/components/Header";
import type { TabType, EmployerStats, Job } from "../../features/employer/types/employer.types";

export const EmployerDashboard: React.FC = () => {
  const { darkMode } = useDarkMode();
  const navigate = useNavigate();
  const dm = darkMode;

  const [activeTab, setActiveTab] = useState<TabType>("jobs");
  const [showJobModal, setShowJobModal] = useState(false);
  const [showProposalsModal, setShowProposalsModal] = useState(false);
  const [showTalentProfileModal, setShowTalentProfileModal] = useState(false);
  const [selectedTalentId, setSelectedTalentId] = useState<number | null>(null);
  const [editingJob, setEditingJob] = useState<Job | null>(null);

  const { jobs, loading: jobsLoading, error: jobsError, fetchJobs, createNewJob, updateExistingJob, deleteExistingJob } = useJobs();
  const { proposals, loading: proposalsLoading, error: proposalsError, fetchProposals, updateProposalStatus, clearProposals } = useProposals();
  const { categories } = useCategories();
  const { talents, loading: talentsLoading, error: talentsError, getTalents } = useTalents();
  const { contracts, loading: contractsLoading, error: contractsError, getContracts } = useContracts();

  const stats: EmployerStats = {
    totalJobs: jobs.length,
    activeJobs: jobs.filter((j) => j.status === "active").length,
    totalProposals: jobs.reduce((s, j) => s + (j.applications_count || 0), 0),
    activeContracts: contracts.filter((c) => c.status === "active").length,
  };

  const tabCounts = {
    jobs: jobs.length,
    proposals: stats.totalProposals,
    talents: talents.length,
    contracts: contracts.length,
  };

  useEffect(() => { fetchJobs(); }, [fetchJobs]);
  useEffect(() => { if (activeTab === "talents") getTalents(); }, [activeTab, getTalents]);
  useEffect(() => { if (activeTab === "contracts") getContracts(); }, [activeTab, getContracts]);

  const handleViewProposals = (job: Job) =>
    navigate(EMPLOYER_ROUTES.PROPOSALS.path.replace(":jobId", job.id.toString()));

  const handleJobSubmit = async (jobData: any) => {
    const success = editingJob
      ? await updateExistingJob(editingJob.id, jobData)
      : await createNewJob(jobData);
    if (success) { setShowJobModal(false); setEditingJob(null); }
  };

  const handleViewTalentProfile = (talentId: number) => {
    setSelectedTalentId(talentId);
    setShowTalentProfileModal(true);
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case "jobs":
        return (
          <JobList
            jobs={jobs} loading={jobsLoading} error={jobsError} darkMode={dm}
            onViewDetails={() => {}}
            onEdit={(job) => { setEditingJob(job); setShowJobModal(true); }}
            onDelete={async (job) => { if (window.confirm("Delete this job?")) await deleteExistingJob(job.id); }}
            onViewProposals={handleViewProposals}
          />
        );
      case "proposals":
        return <ProposalsPage darkMode={dm} />;
      case "talents":
        return (
          <TalentList
            talents={talents} loading={talentsLoading} error={talentsError} darkMode={dm}
            onInviteTalent={() => {}}
            onViewProfile={handleViewTalentProfile}
          />
        );
      case "contracts":
        return <ContractList contracts={contracts} loading={contractsLoading} error={contractsError} darkMode={dm} onViewDetails={() => {}} />;
      default:
        return null;
    }
  };

  return (
    <div className={`min-h-screen ${dm ? "bg-gray-900" : "bg-slate-100"}`}>
      <Header />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Page title */}
        <div className="mb-6">
          <h1 className={`text-xl sm:text-2xl font-bold ${dm ? "text-white" : "text-gray-900"}`}>Dashboard</h1>
          <p className={`text-sm mt-0.5 ${dm ? "text-gray-400" : "text-gray-600"}`}>
            Manage your jobs, review applications, and hire top talent.
          </p>
        </div>

        <StatsCards stats={stats} darkMode={dm} />

        {/* Tabs */}
        <div className="overflow-x-auto mb-6">
          <TabsNavigation activeTab={activeTab} setActiveTab={setActiveTab} darkMode={dm} counts={tabCounts} />
        </div>

        {renderTabContent()}
      </div>

      {/* Modals */}
      <JobFormModal
        isOpen={showJobModal}
        onClose={() => { setShowJobModal(false); setEditingJob(null); }}
        onSubmit={handleJobSubmit}
        editingJob={editingJob}
        categories={categories}
        loading={jobsLoading}
        darkMode={dm}
      />
      <ProposalsModal
        isOpen={showProposalsModal}
        onClose={() => { setShowProposalsModal(false); clearProposals(); }}
        proposals={proposals}
        loading={proposalsLoading}
        error={proposalsError}
        onUpdateStatus={updateProposalStatus}
        onViewProfile={handleViewTalentProfile}
        darkMode={dm}
      />
      <TalentProfileModal
        isOpen={showTalentProfileModal}
        onClose={() => setShowTalentProfileModal(false)}
        talentId={selectedTalentId}
        darkMode={dm}
      />
    </div>
  );
};

export default EmployerDashboard;
