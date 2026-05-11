import React, { useState, useEffect } from 'react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Badge } from '../ui/badge';
import { Upload, FileText, CheckCircle, XCircle, Clock } from 'lucide-react';

interface LicenseStatus {
  is_verified: boolean;
  license: {
    id: number;
    license_name: string;
    license_number?: string;
    issuing_authority?: string;
    license_image: string;
    status: 'pending' | 'approved' | 'rejected';
    admin_note?: string;
    submitted_at: string;
  } | null;
}

interface LicenseSubmissionProps {
  onLicenseSubmitted?: () => void;
}

export const LicenseSubmission: React.FC<LicenseSubmissionProps> = ({
  onLicenseSubmitted
}) => {
  const [licenseStatus, setLicenseStatus] = useState<LicenseStatus | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    license_name: '',
    license_number: '',
    issuing_authority: '',
    license_image: null as File | null
  });

  useEffect(() => {
    fetchLicenseStatus();
  }, []);

  const fetchLicenseStatus = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/employer/license', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setLicenseStatus(data);
      }
    } catch (error) {
      console.error('Error fetching license status:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.license_image || !formData.license_name) return;

    setIsSubmitting(true);
    try {
      const token = localStorage.getItem('token');
      const submitData = new FormData();
      submitData.append('license_name', formData.license_name);
      submitData.append('license_number', formData.license_number);
      submitData.append('issuing_authority', formData.issuing_authority);
      submitData.append('license_image', formData.license_image);

      const response = await fetch('/api/employer/license', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: submitData
      });

      if (response.ok) {
        await fetchLicenseStatus();
        setFormData({
          license_name: '',
          license_number: '',
          issuing_authority: '',
          license_image: null
        });
        onLicenseSubmitted?.();
      } else {
        const error = await response.json();
        alert(error.message || 'Failed to submit license');
      }
    } catch (error) {
      console.error('Error submitting license:', error);
      alert('Failed to submit license');
    } finally {
      setIsSubmitting(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'approved':
        return <CheckCircle className="w-5 h-5 text-green-600" />;
      case 'rejected':
        return <XCircle className="w-5 h-5 text-red-600" />;
      case 'pending':
        return <Clock className="w-5 h-5 text-yellow-600" />;
      default:
        return null;
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

  if (licenseStatus?.is_verified) {
    return (
      <div className="bg-green-50 border border-green-200 rounded-lg p-6">
        <div className="flex items-center gap-3 mb-4">
          <CheckCircle className="w-6 h-6 text-green-600" />
          <h3 className="text-lg font-semibold text-green-800">Business License Verified</h3>
        </div>
        <p className="text-green-700 mb-4">
          Your business license has been verified. You can now post jobs with a verified badge.
        </p>
        {licenseStatus.license && (
          <div className="bg-white rounded-md p-4 border border-green-200">
            <h4 className="font-medium text-gray-900 mb-2">License Details</h4>
            <div className="space-y-1 text-sm text-gray-600">
              <p><span className="font-medium">Name:</span> {licenseStatus.license.license_name}</p>
              {licenseStatus.license.license_number && (
                <p><span className="font-medium">Number:</span> {licenseStatus.license.license_number}</p>
              )}
              {licenseStatus.license.issuing_authority && (
                <p><span className="font-medium">Authority:</span> {licenseStatus.license.issuing_authority}</p>
              )}
            </div>
          </div>
        )}
      </div>
    );
  }

  if (licenseStatus?.license) {
    return (
      <div className="bg-white border rounded-lg p-6">
        <div className="flex items-center gap-3 mb-4">
          {getStatusIcon(licenseStatus.license.status)}
          <h3 className="text-lg font-semibold">License Submission Status</h3>
          {getStatusBadge(licenseStatus.license.status)}
        </div>
        
        <div className="space-y-3">
          <div>
            <p className="text-sm text-gray-600">License Name</p>
            <p className="font-medium">{licenseStatus.license.license_name}</p>
          </div>
          
          {licenseStatus.license.status === 'pending' && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4">
              <p className="text-yellow-800">
                Your license is under review. You'll be notified once it's processed.
              </p>
            </div>
          )}
          
          {licenseStatus.license.status === 'rejected' && (
            <div className="bg-red-50 border border-red-200 rounded-md p-4">
              <p className="text-red-800 mb-2">Your license submission was rejected.</p>
              {licenseStatus.license.admin_note && (
                <p className="text-sm text-red-700">
                  <span className="font-medium">Reason:</span> {licenseStatus.license.admin_note}
                </p>
              )}
              <Button 
                onClick={() => setLicenseStatus(null)} 
                variant="outline" 
                size="sm" 
                className="mt-3"
              >
                Submit New License
              </Button>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white border rounded-lg p-6">
      <div className="flex items-center gap-3 mb-4">
        <FileText className="w-6 h-6 text-blue-600" />
        <h3 className="text-lg font-semibold">Business License Verification</h3>
      </div>
      
      <p className="text-gray-600 mb-6">
        Submit your business license for verification to post jobs with a verified badge.
      </p>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <Label htmlFor="license_name">License Name *</Label>
          <Input
            id="license_name"
            value={formData.license_name}
            onChange={(e) => setFormData(prev => ({ ...prev, license_name: e.target.value }))}
            placeholder="e.g., Business Registration Certificate"
            required
          />
        </div>

        <div>
          <Label htmlFor="license_number">License Number</Label>
          <Input
            id="license_number"
            value={formData.license_number}
            onChange={(e) => setFormData(prev => ({ ...prev, license_number: e.target.value }))}
            placeholder="Optional"
          />
        </div>

        <div>
          <Label htmlFor="issuing_authority">Issuing Authority</Label>
          <Input
            id="issuing_authority"
            value={formData.issuing_authority}
            onChange={(e) => setFormData(prev => ({ ...prev, issuing_authority: e.target.value }))}
            placeholder="e.g., Ministry of Trade and Industry"
          />
        </div>

        <div>
          <Label htmlFor="license_image">License Document *</Label>
          <div className="mt-1">
            <input
              id="license_image"
              type="file"
              accept="image/*,.pdf"
              onChange={(e) => setFormData(prev => ({ 
                ...prev, 
                license_image: e.target.files?.[0] || null 
              }))}
              className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-medium file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
              required
            />
          </div>
          <p className="text-xs text-gray-500 mt-1">
            Upload a clear image or PDF of your business license
          </p>
        </div>

        <Button 
          type="submit" 
          disabled={isSubmitting || !formData.license_image || !formData.license_name}
          className="w-full"
        >
          {isSubmitting ? (
            <>
              <Upload className="w-4 h-4 mr-2 animate-spin" />
              Submitting...
            </>
          ) : (
            <>
              <Upload className="w-4 h-4 mr-2" />
              Submit License
            </>
          )}
        </Button>
      </form>
    </div>
  );
};

export default LicenseSubmission;