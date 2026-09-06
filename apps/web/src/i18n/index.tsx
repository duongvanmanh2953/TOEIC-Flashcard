import React, { createContext, useContext, useState } from 'react';
import { en } from './locales/en';
import { vi } from './locales/vi';

export type Locale = 'vi' | 'en';

const translations: Record<Locale, any> = { en, vi };

interface I18nContextType {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  t: (path: string, fallback?: string) => string;
}

const I18nContext = createContext<I18nContextType | undefined>(undefined);

export const I18nProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [locale, setLocaleState] = useState<Locale>(() => {
    const saved = (localStorage.getItem('vocabflow_locale') || localStorage.getItem('leximind_locale')) as Locale;
    return saved === 'en' || saved === 'vi' ? saved : 'vi';
  });

  const setLocale = (newLocale: Locale) => {
    setLocaleState(newLocale);
    localStorage.setItem('vocabflow_locale', newLocale);
  };

  const t = (path: string, fallback?: string): string => {
    const keys = path.split('.');
    let current: any = translations[locale];

    for (const key of keys) {
      if (current && typeof current === 'object' && key in current) {
        current = current[key];
      } else {
        // Fallback to English
        let fallbackVal: any = translations['en'];
        for (const fKey of keys) {
          if (fallbackVal && typeof fallbackVal === 'object' && fKey in fallbackVal) {
            fallbackVal = fallbackVal[fKey];
          } else {
            return fallback || path;
          }
        }
        return typeof fallbackVal === 'string' ? fallbackVal : fallback || path;
      }
    }

    return typeof current === 'string' ? current : fallback || path;
  };

  return (
    <I18nContext.Provider value={{ locale, setLocale, t }}>
      {children}
    </I18nContext.Provider>
  );
};

export const useTranslation = () => {
  const context = useContext(I18nContext);
  if (!context) {
    throw new Error('useTranslation must be used within an I18nProvider');
  }
  return context;
};
