import React, { useState, useEffect } from 'react';
import { Swords, ArrowRight, Menu, X, Smartphone, Download, Sparkles, BookOpen, User, LogIn } from 'lucide-react';
import { VocabFlowLogo } from '@vocabflow/shared';
import { AndroidIcon, AppleIcon } from './OSIcons';

export const LandingHeader: React.FC = React.memo(() => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Prevent background scroll when mobile drawer is open
  useEffect(() => {
    if (mobileMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [mobileMenuOpen]);

  return (
    <header className="sticky top-0 z-50 backdrop-blur-md bg-[#060813]/90 border-b border-white/[0.08] transition-colors">
      <div className="px-3 sm:px-6 py-2.5 sm:py-3 max-w-7xl mx-auto w-full flex items-center justify-between gap-2 sm:gap-4">
        {/* Brand Logo */}
        <a href="/" className="flex items-center gap-2 sm:gap-2.5 shrink-0 group">
          <VocabFlowLogo size="sm" showContainer={false} className="group-hover:scale-105 transition-transform duration-200" />
          <div className="flex flex-col text-left">
            <span className="font-black text-base sm:text-lg bg-gradient-to-r from-blue-400 via-indigo-300 to-cyan-300 bg-clip-text text-transparent leading-none tracking-tight">
              VocabFlow
            </span>
            <span className="hidden sm:inline-block text-[9px] font-semibold text-slate-400 tracking-wider uppercase mt-0.5 leading-none">
              Smart Learning Platform
            </span>
          </div>
        </a>

        {/* Desktop Navigation Links — Streamlined & Spacious */}
        <nav className="hidden lg:flex items-center gap-6 text-xs font-semibold text-slate-300">
          <a href="#smart-features" className="hover:text-cyan-400 transition py-1">
            Tính Năng
          </a>
          <a href="#learning-loop" className="hover:text-indigo-300 transition py-1 text-slate-300">
            Luồng Học SRS
          </a>
          <a href="#download-app" className="hover:text-emerald-400 transition py-1 flex items-center gap-1.5 text-slate-200 font-bold group">
            <span className="flex items-center gap-1 text-xs">
              <AppleIcon className="w-3.5 h-3.5 text-slate-200 group-hover:text-white" fill="currentColor" />
              <AndroidIcon className="w-3.5 h-3.5" />
            </span>
            <span>Tải App Mobile</span>
            <span className="text-[9px] font-extrabold uppercase px-1.5 py-0.2 rounded-full bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
              iOS &amp; APK
            </span>
          </a>
          <a href="#pvp-arena" className="hover:text-violet-300 transition py-1 flex items-center gap-1 text-slate-300">
            <Swords className="w-3.5 h-3.5 text-violet-400" />
            <span>Đấu Trường 1v1</span>
          </a>
          <a
            href="https://kid.vocalflow.site"
            className="flex items-center gap-1 text-amber-300 hover:text-amber-200 transition py-1 px-2.5 rounded-full bg-amber-500/10 border border-amber-500/25 text-xs font-bold"
          >
            <span>Thế Giới Bé</span>
          </a>
        </nav>

        {/* Actions & Mobile Menu Toggle */}
        <div className="flex items-center gap-1.5 sm:gap-2.5 shrink-0">
          {/* Login button (Desktop/Tablet) */}
          <a
            href="https://app.vocalflow.site/login"
            className="hidden sm:inline-flex whitespace-nowrap px-3 py-1.5 rounded-xl text-xs font-bold text-slate-300 hover:text-cyan-400 hover:bg-white/[0.06] transition"
          >
            Đăng nhập
          </a>

          {/* Start Learning CTA — Compact on small mobile to avoid crowding */}
          <a
            href="https://app.vocalflow.site/dashboard"
            className="whitespace-nowrap btn-glass-primary !py-1.5 sm:!py-2 !px-3 sm:!px-4 text-xs font-bold flex items-center gap-1 sm:gap-1.5 shadow-sm"
          >
            <span className="hidden xs:inline">Bắt đầu học</span>
            <span className="xs:hidden">Vào học</span>
            <ArrowRight className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
          </a>

          {/* Mobile Navigation Drawer Toggle */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="lg:hidden w-8.5 h-8.5 sm:w-9 sm:h-9 rounded-xl flex items-center justify-center text-slate-200 hover:text-white bg-white/[0.05] hover:bg-white/[0.1] border border-white/[0.08] active:scale-95 transition-all duration-150"
            aria-label={mobileMenuOpen ? 'Đóng menu' : 'Mở menu điều hướng'}
          >
            {mobileMenuOpen ? <X className="w-4 h-4 text-indigo-400" /> : <Menu className="w-4 h-4 text-slate-200" />}
          </button>
        </div>
      </div>

      {/* Mobile Navigation Drawer with Backdrop */}
      {mobileMenuOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 top-[53px] sm:top-[61px] bg-black/60 backdrop-blur-xs z-40 lg:hidden animate-in fade-in duration-200"
            onClick={() => setMobileMenuOpen(false)}
            aria-hidden="true"
          />

          {/* Drawer Menu */}
          <div className="relative z-50 lg:hidden border-t border-white/[0.08] bg-[#060813]/98 backdrop-blur-2xl px-4 py-4 space-y-3 max-h-[calc(100dvh-4rem)] overflow-y-auto overscroll-contain shadow-2xl animate-in slide-in-from-top-2 duration-200">
            {/* Quick OS Download Cards (Android & iOS) */}
            <div className="grid grid-cols-1 gap-2">
              <a
                href="/downloads/vocabflow.apk?v=1.1.0"
                download="vocabflow.apk"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center justify-between p-3 rounded-2xl bg-[#87C527]/15 border border-[#87C527]/30 text-[#87C527] font-extrabold active:scale-[0.99] transition-transform"
              >
                <div className="flex items-center gap-2.5">
                  <AndroidIcon className="w-4 h-4 shrink-0" />
                  <span className="text-xs">Tải Android APK (v1.1.0)</span>
                </div>
                <Download className="w-4 h-4 text-[#87C527] shrink-0" />
              </a>

              <a
                href="/downloads/vocabflow.ipa?v=1.1.0"
                download="vocabflow.ipa"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center justify-between p-3 rounded-2xl bg-white/[0.08] border border-white/20 text-slate-100 font-extrabold active:scale-[0.99] transition-transform"
              >
                <div className="flex items-center gap-2.5">
                  <AppleIcon className="w-4 h-4 text-white shrink-0" fill="#FFFFFF" />
                  <span className="text-xs">Tải iOS Package (.IPA v1.1.0)</span>
                </div>
                <Download className="w-4 h-4 text-white shrink-0" />
              </a>

              <a
                href="#download-app"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center justify-between px-3 py-2 rounded-xl bg-white/[0.04] border border-white/10 text-slate-300 font-semibold text-xs active:scale-[0.99] transition-transform"
              >
                <div className="flex items-center gap-2">
                  <span className="text-xs">📱</span>
                  <span>Cài đặt iOS qua Safari / WebClip</span>
                </div>
                <ArrowRight className="w-3 h-3 text-slate-400 shrink-0" />
              </a>
            </div>

            {/* Navigation Links */}
            <div className="grid grid-cols-1 gap-1 text-sm font-semibold">
              <a
                href="#whats-new"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center gap-2.5 p-3 rounded-xl text-slate-200 hover:bg-white/[0.06] transition"
              >
                <Sparkles className="w-4 h-4 text-cyan-400 shrink-0" />
                <span>Có Gì Mới?</span>
              </a>
              <a
                href="#learning-loop"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center gap-2.5 p-3 rounded-xl text-indigo-300 hover:bg-white/[0.06] transition"
              >
                <BookOpen className="w-4 h-4 text-indigo-400 shrink-0" />
                <span>Luồng Học SRS</span>
              </a>
              <a
                href="#pvp-arena"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center gap-2.5 p-3 rounded-xl text-violet-300 hover:bg-white/[0.06] transition"
              >
                <Swords className="w-4 h-4 text-violet-400 shrink-0" />
                <span>Đấu Trường 1v1</span>
              </a>
              <a
                href="#smart-features"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center gap-2.5 p-3 rounded-xl text-slate-200 hover:bg-white/[0.06] transition"
              >
                <Sparkles className="w-4 h-4 text-amber-400 shrink-0" />
                <span>Tính Năng AI</span>
              </a>
              <a
                href="https://kid.vocalflow.site"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center justify-between p-3 rounded-xl text-amber-300 bg-amber-500/10 border border-amber-500/25 hover:bg-amber-500/15 transition font-bold"
              >
                <div className="flex items-center gap-2.5">
                  <span className="text-base">🧸</span>
                  <span>Thế Giới Bé (VocabFlow Kids)</span>
                </div>
                <ArrowRight className="w-3.5 h-3.5 text-amber-400 shrink-0" />
              </a>
            </div>

            {/* Drawer Auth & Action Footer */}
            <div className="pt-2 border-t border-white/[0.08] space-y-2">
              <a
                href="https://app.vocalflow.site/login"
                onClick={() => setMobileMenuOpen(false)}
                className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-sm font-bold text-slate-200 bg-white/[0.06] hover:bg-white/[0.1] border border-white/[0.08] transition"
              >
                <LogIn className="w-4 h-4 text-slate-400" />
                <span>Đăng nhập tài khoản</span>
              </a>
              <a
                href="https://app.vocalflow.site/dashboard"
                onClick={() => setMobileMenuOpen(false)}
                className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-sm font-bold text-white btn-glass-primary shadow-lg transition"
              >
                <span>Bắt đầu học miễn phí</span>
                <ArrowRight className="w-4 h-4" />
              </a>
            </div>
          </div>
        </>
      )}
    </header>
  );
});

LandingHeader.displayName = 'LandingHeader';
