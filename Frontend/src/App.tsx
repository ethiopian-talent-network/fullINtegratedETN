import { BrowserRouter, Routes, Route } from "react-router";
import Login from "./pages/login";
import Signup from "./pages/signup";
import Landing from "./pages/landing";
import OtpVerification from "./pages/otp-verification";
import EmployerDashboard from "./pages/employer/EmployerDashboard";
import EmployerProfilePage from "./pages/employer/EmployerProfile";
import FreelancerDashboard from "./features/talents/FreelancerDashboard";
import TalentNetwork from "./features/talents/TalentNetwork";
import TalentDiscovery from "./features/talents/TalentDiscovery";
import MessagingPage from "./features/messaging/MessagingPage";
import JobPosting from "./pages/JobPosting";
import FreelancerPublicProfile from "./pages/talentPublicProfile";
import TalentProfile from "./pages/talentProfile";
import MyApplications from "./pages/MyApplications";
import Billing from "./pages/Billing";
import JobApplications from "./pages/JobApplications";
import ApplyToJob from "./pages/ApplyToJob";
import ProposalsPage from "./pages/employer/ProposalsPage";
import AllProposalsPage from "./features/employer/components/ProposalsPage";
import EscrowPaymentPage from "./pages/employer/EscrowPaymentPage";
import AgreementPage from "./pages/employer/AgreementPage";
import Portfolio from "./pages/Portfolio";
import NotificationsPage from "./pages/NotificationsPage";
import VerifyIdentity from "./pages/VerifyIdentity";
import OwnerDashboard from "./pages/owner/OwnerDashboard";
import InternalLogin from "./pages/admin/InternalLogin";
import AdminDashboard from "./pages/admin/AdminDashboard";
import TalentsDashboard from "./pages/admin/TalentsDashboard";
import PayoutsManagementPage from "./pages/admin/PayoutsManagementPage";
import AgreementsPage from "./pages/AgreementsPage";
import SimpleAITest from "./components/SimpleAITest";
import AITest from "./components/AITest";
import { DarkModeProvider } from "./contexts/DarkModeContext";
import { AuthProvider } from "./contexts/AuthContext";
import { ProtectedRoute } from "./components/routes/ProtectedRoute";
import { PublicOnlyRoute } from "./components/routes/PublicOnlyRoute";
import { ErrorBoundary } from "./components/error/ErrorBoundary";
import { NotFound } from "./components/error/NotFound";
import { Unauthorized } from "./components/error/Unauthorized";
import {
  PUBLIC_ROUTES,
  TALENT_ROUTES,
  EMPLOYER_ROUTES,
  SHARED_ROUTES,
  OWNER_ROUTES,
} from "./config/routes";

