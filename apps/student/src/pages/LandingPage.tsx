import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Sparkles,
  Brain,
  Clock,
  ArrowRight,
  Flame,
  Volume2,
  CheckCircle2,
  TrendingUp,
  Zap,
  Award,
  BookOpen,
  HelpCircle,
  Play,
  RotateCcw,
  Check,
} from 'lucide-react';
import { LiquidBackground } from '../components/common/LiquidBackground';
import { VocabFlowLogo } from '@vocabflow/shared';

export const LandingPage: React.FC = () => {
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [activeTab, setActiveTab] = useState<'preview' | 'ai'>('preview');

  const playWordAudio = () => {
    if ('speechSynthesis' in window) {
      setIsPlayingAudio(true);
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance('accommodate');
      utterance.lang = 'en-US';
      utterance.rate = 0.9;
      utterance.onend = () => setIsPlayingAudio(false);
      utterance.onerror = () => setIsPlayingAudio(false);
      window.speechSynthesis.speak(utterance);
    }
  };

  return (
    <div className="relative min-h-screen text-slate-900 dark:text-slate-100 flex flex-col overflow-x-clip selection:bg-brand-500 selection:text-white">
      {/* 1. Ambient Dynamic Liquid Canvas Background */}
      <LiquidBackground />

      {/* 2. Extra Atmospheric Glow Spotlights for Hero Depth */}
      <div className="fixed top-12 left-1/2 -translate-x-1/2 w-[800px] h-[450px] bg-gradient-to-tr from-brand-500/20 via-indigo-500/15 to-purple-500/15 rounded-full blur-[140px] pointer-events-none -z-10 animate-pulse duration-10000" />
      <div className="fixed bottom-20 right-10 w-[500px] h-[500px] bg-gradient-to-bl from-teal-500/15 via-sky-500/10 to-transparent rounded-full blur-[130px] pointer-events-none -z-10" />

      {/* Header */}
      <header className="sticky top-0 z-50 backdrop-blur-xl bg-white/60 dark:bg-slate-950/60 border-b border-slate-200/50 dark:border-slate-800/60 transition-colors duration-300">
        <div className="px-4 sm:px-6 py-3.5 sm:py-4 max-w-7xl mx-auto w-full flex items-center justify-between">
          <div className="flex items-center gap-2.5 sm:gap-3 shrink-0">
            <VocabFlowLogo
              size="md"
              alt="VocabFlow"
              className="w-8 h-8 sm:w-9 sm:h-9 shadow-md shadow-indigo-500/20"
            />
            <div className="flex flex-col">
              <span className="font-extrabold text-lg sm:text-xl bg-gradient-to-r from-blue-600 via-indigo-600 to-cyan-600 dark:from-sky-400 dark:via-blue-400 dark:to-cyan-300 bg-clip-text text-transparent leading-snug">
                VocabFlow
              </span>
              <span className="hidden sm:inline-block text-[10px] font-semibold text-slate-500 dark:text-slate-400 tracking-wider uppercase leading-none">
                Smart Adaptive English
              </span>
            </div>
          </div>

          <nav className="hidden md:flex items-center gap-6 text-sm font-semibold text-slate-600 dark:text-slate-300">
            <Link to="/review" className="hover:text-cyan-600 dark:hover:text-cyan-400 transition py-1">
              Smart Review
            </Link>
            <Link to="/vocabulary" className="hover:text-cyan-600 dark:hover:text-cyan-400 transition py-1">
              Kho từ 600+
            </Link>
            <Link to="/placement-test" className="hover:text-cyan-600 dark:hover:text-cyan-400 transition py-1">
              Test Trình Độ
            </Link>
            <Link to="/upgrade" className="hover:text-cyan-600 dark:hover:text-cyan-400 transition py-1">
              Gói Premium
            </Link>
          </nav>

          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            <Link
              to="/login"
              className="whitespace-nowrap px-3 py-1.5 sm:py-2 rounded-xl text-xs sm:text-sm font-bold text-slate-700 dark:text-slate-200 hover:text-indigo-600 dark:hover:text-cyan-400 hover:bg-slate-100/70 dark:hover:bg-slate-800/70 transition shrink-0"
            >
              Đăng nhập
            </Link>
            <Link
              to="/dashboard"
              className="whitespace-nowrap btn-glass-primary !py-2 sm:!py-2.5 !px-3.5 sm:!px-5 text-xs sm:text-sm font-bold shrink-0"
            >
              <span>Vào học ngay</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main className="flex-1 flex flex-col items-center justify-center text-center px-4 pt-12 pb-20 max-w-6xl mx-auto w-full">
        {/* Luminous Top Pill Badge */}
        <div className="inline-flex items-center gap-2.5 px-4 py-2 rounded-full card-brand-effect overflow-hidden bg-sky-500/[0.08] dark:bg-sky-500/[0.14] border border-sky-400/35 text-sky-700 dark:text-sky-300 text-xs sm:text-sm font-bold mb-8 backdrop-blur-xl leading-normal shadow-xs">
          <Sparkles className="w-4 h-4 text-cyan-500 flex-shrink-0" />
          <span>Thuật toán Lặp lại Ngắt quãng Thích ứng + Gia sư AI 24/7</span>
        </div>

        {/* Hero Title with Generous, Breathable Line-Height */}
        <h2 className="text-4xl sm:text-6xl md:text-7xl font-black tracking-normal leading-[1.3] sm:leading-[1.25] mb-6 max-w-4xl text-slate-900 dark:text-white">
          Học ít từ hơn. <br className="hidden sm:block" />
          <span className="inline-block mt-2 bg-gradient-to-r from-blue-600 via-indigo-600 to-cyan-500 dark:from-sky-400 dark:via-blue-400 dark:to-cyan-300 bg-clip-text text-transparent">
            Ghi nhớ trọn đời.
          </span>
        </h2>

        {/* Hero Subtitle */}
        <p className="text-base sm:text-xl text-slate-600 dark:text-slate-300 max-w-3xl mx-auto mb-10 leading-relaxed font-normal">
          VocabFlow không bắt bạn lật flashcard máy móc. Nền tảng ứng dụng thuật toán FSRS đo lường độ bền trí nhớ, tự động phát hiện lỗ hổng và nhắc nhở đúng <span className="font-semibold text-cyan-600 dark:text-cyan-400">thời điểm vàng</span> trước khi não bộ quên từ vựng.
        </p>

        {/* Hero Action Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 w-full sm:w-auto mb-16">
          <Link
            to="/review"
            className="btn-glass-primary w-full sm:w-auto !py-4 !px-8 text-base font-bold flex items-center justify-center gap-2.5 shadow-lg"
          >
            <Sparkles className="w-5 h-5 fill-white/80" />
            <span>Trải nghiệm Smart Review</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
          <Link
            to="/vocabulary"
            className="btn-glass-secondary w-full sm:w-auto !py-4 !px-7 text-base font-bold flex items-center justify-center gap-2"
          >
            <BookOpen className="w-4 h-4 text-brand-600 dark:text-brand-400" />
            <span>Khám phá 600+ từ TOEIC</span>
          </Link>
          <Link
            to="/placement-test"
            className="btn-glass-secondary w-full sm:w-auto !py-4 !px-6 text-base font-bold text-indigo-600 dark:text-indigo-400 flex items-center justify-center gap-2"
          >
            <Zap className="w-4 h-4 text-amber-500" />
            <span>Test Trình Độ (Free)</span>
          </Link>
        </div>

        {/* Interactive Live Card Preview Showcase */}
        <div className="w-full max-w-2xl mx-auto mb-20">
          <div className="relative rounded-3xl p-1 bg-gradient-to-b from-brand-500/30 via-indigo-500/20 to-purple-500/10 shadow-2xl shadow-indigo-500/10">
            <div className="rounded-[22px] bg-white/85 dark:bg-slate-900/85 backdrop-blur-2xl p-6 sm:p-8 border border-white/60 dark:border-slate-800/80 text-left">
              {/* Card Header Bar */}
              <div className="flex items-center justify-between pb-5 border-b border-slate-200/60 dark:border-slate-800/70">
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full bg-rose-400 inline-block" />
                  <span className="w-3 h-3 rounded-full bg-amber-400 inline-block" />
                  <span className="w-3 h-3 rounded-full bg-emerald-400 inline-block" />
                  <span className="text-xs font-bold text-slate-500 dark:text-slate-400 ml-2">
                    Mô phỏng Thẻ Ghi nhớ Thông minh
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[11px] font-extrabold uppercase px-2.5 py-1 rounded-md bg-emerald-500/[0.12] text-emerald-600 dark:text-emerald-400 border border-emerald-500/30">
                    FSRS Interval: 4.2d
                  </span>
                </div>
              </div>

              {/* Main Card Content */}
              <div className="pt-6">
                <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-2 mb-3">
                  <div className="flex items-center gap-3">
                    <h2 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white leading-snug">
                      accommodate
                    </h2>
                    <button
                      onClick={playWordAudio}
                      title="Nghe phát âm chuẩn US"
                      className="p-2 rounded-xl bg-brand-500/[0.12] hover:bg-brand-500/[0.2] text-brand-600 dark:text-brand-400 border border-brand-500/30 transition flex items-center gap-1.5 text-xs font-bold"
                    >
                      <Volume2 className={`w-4 h-4 ${isPlayingAudio ? 'animate-bounce text-brand-500' : ''}`} />
                      <span className="hidden sm:inline">Phát âm</span>
                    </button>
                  </div>
                  <span className="text-xs font-bold text-brand-600 dark:text-brand-400 bg-brand-500/[0.08] px-2.5 py-1 rounded-lg">
                    /əˈkɑːmədeɪt/ • verb
                  </span>
                </div>

                <p className="text-base sm:text-lg font-bold text-slate-800 dark:text-slate-200 mb-4 leading-normal">
                  Cung cấp nơi ở, phòng ở; đáp ứng hoặc giải quyết (nhu cầu, mong muốn)
                </p>

                <div className="p-4 rounded-xl bg-slate-50/80 dark:bg-slate-950/60 border border-slate-200/60 dark:border-slate-800/80 mb-5">
                  <p className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1 leading-normal">
                    Ví dụ ngữ cảnh đề thi TOEIC:
                  </p>
                  <p className="text-sm sm:text-base font-semibold text-slate-700 dark:text-slate-300 italic leading-relaxed">
                    "The new convention center is spacious enough to <span className="text-brand-600 dark:text-brand-400 font-bold not-italic">accommodate</span> up to 2,500 participants."
                  </p>
                </div>

                {/* Progress Indicators & AI Insight */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                  <div className="p-3 rounded-xl bg-indigo-500/[0.06] dark:bg-indigo-500/[0.12] border border-indigo-500/20">
                    <div className="flex items-center justify-between text-xs font-bold mb-1.5">
                      <span className="text-slate-600 dark:text-slate-300">Xác suất nhớ lại</span>
                      <span className="text-indigo-600 dark:text-indigo-400">94% (Rất cao)</span>
                    </div>
                    <div className="w-full h-2 rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden">
                      <div className="h-full bg-gradient-to-r from-brand-500 to-indigo-600 rounded-full w-[94%]" />
                    </div>
                  </div>

                  <div className="p-3 rounded-xl bg-emerald-500/[0.06] dark:bg-emerald-500/[0.12] border border-emerald-500/20 flex items-center gap-2.5">
                    <Sparkles className="w-4 h-4 text-emerald-600 dark:text-emerald-400 flex-shrink-0" />
                    <p className="text-xs font-medium text-slate-700 dark:text-slate-300 leading-normal">
                      <strong className="text-emerald-700 dark:text-emerald-300 font-bold">AI Note:</strong> Xuất hiện trong 42% đề đọc TOEIC Part 5 & 7.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Social Proof & Metrics Stats Bar */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6 w-full max-w-4xl mb-24">
          <div className="card-brand-effect p-5 rounded-2xl bg-white/50 dark:bg-slate-900/50 backdrop-blur-xl border border-slate-200/60 dark:border-slate-800/80 text-center">
            <div className="text-2xl sm:text-3xl font-black text-brand-600 dark:text-brand-400 leading-snug mb-1">
              600+
            </div>
            <p className="text-xs sm:text-sm font-bold text-slate-600 dark:text-slate-400 leading-normal">
              Từ TOEIC chọn lọc đề thi
            </p>
          </div>

          <div className="card-brand-effect p-5 rounded-2xl bg-white/50 dark:bg-slate-900/50 backdrop-blur-xl border border-slate-200/60 dark:border-slate-800/80 text-center">
            <div className="text-2xl sm:text-3xl font-black text-emerald-600 dark:text-emerald-400 leading-snug mb-1">
              94%
            </div>
            <p className="text-xs sm:text-sm font-bold text-slate-600 dark:text-slate-400 leading-normal">
              Ghi nhớ sau 30 ngày
            </p>
          </div>

          <div className="card-brand-effect p-5 rounded-2xl bg-white/50 dark:bg-slate-900/50 backdrop-blur-xl border border-slate-200/60 dark:border-slate-800/80 text-center">
            <div className="text-2xl sm:text-3xl font-black text-indigo-600 dark:text-indigo-400 leading-snug mb-1">
              3.2x
            </div>
            <p className="text-xs sm:text-sm font-bold text-slate-600 dark:text-slate-400 leading-normal">
              Tốc độ phản xạ từ mới
            </p>
          </div>

          <div className="card-brand-effect p-5 rounded-2xl bg-white/50 dark:bg-slate-900/50 backdrop-blur-xl border border-slate-200/60 dark:border-slate-800/80 text-center">
            <div className="text-2xl sm:text-3xl font-black text-amber-500 leading-snug mb-1">
              24/7
            </div>
            <p className="text-xs sm:text-sm font-bold text-slate-600 dark:text-slate-400 leading-normal">
              Gia sư AI sửa lỗi tức thì
            </p>
          </div>
        </div>

        {/* 3 Core Pillars Features Highlights */}
        <div className="w-full max-w-5xl mb-24">
          <div className="text-center mb-12">
            <h2 className="text-2xl sm:text-4xl font-extrabold text-slate-900 dark:text-white leading-snug mb-3">
              Khoa học học tập vượt trội
            </h2>
            <p className="text-sm sm:text-base text-slate-600 dark:text-slate-400 max-w-xl mx-auto leading-relaxed">
              Kết hợp tinh hoa giữa tâm lý học nhận thức và mô hình ngôn ngữ lớn nhằm mang đến trải nghiệm học nhẹ nhàng nhất.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-left w-full">
            <div className="card-brand-effect p-7 rounded-3xl bg-white/60 dark:bg-slate-900/60 backdrop-blur-xl border border-slate-200/60 dark:border-slate-800/80 flex flex-col justify-between hover:border-brand-500/40 transition duration-300">
              <div>
                <div className="w-12 h-12 rounded-2xl bg-brand-500/[0.12] text-brand-600 dark:text-brand-400 flex items-center justify-center mb-5 border border-brand-500/20">
                  <Brain className="w-6 h-6" />
                </div>
                <h3 className="font-extrabold text-lg sm:text-xl text-slate-900 dark:text-white mb-3 leading-snug">
                  Adaptive Spaced Repetition
                </h3>
                <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed font-normal">
                  Tính toán liên tục hệ số ổn định (Stability) và xác suất nhớ (Retrievability) sau mỗi lượt phản hồi, loại bỏ hoàn toàn việc ôn tập trùng lặp vô nghĩa.
                </p>
              </div>
              <div className="mt-6 pt-4 border-t border-slate-200/40 dark:border-slate-800/50 flex items-center text-xs font-bold text-brand-600 dark:text-brand-400">
                <span>Dựa trên chuẩn FSRS v5</span>
              </div>
            </div>

            <div className="card-brand-effect p-7 rounded-3xl bg-white/60 dark:bg-slate-900/60 backdrop-blur-xl border border-slate-200/60 dark:border-slate-800/80 flex flex-col justify-between hover:border-amber-500/40 transition duration-300">
              <div>
                <div className="w-12 h-12 rounded-2xl bg-amber-500/[0.12] text-amber-600 dark:text-amber-400 flex items-center justify-center mb-5 border border-amber-500/20">
                  <Clock className="w-6 h-6" />
                </div>
                <h3 className="font-extrabold text-lg sm:text-xl text-slate-900 dark:text-white mb-3 leading-snug">
                  600+ Từ TOEIC Thực Chiến
                </h3>
                <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed font-normal">
                  Chọn lọc kỹ lưỡng từ các đề thi ETS thực tế, chuẩn hóa audio bản ngữ US/UK, phiên âm quốc tế IPA, collocations đi kèm và họ từ vựng phong phú.
                </p>
              </div>
              <div className="mt-6 pt-4 border-t border-slate-200/40 dark:border-slate-800/50 flex items-center text-xs font-bold text-amber-600 dark:text-amber-400">
                <span>Chia theo 50 chủ đề chuyên sâu</span>
              </div>
            </div>

            <div className="card-brand-effect p-7 rounded-3xl bg-white/60 dark:bg-slate-900/60 backdrop-blur-xl border border-slate-200/60 dark:border-slate-800/80 flex flex-col justify-between hover:border-emerald-500/40 transition duration-300">
              <div>
                <div className="w-12 h-12 rounded-2xl bg-emerald-500/[0.12] text-emerald-600 dark:text-emerald-400 flex items-center justify-center mb-5 border border-emerald-500/20">
                  <Sparkles className="w-6 h-6" />
                </div>
                <h3 className="font-extrabold text-lg sm:text-xl text-slate-900 dark:text-white mb-3 leading-snug">
                  Gia Sư AI Cá Nhân Hóa
                </h3>
                <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed font-normal">
                  Sẵn sàng giải đáp ngữ cảnh câu, sinh thêm ví dụ mẫu phân tầng theo CEFR A2-C1 và hướng dẫn chiến thuật xử lý bẫy từ vựng trong đề thi TOEIC.
                </p>
              </div>
              <div className="mt-6 pt-4 border-t border-slate-200/40 dark:border-slate-800/50 flex items-center text-xs font-bold text-emerald-600 dark:text-emerald-400">
                <span>Phản hồi thông minh tức thì</span>
              </div>
            </div>
          </div>
        </div>

        {/* How It Works Section */}
        <div className="w-full max-w-5xl mb-24">
          <div className="text-center mb-12">
            <h2 className="text-2xl sm:text-4xl font-extrabold text-slate-900 dark:text-white leading-snug mb-3">
              Hành trình 3 bước chinh phục từ vựng
            </h2>
            <p className="text-sm sm:text-base text-slate-600 dark:text-slate-400 max-w-xl mx-auto leading-relaxed">
              Phương pháp khoa học giúp bạn học ít hơn mỗi ngày nhưng đạt kết quả bền vững nhất.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-left">
            <div className="p-6 rounded-2xl bg-white/40 dark:bg-slate-900/40 border border-slate-200/50 dark:border-slate-800/60 backdrop-blur-lg">
              <div className="text-3xl font-black text-brand-600 dark:text-brand-400 mb-3 leading-none">
                01
              </div>
              <h4 className="font-bold text-base text-slate-900 dark:text-white mb-2 leading-snug">
                Định vị trình độ ban đầu
              </h4>
              <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                Làm bài test nhanh 15 câu để hệ thống xác định vốn từ hiện tại và tự động phân bổ lộ trình từ vựng mục tiêu.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-white/40 dark:bg-slate-900/40 border border-slate-200/50 dark:border-slate-800/60 backdrop-blur-lg">
              <div className="text-3xl font-black text-indigo-600 dark:text-indigo-400 mb-3 leading-none">
                02
              </div>
              <h4 className="font-bold text-base text-slate-900 dark:text-white mb-2 leading-snug">
                Lặp lại ngắt quãng thông minh
              </h4>
              <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                Mỗi ngày chỉ cần 10-15 phút ôn tập đúng các thẻ từ sắp quên. Thuật toán tự động xếp lịch chính xác từng ngày.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-white/40 dark:bg-slate-900/40 border border-slate-200/50 dark:border-slate-800/60 backdrop-blur-lg">
              <div className="text-3xl font-black text-purple-600 dark:text-purple-400 mb-3 leading-none">
                03
              </div>
              <h4 className="font-bold text-base text-slate-900 dark:text-white mb-2 leading-snug">
                Tự tin làm chủ đề thi
              </h4>
              <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                Chuyển hóa từ vựng thành phản xạ tự nhiên, hiểu sâu ngữ cảnh đề thi TOEIC và bứt phá mục tiêu điểm số.
              </p>
            </div>
          </div>
        </div>

        {/* Bottom Call to Action Banner - Liquid Glass trong suốt ánh xanh nhẹ màu đậm */}
        <div className="w-full max-w-4xl p-8 sm:p-12 rounded-3xl bg-gradient-to-br from-slate-900/90 via-blue-950/85 to-cyan-950/85 backdrop-blur-2xl border border-sky-400/35 text-white text-center shadow-2xl shadow-cyan-950/40 relative overflow-hidden card-brand-effect">
          <div className="absolute -top-24 -right-24 w-72 h-72 bg-cyan-500/20 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -bottom-24 -left-24 w-72 h-72 bg-blue-600/20 rounded-full blur-3xl pointer-events-none" />

          <h2 className="text-2xl sm:text-4xl font-black mb-4 leading-snug text-white">
            Bắt đầu làm chủ từ vựng ngay hôm nay
          </h2>
          <p className="text-sm sm:text-base text-cyan-100/90 max-w-xl mx-auto mb-8 leading-relaxed font-normal">
            Không cần cài đặt rườm rà. Trải nghiệm phương pháp ghi nhớ hiện đại nhất hoàn toàn miễn phí.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              to="/review"
              className="btn-glass-primary !py-3.5 !px-8 text-sm font-extrabold flex items-center justify-center gap-2"
            >
              <span>Học thử miễn phí</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              to="/placement-test"
              className="btn-glass-secondary !py-3.5 !px-7 text-sm font-bold flex items-center justify-center gap-2 text-slate-800 dark:text-white"
            >
              Làm bài test 3 phút
            </Link>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="py-8 border-t border-slate-200/60 dark:border-slate-800/80 bg-white/40 dark:bg-slate-950/40 backdrop-blur-md text-center text-xs text-slate-500 dark:text-slate-400">
        <div className="max-w-7xl mx-auto px-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <VocabFlowLogo size="xs" alt="Logo" className="w-5 h-5" />
            <span className="font-bold text-slate-700 dark:text-slate-300">VocabFlow</span>
            <span>— Advanced Spaced Repetition Platform</span>
          </div>
          <p>© 2026 VocabFlow. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
};
