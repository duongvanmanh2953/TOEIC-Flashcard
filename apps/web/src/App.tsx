import React, { useEffect, useRef, Suspense, lazy } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { LearningProvider } from './contexts/LearningContext';
import { I18nProvider } from './i18n';
import { AppShell } from './components/layout/AppShell';

// Eager Critical Routes for instant initial dashboard & landing render
import { LandingPage } from './pages/LandingPage';
import { DashboardPage } from './pages/DashboardPage';
import { ContextualLoginModal } from './components/auth/ContextualLoginModal';
import { ScrollToTop } from './components/common/ScrollToTop';
import { GlobalConfirmDialog } from './components/common/ConfirmDialog';
import { GlobalApiLoadingBar } from './components/common/GlobalApiLoadingBar';
import { GlobalToastContainer } from './components/common/GlobalToastContainer';
import { OfflineStatusBanner } from './components/offline/OfflineStatusBanner';
import { OnlineOnlyFeatureGate } from './components/offline/OnlineOnlyFeatureGate';
import { AppSplashScreen } from './components/common/AppSplashScreen';

// Route-level code-splitting (Lazy loaded on demand)
const LoginPage = lazy(() => import('./pages/LoginPage').then(m => ({ default: m.LoginPage })));
const RegisterPage = lazy(() => import('./pages/RegisterPage').then(m => ({ default: m.RegisterPage })));
const ForgotPasswordPage = lazy(() => import('./pages/ForgotPasswordPage').then(m => ({ default: m.ForgotPasswordPage })));

// Mandatory E-Commerce Legal Policy Pages
const PrivacyPolicyPage = lazy(() => import('./pages/policies/PrivacyPolicyPage').then(m => ({ default: m.PrivacyPolicyPage })));
const PaymentPolicyPage = lazy(() => import('./pages/policies/PaymentPolicyPage').then(m => ({ default: m.PaymentPolicyPage })));
const DeliveryRefundPolicyPage = lazy(() => import('./pages/policies/DeliveryRefundPolicyPage').then(m => ({ default: m.DeliveryRefundPolicyPage })));
const ComplaintResolutionPage = lazy(() => import('./pages/policies/ComplaintResolutionPage').then(m => ({ default: m.ComplaintResolutionPage })));
const TermsOfServicePage = lazy(() => import('./pages/policies/TermsOfServicePage').then(m => ({ default: m.TermsOfServicePage })));

// Learner Portal Pages
const MyLanguagesPage = lazy(() => import('./pages/MyLanguagesPage').then(m => ({ default: m.MyLanguagesPage })));
const ReviewSessionPage = lazy(() => import('./pages/ReviewSessionPage').then(m => ({ default: m.ReviewSessionPage })));
const VocabularyExplorerPage = lazy(() => import('./pages/VocabularyExplorerPage').then(m => ({ default: m.VocabularyExplorerPage })));
const PlacementTestPage = lazy(() => import('./pages/PlacementTestPage').then(m => ({ default: m.PlacementTestPage })));
const AITutorPage = lazy(() => import('./pages/AITutorPage').then(m => ({ default: m.AITutorPage })));
const ProgressAnalyticsPage = lazy(() => import('./pages/ProgressAnalyticsPage').then(m => ({ default: m.ProgressAnalyticsPage })));
const SettingsPage = lazy(() => import('./pages/SettingsPage').then(m => ({ default: m.SettingsPage })));
const CommunityDecksPage = lazy(() => import('./pages/CommunityDecksPage').then(m => ({ default: m.CommunityDecksPage })));
const MyWordBankPage = lazy(() => import('./pages/MyWordBankPage').then(m => ({ default: m.MyWordBankPage })));
const CustomQuizPage = lazy(() => import('./pages/CustomQuizPage').then(m => ({ default: m.CustomQuizPage })));
const SubscriptionUpgradePage = lazy(() => import('./pages/SubscriptionUpgradePage').then(m => ({ default: m.SubscriptionUpgradePage })));
const LeaderboardPage = lazy(() => import('./pages/LeaderboardPage').then(m => ({ default: m.LeaderboardPage })));
const AICoachStudioPage = lazy(() => import('./pages/AICoachStudioPage').then(m => ({ default: m.AICoachStudioPage })));
const AIInterviewStudioPage = lazy(() => import('./pages/AIInterviewStudioPage').then(m => ({ default: m.AIInterviewStudioPage })));
const GrammarMasteryPage = lazy(() => import('./pages/grammar/GrammarMasteryPage').then(m => ({ default: m.GrammarMasteryPage })));
const HandwritingStudioPage = lazy(() => import('./pages/handwriting/HandwritingStudioPage').then(m => ({ default: m.HandwritingStudioPage })));
const ForgottenWordsPage = lazy(() => import('./pages/ForgottenWordsPage').then(m => ({ default: m.ForgottenWordsPage })));

