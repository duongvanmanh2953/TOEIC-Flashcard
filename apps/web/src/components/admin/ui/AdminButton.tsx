import React from 'react';
import { Loader2 } from 'lucide-react';

export interface AdminButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'destructive' | 'icon';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  icon?: React.ReactNode;
  iconPosition?: 'left' | 'right';
  children?: React.ReactNode;
}

export const AdminButton: React.FC<AdminButtonProps> = ({
  variant = 'secondary',
  size = 'md',
  loading = false,
  disabled = false,
  icon,
  iconPosition = 'left',
  children,
  className = '',
  ...props
}) => {
  // Height & padding variants
  const sizeClasses = {
    sm: variant === 'icon' ? 'w-9 h-9 p-0 rounded-xl text-xs' : 'h-9 px-3 rounded-xl text-xs font-semibold gap-1.5',
    md: variant === 'icon' ? 'w-10 h-10 p-0 rounded-xl text-sm' : 'h-10 px-4 rounded-xl text-sm font-semibold gap-2',
    lg: variant === 'icon' ? 'w-12 h-12 p-0 rounded-xl text-base' : 'h-12 px-5 rounded-xl text-base font-semibold gap-2.5',
  };

  // Glass, subtle non-solid color hierarchy adapted to Light and Dark mode
  const variantClasses = {
    primary:
      'bg-indigo-600 dark:bg-indigo-500/20 hover:bg-indigo-700 dark:hover:bg-indigo-500/30 text-white dark:text-indigo-300 border border-indigo-600 dark:border-indigo-500/30 backdrop-blur-md',
    secondary:
      'bg-white dark:bg-slate-800/60 hover:bg-slate-50 dark:hover:bg-slate-700/60 active:bg-slate-100 dark:active:bg-slate-700/80 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-700/60 backdrop-blur-md',
    ghost:
      'bg-transparent hover:bg-slate-100 dark:hover:bg-slate-800/50 active:bg-slate-200/60 dark:active:bg-slate-800/80 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 border border-transparent',
    destructive:
      'bg-rose-600 dark:bg-rose-500/20 hover:bg-rose-700 dark:hover:bg-rose-500/30 text-white dark:text-rose-300 border border-rose-600 dark:border-rose-500/30 backdrop-blur-md',
    icon:
      'bg-white dark:bg-slate-800/50 hover:bg-slate-50 dark:hover:bg-slate-700/60 active:bg-slate-100 dark:active:bg-slate-700/80 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white border border-slate-200 dark:border-slate-700/60 backdrop-blur-md flex items-center justify-center',
  };

  return (
    <button
      disabled={disabled || loading}
      className={`inline-flex items-center justify-center transition-all duration-150 outline-none select-none tracking-wide shrink-0
        ${sizeClasses[size]}
        ${variantClasses[variant]}
        ${disabled || loading ? 'opacity-50 cursor-not-allowed pointer-events-none' : 'cursor-pointer active:scale-[0.98]'}
        ${className}
      `}
      {...props}
    >
      {loading ? (
        <>
          <Loader2 className="w-3.5 h-3.5 animate-spin shrink-0" />
          {variant !== 'icon' && children && <span>{children}</span>}
        </>
      ) : (
        <>
          {icon && iconPosition === 'left' && <span className="shrink-0">{icon}</span>}
          {children && <span>{children}</span>}
          {icon && iconPosition === 'right' && <span className="shrink-0">{icon}</span>}
        </>
      )}
    </button>
  );
};
