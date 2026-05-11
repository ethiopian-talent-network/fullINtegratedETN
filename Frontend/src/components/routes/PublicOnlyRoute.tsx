import { Navigate, useLocation } from "react-router";
import { type ReactNode } from "react";
import { useAuth } from "../../contexts/AuthContext";

interface PublicOnlyRouteProps {
  children: ReactNode;
}

export const PublicOnlyRoute = ({ children }: PublicOnlyRouteProps) => {
  const { isAuthenticated, isLoading, user } = useAuth();
  const location = useLocation();
  const from = (location.state as any)?.from;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  // Only redirect away from login/signup/otp pages, NOT from landing page
  if (isAuthenticated && user) {
    const destination = from || (user.role === "employer" ? "/employer-dashboard" : "/talent-dashboard");
    return <Navigate to={destination} replace />;
  }

  return <>{children}</>;
};
