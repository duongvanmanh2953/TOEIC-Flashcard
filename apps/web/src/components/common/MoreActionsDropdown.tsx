import React, { useState, useRef, useEffect, useCallback } from 'react';
import { MoreVertical, MoreHorizontal, ChevronRight } from 'lucide-react';

export interface MoreActionItem {
  id?: string;
  label: string;
  icon?: React.ReactNode;
  onClick: (e: React.MouseEvent) => void;
  variant?: 'default' | 'danger' | 'primary' | 'success' | 'warning';
  disabled?: boolean;
  badge?: string | number;
  badgeColor?: string;
  hidden?: boolean;
  divider?: boolean;
  description?: string;
}

export interface MoreActionsDropdownProps {
  items: MoreActionItem[];
  trigger?: React.ReactNode;
  label?: string;
  orientation?: 'vertical' | 'horizontal';
  iconOnly?: boolean;
  align?: 'left' | 'right';
  size?: 'xs' | 'sm' | 'md';
  className?: string;
  menuClassName?: string;
  tooltip?: string;
  disabled?: boolean;
}

export const MoreActionsDropdown: React.FC<MoreActionsDropdownProps> = ({
  items,
  trigger,
  label,
  orientation = 'vertical',
  iconOnly,
  align = 'right',
  size = 'sm',
  className = '',
  menuClassName = '',
  tooltip = 'Thao tác khác',
  disabled = false,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [dropUp, setDropUp] = useState(false);
  const [effectiveAlign, setEffectiveAlign] = useState<'left' | 'right'>(align);
  const containerRef = useRef<HTMLDivElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  const visibleItems = items.filter((item) => !item.hidden);

  // Position detection (drop up vs drop down and boundary alignment)
  const checkPosition = useCallback(() => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const windowW = window.innerWidth;
    const windowH = window.innerHeight;

    const spaceBelow = windowH - rect.bottom;
    const spaceAbove = rect.top;
    setDropUp(spaceBelow < 220 && spaceAbove > spaceBelow);

    const estimatedWidth = 200;
    // Check horizontal edge collision
    if (align === 'right') {
      if (rect.right - estimatedWidth < 12 && rect.left + estimatedWidth <= windowW - 12) {
        setEffectiveAlign('left');
      } else {
        setEffectiveAlign('right');
      }
    } else {
      if (rect.left + estimatedWidth > windowW - 12 && rect.right - estimatedWidth >= 12) {
        setEffectiveAlign('right');
      } else {
        setEffectiveAlign('left');
      }
    }
  }, [align]);

  const handleToggle = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (disabled || visibleItems.length === 0) return;
    checkPosition();
    setIsOpen((prev) => !prev);
  };

  // Close when clicking outside
  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (e: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      checkPosition();
      window.addEventListener('resize', checkPosition);
      window.addEventListener('scroll', checkPosition, true);
    }

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('resize', checkPosition);
      window.removeEventListener('scroll', checkPosition, true);
    };
  }, [isOpen, checkPosition]);

  if (visibleItems.length === 0) return null;

  const sizeClasses = {
    xs: 'p-1.5 text-xs rounded-lg min-h-[28px]',
    sm: 'p-2 text-xs rounded-xl min-h-[34px]',
    md: 'p-2.5 text-sm rounded-xl min-h-[40px]',
  }[size];

  const iconSizes = {
    xs: 'w-3.5 h-3.5',
    sm: 'w-4 h-4',
    md: 'w-4.5 h-4.5',
  }[size];

  const DotsIcon = orientation === 'horizontal' ? MoreHorizontal : MoreVertical;

  return (
    <div
      ref={containerRef}
      className={`relative inline-flex items-center text-left ${className}`}
    >
      {/* Trigger Button */}
      {trigger ? (
        <div onClick={handleToggle} className="cursor-pointer">
          {trigger}
        </div>
      ) : (
        <button
          type="button"
          disabled={disabled}
          onClick={handleToggle}
          title={tooltip}
          aria-haspopup="menu"
          aria-expanded={isOpen}
          className={`flex items-center gap-1.5 transition-all select-none border font-medium ${
            label && !iconOnly ? 'px-3' : ''
          } ${
            isOpen
              ? 'bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white border-slate-300 dark:border-slate-600 shadow-sm'
              : 'bg-white dark:bg-slate-900/90 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
          } ${disabled ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer'} ${sizeClasses}`}
        >
          <DotsIcon className={iconSizes} />
          {label && !iconOnly && <span className="font-semibold">{label}</span>}
        </button>
      )}

      {/* Floating Menu */}
      {isOpen && (
        <div
          ref={menuRef}
          role="menu"
          className={`absolute z-50 ${
            effectiveAlign === 'left' ? 'left-0 right-auto' : 'right-0 left-auto'
          } ${
            dropUp ? 'bottom-full mb-1.5' : 'top-full mt-1.5'
          } min-w-[200px] max-w-[calc(100vw-24px)] bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-1.5 shadow-2xl backdrop-blur-xl animate-in fade-in zoom-in-95 duration-150 ${menuClassName}`}
          style={{ maxWidth: 'min(calc(100vw - 24px), 320px)' }}
        >
          <div className="space-y-0.5">
            {visibleItems.map((item, idx) => {
              const isDanger = item.variant === 'danger';
              const isPrimary = item.variant === 'primary';
              const isSuccess = item.variant === 'success';

              const variantStyles = isDanger
                ? 'text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 hover:text-rose-700 dark:hover:text-rose-300'
                : isPrimary
                ? 'text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 hover:text-indigo-700 dark:hover:text-indigo-300'
                : isSuccess
                ? 'text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 hover:text-emerald-700 dark:hover:text-emerald-300'
                : 'text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800/80 hover:text-slate-900 dark:hover:text-white';

              return (
                <React.Fragment key={item.id || idx}>
                  {item.divider && (
                    <div className="my-1 border-t border-slate-100 dark:border-slate-800/80" />
                  )}

                  <button
                    type="button"
                    role="menuitem"
                    disabled={item.disabled}
                    onClick={(e) => {
                      if (item.disabled) return;
                      e.stopPropagation();
                      setIsOpen(false);
                      item.onClick(e);
                    }}
                    className={`w-full flex items-center justify-between gap-2.5 px-3 py-2 rounded-xl text-left text-xs font-medium transition-colors select-none ${variantStyles} ${
                      item.disabled
                        ? 'opacity-40 cursor-not-allowed hover:bg-transparent'
                        : 'cursor-pointer'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0 flex-1">
                      {item.icon && (
                        <span className="shrink-0 flex items-center">
                          {item.icon}
                        </span>
                      )}
                      <div className="flex flex-col min-w-0 flex-1">
                        <span className="truncate">{item.label}</span>
                        {item.description && (
                          <span className="text-[10px] text-slate-400 dark:text-slate-500 font-normal truncate">
                            {item.description}
                          </span>
                        )}
                      </div>
                    </div>

                    {item.badge !== undefined && (
                      <span
                        className={`px-1.5 py-0.5 rounded text-[10px] font-bold shrink-0 ${
                          item.badgeColor ||
                          'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700'
                        }`}
                      >
                        {item.badge}
                      </span>
                    )}
                  </button>
                </React.Fragment>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

export default MoreActionsDropdown;
