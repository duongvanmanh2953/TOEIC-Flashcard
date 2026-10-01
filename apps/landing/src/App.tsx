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
  Award,
  Users,
  Star,
  Globe,
  Check,
  ChevronRight,
  FileText,
  MousePointerClick,
  Layers,
  ShieldCheck,
  Clock,
  HelpCircle,
  FolderPlus,
  Compass,
  Flame,
  ArrowUpRight,
} from 'lucide-react';
import { GlassSurface } from './components/GlassSurface';
import { LiquidBackground } from './components/LiquidBackground';

// Multi-language demo card data for Hero preview
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
    meaning: 'Cung cấp nơi ở; đáp ứng hoặc giải quyết (nhu cầu, mong muốn)',
    example: '"The new convention center is spacious enough to accommodate up to 2,500 participants."',
    highlight: 'accommodate',
    speechCode: 'en-US',
    statsLabel: 'Xuất hiện trong 42% đề đọc TOEIC Part 5 & 7',
  },
  ja: {
    id: 'ja',
    flag: '🇯🇵',
    langName: 'Tiếng Nhật',
    badge: 'JLPT N2 - N1 Business',
    word: '改善 (かいぜん)',
    pronunciation: 'Kaizen • かいぜん',
    pos: 'noun / suru verb',
    meaning: 'Cải tiến liên tục, hoàn thiện quy trình từng bước một',
    example: '「工場では生産性を向上させるために、作業プロセスの改善を進めている。」',
    highlight: '改善',
    speechCode: 'ja-JP',
    statsLabel: 'Thuộc 100 từ vựng kinh doanh cốt lõi JLPT',
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
    statsLabel: 'Tần suất xuất hiện cao trong đề thi HSK đọc hiểu',
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
    statsLabel: 'Xuất hiện thường xuyên trong TOPIK Đọc',
  },
  de: {
    id: 'de',
    flag: '🇩🇪',
    langName: 'Tiếng Đức',
    badge: 'Goethe-Zertifikat B1-B2',
    word: 'Zuverlässig',
    pronunciation: '/ˈtsuːfɛɐ̯ˌlɛsɪç/',
    pos: 'adjective',
    meaning: 'Đáng tin cậy, chắc chắn, hoạt động ổn định',
    example: '"Er ist ein äußerst zuverlässiger Partner bei anspruchsvollen Projekten."',
    highlight: 'zuverlässiger',
    speechCode: 'de-DE',
    statsLabel: 'Từ vựng trọng tâm trong kỳ thi viết B2',
  },
};

