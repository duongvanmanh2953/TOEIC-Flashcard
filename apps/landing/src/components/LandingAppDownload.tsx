import React, { useState } from 'react';
import {
  Smartphone,
  Download,
  CheckCircle2,
  Zap,
  PenTool,
  Sparkles,
  Volume2,
  ShieldCheck,
  ArrowRight,
  Share,
  PlusSquare,
  HelpCircle,
  FileCode2,
} from 'lucide-react';
import { GlassSurface } from './GlassSurface';

export const LandingAppDownload: React.FC = React.memo(() => {
  const [selectedOS, setSelectedOS] = useState<'android' | 'ios'>('android');
  const [showIOSModal, setShowIOSModal] = useState(false);

  return (
    <section id="download-app" className="py-16 sm:py-20 px-4 sm:px-6 max-w-7xl mx-auto w-full border-t border-white/[0.06]">
      {/* Header: Title and OS Selector Toggle */}
      <div className="text-center max-w-3xl mx-auto space-y-4 mb-10 sm:mb-14" data-aos="fade-up">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-indigo-500/10 border border-indigo-400/25 text-indigo-300 text-xs font-bold">
          <Smartphone className="w-4 h-4 text-indigo-400 shrink-0" />
          <span>Ứng Dụng Di Động • VocabFlow Mobile</span>
        </div>

        <h2 className="text-2xl sm:text-4xl lg:text-5xl font-black text-white tracking-tight leading-snug">
          Học mọi lúc, mọi nơi trên{' '}
          <span className="bg-gradient-to-r from-emerald-400 via-teal-300 to-cyan-300 bg-clip-text text-transparent">
            Android
          </span>{' '}
          và{' '}
          <span className="bg-gradient-to-r from-slate-200 via-indigo-200 to-blue-300 bg-clip-text text-transparent">
            iOS
          </span>
        </h2>

        <p className="text-xs sm:text-sm text-slate-300 leading-relaxed max-w-2xl mx-auto">
          Toàn bộ sức mạnh của thuật toán Spaced Repetition FSRS, phòng luyện thi ETS và bảng viết chữ tương tác ngay trong tầm tay bạn.
        </p>

        {/* Dual OS Switcher Pills */}
        <div className="inline-flex items-center p-1.5 rounded-2xl bg-white/[0.05] border border-white/[0.1] shadow-xl gap-1">
          <button
            type="button"
            onClick={() => setSelectedOS('android')}
            className={`flex items-center gap-2.5 px-5 py-2.5 rounded-xl text-xs sm:text-sm font-extrabold transition-all duration-200 cursor-pointer ${
              selectedOS === 'android'
                ? 'bg-gradient-to-r from-emerald-500 to-teal-500 text-slate-950 shadow-lg shadow-emerald-500/25 scale-[1.02]'
                : 'text-slate-300 hover:text-white hover:bg-white/[0.05]'
            }`}
          >
            {/* Official Android Robot Icon SVG */}
            <svg className="w-4 h-4 shrink-0 fill-current" viewBox="0 0 24 24">
              <path d="M17.523 15.3414c-.5511 0-.9993-.4486-.9993-.9997s.4482-.9993.9993-.9993c.551 0 .9993.4482.9993.9993.0001.5511-.4483.9997-.9993.9997m-11.046 0c-.5511 0-.9993-.4486-.9993-.9997s.4482-.9993.9993-.9993c.5511 0 .9993.4482.9993.9993 0 .5511-.4482.9997-.9993.9997m11.4045-6.02l1.997-3.459a.416.416 0 00-.152-.568.416.416 0 00-.568.152l-2.022 3.503c-1.579-.723-3.359-1.129-5.234-1.129s-3.655.406-5.234 1.129L4.642 5.4464a.4158.4158 0 00-.568-.152.416.416 0 00-.152.568l1.997 3.459C2.688 11.0864.5 15.0874.5 19.6734h23c0-4.586-2.188-8.587-5.3815-10.352" />
            </svg>
            <span>Android (APK v1.1.0)</span>
          </button>

          <button
            type="button"
            onClick={() => setSelectedOS('ios')}
            className={`flex items-center gap-2.5 px-5 py-2.5 rounded-xl text-xs sm:text-sm font-extrabold transition-all duration-200 cursor-pointer ${
              selectedOS === 'ios'
                ? 'bg-gradient-to-r from-slate-200 via-slate-100 to-white text-slate-950 shadow-lg shadow-white/20 scale-[1.02]'
                : 'text-slate-300 hover:text-white hover:bg-white/[0.05]'
            }`}
          >
            {/* Official Apple Logo SVG */}
            <svg className="w-4 h-4 shrink-0 fill-current" viewBox="0 0 170 170">
              <path d="M150.37 130.25c-2.45 5.66-5.35 10.87-8.71 15.66-4.58 6.53-8.33 11.05-11.22 13.56-4.48 4.12-9.28 6.23-14.42 6.35-3.69 0-8.14-1.05-13.32-3.18-5.19-2.12-9.97-3.17-14.34-3.17-4.58 0-9.49 1.05-14.75 3.17-5.26 2.13-9.5 3.24-12.74 3.35-4.35.13-9.16-1.9-14.42-6.08-3.7-3.04-7.59-7.71-11.66-14.01-6.2-9.68-11.03-20.91-14.48-33.68-3.46-12.77-5.19-24.81-5.19-36.12 0-14.13 3.65-25.75 10.95-34.86 7.3-9.11 16.5-13.79 27.6-14.05 4.9 0 10.32 1.34 16.27 4.02 5.95 2.68 10.15 4.07 12.61 4.17 1.84 0 6.18-1.42 13.01-4.27 6.83-2.85 12.82-4.14 17.96-3.87 13.84.77 24.83 5.79 32.96 15.06-12.21 7.42-18.17 17.65-17.89 30.68.27 10.24 4.35 18.89 12.23 25.96 7.89 7.07 17.3 11.03 28.24 11.89-2.29 6.86-5.01 13.76-8.16 20.7zM119.22 31.84c0-7.39 2.67-14.28 8.01-20.67 5.34-6.39 12.02-10.45 20.03-12.17.11 1.09.16 2.06.16 2.91 0 7.39-2.84 14.52-8.52 21.39-5.68 6.87-12.44 10.82-20.28 11.85-.32-1.09-.4-2.2-.4-3.31z" />
            </svg>
            <span>iOS (iPhone & iPad)</span>
          </button>
        </div>
      </div>

      {/* Main Dual Grid: Feature description & Interactive OS Card */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
        {/* Left Column: Shared Core Strengths & Dynamic Action CTA */}
        <div className="lg:col-span-7 space-y-6 text-left" data-aos="fade-up">
          <div className="space-y-3">
            <h3 className="text-xl sm:text-3xl font-black text-white tracking-tight leading-snug">
              {selectedOS === 'android' ? (
                <>
                  Trải nghiệm mượt mà 60 FPS trên điện thoại{' '}
                  <span className="text-emerald-400">Android</span>
                </>
              ) : (
                <>
                  Tối ưu cảm ứng Retina toàn màn hình trên{' '}
                  <span className="text-slate-200">iPhone & iPad</span>
                </>
              )}
            </h3>
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed max-w-2xl">
              {selectedOS === 'android'
                ? 'Tải và cài đặt trực tiếp file APK v1.1.0 không cần qua Google Play. Tích hợp trọn vẹn âm thanh bản xứ Google TTS, ghi chú 1-chạm và đồng bộ đám mây tức thì.'
                : 'Cài đặt tức thì qua Safari Web Clip (PWA 1 chạm) hoặc Hồ sơ cấu hình Apple Profile. Ứng dụng chạy toàn màn hình độc lập, không thanh URL, mở nhanh và lưu trữ ngoại tuyến.'}
            </p>
          </div>

          {/* 4 Feature Highlights Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 pt-1">
            <div className="p-3.5 rounded-2xl bg-white/[0.03] border border-white/[0.08] flex items-start gap-3">
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

            <div className="p-3.5 rounded-2xl bg-white/[0.03] border border-white/[0.08] flex items-start gap-3">
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

            <div className="p-3.5 rounded-2xl bg-white/[0.03] border border-white/[0.08] flex items-start gap-3">
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

            <div className="p-3.5 rounded-2xl bg-white/[0.03] border border-white/[0.08] flex items-start gap-3">
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

          {/* Action Download Buttons for active OS */}
          <div className="pt-2 flex flex-wrap items-center gap-3">
            {selectedOS === 'android' ? (
              <>
                <a
                  href="/downloads/vocabflow.apk?v=1.1.0"
                  download="vocabflow.apk"
                  className="px-6 py-3.5 rounded-2xl bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500 hover:from-emerald-400 hover:to-cyan-400 text-slate-950 font-black text-sm flex items-center gap-2.5 shadow-lg shadow-emerald-500/25 transition-all duration-200 hover:scale-[1.02] active:scale-98"
                >
                  <Download className="w-5 h-5 text-slate-950" />
                  <span>Tải file APK (Android)</span>
                  <span className="text-[10px] font-black uppercase bg-black/20 text-slate-950 px-2 py-0.5 rounded-full ml-1">
                    v1.1.0 • 26 MB
                  </span>
                </a>

                <button
                  type="button"
                  onClick={() => setSelectedOS('ios')}
                  className="btn-glass-secondary !py-3.5 !px-5 text-xs font-bold flex items-center gap-2 card-hover-smooth text-slate-300 hover:text-white"
                >
                  <AppleIcon className="w-4 h-4" />
                  <span>Xem bản cài đặt cho iPhone / iPad</span>
                </button>
              </>
            ) : (
              <>
                <a
                  href="https://app.vocalflow.site"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-6 py-3.5 rounded-2xl bg-gradient-to-r from-slate-100 via-white to-slate-200 hover:from-white hover:to-slate-100 text-slate-950 font-black text-sm flex items-center gap-2.5 shadow-lg shadow-white/20 transition-all duration-200 hover:scale-[1.02] active:scale-98"
                >
                  <AppleIcon className="w-5 h-5 text-slate-950" />
                  <span>Cài đặt trên iPhone qua Safari (PWA)</span>
                  <ArrowRight className="w-4 h-4" />
                </a>

                <a
                  href="/downloads/vocabflow.mobileconfig"
                  download="vocabflow.mobileconfig"
                  className="btn-glass-secondary !py-3.5 !px-4 text-xs font-bold flex items-center gap-2 card-hover-smooth border-slate-700 text-slate-300 hover:text-white"
                  title="Tải cấu hình WebClip Apple để thêm icon vào màn hình chính iPhone"
                >
                  <FileCode2 className="w-4 h-4 text-cyan-400" />
                  <span>Tải Hồ sơ iOS (.mobileconfig)</span>
                </a>

                <button
                  type="button"
                  onClick={() => setShowIOSModal(true)}
                  className="btn-glass-secondary !py-3.5 !px-4 text-xs font-bold flex items-center gap-1.5 text-indigo-300 hover:text-indigo-200"
                >
                  <HelpCircle className="w-4 h-4" />
                  <span>Xem hướng dẫn 3 bước</span>
                </button>
              </>
            )}
          </div>
        </div>

        {/* Right Column: Visual Mockup / Installation Card with OS Branding */}
        <div className="lg:col-span-5" data-aos="fade-up" data-aos-delay="100">
          {selectedOS === 'android' ? (
            /* ANDROID CARD */
            <GlassSurface className="p-6 sm:p-7 border border-emerald-500/25 bg-gradient-to-b from-slate-900/95 via-slate-900/70 to-slate-950/95 space-y-5 shadow-2xl relative overflow-hidden rounded-3xl">
              {/* Background Glow */}
              <div className="absolute -top-16 -right-16 w-48 h-48 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

              {/* Top OS Badge */}
              <div className="flex items-center justify-between pb-3.5 border-b border-white/[0.08] relative z-10">
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 flex items-center justify-center p-2 shadow-inner">
                    <AndroidIcon className="w-full h-full text-emerald-400" />
                  </div>
                  <div className="text-left">
                    <div className="flex items-center gap-1.5">
                      <h4 className="text-sm font-extrabold text-white">VocabFlow for Android</h4>
                      <span className="text-[9px] font-black uppercase px-1.5 py-0.2 rounded-md bg-emerald-500/20 text-emerald-300">
                        APK
                      </span>
                    </div>
                    <p className="text-[10px] text-slate-400">Gói cài đặt độc lập (Sideload APK)</p>
                  </div>
                </div>
                <span className="text-[10px] font-black px-2.5 py-1 rounded-full bg-emerald-500/15 text-emerald-300 border border-emerald-500/25 shadow-xs">
                  v1.1.0 Mới Nhất
                </span>
              </div>

              {/* Visual Mockup & Install steps */}
              <div className="space-y-3 relative z-10 text-left">
                <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider block">
                  3 bước cài đặt APK trên điện thoại Android:
                </span>

                <div className="space-y-2.5">
                  <div className="p-3 rounded-2xl bg-white/[0.03] border border-white/[0.06] flex items-start gap-3">
                    <div className="w-6 h-6 rounded-lg bg-emerald-500/20 text-emerald-300 text-xs font-black flex items-center justify-center shrink-0 mt-0.5">
                      1
                    </div>
                    <div>
                      <p className="text-xs font-bold text-white">Tải file APK về điện thoại</p>
                      <p className="text-[11px] text-slate-400">
                        Bấm nút "Tải file APK" phía dưới. File được tải trực tiếp từ máy chủ VocabFlow.
                      </p>
                    </div>
                  </div>

                  <div className="p-3 rounded-2xl bg-white/[0.03] border border-white/[0.06] flex items-start gap-3">
                    <div className="w-6 h-6 rounded-lg bg-cyan-500/20 text-cyan-300 text-xs font-black flex items-center justify-center shrink-0 mt-0.5">
                      2
                    </div>
                    <div>
                      <p className="text-xs font-bold text-white">Cho phép cài đặt từ nguồn này</p>
                      <p className="text-[11px] text-slate-400">
                        Nếu Android thông báo "Cài đặt ứng dụng không rõ nguồn", hãy chọn <strong>Cho phép (Allow)</strong>.
                      </p>
                    </div>
                  </div>

                  <div className="p-3 rounded-2xl bg-white/[0.03] border border-white/[0.06] flex items-start gap-3">
                    <div className="w-6 h-6 rounded-lg bg-indigo-500/20 text-indigo-300 text-xs font-black flex items-center justify-center shrink-0 mt-0.5">
                      3
                    </div>
                    <div>
                      <p className="text-xs font-bold text-white">Mở app và trải nghiệm ngay</p>
                      <p className="text-[11px] text-slate-400">
                        Đăng nhập tài khoản Google / Facebook hoặc học ngay dưới dạng Khách.
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Direct Trigger Button */}
              <div className="pt-2 relative z-10">
                <a
                  href="/downloads/vocabflow.apk?v=1.1.0"
                  download="vocabflow.apk"
                  className="w-full py-3.5 px-4 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-black text-xs flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/25 transition active:scale-98"
                >
                  <Download className="w-4 h-4 text-slate-950" />
                  <span>Bấm để tải ngay vocabflow.apk v1.1.0 (26 MB)</span>
                </a>
              </div>
            </GlassSurface>
          ) : (
            /* IOS CARD */
            <GlassSurface className="p-6 sm:p-7 border border-white/20 bg-gradient-to-b from-slate-900/95 via-slate-900/70 to-slate-950/95 space-y-5 shadow-2xl relative overflow-hidden rounded-3xl">
              {/* Background Glow */}
              <div className="absolute -top-16 -right-16 w-48 h-48 bg-slate-300/10 rounded-full blur-3xl pointer-events-none" />

              {/* Top OS Badge */}
              <div className="flex items-center justify-between pb-3.5 border-b border-white/[0.08] relative z-10">
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-2xl bg-white/10 border border-white/25 text-white flex items-center justify-center p-2 shadow-inner">
                    <AppleIcon className="w-full h-full text-white" />
                  </div>
                  <div className="text-left">
                    <div className="flex items-center gap-1.5">
                      <h4 className="text-sm font-extrabold text-white">VocabFlow for iOS</h4>
                      <span className="text-[9px] font-black uppercase px-1.5 py-0.2 rounded-md bg-white/15 text-slate-200">
                        iPhone & iPad
                      </span>
                    </div>
                    <p className="text-[10px] text-slate-400">WebClip / PWA Toàn Màn Hình</p>
                  </div>
                </div>
                <span className="text-[10px] font-black px-2.5 py-1 rounded-full bg-white/10 text-slate-200 border border-white/20 shadow-xs">
                  iOS 14+ Retina
                </span>
              </div>

              {/* Visual Mockup & Install steps */}
              <div className="space-y-3 relative z-10 text-left">
                <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider block">
                  3 bước thêm vào màn hình chính iPhone (Không cần App Store):
                </span>

                <div className="space-y-2.5">
                  <div className="p-3 rounded-2xl bg-white/[0.03] border border-white/[0.06] flex items-start gap-3">
                    <div className="w-6 h-6 rounded-lg bg-slate-200 text-slate-950 text-xs font-black flex items-center justify-center shrink-0 mt-0.5">
                      1
                    </div>
                    <div>
                      <p className="text-xs font-bold text-white flex items-center gap-1.5">
                        <span>Mở Safari vào app</span>
                        <span className="text-[10px] text-indigo-400 font-mono">app.vocalflow.site</span>
                      </p>
                      <p className="text-[11px] text-slate-400">
                        Sử dụng trình duyệt <strong>Safari mặc định</strong> trên iPhone hoặc iPad.
                      </p>
                    </div>
                  </div>

                  <div className="p-3 rounded-2xl bg-white/[0.03] border border-white/[0.06] flex items-start gap-3">
                    <div className="w-6 h-6 rounded-lg bg-cyan-500/20 text-cyan-300 text-xs font-black flex items-center justify-center shrink-0 mt-0.5">
                      2
                    </div>
                    <div>
                      <p className="text-xs font-bold text-white flex items-center gap-1.5">
                        <span>Bấm nút Chia sẻ</span>
                        <Share className="w-3.5 h-3.5 text-cyan-400 inline" />
                      </p>
                      <p className="text-[11px] text-slate-400">
                        Ở thanh điều hướng dưới cùng của Safari, bấm nút <strong>Chia sẻ (biểu tượng hình vuông có mũi tên hướng lên)</strong>.
                      </p>
                    </div>
                  </div>

                  <div className="p-3 rounded-2xl bg-white/[0.03] border border-white/[0.06] flex items-start gap-3">
                    <div className="w-6 h-6 rounded-lg bg-indigo-500/20 text-indigo-300 text-xs font-black flex items-center justify-center shrink-0 mt-0.5">
                      3
                    </div>
                    <div>
                      <p className="text-xs font-bold text-white flex items-center gap-1.5">
                        <span>Chọn "Thêm vào MH chính"</span>
                        <PlusSquare className="w-3.5 h-3.5 text-indigo-400 inline" />
                      </p>
                      <p className="text-[11px] text-slate-400">
                        Bấm <strong>"Thêm vào MH chính" (Add to Home Screen)</strong>. Ứng dụng sẽ có icon riêng và mở toàn màn hình độc lập!
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Direct Trigger Button */}
              <div className="pt-2 relative z-10 flex flex-col sm:flex-row gap-2">
                <a
                  href="https://app.vocalflow.site"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 py-3.5 px-4 rounded-2xl bg-gradient-to-r from-slate-100 to-white hover:from-white hover:to-slate-100 text-slate-950 font-black text-xs flex items-center justify-center gap-2 shadow-lg shadow-white/20 transition active:scale-98"
                >
                  <AppleIcon className="w-4 h-4 text-slate-950" />
                  <span>Mở Safari cài đặt 1-chạm</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </a>

                <a
                  href="/downloads/vocabflow.mobileconfig"
                  download="vocabflow.mobileconfig"
                  className="py-3.5 px-4 rounded-2xl bg-white/[0.06] hover:bg-white/[0.1] border border-white/20 text-slate-200 font-bold text-xs flex items-center justify-center gap-1.5 transition"
                  title="Cài đặt qua Profile Cấu hình Apple"
                >
                  <Download className="w-3.5 h-3.5 text-slate-300" />
                  <span>File .mobileconfig</span>
                </a>
              </div>
            </GlassSurface>
          )}
        </div>
      </div>

      {/* iOS Modal Guide Popup */}
      {showIOSModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200"
          onClick={() => setShowIOSModal(false)}
        >
          <div
            className="max-w-lg w-full rounded-3xl bg-[#090D16] border border-white/20 p-6 space-y-5 shadow-2xl relative"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-3 border-b border-white/[0.08]">
              <div className="flex items-center gap-2.5">
                <AppleIcon className="w-5 h-5 text-white" />
                <h4 className="font-extrabold text-base text-white">Hướng dẫn cài đặt VocabFlow trên iOS</h4>
              </div>
              <button
                type="button"
                onClick={() => setShowIOSModal(false)}
                className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-slate-300 hover:text-white transition"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4 text-left text-xs text-slate-300">
              <p className="leading-relaxed">
                Vì Apple quản lý chứng chỉ bảo mật độc quyền nên không thể tải file <code>.ipa</code> tự do như file APK trên Android. Bạn có 2 cách cài đặt tiện lợi nhất:
              </p>

              <div className="p-3.5 rounded-2xl bg-white/[0.04] border border-white/[0.08] space-y-2">
                <span className="font-bold text-white text-xs block text-emerald-400">
                  Cách 1: Thêm vào Màn hình chính (PWA Fullscreen — Khuyên dùng)
                </span>
                <ol className="list-decimal list-inside space-y-1 text-[11px] text-slate-300">
                  <li>Mở trình duyệt <strong>Safari</strong> trên iPhone.</li>
                  <li>Truy cập vào địa chỉ <strong>https://app.vocalflow.site</strong>.</li>
                  <li>Bấm vào biểu tượng <strong>Chia sẻ (hình vuông mũi tên lên ⎋)</strong> ở thanh dưới cùng.</li>
                  <li>Cuộn xuống và chọn <strong>"Thêm vào MH chính" (Add to Home Screen)</strong>.</li>
                </ol>
              </div>

              <div className="p-3.5 rounded-2xl bg-white/[0.04] border border-white/[0.08] space-y-2">
                <span className="font-bold text-white text-xs block text-cyan-400">
                  Cách 2: Cài đặt qua Hồ sơ cấu hình Apple (.mobileconfig)
                </span>
                <p className="text-[11px] text-slate-400 leading-relaxed">
                  Tải file <code>vocabflow.mobileconfig</code> về máy &rarr; Vào <strong>Cài đặt (Settings)</strong> trên iPhone &rarr; Chọn <strong>Đã tải về hồ sơ</strong> &rarr; Bấm <strong>Cài đặt (Install)</strong>. Icon VocabFlow sẽ xuất hiện ngay trên màn hình chính!
                </p>
              </div>
            </div>

            <div className="pt-2 flex items-center gap-2">
              <a
                href="https://app.vocalflow.site"
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => setShowIOSModal(false)}
                className="flex-1 py-3 rounded-xl bg-white text-slate-950 font-black text-xs text-center flex items-center justify-center gap-1.5"
              >
                <span>Mở Safari Ngay</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </a>
              <button
                type="button"
                onClick={() => setShowIOSModal(false)}
                className="py-3 px-5 rounded-xl bg-white/10 text-white font-bold text-xs hover:bg-white/15 transition"
              >
                Đã hiểu
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
});

