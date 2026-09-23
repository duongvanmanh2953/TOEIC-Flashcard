import React from 'react';
import { getLanguage, LanguageDefinition } from '../../config/languages';
import { CountryFlag } from './CountryFlag';

interface LanguageBadgeProps {
  languageIdOrCode: string;
  showName?: boolean;
  showNativeName?: boolean;
  size?: 'xs' | 'sm' | 'md' | 'lg';
  className?: string;
}

export const LanguageBadge: React.FC<LanguageBadgeProps> = ({
  languageIdOrCode,
  showName = true,
  showNativeName = false,
  size = 'sm',
  className = '',
}) => {
  const lang: LanguageDefinition = getLanguage(languageIdOrCode);

  const sizeStyles = {
    xs: 'text-[10px] px-1.5 py-0.5 rounded-md gap-1',
    sm: 'text-xs px-2.5 py-1 rounded-xl gap-1.5',
    md: 'text-sm px-3 py-1.5 rounded-xl gap-2',
    lg: 'text-base px-4 py-2 rounded-2xl gap-2.5',
  };

  return (
    <span
      className={`inline-flex items-center font-bold tracking-tight bg-slate-100/90 dark:bg-slate-800/90 text-slate-800 dark:text-slate-200 border border-slate-200/80 dark:border-slate-700/80 shadow-xs ${sizeStyles[size]} ${className}`}
      title={`${lang.name} (${lang.nativeName})`}
    >
      <CountryFlag languageId={lang.id} countryCode={lang.countryCode} size={size} />
      {showName && (
        <span className="truncate">
          {showNativeName ? lang.nativeName : lang.name}
        </span>
      )}
    </span>
  );
};

export default LanguageBadge;
