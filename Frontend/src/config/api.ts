/**
 * API Configuration
 * Centralized API base URL configuration using environment variables
 */

const envApiUrl = import.meta.env.VITE_API_BASE_URL;
export const API_BASE_URL = envApiUrl;

// Log the API base URL for debugging
console.log("API Configuration:");
console.log("- Environment VITE_API_BASE_URL:", envApiUrl);
console.log("- Final API_BASE_URL:", API_BASE_URL);

/**
 * Validate API configuration
 */
export function validateApiConfig(): {
  valid: boolean;
  url: string;
  error?: string;
} {
  if (!API_BASE_URL) {
    return {
      valid: false,
      url: "",
      error: "API_BASE_URL is not defined. Please check your .env file.",
    };
  }

  try {
    new URL(API_BASE_URL);
    return {
      valid: true,
      url: API_BASE_URL,
    };
  } catch (error) {
    return {
      valid: false,
      url: API_BASE_URL,
      error: `Invalid API_BASE_URL format: ${error}`,
    };
  }
}

// Validate on load
const validation = validateApiConfig();
if (!validation.valid) {
  console.error("API Configuration Error:", validation.error);
} else {
  console.log("API Configuration Valid:", validation.url);
}

/**
 * Helper function to build full API endpoint URLs
 */
export function buildApiUrl(path: string): string {
  // Remove leading slash if present to avoid double slashes
  const cleanPath = path.startsWith("/") ? path.slice(1) : path;
  const url = `${API_BASE_URL}/${cleanPath}`;
  console.log(`Building API URL: ${url}`);
  return url;
}

/**
 * Helper function to build full API endpoint URLs with query parameters
 */
export function buildApiUrlWithParams(
  path: string,
  params: Record<string, string | number | boolean | undefined>,
): string {
  const url = buildApiUrl(path);
  const queryString = new URLSearchParams(
    Object.entries(params)
      .filter(([_, value]) => value !== undefined)
      .map(([key, value]) => [key, String(value)]),
  ).toString();
  return queryString ? `${url}?${queryString}` : url;
}
