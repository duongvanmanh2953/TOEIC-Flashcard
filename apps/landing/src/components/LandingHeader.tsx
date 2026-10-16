import React from 'react';
import { Swords, ArrowRight } from 'lucide-react';
import { VocabFlowLogo } from '@vocabflow/shared';

export const LandingHeader: React.FC = React.memo(() => {
  return (
    <header className="sticky top-0 z-50 backdrop-blur-md bg-[#060813]/85 border-b border-white/[0.08] transition-colors">
      <div className="px-4 sm:px-6 py-3.5 max-w-7xl mx-auto w-full flex items-center justify-between">
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

        {/* Navigation Links */}
        <nav className="hidden lg:flex items-center gap-5 text-xs font-semibold text-slate-300">
          <a href="#whats-new" className="hover:text-cyan-400 transition py-1">
            Có Gì Mới?
          </a>
          <a href="#learning-loop" className="hover:text-cyan-400 transition py-1 text-indigo-300 font-bold">
            Luồng Học
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

        {/* Auth Actions */}
        <div className="flex items-center gap-2.5 shrink-0">
          <a
            href="https://app.vocalflow.site/login"
            className="whitespace-nowrap px-3 py-1.5 rounded-xl text-xs font-bold text-slate-200 hover:text-cyan-400 hover:bg-white/[0.06] transition"
          >
            Đăng nhập
          </a>
          <a
            href="https://app.vocalflow.site/dashboard"
            className="whitespace-nowrap btn-glass-primary !py-2 !px-4 text-xs font-bold flex items-center gap-1.5"
          >
            <span>Bắt đầu học</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </a>
        </div>
      </div>
    </header>
  );
});

LandingHeader.displayName = 'LandingHeader';
