import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Plus, Trash2, GraduationCap, FileText, Monitor } from 'lucide-react';
import type { Education } from '../../types/profile';

interface EducationSectionProps {
  education: Education[];
  isEditing: boolean;
  darkMode: boolean;
  showAddEducation: boolean;
  newEducation: Omit<Education, 'id'>;
  onShowAddEducationChange: (show: boolean) => void;
  onNewEducationChange: (education: Omit<Education, 'id'>) => void;
  onAddEducation: () => void;
  onRemoveEducation: (id: number) => void;
  onUploadDocument: (file: File, type: 'certificate' | 'transcript', itemId: number) => void;
  onViewDocument: (documentUrl: string) => void;
  onRemoveDocument: (itemId: number, type: 'certificate' | 'transcript') => void;
}

export function EducationSection({
  education,
  isEditing,
  darkMode,
  showAddEducation,
  newEducation,
  onShowAddEducationChange,
  onNewEducationChange,
  onAddEducation,
  onRemoveEducation,
  onUploadDocument,
  onViewDocument,
  onRemoveDocument,
}: EducationSectionProps) {
  const handleEducationFieldChange = (field: keyof Omit<Education, 'id'>, value: string) => {
    onNewEducationChange({
      ...newEducation,
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
    <div className="space-y-6">
      <div>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Education
          </h3>
          {isEditing && (
            <Button
              onClick={() => onShowAddEducationChange(true)}
              size="sm"
              className="bg-[#0084ca] hover:bg-[#006ba6] text-white"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Education
            </Button>
          )}
        </div>

        {/* Add Education Form */}
        {showAddEducation && (
          <div className="mb-6 p-4 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg">
            <h4 className="font-semibold text-gray-900 dark:text-white mb-4">
              Add New Education
            </h4>
            <div className="space-y-3">
              <Input
                value={newEducation.degree}
                onChange={(e) => handleEducationFieldChange('degree', e.target.value)}
                placeholder="Degree/Program"
              />
              <Input
                value={newEducation.school}
                onChange={(e) => handleEducationFieldChange('school', e.target.value)}
                placeholder="School/University"
              />
              <Input
                value={newEducation.year}
                onChange={(e) => handleEducationFieldChange('year', e.target.value)}
                placeholder="Years (e.g., 2015 - 2019)"
              />
              <div className="flex gap-2">
                <Button
                  onClick={onAddEducation}
                  className="bg-[#0084ca] hover:bg-[#006ba6] text-white"
                >
                  Add Education
                </Button>
                <Button
                  variant="outline"
                  onClick={() => onShowAddEducationChange(false)}
                >
                  Cancel
                </Button>
              </div>
            </div>
          </div>
        )}

        <div className="space-y-4">
          {education.map((edu) => (
            <div
              key={edu.id}
              className={`flex items-start gap-4 p-4 rounded-lg border ${
                darkMode
                  ? "border-gray-700 bg-gray-800"
                  : "border-gray-200 bg-white"
              }`}
            >
              <div className="w-12 h-12 bg-[#0084ca] bg-opacity-10 rounded-lg flex items-center justify-center">
                <GraduationCap className="w-6 h-6 text-[#0084ca]" />
              </div>
              <div className="flex-1">
                <h4 className="font-semibold text-gray-900 dark:text-white">
                  {edu.degree}
                </h4>
                <p className="text-gray-600 dark:text-gray-400">{edu.school}</p>
                <p className="text-sm text-gray-500 dark:text-gray-500">{edu.year}</p>

                {/* Uploaded Documents Section */}
                <div className="mt-3 space-y-2">
                  {/* Certificate Display */}
                  {edu.certificate && (
                    <div className="flex items-center gap-2 p-2 bg-gray-50 dark:bg-gray-700 rounded-lg">
                      <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900 rounded flex items-center justify-center">
                        {isImageFile(edu.certificate) ? (
                          <Monitor className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                        ) : (
                          <FileText className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                        )}
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-900 dark:text-white">
                          Certificate
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          {getFileName(edu.certificate)}
                        </p>
                      </div>
                      <button
                        onClick={() => onViewDocument(edu.certificate!)}
                        className="text-xs text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300"
                      >
                        View
                      </button>
                      {isEditing && (
                        <button
                          onClick={() => onRemoveDocument(edu.id, 'certificate')}
                          className="text-xs text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-300"
                        >
                          Remove
                        </button>
                      )}
                    </div>
                  )}

                  {/* Transcript Display */}
                  {edu.transcript && (
                    <div className="flex items-center gap-2 p-2 bg-gray-50 dark:bg-gray-700 rounded-lg">
                      <div className="w-8 h-8 bg-green-100 dark:bg-green-900 rounded flex items-center justify-center">
                        <FileText className="w-4 h-4 text-green-600 dark:text-green-400" />
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-900 dark:text-white">
                          Transcript
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          {getFileName(edu.transcript)}
                        </p>
                      </div>
                      <button
                        onClick={() => onViewDocument(edu.transcript!)}
                        className="text-xs text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300"
                      >
                        View
                      </button>
                      {isEditing && (
                        <button
                          onClick={() => onRemoveDocument(edu.id, 'transcript')}
                          className="text-xs text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-300"
                        >
                          Remove
                        </button>
                      )}
                    </div>
                  )}

                  {/* File Upload Section (Edit Mode Only) */}
                  {isEditing && (
                    <div className="space-y-2 pt-2 border-t border-gray-200 dark:border-gray-600">
                      <div className="flex items-center gap-2">
                        <label className="text-sm text-gray-600 dark:text-gray-400">
                          Add Certificate:
                        </label>
                        <input
                          type="file"
                          accept=".pdf,.jpg,.jpeg,.png"
                          onChange={(e) =>
                            e.target.files?.[0] &&
                            onUploadDocument(e.target.files[0], 'certificate', edu.id)
                          }
                          className="text-xs"
                        />
                      </div>
                      <div className="flex items-center gap-2">
                        <label className="text-sm text-gray-600 dark:text-gray-400">
                          Add Transcript:
                        </label>
                        <input
                          type="file"
                          accept=".pdf,.doc,.docx"
                          onChange={(e) =>
                            e.target.files?.[0] &&
                            onUploadDocument(e.target.files[0], 'transcript', edu.id)
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
                  onClick={() => onRemoveEducation(edu.id)}
                  className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900 rounded-lg"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
