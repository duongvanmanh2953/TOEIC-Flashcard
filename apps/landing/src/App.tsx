import React, { useState, useEffect } from 'react';
import Lenis from 'lenis';
import AOS from 'aos';
import 'aos/dist/aos.css';
import {
  Sparkles,
  Volume2,
  ArrowRight,
  BookOpen,
  Zap,
  CheckCircle2,
  TrendingUp,
  Brain,
  Compass,
  Flame,
  Award,
  Users,
  Star,
  Globe,
  Swords,
  UploadCloud,
  Smile,
  Mic,
  WifiOff,
  ChevronRight
} from 'lucide-react';
import { SplashCursor } from './components/SplashCursor';
import { GlassSurface } from './components/GlassSurface';
import { LiquidBackground } from './components/LiquidBackground';

// Multi-language demo card data
interface LangSample {
  id: 'en' | 'ja' | 'zh' | 'ko' | 'de';
  flag: string;
  langName: string;
  badge: string;
  word: string;
  pronunciation: string;
  pos: string;
  meaning: string;
  example: string;
  highlight: string;
  speechCode: string;
  statsLabel: string;
}

const MULTI_LANG_SAMPLES: Record<string, LangSample> = {
  en: {
    id: 'en',
    flag: '🇬🇧',
    langName: 'Tiếng Anh',
    badge: 'TOEIC ETS & IELTS 8.0',
    word: 'accommodate',
    pronunciation: '/əˈkɑːmədeɪt/',
    pos: 'verb',
    meaning: 'Cung cấp nơi ở, phòng ở; đáp ứng hoặc giải quyết (nhu cầu, mong muốn)',
    example: '"The new convention center is spacious enough to accommodate up to 2,500 participants."',
    highlight: 'accommodate',
    speechCode: 'en-US',
    statsLabel: 'Xuất hiện trong 42% đề đọc TOEIC Part 5 & 7'
  },
  ja: {
    id: 'ja',
    flag: '🇯🇵',
    langName: 'Tiếng Nhật',
    badge: 'JLPT N2 - N1 Business',
    word: '改善 (かいぜん)',
    pronunciation: 'Kaizen • かいぜん',
    pos: 'noun / suru verb',
    meaning: 'Cải tiến liên tục, đổi mới và hoàn thiện quy trình làm việc từng bước một',
    example: '「工場では生産性を向上させるために、作業プロセスの改善を進めている。」',
    highlight: '改善',
    speechCode: 'ja-JP',
    statsLabel: 'Thuộc 100 từ vựng kinh doanh cốt lõi JLPT'
  },
  zh: {
    id: 'zh',
    flag: '🇨🇳',
    langName: 'Tiếng Trung',
    badge: 'HSK 4 - HSK 5 Chuẩn',
    word: '坚持 (jiānchí)',
    pronunciation: 'jiān chí • Thanh 1-2',
    pos: 'verb',
    meaning: 'Kiên trì, bền bỉ, kiên định không bỏ cuộc trước khó khăn',
    example: '「只要坚持每天背单词，你的词汇量就会有质的飞跃。」',
    highlight: '坚持',
    speechCode: 'zh-CN',
    statsLabel: 'Tần suất xuất hiện cao trong đề thi HSK đọc hiểu'
  },
  ko: {
    id: 'ko',
    flag: '🇰🇷',
    langName: 'Tiếng Hàn',
    badge: 'TOPIK II Trung - Cao Cấp',
    word: '도전 (Dojeon)',
    pronunciation: '도전 [do-jeon]',
    pos: 'noun',
    meaning: 'Sự thách thức, thử thách bản thân để vượt qua giới hạn',
    example: '「새로운 언어를 배우는 것은 언제나 가치 있는 도전이다.」',
    highlight: '도전',
    speechCode: 'ko-KR',
    statsLabel: 'Từ vựng trọng tâm trong các bài luận TOPIK II'
  },
  de: {
    id: 'de',
    flag: '🇩🇪',
    langName: 'Tiếng Đức',
    badge: 'Goethe B2 / Telc',
    word: 'die Gemütlichkeit',
    pronunciation: '/ɡəˈmyːtlɪçkaɪt/',
    pos: 'Feminin (die)',
    meaning: 'Cảm giác ấm cúng, thư thái, an yên đặc trưng trong văn hóa Đức',
    example: '„Bei Kerzenlicht und heißem Tee genossen sie die Gemütlichkeit des Abends.“',
    highlight: 'Gemütlichkeit',
    speechCode: 'de-DE',
    statsLabel: 'Từ ghép biểu tượng văn hóa Đức & CEFR B2'
  }
};

