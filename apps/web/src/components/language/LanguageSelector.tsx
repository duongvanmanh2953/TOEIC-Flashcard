import React, { useState, useRef, useEffect } from 'react';
import {
  SUPPORTED_LANGUAGES,
  LanguageDefinition,
  getLanguage,
  getActiveLanguages,
} from '../../config/languages';
import { ChevronDown, Search, Check, Globe } from 'lucide-react';
import { CountryFlag } from './CountryFlag';

interface LanguageSelectorProps {
  value: string; // languageId or languageCode
  onChange: (languageId: string) => void;
  availableOnly?: boolean;
  label?: string;
  placeholder?: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export const LanguageSelector: React.FC<LanguageSelectorProps> = ({
  value,
  onChange,
  availableOnly = false,
  label,
  placeholder = 'Chọn ngôn ngữ...',
  size = 'md',
  className = '',
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);

  const activeLang = getLanguage(value);
  const languageList = availableOnly ? getActiveLanguages() : SUPPORTED_LANGUAGES;

  const filteredLanguages = languageList.filter((lang) => {
    const q = search.toLowerCase().trim();
    if (!q) return true;
    return (
      lang.name.toLowerCase().includes(q) ||
      lang.nativeName.toLowerCase().includes(q) ||
      lang.code.toLowerCase().includes(q)
    );
  });

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const sizeStyles = {
    sm: 'py-1.5 px-2.5 text-xs rounded-xl',
    md: 'py-2.5 px-3.5 text-xs sm:text-sm rounded-2xl',
    lg: 'py-3 px-4 text-sm rounded-2xl',
  };

  return (
    <div className={`relative ${className}`} ref={containerRef}>
      {label && (
        <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
          {label}
        </label>
      )}

      {/* Trigger Button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`w-full flex items-center justify-between gap-2 bg-white/95 dark:bg-slate-900/95 hover:bg-slate-50 dark:hover:bg-slate-800/80 text-slate-900 dark:text-white border border-slate-300/80 dark:border-slate-700/80 shadow-xs transition focus-visible:ring-2 focus-visible:ring-indigo-500 font-bold cursor-pointer ${sizeStyles[size]}`}
      >
        <div className="flex items-center gap-2 min-w-0">
          <CountryFlag languageId={activeLang.id} countryCode={activeLang.countryCode} size="sm" />
          <span className="truncate">{activeLang.nativeName}</span>
          <span className="text-slate-400 font-normal text-xs truncate">({activeLang.name})</span>
        </div>
        <ChevronDown
          className={`w-4 h-4 text-slate-400 transition-transform duration-200 shrink-0 ${
            isOpen ? 'rotate-180 text-indigo-600' : ''
          }`}
        />
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute top-full left-0 right-0 mt-2 z-50 bg-white/95 dark:bg-slate-900/95 backdrop-blur-2xl border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
          {/* Search Box */}
          <div className="p-2 border-b border-slate-200/60 dark:border-slate-800/60">
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder={placeholder}
                className="w-full pl-8 pr-3 py-1.5 rounded-xl text-xs bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white border border-slate-200 dark:border-slate-700 focus:outline-hidden focus:ring-1 focus:ring-indigo-500"
                autoFocus
              />
            </div>
          </div>

          {/* Options List */}
          <div className="max-h-56 overflow-y-auto p-1.5 space-y-1">
            {filteredLanguages.length === 0 ? (
              <div className="p-3 text-center text-xs text-slate-400">Không tìm thấy ngôn ngữ nào</div>
            ) : (
              filteredLanguages.map((lang) => {
                const isSelected = lang.id === activeLang.id;
                return (
                  <button
                    key={lang.id}
                    type="button"
                    onClick={() => {
                      onChange(lang.id);
                      setIsOpen(false);
                    }}
                    className={`w-full flex items-center justify-between p-2 rounded-xl text-left transition text-xs font-bold cursor-pointer ${
                      isSelected
                        ? 'bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 border border-indigo-500/30'
                        : 'hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-200 border border-transparent'
                    }`}
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <CountryFlag languageId={lang.id} countryCode={lang.countryCode} size="xs" />
                      <span className="truncate">{lang.nativeName}</span>
                      <span className="text-[10px] text-slate-400 font-normal truncate">
                        ({lang.name})
                      </span>
                    </div>

                    {isSelected && <Check className="w-3.5 h-3.5 text-indigo-600 shrink-0" />}
                  </button>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default LanguageSelector;
