import React, { useState } from 'react';
import {
  Download,
  Zap,
  PenTool,
  Volume2,
  ShieldCheck,
  ArrowRight,
  Share,
  PlusSquare,
  HelpCircle,
  FileCode2,
  Sparkles,
  ExternalLink,
  Smartphone,
  Check,
  CheckCircle2,
} from 'lucide-react';
import { GlassSurface } from './GlassSurface';
import { AndroidIcon, AppleIcon } from './OSIcons';

export const LandingAppDownload: React.FC = React.memo(() => {
  const [activeTab, setActiveTab] = useState<'all' | 'android' | 'ios'>('all');
  const [showIOSModal, setShowIOSModal] = useState(false);

  return (
    <section id="download-app" className="py-16 sm:py-24 px-4 sm:px-6 max-w-7xl mx-auto w-full border-t border-white/[0.08] relative">
      {/* Background Ambient Lighting */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-emerald-500/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute top-1/3 right-1/4 w-96 h-96 bg-indigo-500/10 rounded-full blur-[120px] pointer-events-none" />

      {/* Header Section */}
      <div className="text-center max-w-3xl mx-auto space-y-4 mb-12 sm:mb-16 relative z-10" data-aos="fade-up">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-gradient-to-r from-emerald-500/15 via-teal-500/15 to-indigo-500/15 border border-white/10 text-slate-200 text-xs font-bold shadow-lg">
          <Smartphone className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>Ứng Dụng Di Động • VocabFlow Mobile</span>
        </div>

        <h2 className="text-2xl sm:text-4xl lg:text-5xl font-black text-white tracking-tight leading-tight">
          Học từ vựng mọi lúc mọi nơi trên{' '}
          <span className="text-[#87C527] drop-shadow-[0_0_20px_rgba(135,197,39,0.35)]">Android</span>
          {' '}&amp;{' '}
          <span className="bg-gradient-to-r from-slate-100 via-white to-slate-300 bg-clip-text text-transparent drop-shadow-[0_0_20px_rgba(255,255,255,0.35)]">
            iOS
          </span>
        </h2>

        <p className="text-xs sm:text-sm md:text-base text-slate-300 leading-relaxed max-w-2xl mx-auto">
          Tận hưởng trọn vẹn thuật toán lặp lại ngắt quãng <strong>FSRS v5</strong>, bộ luyện thi ETS độc quyền và bảng viết tay tương tác ngay trong túi áo của bạn.
        </p>

        {/* Tab Filters (All / Android / iOS) */}
        <div className="pt-2 flex justify-center">
          <div className="inline-flex items-center p-1 rounded-2xl bg-slate-900/80 border border-white/10 backdrop-blur-xl shadow-xl gap-1">
            <button
              type="button"
              onClick={() => setActiveTab('all')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all duration-200 cursor-pointer ${
                activeTab === 'all'
                  ? 'bg-white/15 text-white shadow-md'
                  : 'text-slate-400 hover:text-white hover:bg-white/[0.05]'
              }`}
            >
              Tất cả nền tảng (2)
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('android')}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-all duration-200 cursor-pointer ${
                activeTab === 'android'
                  ? 'bg-[#87C527]/20 text-[#87C527] border border-[#87C527]/40 shadow-[0_0_15px_rgba(135,197,39,0.25)]'
                  : 'text-slate-400 hover:text-[#87C527] hover:bg-white/[0.05]'
              }`}
            >
              <AndroidIcon className="w-3.5 h-3.5 shrink-0" />
              <span>Android APK</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('ios')}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-all duration-200 cursor-pointer ${
                activeTab === 'ios'
                  ? 'bg-white/20 text-white border border-white/30 shadow-[0_0_15px_rgba(255,255,255,0.2)]'
                  : 'text-slate-400 hover:text-white hover:bg-white/[0.05]'
              }`}
            >
              <AppleIcon className="w-3.5 h-3.5 shrink-0" fill="currentColor" />
              <span>iOS (iPhone/iPad)</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Dual Cards Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-stretch max-w-6xl mx-auto relative z-10">
        {/* =========================================================================
            CARD 1: ANDROID
        ========================================================================= */}
        {(activeTab === 'all' || activeTab === 'android') && (
          <GlassSurface
            className={`p-6 sm:p-8 rounded-3xl border border-[#87C527]/30 bg-gradient-to-b from-slate-900/95 via-[#0c1619]/90 to-slate-950/98 shadow-2xl relative overflow-hidden flex flex-col justify-between transition-all duration-300 hover:border-[#87C527]/60 group ${
              activeTab === 'android' ? 'lg:col-span-2 max-w-3xl mx-auto w-full' : ''
            }`}
            data-aos="fade-up"
            data-aos-delay="50"
          >
            {/* Glow blob */}
            <div className="absolute -top-20 -right-20 w-52 h-52 bg-[#87C527]/15 rounded-full blur-3xl pointer-events-none group-hover:bg-[#87C527]/25 transition-all duration-500" />

            <div className="space-y-6 relative z-10 text-left">
              {/* Header with user's exact Android SVG */}
              <div className="flex items-start justify-between gap-4 pb-5 border-b border-white/[0.08]">
                <div className="flex items-center gap-3.5">
                  <div className="w-14 h-14 rounded-2xl bg-[#87C527]/15 border border-[#87C527]/40 flex items-center justify-center p-2.5 shadow-[0_0_25px_rgba(135,197,39,0.3)] shrink-0 group-hover:scale-105 transition-transform">
                    <AndroidIcon className="w-full h-full" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-lg sm:text-xl font-black text-white">VocabFlow for Android</h3>
                      <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-[#87C527]/20 text-[#87C527] border border-[#87C527]/30">
                        APK Sideload
                      </span>
                    </div>
                    <p className="text-xs text-slate-400 mt-0.5">Bản cài đặt trực tiếp không qua CH Play</p>
                  </div>
                </div>

                <div className="text-right shrink-0">
                  <span className="inline-block text-[10px] font-black px-2.5 py-1 rounded-full bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
                    v1.1.0 Mới Nhất
                  </span>
                  <span className="block text-[10px] text-slate-400 font-mono mt-0.5">26 MB • Android 8.0+</span>
                </div>
              </div>

              {/* Feature Highlights Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-left">
                <div className="p-3 rounded-2xl bg-white/[0.03] border border-white/[0.06] flex items-start gap-2.5">
                  <Zap className="w-4 h-4 text-[#87C527] shrink-0 mt-0.5" />
                  <div>
                    <h4 className="text-xs font-bold text-white">Lật thẻ 60 FPS</h4>
                    <p className="text-[11px] text-slate-400">Tối ưu phần cứng WebView tăng tốc đồ họa GPU.</p>
                  </div>
                </div>

                <div className="p-3 rounded-2xl bg-white/[0.03] border border-white/[0.06] flex items-start gap-2.5">
                  <PenTool className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
                  <div>
                    <h4 className="text-xs font-bold text-white">Viết tay cảm ứng</h4>
                    <p className="text-[11px] text-slate-400">Nhận diện nét bút Kanji, Kana &amp; Hán tự mượt mà.</p>
                  </div>
                </div>

                <div className="p-3 rounded-2xl bg-white/[0.03] border border-white/[0.06] flex items-start gap-2.5">
                  <Volume2 className="w-4 h-4 text-teal-400 shrink-0 mt-0.5" />
                  <div>
                    <h4 className="text-xs font-bold text-white">Âm thanh chuẩn bản xứ</h4>
                    <p className="text-[11px] text-slate-400">Loa ngoài to rõ nét với giọng phát âm Google TTS.</p>
                  </div>
                </div>

                <div className="p-3 rounded-2xl bg-white/[0.03] border border-white/[0.06] flex items-start gap-2.5">
                  <ShieldCheck className="w-4 h-4 text-indigo-400 shrink-0 mt-0.5" />
                  <div>
                    <h4 className="text-xs font-bold text-white">Đồng bộ tức thì</h4>
                    <p className="text-[11px] text-slate-400">Học trên điện thoại, đồng bộ Spaced Repetition liên tục.</p>
                  </div>
                </div>
              </div>

              {/* 3 Quick Install Steps */}
              <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/[0.06] space-y-2 text-left">
                <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider block">
                  3 bước cài đặt APK trên Android:
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  <div className="flex items-center gap-2 text-[11px] text-slate-300">
                    <span className="w-5 h-5 rounded-full bg-[#87C527]/20 text-[#87C527] font-black flex items-center justify-center shrink-0 text-[10px]">
                      1
                    </span>
                    <span>Tải file APK về máy</span>
                  </div>
                  <div className="flex items-center gap-2 text-[11px] text-slate-300">
                    <span className="w-5 h-5 rounded-full bg-[#87C527]/20 text-[#87C527] font-black flex items-center justify-center shrink-0 text-[10px]">
                      2
                    </span>
                    <span>Bấm Cho phép cài đặt</span>
                  </div>
                  <div className="flex items-center gap-2 text-[11px] text-slate-300">
                    <span className="w-5 h-5 rounded-full bg-[#87C527]/20 text-[#87C527] font-black flex items-center justify-center shrink-0 text-[10px]">
                      3
                    </span>
                    <span>Mở app và học ngay!</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Primary Action Button */}
            <div className="pt-6 relative z-10">
              <a
                href="/downloads/vocabflow.apk?v=1.1.0"
                download="vocabflow.apk"
                className="w-full py-4 px-6 rounded-2xl bg-gradient-to-r from-[#87C527] via-emerald-400 to-teal-400 hover:from-[#9ae32d] hover:to-emerald-300 text-slate-950 font-black text-sm flex items-center justify-center gap-2.5 shadow-[0_0_25px_rgba(135,197,39,0.35)] transition-all duration-200 hover:scale-[1.01] active:scale-98 cursor-pointer"
              >
                <Download className="w-5 h-5 text-slate-950" />
                <div className="flex flex-col text-left sm:text-center leading-tight">
                  <span className="tracking-tight">TẢI APK CHO ANDROID (26 MB)</span>
                  <span className="text-[10px] font-bold text-slate-900/80">Phiên bản v1.1.0 • Cài đặt trực tiếp miễn phí</span>
                </div>
              </a>
            </div>
          </GlassSurface>
        )}

        {/* =========================================================================
            CARD 2: APPLE iOS
        ========================================================================= */}
        {(activeTab === 'all' || activeTab === 'ios') && (
          <GlassSurface
            className={`p-6 sm:p-8 rounded-3xl border border-white/20 bg-gradient-to-b from-slate-900/95 via-[#131926]/90 to-slate-950/98 shadow-2xl relative overflow-hidden flex flex-col justify-between transition-all duration-300 hover:border-white/40 group ${
              activeTab === 'ios' ? 'lg:col-span-2 max-w-3xl mx-auto w-full' : ''
            }`}
            data-aos="fade-up"
            data-aos-delay="100"
          >
            {/* Glow blob */}
            <div className="absolute -top-20 -right-20 w-52 h-52 bg-white/10 rounded-full blur-3xl pointer-events-none group-hover:bg-white/20 transition-all duration-500" />

            <div className="space-y-6 relative z-10 text-left">
              {/* Header with user's exact Apple SVG */}
              <div className="flex items-start justify-between gap-4 pb-5 border-b border-white/[0.08]">
                <div className="flex items-center gap-3.5">
                  <div className="w-14 h-14 rounded-2xl bg-white/10 border border-white/25 flex items-center justify-center p-2.5 shadow-[0_0_25px_rgba(255,255,255,0.2)] shrink-0 group-hover:scale-105 transition-transform text-white">
                    <AppleIcon className="w-full h-full" fill="#FFFFFF" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-lg sm:text-xl font-black text-white">VocabFlow for iOS</h3>
                      <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-white/15 text-slate-200 border border-white/25">
                        iPhone &amp; iPad
                      </span>
                    </div>
                    <p className="text-xs text-slate-400 mt-0.5">WebClip Retina &amp; PWA toàn màn hình 60 FPS</p>
                  </div>
                </div>

                <div className="text-right shrink-0">
                  <span className="inline-block text-[10px] font-black px-2.5 py-1 rounded-full bg-indigo-500/15 text-indigo-200 border border-indigo-400/30">
                    iOS 14+ Retina
                  </span>
                  <span className="block text-[10px] text-slate-400 font-mono mt-0.5">Standalone • Không giật lag</span>
                </div>
              </div>

              {/* Feature Highlights Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-left">
                <div className="p-3 rounded-2xl bg-white/[0.03] border border-white/[0.06] flex items-start gap-2.5">
                  <Smartphone className="w-4 h-4 text-white shrink-0 mt-0.5" />
                  <div>
                    <h4 className="text-xs font-bold text-white">Toàn màn hình độc lập</h4>
                    <p className="text-[11px] text-slate-400">Ẩn hoàn toàn thanh URL Safari, chuẩn giao diện Native.</p>
                  </div>
                </div>

                <div className="p-3 rounded-2xl bg-white/[0.03] border border-white/[0.06] flex items-start gap-2.5">
                  <Zap className="w-4 h-4 text-cyan-300 shrink-0 mt-0.5" />
                  <div>
                    <h4 className="text-xs font-bold text-white">Nitro Engine siêu tốc</h4>
                    <p className="text-[11px] text-slate-400">Khởi động ngay lập tức, cực nhẹ, tiết kiệm tối đa pin.</p>
                  </div>
                </div>

                <div className="p-3 rounded-2xl bg-white/[0.03] border border-white/[0.06] flex items-start gap-2.5">
                  <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  <div>
                    <h4 className="text-xs font-bold text-white">An toàn tuyệt đối</h4>
                    <p className="text-[11px] text-slate-400">Bảo mật chuẩn Apple Sandbox, không sợ thu hồi chứng chỉ.</p>
                  </div>
                </div>

                <div className="p-3 rounded-2xl bg-white/[0.03] border border-white/[0.06] flex items-start gap-2.5">
                  <Sparkles className="w-4 h-4 text-violet-300 shrink-0 mt-0.5" />
                  <div>
                    <h4 className="text-xs font-bold text-white">Học ngoại tuyến (Offline)</h4>
                    <p className="text-[11px] text-slate-400">Bộ nhớ đệm thông minh lưu từ vựng để ôn tập không cần mạng.</p>
                  </div>
                </div>
              </div>

              {/* 3 Quick Install Steps */}
              <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/[0.06] space-y-2 text-left">
                <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider block">
                  3 bước cài đặt 1-chạm trên iPhone (Không cần App Store):
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  <div className="flex items-center gap-2 text-[11px] text-slate-300">
                    <span className="w-5 h-5 rounded-full bg-white/20 text-white font-black flex items-center justify-center shrink-0 text-[10px]">
                      1
                    </span>
                    <span>Mở app bằng Safari</span>
                  </div>
                  <div className="flex items-center gap-2 text-[11px] text-slate-300">
                    <span className="w-5 h-5 rounded-full bg-white/20 text-white font-black flex items-center justify-center shrink-0 text-[10px]">
                      2
                    </span>
                    <span>Nhấn nút Chia sẻ (⎋)</span>
                  </div>
                  <div className="flex items-center gap-2 text-[11px] text-slate-300">
                    <span className="w-5 h-5 rounded-full bg-white/20 text-white font-black flex items-center justify-center shrink-0 text-[10px]">
                      3
                    </span>
                    <span>Chọn Thêm vào MH chính</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Action Buttons for iOS */}
            <div className="pt-6 relative z-10 space-y-2.5">
              {/* Option 1: Native IPA Package Download */}
              <a
                href="/downloads/vocabflow.ipa?v=1.1.0"
                download="vocabflow.ipa"
                className="w-full py-4 px-6 rounded-2xl bg-gradient-to-r from-slate-100 via-white to-slate-200 hover:from-white hover:to-slate-100 text-slate-950 font-black text-sm flex items-center justify-center gap-2.5 shadow-[0_0_25px_rgba(255,255,255,0.3)] transition-all duration-200 hover:scale-[1.01] active:scale-98 cursor-pointer group"
                title="Tải gói cài đặt VocabFlow .IPA cho iPhone/iPad"
              >
                <AppleIcon className="w-5 h-5 text-slate-950 group-hover:scale-110 transition-transform" fill="#000000" />
                <div className="flex flex-col text-left sm:text-center leading-tight">
                  <span className="tracking-tight flex items-center gap-1.5">
                    TẢI GÓI CÀI ĐẶT .IPA CHO IPHONE / IPAD
                    <Download className="w-4 h-4 text-slate-900 inline shrink-0" />
                  </span>
                  <span className="text-[10px] font-bold text-slate-800">
                    Bản v1.1.0 (28 MB) • Sideloadly / AltStore / Scarlet / TrollStore
                  </span>
                </div>
              </a>

              {/* Option 2 & 3: WebClip Profile & Safari PWA */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <a
                  href="/downloads/vocabflow.mobileconfig"
                  download="vocabflow.mobileconfig"
                  className="py-2.5 px-3 rounded-xl bg-white/[0.08] hover:bg-white/[0.14] border border-white/20 text-slate-200 hover:text-white font-bold text-xs flex items-center justify-center gap-1.5 transition text-center"
                  title="Tải cấu hình WebClip Apple để thêm icon vào màn hình chính iPhone"
                >
                  <FileCode2 className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                  <span>Tải Hồ sơ .mobileconfig</span>
                </a>

                <a
                  href="https://app.vocalflow.site"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="py-2.5 px-3 rounded-xl bg-indigo-500/15 hover:bg-indigo-500/25 border border-indigo-500/30 text-indigo-200 hover:text-white font-bold text-xs flex items-center justify-center gap-1.5 transition text-center"
                  title="Mở ứng dụng trên Safari để thêm vào màn hình chính"
                >
                  <ExternalLink className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                  <span>Mở Safari PWA 1-Chạm</span>
                </a>
              </div>

              {/* Modal Trigger for Detailed iOS Install Guide */}
              <button
                type="button"
                onClick={() => setShowIOSModal(true)}
                className="w-full py-2.5 px-4 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] border border-white/10 text-slate-300 hover:text-white font-semibold text-xs flex items-center justify-center gap-1.5 transition cursor-pointer"
              >
                <HelpCircle className="w-3.5 h-3.5 text-amber-400" />
                <span>Xem hướng dẫn 3 cách cài đặt chi tiết trên iPhone</span>
              </button>
            </div>
          </GlassSurface>
        )}
      </div>

      {/* Trust & Compatibility Footer Bar */}
      <div className="mt-12 sm:mt-16 max-w-4xl mx-auto p-4 sm:p-5 rounded-2xl bg-white/[0.03] border border-white/[0.08] backdrop-blur-md flex flex-wrap items-center justify-around gap-4 text-xs font-semibold text-slate-300">
        <div className="flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-[#87C527]" />
          <span>Hoàn Toàn Miễn Phí</span>
        </div>
        <div className="flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-cyan-400" />
          <span>0 Quảng Cáo Làm Phiền</span>
        </div>
        <div className="flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-indigo-400" />
          <span>Bảo Mật Chuẩn Sandbox</span>
        </div>
        <div className="flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>Đồng Bộ Đám Mây Real-Time</span>
        </div>
      </div>

      {/* iOS Modal Guide Popup */}
      {showIOSModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200"
          onClick={() => setShowIOSModal(false)}
        >
          <div
            className="max-w-lg w-full rounded-3xl bg-[#090D16] border border-white/20 p-6 sm:p-7 space-y-5 shadow-2xl relative"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-4 border-b border-white/[0.08]">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-white/10 flex items-center justify-center p-1.5 text-white">
                  <AppleIcon className="w-full h-full" fill="#FFFFFF" />
                </div>
                <div>
                  <h4 className="font-extrabold text-base text-white">Hướng dẫn cài đặt VocabFlow iOS</h4>
                  <p className="text-[11px] text-slate-400">Dành cho iPhone và iPad (iOS 14+)</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowIOSModal(false)}
                className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-slate-300 hover:text-white transition cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4 text-left text-xs text-slate-300 max-h-[60vh] overflow-y-auto pr-1">
              <p className="leading-relaxed">
                VocabFlow cung cấp <strong>3 phương thức cài đặt độc quyền</strong> trên iPhone/iPad để bạn thoải mái lựa chọn theo nhu cầu:
              </p>

              {/* Method 1: Sideload IPA Package */}
              <div className="p-4 rounded-2xl bg-white/[0.04] border border-white/[0.1] space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="font-extrabold text-white text-xs text-indigo-400 flex items-center gap-1.5">
                    <AppleIcon className="w-3.5 h-3.5 text-indigo-400" fill="currentColor" />
                    <span>Cách 1: Cài đặt file .IPA (App Native độc lập)</span>
                  </span>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-indigo-500/15 text-indigo-300 font-bold">Native IPA</span>
                </div>
                <p className="text-[11px] text-slate-300 leading-relaxed">
                  Tải file <strong>vocabflow.ipa</strong> về máy và cài đặt bằng các công cụ Sideload phổ biến:
                </p>
                <ul className="list-disc list-inside space-y-1 text-[11px] text-slate-400 pl-1">
                  <li><strong>Sideloadly / AltStore (PC/Mac)</strong>: Kéo thả file .ipa và nhập Apple ID để ký chứng chỉ miễn phí 7 ngày.</li>
                  <li><strong>TrollStore / Scarlet / Esign</strong>: Cài đặt trực tiếp trên iPhone không cần máy tính.</li>
                </ul>
                <div className="pt-1">
                  <a
                    href="/downloads/vocabflow.ipa?v=1.1.0"
                    download="vocabflow.ipa"
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-500/20 hover:bg-indigo-500/30 text-indigo-200 border border-indigo-500/40 font-bold text-[11px] transition"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Tải file vocabflow.ipa (28 MB)</span>
                  </a>
                </div>
              </div>

              {/* Method 2: Apple MobileConfig Profile */}
              <div className="p-4 rounded-2xl bg-white/[0.04] border border-white/[0.1] space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="font-extrabold text-white text-xs text-cyan-400 flex items-center gap-1.5">
                    <FileCode2 className="w-3.5 h-3.5 text-cyan-400" />
                    <span>Cách 2: Cài Hồ sơ Apple (.mobileconfig)</span>
                  </span>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-cyan-500/15 text-cyan-300 font-bold">1-Chạm</span>
                </div>
                <p className="text-[11px] text-slate-400 leading-relaxed">
                  Tải file cấu hình <code>vocabflow.mobileconfig</code> &rarr; Mở <strong>Cài đặt</strong> trên iPhone &rarr; Chọn <strong>Đã tải về hồ sơ</strong> &rarr; Bấm <strong>Cài đặt</strong>. App VocabFlow sẽ xuất hiện ngay trên màn hình chính với icon Retina!
                </p>
              </div>

              {/* Method 3: Safari 1-Tap PWA */}
              <div className="p-4 rounded-2xl bg-white/[0.04] border border-white/[0.1] space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="font-extrabold text-white text-xs text-emerald-400 flex items-center gap-1.5">
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Cách 3: Thêm vào Màn hình chính qua Safari</span>
                  </span>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-300 font-bold">10 giây</span>
                </div>
                <ol className="list-decimal list-inside space-y-1 text-[11px] text-slate-300 pl-1">
                  <li>Mở <strong>Safari</strong> trên iPhone và truy cập <strong>https://app.vocalflow.site</strong>.</li>
                  <li>Nhấn nút <strong>Chia sẻ (biểu tượng ⎋)</strong> ở thanh công cụ dưới cùng.</li>
                  <li>Chọn <strong>Thêm vào MH chính (Add to Home Screen)</strong> &rarr; Nhấn <strong>Thêm</strong>.</li>
                </ol>
              </div>
            </div>

            <div className="pt-2 flex items-center gap-2">
              <a
                href="https://app.vocalflow.site"
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => setShowIOSModal(false)}
                className="flex-1 py-3 rounded-xl bg-white hover:bg-slate-100 text-slate-950 font-black text-xs text-center flex items-center justify-center gap-1.5 shadow-lg transition"
              >
                <span>Mở Safari Cài Đặt Ngay</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
              <button
                type="button"
                onClick={() => setShowIOSModal(false)}
                className="py-3 px-5 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold text-xs transition cursor-pointer"
              >
                Đã Hiểu
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
});

LandingAppDownload.displayName = 'LandingAppDownload';
