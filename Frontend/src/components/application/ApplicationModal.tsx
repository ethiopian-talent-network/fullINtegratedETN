import React, { useState, useEffect } from "react";
import {
  X,
  Clock,
  DollarSign,
  FileText,
  AlertCircle,
  CheckCircle,
  Loader,
} from "lucide-react";
import {
  getJobApplicationDetails,
  submitApplication,
} from "../../api/jobs/jobApi";
import type { Job } from "../../features/talents/types";

interface ApplicationDetails {
  job: Job & {
    salary?: string;
    budget_type?: string;
    token_cost?: number;
  };
  userTokens: number;
  hasEnoughTokens: boolean;
  alreadyApplied: boolean;
  canApply: boolean;
}

interface ApplicationModalProps {
  isOpen: boolean;
  onClose: () => void;
  job: Job;
  onSuccess?: () => void;
}

interface FormData {
  cover_letter: string;
  proposal: string;
  estimated_timeline: string;
  budget_proposal: string;
}

export const ApplicationModal: React.FC<ApplicationModalProps> = ({
  isOpen,
  onClose,
  job,
  onSuccess,
}) => {
  const [applicationDetails, setApplicationDetails] =
    useState<ApplicationDetails | null>(null);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [formData, setFormData] = useState<FormData>({
    cover_letter: "",
    proposal: "",
    estimated_timeline: "",
    budget_proposal: "",
  });

  useEffect(() => {
    if (isOpen && job) {
      fetchApplicationDetails();
      // Reset form
      setFormData({
        cover_letter: "",
        proposal: "",
        estimated_timeline: "",
        budget_proposal: "",
      });
      setError(null);
      setSuccess(false);
    }
  }, [isOpen, job]);

  const fetchApplicationDetails = async () => {
    if (!job) return;

    setLoading(true);
    setError(null);

    try {
      const details = await getJobApplicationDetails(job.id);
      setApplicationDetails(details);
    } catch (err: any) {
      setError(err.message || "Failed to load application details");
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: keyof FormData, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
    setError(null);
  };

  const validateForm = (): boolean => {
    if (!formData.cover_letter.trim()) {
      setError("Cover letter is required");
      return false;
    }

    if (formData.cover_letter.length < 50) {
      setError("Cover letter must be at least 50 characters");
      return false;
    }

    if (formData.proposal && formData.proposal.length < 100) {
      setError("Proposal must be at least 100 characters if provided");
      return false;
    }

    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      await submitApplication(job.id, {
        cover_letter: formData.cover_letter.trim(),
        proposal: formData.proposal.trim() || undefined,
        estimated_timeline: formData.estimated_timeline.trim() || undefined,
        budget_proposal: formData.budget_proposal.trim() || undefined,
      });

      setSuccess(true);
      if (onSuccess) {
        onSuccess();
      }

      // Auto close after success
      setTimeout(() => {
        onClose();
      }, 3000);
    } catch (err: any) {
      setError(err.message || "Failed to submit application");
    } finally {
      setSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
          <h2 className="text-2xl font-bold text-gray-900">Apply for Job</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            disabled={submitting}
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Content */}
        <div className="px-6 py-6">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader className="w-8 h-8 animate-spin text-blue-600" />
              <span className="ml-2 text-gray-600">
                Loading application details...
              </span>
            </div>
          ) : error && !applicationDetails ? (
            <div className="text-center py-12">
              <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
              <p className="text-red-600 mb-4">{error}</p>
              <button
                onClick={fetchApplicationDetails}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Try Again
              </button>
            </div>
          ) : success ? (
            <div className="text-center py-12">
              <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                Application Submitted!
              </h3>
              <p className="text-gray-600 mb-4">
                Your proposal has been submitted successfully.{" "}
                {applicationDetails?.job.token_cost} tokens have been deducted
                from your balance.
              </p>
              <p className="text-sm text-gray-500">
                This window will close automatically...
              </p>
            </div>
          ) : (
            <>
              {/* Job Details & Token Info */}
              {applicationDetails && (
                <div className="mb-6 p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-1">
                        {applicationDetails.job.title}
                      </h3>
                      <p className="text-gray-600">
                        {applicationDetails.job.company}
                      </p>
                      <p className="text-sm text-gray-500 mt-1">
                        {applicationDetails.job.location} •{" "}
                        {applicationDetails.job.experience} level
                      </p>
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-bold text-gray-900">
                        {applicationDetails.job.salary ||
                          applicationDetails.job.budget ||
                          "Negotiable"}
                      </div>
                      <div className="text-sm text-gray-500">
                        {applicationDetails.job.budget_type === "fixed" ||
                        applicationDetails.job.budget?.includes("$")
                          ? "Fixed Price"
                          : "Hourly"}
                      </div>
                    </div>
                  </div>

                  {/* Token Information */}
                  <div className="border-t border-gray-200 pt-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="flex items-center text-sm text-gray-600 mb-1">
                          <DollarSign className="w-4 h-4 mr-1" />
                          Your Token Balance
                        </div>
                        <div className="text-2xl font-bold text-gray-900">
                          {applicationDetails.userTokens} tokens
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="flex items-center text-sm text-gray-600 mb-1">
                          <AlertCircle className="w-4 h-4 mr-1" />
                          Cost to Apply
                        </div>
                        <div className="text-2xl font-bold text-blue-600">
                          {applicationDetails.job.token_cost || 0} tokens
                        </div>
                      </div>
                    </div>

                    {applicationDetails.hasEnoughTokens ? (
                      <div className="mt-3 p-2 bg-green-50 border border-green-200 rounded-lg">
                        <p className="text-sm text-green-700">
                          ✓ You have enough tokens to apply for this job
                        </p>
                      </div>
                    ) : (
                      <div className="mt-3 p-2 bg-red-50 border border-red-200 rounded-lg">
                        <p className="text-sm text-red-700">
                          ✗ You need{" "}
                          {Math.max(
                            0,
                            (applicationDetails.job.token_cost || 0) -
                              applicationDetails.userTokens,
                          )}{" "}
                          more tokens to apply
                        </p>
                      </div>
                    )}

                    {applicationDetails.alreadyApplied && (
                      <div className="mt-3 p-2 bg-yellow-50 border border-yellow-200 rounded-lg">
                        <p className="text-sm text-yellow-700">
                          ⚠ You have already applied for this job
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Application Form */}
              {applicationDetails?.canApply && (
                <form onSubmit={handleSubmit} className="space-y-6">
                  {/* Cover Letter */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Cover Letter <span className="text-red-500">*</span>
                    </label>
                    <textarea
                      value={formData.cover_letter}
                      onChange={(e) =>
                        handleInputChange("cover_letter", e.target.value)
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      rows={6}
                      placeholder="Introduce yourself and explain why you're the perfect fit for this job..."
                      required
                    />
                    <p className="text-sm text-gray-500 mt-1">
                      Minimum 50 characters
                    </p>
                  </div>

                  {/* Detailed Proposal */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      <FileText className="w-4 h-4 inline mr-1" />
                      Detailed Proposal
                    </label>
                    <textarea
                      value={formData.proposal}
                      onChange={(e) =>
                        handleInputChange("proposal", e.target.value)
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      rows={8}
                      placeholder="Provide a detailed proposal explaining your approach, methodology, and how you plan to complete this project..."
                    />
                    <p className="text-sm text-gray-500 mt-1">
                      Optional, but recommended (minimum 100 characters if
                      provided)
                    </p>
                  </div>

                  {/* Timeline and Budget */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        <Clock className="w-4 h-4 inline mr-1" />
                        Estimated Timeline
                      </label>
                      <input
                        type="text"
                        value={formData.estimated_timeline}
                        onChange={(e) =>
                          handleInputChange(
                            "estimated_timeline",
                            e.target.value,
                          )
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="e.g., 2 weeks, 1 month, 3 days"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        <DollarSign className="w-4 h-4 inline mr-1" />
                        Budget Proposal
                      </label>
                      <input
                        type="text"
                        value={formData.budget_proposal}
                        onChange={(e) =>
                          handleInputChange("budget_proposal", e.target.value)
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="e.g., $500, $50/hour, Negotiable"
                      />
                    </div>
                  </div>

                  {/* Error Message */}
                  {error && (
                    <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                      <p className="text-sm text-red-600">{error}</p>
                    </div>
                  )}

                  {/* Submit Button */}
                  <div className="flex items-center justify-between pt-4 border-t border-gray-200">
                    <button
                      type="button"
                      onClick={onClose}
                      className="px-4 py-2 text-gray-700 hover:text-gray-900 transition-colors"
                      disabled={submitting}
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
                      disabled={submitting}
                    >
                      {submitting ? (
                        <>
                          <Loader className="w-4 h-4 animate-spin mr-2" />
                          Submitting...
                        </>
                      ) : (
                        `Submit Application (${applicationDetails?.job.token_cost || 0} tokens)`
                      )}
                    </button>
                  </div>
                </form>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};
