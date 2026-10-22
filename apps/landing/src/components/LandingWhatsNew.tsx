import React from 'react';
import { Sparkles, Brain, Award, Users, MousePointerClick, TrendingUp, ShieldCheck, Check } from 'lucide-react';

export const LandingWhatsNew: React.FC = React.memo(() => {
  return (
    <section id="whats-new" className="py-14 px-4 sm:px-6 max-w-7xl mx-auto w-full border-t border-white/[0.06]">
      <div className="space-y-3 mb-10 text-left" data-aos="fade-up">
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-400/25 text-cyan-300 text-xs font-bold">
          <Sparkles className="w-3.5 h-3.5" />
          <span>Nâng Cấp Mới Thực Tế</span>
        </span>
        <h2 className="text-2xl sm:text-4xl font-black text-white tracking-tight">
          Có gì mới trên LetStuN?
        </h2>
        <p className="text-xs sm:text-sm text-slate-400 max-w-2xl">
          Hệ thống được thiết kế lại xoay quanh tính hiệu quả trong từng phút học thực tế của bạn.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5" data-aos="fade-up">
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
  );
});

LandingWhatsNew.displayName = 'LandingWhatsNew';
