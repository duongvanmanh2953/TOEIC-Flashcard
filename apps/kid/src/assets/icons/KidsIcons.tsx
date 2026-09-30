import React from 'react';

export interface IconProps {
  className?: string;
  size?: number;
  filled?: boolean;
}

/**
 * Modern Colorful Kids Icon Badges (Duolingo ABC / Lingokids Style)
 * Pure inline SVGs with rich gradients, rounded friendly geometry,
 * high contrast, and zero wireframe plainness.
 */

// 1. HOME ICON (Sweet Candy Cottage)
export const KidsHomeIcon: React.FC<IconProps> = ({ className = '', size = 28 }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 48 48"
    fill="none"
    className={`shrink-0 transition-transform ${className}`}
  >
    <defs>
      <linearGradient id="roofGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#FB7185" />
        <stop offset="100%" stopColor="#E11D48" />
      </linearGradient>
      <linearGradient id="wallGrad" x1="0%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%" stopColor="#FEF08A" />
        <stop offset="100%" stopColor="#FBBF24" />
      </linearGradient>
    </defs>
    {/* Chimney */}
    <rect x="30" y="8" width="6" height="12" rx="3" fill="#FB923C" stroke="#C2410C" strokeWidth="2.5" />
    {/* House Body */}
    <rect x="10" y="20" width="28" height="22" rx="6" fill="url(#wallGrad)" stroke="#B45309" strokeWidth="2.5" />
    {/* Door */}
    <rect x="19" y="28" width="10" height="14" rx="4" fill="#0284C7" stroke="#0369A1" strokeWidth="2" />
    <circle cx="21.5" cy="35" r="1.5" fill="#FEF08A" />
    {/* Candy Roof */}
    <path
      d="M6 21L21.5 6.5C22.9 5.2 25.1 5.2 26.5 6.5L42 21"
      stroke="url(#roofGrad)"
      strokeWidth="5.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    {/* Roof Trim */}
    <path d="M12 21L24 10L36 21" stroke="#FFF" strokeWidth="2" strokeLinecap="round" opacity="0.8" />
  </svg>
);

// 2. MAP ICON (Adventure Treasure Map)
export const KidsMapIcon: React.FC<IconProps> = ({ className = '', size = 28 }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 48 48"
    fill="none"
    className={`shrink-0 transition-transform ${className}`}
  >
    <defs>
      <linearGradient id="mapBgGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#FED7AA" />
        <stop offset="100%" stopColor="#FDBA74" />
      </linearGradient>
    </defs>
    {/* Folded Map Panels */}
    <path
      d="M8 10L18 6L30 11L40 7V37L30 41L18 36L8 40V10Z"
      fill="url(#mapBgGrad)"
      stroke="#C2410C"
      strokeWidth="2.5"
      strokeLinejoin="round"
    />
    <path d="M18 6V36" stroke="#EA580C" strokeWidth="2" strokeDasharray="3 3" />
    <path d="M30 11V41" stroke="#EA580C" strokeWidth="2" strokeDasharray="3 3" />
    {/* Trail Path */}
    <path
      d="M13 26C15 22 21 28 25 20C28 14 34 26 36 24"
      stroke="#DC2626"
      strokeWidth="3"
      strokeLinecap="round"
      strokeDasharray="4 3"
    />
    {/* X Marks the Spot */}
    <path d="M33 21L39 27M39 21L33 27" stroke="#DC2626" strokeWidth="3" strokeLinecap="round" />
    {/* Compass Badge */}
    <circle cx="15" cy="16" r="4.5" fill="#38BDF8" stroke="#0284C7" strokeWidth="1.5" />
    <polygon points="15,13 16.5,16 15,19 13.5,16" fill="#FFF" />
  </svg>
);

