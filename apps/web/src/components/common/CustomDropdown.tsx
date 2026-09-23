import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { ChevronDown, Check, Search, Plus, X } from 'lucide-react';

export interface DropdownOption {
  value: string | number;
  label: string;
  badge?: string | number;
  icon?: React.ComponentType<{ className?: string }> | React.ReactNode;
  description?: string;
}

export interface CustomDropdownProps {
  value?: string | number;
  onChange?: (value: any) => void;
  onSelect?: (value: any) => void;
  align?: 'left' | 'right';
  options: DropdownOption[];
  placeholder?: string;
  icon?: React.ComponentType<{ className?: string }> | React.ReactNode;
  trigger?: React.ReactNode;
  className?: string;
  menuClassName?: string;
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
  searchable?: boolean;
  searchPlaceholder?: string;
  creatable?: boolean;
  createPlaceholder?: string;
  onCreateOption?: (newQuery: string) => void;
  clearable?: boolean;
}

// Utility to remove Vietnamese diacritics for flexible fuzzy searching
const normalizeText = (text: string) =>
  text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim();

export const CustomDropdown: React.FC<CustomDropdownProps> = ({
  value,
  onChange,
  onSelect,
  align,
  options,
  placeholder = 'Chọn một mục...',
  icon: LeftIcon,
  trigger,
  className = '',
  menuClassName = '',
  size = 'md',
  disabled = false,
  searchable,
  searchPlaceholder = 'Tìm kiếm tùy chọn...',
  creatable = false,
  createPlaceholder,
  onCreateOption,
  clearable = false,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [focusedIndex, setFocusedIndex] = useState(-1);

  const containerRef = useRef<HTMLDivElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Auto-enable search if options count is >= 6 or explicitly requested
  const isSearchable = searchable ?? options.length >= 6;

  const [menuCoords, setMenuCoords] = useState<{
    top?: number;
    bottom?: number;
    left?: number;
    right?: number;
    minWidth: number;
    maxWidth: number;
    maxHeight: number;
    dropUp: boolean;
  } | null>(null);

  // Filtered options based on search query
  const filteredOptions = useMemo(() => {
    if (!searchQuery.trim()) return options;
    const queryNorm = normalizeText(searchQuery);
    return options.filter((opt) => {
      const labelNorm = normalizeText(opt.label);
      const descNorm = opt.description ? normalizeText(opt.description) : '';
      return labelNorm.includes(queryNorm) || descNorm.includes(queryNorm);
    });
  }, [options, searchQuery]);

  // Check if query exactly matches an existing option (case-insensitive)
  const exactMatchExists = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return options.some((opt) => opt.label.trim().toLowerCase() === q);
  }, [options, searchQuery]);

  // Calculate viewport collision, adaptive width and vertical placement
  const updatePosition = useCallback(() => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const screenW = window.innerWidth;
    const screenH = window.innerHeight;

    const spaceBelow = screenH - rect.bottom;
    const spaceAbove = rect.top;
    const dropUp = spaceBelow < 240 && spaceAbove > spaceBelow;

    // Viewport-aware Max Width:
    // Desktop: min(50vw, 520px)
    // Mobile: 80vw (capped at screenW - 24px)
    const isMobile = screenW < 640;
    const maxWidth = isMobile
      ? Math.min(Math.floor(screenW * 0.8), screenW - 24)
      : Math.min(Math.floor(screenW * 0.5), 520);

    const triggerWidth = rect.width;
    const minWidth = Math.min(Math.max(triggerWidth, 200), maxWidth);

    // Dynamic horizontal alignment:
    // If opening from rect.left would overflow the right viewport edge,
    // OR if trigger is positioned in the right half of the screen,
    // OR align is explicitly 'right', anchor the dropdown's RIGHT edge to the trigger's RIGHT edge.
    const wouldOverflowRight = rect.left + minWidth > screenW - 12;
    const isRightAnchored = align === 'right' || rect.right > screenW * 0.6 || wouldOverflowRight;

    let left: number | undefined = undefined;
    let right: number | undefined = undefined;

    if (isRightAnchored) {
      // Anchor menu's right edge directly with the trigger's right edge
      const rightDistance = screenW - rect.right;
      right = Math.max(12, rightDistance);
    } else {
      // Anchor menu's left edge directly with the trigger's left edge
      left = Math.max(12, rect.left);
    }

    const availableH = dropUp ? spaceAbove - 20 : spaceBelow - 20;
    const maxHeight = Math.min(Math.max(availableH, 160), 380);
    const calculatedMaxWidth = Math.min(
      maxWidth,
      isRightAnchored ? screenW - (right ?? 12) - 12 : screenW - (left ?? 12) - 12
    );

    if (dropUp) {
      setMenuCoords({
        bottom: screenH - rect.top + 6,
        left,
        right,
        minWidth,
        maxWidth: calculatedMaxWidth,
        maxHeight,
        dropUp: true,
      });
    } else {
      setMenuCoords({
        top: rect.bottom + 6,
        left,
        right,
        minWidth,
        maxWidth: calculatedMaxWidth,
        maxHeight,
        dropUp: false,
      });
    }
  }, []);

  // Open & close handler
  const handleOpen = () => {
    if (disabled) return;
    setSearchQuery('');
    setFocusedIndex(-1);
    updatePosition();
    setIsOpen(true);
  };

  const handleClose = () => {
    setIsOpen(false);
    setSearchQuery('');
    setFocusedIndex(-1);
  };

  // Reposition on open, resize, or non-dropdown scroll
  useEffect(() => {
    if (!isOpen) return;
    updatePosition();

    // Auto-focus search input if searchable
    if (isSearchable && searchInputRef.current) {
      setTimeout(() => {
        searchInputRef.current?.focus();
      }, 50);
    }

    const handleOutsideClick = (e: MouseEvent) => {
      const target = e.target as Node;
      if (
        containerRef.current &&
        !containerRef.current.contains(target) &&
        menuRef.current &&
        !menuRef.current.contains(target)
      ) {
        handleClose();
      }
    };

    const triggerChange = (val: any) => {
      onChange?.(val);
      onSelect?.(val);
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        handleClose();
        return;
      }

      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setFocusedIndex((prev) => (prev < filteredOptions.length - 1 ? prev + 1 : 0));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setFocusedIndex((prev) => (prev > 0 ? prev - 1 : filteredOptions.length - 1));
      } else if (e.key === 'Enter') {
        e.preventDefault();
        if (focusedIndex >= 0 && focusedIndex < filteredOptions.length) {
          triggerChange(filteredOptions[focusedIndex].value);
          handleClose();
        } else if (creatable && searchQuery.trim() && !exactMatchExists) {
          handleCreateOption();
        }
      }
    };

    const handleScrollOrResize = (e: Event) => {
      // Don't reposition if user is simply scrolling the option list
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
  }, [isOpen, updatePosition, isSearchable, filteredOptions, focusedIndex, creatable, searchQuery, exactMatchExists, onChange, onSelect]);

  const handleCreateOption = () => {
    const trimmed = searchQuery.trim();
    if (!trimmed) return;
    if (onCreateOption) {
      onCreateOption(trimmed);
    } else {
      onChange?.(trimmed);
      onSelect?.(trimmed);
    }
    handleClose();
  };

  const selectedOption = options.find((opt) => String(opt.value) === String(value));

  const renderIcon = (iconItem: any, defaultClass: string) => {
    if (!iconItem) return null;
    if (React.isValidElement(iconItem)) {
      return <span className="shrink-0 flex items-center">{iconItem}</span>;
    }
    if (typeof iconItem === 'function') {
      const IconComp = iconItem;
      return <IconComp className={defaultClass} />;
    }
    return null;
  };

  const sizeClasses = {
    sm: 'h-9 px-3 text-xs rounded-xl',
    md: 'h-10 px-3.5 text-xs sm:text-sm rounded-xl',
    lg: 'h-12 px-4 text-sm rounded-2xl',
  }[size];

  return (
    <div
      ref={containerRef}
      className={`relative ${className.includes('w-full') ? 'block' : 'inline-block'} text-left ${className}`}
    >
      {/* Trigger Button */}
      {trigger ? (
        <div
          role="button"
          tabIndex={0}
          onClick={() => (isOpen ? handleClose() : handleOpen())}
          className="cursor-pointer inline-flex items-center"
          aria-haspopup="listbox"
          aria-expanded={isOpen}
        >
          {trigger}
        </div>
      ) : (
        <button
          type="button"
          disabled={disabled}
          onClick={() => (isOpen ? handleClose() : handleOpen())}
          className={`w-full flex items-center justify-between gap-2.5 bg-slate-100/90 dark:bg-slate-800/90 hover:bg-slate-200/80 dark:hover:bg-slate-700/80 border border-slate-300/80 dark:border-slate-700 text-slate-800 dark:text-slate-100 font-semibold transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 disabled:opacity-50 disabled:cursor-not-allowed ${sizeClasses}`}
          aria-haspopup="listbox"
          aria-expanded={isOpen}
        >
          <div className="flex items-center gap-2 min-w-0 truncate pl-0.5">
            {renderIcon(LeftIcon, 'w-4 h-4 text-slate-400 shrink-0 ml-0.5')}
            {renderIcon(selectedOption?.icon, 'w-4 h-4 text-indigo-600 dark:text-indigo-400 shrink-0 ml-0.5')}
            <span className="truncate font-semibold text-slate-800 dark:text-slate-100">
              {selectedOption ? selectedOption.label : placeholder}
            </span>
            {selectedOption?.badge !== undefined && (
              <span className="px-1.5 py-0.5 rounded-md text-[10px] font-extrabold uppercase bg-slate-200/80 dark:bg-slate-700 text-slate-700 dark:text-slate-300 border border-slate-300/60 dark:border-slate-600 shrink-0">
                {selectedOption.badge}
              </span>
            )}
          </div>

          <div className="flex items-center gap-1 shrink-0 mr-0.5">
            {clearable && selectedOption && !disabled && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onChange?.('');
                  onSelect?.('');
                }}
                className="p-0.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition"
                title="Xóa lựa chọn"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
            <ChevronDown
              className={`w-4 h-4 text-slate-400 transition-transform duration-200 ${
                isOpen ? 'rotate-180 text-indigo-600 dark:text-indigo-400' : ''
              }`}
            />
          </div>
        </button>
      )}

      {/* Portal Dropdown Menu: Viewport Collision Protected & Smart Width */}
      {isOpen &&
        menuCoords &&
        createPortal(
          <div
            ref={menuRef}
            style={{
              position: 'fixed',
              top: menuCoords.top !== undefined ? `${menuCoords.top}px` : undefined,
              bottom: menuCoords.bottom !== undefined ? `${menuCoords.bottom}px` : undefined,
              left: menuCoords.left !== undefined ? `${menuCoords.left}px` : undefined,
              right: menuCoords.right !== undefined ? `${menuCoords.right}px` : undefined,
              minWidth: `${menuCoords.minWidth}px`,
              maxWidth: `${menuCoords.maxWidth}px`,
              maxHeight: `${menuCoords.maxHeight}px`,
              width: 'max-content',
              zIndex: 99999,
            }}
            className={`rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700/80 shadow-2xl p-1.5 flex flex-col animate-scale-up ${menuClassName}`}
            role="listbox"
          >
            {/* Sticky Search Header */}
            {isSearchable && (
              <div className="p-1 pb-1.5 border-b border-slate-100 dark:border-slate-800 shrink-0">
                <div className="relative flex items-center h-8">
                  <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    ref={searchInputRef}
                    type="text"
                    value={searchQuery}
                    onChange={(e) => {
                      setSearchQuery(e.target.value);
                      setFocusedIndex(-1);
                    }}
                    placeholder={searchPlaceholder}
                    className="w-full h-full pl-8 pr-7 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:border-indigo-500 font-medium"
                  />
                  {searchQuery && (
                    <button
                      type="button"
                      onClick={() => setSearchQuery('')}
                      className="absolute right-2 top-1/2 -translate-y-1/2 p-0.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  )}
                </div>
              </div>
            )}

            {/* Scrollable Option List */}
            <div className="flex-1 min-h-0 overflow-y-auto space-y-0.5 py-1 pr-0.5">
              {filteredOptions.length === 0 && !creatable ? (
                <div className="py-4 px-3 text-center text-xs text-slate-400">
                  {searchQuery ? `Không tìm thấy kết quả cho "${searchQuery}"` : 'Không có tùy chọn nào'}
                </div>
              ) : (
                filteredOptions.map((option, idx) => {
                  const isSelected = String(option.value) === String(value);
                  const isFocused = idx === focusedIndex;

                  return (
                    <button
                      key={String(option.value)}
                      type="button"
                      role="option"
                      aria-selected={isSelected}
                      onClick={() => {
                        onChange?.(option.value);
                        onSelect?.(option.value);
                        handleClose();
                      }}
                      className={`w-full text-left px-3 py-2 rounded-xl text-xs sm:text-sm font-semibold flex items-center justify-between gap-3 transition-colors ${
                        isSelected
                          ? 'bg-indigo-500/10 dark:bg-indigo-500/20 text-indigo-700 dark:text-indigo-300 font-bold border border-indigo-500/20'
                          : isFocused
                          ? 'bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white'
                          : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white'
                      }`}
                    >
                      <div className="flex items-center gap-2 min-w-0 flex-1">
                        {renderIcon(
                          option.icon,
                          `w-4 h-4 shrink-0 ${
                            isSelected
                              ? 'text-indigo-600 dark:text-indigo-400'
                              : 'text-slate-400'
                          }`
                        )}
                        <div className="flex flex-col min-w-0 flex-1">
                          {/* Text wrapping allowed without truncate */}
                          <span className="whitespace-normal break-words leading-snug">
                            {option.label}
                          </span>
                          {option.description && (
                            <span className="text-[11px] text-slate-400 dark:text-slate-400 font-normal whitespace-normal break-words mt-0.5 leading-tight">
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

              {/* Creatable Action Button */}
              {creatable && searchQuery.trim() && !exactMatchExists && (
                <button
                  type="button"
                  onClick={handleCreateOption}
                  className="w-full text-left px-3 py-2.5 rounded-xl text-xs sm:text-sm font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-50/70 dark:bg-indigo-950/50 hover:bg-indigo-100 dark:hover:bg-indigo-900/60 border border-indigo-200/80 dark:border-indigo-800/80 flex items-center gap-2 transition"
                >
                  <Plus className="w-4 h-4 shrink-0 text-indigo-600 dark:text-indigo-400" />
                  <span className="whitespace-normal break-words">
                    {createPlaceholder
                      ? createPlaceholder.replace('{query}', searchQuery.trim())
                      : `Tạo mới "${searchQuery.trim()}"`}
                  </span>
                </button>
              )}
            </div>
          </div>,
          document.body
        )}
    </div>
  );
};
