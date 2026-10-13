import React, { Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { I18nProvider } from './i18n';
import { AdminLayout } from './components/admin/AdminLayout';
import { LoginPage } from './pages/LoginPage';
import { NotAuthorizedPage } from './pages/NotAuthorizedPage';

// Admin Command Center Pages (Lazy-loaded for fast boot)
const AdminOverviewPage = React.lazy(() => import('./pages/admin/AdminOverviewPage').then((m) => ({ default: m.AdminOverviewPage })));
const AdminUsersPage = React.lazy(() => import('./pages/admin/AdminUsersPage').then((m) => ({ default: m.AdminUsersPage })));
const AdminSupportPage = React.lazy(() => import('./pages/admin/AdminSupportPage').then((m) => ({ default: m.AdminSupportPage })));
const AdminFeedbackPage = React.lazy(() => import('./pages/admin/AdminFeedbackPage').then((m) => ({ default: m.AdminFeedbackPage })));
const AdminVocabularyPage = React.lazy(() => import('./pages/admin/AdminVocabularyPage').then((m) => ({ default: m.AdminVocabularyPage })));
const AdminLearningPage = React.lazy(() => import('./pages/admin/AdminLearningPage').then((m) => ({ default: m.AdminLearningPage })));
const AdminNotificationsPage = React.lazy(() => import('./pages/admin/AdminNotificationsPage').then((m) => ({ default: m.AdminNotificationsPage })));
const AdminAIPage = React.lazy(() => import('./pages/admin/AdminAIPage').then((m) => ({ default: m.AdminAIPage })));
const AdminBillingPage = React.lazy(() => import('./pages/admin/AdminBillingPage').then((m) => ({ default: m.AdminBillingPage })));
const AdminFinancePage = React.lazy(() => import('./pages/admin/AdminFinancePage').then((m) => ({ default: m.AdminFinancePage })));
const AdminSystemPage = React.lazy(() => import('./pages/admin/AdminSystemPage').then((m) => ({ default: m.AdminSystemPage })));
const AdminSecurityPage = React.lazy(() => import('./pages/admin/AdminSecurityPage').then((m) => ({ default: m.AdminSecurityPage })));
const AdminSettingsPage = React.lazy(() => import('./pages/admin/AdminSettingsPage').then((m) => ({ default: m.AdminSettingsPage })));
const AdminSharedVocabularyPage = React.lazy(() => import('./pages/admin/AdminSharedVocabularyPage').then((m) => ({ default: m.AdminSharedVocabularyPage })));
const AdminPricingPage = React.lazy(() => import('./pages/admin/AdminPricingPage').then((m) => ({ default: m.AdminPricingPage })));
const AdminPlansPage = React.lazy(() => import('./pages/admin/AdminPlansPage').then((m) => ({ default: m.AdminPlansPage })));
const AdminResourcesPage = React.lazy(() => import('./pages/admin/AdminResourcesPage').then((m) => ({ default: m.AdminResourcesPage })));
const AdminGamesPage = React.lazy(() => import('./pages/admin/AdminGamesPage').then((m) => ({ default: m.AdminGamesPage })));
const AdminFinancialReportsPage = React.lazy(() => import('./pages/admin/AdminFinancialReportsPage').then((m) => ({ default: m.AdminFinancialReportsPage })));
const AdminCommunityModerationPage = React.lazy(() => import('./pages/admin/AdminCommunityModerationPage').then((m) => ({ default: m.AdminCommunityModerationPage })));
const AdminFirebasePage = React.lazy(() => import('./pages/admin/AdminFirebasePage').then((m) => ({ default: m.AdminFirebasePage })));
const AdminLanguagePage = React.lazy(() => import('./pages/admin/AdminLanguagePage').then((m) => ({ default: m.AdminLanguagePage })));
const AdminAssetManagementPage = React.lazy(() => import('./pages/admin/AdminAssetManagementPage').then((m) => ({ default: m.AdminAssetManagementPage })));
const AdminKidManagementPage = React.lazy(() => import('./pages/admin/AdminKidManagementPage').then((m) => ({ default: m.AdminKidManagementPage })));

const AdminLoadingFallback: React.FC = () => (
  <div className="min-h-[50vh] flex items-center justify-center">
    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
  </div>
);

import { ScrollToTop } from './components/common/ScrollToTop';
import { GlobalConfirmDialog } from './components/common/ConfirmDialog';
import { GlobalApiLoadingBar } from './components/common/GlobalApiLoadingBar';
import { GlobalToastContainer } from './components/common/GlobalToastContainer';

const AdminRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, loading, isGuest } = useAuth();
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
      </div>
    );
  }
  if (!user || isGuest) {
    return <Navigate to="/login" replace />;
  }
  if (user.role !== 'ADMIN' && user.role !== 'SUPER_ADMIN') {
    return <NotAuthorizedPage />;
  }
  return <>{children}</>;
};