// 3. LISTEN ICON (Vibrant 3D Headphones)
export const KidsListenIcon: React.FC<IconProps> = ({ className = '', size = 28 }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 48 48"
    fill="none"
    className={`shrink-0 transition-transform ${className}`}
  >
    <defs>
      <linearGradient id="headbandGrad" x1="0%" y1="0%" x2="100%" y2="0%">
        <stop offset="0%" stopColor="#38BDF8" />
        <stop offset="50%" stopColor="#818CF8" />
        <stop offset="100%" stopColor="#C084FC" />
      </linearGradient>
      <linearGradient id="earpadGrad" x1="0%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%" stopColor="#34D399" />
        <stop offset="100%" stopColor="#059669" />
      </linearGradient>
    </defs>
    {/* Headband Arc */}
    <path
      d="M10 24C10 14 16 7 24 7C32 7 38 14 38 24"
      stroke="url(#headbandGrad)"
      strokeWidth="5"
      strokeLinecap="round"
    />
    <path
      d="M14 22C14 16 18 10 24 10C30 10 34 16 34 22"
      stroke="#FFF"
      strokeWidth="1.5"
      strokeLinecap="round"
      opacity="0.6"
    />
    {/* Left Earpad */}
    <rect x="7" y="22" width="7" height="15" rx="3.5" fill="url(#earpadGrad)" stroke="#065F46" strokeWidth="2" />
    <rect x="9" y="25" width="3" height="9" rx="1.5" fill="#A7F3D0" opacity="0.8" />
    {/* Right Earpad */}
    <rect x="34" y="22" width="7" height="15" rx="3.5" fill="url(#earpadGrad)" stroke="#065F46" strokeWidth="2" />
    <rect x="36" y="25" width="3" height="9" rx="1.5" fill="#A7F3D0" opacity="0.8" />
    {/* Sound Waves */}
    <path d="M2 24C2 21 4 19 6 18" stroke="#38BDF8" strokeWidth="2.5" strokeLinecap="round" />
    <path d="M46 24C46 21 44 19 42 18" stroke="#C084FC" strokeWidth="2.5" strokeLinecap="round" />
  </svg>
);

// 4. SPEAK ICON (Neon 3D Microphone with Sparkles)
export const KidsSpeakIcon: React.FC<IconProps> = ({ className = '', size = 28 }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 48 48"
    fill="none"
    className={`shrink-0 transition-transform ${className}`}
  >
    <defs>
      <linearGradient id="micBodyGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#F43F5E" />
        <stop offset="100%" stopColor="#EC4899" />
      </linearGradient>
      <linearGradient id="micHeadGrad" x1="0%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%" stopColor="#FDE047" />
        <stop offset="100%" stopColor="#F59E0B" />
      </linearGradient>
    </defs>
    {/* Microphone Capsule */}
    <rect x="17" y="7" width="14" height="22" rx="7" fill="url(#micBodyGrad)" stroke="#9F1239" strokeWidth="2.5" />
    {/* Metallic Grille */}
    <path d="M19 14H29M18 18H30M20 22H28" stroke="#FFF" strokeWidth="1.5" strokeLinecap="round" opacity="0.7" />
    {/* U-Shape Pickup Cradle */}
    <path
      d="M12 21C12 28.5 17 33 24 33C31 33 36 28.5 36 21"
      stroke="#475569"
      strokeWidth="3.5"
      strokeLinecap="round"
    />
    {/* Stand Pole & Base */}
    <line x1="24" y1="33" x2="24" y2="41" stroke="#334155" strokeWidth="4" strokeLinecap="round" />
    <rect x="15" y="39" width="18" height="5" rx="2.5" fill="#64748B" stroke="#1E293B" strokeWidth="2" />
    {/* Sparkle Rays */}
    <circle cx="9" cy="11" r="2" fill="#FDE047" />
    <path d="M37 10L39 12M39 10L37 12" stroke="#FDE047" strokeWidth="2.5" strokeLinecap="round" />
  </svg>
);

