import React from 'react';
import { LanguageDefinition } from '../../config/languages';
import { Check } from 'lucide-react';
import { CountryFlag } from './CountryFlag';

interface LanguageOptionProps {
  language: LanguageDefinition;
  isSelected?: boolean;
  onClick?: () => void;
  showLevel?: string;
  badgeText?: string;
  disabled?: boolean;
  size?: 'sm' | 'md';
  className?: string;
}

export const LanguageOption: React.FC<LanguageOptionProps> = ({
  language,
  isSelected = false,
  onClick,
  showLevel,
  badgeText,
  disabled = false,
  size = 'md',
  className = '',
}) => {
  return (
    <button
      type="button"
      onClick={disabled ? undefined : onClick}
      disabled={disabled}
      className={`w-full text-left p-2.5 sm:p-3 rounded-2xl flex items-center justify-between transition-all outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 cursor-pointer ${
        isSelected
          ? 'bg-indigo-50/90 dark:bg-indigo-950/70 border-2 border-indigo-500 shadow-xs'
          : 'bg-white/80 dark:bg-slate-800/80 hover:bg-slate-100 dark:hover:bg-slate-700/70 border border-slate-200/80 dark:border-slate-700/80'
      } ${disabled ? 'opacity-50 cursor-not-allowed' : ''} ${className}`}
    >
      <div className="flex items-center gap-3 min-w-0">
        <CountryFlag
          languageId={language.id}
          countryCode={language.countryCode}
          size={size === 'sm' ? 'sm' : 'md'}
          alt={language.name}
        />
        <div className="min-w-0">
          <div className="flex items-center gap-1.5">
            <p className="text-xs sm:text-sm font-extrabold text-slate-900 dark:text-white truncate">
              {language.nativeName}
            </p>
            <span className="text-[11px] text-slate-500 dark:text-slate-400 font-semibold truncate">
              ({language.name})
            </span>
          </div>

          <div className="flex items-center gap-2 text-[10px] text-slate-500 dark:text-slate-400 mt-0.5 font-medium">
            <span className="bg-slate-200/60 dark:bg-slate-700/60 px-1.5 py-0.2 rounded font-mono font-bold text-slate-700 dark:text-slate-300">
              {language.code.toUpperCase()}
            </span>
            <span>•</span>
            <span>{language.region}</span>
            {showLevel && (
              <>
                <span>•</span>
                <span className="font-bold text-indigo-600 dark:text-indigo-400">{showLevel}</span>
              </>
            )}
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2 shrink-0">
        {badgeText && (
          <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20">
            {badgeText}
          </span>
        )}
        {isSelected && (
          <span className="w-6 h-6 rounded-full bg-indigo-600 text-white flex items-center justify-center shadow-xs">
            <Check className="w-3.5 h-3.5 stroke-[3]" />
          </span>
        )}
      </div>
    </button>
  );
};

export default LanguageOption;
