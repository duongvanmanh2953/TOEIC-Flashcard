import React, { useState } from 'react';
import { Swords, ArrowRight, Menu, X, Smartphone, Download } from 'lucide-react';
import { VocabFlowLogo } from '@vocabflow/shared';

export const LandingHeader: React.FC = React.memo(() => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 backdrop-blur-md bg-[#060813]/90 border-b border-white/[0.08] transition-colors">
      <div className="px-4 sm:px-6 py-3 max-w-7xl mx-auto w-full flex items-center justify-between">
        {/* Brand Logo */}
        <a href="/" className="flex items-center gap-2.5 shrink-0 group">
          <VocabFlowLogo size="sm" showContainer={false} className="group-hover:scale-110 transition-transform duration-200" />
          <div className="flex flex-col text-left">
            <span className="font-black text-lg bg-gradient-to-r from-blue-400 via-indigo-300 to-cyan-300 bg-clip-text text-transparent leading-snug">
              VocabFlow
            </span>
            <span className="hidden sm:inline-block text-[10px] font-semibold text-slate-400 tracking-wider uppercase leading-none">
              Smart Learning Platform
            </span>
          </div>
        </a>

        {/* Desktop Navigation Links */}
        <nav className="hidden lg:flex items-center gap-5 text-xs font-semibold text-slate-300">
          <a href="#whats-new" className="hover:text-cyan-400 transition py-1">
            Có Gì Mới?
          </a>
          <a href="#learning-loop" className="hover:text-cyan-400 transition py-1 text-indigo-300 font-bold">
            Luồng Học
          </a>
          <a href="#download-app" className="hover:text-emerald-400 transition py-1 flex items-center gap-1 text-emerald-300 font-bold">
            <Smartphone className="w-3.5 h-3.5 text-emerald-400" />
            <span>Tải App Android</span>
          </a>
          <a href="#pvp-arena" className="hover:text-cyan-400 transition py-1 flex items-center gap-1 text-violet-300">
            <Swords className="w-3.5 h-3.5 text-violet-400" />
            <span>Đấu Trường 1v1</span>
          </a>
          <a href="#smart-features" className="hover:text-cyan-400 transition py-1">
            Tính Năng AI
          </a>
          <a
            href="https://kid.vocalflow.site"
            className="flex items-center gap-1 text-amber-300 hover:text-amber-200 transition py-1 px-2.5 rounded-full bg-amber-500/10 border border-amber-500/25 text-xs font-bold"
          >
            <span>Thế Giới Bé</span>
          </a>
        </nav>

        {/* Actions & Mobile Menu Toggle */}
        <div className="flex items-center gap-2 shrink-0">
          {/* Quick APK Download Pill (Desktop & Tablet) */}
          <a
            href="/downloads/vocabflow.apk"
            download="vocabflow.apk"
            title="Tải ứng dụng Android (APK)"
            className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-400/25 text-emerald-300 text-xs font-bold transition-all duration-200"
          >
            <Download className="w-3.5 h-3.5 text-emerald-400" />
            <span>Tải APK</span>
          </a>

          <a
            href="https://app.vocalflow.site/login"
            className="whitespace-nowrap px-3 py-1.5 rounded-xl text-xs font-bold text-slate-200 hover:text-cyan-400 hover:bg-white/[0.06] transition"
          >
            Đăng nhập
          </a>
          <a
            href="https://app.vocalflow.site/dashboard"
            className="whitespace-nowrap btn-glass-primary !py-2 !px-3.5 sm:!px-4 text-xs font-bold flex items-center gap-1.5"
          >
            <span>Bắt đầu học</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </a>

          {/* Mobile Hamburger Button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="lg:hidden p-2 rounded-xl text-slate-300 hover:text-white hover:bg-white/[0.06] transition"
            aria-label="Menu"
          >
            {mobileMenuOpen ? <X className="w-5 h-5 text-indigo-400" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Navigation Drawer */}
      {mobileMenuOpen && (
        <div className="lg:hidden border-t border-white/[0.08] bg-[#060813]/95 backdrop-blur-2xl px-4 py-4 space-y-3 animate-in slide-in-from-top duration-200 shadow-2xl">
          <div className="grid grid-cols-1 gap-1 text-sm font-semibold">
            <a
              href="/downloads/vocabflow.apk"
              download="vocabflow.apk"
              onClick={() => setMobileMenuOpen(false)}
              className="flex items-center justify-between p-3 rounded-2xl bg-emerald-500/15 border border-emerald-400/30 text-emerald-300 font-extrabold"
            >
              <div className="flex items-center gap-2.5">
                <Smartphone className="w-4 h-4 text-emerald-400" />
                <span>Tải Ứng Dụng Android (APK)</span>
              </div>
              <Download className="w-4 h-4 text-emerald-400" />
            </a>

            <a
              href="#whats-new"
              onClick={() => setMobileMenuOpen(false)}
              className="p-3 rounded-xl text-slate-200 hover:bg-white/[0.05] transition"
            >
              Có Gì Mới?
            </a>
            <a
              href="#learning-loop"
              onClick={() => setMobileMenuOpen(false)}
              className="p-3 rounded-xl text-indigo-300 hover:bg-white/[0.05] transition"
            >
              Luồng Học SRS
            </a>
            <a
              href="#pvp-arena"
              onClick={() => setMobileMenuOpen(false)}
              className="p-3 rounded-xl text-violet-300 hover:bg-white/[0.05] transition flex items-center gap-2"
            >
              <Swords className="w-4 h-4 text-violet-400" />
              <span>Đấu Trường 1v1</span>
            </a>
            <a
              href="#smart-features"
              onClick={() => setMobileMenuOpen(false)}
              className="p-3 rounded-xl text-slate-200 hover:bg-white/[0.05] transition"
            >
              Tính Năng AI
            </a>
            <a
              href="https://kid.vocalflow.site"
              onClick={() => setMobileMenuOpen(false)}
              className="p-3 rounded-xl text-amber-300 hover:bg-white/[0.05] transition"
            >
              Thế Giới Bé
            </a>
          </div>
        </div>
      )}
    </header>
  );
});

LandingHeader.displayName = 'LandingHeader';