// Exam Bank & Evaluation Engine Pages
const ExamBankPage = lazy(() => import('./pages/exams/ExamBankPage').then(m => ({ default: m.ExamBankPage })));
const ExamEditorPage = lazy(() => import('./pages/exams/ExamEditorPage').then(m => ({ default: m.ExamEditorPage })));
const ExamSessionPage = lazy(() => import('./pages/exams/ExamSessionPage').then(m => ({ default: m.ExamSessionPage })));
const ExamResultPage = lazy(() => import('./pages/exams/ExamResultPage').then(m => ({ default: m.ExamResultPage })));
const WrongAnswerReviewPage = lazy(() => import('./pages/exams/WrongAnswerReviewPage').then(m => ({ default: m.WrongAnswerReviewPage })));

// User Portal Pages
const SupportCenterPage = lazy(() => import('./pages/SupportCenterPage').then(m => ({ default: m.SupportCenterPage })));
const FeedbackPortalPage = lazy(() => import('./pages/FeedbackPortalPage').then(m => ({ default: m.FeedbackPortalPage })));
const NotificationCenterPage = lazy(() => import('./pages/NotificationCenterPage').then(m => ({ default: m.NotificationCenterPage })));
const NotesPage = lazy(() => import('./pages/notes/NotesPage').then(m => ({ default: m.NotesPage })));
const CommunityKnowledgeFeedPage = lazy(() => import('./pages/community/CommunityKnowledgeFeedPage').then(m => ({ default: m.CommunityKnowledgeFeedPage })));
const CommunityPostDetailPage = lazy(() => import('./pages/community/CommunityPostDetailPage').then(m => ({ default: m.CommunityPostDetailPage })));
const CreateEditPostPage = lazy(() => import('./pages/community/CreateEditPostPage').then(m => ({ default: m.CreateEditPostPage })));
const MyPostsPage = lazy(() => import('./pages/community/MyPostsPage').then(m => ({ default: m.MyPostsPage })));
const SavedPostsPage = lazy(() => import('./pages/community/SavedPostsPage').then(m => ({ default: m.SavedPostsPage })));
const AdminCommunityModerationPage = lazy(() => import('./pages/admin/AdminCommunityModerationPage').then(m => ({ default: m.AdminCommunityModerationPage })));

