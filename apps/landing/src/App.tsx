import React, { useState, useEffect, useCallback } from 'react';
import Lenis from 'lenis';
import AOS from 'aos';
import 'aos/dist/aos.css';

import { LiquidBackground } from './components/LiquidBackground';
import { LandingLoadingScreen } from './components/LandingLoadingScreen';
import { LandingHeader } from './components/LandingHeader';
import { LandingHero } from './components/LandingHero';
import { LandingLanguages } from './components/LandingLanguages';
import { LandingQuickActions } from './components/LandingQuickActions';
import { LandingWhatsNew } from './components/LandingWhatsNew';
import { LandingLearningLoop } from './components/LandingLearningLoop';
import { LandingQuickNotesDemo } from './components/LandingQuickNotesDemo';
import { LandingPvPArena } from './components/LandingPvPArena';
import { LandingAppDownload } from './components/LandingAppDownload';
import { LandingFeatures } from './components/LandingFeatures';
import { LandingReviews } from './components/LandingReviews';
import { LandingCTA } from './components/LandingCTA';
import { LandingFooter } from './components/LandingFooter';
import { MULTI_LANG_SAMPLES } from './data/multiLangSamples';

export const App: React.FC = () => {
  const [selectedLang, setSelectedLang] = useState<'en' | 'ja' | 'zh' | 'ko' | 'de' | 'fr' | 'es'>('en');
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [activeLoopStep, setActiveLoopStep] = useState(3);
  const [demoSelectedText] = useState('take immediate responsibility');
  const [demoSavedToNotes, setDemoSavedToNotes] = useState(false);

  // Initialize smooth scrolling and entrance animation once on mount
  useEffect(() => {
    const lenis = new Lenis({
      duration: 1.1,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      smoothWheel: true,
    });

    let animationFrameId: number;
    function raf(time: number) {
      lenis.raf(time);
      animationFrameId = requestAnimationFrame(raf);
    }
    animationFrameId = requestAnimationFrame(raf);

    AOS.init({
      duration: 500,
      once: true,
      easing: 'ease-out-cubic',
      offset: 30,
    });

    return () => {
      cancelAnimationFrame(animationFrameId);
      lenis.destroy();
    };
  }, []);

  const handleSpeak = useCallback((text: string, langCode: string) => {
    if (!('speechSynthesis' in window)) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = langCode;
    utterance.rate = 0.9;
    utterance.onstart = () => setIsPlayingAudio(true);
    utterance.onend = () => setIsPlayingAudio(false);
    utterance.onerror = () => setIsPlayingAudio(false);
    window.speechSynthesis.speak(utterance);
  }, []);

  const handleSaveToNotes = useCallback(() => {
    setDemoSavedToNotes(true);
    setTimeout(() => setDemoSavedToNotes(false), 3000);
  }, []);

  const currentSample = MULTI_LANG_SAMPLES[selectedLang];

  return (
    <div className="relative min-h-screen text-slate-100 flex flex-col overflow-x-hidden selection:bg-indigo-600 selection:text-white bg-[#060813] font-sans">
      {/* 0. Branded Loading Splash Screen */}
      <LandingLoadingScreen minDuration={700} />

      {/* 1. Static GPU-friendly Ambient Gradient Background */}
      <LiquidBackground />

      {/* 2. Main Foreground App Content */}
      <div className="relative z-10 flex flex-col min-h-screen">
        <LandingHeader />

        <main className="flex-1">
          {/* Hero Section */}
          <LandingHero
            selectedLang={selectedLang}
            onSelectLang={setSelectedLang}
            currentSample={currentSample}
            isPlayingAudio={isPlayingAudio}
            onSpeak={handleSpeak}
          />

          {/* 7 Languages Ecosystem Showcase */}
          <LandingLanguages />

          {/* Quick Access to 5 Study Areas */}
          <LandingQuickActions />

          {/* What's New Section */}
          <LandingWhatsNew />

          {/* Core Learning Loop */}
          <LandingLearningLoop
            activeLoopStep={activeLoopStep}
            onSelectStep={setActiveLoopStep}
          />

          {/* Text Selection & Quick Notes Simulation */}
          <LandingQuickNotesDemo
            demoSelectedText={demoSelectedText}
            demoSavedToNotes={demoSavedToNotes}
            onSaveToNotes={handleSaveToNotes}
          />

          {/* Realtime 1v1 PvP Arena */}
          <LandingPvPArena />

          {/* Android App Direct Download & Mobile Showcase */}
          <LandingAppDownload />

          {/* Smart Features */}
          <LandingFeatures />

          {/* Social Proof & Student Reviews */}
          <LandingReviews />

          {/* Final Call to Action */}
          <LandingCTA />
        </main>

        {/* Global Footer */}
        <LandingFooter />
      </div>
    </div>
  );
};

export default App;
