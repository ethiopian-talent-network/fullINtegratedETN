import React, { useState, useEffect } from 'react';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { CheckCircle, XCircle, Clock, FileText, ExternalLink } from 'lucide-react';

interface LicenseRequest {
  id: number;
  employer_id: number;
  user_id: number;
  license_name: string;
  license_number?: string;
  issuing_authority?: string;
  license_image: string;
  status: 'pending' | 'approved' | 'rejected';
  admin_note?: string;
  submitted_at: string;
  name: string;
  email: string;
  company_name: string;
  is_verified: boolean;
}

export const LicenseReviewPanel: React.FC = () => {
  const [requests, setRequests] = useState<LicenseRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedRequest, setSelectedRequest] = useState<LicenseRequest | null>(null);
  const [adminNote, setAdminNote] = useState('');
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    fetchLicenseRequests();
  }, []);

  const fetchLicenseRequests = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/admin/license-requests?status=pending', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setRequests(data.requests);
      }
    } catch (error) {
      console.error('Error fetching license requests:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleReview = async (requestId: number, action: 'approve' | 'reject') => {
    setProcessing(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/admin/license-requests/${requestId}`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          action,
          admin_note: adminNote
        })
      });

      if (response.ok) {
        await fetchLicenseRequests();
        setSelectedRequest(null);
        setAdminNote('');
        alert(`License ${action}d successfully`);
      } else {
        const error = await response.json();
        alert(error.message || `Failed to ${action} license`);
      }
    } catch (error) {
      console.error(`Error ${action}ing license:`, error);
      alert(`Failed to ${action} license`);
    } finally {
      setProcessing(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const variants = {
      approved: 'bg-green-100 text-green-800 border-green-200',
      rejected: 'bg-red-100 text-red-800 border-red-200',
      pending: 'bg-yellow-100 text-yellow-800 border-yellow-200'
    };

    return (
      <Badge className={variants[status as keyof typeof variants]}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <FileText className="w-6 h-6 text-blue-600" />
        <h2 className="text-2xl font-bold">License Review Panel</h2>
        <Badge variant="secondary">{requests.length} Pending</Badge>
      </div>

      {requests.length === 0 ? (
        <div className="text-center py-12">
          <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">All Caught Up!</h3>
          <p className="text-gray-600">No pending license requests to review.</p>
        </div>
      ) : (
        <div className="grid gap-6">
          {requests.map((request) => (
            <div key={request.id} className="bg-white border rounded-lg p-6 shadow-sm">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-1">
                    {request.company_name}
                  </h3>
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <span>{request.name}</span>
                    <span>•</span>
                    <span>{request.email}</span>
                  </div>
                </div>
                {getStatusBadge(request.status)}
              </div>

              <div className="grid md:grid-cols-2 gap-4 mb-4">
                <div>
                  <h4 className="font-medium text-gray-900 mb-2">License Details</h4>
                  <div className="space-y-1 text-sm">
                    <p><span className="font-medium">Name:</span> {request.license_name}</p>
                    {request.license_number && (
                      <p><span className="font-medium">Number:</span> {request.license_number}</p>
                    )}
                    {request.issuing_authority && (
                      <p><span className="font-medium">Authority:</span> {request.issuing_authority}</p>
                    )}
                    <p><span className="font-medium">Submitted:</span> {new Date(request.submitted_at).toLocaleDateString()}</p>
                  </div>
                </div>

                <div>
                  <h4 className="font-medium text-gray-900 mb-2">License Document</h4>
                  <a
                    href={request.license_image}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-800 text-sm"
                  >
                    <ExternalLink className="w-4 h-4" />
                    View Document
                  </a>
                </div>
              </div>

              {selectedRequest?.id === request.id ? (
                <div className="border-t pt-4">
                  <div className="mb-4">
                    <Label htmlFor="admin_note">Admin Note (Optional)</Label>
                    <Input
                      id="admin_note"
                      value={adminNote}
                      onChange={(e) => setAdminNote(e.target.value)}
                      placeholder="Add a note for the employer..."
                      className="mt-1"
                    />
                  </div>
                  <div className="flex gap-3">
                    <Button
                      onClick={() => handleReview(request.id, 'approve')}
                      disabled={processing}
                      className="bg-green-600 hover:bg-green-700"
                    >
                      <CheckCircle className="w-4 h-4 mr-2" />
                      Approve
                    </Button>
                    <Button
                      onClick={() => handleReview(request.id, 'reject')}
                      disabled={processing}
                      variant="destructive"
                    >
                      <XCircle className="w-4 h-4 mr-2" />
                      Reject
                    </Button>
                    <Button
                      onClick={() => {
                        setSelectedRequest(null);
                        setAdminNote('');
                      }}
                      variant="outline"
                      disabled={processing}
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="border-t pt-4">
                  <Button
                    onClick={() => setSelectedRequest(request)}
                    variant="outline"
                  >
                    <Clock className="w-4 h-4 mr-2" />
                    Review License
                  </Button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default LicenseReviewPanel;