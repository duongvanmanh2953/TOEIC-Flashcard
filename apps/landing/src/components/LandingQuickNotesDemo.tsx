import React from 'react';
import { MousePointerClick, CheckCircle2, FileText, HelpCircle } from 'lucide-react';

interface LandingQuickNotesDemoProps {
  demoSelectedText: string;
  demoSavedToNotes: boolean;
  onSaveToNotes: () => void;
}

export const LandingQuickNotesDemo: React.FC<LandingQuickNotesDemoProps> = React.memo(({
  demoSelectedText,
  demoSavedToNotes,
  onSaveToNotes,
}) => {
  return (
    <section id="quick-notes" className="py-14 px-4 sm:px-6 max-w-7xl mx-auto w-full border-t border-white/[0.06]">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
        {/* Left */}
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

          <div className="space-y-2.5 pt-1">
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

        {/* Right: Simulation */}
        <div className="lg:col-span-6" data-aos="fade-up" data-aos-delay="100">
          <div className="p-6 rounded-3xl bg-slate-900 border border-white/15 space-y-4">
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

            <div className="p-4 rounded-2xl bg-slate-950/80 border border-white/[0.08] relative">
              <div className="absolute -top-4 left-24 z-20">
                <button
                  type="button"
                  onClick={onSaveToNotes}
                  className="px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-extrabold flex items-center gap-1.5 transition active:scale-95 cursor-pointer"
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
                href="https://app.letstun.site/notes"
                className="px-2.5 py-1 rounded-xl bg-indigo-600/20 hover:bg-indigo-600/40 text-indigo-300 font-bold text-[11px] border border-indigo-500/30 transition"
              >
                Xem ghi chú
              </a>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
});

LandingQuickNotesDemo.displayName = 'LandingQuickNotesDemo';
