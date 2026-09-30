import React, { useState, useRef, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { ChevronDown, Check, X, Search, Loader2 } from 'lucide-react';

export interface SelectOption {
  value: string;
  label: string;
  badge?: string;
  icon?: React.ReactNode;
  disabled?: boolean;
}

export interface AdminSelectProps {
  options: SelectOption[];
  value?: string | string[];
  onChange: (value: any) => void;
  placeholder?: string;
  label?: string;
  helperText?: string;
  error?: string;
  disabled?: boolean;
  loading?: boolean;
  isMulti?: boolean;
  searchable?: boolean;
  clearable?: boolean;
  size?: 'sm' | 'md' | 'lg';
  align?: 'auto' | 'left' | 'right';
  className?: string;
  id?: string;
}

export const AdminSelect: React.FC<AdminSelectProps> = ({
  options,
  value,
  onChange,
  placeholder = 'Chọn một mục...',
  label,
  helperText,
  error,
  disabled = false,
  loading = false,
  isMulti = false,
  searchable = true,
  clearable = true,
  size = 'md',
  align = 'auto',
  className = '',
  id,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [dropUp, setDropUp] = useState(false);
  const [horizontalAlign, setHorizontalAlign] = useState<'left' | 'right'>('left');
  const [menuCoords, setMenuCoords] = useState<{
    top?: number;
    bottom?: number;
    left?: number;
    right?: number;
    width: number;
    dropUp: boolean;
  } | null>(null);

  const containerRef = useRef<HTMLDivElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Position detection and boundary clamping ("căn lề theo mép")
  const updatePosition = useCallback(() => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const screenW = window.innerWidth;
    const screenH = window.innerHeight;

    // Vertical collision: flip up if cramped below
    const spaceBelow = screenH - rect.bottom;
    const spaceAbove = rect.top;
    const isDropUp = spaceBelow < 280 && spaceAbove > spaceBelow;
    setDropUp(isDropUp);

    const minW = Math.max(rect.width, 200);
    const wouldOverflowRight = rect.left + minW > screenW - 16;
    const isRight = align === 'right' || (align === 'auto' && (wouldOverflowRight || rect.right > screenW * 0.65));
    setHorizontalAlign(isRight ? 'right' : 'left');

    const top = isDropUp ? undefined : rect.bottom + 6;
    const bottom = isDropUp ? screenH - rect.top + 6 : undefined;
    const left = isRight ? undefined : Math.max(12, rect.left);
    const right = isRight ? Math.max(12, screenW - rect.right) : undefined;
    const width = Math.min(Math.max(rect.width, 200), screenW - 24);

    setMenuCoords({ top, bottom, left, right, width, dropUp: isDropUp });
  }, [align]);

  // Handle open state, outside clicks, resize & scroll
  useEffect(() => {
    if (!isOpen) return;

    updatePosition();

    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as Node;
      if (
        containerRef.current &&
        !containerRef.current.contains(target) &&
        menuRef.current &&
        !menuRef.current.contains(target)
      ) {
        setIsOpen(false);
        setSearchQuery('');
      }
    };

    const handleScrollOrResize = (e: Event) => {
      if (menuRef.current && menuRef.current.contains(e.target as Node)) return;
      updatePosition();
    };

    document.addEventListener('mousedown', handleClickOutside);
    window.addEventListener('resize', handleScrollOrResize);
    window.addEventListener('scroll', handleScrollOrResize, true);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      window.removeEventListener('resize', handleScrollOrResize);
      window.removeEventListener('scroll', handleScrollOrResize, true);
    };
  }, [isOpen, updatePosition]);

  useEffect(() => {
    if (isOpen && searchable && searchInputRef.current) {
      setTimeout(() => searchInputRef.current?.focus(), 50);
    }
  }, [isOpen, searchable]);

  const sizeClasses = {
    sm: 'min-h-[38px] py-1.5 px-3 text-xs rounded-xl',
    md: 'min-h-[44px] py-2 px-3.5 text-sm rounded-xl',
    lg: 'min-h-[50px] py-2.5 px-4 text-base rounded-xl',
  };

  const renderOptionIcon = (iconItem: any, iconClass: string = 'w-4 h-4 shrink-0') => {
    if (!iconItem) return null;
    if (React.isValidElement(iconItem)) {
      return <span className="shrink-0 flex items-center">{iconItem}</span>;
    }
    if (
      typeof iconItem === 'function' ||
      (typeof iconItem === 'object' && iconItem !== null && ('$$typeof' in iconItem || 'render' in iconItem))
    ) {
      const IconComp = iconItem;
      return <IconComp className={iconClass} />;
    }
    return <span className="shrink-0 flex items-center">{iconItem}</span>;
  };

  const filteredOptions = options.filter((opt) =>
    opt.label.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const isSelected = (optValue: string) => {
    if (isMulti) {
      return Array.isArray(value) && value.includes(optValue);
    }
    return value === optValue;
  };

  const handleSelect = (optValue: string) => {
    if (disabled) return;
    if (isMulti) {
      const current = Array.isArray(value) ? [...value] : [];
      const index = current.indexOf(optValue);
      if (index > -1) {
        current.splice(index, 1);
      } else {
        current.push(optValue);
      }
      onChange(current);
    } else {
      onChange(optValue);
      setIsOpen(false);
      setSearchQuery('');
    }
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange(isMulti ? [] : '');
  };

  const selectedOptions = options.filter((opt) => isSelected(opt.value));

  return (
    <div className={`relative flex flex-col gap-1.5 ${className}`} ref={containerRef}>
      {label && (
        <label
          htmlFor={id}
          className="text-xs font-semibold text-slate-700 dark:text-slate-300 select-none tracking-wide flex items-center justify-between"
        >
          <span>{label}</span>
          {loading && <Loader2 className="w-3 h-3 text-indigo-500 animate-spin" />}
        </label>
      )}

      {/* Trigger Button */}
      <button
        id={id}
        type="button"
        disabled={disabled || loading}
        onClick={() => setIsOpen((prev) => !prev)}
        className={`w-full flex items-center justify-between gap-2 transition-all duration-200 outline-none select-none text-left
          bg-white dark:bg-slate-900/80 backdrop-blur-md border text-slate-900 dark:text-slate-100
          ${error ? 'border-rose-500/80 ring-1 ring-rose-500/20' : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 focus:border-indigo-500/80 focus:ring-1 focus:ring-indigo-500/30'}
          ${disabled ? 'opacity-50 cursor-not-allowed bg-slate-100 dark:bg-slate-950' : 'cursor-pointer'}
          ${sizeClasses[size]}
        `}
      >
        <div className="flex items-center gap-2 overflow-hidden flex-1">
          {selectedOptions.length === 0 ? (
            <span className="text-slate-400 dark:text-slate-500 truncate">{placeholder}</span>
          ) : isMulti ? (
            <div className="flex items-center gap-1.5 flex-wrap overflow-hidden py-0.5">
              {selectedOptions.map((opt) => (
                <span
                  key={opt.value}
                  className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-indigo-50 dark:bg-indigo-500/15 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-500/30 text-xs font-medium"
                >
                  {opt.label}
                  <X
                    className="w-3 h-3 hover:text-rose-500 cursor-pointer"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleSelect(opt.value);
                    }}
                  />
                </span>
              ))}
            </div>
          ) : (
            <div className="flex items-center gap-2.5 truncate" title={selectedOptions[0].label}>
              {selectedOptions[0].icon && renderOptionIcon(selectedOptions[0].icon, 'w-4 h-4 shrink-0')}
              <span className="truncate font-medium">{selectedOptions[0].label}</span>
              {selectedOptions[0].badge && (
                <span className="px-2 py-0.5 rounded text-[10px] bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700 font-semibold">
                  {selectedOptions[0].badge}
                </span>
              )}
            </div>
          )}
        </div>

        <div className="flex items-center gap-1.5 shrink-0 text-slate-400 dark:text-slate-500">
          {clearable && selectedOptions.length > 0 && !disabled && (
            <span
              onClick={handleClear}
              className="p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-700 dark:hover:text-slate-200 transition"
              title="Xóa lựa chọn"
            >
              <X className="w-3.5 h-3.5" />
            </span>
          )}
          <ChevronDown
            className={`w-4 h-4 transition-transform duration-200 ${isOpen ? 'rotate-180 text-indigo-500' : ''}`}
          />
        </div>
      </button>

      {/* Dropdown Menu with Edge Collision Handling rendered via Portal */}
      {isOpen &&
        menuCoords &&
        typeof document !== 'undefined' &&
        document.body &&
        createPortal(
          <div
            ref={menuRef}
            style={{
              position: 'fixed',
              top: menuCoords.top !== undefined ? `${menuCoords.top}px` : undefined,
              bottom: menuCoords.bottom !== undefined ? `${menuCoords.bottom}px` : undefined,
              left: menuCoords.left !== undefined ? `${menuCoords.left}px` : undefined,
              right: menuCoords.right !== undefined ? `${menuCoords.right}px` : undefined,
              width: `${menuCoords.width}px`,
              maxWidth: 'min(calc(100vw - 24px), 480px)',
              zIndex: 99999,
            }}
            className="max-h-72 overflow-hidden rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 p-1.5 shadow-2xl transition-all duration-200 animate-in fade-in zoom-in-95"
          >
            {/* Optional Search inside Select */}
            {searchable && options.length > 5 && (
              <div className="p-1.5 pb-2 border-b border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs">
                  <Search className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500 shrink-0" />
                  <input
                    ref={searchInputRef}
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Tìm kiếm..."
                    className="bg-transparent border-none outline-none text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 w-full text-xs"
                  />
                  {searchQuery && (
                    <X
                      className="w-3.5 h-3.5 text-slate-400 hover:text-slate-600 dark:text-slate-500 dark:hover:text-slate-300 cursor-pointer"
                      onClick={() => setSearchQuery('')}
                    />
                  )}
                </div>
              </div>
            )}

            {/* Options List */}
            <div className="max-h-56 overflow-y-auto py-1 space-y-0.5 custom-scrollbar">
              {filteredOptions.length === 0 ? (
                <div className="px-4 py-6 text-center text-xs text-slate-400 dark:text-slate-500">
                  Không tìm thấy kết quả phù hợp
                </div>
              ) : (
                filteredOptions.map((opt) => {
                  const selected = isSelected(opt.value);
                  return (
                    <div
                      key={opt.value}
                      onClick={() => !opt.disabled && handleSelect(opt.value)}
                      className={`flex items-center justify-between px-3.5 py-2.5 text-xs sm:text-sm rounded-xl transition cursor-pointer select-none
                        ${selected ? 'bg-indigo-50 dark:bg-indigo-500/20 text-indigo-700 dark:text-indigo-200 font-semibold border border-indigo-200 dark:border-indigo-500/40' : 'text-slate-800 dark:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white'}
                        ${opt.disabled ? 'opacity-40 cursor-not-allowed text-slate-400 dark:text-slate-500' : ''}
                      `}
                    >
                      <div className="flex items-center gap-2.5 truncate" title={opt.label}>
                        {opt.icon && renderOptionIcon(opt.icon, 'w-4 h-4 shrink-0')}
                        <span className="truncate">{opt.label}</span>
                        {opt.badge && (
                          <span className="px-2 py-0.5 rounded text-[10px] bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700 font-medium">
                            {opt.badge}
                          </span>
                        )}
                      </div>
                      {selected && <Check className="w-4 h-4 text-indigo-600 dark:text-indigo-400 shrink-0" />}
                    </div>
                  );
                })
              )}
            </div>
          </div>,
          document.body
        )}

      {/* Error or Helper text */}
      {error ? (
        <span className="text-[11px] text-rose-500 dark:text-rose-400 font-medium">{error}</span>
      ) : helperText ? (
        <span className="text-[11px] text-slate-500">{helperText}</span>
      ) : null}
    </div>
  );
};
