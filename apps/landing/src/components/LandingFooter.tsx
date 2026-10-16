import React from 'react';
import { VocabFlowLogo } from '@vocabflow/shared';

export const LandingFooter: React.FC = React.memo(() => {
  return (
    <footer className="mt-auto py-10 px-4 sm:px-6 border-t border-white/[0.08] text-xs text-slate-400">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <VocabFlowLogo size="xs" showContainer={false} />
            <span className="font-bold text-white">VocabFlow</span>
            <span>• Nền tảng học đa ngôn ngữ & flashcard thông minh</span>
          </div>

          <div className="flex flex-wrap items-center gap-4 text-slate-400 font-medium text-xs">
            <a href="#languages" className="hover:text-white transition">
              Đa ngôn ngữ
            </a>
            <a href="https://app.vocalflow.site/vocabulary" className="hover:text-white transition">
              Từ vựng
            </a>
            <a href="https://app.vocalflow.site/exams" className="hover:text-white transition">
              Ngân hàng đề
            </a>
            <a href="#pvp-arena" className="hover:text-white transition">
              Đấu trường 1v1
            </a>
            <a href="https://app.vocalflow.site/notes" className="hover:text-white transition">
              Ghi chú
            </a>
            <a href="https://kid.vocalflow.site" className="text-amber-400 hover:text-amber-300 transition">
              Thế giới bé
            </a>
          </div>
        </div>

        <div className="pt-6 border-t border-white/[0.06] flex flex-col md:flex-row items-center justify-between gap-4 text-[11px] text-slate-500">
          <div className="flex flex-wrap items-center gap-3 justify-center md:justify-start">
            <span>© {new Date().getFullYear()} VocabFlow. Bảo lưu mọi quyền.</span>
            <span>•</span>
            <span className="text-slate-400">Website TMĐT cung cấp dịch vụ trực tuyến</span>
          </div>

          <div className="flex flex-wrap items-center gap-4">
            <a href="https://app.vocalflow.site/terms-of-service" className="hover:text-white transition">
              Điều khoản dịch vụ
            </a>
            <a href="https://app.vocalflow.site/privacy-policy" className="hover:text-white transition">
              Chính sách bảo mật
            </a>
            <a href="https://app.vocalflow.site/payment-policy" className="hover:text-white transition">
              Chính sách thanh toán
            </a>
            <a href="https://app.vocalflow.site/delivery-refund-policy" className="hover:text-white transition">
              Giao nhận & hoàn tiền
            </a>
            <a href="https://app.vocalflow.site/complaint-resolution" className="hover:text-white transition">
              Giải quyết khiếu nại
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
});

LandingFooter.displayName = 'LandingFooter';
