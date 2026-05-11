/**
 * Route configuration for the application
 * Centralized route management for better maintainability
 */

export const RouteRole = {
  PUBLIC: "public",
  TALENT: "talent",
  EMPLOYER: "employer",
  ADMIN: "admin",
  OWNER: "owner",
  BOTH: "talent,employer",
} as const;

export type RouteRole = (typeof RouteRole)[keyof typeof RouteRole];

export interface RouteConfig {
  path: string;
  title: string;
  roles?: RouteRole[];
  description?: string;
}

/**
 * Public routes - accessible without authentication
 */
export const PUBLIC_ROUTES: Record<string, RouteConfig> = {
  HOME: {
    path: "/",
    title: "Home",
    roles: [RouteRole.PUBLIC],
    description: "Landing page",
  },
  LOGIN: {
    path: "/login",
    title: "Login",
    roles: [RouteRole.PUBLIC],
    description: "User login page",
  },
  SIGNUP: {
    path: "/signup",
    title: "Sign Up",
    roles: [RouteRole.PUBLIC],
    description: "User registration page",
  },
  OTP_VERIFICATION: {
    path: "/verify-otp",
    title: "Verify OTP",
    roles: [RouteRole.PUBLIC],
    description: "OTP verification page",
  },
  PUBLIC_PROFILE: {
    path: "/freelancer-profile/:id",
    title: "Public Profile",
    roles: [RouteRole.PUBLIC],
    description: "Public freelancer profile view",
  },
  UNAUTHORIZED: {
    path: "/unauthorized",
    title: "Unauthorized",
    roles: [RouteRole.PUBLIC],
    description: "Unauthorized access page",
  },
  NOT_FOUND: {
    path: "*",
    title: "Not Found",
    roles: [RouteRole.PUBLIC],
    description: "404 error page",
  },
};

/**
 * Talent routes - accessible only by talent users
 */
export const TALENT_ROUTES: Record<string, RouteConfig> = {
  DASHBOARD: {
    path: "/talent-dashboard",
    title: "Talent Dashboard",
    roles: [RouteRole.TALENT],
    description: "Main dashboard for talent users",
  },
  PROFILE: {
    path: "/talent-profile",
    title: "My Profile",
    roles: [RouteRole.TALENT],
    description: "Talent profile management",
  },
  PROFILE_EDIT: {
    path: "/talent-profile/:id",
    title: "Edit Profile",
    roles: [RouteRole.TALENT],
    description: "Edit specific profile section",
  },
  APPLICATIONS: {
    path: "/my-applications",
    title: "My Applications",
    roles: [RouteRole.TALENT],
    description: "View job applications",
  },
  APPLY_JOB: {
    path: "/apply/:jobId",
    title: "Apply to Job",
    roles: [RouteRole.TALENT],
    description: "Job application form",
  },
  BILLING: {
    path: "/billing",
    title: "Billing",
    roles: [RouteRole.TALENT],
    description: "Billing information management",
  },
  PORTFOLIO: {
    path: "/portfolio",
    title: "Portfolio & Skills",
    roles: [RouteRole.TALENT],
    description: "Manage portfolio projects and skills",
  },
  NETWORK: {
    path: "/talent-network",
    title: "Talent Network",
    roles: [RouteRole.TALENT],
    description: "Connect with other talents",
  },
  DISCOVER: {
    path: "/discover-talents",
    title: "Discover Talents",
    roles: [RouteRole.TALENT],
    description: "Discover and connect with talents",
  },
  NOTIFICATIONS: {
    path: "/notifications",
    title: "Notifications",
    roles: [RouteRole.TALENT],
    description: "View all notifications",
  },
  VERIFY_IDENTITY: {
    path: "/verify-identity",
    title: "Verify Identity",
    roles: [RouteRole.TALENT],
    description: "Submit National ID for admin verification",
  },
};

/**
 * Employer routes - accessible only by employer users
 */
