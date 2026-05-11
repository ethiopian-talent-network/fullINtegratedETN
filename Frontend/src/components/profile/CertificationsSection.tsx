import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Plus, Trash2, Award, Monitor } from 'lucide-react';
import type { Certification } from '../../types/profile';

interface CertificationsSectionProps {
  certifications: Certification[];
  isEditing: boolean;
  darkMode: boolean;
  showAddCertification: boolean;
  newCertification: Omit<Certification, 'id'>;
  onShowAddCertificationChange: (show: boolean) => void;
  onNewCertificationChange: (certification: Omit<Certification, 'id'>) => void;
  onAddCertification: () => void;
  onRemoveCertification: (id: number) => void;
  onUploadDocument: (file: File, type: 'certificate', itemId: number) => void;
  onViewDocument: (documentUrl: string) => void;
  onRemoveDocument: (itemId: number) => void;
}

export function CertificationsSection({
  certifications,
  isEditing,
  darkMode,
  showAddCertification,
  newCertification,
  onShowAddCertificationChange,
  onNewCertificationChange,
  onAddCertification,
  onRemoveCertification,
  onUploadDocument,
  onViewDocument,
  onRemoveDocument,
}: CertificationsSectionProps) {
  const handleCertificationFieldChange = (field: keyof Omit<Certification, 'id'>, value: string) => {
    onNewCertificationChange({
      ...newCertification,
      [field]: value,
    });
  };

  const isImageFile = (dataUrl: string) => {
    return dataUrl.startsWith('data:image/');
  };

  const getFileName = (dataUrl: string) => {
    const mimeType = dataUrl.split(':')[1].split(';')[0];
    const extension = mimeType.split('/')[1];
    return `certificate.${extension}`;
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
          Certifications
        </h3>
        {isEditing && (
          <Button
            onClick={() => onShowAddCertificationChange(true)}
            size="sm"
            className="bg-[#0084ca] hover:bg-[#006ba6] text-white"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Certification
          </Button>
        )}
      </div>

      {/* Add Certification Form */}
      {showAddCertification && (
        <div className="mb-6 p-4 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg">
          <h4 className="font-semibold text-gray-900 dark:text-white mb-4">
            Add New Certification
          </h4>
          <div className="space-y-3">
            <Input
              value={newCertification.name}
              onChange={(e) => handleCertificationFieldChange('name', e.target.value)}
              placeholder="Certification Name"
            />
            <Input
              value={newCertification.issuer}
              onChange={(e) => handleCertificationFieldChange('issuer', e.target.value)}
              placeholder="Issuing Organization"
            />
            <Input
              value={newCertification.year}
              onChange={(e) => handleCertificationFieldChange('year', e.target.value)}
              placeholder="Year"
            />
            <div className="flex gap-2">
              <Button
                onClick={onAddCertification}
                className="bg-[#0084ca] hover:bg-[#006ba6] text-white"
              >
                Add Certification
              </Button>
              <Button
                variant="outline"
                onClick={() => onShowAddCertificationChange(false)}
              >
                Cancel
              </Button>
            </div>
          </div>
        </div>
      )}

      <div className="space-y-4">
        {certifications.map((cert) => (
          <div
            key={cert.id}
            className={`flex items-start gap-4 p-4 rounded-lg border ${
              darkMode
                ? "border-gray-700 bg-gray-800"
                : "border-gray-200 bg-white"
            }`}
          >
            <div className="w-12 h-12 bg-green-100 dark:bg-green-900 rounded-lg flex items-center justify-center">
              <Award className="w-6 h-6 text-green-600 dark:text-green-400" />
            </div>
            <div className="flex-1">
              <h4 className="font-semibold text-gray-900 dark:text-white">
                {cert.name}
              </h4>
              <p className="text-gray-600 dark:text-gray-400">{cert.issuer}</p>
              <p className="text-sm text-gray-500 dark:text-gray-500">{cert.year}</p>

              {/* Uploaded Certificate Section */}
              <div className="mt-3 space-y-2">
                {cert.certificate && (
                  <div className="flex items-center gap-2 p-2 bg-gray-50 dark:bg-gray-700 rounded-lg">
                    <div className="w-8 h-8 bg-purple-100 dark:bg-purple-900 rounded flex items-center justify-center">
                      {isImageFile(cert.certificate) ? (
                        <Monitor className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                      ) : (
                        <Award className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                      )}
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-900 dark:text-white">
                        Certificate
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {getFileName(cert.certificate)}
                      </p>
                    </div>
                    <button
                      onClick={() => onViewDocument(cert.certificate!)}
                      className="text-xs text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300"
                    >
                      View
                    </button>
                    {isEditing && (
                      <button
                        onClick={() => onRemoveDocument(cert.id)}
                        className="text-xs text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-300"
                      >
                        Remove
                      </button>
                    )}
                  </div>
                )}

                {/* File Upload Section (Edit Mode Only) */}
                {isEditing && (
                  <div className="pt-2 border-t border-gray-200 dark:border-gray-600">
                    <div className="flex items-center gap-2">
                      <label className="text-sm text-gray-600 dark:text-gray-400">
                        Add Certificate:
                      </label>
                      <input
                        type="file"
                        accept=".pdf,.jpg,.jpeg,.png"
                        onChange={(e) =>
                          e.target.files?.[0] &&
                          onUploadDocument(e.target.files[0], 'certificate', cert.id)
                        }
                        className="text-xs"
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>
            {isEditing && (
              <button
                onClick={() => onRemoveCertification(cert.id)}
                className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900 rounded-lg"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
