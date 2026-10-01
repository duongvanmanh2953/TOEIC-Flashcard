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
  Check,
  ChevronRight
} from 'lucide-react';
import { SplashCursor } from './components/SplashCursor';
import { GlassSurface } from './components/GlassSurface';
import { LiquidBackground } from './components/LiquidBackground';

export const App: React.FC = () => {
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [activeFSRSRating, setActiveFSRSRating] = useState<number | null>(null);

  useEffect(() => {
    // 0. Auto-scroll to top
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

  const playWordAudio = (word: string = 'accommodate') => {
    if ('speechSynthesis' in window) {
      setIsPlayingAudio(true);
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(word);
      utterance.lang = 'en-US';
      utterance.rate = 0.9;
      utterance.onend = () => setIsPlayingAudio(false);
      utterance.onerror = () => setIsPlayingAudio(false);
      window.speechSynthesis.speak(utterance);
    }
  };

  return (
    <div className="relative min-h-screen text-slate-100 flex flex-col overflow-x-hidden selection:bg-indigo-600 selection:text-white bg-[#050713] font-sans">
      {/* 1. React Bits Splash Cursor (Compact, vivid & rich fluid simulation) */}
      <SplashCursor
        SIM_RESOLUTION={128}
        DYE_RESOLUTION={1024}
        DENSITY_DISSIPATION={3.2}
        VELOCITY_DISSIPATION={2.0}
        PRESSURE={0.14}
        CURL={4.5}
        SPLAT_RADIUS={0.08}
        SPLAT_FORCE={4000}
        RAINBOW_MODE={true}
      />

      {/* 2. Ambient Dynamic Space Liquid Canvas Background with Depth Pools & Grid */}
      <LiquidBackground />

      {/* 3. Original Navbar Structure with entrance AOS (Single row, no "Động Cơ 5D") */}
      <header
        data-aos="fade-down"
        data-aos-duration="600"
        className="sticky top-0 z-50 backdrop-blur-xl bg-[#060813]/80 border-b border-slate-800/60 transition-colors duration-300"
      >
        <div className="px-4 sm:px-6 py-3.5 sm:py-4 max-w-7xl mx-auto w-full flex items-center justify-between">
          {/* Brand Logo */}
          <div className="flex items-center gap-2.5 sm:gap-3 shrink-0">
            <img
              src="/vocabflow-logo-256.png"
              alt="VocabFlow"
              className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl object-contain shadow-md shadow-indigo-500/20"
            />
            <div className="flex flex-col text-left">
              <span className="font-extrabold text-lg sm:text-xl bg-gradient-to-r from-blue-400 via-indigo-300 to-cyan-300 bg-clip-text text-transparent leading-snug">
                VocabFlow
              </span>
              <span className="hidden sm:inline-block text-[10px] font-semibold text-slate-400 tracking-wider uppercase leading-none">
                Smart Adaptive English
              </span>
            </div>
          </div>

          {/* Navigation Links: Original single-row layout without "Động Cơ 5D" */}
          <nav className="hidden md:flex items-center gap-6 text-sm font-semibold text-slate-300">
            <a
              href="https://app.vocalflow.site/review"
              className="hover:text-cyan-400 transition py-1"
            >
              Smart Review
            </a>
            <a
              href="https://app.vocalflow.site/vocabulary"
              className="hover:text-cyan-400 transition py-1"
            >
              Kho từ 600+
            </a>
            <a
              href="https://app.vocalflow.site/placement-test"
              className="hover:text-cyan-400 transition py-1"
            >
              Test Trình Độ
            </a>
            <a
              href="https://app.vocalflow.site/upgrade"
              className="hover:text-cyan-400 transition py-1"
            >
              Gói Premium
            </a>
            <a
              href="https://kid.vocalflow.site"
              className="flex items-center gap-1.5 text-amber-400 hover:text-amber-300 transition py-1 px-3 rounded-full bg-amber-500/10 border border-amber-500/20 text-xs font-bold"
            >
              <span>🦁</span> Thế Giới Bé
            </a>
          </nav>

          {/* Auth Actions */}
          <div className="flex items-center gap-3 shrink-0">
            <a
              href="https://app.vocalflow.site/login"
              className="whitespace-nowrap px-3 py-1.5 sm:py-2 rounded-xl text-xs sm:text-sm font-bold text-slate-200 hover:text-cyan-400 hover:bg-slate-800/70 transition shrink-0"
            >
              Đăng nhập
            </a>
            <a
              href="https://app.vocalflow.site/dashboard"
              className="whitespace-nowrap btn-glass-primary !py-2 sm:!py-2.5 !px-3.5 sm:!px-5 text-xs sm:text-sm font-bold shrink-0 flex items-center gap-1.5"
            >
              <span>Vào học ngay</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </a>
          </div>
        </div>
      </header>

      {/* 4. Hero Section with Top AOS Staggering */}
      <section className="relative pt-16 sm:pt-24 pb-20 px-4 sm:px-6 max-w-7xl mx-auto w-full flex flex-col items-center text-center">
        {/* Luminous Top Pill Badge with AOS */}
        <div
          data-aos="fade-down"
          data-aos-delay="100"
          className="inline-flex items-center gap-2.5 px-4 py-2 rounded-full card-brand-effect overflow-hidden bg-sky-500/[0.08] border border-sky-400/35 text-sky-300 text-xs sm:text-sm font-bold mb-8 backdrop-blur-xl leading-normal shadow-xs"
        >
          <Sparkles className="w-4 h-4 text-cyan-400 flex-shrink-0" />
          <span>Thuật toán Lặp lại Ngắt quãng Thích ứng + Gia sư VocabFlow AI 24/7</span>
        </div>

        {/* Hero Title with Generous Line-Height & AOS */}
        <h1
          data-aos="fade-up"
          data-aos-delay="200"
          className="text-4xl sm:text-6xl md:text-7xl font-black tracking-normal leading-[1.3] sm:leading-[1.25] mb-6 max-w-4xl text-white"
        >
          Học ít từ hơn. <br className="hidden sm:block" />
          <span className="inline-block mt-2 bg-gradient-to-r from-sky-400 via-indigo-300 to-cyan-300 bg-clip-text text-transparent">
            Ghi nhớ trọn đời.
          </span>
        </h1>

        {/* Hero Subtitle with Generous Line-Height & AOS */}
        <p
          data-aos="fade-up"
          data-aos-delay="300"
          className="text-base sm:text-xl text-slate-300 max-w-3xl mx-auto mb-10 leading-relaxed font-normal"
        >
          VocabFlow không bắt bạn lật flashcard máy móc. Nền tảng ứng dụng thuật toán FSRS v5 đo lường độ bền trí nhớ, tự động phát hiện lỗ hổng và nhắc nhở đúng{' '}
          <span className="font-semibold text-cyan-400 underline decoration-cyan-400/40 underline-offset-4">
            thời điểm vàng
          </span>{' '}
          trước khi não bộ quên từ vựng.
        </p>

        {/* Hero Action Buttons with AOS */}
        <div
          data-aos="fade-up"
          data-aos-delay="400"
          className="flex flex-col sm:flex-row items-center justify-center gap-4 w-full sm:w-auto mb-16"
        >
          <a
            href="https://app.vocalflow.site/review"
            className="btn-glass-primary w-full sm:w-auto !py-4 !px-8 text-base font-bold flex items-center justify-center gap-2.5 shadow-lg shadow-indigo-500/20"
          >
            <Sparkles className="w-5 h-5 fill-white/80" />
            <span>Trải nghiệm Smart Review</span>
            <ArrowRight className="w-4 h-4" />
          </a>
          <a
            href="https://app.vocalflow.site/vocabulary"
            className="btn-glass-secondary w-full sm:w-auto !py-4 !px-7 text-base font-bold flex items-center justify-center gap-2"
          >
            <BookOpen className="w-4 h-4 text-indigo-400" />
            <span>Khám phá 600+ từ TOEIC</span>
          </a>
          <a
            href="https://app.vocalflow.site/placement-test"
            className="btn-glass-secondary w-full sm:w-auto !py-4 !px-6 text-base font-bold text-cyan-300 flex items-center justify-center gap-2"
          >
            <Zap className="w-4 h-4 text-amber-400" />
            <span>Test Trình Độ (Free)</span>
          </a>
        </div>

        {/* Interactive Live Card Preview Showcase with AOS */}
        <div
          data-aos="zoom-in"
          data-aos-delay="500"
          className="w-full max-w-2xl mx-auto mb-20"
        >
          <GlassSurface
            borderRadius={26}
            borderWidth={0.09}
            brightness={65}
            opacity={0.94}
            blur={14}
            className="w-full text-left"
          >
            <div className="p-6 sm:p-8 w-full">
              {/* Card Header Bar */}
              <div className="flex items-center justify-between pb-5 border-b border-white/[0.08]">
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full bg-rose-500 inline-block shadow-sm shadow-rose-500/50"></span>
                  <span className="w-3 h-3 rounded-full bg-amber-500 inline-block shadow-sm shadow-amber-500/50"></span>
                  <span className="w-3 h-3 rounded-full bg-emerald-500 inline-block shadow-sm shadow-emerald-500/50"></span>
                  <span className="text-xs font-bold text-slate-400 ml-2">
                    Mô Phỏng Thẻ Học Trí Tuệ 5D VocabFlow AI
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[11px] font-black uppercase px-2.5 py-1 rounded-md bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                    FSRS v5 Interval: {activeFSRSRating ? `${activeFSRSRating}d` : '4.2d'}
                  </span>
                </div>
              </div>

              {/* Main Card Content */}
              <div className="pt-6">
                <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-3 mb-3">
                  <div className="flex items-center gap-3">
                    <h3 className="text-3xl sm:text-4xl font-black text-white tracking-tight">
                      accommodate
                    </h3>
                    <button
                      onClick={() => playWordAudio('accommodate')}
                      title="Nghe phát âm chuẩn US"
                      className={`p-2.5 rounded-xl bg-indigo-500/20 hover:bg-indigo-500/35 text-indigo-300 border border-indigo-400/30 transition flex items-center gap-1.5 text-xs font-bold cursor-pointer group ${
                        isPlayingAudio ? 'ring-2 ring-cyan-400' : ''
                      }`}
                    >
                      <Volume2 className="w-4 h-4 text-cyan-400 group-hover:scale-110 transition-transform" />
                      <span className="text-slate-200">
                        {isPlayingAudio ? 'Đang phát...' : 'Phát âm US'}
                      </span>
                    </button>
                  </div>
                  <span className="text-xs font-bold text-cyan-400 bg-cyan-500/10 px-3 py-1 rounded-lg border border-cyan-500/20 w-fit">
                    /əˈkɑːmədeɪt/ • verb
                  </span>
                </div>

                <p className="text-base sm:text-lg font-semibold text-slate-200 mb-5 leading-normal">
                  Cung cấp nơi ở, phòng ở; đáp ứng hoặc giải quyết (nhu cầu, mong muốn)
                </p>

                <div className="p-4 rounded-xl bg-slate-900/80 border border-white/[0.08] mb-5">
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5 leading-normal">
                    Ví dụ ngữ cảnh đề thi TOEIC thực chiến:
                  </p>
                  <p className="text-sm sm:text-base font-medium text-slate-300 italic leading-relaxed">
                    "The new convention center is spacious enough to{' '}
                    <span className="text-cyan-400 font-bold not-italic underline decoration-cyan-400/40">
                      accommodate
                    </span>{' '}
                    up to 2,500 participants."
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
                      <strong className="text-emerald-400 font-bold">VocabFlow AI:</strong> Xuất hiện trong 42% đề đọc TOEIC Part 5 & 7.
                    </p>
                  </div>
                </div>

                {/* Interactive Rating Demo */}
                <div className="pt-3 border-t border-white/[0.08]">
                  <p className="text-xs font-bold text-slate-400 mb-2 leading-normal">
                    Thử nghiệm đánh giá phản xạ thuật toán FSRS:
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

        {/* Metrics Stats Bar Cascading AOS */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6 w-full max-w-5xl mb-24">
          <div data-aos="fade-up" data-aos-delay="550">
            <GlassSurface borderRadius={20} className="w-full text-center">
              <div className="p-6">
                <div className="text-3xl sm:text-4xl font-black text-cyan-400 leading-none mb-2">
                  600+
                </div>
                <p className="text-xs sm:text-sm font-bold text-slate-400 leading-normal">
                  Từ TOEIC chuẩn đề thi ETS
                </p>
              </div>
            </GlassSurface>
          </div>

          <div data-aos="fade-up" data-aos-delay="650">
            <GlassSurface borderRadius={20} className="w-full text-center">
              <div className="p-6">
                <div className="text-3xl sm:text-4xl font-black text-indigo-400 leading-none mb-2">
                  98.4%
                </div>
                <p className="text-xs sm:text-sm font-bold text-slate-400 leading-normal">
                  Tỷ lệ duy trì trí nhớ 6 tháng
                </p>
              </div>
            </GlassSurface>
          </div>

          <div data-aos="fade-up" data-aos-delay="750">
            <GlassSurface borderRadius={20} className="w-full text-center">
              <div className="p-6">
                <div className="text-3xl sm:text-4xl font-black text-emerald-400 leading-none mb-2">
                  4.2x
                </div>
                <p className="text-xs sm:text-sm font-bold text-slate-400 leading-normal">
                  Tăng tốc độ nhận diện đề thi
                </p>
              </div>
            </GlassSurface>
          </div>

          <div data-aos="fade-up" data-aos-delay="850">
            <GlassSurface borderRadius={20} className="w-full text-center">
              <div className="p-6">
                <div className="text-3xl sm:text-4xl font-black text-amber-400 leading-none mb-2">
                  24/7
                </div>
                <p className="text-xs sm:text-sm font-bold text-slate-400 leading-normal">
                  Gia sư AI phản xạ thời gian thực
                </p>
              </div>
            </GlassSurface>
          </div>
        </div>
      </section>

      {/* 5. Section: 5D Spaced Repetition Engine */}
      <section className="py-20 px-4 sm:px-6 max-w-7xl mx-auto w-full">
        <div data-aos="fade-up" className="text-center max-w-3xl mx-auto mb-16">
          <span className="text-xs font-black uppercase tracking-widest text-indigo-400 bg-indigo-500/10 px-3 py-1.5 rounded-full border border-indigo-400/20 inline-block mb-3 leading-normal">
            Đột Phá Khoa Học Nhận Thức
          </span>
          <h2 className="text-3xl sm:text-5xl font-black text-white leading-snug sm:leading-normal mb-4">
            Động cơ 5D Spaced Repetition <br />
            <span className="bg-gradient-to-r from-sky-400 via-indigo-300 to-cyan-300 bg-clip-text text-transparent">
              FSRS v5 vs SM-2 Cổ Điển
            </span>
          </h2>
          <p className="text-sm sm:text-base text-slate-300 leading-relaxed">
            Hầu hết các app flashcard hiện nay vẫn dùng thuật toán SuperMemo-2 từ năm 1987. VocabFlow nâng cấp lên FSRS v5 mô phỏng chính xác cấu trúc quên của vỏ não.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div data-aos="fade-up" data-aos-delay="100">
            <GlassSurface borderRadius={24} className="w-full text-left">
              <div className="p-7">
                <div className="w-12 h-12 rounded-2xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400 mb-6">
                  <Brain className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-bold text-white mb-2 leading-snug">
                  Stability & Retrievability
                </h3>
                <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                  Tách biệt độ bền trí nhớ và khả năng nhớ lại, giúp không ôn lặp lại vô ích các từ đã khắc sâu vào tiềm thức.
                </p>
              </div>
            </GlassSurface>
          </div>

          <div data-aos="fade-up" data-aos-delay="200">
            <GlassSurface borderRadius={24} className="w-full text-left">
              <div className="p-7">
                <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center text-indigo-400 mb-6">
                  <Compass className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-bold text-white mb-2 leading-snug">
                  Contextual Clue Matrix
                </h3>
                <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                  Liên kết từ vựng với cấu trúc ngữ pháp Part 5 & 6 TOEIC, học trọn vẹn cả cụm từ đi kèm (collocations) và họ từ.
                </p>
              </div>
            </GlassSurface>
          </div>

          <div data-aos="fade-up" data-aos-delay="300">
            <GlassSurface borderRadius={24} className="w-full text-left">
              <div className="p-7">
                <div className="w-12 h-12 rounded-2xl bg-purple-500/10 border border-purple-500/30 flex items-center justify-center text-purple-400 mb-6">
                  <Flame className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-bold text-white mb-2 leading-snug">
                  Anti-Leech Smart Detector
                </h3>
                <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                  Tự động nhận diện những từ bạn hay quên hoặc nhầm lẫn, lập tức gợi ý giải thích chi tiết và ví dụ ngữ cảnh mới.
                </p>
              </div>
            </GlassSurface>
          </div>

          <div data-aos="fade-up" data-aos-delay="400">
            <GlassSurface borderRadius={24} className="w-full text-left">
              <div className="p-7">
                <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 mb-6">
                  <TrendingUp className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-bold text-white mb-2 leading-snug">
                  Tối Ưu Thời Gian Học
                </h3>
                <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                  Cắt giảm 38.5% số lần lật thẻ vô ích so với flashcard thông thường, đạt mốc 800+ TOEIC với chỉ 20 phút mỗi ngày.
                </p>
              </div>
            </GlassSurface>
          </div>
        </div>
      </section>

      {/* 6. Section: TOEIC 600+ Essential Words */}
      <section id="features-toeic" className="py-20 px-4 sm:px-6 max-w-7xl mx-auto w-full">
        <div data-aos="fade-up" className="text-center max-w-3xl mx-auto mb-16">
          <span className="text-xs font-black uppercase tracking-widest text-cyan-400 bg-cyan-500/10 px-3 py-1.5 rounded-full border border-cyan-400/20 inline-block mb-3 leading-normal">
            Bám Sát Đề Thi Thật ETS
          </span>
          <h2 className="text-3xl sm:text-5xl font-black text-white leading-snug sm:leading-normal mb-4">
            Kho 600+ Từ Vựng TOEIC Cốt Lõi <br />
            <span className="bg-gradient-to-r from-cyan-400 via-sky-300 to-indigo-300 bg-clip-text text-transparent">
              Phân Loại Theo 50 Chủ Đề Trọng Điểm
            </span>
          </h2>
          <p className="text-sm sm:text-base text-slate-300 leading-relaxed">
            Tổng hợp từ 100+ đề thi TOEIC mới nhất. Mỗi từ đều có phiên âm IPA chuẩn, audio phát âm US/UK và câu ví dụ đề thi thực tế.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div data-aos="fade-up" data-aos-delay="100">
            <GlassSurface borderRadius={24} className="w-full text-left">
              <div className="p-7">
                <div className="flex items-center justify-between mb-4">
                  <span className="text-xs font-black text-cyan-400 uppercase tracking-wider bg-cyan-500/10 px-3 py-1 rounded-md border border-cyan-500/20 leading-normal">
                    Chủ Đề 01 - 10
                  </span>
                  <span className="text-xs font-bold text-slate-400 leading-normal">120 Từ vựng</span>
                </div>
                <h3 className="text-xl font-black text-white mb-2 leading-snug">
                  Hợp Đồng, Bảo Hành & Mua Bán
                </h3>
                <p className="text-xs sm:text-sm text-slate-300 mb-4 leading-relaxed">
                  Tập trung vào: Contracts, Warranties, Business Planning, Conferences, Marketing và Sales Pitch.
                </p>
                <div className="flex flex-wrap gap-2 text-[11px] font-semibold text-slate-400">
                  <span className="bg-slate-800/80 px-2 py-1 rounded-md">obligate</span>
                  <span className="bg-slate-800/80 px-2 py-1 rounded-md">provision</span>
                  <span className="bg-slate-800/80 px-2 py-1 rounded-md">assurance</span>
                </div>
              </div>
            </GlassSurface>
          </div>

          <div data-aos="fade-up" data-aos-delay="200">
            <GlassSurface borderRadius={24} className="w-full text-left">
              <div className="p-7">
                <div className="flex items-center justify-between mb-4">
                  <span className="text-xs font-black text-indigo-400 uppercase tracking-wider bg-indigo-500/10 px-3 py-1 rounded-md border border-indigo-500/20 leading-normal">
                    Chủ Đề 11 - 20
                  </span>
                  <span className="text-xs font-bold text-slate-400 leading-normal">125 Từ vựng</span>
                </div>
                <h3 className="text-xl font-black text-white mb-2 leading-snug">
                  Tài Chính, Ngân Hàng & Kế Toán
                </h3>
                <p className="text-xs sm:text-sm text-slate-300 mb-4 leading-relaxed">
                  Tập trung vào: Banking, Accounting, Investments, Taxes, Financial Statements và Invoicing.
                </p>
                <div className="flex flex-wrap gap-2 text-[11px] font-semibold text-slate-400">
                  <span className="bg-slate-800/80 px-2 py-1 rounded-md">dividend</span>
                  <span className="bg-slate-800/80 px-2 py-1 rounded-md">reconcile</span>
                  <span className="bg-slate-800/80 px-2 py-1 rounded-md">depreciation</span>
                </div>
              </div>
            </GlassSurface>
          </div>

          <div data-aos="fade-up" data-aos-delay="300">
            <GlassSurface borderRadius={24} className="w-full text-left">
              <div className="p-7">
                <div className="flex items-center justify-between mb-4">
                  <span className="text-xs font-black text-emerald-400 uppercase tracking-wider bg-emerald-500/10 px-3 py-1 rounded-md border border-emerald-500/20 leading-normal">
                    Chủ Đề 21 - 30
                  </span>
                  <span className="text-xs font-bold text-slate-400 leading-normal">115 Từ vựng</span>
                </div>
                <h3 className="text-xl font-black text-white mb-2 leading-snug">
                  Quản Trị Nhân Sự & Tuyển Dụng
                </h3>
                <p className="text-xs sm:text-sm text-slate-300 mb-4 leading-relaxed">
                  Tập trung vào: Job Advertising, Recruiting, Interviewing, Hiring, Salaries và Benefits.
                </p>
                <div className="flex flex-wrap gap-2 text-[11px] font-semibold text-slate-400">
                  <span className="bg-slate-800/80 px-2 py-1 rounded-md">candidate</span>
                  <span className="bg-slate-800/80 px-2 py-1 rounded-md">remuneration</span>
                  <span className="bg-slate-800/80 px-2 py-1 rounded-md">probation</span>
                </div>
              </div>
            </GlassSurface>
          </div>
        </div>
      </section>

      {/* 7. Section: AI Coach & PvP */}
      <section id="features-ai" className="py-20 px-4 sm:px-6 max-w-7xl mx-auto w-full">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
          <div data-aos="fade-right" className="text-left">
            <span className="text-xs font-black uppercase tracking-widest text-violet-400 bg-violet-500/10 px-3 py-1.5 rounded-full border border-violet-400/20 inline-block mb-3 leading-normal">
              Gia Sư Cá Nhân Hóa 24/7
            </span>
            <h2 className="text-3xl sm:text-5xl font-black text-white leading-snug sm:leading-normal mb-6">
              VocabFlow AI Coach Đàm Thoại & <br />
              <span className="bg-gradient-to-r from-violet-400 via-indigo-300 to-sky-300 bg-clip-text text-transparent">
                Đấu Trường PvP 1v1
              </span>
            </h2>
            <p className="text-base text-slate-300 mb-6 leading-relaxed">
              VocabFlow tích hợp mô hình AI thông minh có khả năng trò chuyện, giải thích ngữ cảnh bẫy đề thi và tổ chức phòng thi đấu thời gian thực với cộng đồng người học.
            </p>

            <ul className="space-y-4 mb-8">
              <li className="flex items-start gap-3 text-sm text-slate-200 leading-normal">
                <CheckCircle2 className="w-5 h-5 text-cyan-400 shrink-0 mt-0.5" />
                <span>
                  <strong>Phản hồi tức thì:</strong> Nhận diện lỗi phát âm và phân biệt các từ dễ nhầm lẫn trong đề thi Part 1 & Part 2.
                </span>
              </li>
              <li className="flex items-start gap-3 text-sm text-slate-200 leading-normal">
                <CheckCircle2 className="w-5 h-5 text-indigo-400 shrink-0 mt-0.5" />
                <span>
                  <strong>Đấu trường Word Match & Scramble:</strong> Ghép từ và nối nghĩa tốc độ cao, leo bảng xếp hạng tuần và nhận huy hiệu.
                </span>
              </li>
              <li className="flex items-start gap-3 text-sm text-slate-200 leading-normal">
                <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                <span>
                  <strong>Thi thử TOEIC:</strong> Đề thi chuẩn ETS có bấm giờ và phân tích chi tiết điểm số từng phần thi.
                </span>
              </li>
            </ul>

            <a
              href="https://app.vocalflow.site/dashboard"
              className="btn-glass-primary !py-3.5 !px-8 text-sm font-bold inline-flex items-center gap-2"
            >
              <span>Thử thách cùng AI Coach ngay</span>
              <ArrowRight className="w-4 h-4" />
            </a>
          </div>

          <div data-aos="fade-left">
            <GlassSurface borderRadius={28} className="w-full text-left">
              <div className="p-7 sm:p-9">
                <div className="flex items-center justify-between pb-4 border-b border-white/[0.08] mb-6">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-violet-500/20 border border-violet-500/40 flex items-center justify-center text-violet-300 font-bold">
                      AI
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-white leading-normal">VocabFlow AI Coach</h4>
                      <span className="text-[11px] text-emerald-400 flex items-center gap-1 leading-normal">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 inline-block animate-pulse"></span>
                        Trực tuyến 24/7
                      </span>
                    </div>
                  </div>
                  <span className="text-xs font-bold text-slate-400 bg-slate-800/80 px-2.5 py-1 rounded-md leading-normal">
                    TOEIC Speaking Prep
                  </span>
                </div>

                {/* Chat Simulation */}
                <div className="space-y-4 mb-6">
                  <div className="p-4 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 text-xs sm:text-sm text-slate-200 leading-relaxed">
                    <p className="font-bold text-indigo-300 mb-1 leading-normal">Gia sư AI:</p>
                    "Trong câu: 'The manager decided to ______ the meeting until Friday', bạn nên dùng <strong>postpone</strong> hay <strong>cancel</strong>?"
                  </div>

                  <div className="p-4 rounded-2xl bg-slate-800/80 border border-white/[0.08] text-xs sm:text-sm text-slate-300 ml-6 leading-relaxed">
                    <p className="font-bold text-slate-400 mb-1 leading-normal">Bạn:</p>
                    "Dùng 'postpone' vì có 'until Friday', nghĩa là hoãn lại đến thứ Sáu chứ không phải hủy bỏ hoàn toàn."
                  </div>

                  <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-xs sm:text-sm text-slate-200 leading-relaxed">
                    <p className="font-bold text-emerald-400 mb-1 leading-normal">AI Đánh giá: Xuất sắc! (+15 EXP)</p>
                    "Chính xác 100%! 'Postpone' đồng nghĩa với 'put off' hoặc 'delay'. Đây là câu bẫy quen thuộc trong Part 5 ETS."
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-slate-900/90 border border-white/[0.08] flex items-center justify-between text-xs text-slate-400 leading-normal">
                  <span>Micro sẵn sàng thu âm</span>
                  <span className="text-cyan-400 font-bold">Độ trễ AI: 120ms</span>
                </div>
              </div>
            </GlassSurface>
          </div>
        </div>
      </section>

      {/* 8. Section: Ecosystem */}
      <section id="ecosystem" className="py-20 px-4 sm:px-6 max-w-7xl mx-auto w-full">
        <div data-aos="fade-up" className="text-center max-w-3xl mx-auto mb-16">
          <span className="text-xs font-black uppercase tracking-widest text-sky-400 bg-sky-500/10 px-3 py-1.5 rounded-full border border-sky-400/20 inline-block mb-3 leading-normal">
            Hệ Sinh Thái Đa Nền Tảng
          </span>
          <h2 className="text-3xl sm:text-5xl font-black text-white leading-snug sm:leading-normal mb-4">
            Đầy Đủ Công Cụ Từ Cơ Bản Đến Nâng Cao
          </h2>
          <p className="text-sm sm:text-base text-slate-300 leading-relaxed">
            VocabFlow cung cấp hệ thống học tập khép kín: kiểm tra trình độ đầu vào, ôn tập ngắt quãng, làm đề thi thử và kết nối cộng đồng.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div data-aos="fade-up" data-aos-delay="100">
            <GlassSurface borderRadius={24} className="w-full text-left">
              <div className="p-7">
                <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 mb-6">
                  <Zap className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-bold text-white mb-2 leading-snug">Test Trình Độ Đầu Vào</h3>
                <p className="text-xs sm:text-sm text-slate-300 mb-4 leading-relaxed">
                  Bài kiểm tra thích ứng chỉ trong 3 phút giúp xác định chính xác vốn từ vựng hiện tại và đề xuất lộ trình ôn tập cá nhân hóa.
                </p>
                <a href="https://app.vocalflow.site/placement-test" className="text-xs font-bold text-cyan-400 hover:underline flex items-center gap-1 leading-normal">
                  Làm bài test ngay <ChevronRight className="w-3.5 h-3.5" />
                </a>
              </div>
            </GlassSurface>
          </div>

          <div data-aos="fade-up" data-aos-delay="200">
            <GlassSurface borderRadius={24} className="w-full text-left">
              <div className="p-7">
                <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center text-indigo-400 mb-6">
                  <BookOpen className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-bold text-white mb-2 leading-snug">Kho Từ Vựng Cá Nhân Hóa</h3>
                <p className="text-xs sm:text-sm text-slate-300 mb-4 leading-relaxed">
                  Tự tạo bộ thẻ riêng, nhập dữ liệu từ Excel, PDF hoặc Word chỉ trong một nốt nhạc với sự hỗ trợ tự động điền nghĩa từ AI.
                </p>
                <a href="https://app.vocalflow.site/vocabulary" className="text-xs font-bold text-cyan-400 hover:underline flex items-center gap-1 leading-normal">
                  Khám phá kho từ <ChevronRight className="w-3.5 h-3.5" />
                </a>
              </div>
            </GlassSurface>
          </div>

          <div data-aos="fade-up" data-aos-delay="300">
            <GlassSurface borderRadius={24} className="w-full text-left">
              <div className="p-7">
                <div className="w-12 h-12 rounded-2xl bg-rose-500/10 border border-rose-500/30 flex items-center justify-center text-rose-400 mb-6">
                  <Users className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-bold text-white mb-2 leading-snug">Cộng Đồng & Diễn Đàn</h3>
                <p className="text-xs sm:text-sm text-slate-300 mb-4 leading-relaxed">
                  Chia sẻ bộ thẻ flashcard điểm cao, thảo luận các câu khó trong đề thi TOEIC và tham gia thi đấu cùng hàng chục ngàn học viên.
                </p>
                <a href="https://app.vocalflow.site/dashboard" className="text-xs font-bold text-cyan-400 hover:underline flex items-center gap-1 leading-normal">
                  Gia nhập cộng đồng <ChevronRight className="w-3.5 h-3.5" />
                </a>
              </div>
            </GlassSurface>
          </div>
        </div>
      </section>

      {/* 9. Section: Testimonials & Reviews */}
      <section id="reviews" className="py-20 px-4 sm:px-6 max-w-7xl mx-auto w-full">
        <div data-aos="fade-up" className="text-center max-w-3xl mx-auto mb-16">
          <span className="text-xs font-black uppercase tracking-widest text-emerald-400 bg-emerald-500/10 px-3 py-1.5 rounded-full border border-emerald-400/20 inline-block mb-3 leading-normal">
            Đánh Giá Từ Người Dùng
          </span>
          <h2 className="text-3xl sm:text-5xl font-black text-white leading-snug sm:leading-normal mb-4">
            Được Tin Dùng Bởi Hơn 15,000+ <br />
            <span className="bg-gradient-to-r from-emerald-400 via-teal-300 to-cyan-300 bg-clip-text text-transparent">
              Sĩ Tử Luyện Thi TOEIC Khắp Toàn Quốc
            </span>
          </h2>
          <p className="text-sm sm:text-base text-slate-300 leading-relaxed">
            Xem học viên đã bứt phá điểm số TOEIC từ mất gốc lên 800+ như thế nào cùng phương pháp FSRS v5 của VocabFlow.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[
            {
              name: 'Nguyễn Minh Quân',
              role: 'Sinh viên ĐH Bách Khoa HN',
              score: '915 / 990 TOEIC',
              badge: 'Tăng 285 điểm sau 2 tháng',
              content:
                'Trước đây mình dùng Anki nhưng giao diện chán và thuật toán SM-2 rất dễ bị dồn bài làm nản chí. Chuyển sang VocabFlow với FSRS v5, số từ cần ôn mỗi ngày giảm gần 40% mà từ vựng khi làm đề Part 7 nảy số cực kỳ tự nhiên!',
              avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
              stars: 5
            },
            {
              name: 'Trần Thị Phương Mai',
              role: 'Chuyên viên Kiểm toán Big4',
              score: '870 / 990 TOEIC',
              badge: 'Đạt chuẩn tuyển dụng',
              content:
                'Đi làm bận tối mắt tối mũi chỉ tranh thủ được 15 phút giờ nghỉ trưa. Tính năng AI Coach phân tích câu ví dụ thực tế trong hợp đồng và email giúp mình vừa học từ TOEIC vừa áp dụng ngay vào công việc.',
              avatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150&auto=format&fit=crop&q=80',
              stars: 5
            },
            {
              name: 'Lê Hoàng Nam',
              role: 'Kỹ sư phần mềm',
              score: '840 / 990 TOEIC',
              badge: 'Vượt mục tiêu 750+',
              content:
                'Chế độ Đấu trường PvP Từ vựng 1v1 khiến việc học nghiện như chơi game. Bạn bè rủ nhau thách đấu mỗi tối, chỉ sau 3 tuần mà toàn bộ 600 từ TOEIC cơ bản đã thuộc làu làu.',
              avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
              stars: 5
            }
          ].map((item, idx) => (
            <div key={idx} data-aos="fade-up" data-aos-delay={(idx + 1) * 100}>
              <GlassSurface borderRadius={24} className="w-full text-left">
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

      {/* 10. Learning Roadmap (01, 02, 03) */}
      <section className="py-20 px-4 sm:px-6 max-w-7xl mx-auto w-full">
        <div data-aos="fade-up" className="text-center max-w-2xl mx-auto mb-16">
          <h2 className="text-2xl sm:text-4xl font-black mb-3 text-white leading-snug">
            Lộ trình 3 bước chinh phục từ vựng TOEIC
          </h2>
          <p className="text-sm text-slate-400 leading-relaxed">
            Học thông minh hơn nhờ ứng dụng nguyên lý khoa học thần kinh nhận thức của VocabFlow.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div data-aos="fade-up" data-aos-delay="100">
            <GlassSurface borderRadius={24} className="w-full text-left">
              <div className="p-7">
                <div className="text-4xl font-black text-cyan-400 mb-3 leading-none">
                  01
                </div>
                <h4 className="font-bold text-base text-white mb-2 leading-snug">
                  Định vị trình độ ban đầu
                </h4>
                <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
                  Làm bài test nhanh 15 câu chuẩn đoán để hệ thống xác định vốn từ hiện tại và tự động phân bổ lộ trình từ vựng mục tiêu.
                </p>
              </div>
            </GlassSurface>
          </div>

          <div data-aos="fade-up" data-aos-delay="200">
            <GlassSurface borderRadius={24} className="w-full text-left">
              <div className="p-7">
                <div className="text-4xl font-black text-indigo-400 mb-3 leading-none">
                  02
                </div>
                <h4 className="font-bold text-base text-white mb-2 leading-snug">
                  Lặp lại ngắt quãng thích ứng
                </h4>
                <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
                  Mỗi ngày chỉ cần 10-15 phút ôn tập đúng các thẻ từ sắp quên. Thuật toán FSRS v5 tự động xếp lịch chính xác từng ngày.
                </p>
              </div>
            </GlassSurface>
          </div>

          <div data-aos="fade-up" data-aos-delay="300">
            <GlassSurface borderRadius={24} className="w-full text-left">
              <div className="p-7">
                <div className="text-4xl font-black text-purple-400 mb-3 leading-none">
                  03
                </div>
                <h4 className="font-bold text-base text-white mb-2 leading-snug">
                  Tự tin làm chủ đề thi
                </h4>
                <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
                  Chuyển hóa từ vựng thành phản xạ tự nhiên, hiểu sâu ngữ cảnh đề thi TOEIC và bứt phá mục tiêu điểm số.
                </p>
              </div>
            </GlassSurface>
          </div>
        </div>
      </section>

      {/* 11. Bottom Call to Action Banner */}
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
                Bắt đầu làm chủ từ vựng ngay hôm nay
              </h2>
              <p className="text-sm sm:text-base text-slate-300 mx-auto mb-8 leading-relaxed font-normal">
                Không cần cài đặt rườm rà. Trải nghiệm phương pháp ghi nhớ hiện đại nhất hoàn toàn miễn phí trên nền tảng VocabFlow AI.
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
                  Làm bài test 3 phút
                </a>
              </div>
            </div>
          </GlassSurface>
        </div>
      </section>

      {/* 12. Footer */}
      <footer className="py-12 border-t border-white/[0.08] bg-[#04060d] text-xs text-slate-400">
        <div className="max-w-7xl mx-auto px-6 flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-3">
            <img src="/vocabflow-logo-256.png" alt="VocabFlow" className="w-6 h-6 rounded-md object-contain" />
            <span className="font-extrabold text-slate-200 text-sm leading-normal">VocabFlow AI</span>
            <span className="leading-normal">— Next-Gen Cognitive 5D & Adaptive Spaced Repetition Platform</span>
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
  );
};

export default App;
