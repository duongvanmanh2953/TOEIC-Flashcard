import React, { useState, useRef, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { ChevronDown, Check } from 'lucide-react';

export interface FilterOption<T = string> {
  value: T;
  label: string;
  badge?: string | number;
  icon?: React.ComponentType<{ className?: string }> | React.ReactNode;
}

export interface FilterSelectProps<T = string> {
  value: T;
  onChange: (value: T) => void;
  options: FilterOption<T>[];
  label?: string;
  icon?: React.ComponentType<{ className?: string }> | React.ReactNode;
  className?: string;
  size?: 'xs' | 'sm' | 'md';
  align?: 'auto' | 'left' | 'right';
  fullWidth?: boolean;
}

export function FilterSelect<T extends string | number>({
  value,
  onChange,
  options,
  label,
  icon: LeftIcon,
  className = '',
  size = 'xs',
  align = 'auto',
  fullWidth = false,
}: FilterSelectProps<T>) {
  const [isOpen, setIsOpen] = useState(false);
  const [dropUp, setDropUp] = useState(false);
  const [horizontalAlign, setHorizontalAlign] = useState<'left' | 'right'>('left');
  const [menuCoords, setMenuCoords] = useState<{
    top?: number;
    bottom?: number;
    left?: number;
    right?: number;
    width?: number;
    dropUp: boolean;
  } | null>(null);

  const containerRef = useRef<HTMLDivElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  const selectedOption = options.find((opt) => opt.value === value);
  const isFullWidth = fullWidth || className.includes('w-full');

  const updatePosition = useCallback(() => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const screenW = window.innerWidth;
    const screenH = window.innerHeight;

    const spaceBelow = screenH - rect.bottom;
    const spaceAbove = rect.top;
    const isDropUp = spaceBelow < 220 && spaceAbove > spaceBelow;
    setDropUp(isDropUp);

    const minW = isFullWidth ? rect.width : Math.max(rect.width, 160);
    const wouldOverflowRight = rect.left + minW > screenW - 12;
    const isRight = align === 'right' || (align === 'auto' && (wouldOverflowRight || rect.right > screenW * 0.65));
    setHorizontalAlign(isRight ? 'right' : 'left');

    const top = isDropUp ? undefined : rect.bottom + 6;
    const bottom = isDropUp ? screenH - rect.top + 6 : undefined;
    const left = isRight ? undefined : Math.max(12, rect.left);
    const right = isRight ? Math.max(12, screenW - rect.right) : undefined;
    const width = isFullWidth ? Math.min(rect.width, screenW - 24) : undefined;

    setMenuCoords({ top, bottom, left, right, width, dropUp: isDropUp });
  }, [align, isFullWidth]);

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

  const sizeClasses = {
    xs: 'py-1 px-2 text-[11px] rounded-lg min-h-[28px]',
    sm: 'py-2 px-3 text-xs rounded-xl min-h-[38px]',
    md: 'py-2.5 px-3.5 text-xs sm:text-sm rounded-xl min-h-[42px]',
  }[size];

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

  return (
    <div className={`relative ${isFullWidth ? 'w-full block' : 'inline-block'} ${className}`} ref={containerRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`${
          isFullWidth ? 'w-full justify-between' : ''
        } flex items-center gap-2 bg-slate-900/90 hover:bg-slate-800 border border-slate-800 hover:border-slate-700 text-slate-300 hover:text-white transition font-medium shadow-xs select-none focus:outline-none focus:ring-1 focus:ring-indigo-500/40 cursor-pointer ${sizeClasses}`}
      >
        <div className="flex items-center gap-1.5 truncate flex-1 min-w-0">
          {renderIcon(LeftIcon, 'w-3.5 h-3.5 text-slate-400 shrink-0')}
          {!LeftIcon && renderIcon(selectedOption?.icon, 'w-3.5 h-3.5 text-slate-400 shrink-0')}
          {label && <span className="text-slate-500 font-normal shrink-0">{label}:</span>}
          <span className={`font-semibold text-slate-200 truncate ${isFullWidth ? 'flex-1 text-left' : 'max-w-[140px]'}`}>
            {selectedOption ? selectedOption.label : String(value)}
          </span>
          {selectedOption?.badge !== undefined && (
            <span className="px-1.5 py-0.5 rounded bg-indigo-500/20 text-indigo-300 text-[9px] font-bold shrink-0">
              {selectedOption.badge}
            </span>
          )}
        </div>
        <ChevronDown
          className={`w-3.5 h-3.5 text-slate-400 transition-transform duration-200 shrink-0 ml-1 ${
            isOpen ? 'rotate-180 text-indigo-400' : ''
          }`}
        />
      </button>

      {/* Floating Menu via Portal - 100% independent from parent layout, never clipped by overflow */}
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
              width: menuCoords.width !== undefined ? `${menuCoords.width}px` : undefined,
              minWidth: isFullWidth ? undefined : '160px',
              maxWidth: isFullWidth ? 'min(calc(100vw - 24px), 480px)' : 'min(calc(100vw - 24px), 320px)',
              zIndex: 99999,
            }}
            className="bg-slate-900/98 backdrop-blur-xl border border-slate-800 rounded-xl shadow-2xl p-1 text-xs animate-in fade-in zoom-in-95 duration-100"
          >
            <div className="overflow-y-auto max-h-56 p-0.5 space-y-0.5 chat-scrollbar">
              {options.map((opt) => {
                const isSelected = opt.value === value;
                const OptIcon = opt.icon;

                return (
                  <button
                    key={String(opt.value)}
                    type="button"
                    onClick={() => {
                      onChange(opt.value);
                      setIsOpen(false);
                    }}
                    className={`w-full flex items-center justify-between gap-2 px-2 py-1.5 rounded-lg text-left transition select-none ${
                      isSelected
                        ? 'bg-indigo-600/25 text-indigo-200 font-bold border border-indigo-500/30'
                        : 'text-slate-300 hover:bg-slate-800/80 hover:text-white'
                    }`}
                  >
                    <div className="flex items-center gap-1.5 truncate">
                      {renderIcon(OptIcon, 'w-3 h-3 text-slate-400 shrink-0')}
                      <span className="truncate">{opt.label}</span>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      {opt.badge !== undefined && (
                        <span className="px-1.5 py-0.2 rounded bg-slate-800 text-slate-400 text-[9px] font-bold">
                          {opt.badge}
                        </span>
                      )}
                      {isSelected && <Check className="w-3 h-3 text-indigo-400" />}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>,
          document.body
        )}
    </div>
  );
}

export default FilterSelect;