// Admin Layout & Pages
const AdminLayout = lazy(() => import('./components/admin/AdminLayout').then(m => ({ default: m.AdminLayout })));
const AdminOverviewPage = lazy(() => import('./pages/admin/AdminOverviewPage').then(m => ({ default: m.AdminOverviewPage })));
const AdminUsersPage = lazy(() => import('./pages/admin/AdminUsersPage').then(m => ({ default: m.AdminUsersPage })));
const AdminSupportPage = lazy(() => import('./pages/admin/AdminSupportPage').then(m => ({ default: m.AdminSupportPage })));
const AdminFeedbackPage = lazy(() => import('./pages/admin/AdminFeedbackPage').then(m => ({ default: m.AdminFeedbackPage })));
const AdminVocabularyPage = lazy(() => import('./pages/admin/AdminVocabularyPage').then(m => ({ default: m.AdminVocabularyPage })));
const AdminLearningPage = lazy(() => import('./pages/admin/AdminLearningPage').then(m => ({ default: m.AdminLearningPage })));
const AdminNotificationsPage = lazy(() => import('./pages/admin/AdminNotificationsPage').then(m => ({ default: m.AdminNotificationsPage })));
const AdminAIPage = lazy(() => import('./pages/admin/AdminAIPage').then(m => ({ default: m.AdminAIPage })));
const AdminBillingPage = lazy(() => import('./pages/admin/AdminBillingPage').then(m => ({ default: m.AdminBillingPage })));
const AdminFinancePage = lazy(() => import('./pages/admin/AdminFinancePage').then(m => ({ default: m.AdminFinancePage })));
const AdminSystemPage = lazy(() => import('./pages/admin/AdminSystemPage').then(m => ({ default: m.AdminSystemPage })));
const AdminSecurityPage = lazy(() => import('./pages/admin/AdminSecurityPage').then(m => ({ default: m.AdminSecurityPage })));
const AdminSettingsPage = lazy(() => import('./pages/admin/AdminSettingsPage').then(m => ({ default: m.AdminSettingsPage })));
const AdminSharedVocabularyPage = lazy(() => import('./pages/admin/AdminSharedVocabularyPage').then(m => ({ default: m.AdminSharedVocabularyPage })));
const AdminPricingPage = lazy(() => import('./pages/admin/AdminPricingPage').then(m => ({ default: m.AdminPricingPage })));
const AdminPlansPage = lazy(() => import('./pages/admin/AdminPlansPage').then(m => ({ default: m.AdminPlansPage })));
const AdminResourcesPage = lazy(() => import('./pages/admin/AdminResourcesPage').then(m => ({ default: m.AdminResourcesPage })));
const AdminGamesPage = lazy(() => import('./pages/admin/AdminGamesPage').then(m => ({ default: m.AdminGamesPage })));
const AdminFinancialReportsPage = lazy(() => import('./pages/admin/AdminFinancialReportsPage').then(m => ({ default: m.AdminFinancialReportsPage })));
const GameLobbyPage = lazy(() => import('./pages/games/GameLobbyPage').then(m => ({ default: m.GameLobbyPage })));
const RealtimeGameRoomPage = lazy(() => import('./pages/games/RealtimeGameRoomPage').then(m => ({ default: m.RealtimeGameRoomPage })));
const WordMatchGame = lazy(() => import('./pages/games/WordMatchGame').then(m => ({ default: m.WordMatchGame })));
const WordScrambleGame = lazy(() => import('./pages/games/WordScrambleGame').then(m => ({ default: m.WordScrambleGame })));
const NotAuthorizedPage = lazy(() => import('./pages/NotAuthorizedPage').then(m => ({ default: m.NotAuthorizedPage })));
const AdminFirebasePage = lazy(() => import('./pages/admin/AdminFirebasePage').then(m => ({ default: m.AdminFirebasePage })));
const AdminLanguagePage = lazy(() => import('./pages/admin/AdminLanguagePage').then(m => ({ default: m.AdminLanguagePage })));

// Kids English Learning System
const KidsLayout = lazy(() => import('./kids/components/KidsLayout').then(m => ({ default: m.KidsLayout })));
const KidsHomePage = lazy(() => import('./kids/pages/KidsHomePage').then(m => ({ default: m.KidsHomePage })));
const KidsJourneyPage = lazy(() => import('./kids/pages/KidsJourneyPage').then(m => ({ default: m.KidsJourneyPage })));
const KidsLessonPage = lazy(() => import('./kids/pages/KidsLessonPage').then(m => ({ default: m.KidsLessonPage })));
const KidsGamesPage = lazy(() => import('./kids/pages/KidsGamesPage').then(m => ({ default: m.KidsGamesPage })));
const KidsMyWorldPage = lazy(() => import('./kids/pages/KidsMyWorldPage').then(m => ({ default: m.KidsMyWorldPage })));
const KidsParentDashboardPage = lazy(() => import('./kids/pages/KidsParentDashboardPage').then(m => ({ default: m.KidsParentDashboardPage })));
const KidsFlashcardsPage = lazy(() => import('./kids/pages/KidsFlashcardsPage').then(m => ({ default: m.KidsFlashcardsPage })));

