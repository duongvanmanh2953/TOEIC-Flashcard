import React, { useState, useRef, useEffect } from 'react';
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
  className = '',
  id,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
        setSearchQuery('');
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

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

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute z-50 left-0 w-full min-w-[240px] top-full mt-1.5 max-h-72 overflow-hidden rounded-xl bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl border border-slate-200 dark:border-slate-700/80 p-1.5 transition-all duration-200 animate-in fade-in zoom-in-95">
          {/* Optional Search inside Select */}
          {searchable && options.length > 5 && (
            <div className="p-1.5 pb-2 border-b border-slate-100 dark:border-slate-800/80">
              <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-slate-50 dark:bg-slate-950/80 border border-slate-200 dark:border-slate-800 text-xs">
                <Search className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500 shrink-0" />
                <input
                  ref={searchInputRef}
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Tìm kiếm..."
                  className="bg-transparent border-none outline-none text-slate-900 dark:text-slate-200 placeholder-slate-400 dark:placeholder-slate-500 w-full text-xs"
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
                      ${selected ? 'bg-indigo-50 dark:bg-indigo-500/15 text-indigo-700 dark:text-indigo-300 font-semibold' : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/60 hover:text-slate-900 dark:hover:text-slate-100'}
                      ${opt.disabled ? 'opacity-40 cursor-not-allowed' : ''}
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
        </div>
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
