import React, { useState, useRef, useEffect } from 'react';
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
  size?: 'xs' | 'sm';
}

export function FilterSelect<T extends string | number>({
  value,
  onChange,
  options,
  label,
  icon: LeftIcon,
  className = '',
  size = 'xs',
}: FilterSelectProps<T>) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const selectedOption = options.find((opt) => opt.value === value);

  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleOutsideClick);
    }
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, [isOpen]);

  const sizeClasses = {
    xs: 'py-1 px-2 text-[11px] rounded-lg',
    sm: 'py-1.5 px-2.5 text-xs rounded-lg',
  }[size];

  return (
    <div className={`relative inline-block ${className}`} ref={containerRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`flex items-center gap-1.5 bg-slate-900/90 hover:bg-slate-800 border border-slate-800 hover:border-slate-700 text-slate-300 hover:text-white transition rounded-lg font-medium shadow-xs select-none focus:outline-none focus:ring-1 focus:ring-indigo-500/40 ${sizeClasses}`}
      >
        {LeftIcon && (
          typeof LeftIcon === 'function' ? (
            <LeftIcon className="w-3 h-3 text-slate-400 shrink-0" />
          ) : (
            <div className="shrink-0 flex items-center">{LeftIcon}</div>
          )
        )}
        {selectedOption?.icon && !LeftIcon && (
          typeof selectedOption.icon === 'function' ? (
            <selectedOption.icon className="w-3 h-3 text-slate-400 shrink-0" />
          ) : (
            <div className="shrink-0 flex items-center">{selectedOption.icon}</div>
          )
        )}
        {label && <span className="text-slate-500 font-normal">{label}:</span>}
        <span className="font-semibold text-slate-200 truncate max-w-[130px]">
          {selectedOption ? selectedOption.label : String(value)}
        </span>
        {selectedOption?.badge !== undefined && (
          <span className="px-1 py-0.2 rounded bg-indigo-500/20 text-indigo-300 text-[9px] font-bold">
            {selectedOption.badge}
          </span>
        )}
        <ChevronDown
          className={`w-3 h-3 text-slate-400 transition-transform duration-200 ${
            isOpen ? 'rotate-180 text-indigo-400' : ''
          }`}
        />
      </button>

      {isOpen && (
        <div className="absolute left-0 z-50 mt-1 min-w-[150px] bg-slate-900/98 backdrop-blur-xl border border-slate-800 rounded-xl shadow-2xl p-1 text-xs animate-in fade-in zoom-in-95 duration-100">
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
                    {OptIcon && (
                      typeof OptIcon === 'function' ? (
                        <OptIcon className="w-3 h-3 text-slate-400 shrink-0" />
                      ) : (
                        <div className="shrink-0 flex items-center">{OptIcon}</div>
                      )
                    )}
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
        </div>
      )}
    </div>
  );
}

export default FilterSelect;
