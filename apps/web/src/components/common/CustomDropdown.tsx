import React, { useState, useRef, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
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
  const menuRef = useRef<HTMLDivElement>(null);
  const [menuCoords, setMenuCoords] = useState<{
    top?: number;
    bottom?: number;
    left: number;
    minWidth: number;
    maxWidth: number;
    dropUp: boolean;
  } | null>(null);

  const updatePosition = useCallback(() => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const spaceBelow = window.innerHeight - rect.bottom;
    const spaceAbove = rect.top;
    const dropUp = spaceBelow < 220 && spaceAbove > spaceBelow;

    const triggerWidth = rect.width;
    // Cho width dài max tối đa 200% cái ô
    const maxWidth = Math.min(Math.max(triggerWidth * 2, 280), window.innerWidth - 24);
    const minWidth = Math.max(triggerWidth, 160);

    // Ensure left does not bleed past right edge of window
    let left = rect.left;
    if (left + maxWidth > window.innerWidth - 12) {
      left = Math.max(12, rect.right - maxWidth);
    }
    if (left < 12) left = 12;

    if (dropUp) {
      setMenuCoords({
        bottom: window.innerHeight - rect.top + 6,
        left,
        minWidth,
        maxWidth,
        dropUp: true,
      });
    } else {
      setMenuCoords({
        top: rect.bottom + 6,
        left,
        minWidth,
        maxWidth,
        dropUp: false,
      });
    }
  }, []);

  // Update position when opened
  useEffect(() => {
    if (isOpen) {
      updatePosition();
    }
  }, [isOpen, updatePosition]);

  // Handle outside click, escape, and scroll / resize repositioning
  useEffect(() => {
    if (!isOpen) return;

    const handleOutsideClick = (e: MouseEvent) => {
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

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsOpen(false);
      }
    };

    const handleScrollOrResize = (e: Event) => {
      // If scrolling inside the dropdown menu itself, do not close or reposition
      if (menuRef.current && menuRef.current.contains(e.target as Node)) {
        return;
      }
      updatePosition();
    };

    document.addEventListener('mousedown', handleOutsideClick);
    document.addEventListener('keydown', handleKeyDown);
    window.addEventListener('resize', handleScrollOrResize);
    window.addEventListener('scroll', handleScrollOrResize, true);

    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
      document.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('resize', handleScrollOrResize);
      window.removeEventListener('scroll', handleScrollOrResize, true);
    };
  }, [isOpen, updatePosition]);

  const selectedOption = options.find((opt) => String(opt.value) === String(value));
  const SelectedIcon = selectedOption?.icon;

  const sizeClasses = {
    sm: 'h-9 px-3 text-xs rounded-xl',
    md: 'h-10 px-3.5 text-xs sm:text-sm rounded-xl',
    lg: 'h-12 px-4 text-sm rounded-2xl',
  }[size];

  return (
    <div ref={containerRef} className={`relative inline-block text-left ${className}`}>
      {/* Trigger Button - Synchronized with modal & filter input theme */}
      <button
        type="button"
        disabled={disabled}
        onClick={() => {
          if (!disabled) {
            if (!isOpen) updatePosition();
            setIsOpen(!isOpen);
          }
        }}
        className={`w-full flex items-center justify-between gap-2.5 bg-slate-100/90 dark:bg-slate-800 hover:bg-slate-200/80 dark:hover:bg-slate-700/80 border border-slate-300/80 dark:border-slate-700 text-slate-800 dark:text-slate-100 font-semibold transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 disabled:opacity-50 disabled:cursor-not-allowed ${sizeClasses}`}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
      >
        <div className="flex items-center gap-2 min-w-0 truncate pl-0.5">
          {LeftIcon && <LeftIcon className="w-4 h-4 text-slate-400 shrink-0 ml-0.5" />}
          {SelectedIcon && <SelectedIcon className="w-4 h-4 text-indigo-600 dark:text-indigo-400 shrink-0 ml-0.5" />}
          <span className="truncate font-semibold text-slate-800 dark:text-slate-100">
            {selectedOption ? selectedOption.label : placeholder}
          </span>
          {selectedOption?.badge !== undefined && (
            <span className="px-1.5 py-0.5 rounded-md text-[10px] font-extrabold uppercase bg-slate-200/80 dark:bg-slate-700 text-slate-700 dark:text-slate-300 border border-slate-300/60 dark:border-slate-600 shrink-0">
              {selectedOption.badge}
            </span>
          )}
        </div>

        <ChevronDown
          className={`w-4 h-4 text-slate-400 shrink-0 mr-0.5 transition-transform duration-300 ${
            isOpen ? 'rotate-180 text-indigo-600 dark:text-indigo-400' : ''
          }`}
        />
      </button>

      {/* Portal Dropdown Menu: Không bị overflow modal, max width tối đa 200% cái ô, tự đẩy xuống */}
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
              minWidth: `${menuCoords.minWidth}px`,
              maxWidth: `${menuCoords.maxWidth}px`,
              width: 'max-content',
              zIndex: 99999,
            }}
            className={`rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-300/80 dark:border-slate-700 shadow-xl p-1 space-y-0.5 max-h-64 overflow-y-auto overflow-x-hidden animate-scale-up ${menuClassName}`}
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
                    className={`w-full text-left px-3 py-2 rounded-lg text-xs sm:text-sm font-semibold flex items-center justify-between gap-3 transition-colors ${
                      isSelected
                        ? 'bg-indigo-600/10 dark:bg-indigo-500/20 text-indigo-700 dark:text-indigo-300 font-bold border border-indigo-500/25'
                        : 'text-slate-700 dark:text-slate-300 hover:bg-slate-200/70 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white'
                    }`}
                  >
                    <div className="flex items-center gap-2 min-w-0 truncate pl-0.5">
                      {OptionIcon && (
                        <OptionIcon
                          className={`w-4 h-4 shrink-0 ml-0.5 ${
                            isSelected
                              ? 'text-indigo-600 dark:text-indigo-400'
                              : 'text-slate-400 group-hover:text-slate-600 dark:group-hover:text-slate-200'
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

                    <div className="flex items-center gap-2 shrink-0 pr-0.5">
                      {option.badge !== undefined && (
                        <span
                          className={`px-1.5 py-0.5 rounded-md text-[10px] font-extrabold uppercase ${
                            isSelected
                              ? 'bg-indigo-500/20 text-indigo-600 dark:text-indigo-300'
                              : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400'
                          }`}
                        >
                          {option.badge}
                        </span>
                      )}
                      {isSelected && <Check className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400 shrink-0" />}
                    </div>
                  </button>
                );
              })
            )}
          </div>,
          document.body
        )}
    </div>
  );
};
