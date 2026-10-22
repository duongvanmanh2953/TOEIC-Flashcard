import React from 'react';
import { UploadCloud, Smile, WifiOff, ChevronRight } from 'lucide-react';

export const LandingFeatures: React.FC = React.memo(() => {
  return (
    <section id="smart-features" className="py-16 px-4 sm:px-6 max-w-7xl mx-auto w-full border-t border-white/[0.06]">
      <div data-aos="fade-up" className="text-center max-w-3xl mx-auto mb-12">
        <span className="text-xs font-black uppercase tracking-widest text-sky-400 bg-sky-500/10 px-3 py-1.5 rounded-full border border-sky-400/20 inline-block mb-3">
          Tính Năng Đột Phá
        </span>
        <h2 className="text-2xl sm:text-4xl font-black text-white leading-tight mb-3">
          Không Chỉ Là Flashcard Đơn Thuần
        </h2>
        <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
          LetStuN cung cấp trọn bộ công cụ mạnh mẽ hỗ trợ mọi nhu cầu học tập của bạn,
          từ học sinh nhỏ tuổi tới người đi làm bận rộn.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-5" data-aos="fade-up">
        {/* Feature 1: Word Bank & Import */}
        <div className="p-6 rounded-3xl bg-slate-900/60 border border-white/[0.08] hover:border-amber-400/30 card-hover-smooth flex flex-col justify-between space-y-4">
          <div className="space-y-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/15 border border-amber-500/25 flex items-center justify-center text-amber-400">
              <UploadCloud className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-white">
              Tự Tạo Kho Từ • Nhập File Tự Động
            </h3>
            <p className="text-xs text-slate-300 leading-relaxed">
              Nhập danh sách từ vựng từ Excel, CSV, file PDF tài liệu hoặc chụp ảnh OCR.
              AI tự động tra phiên âm, dịch nghĩa và sinh câu ví dụ mẫu trong 3 giây.
            </p>
          </div>
          <a
            href="https://app.letstun.site/vocabulary"
            className="text-xs font-bold text-amber-400 hover:underline flex items-center gap-1 pt-2"
          >
            <span>Khám phá Word Bank</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </a>
        </div>

        {/* Feature 2: Kids World */}
        <div className="p-6 rounded-3xl bg-slate-900/60 border border-white/[0.08] hover:border-pink-400/30 card-hover-smooth flex flex-col justify-between space-y-4">
          <div className="space-y-3">
            <div className="w-10 h-10 rounded-2xl bg-pink-500/15 border border-pink-500/25 flex items-center justify-center text-pink-400">
              <Smile className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-white">
              LetStuN Kid: Không Gian Cho Bé
            </h3>
            <p className="text-xs text-slate-300 leading-relaxed">
              Thiết kế giao diện tươi sáng thân thiện, game ghép tranh, phát âm mẫu âm thanh
              sinh động và hệ thống sticker khen thưởng khích lệ tư duy ngôn ngữ sớm.
            </p>
          </div>
          <a
            href="https://kid.letstun.site"
            className="text-xs font-bold text-pink-400 hover:underline flex items-center gap-1 pt-2"
          >
            <span>Trải nghiệm Thế Giới Bé</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </a>
        </div>

        {/* Feature 3: Offline Sync */}
        <div className="p-6 rounded-3xl bg-slate-900/60 border border-white/[0.08] hover:border-emerald-400/30 card-hover-smooth flex flex-col justify-between space-y-4">
          <div className="space-y-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-500/15 border border-emerald-500/25 flex items-center justify-center text-emerald-400">
              <WifiOff className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-white">
              Học Ngoại Tuyến (Offline PWA)
            </h3>
            <p className="text-xs text-slate-300 leading-relaxed">
              Lưu bộ từ vựng vào bộ nhớ máy qua IndexedDB. Ôn bài trên xe bus, máy bay
              hoặc khi không có internet. Tự động đồng bộ tiến độ khi kết nối mạng trở lại.
            </p>
          </div>
          <a
            href="https://app.letstun.site/dashboard"
            className="text-xs font-bold text-emerald-400 hover:underline flex items-center gap-1 pt-2"
          >
            <span>Cài đặt ứng dụng PWA</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </a>
        </div>
      </div>
    </section>
  );
});

LandingFeatures.displayName = 'LandingFeatures';
