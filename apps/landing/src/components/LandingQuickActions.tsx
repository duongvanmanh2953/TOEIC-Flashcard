import React from 'react';
import { BookOpen, Zap, Award, Users, FileText, ChevronRight } from 'lucide-react';

export const LandingQuickActions: React.FC = React.memo(() => {
  return (
    <section id="quick-actions" className="py-12 px-4 sm:px-6 max-w-7xl mx-auto w-full border-t border-white/[0.06]">
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

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3" data-aos="fade-up">
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
  );
});

LandingQuickActions.displayName = 'LandingQuickActions';
