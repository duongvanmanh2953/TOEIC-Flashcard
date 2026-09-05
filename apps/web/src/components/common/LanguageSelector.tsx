import React from 'react';
import { useTranslation } from '../../i18n';

export const LanguageSelector: React.FC<{ className?: string }> = ({ className = '' }) => {
  const { locale, setLocale } = useTranslation();

  const toggleLanguage = () => {
    setLocale(locale === 'vi' ? 'en' : 'vi');
  };

  return (
    <button
      type="button"
      onClick={toggleLanguage}
      className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-lg text-xs font-bold bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 transition shrink-0 border border-slate-200/60 dark:border-slate-700/60 ${className}`}
      title="Chuyển đổi ngôn ngữ / Switch Language"
    >
      <span className="text-xs">{locale === 'vi' ? '🇻🇳' : '🇬🇧'}</span>
      <span className="text-[11px] uppercase tracking-wider">{locale}</span>
    </button>
  );
};
