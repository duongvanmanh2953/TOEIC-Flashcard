import React, { useState, useRef, useEffect, useId } from 'react';
import { ChevronDown, Check, Search, X } from 'lucide-react';

export interface SelectOption<T = string | number> {
  value: T;
  label: string;
  badge?: string | number;
  badgeColor?: string;
  icon?: React.ComponentType<{ className?: string }> | React.ReactNode;
  description?: string;
  disabled?: boolean;
}

export interface CustomSelectProps<T = string | number> {
  value: T;
  onChange: (value: T) => void;
  options: SelectOption<T>[];
  placeholder?: string;
  icon?: React.ComponentType<{ className?: string }> | React.ReactNode;
  label?: string;
  error?: string;
  disabled?: boolean;
  searchable?: boolean;
  searchPlaceholder?: string;
  clearable?: boolean;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  menuClassName?: string;
}

export function CustomSelect<T extends string | number>({
  value,
  onChange,
  options,
  placeholder = 'Chọn một mục...',
  icon: LeftIcon,
  label,
  error,
  disabled = false,
  searchable = false,
  searchPlaceholder = 'Tìm kiếm...',
  clearable = false,
  size = 'md',
  className = '',
  menuClassName = '',
}: CustomSelectProps<T>) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [focusedIndex, setFocusedIndex] = useState(-1);
  const [dropUp, setDropUp] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const listboxRef = useRef<HTMLUListElement>(null);
  const id = useId();

  // Smart search trigger: automatically enable search when options >= 6 or explicitly requested
  const shouldSearch = searchable || options.length >= 6;

  // Accent-insensitive normalization for Vietnamese & English
  const normalize = (str: string) =>
    str.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim();

  const filteredOptions = shouldSearch && searchQuery.trim()
    ? options.filter((opt) => {
        const q = normalize(searchQuery);
        const labelNorm = normalize(opt.label);
        const descNorm = opt.description ? normalize(opt.description) : '';
        return labelNorm.includes(q) || descNorm.includes(q);
      })
    : options;

  const selectedOption = options.find((opt) => opt.value === value);
  const SelectedIcon = selectedOption?.icon;

  const renderIcon = (
    iconNode: React.ComponentType<{ className?: string }> | React.ReactNode,
    iconClass: string
  ) => {
    if (!iconNode) return null;
    if (React.isValidElement(iconNode)) {
      return <div className="shrink-0 flex items-center">{iconNode}</div>;
    }
    if (
      typeof iconNode === 'function' ||
      (typeof iconNode === 'object' && iconNode !== null && ('$$typeof' in iconNode || 'render' in iconNode))
    ) {
      const IconComponent = iconNode as React.ComponentType<{ className?: string }>;
      return <IconComponent className={iconClass} />;
    }
    return <div className="shrink-0 flex items-center">{iconNode}</div>;
  };

  // Collision detection: Check if dropdown needs to flip upwards
  const updatePosition = () => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const screenH = window.innerHeight;
    const spaceBelow = screenH - rect.bottom;
    const spaceAbove = rect.top;
    setDropUp(spaceBelow < 280 && spaceAbove > spaceBelow);
  };

  // Handle click outside to close
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
        setSearchQuery('');
      }
    };
    if (isOpen) {
      updatePosition();
      document.addEventListener('mousedown', handleOutsideClick);
      window.addEventListener('resize', updatePosition);
      window.addEventListener('scroll', updatePosition, true);
    }
    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
      window.removeEventListener('resize', updatePosition);
      window.removeEventListener('scroll', updatePosition, true);
    };
  }, [isOpen]);

  // Focus search input when dropdown opens
  useEffect(() => {
    if (isOpen && shouldSearch) {
      setTimeout(() => {
        searchInputRef.current?.focus();
      }, 50);
    }
    if (isOpen) {
      const idx = filteredOptions.findIndex((opt) => opt.value === value);
      setFocusedIndex(idx >= 0 ? idx : 0);
    } else {
      setSearchQuery('');
      setFocusedIndex(-1);
    }
  }, [isOpen, shouldSearch, value]);

  // Scroll focused option into view
  useEffect(() => {
    if (isOpen && listboxRef.current && focusedIndex >= 0) {
      const activeEl = listboxRef.current.children[focusedIndex] as HTMLElement;
      if (activeEl) {
        activeEl.scrollIntoView({ block: 'nearest' });
      }
    }
  }, [focusedIndex, isOpen]);

  // Keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (disabled) return;

    if (!isOpen) {
      if (e.key === 'Enter' || e.key === ' ' || e.key === 'ArrowDown' || e.key === 'ArrowUp') {
        e.preventDefault();
        setIsOpen(true);
      }
      return;
    }

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setFocusedIndex((prev) => (prev < filteredOptions.length - 1 ? prev + 1 : 0));
        break;
      case 'ArrowUp':
        e.preventDefault();
        setFocusedIndex((prev) => (prev > 0 ? prev - 1 : filteredOptions.length - 1));
        break;
      case 'Enter':
        e.preventDefault();
        if (focusedIndex >= 0 && focusedIndex < filteredOptions.length) {
          const opt = filteredOptions[focusedIndex];
          if (!opt.disabled) {
            onChange(opt.value);
            setIsOpen(false);
            setSearchQuery('');
          }
        }
        break;
      case 'Escape':
        e.preventDefault();
        setIsOpen(false);
        setSearchQuery('');
        break;
      case 'Tab':
        setIsOpen(false);
        break;
    }
  };

  const sizeClasses = {
    sm: 'py-2 px-3 text-xs rounded-xl min-h-[38px]',
    md: 'py-2.5 px-3.5 text-sm rounded-xl min-h-[44px]',
    lg: 'py-3 px-4 text-base rounded-xl min-h-[50px]',
  }[size];

  return (
    <div className={`flex flex-col gap-1 ${className}`} ref={containerRef} onKeyDown={handleKeyDown}>
      {label && (
        <label htmlFor={id} className="text-xs font-semibold text-slate-700 dark:text-slate-300 select-none">
          {label}
        </label>
      )}

      <div className="relative">
        {/* Trigger Button */}
        <button
          id={id}
          type="button"
          disabled={disabled}
          onClick={() => setIsOpen(!isOpen)}
          aria-haspopup="listbox"
          aria-expanded={isOpen}
          className={`w-full flex items-center justify-between gap-2 bg-white dark:bg-[#162033] hover:bg-slate-50 dark:hover:bg-[#1a273e] text-left border ${
            error
              ? 'border-rose-500/80 ring-1 ring-rose-500/30'
              : isOpen
              ? 'border-indigo-500 ring-2 ring-indigo-500/20'
              : 'border-slate-200 dark:border-slate-700/80 hover:border-slate-300 dark:hover:border-slate-600'
          } backdrop-blur-xl transition-all duration-150 focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed select-none ${sizeClasses}`}
        >
          <div className="flex items-center gap-2 min-w-0 flex-1">
            {renderIcon(LeftIcon, 'w-3.5 h-3.5 text-slate-400 dark:text-slate-400 shrink-0')}
            {renderIcon(SelectedIcon, 'w-3.5 h-3.5 text-indigo-500 dark:text-indigo-400 shrink-0')}
            <span
              className={`truncate font-medium ${
                selectedOption ? 'text-slate-900 dark:text-slate-100' : 'text-slate-400 dark:text-slate-400'
              }`}
            >
              {selectedOption ? selectedOption.label : placeholder}
            </span>
            {selectedOption?.badge !== undefined && (
              <span
                className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase shrink-0 ${
                  selectedOption.badgeColor || 'bg-indigo-50 dark:bg-indigo-500/20 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-500/30'
                }`}
              >
                {selectedOption.badge}
              </span>
            )}
          </div>

          <div className="flex items-center gap-1 shrink-0">
            {clearable && selectedOption && !disabled && (
              <span
                role="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onChange('' as any);
                }}
                className="p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition"
              >
                <X className="w-3.5 h-3.5" />
              </span>
            )}
            <ChevronDown
              className={`w-4 h-4 text-slate-400 dark:text-slate-400 transition-transform duration-200 ${
                isOpen ? 'rotate-180 text-indigo-500 dark:text-indigo-400' : ''
              }`}
            />
          </div>
        </button>

        {/* Dropdown Menu with Collision Drop-Up Detection */}
        {isOpen && (
          <div
            className={`absolute z-50 ${
              dropUp ? 'bottom-full mb-1.5' : 'top-full mt-1.5'
            } w-full min-w-[220px] max-w-[min(50vw,520px)] sm:max-w-none bg-white/95 dark:bg-[#162033]/98 backdrop-blur-2xl border border-slate-200 dark:border-slate-700/80 rounded-xl p-1.5 text-xs shadow-2xl animate-in fade-in zoom-in-95 duration-150 ${menuClassName}`}
            style={{ maxHeight: '300px', display: 'flex', flexDirection: 'column' }}
          >
            {/* Search Input */}
            {shouldSearch && (
              <div className="p-1.5 border-b border-slate-100 dark:border-slate-700/60 shrink-0">
                <div className="relative">
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
                  <input
                    ref={searchInputRef}
                    type="text"
                    value={searchQuery}
                    onChange={(e) => {
                      setSearchQuery(e.target.value);
                      setFocusedIndex(0);
                    }}
                    placeholder={searchPlaceholder}
                    className="w-full pl-8 pr-3 py-1.5 rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-400 focus:outline-none focus:border-indigo-500"
                    onClick={(e) => e.stopPropagation()}
                  />
                </div>
              </div>
            )}

            {/* Options List */}
            <ul
              ref={listboxRef}
              role="listbox"
              className="overflow-y-auto p-0.5 space-y-0.5 chat-scrollbar flex-1 min-h-0"
              style={{ maxHeight: shouldSearch ? '220px' : '260px' }}
            >
              {filteredOptions.length === 0 ? (
                <li className="py-4 text-center text-xs text-slate-400 dark:text-slate-400 select-none">
                  Không tìm thấy lựa chọn phù hợp
                </li>
              ) : (
                filteredOptions.map((opt, index) => {
                  const isSelected = opt.value === value;
                  const isFocused = index === focusedIndex;
                  const OptionIcon = opt.icon;

                  return (
                    <li
                      key={String(opt.value)}
                      role="option"
                      aria-selected={isSelected}
                      onClick={() => {
                        if (opt.disabled) return;
                        onChange(opt.value);
                        setIsOpen(false);
                        setSearchQuery('');
                      }}
                      onMouseEnter={() => setFocusedIndex(index)}
                      className={`flex items-center justify-between gap-2 px-3.5 py-2.5 rounded-xl cursor-pointer transition select-none text-xs sm:text-sm ${
                        opt.disabled
                          ? 'opacity-40 cursor-not-allowed text-slate-400'
                          : isSelected
                          ? 'bg-indigo-50 dark:bg-indigo-600/25 text-indigo-700 dark:text-indigo-200 font-semibold border border-indigo-200 dark:border-indigo-500/40'
                          : isFocused
                          ? 'bg-slate-100 dark:bg-slate-700/60 text-slate-900 dark:text-white'
                          : 'text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700/50 hover:text-slate-900 dark:hover:text-white'
                      }`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0 flex-1">
                        {renderIcon(
                          OptionIcon,
                          `w-4 h-4 shrink-0 ${
                            isSelected ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-400'
                          }`
                        )}
                        <div className="flex flex-col min-w-0 flex-1">
                          <span className="whitespace-normal break-words leading-snug">{opt.label}</span>
                          {opt.description && (
                            <span className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 whitespace-normal break-words">
                              {opt.description}
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0">
                        {opt.badge !== undefined && (
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                              opt.badgeColor || 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700'
                            }`}
                          >
                            {opt.badge}
                          </span>
                        )}
                        {isSelected && (
                          <Check className="w-4 h-4 text-indigo-600 dark:text-indigo-400 shrink-0" />
                        )}
                      </div>
                    </li>
                  );
                })
              )}
            </ul>
          </div>
        )}
      </div>

      {error && <p className="text-[11px] text-rose-400 mt-0.5">{error}</p>}
    </div>
  );
}

export default CustomSelect;
