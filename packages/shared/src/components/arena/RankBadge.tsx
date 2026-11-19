import React from 'react';
import { ArenaIconShield } from './ArenaIcons';

export type EloTier = 'BRONZE' | 'SILVER' | 'GOLD' | 'PLATINUM' | 'DIAMOND' | 'MASTER' | 'CHALLENGER';

export interface RankBadgeProps {
  tier?: EloTier;
  elo?: number;
  showText?: boolean;
  className?: string;
}

export const RankBadge: React.FC<RankBadgeProps> = ({
  tier = 'GOLD',
  elo,
  showText = true,
  className = '',
}) => {
  const tierConfig: Record<EloTier, { label: string; color: string; border: string; bg: string }> = {
    BRONZE: { label: 'Đồng', color: 'text-[#CD7F32]', border: 'border-[#CD7F32]/40', bg: 'bg-[#CD7F32]/10' },
    SILVER: { label: 'Bạc', color: 'text-slate-300', border: 'border-slate-300/40', bg: 'bg-slate-300/10' },
    GOLD: { label: 'Vàng', color: 'text-[#F6C453]', border: 'border-[#F6C453]/40', bg: 'bg-[#F6C453]/15' },
    PLATINUM: { label: 'Bạch Kim', color: 'text-emerald-400', border: 'border-emerald-400/40', bg: 'bg-emerald-400/15' },
    DIAMOND: { label: 'Kim Cương', color: 'text-sky-400', border: 'border-sky-400/40', bg: 'bg-sky-400/15' },
    MASTER: { label: 'Cao Thủ', color: 'text-purple-400', border: 'border-purple-400/50', bg: 'bg-purple-400/20' },
    CHALLENGER: { label: 'Thách Đấu', color: 'text-[#8B75FF]', border: 'border-[#8B75FF]/60', bg: 'bg-[#8B75FF]/25' },
  };

  const current = tierConfig[tier] || tierConfig.GOLD;

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full border text-xs font-black uppercase tracking-wider select-none ${current.bg} ${current.border} ${current.color} ${className}`}
    >
      <ArenaIconShield className="w-3.5 h-3.5 shrink-0" />
      {showText && <span>{current.label}</span>}
      {typeof elo === 'number' && (
        <span className="tabular-nums font-mono opacity-80">({elo})</span>
      )}
    </span>
  );
};
