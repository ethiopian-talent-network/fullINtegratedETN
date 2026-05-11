import axios from "axios";

// Cloudinary configuration
const CLOUDINARY_URL = "https://api.cloudinary.com/v1_1/dzqma6sfk/image/upload";
const UPLOAD_PRESET = "portfolio_upload";

export interface UploadResponse {
  public_id: string;
  secure_url: string;
  format: string;
  bytes: number;
  original_filename: string;
  created_at: string;
  resource_type: string;
  url: string;
}

export interface UploadProgress {
  loaded: number;
  total: number;
  percentage: number;
}

export class ImageUploadService {
  // Validate image file
  static validateImage(file: File): { valid: boolean; error?: string } {
    // Check file type
    const allowedTypes = ["image/jpeg", "image/jpg", "image/png", "image/gif", "image/webp"];
    if (!allowedTypes.includes(file.type)) {
      return {
        valid: false,
        error: "Invalid file type. Please upload JPEG, PNG, GIF, or WebP images.",
      };
    }

    // Check file size (max 10MB)
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      return {
        valid: false,
        error: "File too large. Please upload images smaller than 10MB.",
      };
    }

    return { valid: true };
  }

  // Upload image to Cloudinary
  static async uploadImage(
    file: File,
    onProgress?: (progress: UploadProgress) => void
  ): Promise<UploadResponse> {
    // Validate file
    const validation = this.validateImage(file);
    if (!validation.valid) {
      throw new Error(validation.error);
    }

    const formData = new FormData();
    formData.append("file", file);
    formData.append("upload_preset", UPLOAD_PRESET);

    try {
      const response = await axios.post<UploadResponse>(CLOUDINARY_URL, formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
        onUploadProgress: (progressEvent) => {
          if (onProgress && progressEvent.total) {
            const progress: UploadProgress = {
              loaded: progressEvent.loaded,
              total: progressEvent.total,
              percentage: Math.round((progressEvent.loaded / progressEvent.total) * 100),
            };
            onProgress(progress);
          }
        },
      });

      return response.data;
    } catch (error) {
      console.error("Upload error:", error);
      
      if (axios.isAxiosError(error)) {
        if (error.response?.status === 400) {
          throw new Error("Invalid upload preset or file format");
        } else if (error.response?.status === 401) {
          throw new Error("Upload service authentication failed");
        } else if (error.response?.status === 413) {
          throw new Error("File too large for upload");
        } else {
          throw new Error("Upload failed. Please try again.");
        }
      }
      
      throw new Error("Upload failed. Please check your internet connection.");
    }
  }

  // Create image preview URL
  static createPreviewUrl(file: File): string {
    return URL.createObjectURL(file);
  }

  // Revoke preview URL to free memory
  static revokePreviewUrl(url: string): void {
    URL.revokeObjectURL(url);
  }

  // Get optimized image URL
  static getOptimizedUrl(originalUrl: string, options?: {
    width?: number;
    height?: number;
    quality?: number;
    format?: string;
  }): string {
    const cloudinaryBase = "https://res.cloudinary.com/dzqma6sfk/image/upload/";
    
    if (!originalUrl.includes(cloudinaryBase)) {
      return originalUrl; // Not a Cloudinary URL
    }

    const transformations = [];
    
    if (options?.width || options?.height) {
      transformations.push(`w_${options.width || 'auto'},h_${options.height || 'auto'}`);
    }
    
    if (options?.quality) {
      transformations.push(`q_${options.quality}`);
    }
    
    if (options?.format) {
      transformations.push(`f_${options.format}`);
    }

    const transformationString = transformations.length > 0 ? transformations.join(',') + '/' : '';
    
    return originalUrl.replace(
      /\/upload\/v\d+\//,
      `/upload/${transformationString}`
    );
  }

  // Delete image from Cloudinary (requires server-side implementation)
  static async deleteImage(publicId: string): Promise<void> {
    // This would need to be implemented on the server side
    // as Cloudinary deletion requires authentication
    console.log("Delete image:", publicId);
    // TODO: Implement server-side deletion endpoint
  }
}

// Utility function for common upload scenarios
export const uploadPortfolioImage = async (
  file: File,
  onProgress?: (progress: UploadProgress) => void
): Promise<UploadResponse> => {
  return ImageUploadService.uploadImage(file, onProgress);
};
