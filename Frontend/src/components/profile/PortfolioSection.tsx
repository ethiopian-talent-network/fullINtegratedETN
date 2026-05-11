import { useState, useRef } from "react";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Plus, Trash2, ExternalLink, Upload, X, Loader } from "lucide-react";
import {
  ImageUploadService,
  uploadPortfolioImage,
} from "../../api/upload/imageUpload";

const MAX_PROJECTS = 20;

interface PortfolioItem {
  id?: number | string;
  title: string;
  description: string;
  url: string;
  image?: string;
  role?: string;
  techStack?: string;
}

interface PortfolioSectionProps {
  portfolio: PortfolioItem[];
  isEditing: boolean;
  showAddPortfolio: boolean;
  newPortfolioItem: PortfolioItem;
  onShowAddPortfolioChange: (show: boolean) => void;
  onNewPortfolioItemChange: (item: PortfolioItem) => void;
  onAddPortfolioItem: () => void;
  onRemovePortfolioItem: (id: number | string) => void;
}

export function PortfolioSection({
  portfolio,
  isEditing,
  showAddPortfolio,
  newPortfolioItem,
  onShowAddPortfolioChange,
  onNewPortfolioItemChange,
  onAddPortfolioItem,
  onRemovePortfolioItem,
}: PortfolioSectionProps) {
  const [uploadingImage, setUploadingImage] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleChange = (field: keyof PortfolioItem, value: string) => {
    onNewPortfolioItemChange({
      ...newPortfolioItem,
      [field]: value,
    });
  };

  const handleImageSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate and create preview
    const validation = ImageUploadService.validateImage(file);
    if (!validation.valid) {
      setUploadError(validation.error ?? null);
      return;
    }

    setUploadError(null);
    const previewUrl = ImageUploadService.createPreviewUrl(file);
    setImagePreview(previewUrl);

    // Upload the image
    uploadImageFile(file);
  };

  const uploadImageFile = async (file: File) => {
    setUploadingImage(true);
    setUploadProgress(0);

    try {
      const result = await uploadPortfolioImage(file, (progress) => {
        setUploadProgress(progress.percentage);
      });

      // Update the portfolio item with the uploaded image URL
      handleChange("image", result.secure_url);

      // Clean up preview URL
      if (imagePreview) {
        ImageUploadService.revokePreviewUrl(imagePreview);
        setImagePreview(null);
      }
    } catch (error) {
      setUploadError(error instanceof Error ? error.message : "Upload failed");
      // Clean up preview URL on error
      if (imagePreview) {
        ImageUploadService.revokePreviewUrl(imagePreview);
        setImagePreview(null);
      }
    } finally {
      setUploadingImage(false);
      setUploadProgress(0);
    }
  };

  const removeImage = () => {
    handleChange("image", "");
    if (imagePreview) {
      ImageUploadService.revokePreviewUrl(imagePreview);
      setImagePreview(null);
    }
    setUploadError(null);
    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const triggerFileSelect = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
        <h3 className="text-base sm:text-lg font-semibold">Portfolio</h3>

        {isEditing && portfolio.length < MAX_PROJECTS && (
          <Button
            onClick={() => onShowAddPortfolioChange(true)}
            className="bg-[#0084ca] hover:bg-[#006ba6] w-full sm:w-auto"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Project
          </Button>
        )}
      </div>

      {/* Empty State */}
      {portfolio.length === 0 && !showAddPortfolio && (
        <div className="text-center border-2 border-dashed rounded-xl p-6 sm:p-10">
          <p className="text-gray-500 mb-3 text-sm sm:text-base">
            Showcase your best work to attract clients
          </p>
          {isEditing && (
            <Button
              onClick={() => onShowAddPortfolioChange(true)}
              className="w-full sm:w-auto"
            >
              Add your first project
            </Button>
          )}
        </div>
      )}

      {/* Add Form */}
      {showAddPortfolio && (
        <div className="p-4 sm:p-5 border rounded-xl space-y-4 bg-gray-50 dark:bg-gray-800">
          <h4 className="font-semibold text-base sm:text-lg">Add Project</h4>

          {/* Image Upload Section */}
          <div className="space-y-3">
            <label className="text-sm font-medium">Project Image</label>

            {/* Hidden file input */}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleImageSelect}
              className="hidden"
            />

            {/* Hidden file input */}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleImageSelect}
              className="hidden"
            />

            {/* Image Preview/Upload Area */}
            <div className="relative">
              {newPortfolioItem.image || imagePreview ? (
                <div className="relative">
                  <img
                    src={imagePreview || newPortfolioItem.image}
                    alt="Project preview"
                    className="w-full h-40 sm:h-48 object-cover rounded-lg"
                  />
                  <div className="absolute top-2 right-2 flex gap-2">
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={removeImage}
                      className="p-2"
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                  {uploadingImage && (
                    <div className="absolute inset-0 bg-black/50 rounded-lg flex items-center justify-center">
                      <div className="text-white text-center">
                        <Loader className="w-8 h-8 animate-spin mx-auto mb-2" />
                        <p className="text-sm">
                          Uploading... {uploadProgress}%
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div
                  onClick={triggerFileSelect}
                  className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-6 sm:p-8 text-center cursor-pointer hover:border-[#0084ca] transition-colors"
                >
                  <Upload className="w-10 h-10 sm:w-12 sm:h-12 mx-auto mb-3 text-gray-400" />
                  <p className="text-gray-600 dark:text-gray-300 mb-2 text-sm sm:text-base">
                    Click to upload project image
                  </p>
                  <p className="text-xs text-gray-500">
                    JPEG, PNG, GIF, WebP (max 10MB)
                  </p>
                </div>
              )}
            </div>

            {/* Upload Error */}
            {uploadError && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-sm text-red-600">{uploadError}</p>
              </div>
            )}

            {/* Upload Progress */}
            {uploadingImage && (
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Uploading image...</span>
                  <span>{uploadProgress}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-[#0084ca] h-2 rounded-full transition-all duration-300"
                    style={{ width: `${uploadProgress}%` }}
                  />
                </div>
              </div>
            )}
          </div>

          <Input
            placeholder="Project Title"
            value={newPortfolioItem.title}
            onChange={(e) => handleChange("title", e.target.value)}
          />

          <Input
            placeholder="Short Description"
            value={newPortfolioItem.description}
            onChange={(e) => handleChange("description", e.target.value)}
          />

          <Input
            placeholder="Project URL"
            value={newPortfolioItem.url}
            onChange={(e) => handleChange("url", e.target.value)}
          />

          {/* New fields (important upgrade) */}
          <Input
            placeholder="Your Role (e.g. Frontend Developer)"
            value={newPortfolioItem.role || ""}
            onChange={(e) => handleChange("role", e.target.value)}
          />

          <Input
            placeholder="Technologies (comma separated)"
            value={newPortfolioItem.techStack || ""}
            onChange={(e) => handleChange("techStack", e.target.value)}
          />

          <div className="flex flex-col sm:flex-row gap-2">
            <Button
              onClick={onAddPortfolioItem}
              disabled={uploadingImage}
              className="w-full sm:w-auto"
            >
              {uploadingImage ? (
                <>
                  <Loader className="w-4 h-4 mr-2 animate-spin" />
                  Uploading...
                </>
              ) : (
                "Save Project"
              )}
            </Button>
            <Button
              variant="outline"
              onClick={() => onShowAddPortfolioChange(false)}
              className="w-full sm:w-auto"
            >
              Cancel
            </Button>
          </div>
        </div>
      )}

      {/* Portfolio Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
        {portfolio.map((project) => (
          <div
            key={project.id}
            className="group rounded-xl overflow-hidden border hover:shadow-xl transition"
          >
            {/* Image */}
            <div className="relative h-44 sm:h-52 overflow-hidden">
              <img
                src={project.image}
                alt={project.title}
                className="w-full h-full object-cover group-hover:scale-110 transition duration-500"
              />

              {/* Overlay */}
              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition flex items-center justify-center gap-3">
                <a
                  href={project.url}
                  target="_blank"
                  className="bg-white text-black px-3 py-2 rounded-lg text-sm flex items-center gap-2"
                >
                  <ExternalLink className="w-4 h-4" />
                  View
                </a>

                {isEditing && (
                  <button
                    onClick={() => project.id !== undefined && onRemovePortfolioItem(project.id)}
                    className="bg-red-500 text-white p-2 rounded-lg"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>

            {/* Content */}
            <div className="p-3 sm:p-4 space-y-2">
              <h4 className="font-semibold text-sm sm:text-base">
                {project.title}
              </h4>

              <p className="text-xs sm:text-sm text-gray-500 line-clamp-2">
                {project.description}
              </p>

              {/* Role */}
              {project.role && (
                <p className="text-xs text-gray-400 truncate">
                  Role: {project.role}
                </p>
              )}

              {/* Tech Stack Tags */}
              {project.techStack && (
                <div className="flex flex-wrap gap-1 mt-2">
                  {project.techStack.split(",").map((tech) => (
                    <span
                      key={tech}
                      className="text-xs px-2 py-1 bg-gray-200 dark:bg-gray-700 rounded"
                    >
                      {tech.trim()}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
