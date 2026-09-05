import React from 'react';
import { Link } from 'react-router-dom';
import { Sparkles, Brain, Clock, ShieldCheck, ArrowRight, BookCheck, Flame } from 'lucide-react';

export const LandingPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col">
      {/* Header */}
      <header className="px-6 py-5 max-w-7xl mx-auto w-full flex items-center justify-between">
        <div className="flex items-center gap-3">
          <img
            src="/vocabflow-logo-256.png"
            alt="VocabFlow"
            className="w-10 h-10 rounded-xl object-contain shadow-md shadow-indigo-500/20"
          />
          <span className="font-extrabold text-xl bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
            VocabFlow
          </span>
        </div>
        <div className="flex items-center gap-4">
          <Link
            to="/login"
            className="text-sm font-semibold text-slate-600 dark:text-slate-300 hover:text-brand-600 dark:hover:text-brand-400 transition"
          >
            Đăng nhập
          </Link>
          <Link
            to="/register"
            className="px-4 py-2 rounded-xl bg-brand-600 hover:bg-brand-700 text-white text-sm font-semibold shadow-md shadow-brand-500/20 transition"
          >
            Bắt đầu miễn phí
          </Link>
        </div>
      </header>

      {/* Hero Section */}
      <main className="flex-1 flex flex-col items-center justify-center text-center px-4 py-16 max-w-4xl mx-auto">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-brand-50 dark:bg-brand-950/50 border border-brand-200 dark:border-brand-800 text-brand-700 dark:text-brand-300 text-xs font-semibold mb-6">
          <Sparkles className="w-3.5 h-3.5" />
          <span>Thuật toán Lặp lại Ngắt quãng Thích ứng + Gia sư AI 24/7</span>
        </div>

        <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight leading-tight mb-6">
          Học ít từ hơn. <br />
          <span className="bg-gradient-to-r from-brand-600 via-indigo-600 to-purple-600 bg-clip-text text-transparent">
            Ghi nhớ trọn đời.
          </span>
        </h1>

        <p className="text-base sm:text-xl text-slate-600 dark:text-slate-400 max-w-2xl mb-8 leading-relaxed">
          VocabFlow không hiển thị flashcard thụ động. Hệ thống đo lường độ bền trí nhớ, phát hiện điểm yếu, và tự động lập lịch thời điểm tối ưu bạn sắp quên từ để ôn tập.
        </p>

        <div className="flex flex-col sm:flex-row items-center gap-4 w-full sm:w-auto">
          <Link
            to="/register"
            className="w-full sm:w-auto px-8 py-3.5 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-bold text-base shadow-lg shadow-brand-500/30 flex items-center justify-center gap-2 transition"
          >
            <span>Làm bài Placement Test</span>
            <ArrowRight className="w-5 h-5" />
          </Link>
          <Link
            to="/login"
            className="w-full sm:w-auto px-6 py-3.5 rounded-xl border border-slate-300 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-900 font-semibold text-base transition"
          >
            Trải nghiệm Demo
          </Link>
        </div>

        {/* Features Highlights */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-20 text-left w-full">
          <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
            <div className="w-12 h-12 rounded-xl bg-brand-100 dark:bg-brand-900/40 text-brand-600 dark:text-brand-400 flex items-center justify-center mb-4">
              <Brain className="w-6 h-6" />
            </div>
            <h3 className="font-bold text-lg mb-2">Adaptive Spaced Repetition</h3>
            <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
              Tính toán độ ổn định (Stability) và xác suất nhớ (Retrievability) dựa trên độ khó từ, tốc độ phản hồi và độ tự tin.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
            <div className="w-12 h-12 rounded-xl bg-amber-100 dark:bg-amber-900/40 text-amber-600 dark:text-amber-400 flex items-center justify-center mb-4">
              <Clock className="w-6 h-6" />
            </div>
            <h3 className="font-bold text-lg mb-2">600+ Từ TOEIC Thực Chiến</h3>
            <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
              Trọn bộ từ vựng chuẩn đề thi với phát âm audio US/UK, phiên âm chuẩn IPA, ví dụ song ngữ và collocations thực tế.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
            <div className="w-12 h-12 rounded-xl bg-emerald-100 dark:bg-emerald-900/40 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mb-4">
              <Sparkles className="w-6 h-6" />
            </div>
            <h3 className="font-bold text-lg mb-2">Gia Sư AI Cá Nhân Hóa</h3>
            <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
              Hỏi đáp ngữ cảnh, sinh câu ví dụ phân tầng theo chuẩn CEFR A2-C1 và hướng dẫn sửa lỗi tức thì.
            </p>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="py-6 border-t border-slate-200 dark:border-slate-800 text-center text-xs text-slate-500">
        © 2026 LexiMind AI — Advanced English Vocabulary Learning Platform.
      </footer>
    </div>
  );
};
