import React from 'react';

export type GlassVariant =
  | 'default'
  | 'interactive'
  | 'elevated'
  | 'subtle'
  | 'premium'
  | 'brand'
  | 'brandGlow'
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
    variantClasses = 'backdrop-blur-2xl bg-white/[0.08] dark:bg-slate-900/[0.25] border border-slate-200/50 dark:border-slate-800/60 shadow-lg';
  } else if (variant === 'subtle') {
    variantClasses = 'backdrop-blur-md bg-transparent border border-slate-200/40 dark:border-slate-800/40';
  } else if (variant === 'premium') {
    variantClasses = 'card-brand-effect backdrop-blur-2xl bg-gradient-to-br from-purple-500/[0.05] via-transparent to-amber-500/[0.03] dark:from-purple-500/[0.1] dark:via-transparent dark:to-amber-500/[0.05] border border-purple-400/50 dark:border-purple-400/40';
  } else if (variant === 'brand') {
    variantClasses = 'card-brand-effect backdrop-blur-2xl bg-gradient-to-br from-brand-500/[0.05] via-transparent to-indigo-500/[0.04] dark:from-brand-500/[0.1] dark:via-transparent dark:to-indigo-500/[0.06] border border-brand-400/50 dark:border-brand-400/40';
  } else if (variant === 'brandGlow') {
    variantClasses = 'card-brand-effect backdrop-blur-2xl bg-gradient-to-br from-brand-500/[0.08] via-transparent to-indigo-500/[0.06] dark:from-brand-500/[0.14] dark:via-transparent dark:to-indigo-500/[0.08] border-2 border-brand-500/60 dark:border-brand-400/55';
  } else if (variant === 'danger') {
    variantClasses = 'backdrop-blur-xl bg-rose-500/[0.06] dark:bg-rose-950/20 border border-rose-400/40 dark:border-rose-900/40 text-rose-900 dark:text-rose-200';
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
