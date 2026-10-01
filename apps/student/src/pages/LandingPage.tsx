import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Sparkles,
  Brain,
  Volume2,
  ArrowRight,
  BookOpen,
  Zap,
  CheckCircle2,
  TrendingUp,
  Award,
  ShieldCheck,
  MessageSquare,
  Users,
  Flame,
  Menu,
  X,
  ChevronDown,
  Star,
  Compass,
  Play,
  Check
} from 'lucide-react';
import { LiquidBackground } from '../components/common/LiquidBackground';
import { SplashCursor } from '../components/reactbits/SplashCursor';
import { GlassSurface } from '../components/reactbits/GlassSurface';

interface Testimonial {
  name: string;
  role: string;
  score: string;
  badge: string;
  content: string;
  avatar: string;
  stars: number;
}

const TESTIMONIALS: Testimonial[] = [
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
];

export const LandingPage: React.FC = () => {
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [activeFSRSRating, setActiveFSRSRating] = useState<number | null>(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [activeFaq, setActiveFaq] = useState<number | null>(0);

  // Auto-scroll to top when page mounts
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' as any });
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
    <div className="relative min-h-screen text-slate-100 flex flex-col overflow-x-hidden selection:bg-indigo-600 selection:text-white bg-[#050713]">
      {/* 1. React Bits Splash Cursor (Fluid WebGL simulation following pointer) */}
      <SplashCursor
        SIM_RESOLUTION={128}
        DYE_RESOLUTION={1024}
        DENSITY_DISSIPATION={2.8}
        VELOCITY_DISSIPATION={1.8}
        PRESSURE={0.12}
        CURL={4.5}
        SPLAT_RADIUS={0.22}
        SPLAT_FORCE={5500}
        RAINBOW_MODE={true}
      />

      {/* 2. Ambient Dynamic Space Liquid Background with Grid and Pastel Gradients */}
      <LiquidBackground />

      {/* 3. Redesigned Non-Cramped Spacious Floating Navbar */}
      <header className="sticky top-0 z-40 backdrop-blur-2xl bg-[#060813]/80 border-b border-white/[0.08] transition-all duration-300">
        <div className="max-w-7xl mx-auto w-full px-6 sm:px-10 py-4 sm:py-5 flex items-center justify-between gap-6">
          {/* Brand Logo & Version Pill with Generous Margin */}
          <Link to="/" className="flex items-center gap-3.5 shrink-0 group">
            <img
              src="/vocabflow-logo-256.png"
              alt="VocabFlow"
              className="w-10 h-10 rounded-2xl object-contain shadow-lg shadow-indigo-500/20 group-hover:scale-105 transition-transform"
            />
            <div className="flex flex-col text-left">
              <div className="flex items-center gap-2.5">
                <span className="font-black text-xl sm:text-2xl bg-gradient-to-r from-sky-400 via-indigo-300 to-violet-400 bg-clip-text text-transparent leading-none">
                  VocabFlow
                </span>
                <span className="text-[10px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-indigo-500/20 border border-indigo-400/30 text-indigo-300">
                  v5.0 FSRS
                </span>
              </div>
              <span className="text-[10.5px] font-semibold text-slate-400 tracking-wider uppercase mt-1 leading-none">
                Cognitive 5D Spaced Repetition
              </span>
            </div>
          </Link>

          {/* Spacious Desktop Navigation Items (Breathable Spacing: gap-8 to gap-10) */}
          <nav className="hidden xl:flex items-center gap-8 2xl:gap-10 text-sm font-semibold text-slate-300">
            <a
              href="#features-5d"
              className="py-2 px-3 rounded-xl hover:text-cyan-400 hover:bg-white/[0.04] transition-all"
            >
              Động Cơ 5D
            </a>
            <a
              href="#features-toeic"
              className="py-2 px-3 rounded-xl hover:text-cyan-400 hover:bg-white/[0.04] transition-all"
            >
              Kho Từ TOEIC
            </a>
            <a
              href="#features-ai"
              className="py-2 px-3 rounded-xl hover:text-cyan-400 hover:bg-white/[0.04] transition-all"
            >
              AI Coach & PvP
            </a>
            <a
              href="#ecosystem"
              className="py-2 px-3 rounded-xl hover:text-cyan-400 hover:bg-white/[0.04] transition-all"
            >
              Hệ Sinh Thái
            </a>
            <a
              href="#reviews"
              className="py-2 px-3 rounded-xl hover:text-cyan-400 hover:bg-white/[0.04] transition-all"
            >
              Đánh Giá
            </a>
            <a
              href="#pricing"
              className="py-2 px-3 rounded-xl hover:text-cyan-400 hover:bg-white/[0.04] transition-all"
            >
              Bảng Giá
            </a>
            <a
              href="https://kid.vocalflow.site"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 text-amber-400 hover:text-amber-300 py-1.5 px-3.5 rounded-full bg-amber-500/10 border border-amber-500/25 transition-all text-xs font-bold"
            >
              <span>🦁</span> Thế Giới Bé
            </a>
          </nav>

          {/* Spacious Auth & CTA Action Buttons */}
          <div className="hidden sm:flex items-center gap-4 shrink-0">
            <Link
              to="/login"
              className="px-5 py-2.5 rounded-xl text-sm font-bold text-slate-300 hover:text-white hover:bg-slate-800/80 transition-all border border-transparent hover:border-slate-700/60"
            >
              Đăng nhập
            </Link>
            <Link
              to="/dashboard"
              className="btn-glass-primary !py-2.5 !px-6 text-sm font-bold flex items-center gap-2 shadow-lg shadow-indigo-500/20"
            >
              <span>Vào học ngay</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          {/* Mobile Menu Hamburger Toggle */}
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="xl:hidden p-2.5 rounded-xl bg-slate-800/80 border border-white/[0.08] text-slate-300 hover:text-white transition-colors"
            aria-label="Toggle Navigation Menu"
          >
            {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>

        {/* Spacious Mobile Dropdown Glass Menu */}
        {isMobileMenuOpen && (
          <div className="xl:hidden px-6 py-6 border-t border-white/[0.08] bg-[#060813]/95 backdrop-blur-2xl flex flex-col gap-4 text-base font-semibold">
            <a
              href="#features-5d"
              onClick={() => setIsMobileMenuOpen(false)}
              className="py-2.5 px-3 rounded-xl hover:bg-white/[0.05] text-slate-200 hover:text-cyan-400 transition"
            >
              Động Cơ 5D FSRS
            </a>
            <a
              href="#features-toeic"
              onClick={() => setIsMobileMenuOpen(false)}
              className="py-2.5 px-3 rounded-xl hover:bg-white/[0.05] text-slate-200 hover:text-cyan-400 transition"
            >
              Kho 600+ Từ TOEIC
            </a>
            <a
              href="#features-ai"
              onClick={() => setIsMobileMenuOpen(false)}
              className="py-2.5 px-3 rounded-xl hover:bg-white/[0.05] text-slate-200 hover:text-cyan-400 transition"
            >
              Gia Sư AI Coach & PvP
            </a>
            <a
              href="#ecosystem"
              onClick={() => setIsMobileMenuOpen(false)}
              className="py-2.5 px-3 rounded-xl hover:bg-white/[0.05] text-slate-200 hover:text-cyan-400 transition"
            >
              Hệ Sinh Thái Ôn Luyện
            </a>
            <a
              href="#reviews"
              onClick={() => setIsMobileMenuOpen(false)}
              className="py-2.5 px-3 rounded-xl hover:bg-white/[0.05] text-slate-200 hover:text-cyan-400 transition"
            >
              Cảm Nhận Học Viên
            </a>
            <a
              href="#pricing"
              onClick={() => setIsMobileMenuOpen(false)}
              className="py-2.5 px-3 rounded-xl hover:bg-white/[0.05] text-slate-200 hover:text-cyan-400 transition"
            >
              Bảng Giá & Gói VIP
            </a>
            <a
              href="https://kid.vocalflow.site"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 py-2.5 px-3 rounded-xl text-amber-400 hover:bg-amber-500/10 transition"
            >
              <span>🦁</span> Thế Giới Bé (Kid Portal)
            </a>
            <div className="pt-4 border-t border-white/[0.08] flex flex-col gap-3">
              <Link
                to="/login"
                onClick={() => setIsMobileMenuOpen(false)}
                className="w-full text-center py-3 rounded-xl font-bold text-slate-200 bg-slate-800/80 border border-white/[0.08]"
              >
                Đăng nhập
              </Link>
              <Link
                to="/dashboard"
                onClick={() => setIsMobileMenuOpen(false)}
                className="w-full text-center py-3 rounded-xl font-bold btn-glass-primary flex items-center justify-center gap-2"
              >
                <span>Vào học ngay</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        )}
      </header>

      {/* 4. Hero Section */}
      <section className="relative pt-16 sm:pt-24 pb-20 px-6 sm:px-10 max-w-7xl mx-auto w-full flex flex-col items-center text-center">
        {/* Luminous Top Pill Badge */}
        <div className="inline-flex items-center gap-2.5 px-5 py-2.5 rounded-full bg-indigo-500/10 border border-indigo-400/30 text-indigo-300 text-xs sm:text-sm font-bold mb-8 backdrop-blur-xl shadow-lg shadow-indigo-500/10">
          <span className="flex h-2.5 w-2.5 relative">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-cyan-500"></span>
          </span>
          <span>Chuẩn Mực Học Tập Mới 2026 • FSRS v5 & LexiMind™ Cognitive 5D Engine</span>
        </div>

        {/* Hero Title */}
        <h1 className="text-4xl sm:text-6xl md:text-7xl lg:text-8xl font-black tracking-tight leading-[1.18] sm:leading-[1.12] mb-6 max-w-5xl text-white">
          Học ít từ hơn. <br />
          <span className="bg-gradient-to-r from-sky-400 via-indigo-300 to-cyan-300 bg-clip-text text-transparent">
            Ghi nhớ trọn đời.
          </span>
        </h1>

        {/* Hero Subtitle */}
        <p className="text-base sm:text-xl text-slate-300 max-w-3xl mx-auto mb-10 leading-relaxed font-normal">
          Xóa bỏ cách lật flashcard máy móc. VocabFlow ứng dụng thuật toán{' '}
          <strong className="text-white font-bold">FSRS v5</strong> đo lường độ bền trí nhớ, tự động phát hiện lỗ hổng nhận thức và nhắc nhở đúng{' '}
          <span className="text-cyan-400 font-bold underline decoration-cyan-500/50 underline-offset-4">
            thời điểm vàng
          </span>{' '}
          trước khi não bộ quên từ vựng.
        </p>

        {/* Hero Action Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 w-full sm:w-auto mb-16">
          <Link
            to="/review"
            className="btn-glass-primary w-full sm:w-auto !py-4 !px-8 text-base gap-3"
          >
            <Sparkles className="w-5 h-5 fill-white/90" />
            <span>Trải nghiệm Smart Review</span>
            <ArrowRight className="w-4 h-4" />
          </Link>

          <Link
            to="/placement-test"
            className="btn-glass-secondary w-full sm:w-auto !py-4 !px-7 text-base gap-2.5"
          >
            <Zap className="w-5 h-5 text-amber-400" />
            <span>Test Trình Độ (3 Phút)</span>
          </Link>

          <Link
            to="/vocabulary"
            className="btn-glass-secondary w-full sm:w-auto !py-4 !px-7 text-base gap-2.5"
          >
            <BookOpen className="w-5 h-5 text-indigo-400" />
            <span>Kho 600+ Từ TOEIC</span>
          </Link>
        </div>

        {/* Interactive Live Card Preview Showcase Wrapped in React Bits GlassSurface */}
        <div className="w-full max-w-2xl mx-auto mb-20">
          <GlassSurface
            borderRadius={28}
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
                    Mô Phỏng Thẻ Học Trí Tuệ 5D LexiMind™
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
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">
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
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-6">
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
                      <strong className="text-emerald-400 font-bold">AI Insight:</strong> Xuất hiện trong 42% đề đọc TOEIC Part 5 & 7 (Chủ đề Business Facility).
                    </p>
                  </div>
                </div>

                {/* Interactive FSRS Spaced Repetition Buttons */}
                <div className="pt-3 border-t border-white/[0.08]">
                  <p className="text-xs font-bold text-slate-400 mb-2">
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

        {/* Metrics Stats Bar Wrapped in React Bits GlassSurface */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6 w-full max-w-5xl mb-24">
          <GlassSurface borderRadius={20} className="w-full text-center">
            <div className="p-6">
              <div className="text-3xl sm:text-4xl font-black text-cyan-400 leading-none mb-2">
                600+
              </div>
              <p className="text-xs sm:text-sm font-bold text-slate-400">
                Từ TOEIC chuẩn đề thi ETS
              </p>
            </div>
          </GlassSurface>

          <GlassSurface borderRadius={20} className="w-full text-center">
            <div className="p-6">
              <div className="text-3xl sm:text-4xl font-black text-indigo-400 leading-none mb-2">
                98.4%
              </div>
              <p className="text-xs sm:text-sm font-bold text-slate-400">
                Tỷ lệ duy trì trí nhớ 6 tháng
              </p>
            </div>
          </GlassSurface>

          <GlassSurface borderRadius={20} className="w-full text-center">
            <div className="p-6">
              <div className="text-3xl sm:text-4xl font-black text-emerald-400 leading-none mb-2">
                4.2x
              </div>
              <p className="text-xs sm:text-sm font-bold text-slate-400">
                Tăng tốc độ nhận diện đề thi
              </p>
            </div>
          </GlassSurface>

          <GlassSurface borderRadius={20} className="w-full text-center">
            <div className="p-6">
              <div className="text-3xl sm:text-4xl font-black text-amber-400 leading-none mb-2">
                24/7
              </div>
              <p className="text-xs sm:text-sm font-bold text-slate-400">
                Gia sư AI phản xạ thời gian thực
              </p>
            </div>
          </GlassSurface>
        </div>
      </section>

      {/* 5. Section: 5D Cognitive Spaced Repetition Engine (FSRS v5) */}
      <section id="features-5d" className="py-20 px-6 sm:px-10 max-w-7xl mx-auto w-full">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <span className="text-xs font-black uppercase tracking-widest text-indigo-400 bg-indigo-500/10 px-3 py-1.5 rounded-full border border-indigo-400/20 inline-block mb-3">
            Đột Phá Khoa Học Nhận Thức
          </span>
          <h2 className="text-3xl sm:text-5xl font-black text-white tracking-tight mb-4">
            Động cơ 5D Spaced Repetition <br />
            <span className="bg-gradient-to-r from-sky-400 via-indigo-300 to-cyan-300 bg-clip-text text-transparent">
              FSRS v5 vs SM-2 Cổ Điển
            </span>
          </h2>
          <p className="text-sm sm:text-base text-slate-300">
            Hầu hết các app flashcard hiện nay vẫn dùng thuật toán SuperMemo-2 từ năm 1987. VocabFlow nâng cấp lên FSRS v5 mô phỏng chính xác cấu trúc quên của vỏ não.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <GlassSurface borderRadius={24} className="w-full text-left">
            <div className="p-7">
              <div className="w-12 h-12 rounded-2xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400 mb-6">
                <Brain className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-white mb-2">
                Stability & Retrievability
              </h3>
              <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                Tách biệt độ bền trí nhớ (Stability) và khả năng nhớ lại (Retrievability), giúp không bị ôn thừa các từ đã khắc sâu vào tiềm thức.
              </p>
            </div>
          </GlassSurface>

          <GlassSurface borderRadius={24} className="w-full text-left">
            <div className="p-7">
              <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center text-indigo-400 mb-6">
                <Compass className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-white mb-2">
                Contextual Clue Matrix
              </h3>
              <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                Liên kết từ vựng với cấu trúc ngữ pháp Part 5 & Part 6 TOEIC, không học từ đơn độc mà học cả collocations và họ từ (word family).
              </p>
            </div>
          </GlassSurface>

          <GlassSurface borderRadius={24} className="w-full text-left">
            <div className="p-7">
              <div className="w-12 h-12 rounded-2xl bg-purple-500/10 border border-purple-500/30 flex items-center justify-center text-purple-400 mb-6">
                <Flame className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-white mb-2">
                Anti-Leech Smart Detector
              </h3>
              <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                Tự động nhận diện những từ bạn hay quên hoặc nhầm lẫn (Leech Words), lập tức kích hoạt bài giải thích chi tiết và ví dụ ngữ cảnh mới.
              </p>
            </div>
          </GlassSurface>

          <GlassSurface borderRadius={24} className="w-full text-left">
            <div className="p-7">
              <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 mb-6">
                <TrendingUp className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-white mb-2">
                Tối Ưu Thời Gian Học
              </h3>
              <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                Cắt giảm 38.5% số lần lật thẻ vô ích so với flashcard thông thường, giúp bạn đạt mốc 800+ TOEIC với chỉ 20 phút mỗi ngày.
              </p>
            </div>
          </GlassSurface>
        </div>
      </section>

      {/* 6. Section: TOEIC 600+ Essential Words by ETS Topics */}
      <section id="features-toeic" className="py-20 px-6 sm:px-10 max-w-7xl mx-auto w-full">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <span className="text-xs font-black uppercase tracking-widest text-cyan-400 bg-cyan-500/10 px-3 py-1.5 rounded-full border border-cyan-400/20 inline-block mb-3">
            Bám Sát Đề Thi Thật ETS
          </span>
          <h2 className="text-3xl sm:text-5xl font-black text-white tracking-tight mb-4">
            Kho 600+ Từ Vựng TOEIC Cốt Lõi <br />
            <span className="bg-gradient-to-r from-cyan-400 via-sky-300 to-indigo-300 bg-clip-text text-transparent">
              Phân Loại Theo 50 Chủ Đề Trọng Điểm
            </span>
          </h2>
          <p className="text-sm sm:text-base text-slate-300">
            Tổng hợp từ 100+ đề thi TOEIC mới nhất Format 2024-2026. Mỗi từ đều có phiên âm IPA chuẩn, audio phát âm US/UK, ví dụ câu thực chiến và bẫy đề thi cần tránh.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <GlassSurface borderRadius={24} className="w-full text-left">
            <div className="p-7">
              <div className="flex items-center justify-between mb-4">
                <span className="text-xs font-black text-cyan-400 uppercase tracking-wider bg-cyan-500/10 px-3 py-1 rounded-md border border-cyan-500/20">
                  Chủ Đề 01 - 10
                </span>
                <span className="text-xs font-bold text-slate-400">120 Từ vựng</span>
              </div>
              <h3 className="text-xl font-black text-white mb-2">
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

          <GlassSurface borderRadius={24} className="w-full text-left">
            <div className="p-7">
              <div className="flex items-center justify-between mb-4">
                <span className="text-xs font-black text-indigo-400 uppercase tracking-wider bg-indigo-500/10 px-3 py-1 rounded-md border border-indigo-500/20">
                  Chủ Đề 11 - 20
                </span>
                <span className="text-xs font-bold text-slate-400">125 Từ vựng</span>
              </div>
              <h3 className="text-xl font-black text-white mb-2">
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

          <GlassSurface borderRadius={24} className="w-full text-left">
            <div className="p-7">
              <div className="flex items-center justify-between mb-4">
                <span className="text-xs font-black text-emerald-400 uppercase tracking-wider bg-emerald-500/10 px-3 py-1 rounded-md border border-emerald-500/20">
                  Chủ Đề 21 - 30
                </span>
                <span className="text-xs font-bold text-slate-400">115 Từ vựng</span>
              </div>
              <h3 className="text-xl font-black text-white mb-2">
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
      </section>

      {/* 7. Section: AI Tutor & Multiplayer PvP Arenas */}
      <section id="features-ai" className="py-20 px-6 sm:px-10 max-w-7xl mx-auto w-full">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
          <div className="text-left">
            <span className="text-xs font-black uppercase tracking-widest text-violet-400 bg-violet-500/10 px-3 py-1.5 rounded-full border border-violet-400/20 inline-block mb-3">
              Gia Sư Cá Nhân Hóa 24/7
            </span>
            <h2 className="text-3xl sm:text-5xl font-black text-white tracking-tight mb-6">
              AI Coach Đàm Thoại & <br />
              <span className="bg-gradient-to-r from-violet-400 via-indigo-300 to-sky-300 bg-clip-text text-transparent">
                Đấu Trường PvP 1v1
              </span>
            </h2>
            <p className="text-base text-slate-300 mb-6 leading-relaxed">
              Không chỉ dừng lại ở thẻ từ vựng tĩnh, VocabFlow tích hợp mô hình AI thông minh có khả năng trò chuyện, giải thích ngữ cảnh sai và tổ chức phòng thi đấu thời gian thực với cộng đồng người học khắp cả nước.
            </p>

            <ul className="space-y-4 mb-8">
              <li className="flex items-start gap-3 text-sm text-slate-200">
                <CheckCircle2 className="w-5 h-5 text-cyan-400 shrink-0 mt-0.5" />
                <span>
                  <strong>Phản hồi tức thì:</strong> Nhận diện lỗi phát âm và chỉ ra điểm khác biệt giữa các từ dễ gây nhầm lẫn trong bài thi Part 1 & Part 2.
                </span>
              </li>
              <li className="flex items-start gap-3 text-sm text-slate-200">
                <CheckCircle2 className="w-5 h-5 text-indigo-400 shrink-0 mt-0.5" />
                <span>
                  <strong>Đấu trường Word Match & Scramble:</strong> Ghép từ và nối nghĩa tốc độ cao, leo bảng xếp hạng tuần và nhận huy hiệu danh giá.
                </span>
              </li>
              <li className="flex items-start gap-3 text-sm text-slate-200">
                <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                <span>
                  <strong>Ngân hàng đề thi TOEIC:</strong> Thi thử 200 câu có bấm giờ và phân tích chi tiết điểm số từng phần thi.
                </span>
              </li>
            </ul>

            <Link
              to="/dashboard"
              className="btn-glass-primary !py-3.5 !px-8 text-sm font-bold inline-flex items-center gap-2"
            >
              <span>Thử thách cùng AI Coach ngay</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          <GlassSurface borderRadius={28} className="w-full text-left">
            <div className="p-7 sm:p-9">
              <div className="flex items-center justify-between pb-4 border-b border-white/[0.08] mb-6">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-violet-500/20 border border-violet-500/40 flex items-center justify-center text-violet-300 font-bold">
                    AI
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-white">LexiMind AI Coach</h4>
                    <span className="text-[11px] text-emerald-400 flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 inline-block animate-pulse"></span>
                      Trực tuyến 24/7
                    </span>
                  </div>
                </div>
                <span className="text-xs font-bold text-slate-400 bg-slate-800/80 px-2.5 py-1 rounded-md">
                  TOEIC Speaking Prep
                </span>
              </div>

              {/* Chat Simulation */}
              <div className="space-y-4 mb-6">
                <div className="p-4 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 text-xs sm:text-sm text-slate-200">
                  <p className="font-bold text-indigo-300 mb-1">Gia sư AI:</p>
                  "Trong câu: 'The manager decided to ______ the meeting until Friday', bạn nên dùng <strong>postpone</strong> hay <strong>cancel</strong>? Sự khác biệt là gì?"
                </div>

                <div className="p-4 rounded-2xl bg-slate-800/80 border border-white/[0.08] text-xs sm:text-sm text-slate-300 ml-6">
                  <p className="font-bold text-slate-400 mb-1">Bạn:</p>
                  "Dùng 'postpone' vì có cụm 'until Friday', nghĩa là hoãn lại đến thứ Sáu chứ không phải hủy bỏ hoàn toàn."
                </div>

                <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-xs sm:text-sm text-slate-200">
                  <p className="font-bold text-emerald-400 mb-1">AI Đánh giá: Xuất sắc! (+15 EXP)</p>
                  "Chính xác 100%! 'Postpone' đồng nghĩa với 'put off' hoặc 'delay'. Đây là câu bẫy kinh điển trong Part 5 ETS."
                </div>
              </div>

              <div className="p-3 rounded-xl bg-slate-900/90 border border-white/[0.08] flex items-center justify-between text-xs text-slate-400">
                <span>Micro sẵn sàng thu âm</span>
                <span className="text-cyan-400 font-bold">Độ trễ AI: 120ms</span>
              </div>
            </div>
          </GlassSurface>
        </div>
      </section>

      {/* 8. Section: Ecosystem */}
      <section id="ecosystem" className="py-20 px-6 sm:px-10 max-w-7xl mx-auto w-full">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <span className="text-xs font-black uppercase tracking-widest text-sky-400 bg-sky-500/10 px-3 py-1.5 rounded-full border border-sky-400/20 inline-block mb-3">
            Hệ Sinh Thái Đa Nền Tảng
          </span>
          <h2 className="text-3xl sm:text-5xl font-black text-white tracking-tight mb-4">
            Đầy Đủ Công Cụ Từ Cơ Bản Đến Nâng Cao
          </h2>
          <p className="text-sm sm:text-base text-slate-300">
            VocabFlow cung cấp hệ thống học tập khép kín: từ kiểm tra trình độ đầu vào, ôn tập ngắt quãng, làm đề thi thử đến kết nối cộng đồng.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <GlassSurface borderRadius={24} className="w-full text-left">
            <div className="p-7">
              <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 mb-6">
                <Zap className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-white mb-2">Test Trình Độ Đầu Vào</h3>
              <p className="text-xs sm:text-sm text-slate-300 mb-4 leading-relaxed">
                Bài kiểm tra thích ứng chỉ trong 3 phút giúp xác định chính xác vốn từ vựng hiện tại và đề xuất lộ trình ôn tập cá nhân hóa.
              </p>
              <Link to="/placement-test" className="text-xs font-bold text-cyan-400 hover:underline flex items-center gap-1">
                Làm bài test ngay <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </GlassSurface>

          <GlassSurface borderRadius={24} className="w-full text-left">
            <div className="p-7">
              <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center text-indigo-400 mb-6">
                <BookOpen className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-white mb-2">Kho Từ Vựng Cá Nhân Hóa</h3>
              <p className="text-xs sm:text-sm text-slate-300 mb-4 leading-relaxed">
                Tự tạo bộ thẻ riêng, nhập dữ liệu từ Excel, PDF hoặc Word chỉ trong một nốt nhạc với sự hỗ trợ tự động điền nghĩa từ AI.
              </p>
              <Link to="/vocabulary" className="text-xs font-bold text-cyan-400 hover:underline flex items-center gap-1">
                Khám phá kho từ <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </GlassSurface>

          <GlassSurface borderRadius={24} className="w-full text-left">
            <div className="p-7">
              <div className="w-12 h-12 rounded-2xl bg-rose-500/10 border border-rose-500/30 flex items-center justify-center text-rose-400 mb-6">
                <Users className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-white mb-2">Cộng Đồng & Diễn Đàn</h3>
              <p className="text-xs sm:text-sm text-slate-300 mb-4 leading-relaxed">
                Chia sẻ bộ thẻ flashcard điểm cao, thảo luận các câu khó trong đề thi TOEIC và tham gia thi đấu cùng hàng chục ngàn học viên.
              </p>
              <Link to="/dashboard" className="text-xs font-bold text-cyan-400 hover:underline flex items-center gap-1">
                Gia nhập cộng đồng <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </GlassSurface>
        </div>
      </section>

      {/* 9. Section: Testimonials & Reviews */}
      <section id="reviews" className="py-20 px-6 sm:px-10 max-w-7xl mx-auto w-full">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <span className="text-xs font-black uppercase tracking-widest text-emerald-400 bg-emerald-500/10 px-3 py-1.5 rounded-full border border-emerald-400/20 inline-block mb-3">
            Đánh Giá Từ Người Dùng
          </span>
          <h2 className="text-3xl sm:text-5xl font-black text-white tracking-tight mb-4">
            Được Tin Dùng Bởi Hơn 15,000+ <br />
            <span className="bg-gradient-to-r from-emerald-400 via-teal-300 to-cyan-300 bg-clip-text text-transparent">
              Sĩ Tử Luyện Thi TOEIC Khắp Toàn Quốc
            </span>
          </h2>
          <p className="text-sm sm:text-base text-slate-300">
            Xem học viên đã bứt phá điểm số TOEIC từ mất gốc lên 800+ như thế nào cùng phương pháp FSRS 5D.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {TESTIMONIALS.map((item, idx) => (
            <GlassSurface key={idx} borderRadius={24} className="w-full text-left">
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
                    <h4 className="text-sm font-bold text-white">{item.name}</h4>
                    <p className="text-[11px] text-slate-400">{item.role}</p>
                    <span className="text-[10px] font-black text-emerald-400 uppercase tracking-wider">
                      {item.score} • {item.badge}
                    </span>
                  </div>
                </div>
              </div>
            </GlassSurface>
          ))}
        </div>
      </section>

      {/* 10. Section: Pricing Tiers */}
      <section id="pricing" className="py-20 px-6 sm:px-10 max-w-6xl mx-auto w-full text-center">
        <div className="max-w-3xl mx-auto mb-16">
          <span className="text-xs font-black uppercase tracking-widest text-indigo-400 bg-indigo-500/10 px-3 py-1.5 rounded-full border border-indigo-400/20 inline-block mb-3">
            Bảng Giá Minh Bạch
          </span>
          <h2 className="text-3xl sm:text-5xl font-black text-white tracking-tight mb-4">
            Đầu Tư Cho Tương Lai Với Chi Phí Hợp Lý
          </h2>
          <p className="text-sm sm:text-base text-slate-300">
            Bắt đầu hoàn toàn miễn phí không giới hạn thời gian. Nâng cấp bất cứ khi nào bạn muốn mở khóa toàn bộ tính năng AI.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-left items-stretch">
          {/* Free Tier */}
          <GlassSurface borderRadius={26} className="w-full">
            <div className="p-8 flex flex-col justify-between h-full">
              <div>
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Gói Cơ Bản</span>
                <h3 className="text-2xl font-black text-white mt-1 mb-4">Miễn Phí Mãi Mãi</h3>
                <div className="text-3xl font-black text-white mb-6">
                  0đ <span className="text-xs font-normal text-slate-400">/ trọn đời</span>
                </div>
                <ul className="space-y-3 text-xs sm:text-sm text-slate-300 mb-8">
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-emerald-400" />
                    <span>Kho 600 từ vựng TOEIC cơ bản</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-emerald-400" />
                    <span>Thuật toán FSRS v5 tiêu chuẩn</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-emerald-400" />
                    <span>Test trình độ tiếng Anh 3 phút</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-emerald-400" />
                    <span>Tham gia Đấu trường PvP 3 trận/ngày</span>
                  </li>
                </ul>
              </div>
              <Link
                to="/register"
                className="w-full text-center py-3 rounded-xl font-bold text-slate-200 bg-slate-800/80 hover:bg-slate-700/80 border border-white/[0.08] transition"
              >
                Bắt đầu học ngay
              </Link>
            </div>
          </GlassSurface>

          {/* Pro VIP Tier */}
          <GlassSurface
            borderRadius={26}
            borderWidth={0.12}
            brightness={75}
            className="w-full relative ring-2 ring-indigo-500/50 shadow-2xl shadow-indigo-500/20"
          >
            <div className="p-8 flex flex-col justify-between h-full">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-black text-cyan-400 uppercase tracking-wider">Khuyên Dùng</span>
                  <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-400/30">
                    Phổ Biến Nhất
                  </span>
                </div>
                <h3 className="text-2xl font-black text-white mb-4">Pro Scholar VIP</h3>
                <div className="text-3xl font-black text-white mb-6">
                  69.000đ <span className="text-xs font-normal text-slate-400">/ tháng</span>
                </div>
                <ul className="space-y-3 text-xs sm:text-sm text-slate-200 mb-8">
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-cyan-400" />
                    <span>Không giới hạn từ vựng & bộ thẻ</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-cyan-400" />
                    <span>Gia sư AI Coach 24/7 không giới hạn</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-cyan-400" />
                    <span>Ngân hàng đề thi TOEIC ETS có đáp án chi tiết</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-cyan-400" />
                    <span>Chế độ PvP không giới hạn & xếp hạng PRO</span>
                  </li>
                </ul>
              </div>
              <Link
                to="/upgrade"
                className="btn-glass-primary w-full text-center !py-3.5 text-sm font-bold flex items-center justify-center gap-2"
              >
                <span>Nâng Cấp Pro VIP</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </GlassSurface>

          {/* Lifetime Mastery */}
          <GlassSurface borderRadius={26} className="w-full">
            <div className="p-8 flex flex-col justify-between h-full">
              <div>
                <span className="text-xs font-bold text-amber-400 uppercase tracking-wider">Trọn Đời</span>
                <h3 className="text-2xl font-black text-white mt-1 mb-4">Lifetime Mastery</h3>
                <div className="text-3xl font-black text-white mb-6">
                  499.000đ <span className="text-xs font-normal text-slate-400">/ một lần duy nhất</span>
                </div>
                <ul className="space-y-3 text-xs sm:text-sm text-slate-300 mb-8">
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-amber-400" />
                    <span>Mọi tính năng của gói Pro Scholar</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-amber-400" />
                    <span>Toàn quyền truy cập mọi tính năng mới trong tương lai</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-amber-400" />
                    <span>Tài khoản VIP vĩnh viễn không gia hạn</span>
                  </li>
                </ul>
              </div>
              <Link
                to="/upgrade"
                className="w-full text-center py-3 rounded-xl font-bold text-slate-200 bg-slate-800/80 hover:bg-slate-700/80 border border-white/[0.08] transition"
              >
                Sở hữu vĩnh viễn
              </Link>
            </div>
          </GlassSurface>
        </div>
      </section>

      {/* 11. Section: FAQ Accordion */}
      <section className="py-16 px-6 sm:px-10 max-w-4xl mx-auto w-full">
        <h2 className="text-3xl font-black text-white text-center mb-10">
          Câu Hỏi Thường Gặp
        </h2>
        <div className="space-y-4">
          {[
            {
              q: 'FSRS v5 khác gì so với Anki thông thường?',
              a: 'Anki truyền thống sử dụng thuật toán SM-2 ra đời từ năm 1987 với hệ số interval cố định. FSRS v5 sử dụng mô hình học máy 17 tham số đo lường chính xác cả độ bền trí nhớ (Stability) và độ khó nhận thức (Difficulty), giúp giảm 30-40% số lần lật thẻ mà vẫn duy trì tỷ lệ nhớ trên 90%.'
            },
            {
              q: 'Tôi có thể tự tạo bộ từ vựng riêng của mình không?',
              a: 'Có! VocabFlow cho phép bạn tự tạo các bộ từ vựng cá nhân, nhập từ file Excel, PDF hoặc Word chỉ trong một cú nhấp chuột. AI sẽ tự động điền phiên âm, nghĩa tiếng Việt và câu ví dụ chuẩn.'
            },
            {
              q: 'Nền tảng có hỗ trợ học trên điện thoại không?',
              a: 'VocabFlow được tối ưu hóa giao diện hoàn hảo cho mọi thiết bị từ iPhone, Android đến iPad và máy tính xách tay. Dữ liệu học tập được đồng bộ hóa tức thì trên đám mây.'
            }
          ].map((faq, idx) => (
            <GlassSurface
              key={idx}
              borderRadius={18}
              onClick={() => setActiveFaq(activeFaq === idx ? null : idx)}
              className="w-full cursor-pointer text-left"
            >
              <div className="p-5 sm:p-6 w-full">
                <div className="flex items-center justify-between gap-4">
                  <h3 className="text-base font-bold text-white">{faq.q}</h3>
                  <ChevronDown
                    className={`w-5 h-5 text-slate-400 transition-transform duration-300 ${
                      activeFaq === idx ? 'rotate-180 text-cyan-400' : ''
                    }`}
                  />
                </div>
                {activeFaq === idx && (
                  <p className="mt-3 text-sm text-slate-300 leading-relaxed border-t border-white/[0.08] pt-3">
                    {faq.a}
                  </p>
                )}
              </div>
            </GlassSurface>
          ))}
        </div>
      </section>

      {/* 12. Final CTA Banner */}
      <section className="py-20 px-6 sm:px-10 max-w-5xl mx-auto w-full text-center">
        <GlassSurface
          borderRadius={32}
          borderWidth={0.12}
          brightness={70}
          className="w-full p-8 sm:p-14 text-center relative overflow-hidden"
        >
          <div className="max-w-2xl mx-auto relative z-10">
            <span className="text-xs font-black uppercase tracking-widest text-cyan-400 bg-cyan-500/10 px-3 py-1.5 rounded-full border border-cyan-400/20 inline-block mb-4">
              Bắt Đầu Hành Trình Chinh Phục TOEIC
            </span>
            <h2 className="text-3xl sm:text-5xl font-black text-white tracking-tight mb-6">
              Sẵn Sàng Đột Phá Điểm Số Cùng VocabFlow?
            </h2>
            <p className="text-base text-slate-300 mb-8 leading-relaxed">
              Gia nhập cùng 15,000+ học viên thông minh đang áp dụng khoa học nhận thức để bứt phá band điểm ngay hôm nay.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link
                to="/register"
                className="btn-glass-primary w-full sm:w-auto !py-4 !px-9 text-base font-bold flex items-center justify-center gap-2.5 shadow-xl shadow-indigo-500/30"
              >
                <span>Tạo tài khoản miễn phí</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
              <Link
                to="/review"
                className="btn-glass-secondary w-full sm:w-auto !py-4 !px-8 text-base font-bold flex items-center justify-center gap-2"
              >
                <span>Trải nghiệm ngay</span>
              </Link>
            </div>
          </div>
        </GlassSurface>
      </section>

      {/* 13. Footer */}
      <footer className="mt-auto border-t border-white/[0.08] bg-[#03050c]/90 backdrop-blur-2xl py-12 px-6 sm:px-10">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-6 text-xs text-slate-400">
          <div className="flex items-center gap-3">
            <img src="/vocabflow-logo-256.png" alt="VocabFlow" className="w-7 h-7 rounded-lg" />
            <span className="font-bold text-slate-300 text-sm">VocabFlow</span>
            <span>• © 2026 Toàn quyền được bảo lưu.</span>
          </div>

          <div className="flex items-center gap-6 font-semibold">
            <a href="#features-5d" className="hover:text-cyan-400 transition">Động cơ 5D</a>
            <a href="#features-toeic" className="hover:text-cyan-400 transition">Kho từ TOEIC</a>
            <a href="#pricing" className="hover:text-cyan-400 transition">Bảng giá</a>
            <Link to="/support" className="hover:text-cyan-400 transition">Hỗ trợ</Link>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
