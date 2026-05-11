import React, { useState, useEffect } from 'react';
import { getTalentBillingInfo } from '@/api/owner/payoutsApi';
import { X, Loader2, AlertCircle, ExternalLink } from 'lucide-react';

interface TalentDetailsModalProps {
  talentId: number;
  isOpen: boolean;
  onClose: () => void;
}

const TalentDetailsModal: React.FC<TalentDetailsModalProps> = ({
  talentId,
  isOpen,
  onClose,
}) => {
  const [talent, setTalent] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isOpen && talentId) {
      fetchTalentDetails();
    }
  }, [isOpen, talentId]);

  const fetchTalentDetails = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await getTalentBillingInfo(talentId);
      setTalent(response.talent);
    } catch (err: any) {
      setError(err.message || 'Failed to load talent details');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-gradient-to-r from-blue-600 to-blue-700 text-white p-6 flex justify-between items-center">
          <h2 className="text-2xl font-bold">Talent Billing Information</h2>
          <button onClick={onClose} className="hover:bg-blue-800 p-2 rounded">
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-6 h-6 animate-spin text-blue-500" />
            </div>
          ) : error ? (
            <div className="flex items-center gap-3 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
              <AlertCircle className="w-5 h-5" />
              {error}
            </div>
          ) : talent ? (
            <>
              {/* Profile Information */}
              <div className="bg-slate-50 rounded-lg p-4 space-y-3">
                <h3 className="font-semibold text-lg text-slate-900">Profile Information</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-slate-600">Name</p>
                    <p className="font-medium text-slate-900">{talent.name}</p>
                  </div>
                  <div>
                    <p className="text-sm text-slate-600">Email</p>
                    <p className="font-medium text-slate-900">{talent.email}</p>
                  </div>
                  <div>
                    <p className="text-sm text-slate-600">Location</p>
                    <p className="font-medium text-slate-900">{talent.Location || 'Not specified'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-slate-600">Hourly Rate</p>
                    <p className="font-medium text-slate-900">ETB {talent.HourlyRate || 'N/A'}</p>
                  </div>
                </div>
              </div>

              {/* About & Skills */}
              {(talent.about || talent.skills) && (
                <div className="bg-slate-50 rounded-lg p-4 space-y-3">
                  <h3 className="font-semibold text-lg text-slate-900">Professional Details</h3>
                  {talent.about && (
                    <div>
                      <p className="text-sm text-slate-600 mb-1">About</p>
                      <p className="text-sm text-slate-900">{talent.about}</p>
                    </div>
                  )}
                  {talent.skills && (
                    <div>
                      <p className="text-sm text-slate-600 mb-1">Skills</p>
                      <p className="text-sm text-slate-900">{talent.skills}</p>
                    </div>
                  )}
                  {talent.education && (
                    <div>
                      <p className="text-sm text-slate-600 mb-1">Education</p>
                      <p className="text-sm text-slate-900">{talent.education}</p>
                    </div>
                  )}
                  {talent.experience && (
                    <div>
                      <p className="text-sm text-slate-600 mb-1">Experience</p>
                      <p className="text-sm text-slate-900">{talent.experience}</p>
                    </div>
                  )}
                  {talent.languages && (
                    <div>
                      <p className="text-sm text-slate-600 mb-1">Languages</p>
                      <p className="text-sm text-slate-900">{talent.languages}</p>
                    </div>
                  )}
                </div>
              )}

              {/* Social Links */}
              {(talent.linkedin || talent.github || talent.resume_url) && (
                <div className="bg-slate-50 rounded-lg p-4 space-y-3">
                  <h3 className="font-semibold text-lg text-slate-900">Social & Links</h3>
                  <div className="space-y-2">
                    {talent.linkedin && (
                      <a
                        href={talent.linkedin}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 text-blue-600 hover:text-blue-800"
                      >
                        <ExternalLink className="w-4 h-4" />
                        LinkedIn Profile
                      </a>
                    )}
                    {talent.github && (
                      <a
                        href={talent.github}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 text-blue-600 hover:text-blue-800"
                      >
                        <ExternalLink className="w-4 h-4" />
                        GitHub Profile
                      </a>
                    )}
                    {talent.resume_url && (
                      <a
                        href={talent.resume_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 text-blue-600 hover:text-blue-800"
                      >
                        <ExternalLink className="w-4 h-4" />
                        Resume
                      </a>
                    )}
                  </div>
                </div>
              )}

              {/* Payout Statistics */}
              <div className="grid grid-cols-3 gap-4">
                <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                  <p className="text-sm text-blue-600 font-semibold">Total Payouts</p>
                  <p className="text-2xl font-bold text-blue-900">{talent.total_payouts || 0}</p>
                </div>
                <div className="bg-green-50 rounded-lg p-4 border border-green-200">
                  <p className="text-sm text-green-600 font-semibold">Total Paid Out</p>
                  <p className="text-2xl font-bold text-green-900">ETB {parseFloat(talent.total_paid_out || 0).toFixed(2)}</p>
                </div>
                <div className="bg-amber-50 rounded-lg p-4 border border-amber-200">
                  <p className="text-sm text-amber-600 font-semibold">Pending Amount</p>
                  <p className="text-2xl font-bold text-amber-900">ETB {parseFloat(talent.pending_amount || 0).toFixed(2)}</p>
                </div>
              </div>

              {/* Additional Details */}
              <div className="bg-slate-50 rounded-lg p-4 space-y-3">
                <h3 className="font-semibold text-lg text-slate-900">System Information</h3>
                <div className="space-y-2">
                  <div className="flex justify-between items-center py-2 border-b">
                    <span className="text-slate-600">Talent ID</span>
                    <span className="font-medium text-slate-900">#{talent.id}</span>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b">
                    <span className="text-slate-600">User ID</span>
                    <span className="font-medium text-slate-900">#{talent.user_id}</span>
                  </div>
                  <div className="flex justify-between items-center py-2">
                    <span className="text-slate-600">Status</span>
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-semibold bg-green-100 text-green-800">
                      Active
                    </span>
                  </div>
                </div>
              </div>
            </>
          ) : (
            <div className="text-center py-12">
              <p className="text-slate-500">No talent data available</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default TalentDetailsModal;
