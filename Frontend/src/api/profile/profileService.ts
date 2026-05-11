import { profileApi } from "./profileApi";
import type {
  ProfileData,
  ProfileStats,
  Education,
  Certification,
  Portfolio,
  Language,
} from "../../types/profile";

export class ProfileService {
  // Cache for profile data
  private profileCache: ProfileData | null = null;
  private statsCache: ProfileStats | null = null;

  // Get profile with caching
  async getProfile(forceRefresh = false): Promise<ProfileData> {
    if (!forceRefresh && this.profileCache) {
      return this.profileCache;
    }

    try {
      const profile = await profileApi.getProfile();
      this.profileCache = profile;
      return profile;
    } catch (error) {
      console.error("Error fetching profile:", error);
      throw error;
    }
  }

  // Update profile
  async updateProfile(data: Partial<ProfileData>): Promise<ProfileData> {
    try {
      const updatedProfile = await profileApi.updateProfile(data);
      this.profileCache = updatedProfile;
      return updatedProfile;
    } catch (error) {
      console.error("Error updating profile:", error);
      throw error;
    }
  }

  // Upload profile image
  async uploadProfileImage(file: File): Promise<{ imageUrl: string }> {
    try {
      const result = await profileApi.uploadProfileImage(file);
      return result;
    } catch (error) {
      console.error("Error uploading profile image:", error);
      throw error;
    }
  }

  // Get profile stats
  async getProfileStats(forceRefresh = false): Promise<ProfileStats> {
    if (!forceRefresh && this.statsCache) {
      return this.statsCache;
    }

    try {
      const stats = await profileApi.getProfileStats();
      this.statsCache = stats;
      return stats;
    } catch (error) {
      console.error("Error fetching profile stats:", error);
      throw error;
    }
  }

  // Skills management
  async addSkill(skill: string): Promise<ProfileData> {
    try {
      await profileApi.addSkill(skill);
      // Fetch updated profile after adding skill
      const updatedProfile = await profileApi.getProfile();
      this.profileCache = updatedProfile;
      return updatedProfile;
    } catch (error) {
      console.error("Error adding skill:", error);
      throw error;
    }
  }

  async removeSkill(skill: string): Promise<ProfileData> {
    try {
      await profileApi.removeSkill(skill);
      // Fetch updated profile after removing skill
      const updatedProfile = await profileApi.getProfile();
      this.profileCache = updatedProfile;
      return updatedProfile;
    } catch (error) {
      console.error("Error removing skill:", error);
      throw error;
    }
  }

  // Portfolio management
  async addPortfolioItem(item: Omit<Portfolio, "id">): Promise<ProfileData> {
    try {
      await profileApi.addPortfolioItem(item);
      // Fetch updated profile after adding portfolio item
      const updatedProfile = await profileApi.getProfile();
      this.profileCache = updatedProfile;
      return updatedProfile;
    } catch (error) {
      console.error("Error adding portfolio item:", error);
      throw error;
    }
  }

  async removePortfolioItem(itemId: number): Promise<ProfileData> {
    try {
      await profileApi.removePortfolioItem(itemId);
      // Fetch updated profile after removing portfolio item
      const updatedProfile = await profileApi.getProfile();
      this.profileCache = updatedProfile;
      return updatedProfile;
    } catch (error) {
      console.error("Error removing portfolio item:", error);
      throw error;
    }
  }

  // Education management
  async addEducation(education: Omit<Education, "id">): Promise<ProfileData> {
    try {
      await profileApi.addEducation(education);
      // Fetch updated profile after adding education
      const updatedProfile = await profileApi.getProfile();
      this.profileCache = updatedProfile;
      return updatedProfile;
    } catch (error) {
      console.error("Error adding education:", error);
      throw error;
    }
  }

  async removeEducation(itemId: number): Promise<ProfileData> {
    try {
      await profileApi.removeEducation(itemId);
      // Fetch updated profile after removing education
      const updatedProfile = await profileApi.getProfile();
      this.profileCache = updatedProfile;
      return updatedProfile;
    } catch (error) {
      console.error("Error removing education:", error);
      throw error;
    }
  }

