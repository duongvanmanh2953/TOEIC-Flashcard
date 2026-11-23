import React from 'react';
import { CheckCircle2, Lightbulb } from 'lucide-react';

export interface ArenaExplanationCardProps {
  correctLetter?: string;
  correctText?: string;
  explanation?: string;
  className?: string;
}

export const ArenaExplanationCard: React.FC<ArenaExplanationCardProps> = ({
  correctLetter,
  correctText,
  explanation,
  className = '',
}) => {
  return (
    <div
      className={`relative overflow-hidden rounded-3xl bg-slate-900/90 border border-indigo-500/30 p-4 sm:p-5 shadow-2xl backdrop-blur-2xl flex flex-col justify-between min-h-[160px] ${className}`}
    >
      {/* Background Decorative Glow */}
      <div className="absolute -top-12 -right-12 w-36 h-36 bg-amber-500/10 rounded-full blur-2xl pointer-events-none" />

      {/* 1. Header: ✅ Đáp án đúng: [Letter]. [Text] */}
      <div className="relative z-10 flex items-center gap-2">
        <div className="w-6 h-6 rounded-full bg-emerald-500/20 border border-emerald-400 flex items-center justify-center shrink-0">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
        </div>
        <h4 className="font-black text-xs sm:text-sm text-white truncate">
          Đáp án đúng:{' '}
          {correctLetter ? (
            <span className="text-emerald-400 font-extrabold">
              {correctLetter}. {correctText || ''}
            </span>
          ) : (
            <span className="text-slate-400 font-normal">Đang cập nhật...</span>
          )}
        </h4>
      </div>

      {/* 2. Middle Content: 💡 Explanation prose & Vector Illustration */}
      <div className="relative z-10 grid grid-cols-1 sm:grid-cols-12 gap-3 items-center pt-2">
        <div className="sm:col-span-9 flex items-start gap-2.5">
          <Lightbulb className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
          <p className="text-xs sm:text-sm text-slate-300 leading-relaxed font-medium">
            {explanation && explanation.trim().length > 0
              ? explanation
              : 'Hãy quan sát kỹ các dữ kiện từ câu hỏi để ghi nhớ từ vựng cho các vòng tiếp theo.'}
          </p>
        </div>

        {/* 3. Golden Vector Trophy Stamp Graphic */}
        <div className="sm:col-span-3 flex justify-end items-end relative h-14 sm:h-16 opacity-80">
          <svg
            className="w-12 h-14 text-amber-400 filter drop-shadow-[0_0_12px_rgba(245,158,11,0.5)]"
            viewBox="0 0 24 24"
            fill="currentColor"
            aria-hidden="true"
          >
            <path d="M19 5h-2V3H7v2H5c-1.1 0-2 .9-2 2v1c0 2.55 1.92 4.63 4.39 4.94A5.01 5.01 0 0 0 11 15.9V18H8v2h8v-2h-3v-2.1c1.92-.38 3.4-1.8 3.61-3.66C19.08 11.63 21 9.55 21 7V5c0-1.1-.9-2-2-2zM5 8V7h2v3.82C5.84 10.4 5 9.3 5 8zm14 0c0 1.3-.84 2.4-2 2.82V7h2v1z" />
          </svg>
        </div>
      </div>
    </div>
  );
};
