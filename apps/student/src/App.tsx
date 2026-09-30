import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { LearningProvider } from './contexts/LearningContext';
import { I18nProvider } from './i18n';
import { AppShell } from './components/layout/AppShell';
import { LoginPage } from './pages/LoginPage';
import { RegisterPage } from './pages/RegisterPage';
import { ForgotPasswordPage } from './pages/ForgotPasswordPage';
import { DashboardPage } from './pages/DashboardPage';
import { MyLanguagesPage } from './pages/MyLanguagesPage';
import { ReviewSessionPage } from './pages/ReviewSessionPage';
import { VocabularyExplorerPage } from './pages/VocabularyExplorerPage';
import { PlacementTestPage } from './pages/PlacementTestPage';
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
import { FeedbackPortalPage } from './pages/FeedbackPortalPage';
import { NotificationCenterPage } from './pages/NotificationCenterPage';
import { NotesPage } from './pages/notes/NotesPage';
import { CommunityKnowledgeFeedPage } from './pages/community/CommunityKnowledgeFeedPage';
import { CommunityPostDetailPage } from './pages/community/CommunityPostDetailPage';
import { CreateEditPostPage } from './pages/community/CreateEditPostPage';
import { MyPostsPage } from './pages/community/MyPostsPage';
import { SavedPostsPage } from './pages/community/SavedPostsPage';

// Games
import { GameLobbyPage } from './pages/games/GameLobbyPage';
import { RealtimeGameRoomPage } from './pages/games/RealtimeGameRoomPage';
import { WordMatchGame } from './pages/games/WordMatchGame';
import { WordScrambleGame } from './pages/games/WordScrambleGame';

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

  if (!user) {
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
  return user ? <Navigate to="/dashboard" replace /> : <Navigate to="/login" replace />;
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
            <Routes>
              {/* Root entry point */}
              <Route path="/" element={<RootRedirect />} />
              <Route path="/login" element={<LoginPage />} />
              <Route path="/register" element={<RegisterPage />} />
              <Route path="/forgot-password" element={<ForgotPasswordPage />} />

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