// 5. STAR ICON (3D Glossy Golden Star)
export const KidsStarIcon: React.FC<IconProps> = ({ className = '', size = 28, filled = true }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 48 48"
    fill="none"
    className={`shrink-0 transition-transform ${className}`}
  >
    <defs>
      <linearGradient id="starGradGold" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#FEF08A" />
        <stop offset="50%" stopColor="#FBBF24" />
        <stop offset="100%" stopColor="#F59E0B" />
      </linearGradient>
    </defs>
    <path
      d="M24 4L29.8 16.5L43.5 18.2L33.3 27.8L36 41.5L24 34.8L12 41.5L14.7 27.8L4.5 18.2L18.2 16.5L24 4Z"
      fill={filled ? 'url(#starGradGold)' : '#F1F5F9'}
      stroke="#D97706"
      strokeWidth="2.5"
      strokeLinejoin="round"
    />
    {filled && (
      <>
        {/* Specular Highlight */}
        <path
          d="M24 8L27.5 17L37 18.2L30 24.5L24 16Z"
          fill="#FFF"
          opacity="0.5"
        />
        <circle cx="21" cy="18" r="2" fill="#FFF" opacity="0.8" />
      </>
    )}
  </svg>
);

// 6. TROPHY ICON (Gold Champion Trophy with Red Ribbon)
export const KidsTrophyIcon: React.FC<IconProps> = ({ className = '', size = 28 }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 48 48"
    fill="none"
    className={`shrink-0 transition-transform ${className}`}
  >
    <defs>
      <linearGradient id="trophyCupGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#FEF08A" />
        <stop offset="60%" stopColor="#F59E0B" />
        <stop offset="100%" stopColor="#D97706" />
      </linearGradient>
    </defs>
    {/* Left & Right Handles */}
    <path d="M14 13H8C6 13 5 19 8 23C11 26 14 26 14 26" stroke="#D97706" strokeWidth="3" strokeLinecap="round" />
    <path d="M34 13H40C42 13 43 19 40 23C37 26 34 26 34 26" stroke="#D97706" strokeWidth="3" strokeLinecap="round" />
    {/* Main Cup */}
    <path
      d="M13 8H35V20C35 27 29 31 24 31C19 31 13 27 13 20V8Z"
      fill="url(#trophyCupGrad)"
      stroke="#B45309"
      strokeWidth="2.5"
    />
    {/* Star Emblem on Cup */}
    <polygon points="24,14 25.5,18 29,18 26,20 27,24 24,21.5 21,24 22,20 19,18 22.5,18" fill="#FFF" />
    {/* Stem & Pedestal Base */}
    <path d="M21 31H27V36H21V31Z" fill="#F59E0B" stroke="#B45309" strokeWidth="2" />
    <rect x="15" y="36" width="18" height="7" rx="3.5" fill="#991B1B" stroke="#7F1D1D" strokeWidth="2" />
    <rect x="18" y="38" width="12" height="3" rx="1.5" fill="#FCA5A5" opacity="0.6" />
  </svg>
);

// 7. GAME ICON (Candy Purple Gamepad)
export const KidsGameIcon: React.FC<IconProps> = ({ className = '', size = 28 }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 48 48"
    fill="none"
    className={`shrink-0 transition-transform ${className}`}
  >
    <defs>
      <linearGradient id="padGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#A855F7" />
        <stop offset="100%" stopColor="#7C3AED" />
      </linearGradient>
    </defs>
    {/* Controller Body */}
    <rect x="6" y="14" width="36" height="24" rx="12" fill="url(#padGrad)" stroke="#5B21B6" strokeWidth="2.5" />
    {/* Grips Contour */}
    <circle cx="14" cy="26" r="8" fill="#9333EA" />
    <circle cx="34" cy="26" r="8" fill="#9333EA" />
    {/* D-Pad */}
    <path d="M14 20V28M10 24H18" stroke="#FFF" strokeWidth="3" strokeLinecap="round" />
    {/* Action Buttons */}
    <circle cx="31" cy="26" r="2" fill="#FBBF24" />
    <circle cx="37" cy="26" r="2" fill="#34D399" />
    <circle cx="34" cy="23" r="2" fill="#F43F5E" />
    <circle cx="34" cy="29" r="2" fill="#38BDF8" />
  </svg>
);

