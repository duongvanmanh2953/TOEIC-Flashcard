import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { LearningProvider } from './contexts/LearningContext';
import { I18nProvider } from './i18n';
import { KidsLayout } from './components/KidsLayout';
import { KidsHomePage } from './pages/KidsHomePage';
import { KidsJourneyPage } from './pages/KidsJourneyPage';
import { KidsLessonPage } from './pages/KidsLessonPage';
import { KidsGamesPage } from './pages/KidsGamesPage';
import { KidsMyWorldPage } from './pages/KidsMyWorldPage';
import { KidsParentDashboardPage } from './pages/KidsParentDashboardPage';
import { KidsFlashcardsPage } from './pages/KidsFlashcardsPage';

export const App: React.FC = () => {
  return (
    <I18nProvider>
      <LearningProvider>
        <BrowserRouter>
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
        </BrowserRouter>
      </LearningProvider>
    </I18nProvider>
  );
};

export default App;