export const App: React.FC = () => {
  const [selectedLang, setSelectedLang] = useState<'en' | 'ja' | 'zh' | 'ko' | 'de'>('en');
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [activeLoopStep, setActiveLoopStep] = useState(3); // Interactive selection step demo
  const [demoSelectedText, setDemoSelectedText] = useState('take immediate responsibility');
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
      duration: 600,
      once: true,
      easing: 'ease-out-cubic',
      offset: 40,
    });

    return () => {
      cancelAnimationFrame(animationFrameId);
      lenis.destroy();
    };
  }, []);

  const handleSpeak = (text: string, langCode: string) => {
    if (!('speechSynthesis' in window)) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = langCode;
    utterance.rate = 0.9;
    utterance.onstart = () => setIsPlayingAudio(true);
    utterance.onend = () => setIsPlayingAudio(false);
    utterance.onerror = () => setIsPlayingAudio(false);
    window.speechSynthesis.speak(utterance);
  };

  const currentSample = MULTI_LANG_SAMPLES[selectedLang];

  return (
    <div className="relative min-h-screen text-slate-100 flex flex-col overflow-x-hidden selection:bg-indigo-600 selection:text-white bg-[#060813] font-sans">
      {/* 1. Static GPU-friendly Ambient Gradient Background */}
      <LiquidBackground />

      {/* 2. Main Foreground App Content */}
      <div className="relative z-10 flex flex-col min-h-screen">
        {/* Navigation Bar */}
        <header className="sticky top-0 z-50 backdrop-blur-md bg-[#060813]/80 border-b border-white/[0.08] transition-colors">
          <div className="px-4 sm:px-6 py-3.5 max-w-7xl mx-auto w-full flex items-center justify-between">
            {/* Brand Logo */}
            <a href="/" className="flex items-center gap-2.5 shrink-0 group">
              <img
                src="/vocabflow-logo-256.png"
                alt="VocabFlow"
                className="w-8 h-8 rounded-xl object-contain border border-white/15"
              />
              <div className="flex flex-col text-left">
                <span className="font-black text-lg bg-gradient-to-r from-blue-400 via-indigo-300 to-cyan-300 bg-clip-text text-transparent leading-snug">
                  VocabFlow
                </span>
                <span className="hidden sm:inline-block text-[10px] font-semibold text-slate-400 tracking-wider uppercase leading-none">
                  Smart Learning Platform
                </span>
              </div>
            </a>

            {/* Navigation Links */}
            <nav className="hidden lg:flex items-center gap-6 text-xs font-semibold text-slate-300">
              <a href="#quick-actions" className="hover:text-cyan-400 transition py-1">
                Lối Tắt Học Tập
              </a>
              <a href="#whats-new" className="hover:text-cyan-400 transition py-1">
                Có Gì Mới?
              </a>
              <a href="#learning-loop" className="hover:text-cyan-400 transition py-1 text-indigo-300 font-bold">
                Luồng Học Cốt Lõi
              </a>
              <a href="#quick-notes" className="hover:text-cyan-400 transition py-1">
                Bôi Đen & Ghi Chú
              </a>
              <a href="#community" className="hover:text-cyan-400 transition py-1">
                Cộng Đồng
              </a>
              <a href="#progress" className="hover:text-cyan-400 transition py-1">
                Tiến Độ
              </a>
            </nav>

            {/* Auth Actions */}
            <div className="flex items-center gap-3 shrink-0">
              <a
                href="https://app.vocalflow.site/login"
                className="whitespace-nowrap px-3 py-1.5 rounded-xl text-xs font-bold text-slate-200 hover:text-cyan-400 hover:bg-white/[0.06] transition"
              >
                Đăng nhập
              </a>
              <a
                href="https://app.vocalflow.site/dashboard"
                className="whitespace-nowrap btn-glass-primary !py-2 !px-4 text-xs font-bold flex items-center gap-1.5 shadow-md shadow-indigo-600/30"
              >
                <span>Bắt đầu học ngay</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </a>
            </div>
          </div>
        </header>

        {/* =========================================================================
            SECTION I & III: HERO SECTION (LIGHTWEIGHT, FAST, DIRECT)
            Answers:
            1. Tôi đang học gì? (Hệ thống đa ngôn ngữ & luyện thi TOEIC/IELTS chuẩn quốc tế)
            2. VocalFlow giúp tôi học như thế nào? (Luồng học tích hợp: Học -> Luyện -> Ghi chú -> Ôn ngắt quãng)
            3. Tính năng nào giúp tôi học nhanh hơn? (Quick Notes 1-click, Smart Learning, Test Bank chi tiết)
            ========================================================================= */}
        <section className="relative pt-12 sm:pt-16 pb-14 px-4 sm:px-6 max-w-7xl mx-auto w-full">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-8 items-center">
            {/* Left Column: Core Value Proposition */}
            <div className="lg:col-span-7 space-y-6 text-left" data-aos="fade-up">
              {/* Badge */}
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-indigo-500/10 border border-indigo-400/25 text-indigo-300 text-xs font-bold">
                <Sparkles className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                <span>Nền tảng học thông minh • Performance-First</span>
              </div>

              {/* Main Headline */}
              <div className="space-y-2">
                <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black tracking-tight text-white leading-tight">
                  Học ít hơn.
                  <br />
                  <span className="bg-gradient-to-r from-indigo-400 via-sky-300 to-emerald-300 bg-clip-text text-transparent">
                    Nhưng nhớ lâu hơn.
                  </span>
                </h1>
                <p className="text-base sm:text-lg text-slate-300 max-w-2xl leading-relaxed font-normal pt-1">
                  Từ vựng, flashcard, bài kiểm tra, cộng đồng và ghi chú trong cùng một luồng học liền mạch.
                  Không chuyển đổi qua lại giữa hàng tá ứng dụng rời rạc.
                </p>
              </div>

              {/* 3 Core Clarity Pillars */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
                <div className="p-3 rounded-2xl bg-white/[0.04] border border-white/[0.08]">
                  <span className="text-[10px] font-black uppercase text-indigo-400 block tracking-wider">
                    Bạn học gì?
                  </span>
                  <p className="text-xs font-bold text-white mt-0.5">
                    TOEIC, IELTS & 5 ngôn ngữ thực chiến
                  </p>
                </div>
                <div className="p-3 rounded-2xl bg-white/[0.04] border border-white/[0.08]">
                  <span className="text-[10px] font-black uppercase text-sky-400 block tracking-wider">
                    Học thế nào?
                  </span>
                  <p className="text-xs font-bold text-white mt-0.5">
                    Học → Luyện đề → Ghi chú 1 chạm → Ôn SRS
                  </p>
                </div>
                <div className="p-3 rounded-2xl bg-white/[0.04] border border-white/[0.08]">
                  <span className="text-[10px] font-black uppercase text-emerald-400 block tracking-wider">
                    Tăng tốc bằng gì?
                  </span>
                  <p className="text-xs font-bold text-white mt-0.5">
                    Bôi đen lưu note ngay & giải thích đề chi tiết
                  </p>
                </div>
              </div>

              {/* Primary & Secondary CTAs */}
              <div className="pt-3 flex flex-wrap items-center gap-3.5">
                <a
                  href="https://app.vocalflow.site/dashboard"
                  className="btn-glass-primary !py-3 !px-6 text-sm font-extrabold flex items-center gap-2 shadow-lg shadow-indigo-600/30 card-hover-smooth"
                >
                  <span>Bắt đầu học</span>
                  <ArrowRight className="w-4 h-4" />
                </a>

                <a
                  href="#whats-new"
                  className="btn-glass-secondary !py-3 !px-5 text-sm font-bold flex items-center gap-2 card-hover-smooth"
                >
                  <Compass className="w-4 h-4 text-slate-300" />
                  <span>Khám phá tính năng</span>
                </a>
              </div>
            </div>

            {/* Right Column: Lightweight Interactive Sample Card */}
            <div className="lg:col-span-5" data-aos="fade-up" data-aos-delay="100">
              <GlassSurface className="p-6 sm:p-7 border border-white/15 space-y-5">
                {/* Language Switcher Tabs */}
                <div className="flex items-center justify-between gap-1 p-1 rounded-2xl bg-slate-900/80 border border-white/10">
                  {(['en', 'ja', 'zh', 'ko', 'de'] as const).map((langId) => {
                    const sample = MULTI_LANG_SAMPLES[langId];
                    const isActive = selectedLang === langId;
                    return (
                      <button
                        key={langId}
                        onClick={() => setSelectedLang(langId)}
                        className={`flex-1 py-1.5 px-2 rounded-xl text-xs font-bold flex items-center justify-center gap-1 transition ${
                          isActive
                            ? 'bg-indigo-600 text-white shadow-sm'
                            : 'text-slate-400 hover:text-white hover:bg-white/[0.04]'
                        }`}
                      >
                        <span>{sample.flag}</span>
                        <span className="hidden sm:inline">{sample.langName}</span>
                      </button>
                    );
                  })}
                </div>

                {/* Card Word Header */}
                <div className="flex items-start justify-between gap-3 pt-1">
                  <div>
                    <span className="inline-block px-2.5 py-0.5 rounded-lg text-[10px] font-extrabold uppercase tracking-wider bg-indigo-500/20 text-indigo-300 border border-indigo-400/30 mb-1.5">
                      {currentSample.badge}
                    </span>
                    <h3 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
                      {currentSample.word}
                    </h3>
                    <p className="text-xs text-slate-400 font-mono mt-0.5">
                      {currentSample.pronunciation} • <span className="italic">{currentSample.pos}</span>
                    </p>
                  </div>

                  <button
                    onClick={() => handleSpeak(currentSample.word, currentSample.speechCode)}
                    disabled={isPlayingAudio}
                    className="p-2.5 rounded-2xl bg-indigo-600/30 hover:bg-indigo-600/50 text-indigo-300 border border-indigo-500/30 transition shrink-0"
                    title="Nghe phát âm chuẩn bản ngữ"
                  >
                    <Volume2 className={`w-4 h-4 ${isPlayingAudio ? 'animate-bounce text-cyan-400' : ''}`} />
                  </button>
                </div>

                {/* Meaning & Context */}
                <div className="space-y-2 p-3.5 rounded-2xl bg-slate-950/60 border border-white/[0.06] text-xs">
                  <p className="font-semibold text-slate-200 leading-relaxed">
                    {currentSample.meaning}
                  </p>
                  <p className="text-slate-400 italic leading-relaxed pt-1 border-t border-white/[0.06]">
                    {currentSample.example}
                  </p>
                </div>

                {/* Real Usage Stat Badge */}
                <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1">
                  <span className="flex items-center gap-1.5 text-emerald-400 font-bold">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>SRS Chu kỳ nhớ 3 ngày</span>
                  </span>
                  <span className="font-medium text-slate-400">{currentSample.statsLabel}</span>
                </div>
              </GlassSurface>
            </div>
          </div>
        </section>

        {/* =========================================================================
            SECTION IV: QUICK ACTIONS (5 COMPACT CARDS, TRANSLATEY -2PX)
            1. Học từ vựng
            2. Ôn Flashcard
            3. Làm bài kiểm tra
            4. Khám phá cộng đồng
            5. Ghi chú
            ========================================================================= */}
        <section id="quick-actions" className="py-10 px-4 sm:px-6 max-w-7xl mx-auto w-full border-t border-white/[0.06]">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3 mb-6" data-aos="fade-up">
            <div>
              <span className="text-[11px] font-black text-indigo-400 uppercase tracking-wider block">
                Truy Cập Nhanh
              </span>
              <h2 className="text-xl sm:text-2xl font-black text-white">
                5 Không Gian Học Tập Cốt Lõi
              </h2>
            </div>
            <p className="text-xs text-slate-400 max-w-md">
              Mỗi module được tối ưu cho một giai đoạn trong chu kỳ tiếp thu và ghi nhớ ngôn ngữ.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5" data-aos="fade-up">
            {/* Action 1 */}
            <a
              href="https://app.vocalflow.site/vocabulary"
              className="p-4 rounded-2xl bg-white/[0.04] hover:bg-white/[0.07] border border-white/[0.08] hover:border-indigo-400/40 card-hover-smooth flex flex-col justify-between group"
            >
              <div className="space-y-2">
                <div className="w-9 h-9 rounded-xl bg-indigo-500/20 text-indigo-400 flex items-center justify-center font-bold">
                  <BookOpen className="w-4 h-4" />
                </div>
                <h3 className="font-extrabold text-sm text-white group-hover:text-indigo-300 transition">
                  Học từ vựng
                </h3>
                <p className="text-[11px] text-slate-400 leading-snug">
                  Từ vựng theo chủ đề TOEIC, IELTS & khung CEFR A1-C2.
                </p>
              </div>
              <div className="pt-3 flex items-center gap-1 text-[11px] font-bold text-indigo-400">
                <span>Vào thư viện</span>
                <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
              </div>
            </a>

            {/* Action 2 */}
            <a
              href="https://app.vocalflow.site/review"
              className="p-4 rounded-2xl bg-white/[0.04] hover:bg-white/[0.07] border border-white/[0.08] hover:border-sky-400/40 card-hover-smooth flex flex-col justify-between group"
            >
              <div className="space-y-2">
                <div className="w-9 h-9 rounded-xl bg-sky-500/20 text-sky-400 flex items-center justify-center font-bold">
                  <Zap className="w-4 h-4" />
                </div>
                <h3 className="font-extrabold text-sm text-white group-hover:text-sky-300 transition">
                  Ôn Flashcard
                </h3>
                <p className="text-[11px] text-slate-400 leading-snug">
                  Thuật toán SRS lặp lại ngắt quãng cứu từ sắp quên.
                </p>
              </div>
              <div className="pt-3 flex items-center gap-1 text-[11px] font-bold text-sky-400">
                <span>Bắt đầu ôn</span>
                <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
              </div>
            </a>

            {/* Action 3 */}
            <a
              href="https://app.vocalflow.site/exams"
              className="p-4 rounded-2xl bg-white/[0.04] hover:bg-white/[0.07] border border-white/[0.08] hover:border-emerald-400/40 card-hover-smooth flex flex-col justify-between group"
            >
              <div className="space-y-2">
                <div className="w-9 h-9 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold">
                  <Award className="w-4 h-4" />
                </div>
                <h3 className="font-extrabold text-sm text-white group-hover:text-emerald-300 transition">
                  Làm bài kiểm tra
                </h3>
                <p className="text-[11px] text-slate-400 leading-snug">
                  Ngân hàng đề thi TOEIC chuẩn ETS, có giải thích từng câu.
                </p>
              </div>
              <div className="pt-3 flex items-center gap-1 text-[11px] font-bold text-emerald-400">
                <span>Vào phòng thi</span>
                <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
              </div>
            </a>

            {/* Action 4 */}
            <a
              href="https://app.vocalflow.site/community-knowledge"
              className="p-4 rounded-2xl bg-white/[0.04] hover:bg-white/[0.07] border border-white/[0.08] hover:border-purple-400/40 card-hover-smooth flex flex-col justify-between group"
            >
              <div className="space-y-2">
                <div className="w-9 h-9 rounded-xl bg-purple-500/20 text-purple-400 flex items-center justify-center font-bold">
                  <Users className="w-4 h-4" />
                </div>
                <h3 className="font-extrabold text-sm text-white group-hover:text-purple-300 transition">
                  Khám phá cộng đồng
                </h3>
                <p className="text-[11px] text-slate-400 leading-snug">
                  Bộ đề, kinh nghiệm và hỏi đáp do học viên cùng chia sẻ.
                </p>
              </div>
              <div className="pt-3 flex items-center gap-1 text-[11px] font-bold text-purple-400">
                <span>Xem bảng tin</span>
                <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
              </div>
            </a>

            {/* Action 5 */}
            <a
              href="https://app.vocalflow.site/notes"
              className="p-4 rounded-2xl bg-white/[0.04] hover:bg-white/[0.07] border border-white/[0.08] hover:border-amber-400/40 card-hover-smooth flex flex-col justify-between group"
            >
              <div className="space-y-2">
                <div className="w-9 h-9 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center font-bold">
                  <FileText className="w-4 h-4" />
                </div>
                <h3 className="font-extrabold text-sm text-white group-hover:text-amber-300 transition">
                  Ghi chú cá nhân
                </h3>
                <p className="text-[11px] text-slate-400 leading-snug">
                  Ghi chú gắn nguồn gốc từ đề thi & bài viết cộng đồng.
                </p>
              </div>
              <div className="pt-3 flex items-center gap-1 text-[11px] font-bold text-amber-400">
                <span>Mở sổ ghi chú</span>
                <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
              </div>
            </a>
          </div>
        </section>

        {/* =========================================================================
            SECTION V: WHAT'S NEW ("CÓ GÌ MỚI?")
            Real features only:
            - Smart Learning
            - Test Bank
            - Community
            - Quick Notes (Bôi đen & lưu note)
            - Learning Progress
            ========================================================================= */}
        <section id="whats-new" className="py-14 px-4 sm:px-6 max-w-7xl mx-auto w-full border-t border-white/[0.06]">
          <div className="space-y-3 mb-10 text-left" data-aos="fade-up">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-400/25 text-cyan-300 text-xs font-bold">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Nâng Cấp Mới Thực Tế</span>
            </span>
            <h2 className="text-2xl sm:text-4xl font-black text-white tracking-tight">
              Có gì mới trên VocabFlow?
            </h2>
            <p className="text-xs sm:text-sm text-slate-400 max-w-2xl">
              Hệ thống được thiết kế lại xoay quanh tính hiệu quả trong từng phút học thực tế của bạn.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5" data-aos="fade-up">
            {/* Feature 1: Smart Learning */}
            <div className="p-6 rounded-3xl bg-slate-900/60 border border-white/[0.08] hover:border-indigo-400/30 card-hover-smooth space-y-4">
              <div className="w-10 h-10 rounded-2xl bg-indigo-600/20 text-indigo-400 flex items-center justify-center font-black">
                <Brain className="w-5 h-5" />
              </div>
              <div className="space-y-1">
                <span className="text-[10px] font-black uppercase text-indigo-400 tracking-wider">
                  Trí Tuệ Nhân Tạo & SRS
                </span>
                <h3 className="text-lg font-black text-white">Smart Learning</h3>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed">
                Tự động tính toán xác suất quên của từng từ dựa trên lịch sử phản xạ thực tế.
                Chỉ ôn đúng từ cần ôn, tiết kiệm 70% thời gian so với học thụ động.
              </p>
              <div className="pt-2 text-[11px] font-semibold text-slate-400 flex items-center gap-1.5">
                <Check className="w-3.5 h-3.5 text-emerald-400" />
                <span>Memory Rescue cảnh báo từ nguy cơ</span>
              </div>
            </div>

            {/* Feature 2: Test Bank */}
            <div className="p-6 rounded-3xl bg-slate-900/60 border border-white/[0.08] hover:border-emerald-400/30 card-hover-smooth space-y-4">
              <div className="w-10 h-10 rounded-2xl bg-emerald-600/20 text-emerald-400 flex items-center justify-center font-black">
                <Award className="w-5 h-5" />
              </div>
              <div className="space-y-1">
                <span className="text-[10px] font-black uppercase text-emerald-400 tracking-wider">
                  Đề Thi Chuẩn ETS
                </span>
                <h3 className="text-lg font-black text-white">Test Bank Toàn Diện</h3>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed">
                Làm bài kiểm tra có bấm giờ, chấm điểm tự động và xem ngay giải thích chi tiết
                từng đáp án A, B, C, D cùng phân tích ngữ pháp liên quan.
              </p>
              <div className="pt-2 text-[11px] font-semibold text-slate-400 flex items-center gap-1.5">
                <Check className="w-3.5 h-3.5 text-emerald-400" />
                <span>Chế độ ôn riêng các câu làm sai</span>
              </div>
            </div>

            {/* Feature 3: Community */}
            <div className="p-6 rounded-3xl bg-slate-900/60 border border-white/[0.08] hover:border-purple-400/30 card-hover-smooth space-y-4">
              <div className="w-10 h-10 rounded-2xl bg-purple-600/20 text-purple-400 flex items-center justify-center font-black">
                <Users className="w-5 h-5" />
              </div>
              <div className="space-y-1">
                <span className="text-[10px] font-black uppercase text-purple-400 tracking-wider">
                  Tri Thức Mở
                </span>
                <h3 className="text-lg font-black text-white">Cộng Đồng Học Tập</h3>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed">
                Khám phá các bài phân tích đề, mẹo tránh bẫy Part 5 & 7 và bài giảng chất lượng
                được chia sẻ bởi giảng viên và các học viên điểm cao.
              </p>
              <div className="pt-2 text-[11px] font-semibold text-slate-400 flex items-center gap-1.5">
                <Check className="w-3.5 h-3.5 text-emerald-400" />
                <span>Thảo luận, lưu trữ và tương tác 2 chiều</span>
              </div>
            </div>

            {/* Feature 4: Quick Notes */}
            <div className="p-6 rounded-3xl bg-slate-900/60 border border-white/[0.08] hover:border-amber-400/30 card-hover-smooth space-y-4">
              <div className="w-10 h-10 rounded-2xl bg-amber-600/20 text-amber-400 flex items-center justify-center font-black">
                <MousePointerClick className="w-5 h-5" />
              </div>
              <div className="space-y-1">
                <span className="text-[10px] font-black uppercase text-amber-400 tracking-wider">
                  Tính Năng Mới Đột Phá
                </span>
                <h3 className="text-lg font-black text-white">Quick Notes 1-Click</h3>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed">
                Bôi đen bất kỳ cụm từ hay câu nào trong đề thi hoặc bài viết cộng đồng → thanh
                công cụ nổi tức thì xuất hiện để lưu thẳng vào sổ ghi chép có gắn nguồn.
              </p>
              <div className="pt-2 text-[11px] font-semibold text-slate-400 flex items-center gap-1.5">
                <Check className="w-3.5 h-3.5 text-emerald-400" />
                <span>Tự động liên kết nguồn đề và câu hỏi</span>
              </div>
            </div>

            {/* Feature 5: Learning Progress */}
            <div className="p-6 rounded-3xl bg-slate-900/60 border border-white/[0.08] hover:border-sky-400/30 card-hover-smooth space-y-4">
              <div className="w-10 h-10 rounded-2xl bg-sky-600/20 text-sky-400 flex items-center justify-center font-black">
                <TrendingUp className="w-5 h-5" />
              </div>
              <div className="space-y-1">
                <span className="text-[10px] font-black uppercase text-sky-400 tracking-wider">
                  Phân Tích Dữ Liệu
                </span>
                <h3 className="text-lg font-black text-white">Tiến Độ Chuẩn CEFR</h3>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed">
                Biết chính xác bạn đang ở đâu trên thang đo A1 đến C2. Xem biểu đồ độ bền trí nhớ,
                tính đều đặn của chuỗi Streak và tốc độ phản xạ.
              </p>
              <div className="pt-2 text-[11px] font-semibold text-slate-400 flex items-center gap-1.5">
                <Check className="w-3.5 h-3.5 text-emerald-400" />
                <span>Dự báo số lượng từ vựng cần ôn mỗi ngày</span>
              </div>
            </div>

            {/* Feature 6: Admin Quotas & Limits */}
            <div className="p-6 rounded-3xl bg-slate-900/60 border border-white/[0.08] hover:border-rose-400/30 card-hover-smooth space-y-4">
              <div className="w-10 h-10 rounded-2xl bg-rose-600/20 text-rose-400 flex items-center justify-center font-black">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div className="space-y-1">
                <span className="text-[10px] font-black uppercase text-rose-400 tracking-wider">
                  Bảo Vệ Tài Nguyên
                </span>
                <h3 className="text-lg font-black text-white">Quota Enforced</h3>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed">
                Hệ thống hạn mức ghi chú và tính năng được cấu hình động theo Role/Plan từ Admin,
                thực thi giao dịch phân tán backend chống trùng lặp và race condition.
              </p>
              <div className="pt-2 text-[11px] font-semibold text-slate-400 flex items-center gap-1.5">
                <Check className="w-3.5 h-3.5 text-emerald-400" />
                <span>Hiển thị trực quan quota trên Student Dashboard</span>
              </div>
            </div>
          </div>
        </section>

        {/* =========================================================================
            SECTION VI: CORE LEARNING LOOP (LUỒNG HỌC CỐT LÕI)
            Học → Luyện đề → Phát hiện điều chưa hiểu → Bôi đen → Thêm vào ghi chú → Ôn lại
            ========================================================================= */}
        <section id="learning-loop" className="py-14 px-4 sm:px-6 max-w-7xl mx-auto w-full border-t border-white/[0.06]">
          <div className="text-center max-w-2xl mx-auto space-y-3 mb-12" data-aos="fade-up">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-400/25 text-indigo-300 text-xs font-bold">
              <Brain className="w-3.5 h-3.5" />
              <span>Quy Trình Học Tập Khép Kín</span>
            </span>
            <h2 className="text-2xl sm:text-4xl font-black text-white tracking-tight">
              Luồng Học Cốt Lõi Tại VocabFlow
            </h2>
            <p className="text-xs sm:text-sm text-slate-400">
              Không học vẹt rời rạc. Mỗi lỗ hổng kiến thức phát hiện khi làm bài đều được
              đưa ngay vào chu trình ghi nhớ dài hạn.
            </p>
          </div>

          {/* Interactive Steps Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-3" data-aos="fade-up">
            {[
              {
                step: 1,
                title: 'Học',
                desc: 'Nắm từ vựng & cấu trúc ngữ pháp',
                icon: BookOpen,
                color: 'text-indigo-400',
                bg: 'bg-indigo-500/15',
              },
              {
                step: 2,
                title: 'Luyện',
                desc: 'Làm đề thi thử bấm giờ thực tế',
                icon: Award,
                color: 'text-sky-400',
                bg: 'bg-sky-500/15',
              },
              {
                step: 3,
                title: 'Phát hiện',
                desc: 'Nhận ra câu sai & cụm từ chưa hiểu',
                icon: HelpCircle,
                color: 'text-amber-400',
                bg: 'bg-amber-500/15',
              },
              {
                step: 4,
                title: 'Bôi đen',
                desc: 'Chọn text ngay trên bài thi',
                icon: MousePointerClick,
                color: 'text-rose-400',
                bg: 'bg-rose-500/15',
              },
              {
                step: 5,
                title: 'Thêm note',
                desc: 'Lưu 1-click có gắn nguồn gốc đề',
                icon: FileText,
                color: 'text-purple-400',
                bg: 'bg-purple-500/15',
              },
              {
                step: 6,
                title: 'Ôn lại',
                desc: 'SRS ngắt quãng khóa vào trí nhớ',
                icon: TrendingUp,
                color: 'text-emerald-400',
                bg: 'bg-emerald-500/15',
              },
            ].map((item) => {
              const Icon = item.icon;
              const isActive = activeLoopStep === item.step;
              return (
                <div
                  key={item.step}
                  onClick={() => setActiveLoopStep(item.step)}
                  className={`p-4 rounded-2xl border transition-all cursor-pointer card-hover-smooth flex flex-col justify-between ${
                    isActive
                      ? 'bg-slate-800/90 border-indigo-400 shadow-md shadow-indigo-500/10'
                      : 'bg-white/[0.03] border-white/[0.08] hover:border-white/20'
                  }`}
                >
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-black uppercase text-slate-500">
                        Bước {item.step}
                      </span>
                      <div className={`w-7 h-7 rounded-xl ${item.bg} ${item.color} flex items-center justify-center`}>
                        <Icon className="w-3.5 h-3.5" />
                      </div>
                    </div>
                    <div>
                      <h4 className="font-extrabold text-sm text-white">{item.title}</h4>
                      <p className="text-[11px] text-slate-400 mt-1 leading-snug">{item.desc}</p>
                    </div>
                  </div>
                  {isActive && (
                    <div className="mt-3 pt-2 border-t border-white/10 flex items-center gap-1 text-[10px] font-bold text-indigo-300">
                      <Check className="w-3 h-3 text-indigo-400" />
                      <span>Đang chọn</span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </section>

        {/* =========================================================================
            SECTION VII: TEXT SELECTION & "THÊM VÀO GHI CHÚ" SHOWCASE
            Demonstrates: Bôi đen text trong Test và Community → Floating toolbar xuất hiện
            ========================================================================= */}
        <section id="quick-notes" className="py-14 px-4 sm:px-6 max-w-7xl mx-auto w-full border-t border-white/[0.06]">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            {/* Left: Explanation */}
            <div className="lg:col-span-6 space-y-5 text-left" data-aos="fade-up">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-400/25 text-amber-300 text-xs font-bold">
                <MousePointerClick className="w-3.5 h-3.5" />
                <span>Trải Nghiệm Độc Quyền</span>
              </span>

              <h2 className="text-2xl sm:text-4xl font-black text-white tracking-tight leading-tight">
                Bôi đen bất kỳ đâu.
                <br />
                <span className="bg-gradient-to-r from-amber-300 via-rose-300 to-indigo-300 bg-clip-text text-transparent">
                  Lưu vào ghi chú tức thì.
                </span>
              </h2>

              <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                Khi làm bài kiểm tra hoặc đọc bài giảng trong cộng đồng, chỉ cần dùng chuột bôi đen
                cụm từ bạn muốn lưu. Thanh công cụ nổi thông minh sẽ xuất hiện ngay phía trên
                đoạn text được chọn.
              </p>

              <div className="space-y-3 pt-2">
                <div className="flex items-start gap-3 p-3 rounded-2xl bg-white/[0.03] border border-white/[0.08]">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  <div>
                    <span className="text-xs font-bold text-white block">Tự động giữ nguồn tài liệu</span>
                    <span className="text-[11px] text-slate-400">
                      Ghi chú ghi nhớ chính xác nó đến từ Bài thi số mấy, Câu hỏi nào hay Bài viết cộng đồng nào.
                    </span>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-3 rounded-2xl bg-white/[0.03] border border-white/[0.08]">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  <div>
                    <span className="text-xs font-bold text-white block">Chống trùng lặp thông minh</span>
                    <span className="text-[11px] text-slate-400">
                      Không tạo spam ghi chú trùng lặp nếu bạn bôi đen lại cùng một nội dung từ cùng nguồn.
                    </span>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-3 rounded-2xl bg-white/[0.03] border border-white/[0.08]">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  <div>
                    <span className="text-xs font-bold text-white block">Kiểm soát hạn mức theo Role</span>
                    <span className="text-[11px] text-slate-400">
                      Admin cấu hình hạn mức linh hoạt cho từng gói, backend bảo vệ bằng database transaction.
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Right: Interactive Visual Simulation */}
            <div className="lg:col-span-6" data-aos="fade-up" data-aos-delay="100">
              <div className="p-6 rounded-3xl bg-slate-900 border border-white/15 space-y-4 shadow-xl">
                {/* Simulated Test Question Header */}
                <div className="flex items-center justify-between pb-3 border-b border-white/10 text-xs">
                  <div className="flex items-center gap-2">
                    <span className="px-2.5 py-0.5 rounded-lg bg-indigo-600 text-white font-black text-[11px]">
                      Câu 24 • TOEIC Part 5
                    </span>
                    <span className="text-slate-400 font-semibold">Incomplete Sentences</span>
                  </div>
                  <span className="text-[11px] font-bold text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-md border border-amber-500/20">
                    Mô phỏng thực tế
                  </span>
                </div>

                {/* Question Text with Simulated Selection */}
                <div className="p-4 rounded-2xl bg-slate-950/80 border border-white/[0.08] relative">
                  {/* Floating Action Tooltip Simulator */}
                  <div className="absolute -top-4 left-24 z-20 animate-fade-in">
                    <button
                      onClick={() => {
                        setDemoSavedToNotes(true);
                        setTimeout(() => setDemoSavedToNotes(false), 3000);
                      }}
                      className="px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-extrabold shadow-lg shadow-indigo-600/40 flex items-center gap-1.5 transition active:scale-95"
                    >
                      <FileText className="w-3.5 h-3.5" />
                      <span>{demoSavedToNotes ? '✓ Đã lưu vào ghi chú!' : 'Thêm vào ghi chú'}</span>
                    </button>
                  </div>

                  <p className="text-sm font-semibold text-slate-300 leading-relaxed select-text">
                    "The project director promised to{' '}
                    <span className="bg-indigo-600/40 text-white px-1.5 py-0.5 rounded border border-indigo-500/60 font-bold">
                      {demoSelectedText}
                    </span>{' '}
                    for resolving any unforeseen discrepancies in the quarterly budget."
                  </p>
                </div>

                {/* Explanation Area */}
                <div className="p-3.5 rounded-2xl bg-indigo-950/30 border border-indigo-800/40 space-y-1 text-xs text-slate-300">
                  <div className="flex items-center gap-1.5 font-bold text-indigo-400">
                    <HelpCircle className="w-3.5 h-3.5" />
                    <span>Giải thích:</span>
                  </div>
                  <p className="leading-relaxed">
                    Cụm cố định: <strong className="text-white">take responsibility for something</strong> (chịu trách nhiệm về điều gì).
                    Cần một trạng từ 'immediate' bổ nghĩa để tạo nghĩa 'chịu trách nhiệm ngay lập tức'.
                  </p>
                </div>

                {/* Saved Note Card Feedback */}
                <div className="p-3 rounded-2xl bg-white/[0.04] border border-white/10 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <FileText className="w-4 h-4 text-indigo-400 shrink-0" />
                    <div>
                      <span className="font-bold text-white block">Sổ ghi chú đã liên kết:</span>
                      <span className="text-[11px] text-slate-400">
                        Nguồn: Đề thi TOEIC ETS #4 → Part 5 → Câu 24
                      </span>
                    </div>
                  </div>
                  <a
                    href="https://app.vocalflow.site/notes"
                    className="px-2.5 py-1 rounded-xl bg-indigo-600/20 hover:bg-indigo-600/40 text-indigo-300 font-bold text-[11px] border border-indigo-500/30 transition"
                  >
                    Xem ghi chú
                  </a>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* =========================================================================
            SECTION VIII: LEARNING PROGRESS & ANALYTICS SHOWCASE
            ========================================================================= */}
        <section id="progress" className="py-14 px-4 sm:px-6 max-w-7xl mx-auto w-full border-t border-white/[0.06]">
          <div className="text-center max-w-2xl mx-auto space-y-3 mb-10" data-aos="fade-up">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-400/25 text-emerald-300 text-xs font-bold">
              <TrendingUp className="w-3.5 h-3.5" />
              <span>Đo Lường Trực Quan</span>
            </span>
            <h2 className="text-2xl sm:text-4xl font-black text-white tracking-tight">
              Biết Bạn Đang Ở Đâu & Cần Cải Thiện Gì
            </h2>
            <p className="text-xs sm:text-sm text-slate-400">
              Không còn mơ hồ về năng lực. Bảng thống kê hiển thị thời gian học, độ bền trí nhớ và mức độ làm chủ từng cấp độ.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4" data-aos="fade-up">
            {/* Metric 1 */}
            <div className="p-6 rounded-3xl bg-slate-900/60 border border-white/[0.08] space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-black uppercase text-slate-400">Độ Bền Trí Nhớ (SRS)</span>
                <span className="text-xs font-extrabold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                  Tối ưu
                </span>
              </div>
              <p className="text-3xl font-black text-white">88.4%</p>
              <div className="w-full h-2 rounded-full bg-slate-800 overflow-hidden">
                <div className="h-full bg-emerald-500 rounded-full" style={{ width: '88%' }} />
              </div>
              <p className="text-[11px] text-slate-400">
                Xác suất gợi nhớ từ vựng chính xác khi gặp lại trong bài đọc/nghe thực tế.
              </p>
            </div>

            {/* Metric 2 */}
            <div className="p-6 rounded-3xl bg-slate-900/60 border border-white/[0.08] space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-black uppercase text-slate-400">Chuỗi Ngày Học (Streak)</span>
                <span className="text-xs font-extrabold text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-full border border-amber-500/20">
                  Đều đặn
                </span>
              </div>
              <p className="text-3xl font-black text-white">14 Ngày</p>
              <div className="w-full h-2 rounded-full bg-slate-800 overflow-hidden">
                <div className="h-full bg-amber-500 rounded-full" style={{ width: '92%' }} />
              </div>
              <p className="text-[11px] text-slate-400">
                Duy trì thói quen học ngắt quãng 10-15 phút mỗi ngày thay vì nhồi nhét.
              </p>
            </div>

            {/* Metric 3 */}
            <div className="p-6 rounded-3xl bg-slate-900/60 border border-white/[0.08] space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-black uppercase text-slate-400">Độ Phủ CEFR B1 - C1</span>
                <span className="text-xs font-extrabold text-indigo-400 bg-indigo-500/10 px-2 py-0.5 rounded-full border border-indigo-500/20">
                  Chuẩn hóa
                </span>
              </div>
              <p className="text-3xl font-black text-white">1,420 Từ</p>
              <div className="w-full h-2 rounded-full bg-slate-800 overflow-hidden">
                <div className="h-full bg-indigo-500 rounded-full" style={{ width: '76%' }} />
              </div>
              <p className="text-[11px] text-slate-400">
                Đã thành thạo 76% lượng từ vựng cốt lõi thường xuất hiện trong đề thi TOEIC 750+.
              </p>
            </div>
          </div>
        </section>

        {/* =========================================================================
            SECTION IX: FINAL CTA
            ========================================================================= */}
        <section className="py-16 px-4 sm:px-6 max-w-5xl mx-auto w-full text-center" data-aos="fade-up">
          <div className="p-8 sm:p-12 rounded-3xl bg-gradient-to-br from-indigo-900/50 via-slate-900 to-slate-950 border border-indigo-500/30 space-y-6 shadow-2xl relative overflow-hidden">
            <div className="space-y-3 relative z-10 max-w-xl mx-auto">
              <h2 className="text-2xl sm:text-4xl font-black text-white tracking-tight">
                Sẵn sàng bứt phá mục tiêu ngôn ngữ của bạn?
              </h2>
              <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                Tham gia cùng hàng ngàn học viên đang sử dụng VocabFlow để học thông minh hơn,
                làm đề thực chiến và lưu ghi chép 1 chạm mỗi ngày.
              </p>
            </div>

            <div className="flex flex-wrap items-center justify-center gap-3.5 relative z-10 pt-2">
              <a
                href="https://app.vocalflow.site/dashboard"
                className="btn-glass-primary !py-3 !px-7 text-sm font-extrabold flex items-center gap-2 shadow-lg shadow-indigo-600/40 card-hover-smooth"
              >
                <span>Bắt đầu học miễn phí</span>
                <ArrowRight className="w-4 h-4" />
              </a>

              <a
                href="https://app.vocalflow.site/login"
                className="btn-glass-secondary !py-3 !px-6 text-sm font-bold card-hover-smooth"
              >
                Đăng nhập tài khoản
              </a>
            </div>
          </div>
        </section>

        {/* Footer */}
        <footer className="mt-auto py-8 px-4 sm:px-6 border-t border-white/[0.08] text-xs text-slate-500">
          <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <img
                src="/vocabflow-logo-256.png"
                alt="VocabFlow"
                className="w-5 h-5 rounded-md object-contain opacity-80"
              />
              <span className="font-bold text-slate-400">VocabFlow</span>
              <span>• Nền tảng học đa ngôn ngữ & flashcard thông minh</span>
            </div>

            <div className="flex items-center gap-5 text-slate-400 font-medium">
              <a href="https://app.vocalflow.site/vocabulary" className="hover:text-white transition">
                Từ vựng
              </a>
              <a href="https://app.vocalflow.site/exams" className="hover:text-white transition">
                Ngân hàng đề
              </a>
              <a href="https://app.vocalflow.site/community-knowledge" className="hover:text-white transition">
                Cộng đồng
              </a>
              <a href="https://app.vocalflow.site/notes" className="hover:text-white transition">
                Ghi chú
              </a>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
};

export default App;
