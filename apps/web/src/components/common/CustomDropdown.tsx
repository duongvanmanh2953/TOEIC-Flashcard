import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, Check } from 'lucide-react';

export interface DropdownOption {
  value: string | number;
  label: string;
  badge?: string | number;
  icon?: React.ComponentType<{ className?: string }>;
  description?: string;
}

interface CustomDropdownProps {
  value: string | number;
  onChange: (value: any) => void;
  options: DropdownOption[];
  placeholder?: string;
  icon?: React.ComponentType<{ className?: string }>;
  className?: string;
  menuClassName?: string;
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
}

export const CustomDropdown: React.FC<CustomDropdownProps> = ({
  value,
  onChange,
  options,
  placeholder = 'Chọn một mục...',
  icon: LeftIcon,
  className = '',
  menuClassName = '',
  size = 'md',
  disabled = false,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Click outside to close
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleOutsideClick);
      document.addEventListener('keydown', handleKeyDown);
    }

    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  const selectedOption = options.find((opt) => String(opt.value) === String(value));
  const SelectedIcon = selectedOption?.icon;

  const sizeClasses = {
    sm: 'py-1.5 px-3 text-xs rounded-xl',
    md: 'py-2.5 px-3.5 text-xs sm:text-sm rounded-2xl',
    lg: 'py-3.5 px-4 text-sm rounded-2xl',
  }[size];

  return (
    <div ref={containerRef} className={`relative inline-block text-left ${className}`}>
      {/* Trigger Button */}
      <button
        type="button"
        disabled={disabled}
        onClick={() => setIsOpen(!isOpen)}
        className={`w-full flex items-center justify-between gap-2.5 bg-white/85 dark:bg-slate-900/85 backdrop-blur-xl border border-slate-200/90 dark:border-slate-700/90 hover:border-cyan-500/50 dark:hover:border-cyan-400/50 shadow-xs hover:shadow-md transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-cyan-500/20 disabled:opacity-50 disabled:cursor-not-allowed ${sizeClasses}`}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
      >
        <div className="flex items-center gap-2 min-w-0 truncate">
          {LeftIcon && <LeftIcon className="w-4 h-4 text-slate-400 shrink-0" />}
          {SelectedIcon && <SelectedIcon className="w-4 h-4 text-cyan-500 shrink-0" />}
          <span className="truncate font-semibold text-slate-800 dark:text-slate-100">
            {selectedOption ? selectedOption.label : placeholder}
          </span>
          {selectedOption?.badge !== undefined && (
            <span className="px-2 py-0.5 rounded-md text-[10px] font-extrabold uppercase bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border border-cyan-500/20 shrink-0">
              {selectedOption.badge}
            </span>
          )}
        </div>

        <ChevronDown
          className={`w-4 h-4 text-slate-400 shrink-0 transition-transform duration-300 ${
            isOpen ? 'rotate-180 text-cyan-500' : ''
          }`}
        />
      </button>

      {/* Floating Glass Dropdown Menu */}
      {isOpen && (
        <div
          className={`absolute left-0 right-0 mt-2 z-50 min-w-[200px] w-full rounded-2xl bg-white/95 dark:bg-slate-900/95 backdrop-blur-2xl border border-slate-200/90 dark:border-slate-800/90 shadow-2xl p-1.5 space-y-0.5 animate-scale-up max-h-64 overflow-y-auto ${menuClassName}`}
          role="listbox"
        >
          {options.length === 0 ? (
            <div className="py-3 px-4 text-center text-xs text-slate-400">Không có tùy chọn nào</div>
          ) : (
            options.map((option) => {
              const isSelected = String(option.value) === String(value);
              const OptionIcon = option.icon;

              return (
                <button
                  key={String(option.value)}
                  type="button"
                  role="option"
                  aria-selected={isSelected}
                  onClick={() => {
                    onChange(option.value);
                    setIsOpen(false);
                  }}
                  className={`w-full text-left px-3 py-2 rounded-xl text-xs sm:text-sm font-semibold flex items-center justify-between gap-2.5 transition group ${
                    isSelected
                      ? 'bg-gradient-to-r from-blue-600/10 via-indigo-600/10 to-cyan-500/10 text-cyan-600 dark:text-cyan-400 font-bold border border-cyan-500/25 shadow-xs'
                      : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100/90 dark:hover:bg-slate-800/80 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  <div className="flex items-center gap-2 min-w-0 truncate">
                    {OptionIcon && (
                      <OptionIcon
                        className={`w-4 h-4 shrink-0 ${
                          isSelected ? 'text-cyan-500' : 'text-slate-400 group-hover:text-slate-600 dark:group-hover:text-slate-200'
                        }`}
                      />
                    )}
                    <div className="flex flex-col min-w-0">
                      <span className="truncate">{option.label}</span>
                      {option.description && (
                        <span className="text-[11px] text-slate-400 font-normal truncate">
                          {option.description}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    {option.badge !== undefined && (
                      <span
                        className={`px-2 py-0.5 rounded-md text-[10px] font-extrabold uppercase ${
                          isSelected
                            ? 'bg-cyan-500/20 text-cyan-600 dark:text-cyan-300'
                            : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400'
                        }`}
                      >
                        {option.badge}
                      </span>
                    )}
                    {isSelected && <Check className="w-3.5 h-3.5 text-cyan-500 shrink-0" />}
                  </div>
                </button>
              );
            })
          )}
        </div>
      )}
    </div>
  );
};
