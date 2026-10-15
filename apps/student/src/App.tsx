import React, { Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { LearningProvider } from './contexts/LearningContext';
import { I18nProvider } from './i18n';
import { AppShell } from './components/layout/AppShell';
import { LoginPage } from './pages/LoginPage';
import { LandingPage } from './pages/LandingPage';
import { ContextualLoginModal } from './components/auth/ContextualLoginModal';
import { navigateToApp, SubApp } from './lib/sso';

// Lazy-loaded routes for optimal initial bundle size and Core Web Vitals
const RegisterPage = React.lazy(() => import('./pages/RegisterPage').then((m) => ({ default: m.RegisterPage })));
const ForgotPasswordPage = React.lazy(() => import('./pages/ForgotPasswordPage').then((m) => ({ default: m.ForgotPasswordPage })));
const DashboardPage = React.lazy(() => import('./pages/DashboardPage').then((m) => ({ default: m.DashboardPage })));
const MyLanguagesPage = React.lazy(() => import('./pages/MyLanguagesPage').then((m) => ({ default: m.MyLanguagesPage })));
const ReviewSessionPage = React.lazy(() => import('./pages/ReviewSessionPage').then((m) => ({ default: m.ReviewSessionPage })));
const VocabularyExplorerPage = React.lazy(() => import('./pages/VocabularyExplorerPage').then((m) => ({ default: m.VocabularyExplorerPage })));
const PlacementTestPage = React.lazy(() => import('./pages/PlacementTestPage').then((m) => ({ default: m.PlacementTestPage })));
const ProgressAnalyticsPage = React.lazy(() => import('./pages/ProgressAnalyticsPage').then((m) => ({ default: m.ProgressAnalyticsPage })));
const SettingsPage = React.lazy(() => import('./pages/SettingsPage').then((m) => ({ default: m.SettingsPage })));
const CommunityDecksPage = React.lazy(() => import('./pages/CommunityDecksPage').then((m) => ({ default: m.CommunityDecksPage })));
const MyWordBankPage = React.lazy(() => import('./pages/MyWordBankPage').then((m) => ({ default: m.MyWordBankPage })));
const CustomQuizPage = React.lazy(() => import('./pages/CustomQuizPage').then((m) => ({ default: m.CustomQuizPage })));
const SubscriptionUpgradePage = React.lazy(() => import('./pages/SubscriptionUpgradePage').then((m) => ({ default: m.SubscriptionUpgradePage })));
const LeaderboardPage = React.lazy(() => import('./pages/LeaderboardPage').then((m) => ({ default: m.LeaderboardPage })));
const AICoachStudioPage = React.lazy(() => import('./pages/AICoachStudioPage').then((m) => ({ default: m.AICoachStudioPage })));

// Exam Bank & Evaluation Engine Pages
const ExamBankPage = React.lazy(() => import('./pages/exams/ExamBankPage').then((m) => ({ default: m.ExamBankPage })));
const ExamEditorPage = React.lazy(() => import('./pages/exams/ExamEditorPage').then((m) => ({ default: m.ExamEditorPage })));
const ExamSessionPage = React.lazy(() => import('./pages/exams/ExamSessionPage').then((m) => ({ default: m.ExamSessionPage })));
const ExamResultPage = React.lazy(() => import('./pages/exams/ExamResultPage').then((m) => ({ default: m.ExamResultPage })));
const WrongAnswerReviewPage = React.lazy(() => import('./pages/exams/WrongAnswerReviewPage').then((m) => ({ default: m.WrongAnswerReviewPage })));

// User Portal Pages
const FeedbackPortalPage = React.lazy(() => import('./pages/FeedbackPortalPage').then((m) => ({ default: m.FeedbackPortalPage })));
const NotificationCenterPage = React.lazy(() => import('./pages/NotificationCenterPage').then((m) => ({ default: m.NotificationCenterPage })));
const NotesPage = React.lazy(() => import('./pages/notes/NotesPage').then((m) => ({ default: m.NotesPage })));
const CommunityKnowledgeFeedPage = React.lazy(() => import('./pages/community/CommunityKnowledgeFeedPage').then((m) => ({ default: m.CommunityKnowledgeFeedPage })));
const CommunityPostDetailPage = React.lazy(() => import('./pages/community/CommunityPostDetailPage').then((m) => ({ default: m.CommunityPostDetailPage })));
const CreateEditPostPage = React.lazy(() => import('./pages/community/CreateEditPostPage').then((m) => ({ default: m.CreateEditPostPage })));
const MyPostsPage = React.lazy(() => import('./pages/community/MyPostsPage').then((m) => ({ default: m.MyPostsPage })));
const SavedPostsPage = React.lazy(() => import('./pages/community/SavedPostsPage').then((m) => ({ default: m.SavedPostsPage })));

// Games
const GameLobbyPage = React.lazy(() => import('./pages/games/GameLobbyPage').then((m) => ({ default: m.GameLobbyPage })));
const RealtimeGameRoomPage = React.lazy(() => import('./pages/games/RealtimeGameRoomPage').then((m) => ({ default: m.RealtimeGameRoomPage })));
const WordMatchGame = React.lazy(() => import('./pages/games/WordMatchGame').then((m) => ({ default: m.WordMatchGame })));
const WordScrambleGame = React.lazy(() => import('./pages/games/WordScrambleGame').then((m) => ({ default: m.WordScrambleGame })));

// Mandatory E-Commerce Legal Policy Pages (Ministry of Industry and Trade Compliance)
import { PrivacyPolicyPage } from './pages/policies/PrivacyPolicyPage';
import { PaymentPolicyPage } from './pages/policies/PaymentPolicyPage';
import { DeliveryRefundPolicyPage } from './pages/policies/DeliveryRefundPolicyPage';
import { ComplaintResolutionPage } from './pages/policies/ComplaintResolutionPage';
import { TermsOfServicePage } from './pages/policies/TermsOfServicePage';

const PageLoadingFallback: React.FC = () => (
  <div className="min-h-[50vh] flex items-center justify-center">
    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
  </div>
);

import { ScrollToTop } from './components/common/ScrollToTop';
import { GlobalConfirmDialog } from './components/common/ConfirmDialog';
import { GlobalApiLoadingBar } from './components/common/GlobalApiLoadingBar';
import { GlobalToastContainer } from './components/common/GlobalToastContainer';

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

const RootRedirect: React.FC = () => {
  const { user, loading } = useAuth();
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
      </div>
    );
  }
  return user ? <Navigate to="/dashboard" replace /> : <LandingPage />;
};

