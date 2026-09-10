import React from 'react';

interface VectorProps {
  className?: string;
  size?: number;
}

// 1. Cute Lion Vector
export const VectorLion: React.FC<VectorProps> = ({ className = 'w-16 h-16', size = 64 }) => (
  <svg width={size} height={size} viewBox="0 0 100 100" fill="none" className={className}>
    {/* Mane */}
    <circle cx="50" cy="50" r="44" fill="#F59E0B" />
    <circle cx="50" cy="50" r="40" fill="#D97706" />
    {/* Ears */}
    <circle cx="26" cy="26" r="12" fill="#F59E0B" />
    <circle cx="26" cy="26" r="7" fill="#FEF3C7" />
    <circle cx="74" cy="26" r="12" fill="#F59E0B" />
    <circle cx="74" cy="26" r="7" fill="#FEF3C7" />
    {/* Face */}
    <circle cx="50" cy="53" r="32" fill="#FCD34D" />
    {/* Cheeks */}
    <circle cx="34" cy="60" r="6" fill="#FCA5A5" opacity="0.6" />
    <circle cx="66" cy="60" r="6" fill="#FCA5A5" opacity="0.6" />
    {/* Eyes */}
    <circle cx="40" cy="48" r="4.5" fill="#1E293B" />
    <circle cx="41.5" cy="46.5" r="1.5" fill="#FFFFFF" />
    <circle cx="60" cy="48" r="4.5" fill="#1E293B" />
    <circle cx="61.5" cy="46.5" r="1.5" fill="#FFFFFF" />
    {/* Nose & Mouth */}
    <polygon points="50,56 45,51 55,51" fill="#78350F" />
    <path d="M47 57 Q50 63 53 57" stroke="#78350F" strokeWidth="2.5" strokeLinecap="round" fill="none" />
  </svg>
);

// 2. Cute Elephant Vector
export const VectorElephant: React.FC<VectorProps> = ({ className = 'w-16 h-16', size = 64 }) => (
  <svg width={size} height={size} viewBox="0 0 100 100" fill="none" className={className}>
    {/* Big Ears */}
    <circle cx="24" cy="48" r="22" fill="#94A3B8" />
    <circle cx="24" cy="48" r="15" fill="#FBCFE8" opacity="0.8" />
    <circle cx="76" cy="48" r="22" fill="#94A3B8" />
    <circle cx="76" cy="48" r="15" fill="#FBCFE8" opacity="0.8" />
    {/* Head */}
    <circle cx="50" cy="50" r="30" fill="#CBD5E1" />
    {/* Eyes */}
    <circle cx="40" cy="44" r="4" fill="#0F172A" />
    <circle cx="41.5" cy="42.5" r="1.5" fill="#FFFFFF" />
    <circle cx="60" cy="44" r="4" fill="#0F172A" />
    <circle cx="61.5" cy="42.5" r="1.5" fill="#FFFFFF" />
    {/* Cheeks */}
    <circle cx="34" cy="52" r="5" fill="#F472B6" opacity="0.5" />
    <circle cx="66" cy="52" r="5" fill="#F472B6" opacity="0.5" />
    {/* Trunk */}
    <path d="M47 52 Q50 72 58 70 Q64 68 62 62" stroke="#94A3B8" strokeWidth="9" strokeLinecap="round" fill="none" />
  </svg>
);

// 3. Cute Apple Vector
export const VectorApple: React.FC<VectorProps> = ({ className = 'w-16 h-16', size = 64 }) => (
  <svg width={size} height={size} viewBox="0 0 100 100" fill="none" className={className}>
    {/* Stem & Leaf */}
    <path d="M50 28 Q52 14 62 12" stroke="#78350F" strokeWidth="4" strokeLinecap="round" fill="none" />
    <ellipse cx="64" cy="20" rx="10" ry="6" transform="rotate(-25 64 20)" fill="#10B981" />
    {/* Apple Body */}
    <path d="M50 30 C30 25 15 45 20 68 C24 85 45 92 50 88 C55 92 76 85 80 68 C85 45 70 25 50 30 Z" fill="#EF4444" />
    <path d="M50 32 C34 28 22 45 26 65 C29 79 46 86 50 82 Z" fill="#DC2626" opacity="0.4" />
    {/* Cute Highlight */}
    <ellipse cx="36" cy="46" rx="5" ry="9" transform="rotate(-30 36 46)" fill="#FFFFFF" opacity="0.45" />
  </svg>
);

// 4. Cute Banana Vector
export const VectorBanana: React.FC<VectorProps> = ({ className = 'w-16 h-16', size = 64 }) => (
  <svg width={size} height={size} viewBox="0 0 100 100" fill="none" className={className}>
    {/* Banana Curve */}
    <path d="M25 78 C40 86 70 82 82 50 C88 34 84 20 80 18 C78 18 76 25 70 38 C58 62 38 68 25 78 Z" fill="#FBBF24" />
    <path d="M25 78 C38 84 65 80 76 52 C81 38 78 24 76 22 C74 24 72 32 66 44 C55 64 36 70 25 78 Z" fill="#F59E0B" opacity="0.4" />
    {/* Tips */}
    <circle cx="80" cy="18" r="3" fill="#78350F" />
    <circle cx="24" cy="78" r="3" fill="#78350F" />
  </svg>
);

