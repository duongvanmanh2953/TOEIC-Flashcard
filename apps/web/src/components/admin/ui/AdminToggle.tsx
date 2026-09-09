import React from 'react';
import { Loader2 } from 'lucide-react';

export interface AdminToggleProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label?: string;
  description?: string;
  disabled?: boolean;
  loading?: boolean;
  size?: 'sm' | 'md';
  labelPosition?: 'left' | 'right';
  className?: string;
  id?: string;
}

export const AdminToggle: React.FC<AdminToggleProps> = ({
  checked,
  onChange,
  label,
  description,
  disabled = false,
  loading = false,
  size = 'md',
  labelPosition = 'right',
  className = '',
  id,
}) => {
  const isSm = size === 'sm';

  const handleToggle = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (disabled || loading) return;
    onChange(!checked);
  };

  const toggleControl = (
    <button
      id={id}
      type="button"
      role="switch"
      aria-checked={checked}
      disabled={disabled || loading}
      onClick={handleToggle}
      className={`relative inline-flex shrink-0 cursor-pointer rounded-full items-center p-0.5 transition-colors duration-200 ease-in-out outline-none select-none ${
        isSm ? 'w-9 h-5' : 'w-12 h-6'
      } ${
        checked
          ? 'bg-indigo-600 dark:bg-indigo-500'
          : 'bg-slate-300 dark:bg-slate-700 hover:bg-slate-400 dark:hover:bg-slate-600'
      } ${disabled ? 'opacity-40 cursor-not-allowed' : ''}`}
    >
      <span
        aria-hidden="true"
        className={`pointer-events-none rounded-full bg-white transition-transform duration-200 ease-in-out flex items-center justify-center shrink-0 border border-slate-200/60 dark:border-slate-700/60 ${
          isSm ? 'w-4 h-4' : 'w-5 h-5'
        } ${
          checked
            ? isSm
              ? 'translate-x-4'
              : 'translate-x-6'
            : 'translate-x-0'
        }`}
      >
        {loading && (
          <Loader2
            className={`animate-spin text-indigo-600 ${isSm ? 'w-2.5 h-2.5' : 'w-3 h-3'}`}
          />
        )}
      </span>
    </button>
  );

  if (!label && !description) {
    return toggleControl;
  }

  return (
    <div
      onClick={handleToggle}
      className={`inline-flex items-center gap-3 select-none ${
        disabled ? 'cursor-not-allowed' : 'cursor-pointer'
      } ${className}`}
    >
      {labelPosition === 'left' && (
        <div className="text-right flex-1">
          {label && (
            <div className={`font-semibold text-slate-800 dark:text-slate-200 ${isSm ? 'text-xs' : 'text-sm'}`}>
              {label}
            </div>
          )}
          {description && (
            <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 leading-normal">{description}</div>
          )}
        </div>
      )}

      {toggleControl}

      {labelPosition === 'right' && (
        <div className="flex-1">
          {label && (
            <div className={`font-semibold text-slate-800 dark:text-slate-200 ${isSm ? 'text-xs' : 'text-sm'}`}>
              {label}
            </div>
          )}
          {description && (
            <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 leading-normal">{description}</div>
          )}
        </div>
      )}
    </div>
  );
};