export const App: React.FC = () => {
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [activeFSRSRating, setActiveFSRSRating] = useState<number | null>(null);
  const [selectedLang, setSelectedLang] = useState<'en' | 'ja' | 'zh' | 'ko' | 'de'>('en');

  useEffect(() => {
    // 0. Auto-scroll to top on reload
    window.scrollTo(0, 0);

    // 1. Initialize Lenis Smooth Scrolling
    const lenis = new Lenis({
      duration: 1.2,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      smoothWheel: true,
    });

    let animationFrameId: number;
    function raf(time: number) {
      lenis.raf(time);
      animationFrameId = requestAnimationFrame(raf);
    }
    animationFrameId = requestAnimationFrame(raf);

    // 2. Initialize AOS (Animate on Scroll)
    AOS.init({
      once: true,
      duration: 800,
      offset: 50,
      easing: 'ease-out-cubic',
    });

    return () => {
      cancelAnimationFrame(animationFrameId);
      lenis.destroy();
    };
  }, []);

  const playWordAudio = (word: string, speechCode: string = 'en-US') => {
    if ('speechSynthesis' in window) {
      setIsPlayingAudio(true);
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(word);
      utterance.lang = speechCode;
      utterance.rate = 0.9;
      utterance.onend = () => setIsPlayingAudio(false);
      utterance.onerror = () => setIsPlayingAudio(false);
      window.speechSynthesis.speak(utterance);
    }
  };

  const currentSample = MULTI_LANG_SAMPLES[selectedLang];

  return (
    <div className="relative min-h-screen text-slate-100 flex flex-col overflow-x-hidden selection:bg-indigo-600 selection:text-white bg-transparent font-sans">
      {/* 1. Luminous Ambient Dynamic Liquid Canvas Background with Glowing Pools */}
      <LiquidBackground />

      {/* 2. Splash Cursor (Compact splat radius & dense vivid fluid, screen blend mode) */}
      <SplashCursor
        SIM_RESOLUTION={128}
        DYE_RESOLUTION={1024}
        DENSITY_DISSIPATION={3.8}
        VELOCITY_DISSIPATION={2.0}
        PRESSURE={0.15}
        CURL={4.5}
        SPLAT_RADIUS={0.045}
        SPLAT_FORCE={4200}
        RAINBOW_MODE={true}
      />

      {/* 3. Main Foreground App Content */}
      <div className="relative z-10 flex flex-col min-h-screen">
        {/* Navigation Bar */}
        <header
          data-aos="fade-down"
          data-aos-duration="600"
          className="sticky top-0 z-50 backdrop-blur-xl bg-[#070a1a]/75 border-b border-white/[0.08] transition-colors duration-300"
        >
          <div className="px-4 sm:px-6 py-3.5 sm:py-4 max-w-7xl mx-auto w-full flex items-center justify-between">
            {/* Brand Logo */}
            <div className="flex items-center gap-2.5 sm:gap-3 shrink-0">
              <img
                src="/vocabflow-logo-256.png"
                alt="VocabFlow"
                className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl object-contain border border-white/15"
              />
              <div className="flex flex-col text-left">
                <span className="font-extrabold text-lg sm:text-xl bg-gradient-to-r from-blue-400 via-indigo-300 to-cyan-300 bg-clip-text text-transparent leading-snug">
                  VocabFlow
                </span>
                <span className="hidden sm:inline-block text-[10px] font-semibold text-slate-400 tracking-wider uppercase leading-none">
                  Multi-Language Flashcard Platform
                </span>
              </div>
            </div>

            {/* Navigation Links (Single-row layout) */}
            <nav className="hidden lg:flex items-center gap-6 text-sm font-semibold text-slate-300">
              <a
                href="#languages"
                className="hover:text-cyan-400 transition py-1 flex items-center gap-1.5"
              >
                <Globe className="w-4 h-4 text-cyan-400" />
                <span>Đa Ngôn Ngữ</span>
              </a>
              <a
                href="https://app.vocalflow.site/review"
                className="hover:text-cyan-400 transition py-1"
              >
                Smart Review
              </a>
              <a
                href="#pvp-arena"
                className="hover:text-cyan-400 transition py-1 flex items-center gap-1.5 text-violet-300"
              >
                <Swords className="w-4 h-4 text-violet-400" />
                <span>Đấu Trường 1v1</span>
              </a>
              <a
                href="#smart-features"
                className="hover:text-cyan-400 transition py-1"
              >
                Nhập File Tự Động
              </a>
              <a
                href="https://app.vocalflow.site/placement-test"
                className="hover:text-cyan-400 transition py-1"
              >
                Test Trình Độ
              </a>
              <a
                href="https://kid.vocalflow.site"
                className="flex items-center gap-1.5 text-amber-300 hover:text-amber-200 transition py-1 px-3 rounded-full bg-amber-500/15 border border-amber-500/30 text-xs font-bold"
              >
                <span>🦁</span> Thế Giới Bé
              </a>
            </nav>

            {/* Auth Actions */}
            <div className="flex items-center gap-3 shrink-0">
              <a
                href="https://app.vocalflow.site/login"
                className="whitespace-nowrap px-3 py-1.5 sm:py-2 rounded-xl text-xs sm:text-sm font-bold text-slate-200 hover:text-cyan-400 hover:bg-white/[0.06] transition shrink-0"
              >
                Đăng nhập
              </a>
              <a
                href="https://app.vocalflow.site/dashboard"
                className="whitespace-nowrap btn-glass-primary !py-2 sm:!py-2.5 !px-3.5 sm:!px-5 text-xs sm:text-sm font-bold shrink-0 flex items-center gap-1.5"
              >
                <span>Bắt đầu học ngay</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </a>
            </div>
          </div>
        </header>

        {/* Hero Section */}
        <section className="relative pt-14 sm:pt-20 pb-16 px-4 sm:px-6 max-w-7xl mx-auto w-full flex flex-col items-center text-center">
          {/* Luminous Top Pill Badge */}
          <div
            data-aos="fade-down"
            data-aos-delay="100"
            className="inline-flex items-center gap-2.5 px-4 py-2 rounded-full card-brand-effect bg-sky-500/[0.12] border border-sky-400/40 text-sky-200 text-xs sm:text-sm font-bold mb-6 backdrop-blur-xl leading-normal"
          >
            <Sparkles className="w-4 h-4 text-cyan-400 flex-shrink-0" />
            <span>Nền tảng Từ vựng Đa Ngôn Ngữ • Spaced Repetition FSRS v5 • Đấu Trường 1v1</span>
          </div>

          {/* Hero Title */}
          <h1
            data-aos="fade-up"
            data-aos-delay="200"
            className="text-4xl sm:text-6xl md:text-7xl font-black tracking-normal leading-[1.25] sm:leading-[1.2] mb-6 max-w-4xl text-white"
          >
            Chinh Phục Mọi Ngôn Ngữ. <br className="hidden sm:block" />
            <span className="inline-block mt-2 bg-gradient-to-r from-sky-400 via-indigo-300 to-cyan-300 bg-clip-text text-transparent">
              Ghi Nhớ Trọn Đời Với AI.
            </span>
          </h1>

          {/* Hero Subtitle */}
          <p
            data-aos="fade-up"
            data-aos-delay="300"
            className="text-base sm:text-xl text-slate-300 max-w-3xl mx-auto mb-10 leading-relaxed font-normal"
          >
            Học thông minh Tiếng Anh (TOEIC, IELTS), Tiếng Nhật (JLPT N5-N1), Tiếng Trung (HSK), Tiếng Hàn (TOPIK), Tiếng Đức, Tiếng Pháp, Tiếng Tây Ban Nha. Thuật toán FSRS v5 đo lường độ bền trí nhớ, tự động nhắc nhở đúng{' '}
            <span className="font-semibold text-cyan-400 underline decoration-cyan-400/40 underline-offset-4">
              thời điểm vàng
            </span>{' '}
            trước khi não bộ quên từ.
          </p>

          {/* Hero Action Buttons */}
          <div
            data-aos="fade-up"
            data-aos-delay="400"
            className="flex flex-col sm:flex-row items-center justify-center gap-4 w-full sm:w-auto mb-14"
          >
            <a
              href="https://app.vocalflow.site/review"
              className="btn-glass-primary w-full sm:w-auto !py-4 !px-8 text-base font-bold flex items-center justify-center gap-2.5"
            >
              <Sparkles className="w-5 h-5 fill-white/80" />
              <span>Trải nghiệm Smart Review</span>
              <ArrowRight className="w-4 h-4" />
            </a>
            <a
              href="#languages"
              className="btn-glass-secondary w-full sm:w-auto !py-4 !px-7 text-base font-bold flex items-center justify-center gap-2"
            >
              <Globe className="w-4 h-4 text-indigo-400" />
              <span>Khám phá 7+ Ngôn ngữ</span>
            </a>
            <a
              href="https://app.vocalflow.site/placement-test"
              className="btn-glass-secondary w-full sm:w-auto !py-4 !px-6 text-base font-bold text-cyan-300 flex items-center justify-center gap-2"
            >
              <Zap className="w-4 h-4 text-amber-400" />
              <span>Test Trình Độ (Free)</span>
            </a>
          </div>

          {/* Interactive Live Multi-Language Card Preview Showcase */}
          <div
            data-aos="zoom-in"
            data-aos-delay="500"
            className="w-full max-w-2xl mx-auto mb-16"
          >
            {/* Multi-language switcher tabs on top of card */}
            <div className="flex items-center justify-center flex-wrap gap-2 mb-4">
              {Object.values(MULTI_LANG_SAMPLES).map((lang) => {
                const isActive = selectedLang === lang.id;
                return (
                  <button
                    key={lang.id}
                    onClick={() => setSelectedLang(lang.id as any)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer border ${
                      isActive
                        ? 'bg-indigo-600 text-white border-indigo-400'
                        : 'bg-white/[0.06] hover:bg-white/[0.12] text-slate-300 border-white/[0.1]'
                    }`}
                  >
                    <span>{lang.flag}</span>
                    <span>{lang.langName}</span>
                  </button>
                );
              })}
            </div>

            <GlassSurface
              borderRadius={26}
              borderWidth={0.09}
              brightness={65}
              opacity={0.94}
              blur={14}
              className="w-full text-left"
            >
              <div className="p-6 sm:p-8">
                {/* Card Header Meta */}
                <div className="flex items-center justify-between pb-4 border-b border-white/[0.08]">
                  <div className="flex items-center gap-2.5">
                    <span className="w-3 h-3 rounded-full bg-rose-500 inline-block"></span>
                    <span className="w-3 h-3 rounded-full bg-amber-500 inline-block"></span>
                    <span className="w-3 h-3 rounded-full bg-emerald-500 inline-block"></span>
                    <span className="ml-2 text-xs font-bold text-slate-400 tracking-wide uppercase leading-normal">
                      Flashcard Thích Ứng • {currentSample.flag} {currentSample.langName}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] font-black uppercase px-2.5 py-1 rounded-md bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                      FSRS v5: {activeFSRSRating ? `${activeFSRSRating}d` : '4.2d'}
                    </span>
                  </div>
                </div>

                {/* Main Card Content */}
                <div className="pt-6">
                  <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-3 mb-3">
                    <div className="flex items-center gap-3">
                      <h3 className="text-3xl sm:text-4xl font-black text-white tracking-tight">
                        {currentSample.word}
                      </h3>
                      <button
                        onClick={() => playWordAudio(currentSample.highlight, currentSample.speechCode)}
                        title={`Nghe phát âm chuẩn ${currentSample.langName}`}
                        className={`p-2.5 rounded-xl bg-indigo-500/20 hover:bg-indigo-500/35 text-indigo-300 border border-indigo-400/30 transition flex items-center gap-1.5 text-xs font-bold cursor-pointer group ${
                          isPlayingAudio ? 'ring-2 ring-cyan-400' : ''
                        }`}
                      >
                        <Volume2 className="w-4 h-4 text-cyan-400 group-hover:scale-110 transition-transform" />
                        <span className="text-slate-200">
                          {isPlayingAudio ? 'Đang phát...' : 'Phát âm'}
                        </span>
                      </button>
                    </div>
                    <span className="text-xs font-bold text-cyan-400 bg-cyan-500/10 px-3 py-1 rounded-lg border border-cyan-500/20 w-fit">
                      {currentSample.pronunciation} • {currentSample.pos}
                    </span>
                  </div>

                  <p className="text-base sm:text-lg font-semibold text-slate-200 mb-5 leading-normal">
                    {currentSample.meaning}
                  </p>

                  <div className="p-4 rounded-xl bg-slate-900/60 border border-white/[0.08] mb-5">
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5 leading-normal">
                      Ví dụ ngữ cảnh thực chiến ({currentSample.badge}):
                    </p>
                    <p className="text-sm sm:text-base font-medium text-slate-300 italic leading-relaxed">
                      {currentSample.example}
                    </p>
                  </div>

                  {/* Progress Indicators & AI Insight */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-5">
                    <div className="p-3.5 rounded-xl bg-indigo-500/10 border border-indigo-500/20">
                      <div className="flex items-center justify-between text-xs font-bold mb-2">
                        <span className="text-slate-300">Xác suất nhớ lại</span>
                        <span className="text-indigo-400 font-black">94% (Rất cao)</span>
                      </div>
                      <div className="w-full h-2 rounded-full bg-slate-800 overflow-hidden">
                        <div className="h-full bg-gradient-to-r from-cyan-400 to-indigo-500 rounded-full w-[94%]"></div>
                      </div>
                    </div>

                    <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center gap-3">
                      <Award className="w-5 h-5 text-emerald-400 shrink-0" />
                      <p className="text-xs font-medium text-slate-300 leading-normal">
                        <strong className="text-emerald-400 font-bold">VocabFlow AI:</strong> {currentSample.statsLabel}
                      </p>
                    </div>
                  </div>

                  {/* Interactive Rating Demo */}
                  <div className="pt-3 border-t border-white/[0.08]">
                    <p className="text-xs font-bold text-slate-400 mb-2 leading-normal">
                      Thử nghiệm phản xạ thuật toán FSRS v5 (chọn mức độ nhớ):
                    </p>
                    <div className="grid grid-cols-4 gap-2">
                      <button
                        onClick={() => setActiveFSRSRating(1)}
                        className={`py-2 px-1 text-center rounded-lg text-xs font-bold transition-all border ${
                          activeFSRSRating === 1
                            ? 'bg-rose-500/30 border-rose-400 text-rose-200'
                            : 'bg-rose-500/10 hover:bg-rose-500/20 border-rose-500/30 text-rose-300'
                        }`}
                      >
                        <div>Quên</div>
                        <div className="text-[10px] opacity-75">1 ngày</div>
                      </button>
                      <button
                        onClick={() => setActiveFSRSRating(3)}
                        className={`py-2 px-1 text-center rounded-lg text-xs font-bold transition-all border ${
                          activeFSRSRating === 3
                            ? 'bg-amber-500/30 border-amber-400 text-amber-200'
                            : 'bg-amber-500/10 hover:bg-amber-500/20 border-amber-500/30 text-amber-300'
                        }`}
                      >
                        <div>Khó</div>
                        <div className="text-[10px] opacity-75">3 ngày</div>
                      </button>
                      <button
                        onClick={() => setActiveFSRSRating(7)}
                        className={`py-2 px-1 text-center rounded-lg text-xs font-bold transition-all border ${
                          activeFSRSRating === 7
                            ? 'bg-blue-500/30 border-blue-400 text-blue-200'
                            : 'bg-blue-500/10 hover:bg-blue-500/20 border-blue-500/30 text-blue-300'
                        }`}
                      >
                        <div>Nhớ</div>
                        <div className="text-[10px] opacity-75">7 ngày</div>
                      </button>
                      <button
                        onClick={() => setActiveFSRSRating(14)}
                        className={`py-2 px-1 text-center rounded-lg text-xs font-bold transition-all border ${
                          activeFSRSRating === 14
                            ? 'bg-emerald-500/30 border-emerald-400 text-emerald-200'
                            : 'bg-emerald-500/10 hover:bg-emerald-500/20 border-emerald-500/30 text-emerald-300'
                        }`}
                      >
                        <div>Dễ</div>
                        <div className="text-[10px] opacity-75">14 ngày</div>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </GlassSurface>
          </div>

          {/* Metrics Stats Bar: Perfectly Aligned Grid, Equal Heights, NO boxshadow */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6 w-full max-w-5xl mb-24 items-stretch">
            <div data-aos="fade-up" data-aos-delay="550" className="h-full flex flex-col">
              <GlassSurface borderRadius={20} className="w-full h-full text-center flex flex-col">
                <div className="p-5 sm:p-6 h-full flex flex-col justify-center items-center text-center min-h-[130px]">
                  <div className="text-3xl sm:text-4xl font-black text-cyan-400 leading-none mb-2">
                    7+
                  </div>
                  <p className="text-xs sm:text-sm font-bold text-slate-300 leading-normal">
                    Ngôn ngữ chuẩn quốc tế
                  </p>
                  <span className="text-[10px] text-slate-400 mt-1">Anh, Nhật, Trung, Hàn, Đức...</span>
                </div>
              </GlassSurface>
            </div>

            <div data-aos="fade-up" data-aos-delay="650" className="h-full flex flex-col">
              <GlassSurface borderRadius={20} className="w-full h-full text-center flex flex-col">
                <div className="p-5 sm:p-6 h-full flex flex-col justify-center items-center text-center min-h-[130px]">
                  <div className="text-3xl sm:text-4xl font-black text-indigo-400 leading-none mb-2">
                    98.4%
                  </div>
                  <p className="text-xs sm:text-sm font-bold text-slate-300 leading-normal">
                    Tỷ lệ duy trì trí nhớ 6 tháng
                  </p>
                  <span className="text-[10px] text-slate-400 mt-1">Thuật toán FSRS v5 tiên tiến</span>
                </div>
              </GlassSurface>
            </div>

            <div data-aos="fade-up" data-aos-delay="750" className="h-full flex flex-col">
              <GlassSurface borderRadius={20} className="w-full h-full text-center flex flex-col">
                <div className="p-5 sm:p-6 h-full flex flex-col justify-center items-center text-center min-h-[130px]">
                  <div className="text-3xl sm:text-4xl font-black text-emerald-400 leading-none mb-2">
                    1v1 PvP
                  </div>
                  <p className="text-xs sm:text-sm font-bold text-slate-300 leading-normal">
                    Đấu trường từ vựng trực tiếp
                  </p>
                  <span className="text-[10px] text-slate-400 mt-1">Thi đấu Realtime Socket.IO</span>
                </div>
              </GlassSurface>
            </div>

            <div data-aos="fade-up" data-aos-delay="850" className="h-full flex flex-col">
              <GlassSurface borderRadius={20} className="w-full h-full text-center flex flex-col">
                <div className="p-5 sm:p-6 h-full flex flex-col justify-center items-center text-center min-h-[130px]">
                  <div className="text-3xl sm:text-4xl font-black text-amber-400 leading-none mb-2">
                    24/7 AI
                  </div>
                  <p className="text-xs sm:text-sm font-bold text-slate-300 leading-normal">
                    Gia sư phát âm & Word Bank
                  </p>
                  <span className="text-[10px] text-slate-400 mt-1">Tự động import Excel, PDF</span>
                </div>
              </GlassSurface>
            </div>
          </div>
        </section>

        {/* 4. Section: Không Gian Đa Ngôn Ngữ Chuyên Sâu (Multi-Language Mastery) */}
        <section id="languages" className="py-20 px-4 sm:px-6 max-w-7xl mx-auto w-full">
          <div data-aos="fade-up" className="text-center max-w-3xl mx-auto mb-16">
            <span className="text-xs font-black uppercase tracking-widest text-cyan-400 bg-cyan-500/10 px-3 py-1.5 rounded-full border border-cyan-400/20 inline-block mb-3 leading-normal">
              Không Giới Hạn TOEIC • Hệ Sinh Thái Toàn Diện
            </span>
            <h2 className="text-3xl sm:text-5xl font-black text-white leading-snug sm:leading-normal mb-4">
              Làm Chủ 7+ Ngôn Ngữ Toàn Cầu <br />
              <span className="bg-gradient-to-r from-cyan-400 via-sky-300 to-indigo-300 bg-clip-text text-transparent">
                Với Công Nghệ Flashcard Cá Nhân Hóa
              </span>
            </h2>
            <p className="text-sm sm:text-base text-slate-300 leading-relaxed">
              Mỗi ngôn ngữ sở hữu không gian học tập riêng biệt: từ điển chuyên ngành, phát âm bản xứ chuẩn ngữ điệu, toggle phiên âm Pinyin / Romaji / Furigana và phân cấp chứng chỉ quốc tế.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 items-stretch">
            {/* 1. Tiếng Anh */}
            <div data-aos="fade-up" data-aos-delay="100" className="h-full flex flex-col">
              <GlassSurface borderRadius={24} className="w-full h-full text-left flex flex-col">
                <div className="p-7 flex flex-col justify-between h-full">
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-2">
                        <span className="text-2xl">🇬🇧</span>
                        <h3 className="text-xl font-black text-white">Tiếng Anh</h3>
                      </div>
                      <span className="text-xs font-bold px-2.5 py-1 rounded-md bg-blue-500/15 text-blue-400 border border-blue-500/30">
                        TOEIC • IELTS • CEFR
                      </span>
                    </div>
                    <p className="text-xs sm:text-sm text-slate-300 mb-4 leading-relaxed">
                      Kho 600+ từ cốt lõi ETS TOEIC, IELTS Academic 8.0+, Oxford 3000/5000 và kho bài giảng tương tác cho trẻ nhỏ.
                    </p>
                  </div>
                  <div className="pt-3 border-t border-white/[0.08] flex items-center justify-between text-xs text-slate-400">
                    <span>Phát âm US / UK / AU</span>
                    <span className="text-cyan-400 font-bold">10,000+ từ</span>
                  </div>
                </div>
              </GlassSurface>
            </div>

            {/* 2. Tiếng Nhật */}
            <div data-aos="fade-up" data-aos-delay="150" className="h-full flex flex-col">
              <GlassSurface borderRadius={24} className="w-full h-full text-left flex flex-col">
                <div className="p-7 flex flex-col justify-between h-full">
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-2">
                        <span className="text-2xl">🇯🇵</span>
                        <h3 className="text-xl font-black text-white">Tiếng Nhật</h3>
                      </div>
                      <span className="text-xs font-bold px-2.5 py-1 rounded-md bg-rose-500/15 text-rose-400 border border-rose-500/30">
                        JLPT N5 - N1
                      </span>
                    </div>
                    <p className="text-xs sm:text-sm text-slate-300 mb-4 leading-relaxed">
                      Học bảng chữ cái Hiragana, Katakana, 2136 Hán tự Kanji thường dụng, có toggle Furigana và Romaji tiện lợi.
                    </p>
                  </div>
                  <div className="pt-3 border-t border-white/[0.08] flex items-center justify-between text-xs text-slate-400">
                    <span>Kana-Kanji & Âm Hán Việt</span>
                    <span className="text-rose-400 font-bold">6,000+ từ</span>
                  </div>
                </div>
              </GlassSurface>
            </div>

            {/* 3. Tiếng Trung */}
            <div data-aos="fade-up" data-aos-delay="200" className="h-full flex flex-col">
              <GlassSurface borderRadius={24} className="w-full h-full text-left flex flex-col">
                <div className="p-7 flex flex-col justify-between h-full">
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-2">
                        <span className="text-2xl">🇨🇳</span>
                        <h3 className="text-xl font-black text-white">Tiếng Trung</h3>
                      </div>
                      <span className="text-xs font-bold px-2.5 py-1 rounded-md bg-amber-500/15 text-amber-400 border border-amber-500/30">
                        HSK 1 - HSK 6
                      </span>
                    </div>
                    <p className="text-xs sm:text-sm text-slate-300 mb-4 leading-relaxed">
                      Phiên âm chuẩn Pinyin, hướng dẫn 4 thanh điệu, chiết tự 214 bộ thủ giúp ghi nhớ chữ Hán sâu sắc và trực quan.
                    </p>
                  </div>
                  <div className="pt-3 border-t border-white/[0.08] flex items-center justify-between text-xs text-slate-400">
                    <span>Chữ giản thể & Pinyin</span>
                    <span className="text-amber-400 font-bold">5,000+ từ</span>
                  </div>
                </div>
              </GlassSurface>
            </div>

            {/* 4. Tiếng Hàn */}
            <div data-aos="fade-up" data-aos-delay="250" className="h-full flex flex-col">
              <GlassSurface borderRadius={24} className="w-full h-full text-left flex flex-col">
                <div className="p-7 flex flex-col justify-between h-full">
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-2">
                        <span className="text-2xl">🇰🇷</span>
                        <h3 className="text-xl font-black text-white">Tiếng Hàn</h3>
                      </div>
                      <span className="text-xs font-bold px-2.5 py-1 rounded-md bg-indigo-500/15 text-indigo-400 border border-indigo-500/30">
                        TOPIK I & II
                      </span>
                    </div>
                    <p className="text-xs sm:text-sm text-slate-300 mb-4 leading-relaxed">
                      Từ vựng Hangul theo chủ đề đời sống, phim ảnh, công sở và cấu trúc ngữ pháp thi chứng chỉ TOPIK các cấp.
                    </p>
                  </div>
                  <div className="pt-3 border-t border-white/[0.08] flex items-center justify-between text-xs text-slate-400">
                    <span>Phiên âm Latin & Hangul</span>
                    <span className="text-indigo-400 font-bold">4,500+ từ</span>
                  </div>
                </div>
              </GlassSurface>
            </div>

            {/* 5. Tiếng Đức */}
            <div data-aos="fade-up" data-aos-delay="300" className="h-full flex flex-col">
              <GlassSurface borderRadius={24} className="w-full h-full text-left flex flex-col">
                <div className="p-7 flex flex-col justify-between h-full">
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-2">
                        <span className="text-2xl">🇩🇪</span>
                        <h3 className="text-xl font-black text-white">Tiếng Đức</h3>
                      </div>
                      <span className="text-xs font-bold px-2.5 py-1 rounded-md bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                        Goethe A1 - C1
                      </span>
                    </div>
                    <p className="text-xs sm:text-sm text-slate-300 mb-4 leading-relaxed">
                      Hệ thống màu sắc phân biệt giống Der / Die / Das thông minh, giải nghĩa các từ ghép phức tạp và dạng số nhiều.
                    </p>
                  </div>
                  <div className="pt-3 border-t border-white/[0.08] flex items-center justify-between text-xs text-slate-400">
                    <span>Màu sắc giống danh từ</span>
                    <span className="text-emerald-400 font-bold">4,000+ từ</span>
                  </div>
                </div>
              </GlassSurface>
            </div>

            {/* 6. Tiếng Pháp & Tây Ban Nha */}
            <div data-aos="fade-up" data-aos-delay="350" className="h-full flex flex-col">
              <GlassSurface borderRadius={24} className="w-full h-full text-left flex flex-col">
                <div className="p-7 flex flex-col justify-between h-full">
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-2">
                        <span className="text-2xl">🇫🇷 🇪🇸</span>
                        <h3 className="text-xl font-black text-white">Pháp & TBN</h3>
                      </div>
                      <span className="text-xs font-bold px-2.5 py-1 rounded-md bg-purple-500/15 text-purple-400 border border-purple-500/30">
                        DELF & DELE
                      </span>
                    </div>
                    <p className="text-xs sm:text-sm text-slate-300 mb-4 leading-relaxed">
                      Luyện phản xạ chia thì động từ, giống danh từ Le/La, El/La và ngữ điệu luyến láy sang trọng chuẩn Âu châu.
                    </p>
                  </div>
                  <div className="pt-3 border-t border-white/[0.08] flex items-center justify-between text-xs text-slate-400">
                    <span>Chia động từ & Ngữ điệu</span>
                    <span className="text-purple-400 font-bold">7,000+ từ</span>
                  </div>
                </div>
              </GlassSurface>
            </div>
          </div>
        </section>

        {/* 5. Section: Spaced Repetition Engine (FSRS v5) */}
        <section className="py-20 px-4 sm:px-6 max-w-7xl mx-auto w-full">
          <div data-aos="fade-up" className="text-center max-w-3xl mx-auto mb-16">
            <span className="text-xs font-black uppercase tracking-widest text-indigo-400 bg-indigo-500/10 px-3 py-1.5 rounded-full border border-indigo-400/20 inline-block mb-3 leading-normal">
              Đột Phá Khoa Học Trí Nhớ
            </span>
            <h2 className="text-3xl sm:text-5xl font-black text-white leading-snug sm:leading-normal mb-4">
              Động Cơ FSRS v5 Spaced Repetition <br />
              <span className="bg-gradient-to-r from-sky-400 via-indigo-300 to-cyan-300 bg-clip-text text-transparent">
                Vượt Trội Hoàn Toàn SM-2 Cổ Điển
              </span>
            </h2>
            <p className="text-sm sm:text-base text-slate-300 leading-relaxed">
              Các app flashcard truyền thống vẫn sử dụng thuật toán SuperMemo-2 từ năm 1987. VocabFlow nâng cấp lên FSRS v5 mô phỏng chính xác tốc độ phân rã trí nhớ của vỏ não người.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 items-stretch">
            <div data-aos="fade-up" data-aos-delay="100" className="h-full flex flex-col">
              <GlassSurface borderRadius={24} className="w-full h-full text-left flex flex-col">
                <div className="p-7 flex flex-col justify-between h-full">
                  <div>
                    <div className="w-12 h-12 rounded-2xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400 mb-6">
                      <Brain className="w-6 h-6" />
                    </div>
                    <h3 className="text-lg font-bold text-white mb-2 leading-snug">
                      Độ Bền & Phản Xạ
                    </h3>
                    <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                      Tách biệt độ bền ký ức (Stability) và khả năng nhớ lại (Retrievability), không lặp lại vô ích từ đã khắc sâu vào não.
                    </p>
                  </div>
                </div>
              </GlassSurface>
            </div>

            <div data-aos="fade-up" data-aos-delay="200" className="h-full flex flex-col">
              <GlassSurface borderRadius={24} className="w-full h-full text-left flex flex-col">
                <div className="p-7 flex flex-col justify-between h-full">
                  <div>
                    <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center text-indigo-400 mb-6">
                      <Compass className="w-6 h-6" />
                    </div>
                    <h3 className="text-lg font-bold text-white mb-2 leading-snug">
                      Ma Trận Ngữ Cảnh
                    </h3>
                    <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                      Liên kết từ vựng với cấu trúc ngữ pháp thực tế, học trọn vẹn cả cụm từ đi kèm (collocations), thành ngữ và họ từ.
                    </p>
                  </div>
                </div>
              </GlassSurface>
            </div>

            <div data-aos="fade-up" data-aos-delay="300" className="h-full flex flex-col">
              <GlassSurface borderRadius={24} className="w-full h-full text-left flex flex-col">
                <div className="p-7 flex flex-col justify-between h-full">
                  <div>
                    <div className="w-12 h-12 rounded-2xl bg-purple-500/10 border border-purple-500/30 flex items-center justify-center text-purple-400 mb-6">
                      <Flame className="w-6 h-6" />
                    </div>
                    <h3 className="text-lg font-bold text-white mb-2 leading-snug">
                      Diệt "Từ Ký Sinh" (Leech)
                    </h3>
                    <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                      Tự động nhận diện những từ bạn hay quên hoặc nhầm lẫn, lập tức kích hoạt ví dụ thực tế và giải thích chi tiết mới.
                    </p>
                  </div>
                </div>
              </GlassSurface>
            </div>

            <div data-aos="fade-up" data-aos-delay="400" className="h-full flex flex-col">
              <GlassSurface borderRadius={24} className="w-full h-full text-left flex flex-col">
                <div className="p-7 flex flex-col justify-between h-full">
                  <div>
                    <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 mb-6">
                      <TrendingUp className="w-6 h-6" />
                    </div>
                    <h3 className="text-lg font-bold text-white mb-2 leading-snug">
                      Tiết Kiệm 38.5% Thời Gian
                    </h3>
                    <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                      Cắt giảm hơn một phần ba số lần ôn bài so với flashcard thông thường. Đạt mục tiêu điểm số chỉ với 15-20 phút/ngày.
                    </p>
                  </div>
                </div>
              </GlassSurface>
            </div>
          </div>
        </section>

        {/* 6. Section: Đấu Trường 1v1 PvP Realtime & AI Coach */}
        <section id="pvp-arena" className="py-20 px-4 sm:px-6 max-w-7xl mx-auto w-full">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
            <div data-aos="fade-right" className="text-left">
              <span className="text-xs font-black uppercase tracking-widest text-violet-400 bg-violet-500/10 px-3 py-1.5 rounded-full border border-violet-400/20 inline-block mb-3 leading-normal">
                Gamification & Realtime Multiplay
              </span>
              <h2 className="text-3xl sm:text-5xl font-black text-white leading-snug sm:leading-normal mb-6">
                Đấu Trường Từ Vựng 1v1 <br />
                <span className="bg-gradient-to-r from-violet-400 via-indigo-300 to-sky-300 bg-clip-text text-transparent">
                  Thi Đấu Thời Gian Thực Socket.IO
                </span>
              </h2>
              <p className="text-base text-slate-300 mb-6 leading-relaxed">
                Biến việc học từ vựng thành trò chơi kịch tính! Thách đấu bạn bè hoặc so tài ngẫu nhiên cùng người học trên toàn thế giới qua các chế độ mini-game hấp dẫn.
              </p>

              <ul className="space-y-4 mb-8">
                <li className="flex items-start gap-3 text-sm text-slate-200 leading-normal">
                  <Swords className="w-5 h-5 text-cyan-400 shrink-0 mt-0.5" />
                  <span>
                    <strong>Word Match & Speed Scramble:</strong> Tranh đua tốc độ nối từ với nghĩa trong 60 giây nghẹt thở.
                  </span>
                </li>
                <li className="flex items-start gap-3 text-sm text-slate-200 leading-normal">
                  <CheckCircle2 className="w-5 h-5 text-indigo-400 shrink-0 mt-0.5" />
                  <span>
                    <strong>Bảng Xếp Hạng & Rank Tiers:</strong> Tích lũy EXP, thăng cấp từ Đồng (Bronze) lên Thách Đấu (Grandmaster).
                  </span>
                </li>
                <li className="flex items-start gap-3 text-sm text-slate-200 leading-normal">
                  <Mic className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                  <span>
                    <strong>Gia Sư AI Luyện Nói 24/7:</strong> Đối thoại trực tiếp, sửa lỗi phát âm và phản hồi ngữ cảnh với độ trễ siêu thấp dưới 150ms.
                  </span>
                </li>
              </ul>

              <a
                href="https://app.vocalflow.site/dashboard"
                className="btn-glass-primary !py-3.5 !px-8 text-sm font-bold inline-flex items-center gap-2"
              >
                <span>Tham gia Đấu Trường ngay</span>
                <ArrowRight className="w-4 h-4" />
              </a>
            </div>

            <div data-aos="fade-left">
              <GlassSurface borderRadius={28} className="w-full text-left">
                <div className="p-7 sm:p-9">
                  <div className="flex items-center justify-between pb-4 border-b border-white/[0.08] mb-6">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-violet-500/20 border border-violet-500/40 flex items-center justify-center text-violet-300 font-bold">
                        PvP
                      </div>
                      <div>
                        <h4 className="text-sm font-bold text-white leading-normal">Đấu Trường Realtime</h4>
                        <span className="text-[11px] text-emerald-400 flex items-center gap-1 leading-normal">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 inline-block animate-pulse"></span>
                          Phòng thi đấu trực tuyến
                        </span>
                      </div>
                    </div>
                    <span className="text-xs font-bold text-slate-300 bg-indigo-500/20 px-3 py-1 rounded-md border border-indigo-500/30 leading-normal">
                      Rank: Kim Cương II
                    </span>
                  </div>

                  {/* Battle Match Simulation */}
                  <div className="space-y-4 mb-6">
                    <div className="p-4 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 text-xs sm:text-sm text-slate-200 leading-relaxed">
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-bold text-cyan-400">Vòng 3: Nối từ đồng nghĩa (10s)</span>
                        <span className="text-xs font-black text-rose-400">⏱️ 00:04</span>
                      </div>
                      <p className="text-slate-300">
                        Từ khóa: <strong className="text-white font-black text-base">"pragmatic"</strong>
                      </p>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div className="p-3 rounded-xl bg-emerald-500/20 border border-emerald-400 text-xs font-bold text-emerald-200 text-center">
                        ✓ realistic / practical
                      </div>
                      <div className="p-3 rounded-xl bg-slate-800/80 border border-white/[0.08] text-xs font-bold text-slate-400 text-center">
                        theoretical
                      </div>
                    </div>

                    <div className="p-3.5 rounded-xl bg-slate-900/80 border border-white/[0.08] flex items-center justify-between text-xs">
                      <span className="text-slate-300">Tỉ số hiện tại:</span>
                      <div className="flex items-center gap-3 font-black">
                        <span className="text-cyan-400">Bạn: 2,450 pts</span>
                        <span className="text-slate-500">VS</span>
                        <span className="text-amber-400">Đối thủ: 2,120 pts</span>
                      </div>
                    </div>
                  </div>

                  <div className="p-3 rounded-xl bg-slate-900/90 border border-white/[0.08] flex items-center justify-between text-xs text-slate-400 leading-normal">
                    <span>Kết nối Socket.IO P2P</span>
                    <span className="text-cyan-400 font-bold">Độ trễ: 18ms</span>
                  </div>
                </div>
              </GlassSurface>
            </div>
          </div>
        </section>

        {/* 7. Section: Smart Features (Word Bank, File Import, Kids, Offline) */}
        <section id="smart-features" className="py-20 px-4 sm:px-6 max-w-7xl mx-auto w-full">
          <div data-aos="fade-up" className="text-center max-w-3xl mx-auto mb-16">
            <span className="text-xs font-black uppercase tracking-widest text-sky-400 bg-sky-500/10 px-3 py-1.5 rounded-full border border-sky-400/20 inline-block mb-3 leading-normal">
              Tính Năng Đột Phá
            </span>
            <h2 className="text-3xl sm:text-5xl font-black text-white leading-snug sm:leading-normal mb-4">
              Không Chỉ Là Flashcard Đơn Thuần
            </h2>
            <p className="text-sm sm:text-base text-slate-300 leading-relaxed">
              VocabFlow cung cấp trọn bộ công cụ mạnh mẽ hỗ trợ mọi nhu cầu học tập của bạn, từ học sinh nhỏ tuổi tới người đi làm bận rộn.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-stretch">
            {/* Feature 1: Smart Word Bank & Import */}
            <div data-aos="fade-up" data-aos-delay="100" className="h-full flex flex-col">
              <GlassSurface borderRadius={24} className="w-full h-full text-left flex flex-col">
                <div className="p-7 flex flex-col justify-between h-full">
                  <div>
                    <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 mb-6">
                      <UploadCloud className="w-6 h-6" />
                    </div>
                    <h3 className="text-lg font-bold text-white mb-2 leading-snug">
                      Tự Tạo Kho Từ • Nhập File Tự Động
                    </h3>
                    <p className="text-xs sm:text-sm text-slate-300 mb-4 leading-relaxed">
                      Nhập danh sách từ vựng từ Excel, CSV, file PDF tài liệu hoặc chụp ảnh OCR. AI tự động tra phiên âm, dịch nghĩa và sinh câu ví dụ mẫu trong 3 giây.
                    </p>
                  </div>
                  <a
                    href="https://app.vocalflow.site/vocabulary"
                    className="text-xs font-bold text-cyan-400 hover:underline flex items-center gap-1 leading-normal pt-2"
                  >
                    Khám phá Word Bank <ChevronRight className="w-3.5 h-3.5" />
                  </a>
                </div>
              </GlassSurface>
            </div>

            {/* Feature 2: Kids English World */}
            <div data-aos="fade-up" data-aos-delay="200" className="h-full flex flex-col">
              <GlassSurface borderRadius={24} className="w-full h-full text-left flex flex-col">
                <div className="p-7 flex flex-col justify-between h-full">
                  <div>
                    <div className="w-12 h-12 rounded-2xl bg-rose-500/10 border border-rose-500/30 flex items-center justify-center text-rose-400 mb-6">
                      <Smile className="w-6 h-6" />
                    </div>
                    <h3 className="text-lg font-bold text-white mb-2 leading-snug">
                      Thế Giới Tiếng Anh Cho Trẻ Em (Kids)
                    </h3>
                    <p className="text-xs sm:text-sm text-slate-300 mb-4 leading-relaxed">
                      Phân hệ dành riêng cho các bé với đồ họa hoạt hình dễ thương, âm thanh vui nhộn, mini-game nhận diện mặt chữ giúp trẻ thích thú tiếp cận ngôn ngữ tự nhiên.
                    </p>
                  </div>
                  <a
                    href="https://kid.vocalflow.site"
                    className="text-xs font-bold text-amber-400 hover:underline flex items-center gap-1 leading-normal pt-2"
                  >
                    Vào Thế Giới Bé <ChevronRight className="w-3.5 h-3.5" />
                  </a>
                </div>
              </GlassSurface>
            </div>

            {/* Feature 3: Offline-First IndexedDB */}
            <div data-aos="fade-up" data-aos-delay="300" className="h-full flex flex-col">
              <GlassSurface borderRadius={24} className="w-full h-full text-left flex flex-col">
                <div className="p-7 flex flex-col justify-between h-full">
                  <div>
                    <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 mb-6">
                      <WifiOff className="w-6 h-6" />
                    </div>
                    <h3 className="text-lg font-bold text-white mb-2 leading-snug">
                      100% Offline-First (Không Cần Mạng)
                    </h3>
                    <p className="text-xs sm:text-sm text-slate-300 mb-4 leading-relaxed">
                      Lưu trữ hoàn toàn dữ liệu thẻ học trên trình duyệt bằng IndexedDB. Ôn bài trên máy bay, tàu điện hay vùng mất sóng, dữ liệu sẽ tự động đồng bộ khi online.
                    </p>
                  </div>
                  <span className="text-xs font-bold text-emerald-400 flex items-center gap-1 leading-normal pt-2">
                    ✓ Hoạt động mọi lúc mọi nơi
                  </span>
                </div>
              </GlassSurface>
            </div>
          </div>
        </section>

        {/* 8. Section: Testimonials & Reviews */}
        <section id="reviews" className="py-20 px-4 sm:px-6 max-w-7xl mx-auto w-full">
          <div data-aos="fade-up" className="text-center max-w-3xl mx-auto mb-16">
            <span className="text-xs font-black uppercase tracking-widest text-emerald-400 bg-emerald-500/10 px-3 py-1.5 rounded-full border border-emerald-400/20 inline-block mb-3 leading-normal">
              Đánh Giá Từ Người Dùng
            </span>
            <h2 className="text-3xl sm:text-5xl font-black text-white leading-snug sm:leading-normal mb-4">
              Được Tin Dùng Bởi Hơn 15,000+ <br />
              <span className="bg-gradient-to-r from-emerald-400 via-teal-300 to-cyan-300 bg-clip-text text-transparent">
                Người Học Đa Ngôn Ngữ Khắp Toàn Quốc
              </span>
            </h2>
            <p className="text-sm sm:text-base text-slate-300 leading-relaxed">
              Trải nghiệm thực tế từ các học viên bứt phá điểm số chứng chỉ và làm chủ vốn từ tự nhiên cùng VocabFlow.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-stretch">
            {[
              {
                name: 'Nguyễn Minh Quân',
                role: 'Sinh viên ĐH Bách Khoa HN',
                score: '915 TOEIC & JLPT N2',
                badge: 'Học song song Anh - Nhật',
                content:
                  'Trước đây mình dùng Anki nhưng giao diện chán và SM-2 rất dễ dồn bài. Chuyển sang VocabFlow với FSRS v5, vừa luyện 600 từ TOEIC vừa học Hán tự Kanji cực kỳ nhàn, số từ phải ôn mỗi ngày giảm gần 40%!',
                avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
                stars: 5
              },
              {
                name: 'Trần Thị Phương Mai',
                role: 'Chuyên viên Kiểm toán Big4',
                score: 'HSK 5 & IELTS 7.5',
                badge: 'Tăng tốc học từ',
                content:
                  'Tính năng nhập file Excel tạo deck tự động quá tuyệt vời! Mình xuất danh sách từ vựng chuyên ngành tài chính ra, VocabFlow tự điền Pinyin và nghĩa chuẩn xác, tranh thủ 15 phút nghỉ trưa là ôn xong.',
                avatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150&auto=format&fit=crop&q=80',
                stars: 5
              },
              {
                name: 'Lê Hoàng Nam',
                role: 'Kỹ sư phần mềm tại Nhật',
                score: 'JLPT N1 & Goethe B1',
                badge: 'Vượt mục tiêu làm việc',
                content:
                  'Chế độ Đấu trường PvP 1v1 làm mình nghiện học từ vựng mỗi tối. Thách đấu cùng các bạn trong cộng đồng vừa vui vừa nhớ lâu kinh khủng, phản xạ từ vựng tiếng Nhật nảy số tự nhiên.',
                avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
                stars: 5
              }
            ].map((item, idx) => (
              <div key={idx} data-aos="fade-up" data-aos-delay={(idx + 1) * 100} className="h-full flex flex-col">
                <GlassSurface borderRadius={24} className="w-full h-full text-left flex flex-col">
                  <div className="p-7 sm:p-8 flex flex-col justify-between h-full">
                    <div>
                      <div className="flex items-center gap-1 text-amber-400 mb-4">
                        {[...Array(item.stars)].map((_, i) => (
                          <Star key={i} className="w-4 h-4 fill-amber-400" />
                        ))}
                      </div>
                      <p className="text-xs sm:text-sm text-slate-200 leading-relaxed italic mb-6">
                        "{item.content}"
                      </p>
                    </div>

                    <div className="pt-4 border-t border-white/[0.08] flex items-center gap-3">
                      <img
                        src={item.avatar}
                        alt={item.name}
                        className="w-11 h-11 rounded-full object-cover border border-white/20"
                      />
                      <div>
                        <h4 className="text-sm font-bold text-white leading-normal">{item.name}</h4>
                        <p className="text-[11px] text-slate-400 leading-normal">{item.role}</p>
                        <span className="text-[10px] font-black text-emerald-400 uppercase tracking-wider leading-normal">
                          {item.score} • {item.badge}
                        </span>
                      </div>
                    </div>
                  </div>
                </GlassSurface>
              </div>
            ))}
          </div>
        </section>

        {/* 9. Bottom Call to Action Banner */}
        <section className="py-16 px-4 sm:px-6 max-w-5xl mx-auto w-full">
          <div data-aos="zoom-in">
            <GlassSurface
              borderRadius={32}
              borderWidth={0.12}
              brightness={70}
              className="w-full p-8 sm:p-14 text-center relative overflow-hidden"
            >
              <div className="max-w-xl mx-auto relative z-10">
                <h2 className="text-2xl sm:text-4xl font-black mb-4 leading-snug text-white">
                  Làm chủ từ vựng đa ngôn ngữ ngay hôm nay
                </h2>
                <p className="text-sm sm:text-base text-slate-300 mx-auto mb-8 leading-relaxed font-normal">
                  Trải nghiệm công nghệ FSRS v5 và kho từ vựng đa dạng hoàn toàn miễn phí trên nền tảng VocabFlow AI.
                </p>

                <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                  <a
                    href="https://app.vocalflow.site/review"
                    className="btn-glass-primary !py-4 !px-9 text-sm font-extrabold flex items-center justify-center gap-2"
                  >
                    <span>Học thử miễn phí</span>
                    <ArrowRight className="w-4 h-4" />
                  </a>
                  <a
                    href="https://app.vocalflow.site/placement-test"
                    className="btn-glass-secondary !py-4 !px-8 text-sm font-bold flex items-center justify-center gap-2"
                  >
                    Làm bài test trình độ
                  </a>
                </div>
              </div>
            </GlassSurface>
          </div>
        </section>

        {/* 10. Footer */}
        <footer className="py-12 border-t border-white/[0.08] bg-[#04060d]/90 text-xs text-slate-400">
          <div className="max-w-7xl mx-auto px-6 flex flex-col sm:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-3">
              <img src="/vocabflow-logo-256.png" alt="VocabFlow" className="w-6 h-6 rounded-md object-contain" />
              <span className="font-extrabold text-slate-200 text-sm leading-normal">VocabFlow AI</span>
              <span className="leading-normal">— Multi-Language Spaced Repetition & Realtime PvP Platform</span>
            </div>
            <div className="flex items-center gap-6 text-slate-400 leading-normal">
              <a href="https://app.vocalflow.site" className="hover:text-white transition">Học Viên</a>
              <a href="https://kid.vocalflow.site" className="hover:text-white transition">Trẻ Em</a>
              <a href="https://admin.vocalflow.site" className="hover:text-white transition">Quản Trị</a>
              <span>© 2026 VocabFlow. All rights reserved.</span>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
};

export default App;
