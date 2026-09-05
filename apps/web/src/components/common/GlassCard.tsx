import React from 'react';

export type GlassVariant =
  | 'default'
  | 'interactive'
  | 'elevated'
  | 'subtle'
  | 'premium'
  | 'danger'
  | 'liquid';

export interface GlassCardProps {
  children: React.ReactNode;
  className?: string;
  onClick?: (e?: any) => void;
  hoverEffect?: boolean;
  variant?: GlassVariant;
}

export const GlassCard: React.FC<GlassCardProps> = ({
  children,
  className = '',
  onClick,
  hoverEffect = false,
  variant = 'default',
}) => {
  let variantClasses = 'glass-panel';

  if (variant === 'interactive' || hoverEffect) {
    variantClasses = 'glass-panel-interactive cursor-pointer';
  } else if (variant === 'elevated') {
    variantClasses = 'backdrop-blur-2xl bg-white/95 dark:bg-slate-900/95 border border-slate-200/90 dark:border-slate-800/90 shadow-xl';
  } else if (variant === 'subtle') {
    variantClasses = 'backdrop-blur-md bg-slate-50/60 dark:bg-slate-900/50 border border-slate-200/60 dark:border-slate-800/50';
  } else if (variant === 'premium') {
    variantClasses = 'backdrop-blur-xl bg-gradient-to-b from-white/90 to-indigo-50/40 dark:from-slate-900/90 dark:to-indigo-950/25 border border-indigo-200/60 dark:border-indigo-800/40 shadow-lg';
  } else if (variant === 'danger') {
    variantClasses = 'backdrop-blur-xl bg-rose-50/60 dark:bg-rose-950/30 border border-rose-200/70 dark:border-rose-900/50 text-rose-900 dark:text-rose-200';
  } else if (variant === 'liquid') {
    variantClasses = 'liquid-glass-card';
  }

  return (
    <div
      onClick={onClick}
      className={`relative rounded-3xl p-5 md:p-6 transition-all duration-300 ${variantClasses} ${className}`}
    >
      {children}
    </div>
  );
};

export const GlassCardInteractive: React.FC<GlassCardProps> = (props) => (
  <GlassCard {...props} variant="interactive" />
);

export const GlassCardElevated: React.FC<GlassCardProps> = (props) => (
  <GlassCard {...props} variant="elevated" />
);

export const GlassCardSubtle: React.FC<GlassCardProps> = (props) => (
  <GlassCard {...props} variant="subtle" />
);

export const GlassCardPremium: React.FC<GlassCardProps> = (props) => (
  <GlassCard {...props} variant="premium" />
);

export const GlassCardDanger: React.FC<GlassCardProps> = (props) => (
  <GlassCard {...props} variant="danger" />
);
