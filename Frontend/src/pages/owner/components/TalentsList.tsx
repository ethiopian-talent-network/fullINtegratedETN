import React, { useState, useEffect } from 'react';
import { getTalentsForPayouts } from '@/api/owner/payoutsApi';
import TalentDetailsModal from './TalentDetailsModal';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Search, Eye, Loader2, AlertCircle } from 'lucide-react';

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
}

interface TalentsListProps {
  onRefresh: () => void;
  refreshTrigger: number;
}

const TalentsList: React.FC<TalentsListProps> = ({ onRefresh, refreshTrigger }) => {
  const [talents, setTalents] = useState<Talent[]>([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [totalPages, setTotalPages] = useState(1);
  const [selectedTalent, setSelectedTalent] = useState<number | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchTalents();
  }, [page, search, refreshTrigger]);

  const fetchTalents = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await getTalentsForPayouts({
        page,
        limit: 10,
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

  const handleViewDetails = (talentId: number) => {
    setSelectedTalent(talentId);
    setShowModal(true);
  };

  return (
    <div className="space-y-4">
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
            <Input
              placeholder="Search talents by name or email..."
              value={search}
              onChange={(e) => handleSearch(e.target.value)}
              className="pl-10"
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
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleViewDetails(talent.talent_id)}
                        className="flex items-center gap-2"
                      >
                        <Eye className="w-4 h-4" />
                        View
                      </Button>
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
          <Button
            variant="outline"
            onClick={() => setPage(Math.max(1, page - 1))}
            disabled={page === 1}
          >
            Previous
          </Button>
          <div className="flex items-center gap-2">
            <span className="text-sm text-slate-600">
              Page {page} of {totalPages}
            </span>
          </div>
          <Button
            variant="outline"
            onClick={() => setPage(Math.min(totalPages, page + 1))}
            disabled={page === totalPages}
          >
            Next
          </Button>
        </div>
      )}

      {/* Talent Details Modal */}
      {showModal && selectedTalent && (
        <TalentDetailsModal
          talentId={selectedTalent}
          isOpen={showModal}
          onClose={() => {
            setShowModal(false);
            setSelectedTalent(null);
          }}
        />
      )}
    </div>
  );
};

export default TalentsList;
