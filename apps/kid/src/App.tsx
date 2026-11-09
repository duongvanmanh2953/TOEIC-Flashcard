import React, { Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AppSplashScreen } from '@vocabflow/shared';
import { LearningProvider } from './contexts/LearningContext';
import { I18nProvider } from './i18n';
import { KidsLayout } from './components/KidsLayout';

// Kid App Pages (Lazy-loaded)
const KidsHomePage = React.lazy(() => import('./pages/KidsHomePage').then((m) => ({ default: m.KidsHomePage })));
const KidsJourneyPage = React.lazy(() => import('./pages/KidsJourneyPage').then((m) => ({ default: m.KidsJourneyPage })));
const KidsLessonPage = React.lazy(() => import('./pages/KidsLessonPage').then((m) => ({ default: m.KidsLessonPage })));
const KidsGamesPage = React.lazy(() => import('./pages/KidsGamesPage').then((m) => ({ default: m.KidsGamesPage })));
const KidsMyWorldPage = React.lazy(() => import('./pages/KidsMyWorldPage').then((m) => ({ default: m.KidsMyWorldPage })));
const KidsParentDashboardPage = React.lazy(() => import('./pages/KidsParentDashboardPage').then((m) => ({ default: m.KidsParentDashboardPage })));
const KidsFlashcardsPage = React.lazy(() => import('./pages/KidsFlashcardsPage').then((m) => ({ default: m.KidsFlashcardsPage })));

const KidLoadingFallback: React.FC = () => (
  <div className="min-h-[50vh] flex items-center justify-center">
    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-amber-500"></div>
  </div>
);

export const App: React.FC = () => {
  return (
    <I18nProvider>
      <LearningProvider>
        <BrowserRouter>
          <AppSplashScreen
            durationMs={1000}
            theme="kid"
            title="VocabFlow Kids"
            tagline="Thế giới học tiếng Anh vui nhộn cùng Vivi"
          />
          <Suspense fallback={<KidLoadingFallback />}>
            <Routes>
            {/* Primary Routes */}
            <Route path="/" element={<KidsLayout />}>
              <Route index element={<KidsHomePage />} />
              <Route path="home" element={<KidsHomePage />} />
              <Route path="dashboard" element={<KidsHomePage />} />
              <Route path="journey" element={<KidsJourneyPage />} />
              <Route path="library" element={<KidsJourneyPage />} />
              <Route path="games" element={<KidsGamesPage />} />
              <Route path="games/:gameId" element={<KidsGamesPage />} />
              <Route path="practice" element={<KidsGamesPage />} />
              <Route path="lesson/:lessonId" element={<KidsLessonPage />} />
              <Route path="learning/:lessonId" element={<KidsLessonPage />} />
              <Route path="world" element={<KidsMyWorldPage />} />
              <Route path="my-world" element={<KidsMyWorldPage />} />
              <Route path="rewards" element={<KidsMyWorldPage />} />
              <Route path="flashcards" element={<KidsFlashcardsPage />} />
              <Route path="vocabulary" element={<KidsFlashcardsPage />} />
              <Route path="parent" element={<KidsParentDashboardPage />} />
              <Route path="parents" element={<KidsParentDashboardPage />} />
              <Route path="profile" element={<KidsParentDashboardPage />} />
              <Route path="progress" element={<KidsParentDashboardPage />} />
            </Route>

            {/* Legacy /kids/* Alias Routes */}
            <Route path="/kids" element={<KidsLayout />}>
              <Route index element={<KidsHomePage />} />
              <Route path="home" element={<KidsHomePage />} />
              <Route path="dashboard" element={<KidsHomePage />} />
              <Route path="journey" element={<KidsJourneyPage />} />
              <Route path="library" element={<KidsJourneyPage />} />
              <Route path="games" element={<KidsGamesPage />} />
              <Route path="games/:gameId" element={<KidsGamesPage />} />
              <Route path="practice" element={<KidsGamesPage />} />
              <Route path="lesson/:lessonId" element={<KidsLessonPage />} />
              <Route path="learning/:lessonId" element={<KidsLessonPage />} />
              <Route path="world" element={<KidsMyWorldPage />} />
              <Route path="my-world" element={<KidsMyWorldPage />} />
              <Route path="rewards" element={<KidsMyWorldPage />} />
              <Route path="flashcards" element={<KidsFlashcardsPage />} />
              <Route path="vocabulary" element={<KidsFlashcardsPage />} />
              <Route path="parent" element={<KidsParentDashboardPage />} />
              <Route path="parents" element={<KidsParentDashboardPage />} />
              <Route path="profile" element={<KidsParentDashboardPage />} />
              <Route path="progress" element={<KidsParentDashboardPage />} />
            </Route>

            {/* Catch-all redirect */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Suspense>
      </BrowserRouter>
      </LearningProvider>
    </I18nProvider>
  );
};

export default App;
