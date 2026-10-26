import React, { useState } from 'react';
import { getLanguage } from '../../config/languages';

interface CountryFlagProps {
  countryCode?: string; // e.g. 'GB', 'DE', 'ES', 'FR', 'VN'
  languageId?: string; // e.g. 'en', 'de', 'es', 'vi'
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
  alt?: string;
}

const LANGUAGE_TO_COUNTRY: Record<string, string> = {
  en: 'gb',
  de: 'de',
  es: 'es',
  fr: 'fr',
  zh: 'cn',
  ja: 'jp',
  ko: 'kr',
  th: 'th',
  vi: 'vn',
  pt: 'pt',
  it: 'it',
  ru: 'ru',
  ar: 'sa',
};

export const CountryFlag: React.FC<CountryFlagProps> = ({
  countryCode,
  languageId,
  size = 'sm',
  className = '',
  alt,
}) => {
  const [hasError, setHasError] = useState(false);

  // Determine 2-letter country code in lowercase (e.g. 'gb', 'de', 'vn')
  let code = (countryCode || '').toLowerCase().trim();
  if (!code && languageId) {
    const cleanLang = languageId.toLowerCase().trim();
    code = LANGUAGE_TO_COUNTRY[cleanLang] || cleanLang;
  }
  if (!code) {
    code = 'gb';
  }

  // Handle 'en-us' or 'en-gb'
  if (code === 'en-us' || code === 'us') code = 'us';
  if (code === 'en-gb' || code === 'en' || code === 'gb') code = 'gb';

  const sizeStyles = {
    xs: 'w-4 h-3 rounded-[2px]',
    sm: 'w-5 h-3.5 rounded-sm',
    md: 'w-6 h-4 rounded-md',
    lg: 'w-8 h-5.5 rounded-md',
    xl: 'w-10 h-7 rounded-lg',
  };

  const dimensions = {
    xs: { width: 16, height: 12 },
    sm: { width: 20, height: 14 },
    md: { width: 24, height: 16 },
    lg: { width: 32, height: 22 },
    xl: { width: 40, height: 28 },
  };

  const flagUrl = `https://flagcdn.com/w40/${code}.png`;
  const flagSrcSet = `https://flagcdn.com/w80/${code}.png 2x`;

  if (hasError) {
    return (
      <span
        className={`inline-flex items-center justify-center font-bold text-[9px] uppercase bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-300 dark:border-slate-600 shrink-0 ${sizeStyles[size]} ${className}`}
      >
        {code.toUpperCase()}
      </span>
    );
  }

  return (
    <img
      src={flagUrl}
      srcSet={flagSrcSet}
      alt={alt || `${code.toUpperCase()} Flag`}
      width={dimensions[size].width}
      height={dimensions[size].height}
      onError={() => setHasError(true)}
      loading="lazy"
      decoding="async"
      className={`object-cover border border-black/10 dark:border-white/20 shadow-2xs shrink-0 select-none ${sizeStyles[size]} ${className}`}
    />
  );
};

export default CountryFlag;