  // Certification management
  async addCertification(
    certification: Omit<Certification, "id">,
  ): Promise<ProfileData> {
    try {
      await profileApi.addCertification(certification);
      // Fetch updated profile after adding certification
      const updatedProfile = await profileApi.getProfile();
      this.profileCache = updatedProfile;
      return updatedProfile;
    } catch (error) {
      console.error("Error adding certification:", error);
      throw error;
    }
  }

  async removeCertification(itemId: number): Promise<ProfileData> {
    try {
      await profileApi.removeCertification(itemId);
      // Fetch updated profile after removing certification
      const updatedProfile = await profileApi.getProfile();
      this.profileCache = updatedProfile;
      return updatedProfile;
    } catch (error) {
      console.error("Error removing certification:", error);
      throw error;
    }
  }

  // Document management
  async uploadDocument(
    file: File,
    type: "certificate" | "transcript",
    itemId: number,
  ): Promise<ProfileData> {
    try {
      await profileApi.uploadDocument(file, type, itemId);
      // Fetch updated profile after uploading document
      const updatedProfile = await profileApi.getProfile();
      this.profileCache = updatedProfile;
      return updatedProfile;
    } catch (error) {
      console.error("Error uploading document:", error);
      throw error;
    }
  }

  async deleteDocument(documentId: number): Promise<ProfileData> {
    try {
      await profileApi.deleteDocument(documentId);
      // Fetch updated profile after deleting document
      const updatedProfile = await profileApi.getProfile();
      this.profileCache = updatedProfile;
      return updatedProfile;
    } catch (error) {
      console.error("Error deleting document:", error);
      throw error;
    }
  }

  // Languages management
  async updateLanguages(languages: Language[]): Promise<ProfileData> {
    try {
      const updatedProfile = await profileApi.updateLanguages(languages);
      this.profileCache = updatedProfile;
      return updatedProfile;
    } catch (error) {
      console.error("Error updating languages:", error);
      throw error;
    }
  }

  // Utility methods
  clearCache(): void {
    this.profileCache = null;
    this.statsCache = null;
  }

  // Get cached profile without API call
  getCachedProfile(): ProfileData | null {
    return this.profileCache;
  }

  // Get cached stats without API call
  getCachedStats(): ProfileStats | null {
    return this.statsCache;
  }

