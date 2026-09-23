import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
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
  const menuRef = useRef<HTMLDivElement>(null);
  const [menuCoords, setMenuCoords] = useState<{
    top?: number;
    bottom?: number;
    left: number;
    width: number;
    dropUp: boolean;
  } | null>(null);

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

  const updatePosition = () => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const screenW = window.innerWidth;
    const screenH = window.innerHeight;
    const spaceBelow = screenH - rect.bottom;
    const spaceAbove = rect.top;
    const dropUp = spaceBelow < 260 && spaceAbove > spaceBelow;

    const width = Math.min(Math.max(rect.width, 240), screenW - 24);
    let left = rect.left;
    if (left + width > screenW - 12) {
      left = Math.max(12, screenW - 12 - width);
    }
    if (left < 12) left = 12;

    if (dropUp) {
      setMenuCoords({
        bottom: screenH - rect.top + 6,
        left,
        width,
        dropUp: true,
      });
    } else {
      setMenuCoords({
        top: rect.bottom + 6,
        left,
        width,
        dropUp: false,
      });
    }
  };

  useEffect(() => {
    if (isOpen) updatePosition();
  }, [isOpen]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as Node;
      if (
        containerRef.current &&
        !containerRef.current.contains(target) &&
        menuRef.current &&
        !menuRef.current.contains(target)
      ) {
        setIsOpen(false);
      }
    };
    const handleScrollOrResize = (e: Event) => {
      if (menuRef.current && menuRef.current.contains(e.target as Node)) return;
      if (isOpen) updatePosition();
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      window.addEventListener('resize', handleScrollOrResize);
      window.addEventListener('scroll', handleScrollOrResize, true);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      window.removeEventListener('resize', handleScrollOrResize);
      window.removeEventListener('scroll', handleScrollOrResize, true);
    };
  }, [isOpen]);

  const sizeStyles = {
    sm: 'h-9 px-3 text-xs rounded-xl',
    md: 'h-10 px-3.5 text-xs sm:text-sm rounded-xl',
    lg: 'h-12 px-4 text-sm rounded-2xl',
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
        onClick={() => {
          if (!isOpen) updatePosition();
          setIsOpen(!isOpen);
        }}
        className={`w-full flex items-center justify-between gap-2 bg-slate-100/90 dark:bg-slate-800 hover:bg-slate-200/80 dark:hover:bg-slate-700/80 text-slate-800 dark:text-slate-100 border border-slate-300/80 dark:border-slate-700 shadow-none transition focus-visible:ring-2 focus-visible:ring-indigo-500 font-semibold cursor-pointer ${sizeStyles[size]}`}
      >
        <div className="flex items-center gap-2 min-w-0">
          <CountryFlag languageId={activeLang.id} countryCode={activeLang.countryCode} size="sm" />
          <span className="truncate font-bold">{activeLang.nativeName}</span>
          <span className="text-slate-400 font-normal text-xs truncate">({activeLang.name})</span>
        </div>
        <ChevronDown
          className={`w-4 h-4 text-slate-400 transition-transform duration-200 shrink-0 ${
            isOpen ? 'rotate-180 text-indigo-600' : ''
          }`}
        />
      </button>

      {/* Dropdown Menu Portal */}
      {isOpen &&
        menuCoords &&
        createPortal(
          <div
            ref={menuRef}
            style={{
              position: 'fixed',
              top: menuCoords.top !== undefined ? `${menuCoords.top}px` : undefined,
              bottom: menuCoords.bottom !== undefined ? `${menuCoords.bottom}px` : undefined,
              left: `${menuCoords.left}px`,
              width: `${menuCoords.width}px`,
              zIndex: 99999,
            }}
            className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150"
          >
            {/* Search Box */}
            <div className="p-2 border-b border-slate-200/80 dark:border-slate-700/80">
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
          </div>,
          document.body
        )}
    </div>
  );
};

export default LanguageSelector;