const RouteAudioWatcher: React.FC = () => {
  const location = useLocation();
  const prevWasKids = useRef(false);

  useEffect(() => {
    const isKids = location.pathname.startsWith('/kids');
    if (!isKids && prevWasKids.current) {
      // Dynamic import to prevent bundling kids audio in dashboard
      import('./kids/services/audio/KidsAudioManager').then((m) => m.kidsAudioManager.stopAll()).catch(() => {});
      import('./kids/services/voice/voiceService').then((m) => m.voiceService.stop()).catch(() => {});
    }
    prevWasKids.current = isKids;
  }, [location.pathname]);

  return null;
};

const PageSuspenseFallback: React.FC = () => (
  <div className="min-h-[50vh] flex items-center justify-center bg-transparent">
    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
  </div>
);

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

import { PerformanceProvider } from './contexts/PerformanceContext';

export const App: React.FC = () => {
  return (
    <I18nProvider>
      <AuthProvider>
        <PerformanceProvider>
          <LearningProvider>
            <BrowserRouter>
              <RouteAudioWatcher />
              <ScrollToTop />
              <ContextualLoginModal />
              <GlobalConfirmDialog />
              <GlobalApiLoadingBar />
              <GlobalToastContainer />
              <OfflineStatusBanner />
              <AppSplashScreen durationMs={1000} />
              <Suspense fallback={<PageSuspenseFallback />}>
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
                <Route path="/practice" element={<ReviewSessionPage />} />
                <Route path="/vocabulary" element={<VocabularyExplorerPage />} />
                <Route path="/grammar" element={<GrammarMasteryPage />} />
                <Route path="/grammar/:topicId" element={<GrammarMasteryPage />} />
                <Route path="/handwriting" element={<Navigate to="/review?mode=handwriting" replace />} />
                <Route path="/forgotten-words" element={<ForgottenWordsPage />} />
                <Route path="/tu-hay-quen" element={<Navigate to="/forgotten-words" replace />} />

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
              <Route
                path="/ai-tutor"
                element={
                  <OnlineOnlyFeatureGate featureName="Gia sư AI Tutor">
                    <AICoachStudioPage />
                  </OnlineOnlyFeatureGate>
                }
              />
              <Route path="/ai-turbo" element={<Navigate to="/ai-tutor" replace />} />
              <Route
                path="/coach"
                element={
                  <OnlineOnlyFeatureGate featureName="AI Huấn luyện viên">
                    <AICoachStudioPage />
                  </OnlineOnlyFeatureGate>
                }
              />
              <Route
                path="/interview"
                element={
                  <OnlineOnlyFeatureGate featureName="AI Luyện phỏng vấn">
                    <AIInterviewStudioPage />
                  </OnlineOnlyFeatureGate>
                }
              />
              <Route path="/interview-studio" element={<Navigate to="/interview" replace />} />
              <Route path="/games" element={<GameLobbyPage />} />
              <Route path="/games/word-match" element={<WordMatchGame />} />
              <Route path="/games/scramble" element={<WordScrambleGame />} />
              <Route
                path="/games/room/:roomId"
                element={
                  <OnlineOnlyFeatureGate featureName="Đấu trường từ vựng trực tuyến">
                    <RealtimeGameRoomPage />
                  </OnlineOnlyFeatureGate>
                }
              />
              <Route
                path="/leaderboard"
                element={
                  <OnlineOnlyFeatureGate featureName="Bảng xếp hạng">
                    <LeaderboardPage />
                  </OnlineOnlyFeatureGate>
                }
              />
              <Route path="/progress" element={<ProgressAnalyticsPage />} />
              <Route
                path="/upgrade"
                element={
                  <OnlineOnlyFeatureGate featureName="Nâng cấp gói tài khoản">
                    <SubscriptionUpgradePage />
                  </OnlineOnlyFeatureGate>
                }
              />
              
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
        </Suspense>
        </BrowserRouter>
        </LearningProvider>
      </PerformanceProvider>
    </AuthProvider>
  </I18nProvider>
);
};

export default App;
