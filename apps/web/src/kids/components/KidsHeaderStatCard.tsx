import React from 'react';
import { LucideIcon } from 'lucide-react';

export interface HeaderStatCardProps {
  icon: LucideIcon;
  iconColor?: string;
  bgColor?: string;
  borderColor?: string;
  label: string;
  value?: string | number;
  onClick?: () => void;
  title?: string;
  active?: boolean;
}

export const KidsHeaderStatCard: React.FC<HeaderStatCardProps> = ({
  icon: Icon,
  iconColor = 'text-amber-600',
  bgColor = 'bg-amber-50',
  borderColor = 'border-amber-300',
  label,
  value,
  onClick,
  title,
  active = false,
}) => {
  const isClickable = Boolean(onClick);

  return (
    <div
      onClick={onClick}
      title={title}
      className={`h-11 min-h-[44px] px-3 py-1.5 rounded-2xl border-2 flex items-center gap-2 transition-all select-none ${bgColor} ${borderColor} ${
        isClickable
          ? 'cursor-pointer hover:scale-105 active:scale-95 shadow-xs'
          : 'cursor-default'
      } ${active ? 'ring-2 ring-amber-400' : ''}`}
    >
      <div className="w-6 h-6 flex items-center justify-center shrink-0">
        <Icon className={`w-4 h-4 ${iconColor}`} />
      </div>

      <div className="flex items-center gap-1 leading-none">
        {value !== undefined ? (
          <>
            <span className="font-black text-xs sm:text-sm text-slate-950">{value}</span>
            <span className="text-[10px] sm:text-xs font-bold text-slate-600 hidden sm:inline">
              {label}
            </span>
          </>
        ) : (
          <span className="font-black text-xs sm:text-sm text-slate-950">{label}</span>
        )}
      </div>
    </div>
  );
};

export default KidsHeaderStatCard;