  // Validate profile data
  validateProfile(data: Partial<ProfileData>): {
    isValid: boolean;
    errors: string[];
  } {
    const errors: string[] = [];

    if (data.name && data.name.trim().length < 2) {
      errors.push("Name must be at least 2 characters long");
    }

    if (data.title && data.title.trim().length < 3) {
      errors.push("Title must be at least 3 characters long");
    }

    if (data.hourlyRate && isNaN(Number(data.hourlyRate))) {
      errors.push("Hourly rate must be a valid number");
    }

    if (data.bio && data.bio.length > 500) {
      errors.push("Bio must be less than 500 characters");
    }

    if (data.skills && data.skills.length > 20) {
      errors.push("Cannot have more than 20 skills");
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  // Check if profile is empty (new talent)
  isProfileEmpty(profile: ProfileData): boolean {
    return (
      !profile.name.trim() &&
      !profile.title.trim() &&
      !profile.location.trim() &&
      !profile.hourlyRate.trim() &&
      !profile.bio.trim() &&
      profile.skills.length === 0 &&
      profile.languages.length === 0 &&
      profile.education.length === 0 &&
      profile.certifications.length === 0 &&
      profile.portfolio.length === 0
    );
  }

  // Format profile completion percentage
  getProfileCompletionPercentage(profile: ProfileData): number {
    // Basic profile fields (each worth 10%)
    const basicFields = [
      { field: profile.name, weight: 2, name: "Name" },
      { field: profile.title, weight: 2, name: "Title" },
      { field: profile.location, weight: 1, name: "Location" },
      { field: profile.hourlyRate, weight: 1, name: "Hourly Rate" },
      { field: profile.bio, weight: 2, name: "Bio" },
      { field: profile.about, weight: 1, name: "About" },
      { field: profile.experience, weight: 1, name: "Experience" },
      { field: profile.educationText, weight: 1, name: "Education Details" },
      { field: profile.languagesText, weight: 1, name: "Language Details" },
      { field: profile.linkedin, weight: 1, name: "LinkedIn" },
      { field: profile.github, weight: 1, name: "GitHub" },
      { field: profile.resume_url, weight: 1, name: "Resume" },
    ];

    // Calculate basic fields completion
    const basicCompleted = basicFields.reduce((acc, { field, weight }) => {
      return acc + (field && field.trim().length > 0 ? weight : 0);
    }, 0);

    // Section completions (each worth 10%)
    let sectionCompleted = 0;

    // Skills section (10%)
    if (profile.skills && profile.skills.length > 0) {
      sectionCompleted += 2;
    }

    // Languages section (10%)
    if (profile.languages && profile.languages.length > 0) {
      sectionCompleted += 2;
    }

    // Education section (10%)
    if (profile.education && profile.education.length > 0) {
      sectionCompleted += 2;
    }

    // Certifications section (10%)
    if (profile.certifications && profile.certifications.length > 0) {
      sectionCompleted += 2;
    }

    // Portfolio section (10%)
    if (profile.portfolio && profile.portfolio.length > 0) {
      sectionCompleted += 2;
    }

    // Profile image (10%)
    const hasProfileImage = profile.profile_image || profile.image;
    if (hasProfileImage) {
      sectionCompleted += 2;
    }

    // Total possible score: 20 (basic) + 10 (sections) = 30
    const totalPossible = 30;
    const currentScore = basicCompleted + sectionCompleted;

    // Convert to percentage (multiply by 3.33 to get to 100%)
    const percentage = Math.round((currentScore / totalPossible) * 100);

    return Math.min(percentage, 100);
  }

  // Get missing profile fields
  getMissingFields(profile: ProfileData): {
    basic: string[];
    sections: string[];
  } {
    const missingBasic: string[] = [];
    const missingSections: string[] = [];

    // Check basic fields
    if (!profile.name || profile.name.trim().length === 0) missingBasic.push("Name");
    if (!profile.title || profile.title.trim().length === 0) missingBasic.push("Title");
    if (!profile.location || profile.location.trim().length === 0) missingBasic.push("Location");
    if (!profile.hourlyRate || profile.hourlyRate.trim().length === 0) missingBasic.push("Hourly Rate");
    if (!profile.bio || profile.bio.trim().length === 0) missingBasic.push("Bio");
    if (!profile.about || profile.about.trim().length === 0) missingBasic.push("About");
    if (!profile.experience || profile.experience.trim().length === 0) missingBasic.push("Experience");
    if (!profile.linkedin || profile.linkedin.trim().length === 0) missingBasic.push("LinkedIn");
    if (!profile.github || profile.github.trim().length === 0) missingBasic.push("GitHub");
    if (!profile.resume_url || profile.resume_url.trim().length === 0) missingBasic.push("Resume");

    // Check sections
    if (!profile.skills || profile.skills.length === 0) missingSections.push("Skills");
    if (!profile.languages || profile.languages.length === 0) missingSections.push("Languages");
    if (!profile.education || profile.education.length === 0) missingSections.push("Education");
    if (!profile.certifications || profile.certifications.length === 0) missingSections.push("Certifications");
    if (!profile.portfolio || profile.portfolio.length === 0) missingSections.push("Portfolio");
    if (!profile.profile_image && !profile.image) missingSections.push("Profile Image");

    return {
      basic: missingBasic,
      sections: missingSections,
    };
  }
}

// Export singleton instance
export const profileService = new ProfileService();