// 8. LOCK ICON (Friendly Gold Padlock)
export const KidsLockIcon: React.FC<IconProps> = ({ className = '', size = 28 }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 48 48"
    fill="none"
    className={`shrink-0 transition-transform ${className}`}
  >
    <defs>
      <linearGradient id="lockBody" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#FCD34D" />
        <stop offset="100%" stopColor="#F59E0B" />
      </linearGradient>
    </defs>
    {/* Shackle */}
    <path
      d="M16 22V15C16 10.5 19.5 7 24 7C28.5 7 32 10.5 32 15V22"
      stroke="#94A3B8"
      strokeWidth="4.5"
      strokeLinecap="round"
    />
    {/* Padlock Body */}
    <rect x="11" y="20" width="26" height="22" rx="7" fill="url(#lockBody)" stroke="#D97706" strokeWidth="2.5" />
    {/* Keyhole */}
    <circle cx="24" cy="29" r="3" fill="#78350F" />
    <polygon points="23,29 25,29 26,36 22,36" fill="#78350F" />
  </svg>
);

// 9. SOUND ON ICON (Sunny Yellow Loudspeaker)
export const KidsSoundIcon: React.FC<IconProps & { muted?: boolean }> = ({
  className = '',
  size = 28,
  muted = false,
}) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 48 48"
    fill="none"
    className={`shrink-0 transition-transform ${className}`}
  >
    <defs>
      <linearGradient id="speakerGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#38BDF8" />
        <stop offset="100%" stopColor="#0284C7" />
      </linearGradient>
    </defs>
    {/* Megaphone Cone */}
    <path
      d="M10 20H15L25 12V36L15 28H10C8.5 28 7 26.5 7 25V23C7 21.5 8.5 20 10 20Z"
      fill="url(#speakerGrad)"
      stroke="#0369A1"
      strokeWidth="2.5"
      strokeLinejoin="round"
    />
    {!muted ? (
      <>
        {/* Sound Waves */}
        <path d="M30 18C33 21 33 27 30 30" stroke="#F59E0B" strokeWidth="3.5" strokeLinecap="round" />
        <path d="M36 13C41 18 41 30 36 35" stroke="#EC4899" strokeWidth="3.5" strokeLinecap="round" />
      </>
    ) : (
      /* Muted Cross */
      <path d="M30 19L40 29M40 19L30 29" stroke="#E11D48" strokeWidth="3.5" strokeLinecap="round" />
    )}
  </svg>
);

// 10. SPARKLE / MAGIC ICON
export const KidsSparkleIcon: React.FC<IconProps> = ({ className = '', size = 28 }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 48 48"
    fill="none"
    className={`shrink-0 transition-transform ${className}`}
  >
    {/* Big Central Sparkle */}
    <path
      d="M24 4C24 14 27 18 36 20C27 22 24 26 24 36C24 26 21 22 12 20C21 18 24 14 24 4Z"
      fill="#FBBF24"
      stroke="#F59E0B"
      strokeWidth="2"
    />
    <circle cx="24" cy="20" r="2.5" fill="#FFF" />
    {/* Small Corner Sparkles */}
    <circle cx="12" cy="10" r="3" fill="#38BDF8" />
    <circle cx="36" cy="34" r="3.5" fill="#EC4899" />
  </svg>
);

// 11. PLAY BUTTON ICON (Mint Green 3D Triangle)
export const KidsPlayIcon: React.FC<IconProps> = ({ className = '', size = 28 }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 48 48"
    fill="none"
    className={`shrink-0 transition-transform ${className}`}
  >
    <defs>
      <linearGradient id="playGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#34D399" />
        <stop offset="100%" stopColor="#059669" />
      </linearGradient>
    </defs>
    <circle cx="24" cy="24" r="20" fill="url(#playGrad)" stroke="#047857" strokeWidth="2.5" />
    <polygon points="19,15 34,24 19,33" fill="#FFF" />
  </svg>
);

