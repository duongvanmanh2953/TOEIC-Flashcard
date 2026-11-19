import React from 'react';

interface ArenaTrophyArtworkProps {
  size?: number;
  className?: string;
}

export const ArenaTrophyArtwork: React.FC<ArenaTrophyArtworkProps> = ({
  size = 140,
  className = '',
}) => {
  return (
    <div
      className={`relative inline-flex items-center justify-center select-none ${className}`}
      style={{ width: size, height: size }}
      aria-label="Arena Victory Gold Trophy"
    >
      {/* Golden Aura Glow */}
      <div className="absolute inset-0 bg-amber-400/25 rounded-full blur-2xl animate-pulse" />

      <svg
        width={size}
        height={size}
        viewBox="0 0 200 200"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="relative z-10 drop-shadow-[0_10px_25px_rgba(245,158,11,0.45)]"
      >
        <defs>
          {/* Gold Metal Gradient */}
          <linearGradient id="trophyGoldGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#FFFBEB" />
            <stop offset="25%" stopColor="#FCD34D" />
            <stop offset="65%" stopColor="#F59E0B" />
            <stop offset="100%" stopColor="#B45309" />
          </linearGradient>

          {/* Cup Inner Shadow Gradient */}
          <linearGradient id="cupInnerGrad" x1="50%" y1="0%" x2="50%" y2="100%">
            <stop offset="0%" stopColor="#78350F" />
            <stop offset="100%" stopColor="#B45309" />
          </linearGradient>

          {/* Base Marble Pedestal Gradient */}
          <linearGradient id="pedestalGrad" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#0F172A" />
            <stop offset="50%" stopColor="#1E293B" />
            <stop offset="100%" stopColor="#0F172A" />
          </linearGradient>

          {/* Laurel Leaf Gradient */}
          <linearGradient id="laurelGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#FEF08A" />
            <stop offset="100%" stopColor="#D97706" />
          </linearGradient>
        </defs>

        {/* Laurel Wreath Leaves (Left) */}
        <g stroke="url(#laurelGrad)" strokeWidth="2.5" strokeLinecap="round" opacity="0.85">
          <path d="M 50,135 C 30,110 32,70 52,45" fill="none" />
          <ellipse cx="40" cy="115" rx="5" ry="9" transform="rotate(-30 40 115)" fill="url(#laurelGrad)" />
          <ellipse cx="34" cy="90" rx="5" ry="9" transform="rotate(-15 34 90)" fill="url(#laurelGrad)" />
          <ellipse cx="40" cy="65" rx="5" ry="9" transform="rotate(15 40 65)" fill="url(#laurelGrad)" />
          <ellipse cx="52" cy="45" rx="5" ry="8" transform="rotate(35 52 45)" fill="url(#laurelGrad)" />
        </g>

        {/* Laurel Wreath Leaves (Right) */}
        <g stroke="url(#laurelGrad)" strokeWidth="2.5" strokeLinecap="round" opacity="0.85">
          <path d="M 150,135 C 170,110 168,70 148,45" fill="none" />
          <ellipse cx="160" cy="115" rx="5" ry="9" transform="rotate(30 160 115)" fill="url(#laurelGrad)" />
          <ellipse cx="166" cy="90" rx="5" ry="9" transform="rotate(15 166 90)" fill="url(#laurelGrad)" />
          <ellipse cx="160" cy="65" rx="5" ry="9" transform="rotate(-15 160 65)" fill="url(#laurelGrad)" />
          <ellipse cx="148" cy="45" rx="5" ry="8" transform="rotate(-35 148 45)" fill="url(#laurelGrad)" />
        </g>

        {/* Trophy Handles (Ears) */}
        <path
          d="M 68,48 C 38,48 38,98 72,104"
          fill="none"
          stroke="url(#trophyGoldGrad)"
          strokeWidth="8"
          strokeLinecap="round"
        />
        <path
          d="M 132,48 C 162,48 162,98 128,104"
          fill="none"
          stroke="url(#trophyGoldGrad)"
          strokeWidth="8"
          strokeLinecap="round"
        />

        {/* Trophy Cup Body */}
        <path
          d="M 65,35 H 135 C 135,35 138,82 118,108 C 108,121 92,121 82,108 C 62,82 65,35 65,35 Z"
          fill="url(#trophyGoldGrad)"
        />

        {/* Cup Top Inner Rim */}
        <ellipse cx="100" cy="35" rx="35" ry="8" fill="url(#cupInnerGrad)" stroke="#FDE68A" strokeWidth="1.5" />

        {/* Cup Star Emblem Center */}
        <polygon
          points="100,56 103,66 113,66 105,72 108,82 100,76 92,82 95,72 87,66 97,66"
          fill="#FFFBEB"
          stroke="#B45309"
          strokeWidth="1"
          filter="drop-shadow(0 1px 3px rgba(0,0,0,0.4))"
        />

        {/* Trophy Stem Column */}
        <path d="M 94,118 H 106 V 140 H 94 Z" fill="url(#trophyGoldGrad)" />
        <ellipse cx="100" cy="120" rx="10" ry="3" fill="#FCD34D" />
        <ellipse cx="100" cy="140" rx="14" ry="4" fill="#F59E0B" />

        {/* Trophy Pedestal / Base */}
        <path d="M 80,144 H 120 L 126,168 H 74 Z" fill="url(#pedestalGrad)" stroke="#475569" strokeWidth="1" />
        {/* Gold Nameplate on Pedestal */}
        <rect x="82" y="152" width="36" height="10" rx="2" fill="url(#trophyGoldGrad)" stroke="#78350F" strokeWidth="0.5" />
        <line x1="86" y1="157" x2="114" y2="157" stroke="#78350F" strokeWidth="1.2" strokeLinecap="round" />

        {/* Base Plinth */}
        <rect x="68" y="168" width="64" height="8" rx="2" fill="#090D1A" stroke="#334155" strokeWidth="1" />

        {/* Sparkles */}
        <polygon points="68,26 70,32 76,34 70,36 68,42 66,36 60,34 66,32" fill="#FFFFFF" opacity="0.9" />
        <polygon points="138,40 140,44 144,46 140,48 138,52 136,48 132,46 136,44" fill="#FFFFFF" opacity="0.95" />
      </svg>
    </div>
  );
};
