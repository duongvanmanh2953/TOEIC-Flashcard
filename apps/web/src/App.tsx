import React, { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { LearningProvider } from './contexts/LearningContext';
import { I18nProvider } from './i18n';
import { AppShell } from './components/layout/AppShell';
import { LandingPage } from './pages/LandingPage';
import { LoginPage } from './pages/LoginPage';
import { RegisterPage } from './pages/RegisterPage';
import { ForgotPasswordPage } from './pages/ForgotPasswordPage';
import { DashboardPage } from './pages/DashboardPage';
import { MyLanguagesPage } from './pages/MyLanguagesPage';
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
import { LeaderboardPage } from './pages/LeaderboardPage';
import { AICoachStudioPage } from './pages/AICoachStudioPage';
import { ContextualLoginModal } from './components/auth/ContextualLoginModal';

// Exam Bank & Evaluation Engine Pages
import { ExamBankPage } from './pages/exams/ExamBankPage';
import { ExamEditorPage } from './pages/exams/ExamEditorPage';
import { ExamSessionPage } from './pages/exams/ExamSessionPage';
import { ExamResultPage } from './pages/exams/ExamResultPage';
import { WrongAnswerReviewPage } from './pages/exams/WrongAnswerReviewPage';

// User Portal Pages
import { SupportCenterPage } from './pages/SupportCenterPage';
import { FeedbackPortalPage } from './pages/FeedbackPortalPage';
import { NotificationCenterPage } from './pages/NotificationCenterPage';
import { NotesPage } from './pages/notes/NotesPage';
import { CommunityKnowledgeFeedPage } from './pages/community/CommunityKnowledgeFeedPage';
import { CommunityPostDetailPage } from './pages/community/CommunityPostDetailPage';
import { CreateEditPostPage } from './pages/community/CreateEditPostPage';
import { MyPostsPage } from './pages/community/MyPostsPage';
import { SavedPostsPage } from './pages/community/SavedPostsPage';
import { AdminCommunityModerationPage } from './pages/admin/AdminCommunityModerationPage';

// Mandatory E-Commerce Legal Policy Pages (Ministry of Industry and Trade Compliance)
import { PrivacyPolicyPage } from './pages/policies/PrivacyPolicyPage';
import { PaymentPolicyPage } from './pages/policies/PaymentPolicyPage';
import { DeliveryRefundPolicyPage } from './pages/policies/DeliveryRefundPolicyPage';
import { ComplaintResolutionPage } from './pages/policies/ComplaintResolutionPage';
import { TermsOfServicePage } from './pages/policies/TermsOfServicePage';

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
import { GameLobbyPage } from './pages/games/GameLobbyPage';
import { RealtimeGameRoomPage } from './pages/games/RealtimeGameRoomPage';
import { WordMatchGame } from './pages/games/WordMatchGame';
import { WordScrambleGame } from './pages/games/WordScrambleGame';
import { NotAuthorizedPage } from './pages/NotAuthorizedPage';
import { AdminFirebasePage } from './pages/admin/AdminFirebasePage';
import { AdminLanguagePage } from './pages/admin/AdminLanguagePage';
import { ScrollToTop } from './components/common/ScrollToTop';
import { GlobalConfirmDialog } from './components/common/ConfirmDialog';
import { GlobalApiLoadingBar } from './components/common/GlobalApiLoadingBar';
import { GlobalToastContainer } from './components/common/GlobalToastContainer';

// Kids English Learning System
import { KidsLayout } from './kids/components/KidsLayout';
import { KidsHomePage } from './kids/pages/KidsHomePage';
import { KidsJourneyPage } from './kids/pages/KidsJourneyPage';
import { KidsLessonPage } from './kids/pages/KidsLessonPage';
import { KidsGamesPage } from './kids/pages/KidsGamesPage';
import { KidsMyWorldPage } from './kids/pages/KidsMyWorldPage';
import { KidsParentDashboardPage } from './kids/pages/KidsParentDashboardPage';
import { KidsFlashcardsPage } from './kids/pages/KidsFlashcardsPage';
import { kidsAudioManager } from './kids/services/audio/KidsAudioManager';
import { voiceService } from './kids/services/voice/voiceService';

const RouteAudioWatcher: React.FC = () => {
  const location = useLocation();
  useEffect(() => {
    if (!location.pathname.startsWith('/kids')) {
      kidsAudioManager.stopAll();
      voiceService.stop();
    }
  }, [location.pathname]);
  return null;
};

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

  if (requireAuth && !user) {
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
        <LearningProvider>
          <BrowserRouter>
            <RouteAudioWatcher />
            <ScrollToTop />
            <ContextualLoginModal />
            <GlobalConfirmDialog />
            <GlobalApiLoadingBar />
            <GlobalToastContainer />
            <Routes>
              {/* Public Entry Routes */}
              <Route path="/" element={<LandingPage />} />
              <Route path="/login" element={<LoginPage />} />
              <Route path="/register" element={<RegisterPage />} />
              <Route path="/forgot-password" element={<ForgotPasswordPage />} />

              {/* Mandatory Legal Policy Pages (Public, No Login Required) */}
              <Route path="/terms-of-service" element={<TermsOfServicePage />} />
              <Route path="/privacy-policy" element={<PrivacyPolicyPage />} />
              <Route path="/payment-policy" element={<PaymentPolicyPage />} />
              <Route path="/delivery-refund-policy" element={<DeliveryRefundPolicyPage />} />
              <Route path="/complaint-resolution" element={<ComplaintResolutionPage />} />

              {/* Vietnamese URL Aliases */}
              <Route path="/dieu-khoan-dich-vu" element={<Navigate to="/terms-of-service" replace />} />
              <Route path="/chinh-sach-bao-mat" element={<Navigate to="/privacy-policy" replace />} />
              <Route path="/chinh-sach-thanh-toan" element={<Navigate to="/payment-policy" replace />} />
              <Route path="/chinh-sach-giao-nhan-hoan-tra" element={<Navigate to="/delivery-refund-policy" replace />} />
              <Route path="/giai-quyet-khieu-nai" element={<Navigate to="/complaint-resolution" replace />} />

              {/* User Learning Application Shell */}
              <Route
                element={
                  <ProtectedRoute>
                    <AppShell />
                  </ProtectedRoute>
                }
              >
                <Route path="/dashboard" element={<DashboardPage />} />
                <Route path="/languages" element={<MyLanguagesPage />} />
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
              <Route
                path="/word-bank/:deckId"
                element={
                  <ProtectedRoute requireAuth={true}>
                    <MyWordBankPage />
                  </ProtectedRoute>
                }
              />
              <Route path="/my-words" element={<Navigate to="/word-bank" replace />} />
              <Route
                path="/my-words/:deckId"
                element={
                  <ProtectedRoute requireAuth={true}>
                    <MyWordBankPage />
                  </ProtectedRoute>
                }
              />
              <Route path="/community" element={<CommunityDecksPage />} />

              {/* Module A: Notes / Ghi chép cá nhân */}
              <Route
                path="/notes"
                element={
                  <ProtectedRoute requireAuth={true}>
                    <NotesPage />
                  </ProtectedRoute>
                }
              />

              {/* Module B: Community Knowledge / Bài viết cộng đồng */}
              <Route path="/community-knowledge" element={<CommunityKnowledgeFeedPage />} />
              <Route path="/community-knowledge/:id" element={<CommunityPostDetailPage />} />
              <Route
                path="/community-knowledge/new"
                element={
                  <ProtectedRoute requireAuth={true}>
                    <CreateEditPostPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/community-knowledge/edit/:id"
                element={
                  <ProtectedRoute requireAuth={true}>
                    <CreateEditPostPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/community-knowledge/my-posts"
                element={
                  <ProtectedRoute requireAuth={true}>
                    <MyPostsPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/community-knowledge/saved"
                element={
                  <ProtectedRoute requireAuth={true}>
                    <SavedPostsPage />
                  </ProtectedRoute>
                }
              />
              
              {/* Exam Bank & Adaptive Test Engine */}
              <Route path="/exams" element={<ExamBankPage />} />
              <Route path="/exams/editor" element={<ProtectedRoute requireAuth={true}><ExamEditorPage /></ProtectedRoute>} />
              <Route path="/exams/editor/:examId" element={<ProtectedRoute requireAuth={true}><ExamEditorPage /></ProtectedRoute>} />
              <Route path="/exams/session/:attemptId" element={<ExamSessionPage />} />
              <Route path="/exams/result/:attemptId" element={<ExamResultPage />} />
              <Route path="/exams/review-wrong" element={<ProtectedRoute requireAuth={true}><WrongAnswerReviewPage /></ProtectedRoute>} />

              <Route path="/custom-quiz" element={<CustomQuizPage />} />
              <Route path="/placement-test" element={<PlacementTestPage />} />
              <Route path="/ai-tutor" element={<AICoachStudioPage />} />
              <Route path="/ai-turbo" element={<Navigate to="/ai-tutor" replace />} />
              <Route path="/coach" element={<AICoachStudioPage />} />
              <Route path="/games" element={<GameLobbyPage />} />
              <Route path="/games/word-match" element={<WordMatchGame />} />
              <Route path="/games/scramble" element={<WordScrambleGame />} />
              <Route path="/games/room/:roomId" element={<RealtimeGameRoomPage />} />
              <Route path="/leaderboard" element={<LeaderboardPage />} />
              <Route path="/progress" element={<ProgressAnalyticsPage />} />
              <Route path="/upgrade" element={<SubscriptionUpgradePage />} />
              
              {/* User Support, Feedback & Notifications */}
              <Route path="/support" element={<Navigate to="/dashboard" replace />} />
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
              <Route path="dashboard" element={<Navigate to="/admin" replace />} />
              <Route path="overview" element={<Navigate to="/admin" replace />} />
              <Route path="users" element={<AdminUsersPage />} />
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

            {/* Kids English Learning System (Child-Safe Dedicated Experience) */}
            <Route path="/kids" element={<KidsLayout />}>
              <Route index element={<KidsHomePage />} />
              <Route path="home" element={<KidsHomePage />} />
              <Route path="dashboard" element={<KidsHomePage />} />
              <Route path="journey" element={<KidsJourneyPage />} />
              <Route path="library" element={<KidsJourneyPage />} />
              <Route path="lesson/:lessonId" element={<KidsLessonPage />} />
              <Route path="games" element={<KidsGamesPage />} />
              <Route path="practice" element={<KidsGamesPage />} />
              <Route path="world" element={<KidsMyWorldPage />} />
              <Route path="my-world" element={<KidsMyWorldPage />} />
              <Route path="flashcards" element={<KidsFlashcardsPage />} />
              <Route path="vocabulary" element={<KidsFlashcardsPage />} />
              <Route path="parent" element={<KidsParentDashboardPage />} />
              <Route path="parents" element={<KidsParentDashboardPage />} />
              <Route path="progress" element={<KidsParentDashboardPage />} />
            </Route>

            {/* Catch-all redirect */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </BrowserRouter>
      </LearningProvider>
    </AuthProvider>
  </I18nProvider>
);
};

export default App;