// 12. CHECKMARK ICON (Juicy Emerald Circle)
export const KidsCheckIcon: React.FC<IconProps> = ({ className = '', size = 28 }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 48 48"
    fill="none"
    className={`shrink-0 transition-transform ${className}`}
  >
    <circle cx="24" cy="24" r="20" fill="#10B981" stroke="#047857" strokeWidth="2.5" />
    <path d="M14 24L21 31L34 17" stroke="#FFF" strokeWidth="4.5" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

// 13. ROCKET ICON (Space Adventure)
export const KidsRocketIcon: React.FC<IconProps> = ({ className = '', size = 28 }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 48 48"
    fill="none"
    className={`shrink-0 transition-transform ${className}`}
  >
    {/* Rocket Body */}
    <path
      d="M34 14C34 14 32 6 24 6C16 6 14 14 14 14C14 22 17 31 24 36C31 31 34 22 34 14Z"
      fill="#EF4444"
      stroke="#B91C1C"
      strokeWidth="2"
    />
    <circle cx="24" cy="19" r="4" fill="#67E8F9" stroke="#0E7490" strokeWidth="1.5" />
    {/* Fins */}
    <path d="M14 26L8 32V36L16 34" fill="#3B82F6" stroke="#1D4ED8" strokeWidth="2" />
    <path d="M34 26L40 32V36L32 34" fill="#3B82F6" stroke="#1D4ED8" strokeWidth="2" />
    {/* Exhaust Fire */}
    <path d="M21 36L24 43L27 36" fill="#FBBF24" />
  </svg>
);

/**
 * Universal Kids Icon Router
 */
export interface KidsIconProps extends IconProps {
  name:
    | 'home'
    | 'map'
    | 'listen'
    | 'speak'
    | 'star'
    | 'trophy'
    | 'game'
    | 'games'
    | 'lock'
    | 'soundOn'
    | 'soundOff'
    | 'sparkle'
    | 'play'
    | 'check'
    | 'rocket'
    | 'mountain'
    | 'world';
}

export const KidsIcon: React.FC<KidsIconProps> = ({ name, size = 28, className = '', filled = true }) => {
  switch (name) {
    case 'home':
      return <KidsHomeIcon size={size} className={className} />;
    case 'map':
    case 'mountain':
      return <KidsMapIcon size={size} className={className} />;
    case 'listen':
      return <KidsListenIcon size={size} className={className} />;
    case 'speak':
      return <KidsSpeakIcon size={size} className={className} />;
    case 'star':
      return <KidsStarIcon size={size} className={className} filled={filled} />;
    case 'trophy':
      return <KidsTrophyIcon size={size} className={className} />;
    case 'game':
    case 'games':
      return <KidsGameIcon size={size} className={className} />;
    case 'lock':
      return <KidsLockIcon size={size} className={className} />;
    case 'soundOn':
      return <KidsSoundIcon size={size} className={className} muted={false} />;
    case 'soundOff':
      return <KidsSoundIcon size={size} className={className} muted={true} />;
    case 'sparkle':
      return <KidsSparkleIcon size={size} className={className} />;
    case 'play':
      return <KidsPlayIcon size={size} className={className} />;
    case 'check':
      return <KidsCheckIcon size={size} className={className} />;
    case 'rocket':
    case 'world':
      return <KidsRocketIcon size={size} className={className} />;
    default:
      return <KidsStarIcon size={size} className={className} filled={filled} />;
  }
};

// Aliases for compatibility
export const KidsSparklesIcon = KidsSparkleIcon;
export const KidsSoundOnIcon: React.FC<IconProps> = (props) => <KidsSoundIcon {...props} muted={false} />;
export const KidsSoundOffIcon: React.FC<IconProps> = (props) => <KidsSoundIcon {...props} muted={true} />;
export const KidsParentIcon = KidsLockIcon;
export const KidsIslandIcon: React.FC<IconProps> = ({ className = '', size = 28 }) => (
  <svg width={size} height={size} viewBox="0 0 48 48" fill="none" className={`shrink-0 ${className}`}>
    {/* Sandy Island */}
    <ellipse cx="24" cy="36" rx="18" ry="7" fill="#FDE68A" stroke="#D97706" strokeWidth="2.5" />
    {/* Palm Tree Trunk */}
    <path d="M22 36C22 28 20 20 26 14" stroke="#92400E" strokeWidth="3.5" strokeLinecap="round" />
    {/* Palm Leaves */}
    <path d="M26 14C23 10 16 11 14 15" stroke="#10B981" strokeWidth="3.5" strokeLinecap="round" />
    <path d="M26 14C29 9 37 11 39 16" stroke="#10B981" strokeWidth="3.5" strokeLinecap="round" />
    <path d="M26 14C26 8 23 5 20 4" stroke="#059669" strokeWidth="3.5" strokeLinecap="round" />
  </svg>
);

export default KidsIcon;
