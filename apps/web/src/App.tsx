import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { I18nProvider } from './i18n';
import { AppShell } from './components/layout/AppShell';
import { LandingPage } from './pages/LandingPage';
import { LoginPage } from './pages/LoginPage';
import { RegisterPage } from './pages/RegisterPage';
import { DashboardPage } from './pages/DashboardPage';
import { ReviewSessionPage } from './pages/ReviewSessionPage';
import { VocabularyExplorerPage } from './pages/VocabularyExplorerPage';
import { PlacementTestPage } from './pages/PlacementTestPage';
import { AITutorPage } from './pages/AITutorPage';
import { ProgressAnalyticsPage } from './pages/ProgressAnalyticsPage';
import { SettingsPage } from './pages/SettingsPage';
import { CommunityDecksPage } from './pages/CommunityDecksPage';
import { MyWordBankPage } from './pages/MyWordBankPage';
import { CustomQuizPage } from './pages/CustomQuizPage';
import { SubscriptionUpgradePage } from './pages/SubscriptionUpgradePage';
import { ContextualLoginModal } from './components/auth/ContextualLoginModal';

// User Portal Pages
import { SupportCenterPage } from './pages/SupportCenterPage';
import { FeedbackPortalPage } from './pages/FeedbackPortalPage';
import { NotificationCenterPage } from './pages/NotificationCenterPage';

// Admin Command Center Layout & Pages
import { AdminLayout } from './components/admin/AdminLayout';
import { AdminOverviewPage } from './pages/admin/AdminOverviewPage';
import { AdminUsersPage } from './pages/admin/AdminUsersPage';
import { AdminSupportPage } from './pages/admin/AdminSupportPage';
import { AdminFeedbackPage } from './pages/admin/AdminFeedbackPage';
import { AdminVocabularyPage } from './pages/admin/AdminVocabularyPage';
import { AdminLearningPage } from './pages/admin/AdminLearningPage';
import { AdminNotificationsPage } from './pages/admin/AdminNotificationsPage';
import { AdminAIPage } from './pages/admin/AdminAIPage';
import { AdminBillingPage } from './pages/admin/AdminBillingPage';
import { AdminSystemPage } from './pages/admin/AdminSystemPage';
import { AdminSecurityPage } from './pages/admin/AdminSecurityPage';

const ProtectedRoute: React.FC<{ children: React.ReactNode; requireAuth?: boolean }> = ({
  children,
  requireAuth = false,
}) => {
  const { user, loading, isGuest, promptLogin } = useAuth();
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  // If page strictly requires a saved account (e.g. personal bank)
  if (requireAuth && isGuest) {
    return (
      <div className="p-8 max-w-lg mx-auto text-center space-y-4">
        <h3 className="text-xl font-bold">Yêu cầu đăng nhập tài khoản</h3>
        <p className="text-xs text-slate-500">
          Tính năng này cần lưu trữ dữ liệu cá nhân hóa trên đám mây của bạn.
        </p>
        <button
          onClick={() => promptLogin('Mở khóa lưu trữ kho từ vựng cá nhân')}
          className="btn-glass-primary text-xs !py-2.5 !px-5"
        >
          Đăng nhập / Tạo tài khoản miễn phí
        </button>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }
  return <>{children}</>;
};

const AdminRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, loading, isGuest } = useAuth();
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
      </div>
    );
  }
  if (!user || isGuest || (user.role !== 'ADMIN' && user.role !== 'SUPER_ADMIN')) {
    return <Navigate to="/dashboard" replace />;
  }
  return <>{children}</>;
};

export const App: React.FC = () => {
  return (
    <I18nProvider>
      <AuthProvider>
        <BrowserRouter>
          <ContextualLoginModal />
          <Routes>
            {/* Public Entry Routes */}
            <Route path="/" element={<LandingPage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />

            {/* User Learning Application Shell */}
            <Route
              element={
                <ProtectedRoute>
                  <AppShell />
                </ProtectedRoute>
              }
            >
              <Route path="/dashboard" element={<DashboardPage />} />
              <Route path="/review" element={<ReviewSessionPage />} />
              <Route path="/vocabulary" element={<VocabularyExplorerPage />} />
              <Route
                path="/word-bank"
                element={
                  <ProtectedRoute requireAuth={true}>
                    <MyWordBankPage />
                  </ProtectedRoute>
                }
              />
              <Route path="/community" element={<CommunityDecksPage />} />
              <Route path="/custom-quiz" element={<CustomQuizPage />} />
              <Route path="/placement-test" element={<PlacementTestPage />} />
              <Route path="/ai-tutor" element={<AITutorPage />} />
              <Route path="/progress" element={<ProgressAnalyticsPage />} />
              <Route path="/upgrade" element={<SubscriptionUpgradePage />} />
              
              {/* User Support, Feedback & Notifications */}
              <Route path="/support" element={<SupportCenterPage />} />
              <Route path="/feedback" element={<FeedbackPortalPage />} />
              <Route path="/notifications" element={<NotificationCenterPage />} />

              <Route path="/settings" element={<SettingsPage />} />
            </Route>

            {/* Dedicated Admin Control Center (Strictly separated layout & routing) */}
            <Route
              path="/admin"
              element={
                <AdminRoute>
                  <AdminLayout />
                </AdminRoute>
              }
            >
              <Route index element={<AdminOverviewPage />} />
              <Route path="overview" element={<AdminOverviewPage />} />
              <Route path="users" element={<AdminUsersPage />} />
              <Route path="support" element={<AdminSupportPage />} />
              <Route path="feedback" element={<AdminFeedbackPage />} />
              <Route path="vocabulary" element={<AdminVocabularyPage />} />
              <Route path="learning" element={<AdminLearningPage />} />
              <Route path="notifications" element={<AdminNotificationsPage />} />
              <Route path="ai" element={<AdminAIPage />} />
              <Route path="billing" element={<AdminBillingPage />} />
              <Route path="system" element={<AdminSystemPage />} />
              <Route path="security" element={<AdminSecurityPage />} />
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
