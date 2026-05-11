import React, { useState, useEffect } from "react";
import {
  CheckCircle,
  Clock,
  AlertCircle,
  User,
  Mail,
  Calendar,
  Loader,
} from "lucide-react";
import { getApplicationsByStatus } from "../../api/payment/paymentApi";
import PaymentVerificationModal from "./PaymentVerificationModal";

interface Application {
  applicationID: number;
  status: string;
  name: string;
  email: string;
  applied_at: string;
  hired_at?: string;
  cover_letter?: string;
  talent_id: number;
  job_title: string;
}

interface ApplicationsByStatusProps {
  jobId: number;
  darkMode?: boolean;
  onRefresh?: () => void;
}

export const ApplicationsByStatus: React.FC<ApplicationsByStatusProps> = ({
  jobId,
  darkMode = false,
  onRefresh,
}) => {
  const [applications, setApplications] = useState<Record<string, Application[]>>({});
  const [summary, setSummary] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<string>("hired");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [selectedApp, setSelectedApp] = useState<Application | null>(null);

  useEffect(() => {
    fetchApplicationsByStatus();
  }, [jobId]);

  const fetchApplicationsByStatus = async () => {
    try {
      setLoading(true);
      setError(null);
      const token = localStorage.getItem("token");
      if (!token) throw new Error("No authentication token found");

      const result = await getApplicationsByStatus(token, jobId);
      setApplications(result.data);
      setSummary(result.summary);
    } catch (err: any) {
      setError(err.message || "Failed to fetch applications");
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const statusConfig: Record<string, { color: string; icon: React.ReactNode; label: string }> = {
      hired: {
        color: "bg-green-100 text-green-800",
        icon: <CheckCircle className="w-4 h-4" />,
        label: "Hired",
      },
      payment_pending: {
        color: "bg-yellow-100 text-yellow-800",
        icon: <Clock className="w-4 h-4" />,
        label: "Awaiting Verification",
      },
      shortlisted: {
        color: "bg-blue-100 text-blue-800",
        icon: <AlertCircle className="w-4 h-4" />,
        label: "Shortlisted",
      },
      accepted: {
        color: "bg-purple-100 text-purple-800",
        icon: <CheckCircle className="w-4 h-4" />,
        label: "Accepted",
      },
      pending: {
        color: "bg-gray-100 text-gray-800",
        icon: <AlertCircle className="w-4 h-4" />,
        label: "Pending",
      },
      rejected: {
        color: "bg-red-100 text-red-800",
        icon: <AlertCircle className="w-4 h-4" />,
        label: "Rejected",
      },
      withdrawn: {
        color: "bg-gray-100 text-gray-800",
        icon: <AlertCircle className="w-4 h-4" />,
        label: "Withdrawn",
      },
    };

    const config = statusConfig[status] || statusConfig.pending;
    return (
      <div className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium ${config.color}`}>
        {config.icon}
        {config.label}
      </div>
    );
  };

  const tabs = [
    { id: "hired", label: "Hired", count: summary?.hired || 0 },
    { id: "payment_pending", label: "Payment Pending", count: summary?.payment_pending || 0 },
    { id: "shortlisted", label: "Shortlisted", count: summary?.shortlisted || 0 },
    { id: "accepted", label: "Accepted", count: summary?.accepted || 0 },
    { id: "pending", label: "Pending", count: summary?.pending || 0 },
    { id: "rejected", label: "Rejected", count: summary?.rejected || 0 },
    { id: "withdrawn", label: "Withdrawn", count: summary?.withdrawn || 0 },
  ];

  const handlePaymentClick = (app: Application) => {
    setSelectedApp(app);
    setShowPaymentModal(true);
  };

  const handlePaymentSuccess = () => {
    fetchApplicationsByStatus();
    if (onRefresh) onRefresh();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  if (error) {
    return (
      <div className={`p-6 rounded-lg border ${darkMode ? "bg-red-900 border-red-700" : "bg-red-50 border-red-200"}`}>
        <p className={`text-sm ${darkMode ? "text-red-200" : "text-red-800"}`}>
          Error: {error}
        </p>
      </div>
    );
  }

  const currentApplications = applications[activeTab] || [];

  return (
    <div>
      {/* Tabs */}
      <div className={`flex gap-2 mb-6 overflow-x-auto pb-2 ${darkMode ? "bg-gray-800" : "bg-white"} rounded-lg p-2`}>
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-2 rounded-lg font-medium whitespace-nowrap transition-colors ${
              activeTab === tab.id
                ? "bg-blue-600 text-white"
                : darkMode
                ? "bg-gray-700 text-gray-300 hover:bg-gray-600"
                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
            }`}
          >
            {tab.label} ({tab.count})
          </button>
        ))}
      </div>

      {/* Applications List */}
      <div className="space-y-4">
        {currentApplications.length === 0 ? (
          <div className={`p-8 rounded-lg text-center ${darkMode ? "bg-gray-800" : "bg-gray-50"}`}>
            <User className={`w-12 h-12 mx-auto mb-4 ${darkMode ? "text-gray-600" : "text-gray-400"}`} />
            <p className={`text-lg font-medium ${darkMode ? "text-gray-300" : "text-gray-900"}`}>
              No applications in this status
            </p>
          </div>
        ) : (
          currentApplications.map((app) => (
            <div
              key={app.applicationID}
              className={`p-6 rounded-lg border ${
                darkMode
                  ? "bg-gray-800 border-gray-700 hover:border-gray-600"
                  : "bg-white border-gray-200 hover:border-gray-300"
              } transition-colors`}
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-start gap-4 flex-1">
                  <div
                    className={`w-12 h-12 rounded-full flex items-center justify-center font-semibold ${
                      darkMode ? "bg-gray-700 text-gray-300" : "bg-blue-100 text-blue-600"
                    }`}
                  >
                    {app.name?.charAt(0).toUpperCase() || "?"}
                  </div>
                  <div className="flex-1">
                    <h3 className={`font-semibold ${darkMode ? "text-white" : "text-gray-900"}`}>
                      {app.name}
                    </h3>
                    <div className={`flex items-center gap-4 mt-2 text-sm ${darkMode ? "text-gray-400" : "text-gray-600"}`}>
                      <div className="flex items-center gap-1">
                        <Mail className="w-4 h-4" />
                        {app.email}
                      </div>
                      <div className="flex items-center gap-1">
                        <Calendar className="w-4 h-4" />
                        {new Date(app.applied_at).toLocaleDateString()}
                      </div>
                    </div>
                  </div>
                </div>
                <div className="ml-4">{getStatusBadge(app.status)}</div>
              </div>

              {/* Cover Letter Preview */}
              {app.cover_letter && (
                <div className={`mb-4 p-3 rounded ${darkMode ? "bg-gray-700" : "bg-gray-50"}`}>
                  <p className={`text-sm ${darkMode ? "text-gray-300" : "text-gray-700"}`}>
                    {app.cover_letter.substring(0, 150)}
                    {app.cover_letter.length > 150 ? "..." : ""}
                  </p>
                </div>
              )}

              {/* Hired Date */}
              {app.hired_at && (
                <div className={`mb-4 text-sm ${darkMode ? "text-green-400" : "text-green-600"}`}>
                  Hired on: {new Date(app.hired_at).toLocaleDateString()}
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex gap-2">
                {app.status === "pending" && (
                  <button
                    onClick={() => handlePaymentClick(app)}
                    className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium text-sm transition-colors"
                  >
                    Hire & Pay via Escrow
                  </button>
                )}
                {app.status === "shortlisted" && (
                  <button
                    onClick={() => handlePaymentClick(app)}
                    className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium text-sm transition-colors"
                  >
                    Hire & Pay via Escrow
                  </button>
                )}
                {app.status === "payment_pending" && (
                  <div className="flex items-center gap-2 text-yellow-600">
                    <Clock className="w-4 h-4" />
                    <span className="text-sm font-medium">Awaiting Admin Verification</span>
                  </div>
                )}
                {app.status === "hired" && (
                  <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium text-sm transition-colors">
                    View Contract
                  </button>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Payment Modal */}
      {selectedApp && (
        <PaymentVerificationModal
          isOpen={showPaymentModal}
          onClose={() => {
            setShowPaymentModal(false);
            setSelectedApp(null);
          }}
          onSuccess={handlePaymentSuccess}
          jobId={jobId}
          talentId={selectedApp.talent_id}
          applicationId={selectedApp.applicationID}
          talentName={selectedApp.name}
          jobTitle={selectedApp.job_title}
          darkMode={darkMode}
        />
      )}
    </div>
  );
};

export default ApplicationsByStatus;