const AdminPrefixRedirect: React.FC = () => {
  const location = useLocation();
  const target = location.pathname.replace(/^\/admin/, '') || '/';
  return <Navigate to={target + location.search} replace />;
};

export const App: React.FC = () => {
  return (
    <I18nProvider>
      <AuthProvider>
        <BrowserRouter>
          <ScrollToTop />
          <GlobalConfirmDialog />
          <GlobalApiLoadingBar />
          <GlobalToastContainer />
          <Suspense fallback={<AdminLoadingFallback />}>
            <Routes>
              <Route path="/login" element={<LoginPage />} />

              {/* Dedicated Admin Command Center */}
              <Route
                path="/"
                element={
                  <AdminRoute>
                    <AdminLayout />
                  </AdminRoute>
                }
              >
                <Route index element={<AdminOverviewPage />} />
                <Route path="overview" element={<Navigate to="/" replace />} />
                <Route path="dashboard" element={<Navigate to="/" replace />} />
                <Route path="users" element={<AdminUsersPage />} />
                <Route path="assets" element={<AdminAssetManagementPage />} />
                <Route path="asset-management" element={<AdminAssetManagementPage />} />
                <Route path="media" element={<AdminAssetManagementPage />} />
                <Route path="kid" element={<AdminKidManagementPage />} />
                <Route path="kid-management" element={<AdminKidManagementPage />} />
                <Route path="games" element={<AdminGamesPage />} />
                <Route path="support" element={<AdminSupportPage />} />
                <Route path="conversations" element={<AdminSupportPage />} />
                <Route path="feedback" element={<AdminFeedbackPage />} />
                <Route path="vocabulary" element={<AdminVocabularyPage />} />
                <Route path="shared-vocabulary" element={<AdminSharedVocabularyPage />} />
                <Route path="community-moderation" element={<AdminCommunityModerationPage />} />
                <Route path="languages" element={<AdminLanguagePage />} />
                <Route path="learning" element={<AdminLearningPage />} />
                <Route path="resources" element={<AdminResourcesPage />} />
                <Route path="notifications" element={<AdminNotificationsPage />} />
                <Route path="ai" element={<AdminAIPage />} />
                <Route path="plans" element={<AdminPlansPage />} />
                <Route path="billing" element={<AdminBillingPage />} />
                <Route path="finance" element={<AdminFinancePage />} />
                <Route path="reports" element={<AdminFinancialReportsPage />} />
                <Route path="pricing" element={<AdminPricingPage />} />
                <Route path="system" element={<AdminSystemPage />} />
                <Route path="security" element={<AdminSecurityPage />} />
                <Route path="firebase" element={<AdminFirebasePage />} />
                <Route path="settings" element={<AdminSettingsPage />} />
              </Route>

              {/* Handle /admin/* aliases gracefully */}
              <Route path="/admin/*" element={<AdminPrefixRedirect />} />
              <Route path="/admin" element={<Navigate to="/" replace />} />

              {/* Catch-all redirect */}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </Suspense>
        </BrowserRouter>
      </AuthProvider>
    </I18nProvider>
  );
};

export default App;
