import React, { useState, useRef, useEffect, useId } from 'react';
import { ChevronDown, Check, Search, X } from 'lucide-react';

export interface SelectOption<T = string | number> {
  value: T;
  label: string;
  badge?: string | number;
  badgeColor?: string;
  icon?: React.ComponentType<{ className?: string }>;
  description?: string;
  disabled?: boolean;
}

export interface CustomSelectProps<T = string | number> {
  value: T;
  onChange: (value: T) => void;
  options: SelectOption<T>[];
  placeholder?: string;
  icon?: React.ComponentType<{ className?: string }>;
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

  const containerRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const listboxRef = useRef<HTMLUListElement>(null);
  const id = useId();

  const filteredOptions = searchable && searchQuery.trim()
    ? options.filter((opt) =>
        opt.label.toLowerCase().includes(searchQuery.toLowerCase().trim()) ||
        (opt.description && opt.description.toLowerCase().includes(searchQuery.toLowerCase().trim()))
      )
    : options;

  const selectedOption = options.find((opt) => opt.value === value);
  const SelectedIcon = selectedOption?.icon;

  // Handle click outside to close
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
        setSearchQuery('');
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleOutsideClick);
    }
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, [isOpen]);

  // Focus search input when dropdown opens
  useEffect(() => {
    if (isOpen && searchable) {
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
  }, [isOpen, searchable, value]);

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
    sm: 'py-1.5 px-2.5 text-xs rounded-lg min-h-[32px]',
    md: 'py-2 px-3 text-xs sm:text-sm rounded-xl min-h-[40px]',
    lg: 'py-2.5 px-4 text-sm rounded-xl min-h-[48px]',
  }[size];

  return (
    <div className={`flex flex-col gap-1 ${className}`} ref={containerRef} onKeyDown={handleKeyDown}>
      {label && (
        <label htmlFor={id} className="text-xs font-semibold text-slate-300 select-none">
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
          className={`w-full flex items-center justify-between gap-2 bg-slate-900/90 hover:bg-slate-900 text-left border ${
            error
              ? 'border-rose-500/80 ring-1 ring-rose-500/30'
              : isOpen
              ? 'border-indigo-500 ring-2 ring-indigo-500/20 shadow-md shadow-indigo-500/10'
              : 'border-slate-800 hover:border-slate-700'
          } backdrop-blur-xl transition-all duration-150 focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed select-none ${sizeClasses}`}
        >
          <div className="flex items-center gap-2 min-w-0 flex-1 truncate">
            {LeftIcon && <LeftIcon className="w-3.5 h-3.5 text-slate-400 shrink-0" />}
            {SelectedIcon && <SelectedIcon className="w-3.5 h-3.5 text-indigo-400 shrink-0" />}
            <span
              className={`truncate font-medium ${
                selectedOption ? 'text-slate-100' : 'text-slate-500'
              }`}
            >
              {selectedOption ? selectedOption.label : placeholder}
            </span>
            {selectedOption?.badge !== undefined && (
              <span
                className={`px-1.5 py-0.2 rounded text-[9px] font-bold uppercase shrink-0 ${
                  selectedOption.badgeColor || 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30'
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
                className="p-0.5 rounded hover:bg-slate-800 text-slate-500 hover:text-slate-300 transition"
              >
                <X className="w-3 h-3" />
              </span>
            )}
            <ChevronDown
              className={`w-3.5 h-3.5 text-slate-400 transition-transform duration-200 ${
                isOpen ? 'rotate-180 text-indigo-400' : ''
              }`}
            />
          </div>
        </button>

        {/* Dropdown Menu */}
        {isOpen && (
          <div
            className={`absolute z-50 mt-1.5 w-full min-w-[180px] bg-slate-900/95 backdrop-blur-2xl border border-slate-800 rounded-xl shadow-2xl p-1 text-xs animate-in fade-in zoom-in-95 duration-150 ${menuClassName}`}
            style={{ maxHeight: '280px', display: 'flex', flexDirection: 'column' }}
          >
            {/* Search Input */}
            {searchable && (
              <div className="p-1.5 border-b border-slate-800/80 shrink-0">
                <div className="relative">
                  <Search className="w-3 h-3 text-slate-400 absolute left-2 top-2" />
                  <input
                    ref={searchInputRef}
                    type="text"
                    value={searchQuery}
                    onChange={(e) => {
                      setSearchQuery(e.target.value);
                      setFocusedIndex(0);
                    }}
                    placeholder={searchPlaceholder}
                    className="w-full pl-6 pr-2 py-1 rounded-lg bg-slate-950 border border-slate-800 text-xs text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-indigo-500"
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
              style={{ maxHeight: searchable ? '220px' : '260px' }}
            >
              {filteredOptions.length === 0 ? (
                <li className="py-4 text-center text-xs text-slate-500 select-none">
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
                      className={`flex items-center justify-between gap-2 px-2.5 py-1.5 rounded-lg cursor-pointer transition select-none ${
                        opt.disabled
                          ? 'opacity-40 cursor-not-allowed text-slate-600'
                          : isSelected
                          ? 'bg-indigo-600/20 text-indigo-200 font-semibold border border-indigo-500/30'
                          : isFocused
                          ? 'bg-slate-800/90 text-white'
                          : 'text-slate-300 hover:bg-slate-800/60 hover:text-white'
                      }`}
                    >
                      <div className="flex items-center gap-2 min-w-0 flex-1">
                        {OptionIcon && (
                          <OptionIcon
                            className={`w-3.5 h-3.5 shrink-0 ${
                              isSelected ? 'text-indigo-400' : 'text-slate-400'
                            }`}
                          />
                        )}
                        <div className="flex flex-col min-w-0">
                          <span className="truncate">{opt.label}</span>
                          {opt.description && (
                            <span className="text-[10px] text-slate-500 truncate">
                              {opt.description}
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0">
                        {opt.badge !== undefined && (
                          <span
                            className={`px-1.5 py-0.2 rounded text-[9px] font-bold uppercase ${
                              opt.badgeColor || 'bg-slate-800 text-slate-400 border border-slate-700'
                            }`}
                          >
                            {opt.badge}
                          </span>
                        )}
                        {isSelected && (
                          <Check className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
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
