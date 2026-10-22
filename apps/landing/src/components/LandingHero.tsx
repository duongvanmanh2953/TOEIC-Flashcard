import React from 'react';
import { Sparkles, ArrowRight, Compass, Volume2, CheckCircle2 } from 'lucide-react';
import { GlassSurface } from './GlassSurface';
import { CountryFlag } from './CountryFlag';
import { LangSample, MULTI_LANG_SAMPLES } from '../data/multiLangSamples';

export interface LandingHeroProps {
  selectedLang: string;
  onSelectLang: (langId: 'en' | 'ja' | 'zh' | 'ko' | 'de' | 'fr' | 'es') => void;
  currentSample: LangSample;
  isPlayingAudio: boolean;
  onSpeak: (word: string, speechCode: string) => void;
}

/**
 * LandingHero - Performance-First Modular Hero Section
 * Distinctive typography, spacious touch ergonomics, interactive flag selector
 */
export const LandingHero: React.FC<LandingHeroProps> = React.memo(
  ({ selectedLang, onSelectLang, currentSample, isPlayingAudio, onSpeak }) => {
    return (
      <section className="relative pt-12 sm:pt-16 pb-14 px-4 sm:px-6 max-w-7xl mx-auto w-full">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-8 items-center">
          {/* Left Column: Value Proposition */}
          <div className="lg:col-span-7 space-y-6 text-left" data-aos="fade-up">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-indigo-500/10 border border-indigo-400/25 text-indigo-300 text-xs font-bold">
              <Sparkles className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
              <span>LetStuN • Learn today, remember tomorrow.</span>
            </div>

            <div className="space-y-2">
              <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black tracking-tight text-white leading-tight">
                Learn today.
                <br />
                <span className="bg-gradient-to-r from-indigo-400 via-sky-300 to-emerald-300 bg-clip-text text-transparent">
                  Remember tomorrow.
                </span>
              </h1>
              <p className="text-base sm:text-lg text-slate-300 max-w-2xl leading-relaxed font-normal pt-1">
                Từ vựng, flashcard, bài kiểm tra, cộng đồng và ghi chú trong cùng một luồng học liền mạch.
                Không chuyển đổi qua lại giữa hàng tá ứng dụng rời rạc.
              </p>
            </div>

            {/* 3 Core Clarity Pillars */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
              <div className="p-3.5 rounded-2xl bg-white/[0.04] border border-white/[0.08] shadow-xs">
                <span className="text-[10px] font-black uppercase text-indigo-400 block tracking-wider">
                  Bạn học gì?
                </span>
                <p className="text-xs font-bold text-white mt-0.5">
                  TOEIC, IELTS & 7 ngôn ngữ toàn cầu
                </p>
              </div>
              <div className="p-3.5 rounded-2xl bg-white/[0.04] border border-white/[0.08] shadow-xs">
                <span className="text-[10px] font-black uppercase text-sky-400 block tracking-wider">
                  Học thế nào?
                </span>
                <p className="text-xs font-bold text-white mt-0.5">
                  Học → Luyện đề → Ghi chú 1 chạm → Ôn SRS
                </p>
              </div>
              <div className="p-3.5 rounded-2xl bg-white/[0.04] border border-white/[0.08] shadow-xs">
                <span className="text-[10px] font-black uppercase text-emerald-400 block tracking-wider">
                  Tăng tốc bằng gì?
                </span>
                <p className="text-xs font-bold text-white mt-0.5">
                  Bôi đen lưu note ngay & giải thích đề chi tiết
                </p>
              </div>
            </div>

            {/* CTAs */}
            <div className="pt-2 flex flex-wrap items-center gap-3.5">
              <a
                href="https://app.letstun.site/dashboard"
                className="btn-glass-primary !py-3.5 !px-7 text-sm font-extrabold flex items-center gap-2 card-hover-smooth shadow-lg shadow-indigo-600/30"
              >
                <span>Bắt đầu học</span>
                <ArrowRight className="w-4 h-4" />
              </a>

              <a
                href="#languages"
                className="btn-glass-secondary !py-3.5 !px-5 text-sm font-bold flex items-center gap-2 card-hover-smooth"
              >
                <Compass className="w-4 h-4 text-slate-300" />
                <span>Khám phá 7 ngôn ngữ</span>
              </a>
            </div>
          </div>

          {/* Right Column: Country Flag Selector + Interactive Sample Card */}
          <div className="lg:col-span-5" data-aos="fade-up" data-aos-delay="100">
            <GlassSurface className="p-6 border border-white/15 space-y-4 shadow-2xl">
              {/* Language Flag Selector */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider">
                    Chọn ngôn ngữ ôn luyện:
                  </span>
                  <div className="flex items-center gap-1.5">
                    <CountryFlag countryCode={currentSample.countryCode} size="sm" />
                    <span className="text-xs font-bold text-indigo-300">
                      {currentSample.langName}
                    </span>
                  </div>
                </div>

                {/* Flag Buttons: Min touch target >= 44px */}
                <div className="grid grid-cols-7 gap-1.5 p-1.5 rounded-2xl bg-slate-900/90 border border-white/10">
                  {(['en', 'ja', 'zh', 'ko', 'de', 'fr', 'es'] as const).map((langId) => {
                    const sample = MULTI_LANG_SAMPLES[langId];
                    const isActive = selectedLang === langId;
                    return (
                      <button
                        key={langId}
                        type="button"
                        onClick={() => onSelectLang(langId)}
                        className={`min-h-[44px] py-2 px-1 rounded-xl flex items-center justify-center transition-all touch-manipulation active:scale-95 ${
                          isActive
                            ? 'bg-indigo-600/40 border border-indigo-400 scale-105 shadow-sm'
                            : 'hover:bg-white/[0.08] opacity-75 hover:opacity-100 border border-transparent'
                        }`}
                        title={`${sample.langName} (${sample.badge})`}
                      >
                        <CountryFlag countryCode={sample.countryCode} size="md" />
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Card Word Header */}
              <div className="flex items-start justify-between gap-3 pt-1">
                <div>
                  <span className="inline-block px-2.5 py-0.5 rounded-lg text-[10px] font-extrabold uppercase tracking-wider bg-indigo-500/20 text-indigo-300 border border-indigo-400/30 mb-1.5">
                    {currentSample.badge}
                  </span>
                  <h3 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
                    {currentSample.word}
                  </h3>
                  <p className="text-xs text-slate-400 font-mono mt-0.5">
                    {currentSample.pronunciation} • <span className="italic">{currentSample.pos}</span>
                  </p>
                </div>

                <button
                  onClick={() => onSpeak(currentSample.word, currentSample.speechCode)}
                  disabled={isPlayingAudio}
                  className="min-h-[44px] min-w-[44px] p-2.5 rounded-2xl bg-indigo-600/30 hover:bg-indigo-600/50 text-indigo-300 border border-indigo-500/30 transition shrink-0 flex items-center justify-center touch-manipulation active:scale-95"
                  title="Nghe phát âm chuẩn bản ngữ"
                >
                  <Volume2 className={`w-4 h-4 ${isPlayingAudio ? 'animate-bounce text-cyan-400' : ''}`} />
                </button>
              </div>

              {/* Meaning & Context */}
              <div className="space-y-2 p-3.5 rounded-2xl bg-slate-950/70 border border-white/[0.06] text-xs">
                <p className="font-semibold text-slate-200 leading-relaxed">
                  {currentSample.meaning}
                </p>
                <p className="text-slate-400 italic leading-relaxed pt-1 border-t border-white/[0.06]">
                  {currentSample.example}
                </p>
              </div>

              {/* Usage Stat */}
              <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1">
                <span className="flex items-center gap-1.5 text-emerald-400 font-bold">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>SRS Chu kỳ nhớ tối ưu</span>
                </span>
                <span className="font-medium text-slate-400">{currentSample.statsLabel}</span>
              </div>
            </GlassSurface>
          </div>
        </div>
      </section>
    );
  }
);

LandingHero.displayName = 'LandingHero';
