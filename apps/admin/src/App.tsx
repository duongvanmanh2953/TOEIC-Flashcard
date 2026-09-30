import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { I18nProvider } from './i18n';
import { AdminLayout } from './components/admin/AdminLayout';
import { LoginPage } from './pages/LoginPage';
import { NotAuthorizedPage } from './pages/NotAuthorizedPage';

// Admin Command Center Pages
import { AdminOverviewPage } from './pages/admin/AdminOverviewPage';
import { AdminUsersPage } from './pages/admin/AdminUsersPage';
import { AdminSupportPage } from './pages/admin/AdminSupportPage';
import { AdminFeedbackPage } from './pages/admin/AdminFeedbackPage';
import { AdminVocabularyPage } from './pages/admin/AdminVocabularyPage';
import { AdminLearningPage } from './pages/admin/AdminLearningPage';
import { AdminNotificationsPage } from './pages/admin/AdminNotificationsPage';
import { AdminAIPage } from './pages/admin/AdminAIPage';
import { AdminBillingPage } from './pages/admin/AdminBillingPage';
import { AdminFinancePage } from './pages/admin/AdminFinancePage';
import { AdminSystemPage } from './pages/admin/AdminSystemPage';
import { AdminSecurityPage } from './pages/admin/AdminSecurityPage';
import { AdminSettingsPage } from './pages/admin/AdminSettingsPage';
import { AdminSharedVocabularyPage } from './pages/admin/AdminSharedVocabularyPage';
import { AdminPricingPage } from './pages/admin/AdminPricingPage';
import { AdminPlansPage } from './pages/admin/AdminPlansPage';
import { AdminResourcesPage } from './pages/admin/AdminResourcesPage';
import { AdminGamesPage } from './pages/admin/AdminGamesPage';
import { AdminFinancialReportsPage } from './pages/admin/AdminFinancialReportsPage';
import { AdminCommunityModerationPage } from './pages/admin/AdminCommunityModerationPage';
import { AdminFirebasePage } from './pages/admin/AdminFirebasePage';
import { AdminLanguagePage } from './pages/admin/AdminLanguagePage';
import { AdminAssetManagementPage } from './pages/admin/AdminAssetManagementPage';

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

export const App: React.FC = () => {
  return (
    <I18nProvider>
      <AuthProvider>
        <BrowserRouter>
          <ScrollToTop />
          <GlobalConfirmDialog />
          <GlobalApiLoadingBar />
          <GlobalToastContainer />
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

            {/* Catch-all redirect */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </I18nProvider>
  );
};

export default App;
