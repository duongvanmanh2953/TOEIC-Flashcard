import React from 'react';

export interface ToggleSwitchProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label?: string;
  description?: string;
  disabled?: boolean;
  size?: 'sm' | 'md';
  className?: string;
  id?: string;
}

export const ToggleSwitch: React.FC<ToggleSwitchProps> = ({
  checked,
  onChange,
  label,
  description,
  disabled = false,
  size = 'md',
  className = '',
  id,
}) => {
  const isSm = size === 'sm';

  const handleToggle = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (disabled) return;
    onChange(!checked);
  };

  return (
    <div
      onClick={handleToggle}
      className={`inline-flex items-center justify-between gap-3 select-none ${
        disabled ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'
      } ${className}`}
    >
      {(label || description) && (
        <div className="flex-1 pr-2">
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

      <button
        id={id}
        type="button"
        role="switch"
        aria-checked={checked}
        disabled={disabled}
        className={`relative inline-flex shrink-0 cursor-pointer rounded-full items-center p-0.5 transition-colors duration-200 ease-in-out outline-none select-none ${
          isSm ? 'w-9 h-5' : 'w-11 h-6'
        } ${
          checked
            ? 'bg-indigo-600 dark:bg-indigo-500 shadow-xs'
            : 'bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600'
        }`}
      >
        <span
          aria-hidden="true"
          className={`pointer-events-none rounded-full bg-white transition-transform duration-200 ease-in-out flex items-center justify-center shrink-0 shadow-sm ${
            isSm ? 'w-4 h-4' : 'w-5 h-5'
          } ${
            checked
              ? isSm
                ? 'translate-x-4'
                : 'translate-x-5'
              : 'translate-x-0'
          }`}
        />
      </button>
    </div>
  );
};
