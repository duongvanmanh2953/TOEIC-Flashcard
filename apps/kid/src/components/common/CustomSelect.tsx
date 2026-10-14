import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, Check } from 'lucide-react';
import { soundManager } from '../../services/sound/KidsSoundManager';

export interface CustomSelectOption {
  value: string;
  label: string;
  icon?: React.ReactNode;
  badge?: string | number;
  description?: string;
}

interface CustomSelectProps {
  value: string;
  onChange: (value: string) => void;
  options: CustomSelectOption[];
  placeholder?: string;
  label?: string;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

export const CustomSelect: React.FC<CustomSelectProps> = ({
  value,
  onChange,
  options,
  placeholder = 'Chọn một mục...',
  label,
  className = '',
  size = 'md',
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const selectedOption = options.find((opt) => opt.value === value);

  // Close on outside click
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

  const handleToggle = () => {
    soundManager.playPop();
    setIsOpen((prev) => !prev);
  };

  const handleSelect = (val: string) => {
    soundManager.playClick();
    onChange(val);
    setIsOpen(false);
  };

  const sizeClasses = {
    sm: 'px-3 py-1.5 text-xs',
    md: 'px-4 py-2.5 text-sm',
    lg: 'px-5 py-3 text-base',
  }[size];

  return (
    <div ref={containerRef} className={`relative inline-block text-left select-none ${className}`}>
      {label && (
        <label className="block text-xs font-black text-slate-900 uppercase tracking-wider mb-1.5">
          {label}
        </label>
      )}

      {/* Trigger Button */}
      <button
        type="button"
        onClick={handleToggle}
        className={`w-full flex items-center justify-between gap-3 bg-white text-slate-950 font-black rounded-xl border-2 border-slate-900 shadow-[2px_3px_0px_#0f172a] hover:bg-slate-50 active:translate-y-0.5 active:shadow-[1px_1px_0px_#0f172a] transition-all cursor-pointer ${sizeClasses} ${
          isOpen ? 'ring-2 ring-amber-400 bg-amber-50/50' : ''
        }`}
      >
        <div className="flex items-center gap-2 truncate">
          {selectedOption?.icon && <span className="text-base shrink-0">{selectedOption.icon}</span>}
          <span className="truncate">{selectedOption ? selectedOption.label : placeholder}</span>
          {selectedOption?.badge !== undefined && (
            <span className="px-2 py-0.5 rounded-md bg-slate-900 text-white text-[11px] font-black">
              {selectedOption.badge}
            </span>
          )}
        </div>

        <ChevronDown
          className={`w-4 h-4 text-slate-900 shrink-0 stroke-[2.5] transition-transform duration-200 ${
            isOpen ? 'rotate-180' : ''
          }`}
        />
      </button>

      {/* Custom Dropdown Menu */}
      {isOpen && (
        <div className="absolute left-0 mt-2 w-full min-w-[220px] max-w-sm rounded-xl bg-white border-2 border-slate-900 shadow-[4px_6px_0px_#0f172a] z-50 overflow-hidden py-1 animate-fadeIn max-h-72 overflow-y-auto">
          {options.map((opt) => {
            const isSelected = opt.value === value;
            return (
              <button
                key={opt.value}
                type="button"
                onClick={() => handleSelect(opt.value)}
                className={`w-full px-3.5 py-2.5 flex items-center justify-between text-left transition-colors cursor-pointer border-b last:border-b-0 border-slate-100 ${
                  isSelected
                    ? 'bg-amber-100/90 text-slate-950 font-black'
                    : 'text-slate-800 hover:bg-slate-100 font-bold'
                }`}
              >
                <div className="flex items-center gap-2.5 truncate">
                  {opt.icon && <span className="text-base shrink-0">{opt.icon}</span>}
                  <div className="truncate">
                    <div className="text-xs sm:text-sm font-black truncate">{opt.label}</div>
                    {opt.description && (
                      <div className="text-[10px] text-slate-500 truncate">{opt.description}</div>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0 ml-2">
                  {opt.badge !== undefined && (
                    <span
                      className={`text-[10px] font-black px-1.5 py-0.5 rounded-md ${
                        isSelected
                          ? 'bg-slate-900 text-white'
                          : 'bg-slate-200 text-slate-800'
                      }`}
                    >
                      {opt.badge}
                    </span>
                  )}
                  {isSelected && <Check className="w-4 h-4 text-slate-950 stroke-[3]" />}
                </div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default CustomSelect;
