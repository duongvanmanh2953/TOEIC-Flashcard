import React from 'react';
import { Sparkles } from 'lucide-react';

interface PremiumBadgeProps {
  variant?: 'pro' | 'plus' | 'premium';
  tier?: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  showIcon?: boolean;
}

export const PremiumBadge: React.FC<PremiumBadgeProps> = ({
  variant = 'pro',
  tier,
  size = 'md',
  className = '',
  showIcon = true,
}) => {
  const sizeClasses = {
    sm: 'text-[10px] px-1.5 py-0.5 gap-1',
    md: 'text-xs px-2.5 py-0.5 gap-1.5',
    lg: 'text-sm px-3.5 py-1 gap-2',
  };

  const activeVariant = tier ? (tier.toLowerCase().includes('plus') ? 'plus' : 'pro') : variant;
  const label = activeVariant === 'plus' ? 'PLUS' : activeVariant === 'pro' ? 'PRO' : 'PREMIUM';

  return (
    <span
      className={`inline-flex items-center rounded-full font-black uppercase tracking-wider bg-gradient-to-r from-amber-500/15 via-brand-500/20 to-indigo-500/15 text-amber-800 dark:text-amber-300 border border-amber-500/30 shadow-xs backdrop-blur-md select-none transition hover:border-amber-500/60 ${sizeClasses[size]} ${className}`}
      title="Tính năng cao cấp dành cho tài khoản Premium"
    >
      {showIcon && <Sparkles className="w-3 h-3 text-amber-500 animate-pulse shrink-0" />}
      <span>{label}</span>
    </span>
  );
};
