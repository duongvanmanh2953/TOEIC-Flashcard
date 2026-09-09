import React, { useEffect, useRef } from 'react';
import { Check, Minus } from 'lucide-react';

export interface AdminCheckboxProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  indeterminate?: boolean;
  label?: string;
  description?: string;
  disabled?: boolean;
  error?: string;
  size?: 'sm' | 'md';
  className?: string;
  id?: string;
}

export const AdminCheckbox: React.FC<AdminCheckboxProps> = ({
  checked,
  onChange,
  indeterminate = false,
  label,
  description,
  disabled = false,
  error,
  size = 'md',
  className = '',
  id,
}) => {
  const isSm = size === 'sm';

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (disabled) return;
    onChange(!checked);
  };

  return (
    <div
      onClick={handleClick}
      className={`inline-flex items-start gap-2 select-none ${
        disabled ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'
      } ${className}`}
    >
      <div
        id={id}
        role="checkbox"
        aria-checked={indeterminate ? 'mixed' : checked}
        className={`shrink-0 flex items-center justify-center border transition-all duration-150 mt-0.5
          ${isSm ? 'w-4 h-4 rounded-md' : 'w-5 h-5 rounded-lg'}
          ${
            checked || indeterminate
              ? 'bg-indigo-600 border-indigo-600 text-white'
              : 'bg-white dark:bg-slate-900/80 border-slate-300 dark:border-slate-700 hover:border-slate-400 dark:hover:border-slate-600'
          }
          ${error ? 'border-rose-500' : ''}
        `}
      >
        {indeterminate ? (
          <Minus className={`${isSm ? 'w-3 h-3' : 'w-3.5 h-3.5'} stroke-[2.5]`} />
        ) : checked ? (
          <Check className={`${isSm ? 'w-3 h-3' : 'w-3.5 h-3.5'} stroke-[2.5]`} />
        ) : null}
      </div>

      {(label || description) && (
        <div className="flex flex-col">
          {label && (
            <span
              className={`font-medium text-slate-800 dark:text-slate-200 ${
                isSm ? 'text-xs' : 'text-sm'
              }`}
            >
              {label}
            </span>
          )}
          {description && (
            <span className="text-[11px] text-slate-500 dark:text-slate-400">{description}</span>
          )}
          {error && <span className="text-[11px] text-rose-500 mt-0.5">{error}</span>}
        </div>
      )}
    </div>
  );
};