function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <DarkModeProvider>
          <BrowserRouter>
            <Routes>
              {/* Public routes */}
              <Route path={PUBLIC_ROUTES.HOME.path} element={<Landing />} />
              <Route
                path={PUBLIC_ROUTES.LOGIN.path}
                element={
                  <PublicOnlyRoute>
                    <Login />
                  </PublicOnlyRoute>
                }
              />
              <Route
                path={PUBLIC_ROUTES.SIGNUP.path}
                element={
                  <PublicOnlyRoute>
                    <Signup />
                  </PublicOnlyRoute>
                }
              />
              <Route
                path={PUBLIC_ROUTES.OTP_VERIFICATION.path}
                element={
                  <PublicOnlyRoute>
                    <OtpVerification />
                  </PublicOnlyRoute>
                }
              />
              <Route
                path={PUBLIC_ROUTES.PUBLIC_PROFILE.path}
                element={<FreelancerPublicProfile />}
              />

              {/* Protected routes - Talent only */}
              <Route
                path={TALENT_ROUTES.DASHBOARD.path}
                element={
                  <ProtectedRoute allowedRoles={["talent"]}>
                    <FreelancerDashboard />
                  </ProtectedRoute>
                }
              />
              <Route
                path={TALENT_ROUTES.NETWORK.path}
                element={
                  <ProtectedRoute allowedRoles={["talent"]}>
                    <TalentNetwork />
                  </ProtectedRoute>
                }
              />
              <Route
                path={TALENT_ROUTES.DISCOVER.path}
                element={
                  <ProtectedRoute allowedRoles={["talent"]}>
                    <TalentDiscovery />
                  </ProtectedRoute>
                }
              />
              <Route
                path={TALENT_ROUTES.PROFILE.path}
                element={
                  <ProtectedRoute allowedRoles={["talent"]}>
                    <TalentProfile />
                  </ProtectedRoute>
                }
              />
              <Route
                path={TALENT_ROUTES.PROFILE_EDIT.path}
                element={
                  <ProtectedRoute allowedRoles={["talent"]}>
                    <TalentProfile />
                  </ProtectedRoute>
                }
              />
              <Route
                path={TALENT_ROUTES.APPLICATIONS.path}
                element={
                  <ProtectedRoute allowedRoles={["talent"]}>
                    <MyApplications />
                  </ProtectedRoute>
                }
              />
              <Route
                path={TALENT_ROUTES.APPLY_JOB.path}
                element={
                  <ProtectedRoute allowedRoles={["talent"]}>
                    <ApplyToJob />
                  </ProtectedRoute>
                }
              />
              <Route
                path={TALENT_ROUTES.BILLING.path}
                element={
                  <ProtectedRoute allowedRoles={["talent"]}>
                    <Billing />
                  </ProtectedRoute>
                }
              />
              <Route
                path={TALENT_ROUTES.PORTFOLIO.path}
                element={
                  <ProtectedRoute allowedRoles={["talent"]}>
                    <Portfolio />
                  </ProtectedRoute>
                }
              />
              <Route
                path={TALENT_ROUTES.NOTIFICATIONS.path}
                element={
                  <ProtectedRoute allowedRoles={["talent"]}>
                    <NotificationsPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path={TALENT_ROUTES.VERIFY_IDENTITY.path}
                element={
                  <ProtectedRoute allowedRoles={["talent"]}>
                    <VerifyIdentity />
                  </ProtectedRoute>
                }
              />

              {/* Shared routes - Both talent and employer */}
              <Route
                path={SHARED_ROUTES.MESSAGES.path}
                element={
                  <ProtectedRoute allowedRoles={["talent"]}>
                    <MessagingPage />
                  </ProtectedRoute>
                }
              />

              {/* Protected routes - Employer only */}
              <Route
                path={EMPLOYER_ROUTES.DASHBOARD.path}
                element={
                  <ProtectedRoute allowedRoles={["employer"]}>
                    <EmployerDashboard />
                  </ProtectedRoute>
                }
              />
              <Route
                path={EMPLOYER_ROUTES.PROFILE.path}
                element={
                  <ProtectedRoute allowedRoles={["employer"]}>
                    <EmployerProfilePage />
                  </ProtectedRoute>
                }
              />
              <Route
                path={EMPLOYER_ROUTES.POST_JOB.path}
                element={
                  <ProtectedRoute allowedRoles={["employer"]}>
                    <JobPosting />
                  </ProtectedRoute>
                }
              />
              <Route
                path={EMPLOYER_ROUTES.JOB_APPLICATIONS.path}
                element={
                  <ProtectedRoute allowedRoles={["employer"]}>
                    <JobApplications />
                  </ProtectedRoute>
                }
              />
              <Route
                path={EMPLOYER_ROUTES.PROPOSALS.path}
                element={
                  <ProtectedRoute allowedRoles={["employer"]}>
                    <ProposalsPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path={EMPLOYER_ROUTES.ALL_PROPOSALS.path}
                element={
                  <ProtectedRoute allowedRoles={["employer"]}>
                    <AllProposalsPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path={EMPLOYER_ROUTES.ESCROW_PAYMENT.path}
                element={
                  <ProtectedRoute allowedRoles={["employer"]}>
                    <EscrowPaymentPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path={EMPLOYER_ROUTES.AGREEMENT.path}
                element={
                  <ProtectedRoute allowedRoles={["employer"]}>
                    <AgreementPage />
                  </ProtectedRoute>
                }
              />

              {/* Internal portal routes — no auth wrapper, handled internally */}
              <Route path="/admin/login" element={<InternalLogin />} />
              <Route path="/admin/dashboard" element={<AdminDashboard />} />
              <Route path="/admin/talents" element={<TalentsDashboard />} />
              <Route path="/admin/payouts" element={<PayoutsManagementPage />} />

              {/* Shared routes - Agreements and Payouts */}
              <Route
                path="/agreements"
                element={
                  <ProtectedRoute allowedRoles={["talent", "employer"]}>
                    <AgreementsPage />
                  </ProtectedRoute>
                }
              />

              {/* Owner route */}
              <Route path={OWNER_ROUTES.DASHBOARD.path} element={<OwnerDashboard />} />

              {/* AI Test Routes - Development only */}
              <Route path="/ai-test" element={<AITest />} />
              <Route path="/simple-ai-test" element={<SimpleAITest />} />

              {/* Error routes */}
              <Route
                path={PUBLIC_ROUTES.UNAUTHORIZED.path}
                element={<Unauthorized />}
              />

              {/* 404 catch-all */}
              <Route
                path={PUBLIC_ROUTES.NOT_FOUND.path}
                element={<NotFound />}
              />
            </Routes>
          </BrowserRouter>
        </DarkModeProvider>
      </AuthProvider>
    </ErrorBoundary>
  );
}

export default App;
