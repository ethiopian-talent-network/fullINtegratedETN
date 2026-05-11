import React, { useState, useEffect } from 'react';
import { getTalentsForPayouts } from '@/api/owner/payoutsApi';
import { Search, Eye, Loader2, AlertCircle, CheckCircle, Clock } from 'lucide-react';

interface Talent {
  talent_id: number;
  name: string;
  email: string;
  Location: string;
  HourlyRate: number;
  total_verified_payments: number;
  total_verified_amount: number;
  pending_amount: number;
  total_payouts: number;
  total_paid_out: number;
  about?: string;
  skills?: string;
}

interface TalentDetailsModalProps {
  talent: Talent | null;
  isOpen: boolean;
  onClose: () => void;
}

const TalentDetailsModal: React.FC<TalentDetailsModalProps> = ({ talent, isOpen, onClose }) => {
  if (!isOpen || !talent) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-gradient-to-r from-blue-600 to-blue-700 text-white p-6 flex justify-between items-center">
          <h2 className="text-2xl font-bold">Talent Billing Details</h2>
          <button onClick={onClose} className="hover:bg-blue-800 p-2 rounded">
            ✕
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Profile */}
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
                <p className="font-medium text-slate-900">{talent.Location || 'N/A'}</p>
              </div>
              <div>
                <p className="text-sm text-slate-600">Hourly Rate</p>
                <p className="font-medium text-slate-900">ETB {talent.HourlyRate || 'N/A'}</p>
              </div>
            </div>
          </div>

          {/* Billing Stats */}
          <div className="grid grid-cols-3 gap-4">
            <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
              <p className="text-sm text-blue-600 font-semibold">Total Payouts</p>
              <p className="text-2xl font-bold text-blue-900">{talent.total_payouts || 0}</p>
            </div>
            <div className="bg-green-50 rounded-lg p-4 border border-green-200">
              <p className="text-sm text-green-600 font-semibold">Total Paid</p>
              <p className="text-2xl font-bold text-green-900">ETB {parseFloat(talent.total_paid_out || 0).toFixed(2)}</p>
            </div>
            <div className="bg-amber-50 rounded-lg p-4 border border-amber-200">
              <p className="text-sm text-amber-600 font-semibold">Pending</p>
              <p className="text-2xl font-bold text-amber-900">ETB {parseFloat(talent.pending_amount || 0).toFixed(2)}</p>
            </div>
          </div>

          {/* Verification Status */}
          <div className="bg-slate-50 rounded-lg p-4">
            <h3 className="font-semibold text-lg text-slate-900 mb-3">Verification Status</h3>
            <div className="space-y-2">
              <div className="flex items-center justify-between py-2 border-b">
                <span className="text-slate-600">Billing Information</span>
                <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-semibold bg-green-100 text-green-800">
                  <CheckCircle className="w-4 h-4" /> Verified
                </span>
              </div>
              <div className="flex items-center justify-between py-2 border-b">
                <span className="text-slate-600">Payment History</span>
                <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-semibold bg-green-100 text-green-800">
                  <CheckCircle className="w-4 h-4" /> Verified
                </span>
              </div>
              <div className="flex items-center justify-between py-2">
                <span className="text-slate-600">Account Status</span>
                <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-semibold bg-green-100 text-green-800">
                  <CheckCircle className="w-4 h-4" /> Active
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default function TalentsDashboard() {
  const [talents, setTalents] = useState<Talent[]>([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [totalPages, setTotalPages] = useState(1);
  const [selectedTalent, setSelectedTalent] = useState<Talent | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchTalents();
  }, [page, search]);

  const fetchTalents = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await getTalentsForPayouts({
        page,
        limit: 15,
        search: search || undefined,
      });

      if (response && response.talents && Array.isArray(response.talents)) {
        setTalents(response.talents);
        setTotalPages(response.pagination?.pages || 1);
      } else {
        setTalents([]);
        setError('Invalid response format from server');
      }
    } catch (error: any) {
      console.error('Error fetching talents:', error);
      setTalents([]);
      setError(error.message || 'Failed to fetch talents');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (value: string) => {
    setSearch(value);
    setPage(1);
  };

  const handleViewDetails = (talent: Talent) => {
    setSelectedTalent(talent);
    setShowModal(true);
  };

  return (
    <div className="min-h-screen bg-slate-100 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">Talents Dashboard</h1>
            <p className="text-slate-600 mt-1">View and verify talent billing information</p>
          </div>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-red-600" />
            <p className="text-red-700">{error}</p>
          </div>
        )}

        {/* Search Bar */}
        <div className="bg-white rounded-lg shadow-sm p-4">
          <div className="flex gap-2">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="Search talents by name or email..."
                value={search}
                onChange={(e) => handleSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        </div>

        {/* Talents Table */}
        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-6 h-6 animate-spin text-blue-500" />
            </div>
          ) : talents && talents.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-slate-500">No talents found</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-slate-50 border-b">
                  <tr>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-slate-900">Name</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-slate-900">Email</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-slate-900">Location</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-slate-900">Hourly Rate</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-slate-900">Total Payouts</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-slate-900">Total Paid</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-slate-900">Pending</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-slate-900">Status</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-slate-900">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {talents && talents.map((talent) => (
                    <tr key={talent.talent_id} className="hover:bg-slate-50 transition">
                      <td className="px-6 py-4 text-sm font-medium text-slate-900">{talent.name}</td>
                      <td className="px-6 py-4 text-sm text-slate-600">{talent.email}</td>
                      <td className="px-6 py-4 text-sm text-slate-600">{talent.Location}</td>
                      <td className="px-6 py-4 text-sm text-slate-600">ETB {talent.HourlyRate}</td>
                      <td className="px-6 py-4 text-sm text-slate-600">{talent.total_payouts || 0}</td>
                      <td className="px-6 py-4 text-sm font-semibold text-green-600">
                        ETB {parseFloat(talent.total_paid_out || 0).toFixed(2)}
                      </td>
                      <td className="px-6 py-4 text-sm font-semibold text-amber-600">
                        ETB {parseFloat(talent.pending_amount || 0).toFixed(2)}
                      </td>
                      <td className="px-6 py-4 text-sm">
                        <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-800">
                          <CheckCircle className="w-3 h-3" /> Verified
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm">
                        <button
                          onClick={() => handleViewDetails(talent)}
                          className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium bg-blue-50 text-blue-700 hover:bg-blue-100 transition"
                        >
                          <Eye className="w-4 h-4" />
                          View
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex justify-center gap-2">
            <button
              onClick={() => setPage(Math.max(1, page - 1))}
              disabled={page === 1}
              className="px-4 py-2 rounded-lg border border-slate-300 text-slate-700 hover:bg-slate-50 disabled:opacity-50"
            >
              Previous
            </button>
            <div className="flex items-center gap-2">
              <span className="text-sm text-slate-600">
                Page {page} of {totalPages}
              </span>
            </div>
            <button
              onClick={() => setPage(Math.min(totalPages, page + 1))}
              disabled={page === totalPages}
              className="px-4 py-2 rounded-lg border border-slate-300 text-slate-700 hover:bg-slate-50 disabled:opacity-50"
            >
              Next
            </button>
          </div>
        )}
      </div>

      {/* Modal */}
      <TalentDetailsModal
        talent={selectedTalent}
        isOpen={showModal}
        onClose={() => {
          setShowModal(false);
          setSelectedTalent(null);
        }}
      />
    </div>
  );
}