const ExternalRedirect: React.FC<{ to?: string; app?: SubApp; path?: string }> = ({ to, app, path }) => {
  React.useEffect(() => {
    if (app) {
      navigateToApp(app, path || '/');
    } else if (to) {
      window.location.href = to;
    }
  }, [to, app, path]);
  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
    </div>
  );
};

export const App: React.FC = () => {
  return (
    <I18nProvider>
      <AuthProvider>
        <LearningProvider>
          <BrowserRouter>
            <ScrollToTop />
            <ContextualLoginModal />
            <GlobalConfirmDialog />
            <GlobalApiLoadingBar />
            <GlobalToastContainer />
            <Suspense fallback={<PageLoadingFallback />}>
              <Routes>
                {/* Root entry point */}
                <Route path="/" element={<RootRedirect />} />
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

                {/* Student Learning Application Shell */}
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

                  {/* Module A: Notes */}
                  <Route
                    path="/notes"
                    element={
                      <ProtectedRoute requireAuth={true}>
                        <NotesPage />
                      </ProtectedRoute>
                    }
                  />

                  {/* Module B: Community Knowledge */}
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
                  <Route
                    path="/exams/editor"
                    element={
                      <ProtectedRoute requireAuth={true}>
                        <ExamEditorPage />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/exams/editor/:examId"
                    element={
                      <ProtectedRoute requireAuth={true}>
                        <ExamEditorPage />
                      </ProtectedRoute>
                    }
                  />
                  <Route path="/exams/session/:attemptId" element={<ExamSessionPage />} />
                  <Route path="/exams/result/:attemptId" element={<ExamResultPage />} />
                  <Route
                    path="/exams/review-wrong"
                    element={
                      <ProtectedRoute requireAuth={true}>
                        <WrongAnswerReviewPage />
                      </ProtectedRoute>
                    }
                  />

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

                  <Route path="/support" element={<Navigate to="/dashboard" replace />} />
                  <Route path="/feedback" element={<FeedbackPortalPage />} />
                  <Route path="/notifications" element={<NotificationCenterPage />} />
                  <Route path="/settings" element={<SettingsPage />} />
                </Route>

                {/* Cross-App External Redirects with SSO Handoff */}
                <Route path="/kids" element={<ExternalRedirect app="kid" />} />
                <Route path="/kids/*" element={<ExternalRedirect app="kid" />} />
                <Route path="/kid" element={<ExternalRedirect app="kid" />} />
                <Route path="/kid/*" element={<ExternalRedirect app="kid" />} />
                <Route path="/admin" element={<ExternalRedirect app="admin" />} />
                <Route path="/admin/*" element={<ExternalRedirect app="admin" />} />

                {/* Catch-all redirect */}
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </Suspense>
          </BrowserRouter>
        </LearningProvider>
      </AuthProvider>
    </I18nProvider>
  );
};

export default App;
