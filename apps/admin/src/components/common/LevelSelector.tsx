import React from 'react';
import { Check } from 'lucide-react';

interface LevelOption {
  id: string; // e.g. 'A1', 'B1', 'JLPT N5'
  label?: string;
  description?: string;
}

interface LevelSelectorProps {
  levels: (string | LevelOption)[];
  value: string;
  onChange: (levelId: string) => void;
  label?: string;
  variant?: 'chips' | 'cards';
  className?: string;
}

export const LevelSelector: React.FC<LevelSelectorProps> = ({
  levels,
  value,
  onChange,
  label,
  variant = 'cards',
  className = '',
}) => {
  const normalizedOptions: LevelOption[] = levels.map((item) => {
    if (typeof item === 'string') {
      let desc = 'Căn bản & Nhận biết';
      if (item.includes('A1') || item.includes('Beginner') || item.endsWith('1') || item.endsWith('N5')) {
        desc = 'Sơ cấp (Mới bắt đầu)';
      } else if (item.includes('A2') || item.includes('Elementary') || item.endsWith('2') || item.endsWith('N4')) {
        desc = 'Sơ cấp nâng cao & Giao tiếp cơ bản';
      } else if (item.includes('B1') || item.includes('Intermediate') || item.endsWith('3') || item.endsWith('N3')) {
        desc = 'Trung cấp & Diễn đạt tự nhiên';
      } else if (item.includes('B2') || item.includes('Upper') || item.endsWith('4') || item.endsWith('N2')) {
        desc = 'Trung cao cấp & Phản xạ nhanh';
      } else if (item.includes('C1') || item.includes('C2') || item.includes('Advanced') || item.endsWith('5') || item.endsWith('N1')) {
        desc = 'Cao cấp & Thành thạo chuyên sâu';
      }
      return { id: item, label: item, description: desc };
    }
    return item;
  });

  if (variant === 'chips') {
    return (
      <div className={`space-y-1.5 ${className}`}>
        {label && <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">{label}</label>}
        <div className="flex flex-wrap items-center gap-1.5">
          {normalizedOptions.map((opt) => {
            const isSelected = opt.id === value;
            return (
              <button
                key={opt.id}
                type="button"
                onClick={() => onChange(opt.id)}
                className={`px-3 py-1.5 rounded-xl text-xs font-extrabold transition-all border outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 cursor-pointer ${
                  isSelected
                    ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
                    : 'bg-white/80 dark:bg-slate-800/80 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700'
                }`}
              >
                {opt.label || opt.id}
              </button>
            );
          })}
        </div>
      </div>
    );
  }

  return (
    <div className={`space-y-2 ${className}`}>
      {label && <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">{label}</label>}
      <div className="space-y-2">
        {normalizedOptions.map((opt) => {
          const isSelected = opt.id === value;
          return (
            <div
              key={opt.id}
              onClick={() => onChange(opt.id)}
              className={`p-3 rounded-2xl border transition-all cursor-pointer flex items-center justify-between outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 ${
                isSelected
                  ? 'border-indigo-600 bg-indigo-50/90 dark:bg-indigo-950/60 shadow-xs ring-1 ring-indigo-500/30'
                  : 'border-slate-200/80 dark:border-slate-700/80 hover:border-slate-300 dark:hover:border-slate-600 bg-white/70 dark:bg-slate-800/70'
              }`}
            >
              <div className="flex items-center gap-3 min-w-0">
                <span
                  className={`w-9 h-9 rounded-xl flex items-center justify-center text-xs font-black shrink-0 ${
                    isSelected
                      ? 'bg-indigo-600 text-white'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200/60 dark:border-slate-700/60'
                  }`}
                >
                  {opt.id}
                </span>
                <div className="min-w-0">
                  <p className="font-extrabold text-xs sm:text-sm text-slate-900 dark:text-white truncate">
                    Trình độ {opt.label || opt.id}
                  </p>
                  {opt.description && (
                    <p className="text-xs text-slate-500 dark:text-slate-400 truncate mt-0.5">
                      {opt.description}
                    </p>
                  )}
                </div>
              </div>

              {isSelected && (
                <span className="w-5 h-5 rounded-full bg-indigo-600 text-white flex items-center justify-center shrink-0">
                  <Check className="w-3 h-3 stroke-[3]" />
                </span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default LevelSelector;
