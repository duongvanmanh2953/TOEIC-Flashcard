import React, { forwardRef } from 'react';
import { X, Search } from 'lucide-react';

export interface AdminInputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'size'> {
  label?: string;
  helperText?: string;
  error?: string;
  prefixIcon?: React.ReactNode;
  suffixIcon?: React.ReactNode;
  suffixAction?: React.ReactNode;
  suffixUnit?: string;
  clearable?: boolean;
  onClear?: () => void;
  size?: 'sm' | 'md' | 'lg';
}

export const AdminInput = forwardRef<HTMLInputElement, AdminInputProps>(
  (
    {
      label,
      helperText,
      error,
      prefixIcon,
      suffixIcon,
      suffixAction,
      suffixUnit,
      clearable = false,
      onClear,
      size = 'md',
      className = '',
      id,
      value,
      type = 'text',
      disabled,
      ...props
    },
    ref
  ) => {
    const sizeClasses = {
      sm: 'min-h-[38px] text-xs px-3 rounded-xl',
      md: 'min-h-[44px] text-sm px-3.5 rounded-xl',
      lg: 'min-h-[50px] text-base px-4 rounded-xl',
    };

    const hasValue = value !== undefined && value !== null && value !== '';

    return (
      <div className={`flex flex-col gap-1.5 ${className}`}>
        {label && (
          <label
            htmlFor={id}
            className="text-xs font-semibold text-slate-700 dark:text-slate-300 select-none tracking-wide"
          >
            {label}
          </label>
        )}

        <div
          className={`relative flex items-center bg-white dark:bg-slate-900/80 backdrop-blur-md border transition-all duration-200
            ${error ? 'border-rose-500/80 ring-1 ring-rose-500/20' : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 focus-within:border-indigo-500/80 focus-within:ring-1 focus-within:ring-indigo-500/30'}
            ${disabled ? 'opacity-50 cursor-not-allowed bg-slate-100 dark:bg-slate-950' : ''}
            ${sizeClasses[size]}
          `}
        >
          {prefixIcon && <span className="mr-2 text-slate-400 dark:text-slate-500 shrink-0">{prefixIcon}</span>}

          <input
            ref={ref}
            id={id}
            type={type}
            value={value}
            disabled={disabled}
            className={`w-full bg-transparent border-none outline-none py-2 text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500
              ${type === 'number' ? 'tabular-nums' : ''}
              ${disabled ? 'cursor-not-allowed' : ''}
            `}
            {...props}
          />

          {clearable && hasValue && !disabled && (
            <button
              type="button"
              onClick={onClear}
              className="p-1 text-slate-400 hover:text-slate-600 dark:text-slate-500 dark:hover:text-slate-300 rounded hover:bg-slate-100 dark:hover:bg-slate-800/80 transition ml-1"
              title="Xóa nội dung"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}

          {suffixIcon && <span className="ml-2 text-slate-400 dark:text-slate-500 shrink-0">{suffixIcon}</span>}
          {suffixUnit && (
            <span className="ml-2 px-1.5 py-0.5 rounded text-[11px] bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700 select-none shrink-0 font-medium">
              {suffixUnit}
            </span>
          )}
          {suffixAction && <span className="ml-2 shrink-0">{suffixAction}</span>}
        </div>

        {error ? (
          <span className="text-[11px] text-rose-500 dark:text-rose-400 font-medium">{error}</span>
        ) : helperText ? (
          <span className="text-[11px] text-slate-500">{helperText}</span>
        ) : null}
      </div>
    );
  }
);

AdminInput.displayName = 'AdminInput';
