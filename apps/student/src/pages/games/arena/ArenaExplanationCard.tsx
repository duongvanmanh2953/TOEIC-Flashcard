import React from 'react';
import { CheckCircle2, Lightbulb } from 'lucide-react';

export interface ArenaExplanationCardProps {
  correctLetter?: string;
  correctText?: string;
  explanation?: string;
  landmarkSilhouette?: 'eiffel' | 'trophy' | 'monument' | 'none';
  className?: string;
}

export const ArenaExplanationCard: React.FC<ArenaExplanationCardProps> = ({
  correctLetter = 'B',
  correctText = 'Paris',
  explanation = 'Paris là thủ đô của Pháp, là một trong những thành phố nổi tiếng nhất thế giới.',
  landmarkSilhouette = 'eiffel',
  className = '',
}) => {
  return (
    <div
      className={`relative overflow-hidden rounded-3xl bg-slate-900/85 border border-indigo-500/30 p-4 sm:p-5 shadow-2xl backdrop-blur-2xl flex flex-col justify-between min-h-[160px] ${className}`}
    >
      {/* Background Decorative Glow */}
      <div className="absolute -top-12 -right-12 w-36 h-36 bg-amber-500/10 rounded-full blur-2xl pointer-events-none" />

      {/* 1. Header: ✅ Đáp án đúng: B. Paris */}
      <div className="relative z-10 flex items-center gap-2">
        <div className="w-6 h-6 rounded-full bg-emerald-500/20 border border-emerald-400 flex items-center justify-center shrink-0">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
        </div>
        <h4 className="font-black text-sm sm:text-base text-white truncate">
          Đáp án đúng:{' '}
          <span className="text-emerald-400 font-extrabold">
            {correctLetter}. {correctText}
          </span>
        </h4>
      </div>

      {/* 2. Middle Content: 💡 Explanation prose & Silhouette Graphic */}
      <div className="relative z-10 grid grid-cols-1 sm:grid-cols-12 gap-3 items-center pt-2">
        <div className="sm:col-span-8 flex items-start gap-2.5">
          <Lightbulb className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
          <p className="text-xs sm:text-sm text-slate-300 leading-relaxed font-medium">
            {explanation}
          </p>
        </div>

        {/* 3. Golden Silhouette Illustration (e.g. Eiffel Tower / Trophy as seen in Image 2) */}
        <div className="sm:col-span-4 flex justify-end items-end relative h-16 sm:h-20 opacity-85">
          {landmarkSilhouette === 'eiffel' ? (
            <svg
              className="w-16 h-20 text-amber-400/90 filter drop-shadow-[0_0_12px_rgba(245,158,11,0.5)]"
              viewBox="0 0 100 120"
              fill="currentColor"
            >
              {/* Stylized Eiffel Tower Silhouette */}
              <polygon points="48,5 52,5 51,25 49,25" />
              <polygon points="46,25 54,25 56,50 44,50" />
              <rect x="42" y="50" width="16" height="4" rx="1" />
              <polygon points="43,54 57,54 62,85 38,85" />
              <rect x="35" y="85" width="30" height="5" rx="1.5" />
              <path d="M 33 90 L 25 118 L 36 118 L 44 95 Q 50 90 56 95 L 64 118 L 75 118 L 67 90 Z" />
              {/* Sparkles around tower */}
              <circle cx="28" cy="40" r="1.5" fill="#FFD700" className="animate-ping" />
              <circle cx="72" cy="55" r="1.5" fill="#FFD700" className="animate-ping" />
            </svg>
          ) : (
            <svg
              className="w-16 h-18 text-amber-400 filter drop-shadow-[0_0_15px_rgba(245,158,11,0.6)]"
              viewBox="0 0 24 24"
              fill="currentColor"
            >
              <path d="M19 5h-2V3H7v2H5c-1.1 0-2 .9-2 2v1c0 2.55 1.92 4.63 4.39 4.94A5.01 5.01 0 0 0 11 15.9V18H8v2h8v-2h-3v-2.1c1.92-.38 3.4-1.8 3.61-3.66C19.08 11.63 21 9.55 21 7V5c0-1.1-.9-2-2-2zM5 8V7h2v3.82C5.84 10.4 5 9.3 5 8zm14 0c0 1.3-.84 2.4-2 2.82V7h2v1z" />
            </svg>
          )}
        </div>
      </div>
    </div>
  );
};
