import React from 'react';
import { Smartphone, Download, CheckCircle2, Zap, PenTool, Sparkles, Volume2, ShieldCheck, ArrowRight } from 'lucide-react';
import { GlassSurface } from './GlassSurface';

export const LandingAppDownload: React.FC = React.memo(() => {
  return (
    <section id="download-app" className="py-16 px-4 sm:px-6 max-w-7xl mx-auto w-full border-t border-white/[0.06]">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
        {/* Left Column: Information & Value */}
        <div className="lg:col-span-7 space-y-6 text-left" data-aos="fade-up">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-400/25 text-emerald-300 text-xs font-bold">
            <Smartphone className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>Ứng Dụng Di Động Android • VocabFlow Mobile</span>
          </div>

          <div className="space-y-3">
            <h2 className="text-2xl sm:text-4xl font-black text-white tracking-tight leading-snug">
              Học thông minh, phản xạ tức thì trên điện thoại Android
            </h2>
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed max-w-2xl">
              Đem toàn bộ sức mạnh của thuật toán Spaced Repetition FSRS, phòng luyện thi ETS và bảng viết chữ tương tác lên chiếc smartphone của bạn. Mượt mà, tiết kiệm pin và tối ưu thao tác 1 tay.
            </p>
          </div>

          {/* 4 Feature Highlights Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 pt-2">
            <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/[0.08] flex items-start gap-3">
              <div className="p-2 rounded-xl bg-indigo-500/15 text-indigo-400 shrink-0 mt-0.5">
                <PenTool className="w-4 h-4" />
              </div>
              <div className="space-y-0.5">
                <h4 className="text-xs font-extrabold text-white">Luyện viết chữ cảm ứng</h4>
                <p className="text-[11px] text-slate-400 leading-relaxed">
                  Nhận diện từng nét bút Kanji, Kana, Hán tự mượt mà chuẩn xác trên màn hình cảm ứng.
                </p>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/[0.08] flex items-start gap-3">
              <div className="p-2 rounded-xl bg-cyan-500/15 text-cyan-400 shrink-0 mt-0.5">
                <Zap className="w-4 h-4" />
              </div>
              <div className="space-y-0.5">
                <h4 className="text-xs font-extrabold text-white">Tốc độ phản xạ 60 FPS</h4>
                <p className="text-[11px] text-slate-400 leading-relaxed">
                  Lật thẻ từ vựng chớp nhoáng, chuyển bài mượt mà không độ trễ.
                </p>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/[0.08] flex items-start gap-3">
              <div className="p-2 rounded-xl bg-violet-500/15 text-violet-400 shrink-0 mt-0.5">
                <Volume2 className="w-4 h-4" />
              </div>
              <div className="space-y-0.5">
                <h4 className="text-xs font-extrabold text-white">Âm thanh chuẩn bản xứ</h4>
                <p className="text-[11px] text-slate-400 leading-relaxed">
                  Phát âm song ngữ IPA chuẩn xác cho 7 ngôn ngữ lớn ngay trên loa điện thoại.
                </p>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/[0.08] flex items-start gap-3">
              <div className="p-2 rounded-xl bg-emerald-500/15 text-emerald-400 shrink-0 mt-0.5">
                <ShieldCheck className="w-4 h-4" />
              </div>
              <div className="space-y-0.5">
                <h4 className="text-xs font-extrabold text-white">Đồng bộ đám mây tức thì</h4>
                <p className="text-[11px] text-slate-400 leading-relaxed">
                  Học trên điện thoại, tiếp tục trên máy tính mà không bao giờ mất chuỗi streak.
                </p>
              </div>
            </div>
          </div>

          {/* Action Download Buttons */}
          <div className="pt-3 flex flex-wrap items-center gap-3.5">
            <a
              href="/downloads/vocabflow.apk"
              download="vocabflow.apk"
              className="px-6 py-3.5 rounded-2xl bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500 hover:from-emerald-400 hover:to-cyan-400 text-slate-950 font-black text-sm flex items-center gap-2.5 shadow-lg shadow-emerald-500/25 transition-all duration-200 hover:scale-[1.02] active:scale-98"
            >
              <Download className="w-5 h-5 text-slate-950" />
              <span>Tải file APK (Android)</span>
              <span className="text-[10px] font-black uppercase bg-black/20 text-slate-950 px-2 py-0.5 rounded-full ml-1">
                25 MB
              </span>
            </a>

            <a
              href="https://app.vocalflow.site/dashboard"
              className="btn-glass-secondary !py-3.5 !px-5 text-sm font-bold flex items-center gap-2 card-hover-smooth text-slate-300 hover:text-white"
            >
              <span>Dùng trực tiếp bản Web</span>
              <ArrowRight className="w-4 h-4" />
            </a>
          </div>
        </div>

        {/* Right Column: Visual Mockup / Installation Card */}
        <div className="lg:col-span-5" data-aos="fade-up" data-aos-delay="100">
          <GlassSurface className="p-6 sm:p-7 border border-emerald-500/20 bg-gradient-to-b from-slate-900/90 via-slate-900/60 to-slate-950/90 space-y-5 shadow-2xl relative overflow-hidden">
            {/* Top Badge */}
            <div className="flex items-center justify-between pb-3 border-b border-white/[0.08]">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-emerald-500/15 text-emerald-400 flex items-center justify-center font-black">
                  <Smartphone className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-extrabold text-white">VocabFlow Android</h3>
                  <p className="text-[10px] text-slate-400">Gói cài đặt trực tiếp APK</p>
                </div>
              </div>
              <span className="text-[10px] font-black px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-300 border border-emerald-500/20">
                v1.0.0 Stable
              </span>
            </div>

            {/* Step-by-Step Install Instructions */}
            <div className="space-y-3">
              <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider block text-left">
                3 bước cài đặt đơn giản trên Android:
              </span>

              <div className="space-y-2.5 text-left">
                <div className="p-3 rounded-xl bg-white/[0.03] border border-white/[0.06] flex items-start gap-3">
                  <div className="w-6 h-6 rounded-lg bg-emerald-500/20 text-emerald-300 text-xs font-black flex items-center justify-center shrink-0">
                    1
                  </div>
                  <div>
                    <p className="text-xs font-bold text-white">Tải file APK về máy</p>
                    <p className="text-[11px] text-slate-400">
                      Bấm nút "Tải file APK" phía trên hoặc tải trực tiếp từ trình duyệt.
                    </p>
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-white/[0.03] border border-white/[0.06] flex items-start gap-3">
                  <div className="w-6 h-6 rounded-lg bg-cyan-500/20 text-cyan-300 text-xs font-black flex items-center justify-center shrink-0">
                    2
                  </div>
                  <div>
                    <p className="text-xs font-bold text-white">Mở file và cho phép cài đặt</p>
                    <p className="text-[11px] text-slate-400">
                      Khi điện thoại hỏi "Cài đặt ứng dụng không rõ nguồn", chọn Cho phép (Allow from this source).
                    </p>
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-white/[0.03] border border-white/[0.06] flex items-start gap-3">
                  <div className="w-6 h-6 rounded-lg bg-indigo-500/20 text-indigo-300 text-xs font-black flex items-center justify-center shrink-0">
                    3
                  </div>
                  <div>
                    <p className="text-xs font-bold text-white">Mở ứng dụng & bắt đầu học</p>
                    <p className="text-[11px] text-slate-400">
                      Đăng nhập tài khoản hiện có của bạn hoặc trải nghiệm ngay dưới dạng khách.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Quick Direct Download Trigger Card */}
            <div className="pt-2">
              <a
                href="/downloads/vocabflow.apk"
                download="vocabflow.apk"
                className="w-full py-3 px-4 rounded-xl bg-white/[0.06] hover:bg-white/[0.1] border border-emerald-400/30 text-white font-bold text-xs flex items-center justify-center gap-2 transition"
              >
                <Download className="w-4 h-4 text-emerald-400" />
                <span>Bấm để tải ngay vocabflow.apk (25 MB)</span>
              </a>
            </div>
          </GlassSurface>
        </div>
      </div>
    </section>
  );
});

LandingAppDownload.displayName = 'LandingAppDownload';
