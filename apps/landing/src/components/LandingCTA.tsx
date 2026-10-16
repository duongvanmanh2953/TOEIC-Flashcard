import React from 'react';
import { ArrowRight } from 'lucide-react';

export const LandingCTA: React.FC = React.memo(() => {
  return (
    <section className="py-16 px-4 sm:px-6 max-w-5xl mx-auto w-full text-center" data-aos="fade-up">
      <div className="p-8 sm:p-12 rounded-3xl bg-gradient-to-br from-indigo-950/70 via-slate-900 to-slate-950 border border-indigo-500/30 space-y-6 relative overflow-hidden">
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
            className="btn-glass-primary !py-3 !px-7 text-sm font-extrabold flex items-center gap-2 card-hover-smooth"
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
  );
});

LandingCTA.displayName = 'LandingCTA';