// 5. Cute Rocket Vector
export const VectorRocket: React.FC<VectorProps> = ({ className = 'w-16 h-16', size = 64 }) => (
  <svg width={size} height={size} viewBox="0 0 100 100" fill="none" className={className}>
    {/* Rocket Flame */}
    <polygon points="50,92 40,78 60,78" fill="#F97316" />
    <polygon points="50,86 44,78 56,78" fill="#FDE047" />
    {/* Fins */}
    <path d="M34 55 L20 72 L36 68 Z" fill="#DC2626" />
    <path d="M66 55 L80 72 L64 68 Z" fill="#DC2626" />
    {/* Rocket Body */}
    <path d="M50 14 C36 28 34 52 36 74 L64 74 C66 52 64 28 50 14 Z" fill="#F8FAFC" />
    {/* Nose Cone */}
    <path d="M50 14 C42 22 39 32 38 40 L62 40 C61 32 58 22 50 14 Z" fill="#EF4444" />
    {/* Porthole */}
    <circle cx="50" cy="52" r="10" fill="#38BDF8" />
    <circle cx="50" cy="52" r="7" fill="#0284C7" />
    <circle cx="48" cy="50" r="2.5" fill="#FFFFFF" />
  </svg>
);

// 6. Cute Cat Vector
export const VectorCat: React.FC<VectorProps> = ({ className = 'w-16 h-16', size = 64 }) => (
  <svg width={size} height={size} viewBox="0 0 100 100" fill="none" className={className}>
    {/* Ears */}
    <polygon points="26,18 42,36 20,38" fill="#FB923C" />
    <polygon points="28,24 38,36 24,38" fill="#FBCFE8" />
    <polygon points="74,18 80,38 58,36" fill="#FB923C" />
    <polygon points="72,24 76,38 62,36" fill="#FBCFE8" />
    {/* Head */}
    <circle cx="50" cy="52" r="32" fill="#FDBA74" />
    {/* Cheeks */}
    <circle cx="34" cy="58" r="5" fill="#F472B6" opacity="0.6" />
    <circle cx="66" cy="58" r="5" fill="#F472B6" opacity="0.6" />
    {/* Eyes */}
    <circle cx="38" cy="46" r="4.5" fill="#0F172A" />
    <circle cx="39.5" cy="44.5" r="1.5" fill="#FFFFFF" />
    <circle cx="62" cy="46" r="4.5" fill="#0F172A" />
    <circle cx="63.5" cy="44.5" r="1.5" fill="#FFFFFF" />
    {/* Nose & Whiskers */}
    <polygon points="50,55 46,52 54,52" fill="#F43F5E" />
    <line x1="26" y1="53" x2="14" y2="51" stroke="#94A3B8" strokeWidth="2" strokeLinecap="round" />
    <line x1="26" y1="57" x2="14" y2="60" stroke="#94A3B8" strokeWidth="2" strokeLinecap="round" />
    <line x1="74" y1="53" x2="86" y2="51" stroke="#94A3B8" strokeWidth="2" strokeLinecap="round" />
    <line x1="74" y1="57" x2="86" y2="60" stroke="#94A3B8" strokeWidth="2" strokeLinecap="round" />
  </svg>
);

// 7. Cute Golden Star Trophy
export const VectorTrophy: React.FC<VectorProps> = ({ className = 'w-16 h-16', size = 64 }) => (
  <svg width={size} height={size} viewBox="0 0 100 100" fill="none" className={className}>
    {/* Handles */}
    <path d="M28 28 C15 28 15 50 30 52" stroke="#D97706" strokeWidth="6" strokeLinecap="round" fill="none" />
    <path d="M72 28 C85 28 85 50 70 52" stroke="#D97706" strokeWidth="6" strokeLinecap="round" fill="none" />
    {/* Cup */}
    <path d="M30 22 L70 22 L65 56 C62 66 38 66 35 56 Z" fill="#FBBF24" />
    <path d="M30 22 L50 22 L48 56 C46 62 38 62 35 56 Z" fill="#F59E0B" opacity="0.4" />
    {/* Base */}
    <path d="M45 62 L55 62 L57 74 L43 74 Z" fill="#D97706" />
    <rect x="34" y="74" width="32" height="14" rx="4" fill="#78350F" />
    {/* Star on Cup */}
    <polygon points="50,32 53,40 61,40 55,45 57,53 50,48 43,53 45,45 39,40 47,40" fill="#FFFFFF" />
  </svg>
);

// 8. Cute Treasure Chest
export const VectorTreasureChest: React.FC<VectorProps & { open?: boolean }> = ({
  className = 'w-16 h-16',
  size = 64,
  open = false,
}) => (
  <svg width={size} height={size} viewBox="0 0 100 100" fill="none" className={className}>
    {/* Base Box */}
    <rect x="20" y="46" width="60" height="38" rx="5" fill="#92400E" />
    <rect x="25" y="46" width="50" height="38" fill="#B45309" />
    {/* Gold Bands */}
    <rect x="20" y="52" width="60" height="6" fill="#F59E0B" />
    <rect x="20" y="72" width="60" height="6" fill="#F59E0B" />
    {/* Lock */}
    <circle cx="50" cy="56" r="6" fill="#FEF08A" stroke="#B45309" strokeWidth="2" />
    {open ? (
      <>
        {/* Open Lid */}
        <path d="M18 42 C18 20 82 20 82 42 Z" fill="#B45309" transform="rotate(-35 20 42)" />
        {/* Golden Sparkles inside */}
        <circle cx="45" cy="38" r="4" fill="#FDE047" />
        <circle cx="56" cy="35" r="3" fill="#FDE047" />
        <circle cx="50" cy="30" r="5" fill="#FFFFFF" />
      </>
    ) : (
      /* Closed Lid */
      <path d="M20 46 C20 28 80 28 80 46 Z" fill="#92400E" />
    )}
  </svg>
);