LandingAppDownload.displayName = 'LandingAppDownload';

// Official Android Bugdroid Icon
function AndroidIcon({ className = 'w-4 h-4' }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M17.523 15.3414c-.5511 0-.9993-.4486-.9993-.9997s.4482-.9993.9993-.9993c.551 0 .9993.4482.9993.9993.0001.5511-.4483.9997-.9993.9997m-11.046 0c-.5511 0-.9993-.4486-.9993-.9997s.4482-.9993.9993-.9993c.5511 0 .9993.4482.9993.9993 0 .5511-.4482.9997-.9993.9997m11.4045-6.02l1.997-3.459a.416.416 0 00-.152-.568.416.416 0 00-.568.152l-2.022 3.503c-1.579-.723-3.359-1.129-5.234-1.129s-3.655.406-5.234 1.129L4.642 5.4464a.4158.4158 0 00-.568-.152.416.416 0 00-.152.568l1.997 3.459C2.688 11.0864.5 15.0874.5 19.6734h23c0-4.586-2.188-8.587-5.3815-10.352" />
    </svg>
  );
}

// Official Apple Icon
function AppleIcon({ className = 'w-4 h-4' }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 170 170" fill="currentColor">
      <path d="M150.37 130.25c-2.45 5.66-5.35 10.87-8.71 15.66-4.58 6.53-8.33 11.05-11.22 13.56-4.48 4.12-9.28 6.23-14.42 6.35-3.69 0-8.14-1.05-13.32-3.18-5.19-2.12-9.97-3.17-14.34-3.17-4.58 0-9.49 1.05-14.75 3.17-5.26 2.13-9.5 3.24-12.74 3.35-4.35.13-9.16-1.9-14.42-6.08-3.7-3.04-7.59-7.71-11.66-14.01-6.2-9.68-11.03-20.91-14.48-33.68-3.46-12.77-5.19-24.81-5.19-36.12 0-14.13 3.65-25.75 10.95-34.86 7.3-9.11 16.5-13.79 27.6-14.05 4.9 0 10.32 1.34 16.27 4.02 5.95 2.68 10.15 4.07 12.61 4.17 1.84 0 6.18-1.42 13.01-4.27 6.83-2.85 12.82-4.14 17.96-3.87 13.84.77 24.83 5.79 32.96 15.06-12.21 7.42-18.17 17.65-17.89 30.68.27 10.24 4.35 18.89 12.23 25.96 7.89 7.07 17.3 11.03 28.24 11.89-2.29 6.86-5.01 13.76-8.16 20.7zM119.22 31.84c0-7.39 2.67-14.28 8.01-20.67 5.34-6.39 12.02-10.45 20.03-12.17.11 1.09.16 2.06.16 2.91 0 7.39-2.84 14.52-8.52 21.39-5.68 6.87-12.44 10.82-20.28 11.85-.32-1.09-.4-2.2-.4-3.31z" />
    </svg>
  );
}