export const EMPLOYER_ROUTES: Record<string, RouteConfig> = {
  DASHBOARD: {
    path: "/employer-dashboard",
    title: "Employer Dashboard",
    roles: [RouteRole.EMPLOYER],
    description: "Main dashboard for employer users",
  },
  PROFILE: {
    path: "/employer-profile",
    title: "Company Profile",
    roles: [RouteRole.EMPLOYER],
    description: "Employer company profile",
  },
  POST_JOB: {
    path: "/post-job",
    title: "Post Job",
    roles: [RouteRole.EMPLOYER],
    description: "Post a new job listing",
  },
  JOB_APPLICATIONS: {
    path: "/job-applications",
    title: "Job Applications",
    roles: [RouteRole.EMPLOYER],
    description: "View job applications",
  },
  PROPOSALS: {
    path: "/proposals/:jobId",
    title: "Job Proposals",
    roles: [RouteRole.EMPLOYER],
    description: "View proposals for a specific job",
  },
  ALL_PROPOSALS: {
    path: "/proposals",
    title: "All Proposals",
    roles: [RouteRole.EMPLOYER],
    description: "View all proposals and applications",
  },
  ESCROW_PAYMENT: {
    path: "/escrow-payment/:job_id",
    title: "Escrow Payment",
    roles: [RouteRole.EMPLOYER],
    description: "Fund escrow and release payment for a job",
  },
  AGREEMENT: {
    path: "/employer/agreement/:jobId",
    title: "Work Agreement",
    roles: [RouteRole.EMPLOYER],
    description: "Review and accept work agreement before payment",
  },
};

export const OWNER_ROUTES: Record<string, RouteConfig> = {
  DASHBOARD: {
    path: "/owner",
    title: "Owner Dashboard",
    roles: [RouteRole.OWNER],
    description: "Platform payment management",
  },
};

/**
 * Admin routes - accessible only by admin users
 */
export const ADMIN_ROUTES: Record<string, RouteConfig> = {
  DASHBOARD: {
    path: "/admin",
    title: "Admin Dashboard",
    roles: [RouteRole.ADMIN],
    description: "Platform administration",
  },
  INTERNAL_LOGIN: {
    path: "/admin/login",
    title: "Admin Login",
    roles: [RouteRole.PUBLIC],
    description: "Admin login page",
  },
  LICENSE_REVIEW: {
    path: "/admin/license-review",
    title: "License Review",
    roles: [RouteRole.ADMIN],
    description: "Review employer license requests",
  },
  USER_MANAGEMENT: {
    path: "/admin/users",
    title: "User Management",
    roles: [RouteRole.ADMIN],
    description: "Manage platform users",
  },
  VERIFICATION_REQUESTS: {
    path: "/admin/verification-requests",
    title: "Verification Requests",
    roles: [RouteRole.ADMIN],
    description: "Review talent verification requests",
  },
};

/**
 * Shared routes - accessible by both talent and employer users
 */
export const SHARED_ROUTES: Record<string, RouteConfig> = {
  MESSAGES: {
    path: "/messages",
    title: "Messages",
    roles: [RouteRole.TALENT, RouteRole.EMPLOYER],
    description: "Messaging system",
  },
};

/**
 * All routes combined
 */
export const ALL_ROUTES = {
  ...PUBLIC_ROUTES,
  ...TALENT_ROUTES,
  ...EMPLOYER_ROUTES,
  ...ADMIN_ROUTES,
  ...OWNER_ROUTES,
  ...SHARED_ROUTES,
};

/**
 * Legacy route mappings for backward compatibility
 * These map old route paths to new ones
 */
export const LEGACY_ROUTE_MAPPINGS: Record<string, string> = {
  // No legacy mappings needed - using original paths
};

/**
 * Helper function to build route paths with parameters
 */
export function buildRoute(
  routeConfig: RouteConfig,
  params?: Record<string, string | number>,
): string {
  let path = routeConfig.path;
  if (params) {
    Object.keys(params).forEach((key) => {
      path = path.replace(`:${key}`, String(params[key]));
    });
  }
  return path;
}

/**
 * Helper function to check if user has access to route
 */
export function hasRouteAccess(
  userRoles: string[],
  routeRoles: RouteRole[],
): boolean {
  if (routeRoles.includes(RouteRole.PUBLIC)) return true;
  if (routeRoles.includes(RouteRole.BOTH)) return true;
  return userRoles.some((role) => routeRoles.includes(role as RouteRole));
}
