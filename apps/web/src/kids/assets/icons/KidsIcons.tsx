import React from 'react';

interface IconProps {
  className?: string;
  size?: number;
}

export const KidsHomeIcon: React.FC<IconProps> = ({ className = 'w-6 h-6', size }) => (
  <svg
    width={size}
    height={size}
    className={className}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2.5"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
    <polyline points="9 22 9 12 15 12 15 22" />
  </svg>
);

export const KidsMapIcon: React.FC<IconProps> = ({ className = 'w-6 h-6', size }) => (
  <svg
    width={size}
    height={size}
    className={className}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2.5"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <polygon points="3 6 9 3 15 6 21 3 21 18 15 21 9 18 3 21" />
    <line x1="9" x2="9" y1="3" y2="18" />
    <line x1="15" x2="15" y1="6" y2="21" />
  </svg>
);

export const KidsListenIcon: React.FC<IconProps> = ({ className = 'w-6 h-6', size }) => (
  <svg
    width={size}
    height={size}
    className={className}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2.5"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M3 18v-6a9 9 0 0 1 18 0v6" />
    <path d="M21 19a2 2 0 0 1-2 2h-1a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2h3zM3 19a2 2 0 0 0 2 2h1a2 2 0 0 0 2-2v-3a2 2 0 0 0-2-2H3z" />
  </svg>
);

export const KidsSpeakIcon: React.FC<IconProps> = ({ className = 'w-6 h-6', size }) => (
  <svg
    width={size}
    height={size}
    className={className}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2.5"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z" />
    <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
    <line x1="12" x2="12" y1="19" y2="22" />
  </svg>
);

export const KidsStarIcon: React.FC<IconProps & { filled?: boolean }> = ({
  className = 'w-6 h-6',
  size,
  filled = false,
}) => (
  <svg
    width={size}
    height={size}
    className={className}
    viewBox="0 0 24 24"
    fill={filled ? 'currentColor' : 'none'}
    stroke="currentColor"
    strokeWidth="2.5"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
  </svg>
);

export const KidsLockIcon: React.FC<IconProps> = ({ className = 'w-6 h-6', size }) => (
  <svg
    width={size}
    height={size}
    className={className}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2.5"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <rect width="18" height="11" x="3" y="11" rx="3" ry="3" />
    <path d="M7 11V7a5 5 0 0 1 10 0v4" />
  </svg>
);

export const KidsUnlockIcon: React.FC<IconProps> = ({ className = 'w-6 h-6', size }) => (
  <svg
    width={size}
    height={size}
    className={className}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2.5"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <rect width="18" height="11" x="3" y="11" rx="3" ry="3" />
    <path d="M7 11V7a5 5 0 0 1 9.9-1" />
  </svg>
);

export const KidsPlayIcon: React.FC<IconProps> = ({ className = 'w-6 h-6', size }) => (
  <svg
    width={size}
    height={size}
    className={className}
    viewBox="0 0 24 24"
    fill="currentColor"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <polygon points="6 3 20 12 6 21 6 3" />
  </svg>
);

export const KidsStoryIcon: React.FC<IconProps> = ({ className = 'w-6 h-6', size }) => (
  <svg
    width={size}
    height={size}
    className={className}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2.5"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1-2.5-2.5Z" />
    <path d="M6 6h10" />
    <path d="M6 10h10" />
    <path d="M6 14h6" />
  </svg>
);

export const KidsGameIcon: React.FC<IconProps> = ({ className = 'w-6 h-6', size }) => (
  <svg
    width={size}
    height={size}
    className={className}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2.5"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <rect width="20" height="12" x="2" y="6" rx="4" />
    <path d="M6 12h4" />
    <path d="M8 10v4" />
    <circle cx="15" cy="11" r="1" fill="currentColor" />
    <circle cx="18" cy="13" r="1" fill="currentColor" />
  </svg>
);

export const KidsIslandIcon: React.FC<IconProps> = ({ className = 'w-6 h-6', size }) => (
  <svg
    width={size}
    height={size}
    className={className}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2.5"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M2 19c3-1 6-1 10 0s7 1 10 0" />
    <path d="M12 4c2 2 3 5 3 9" />
    <path d="M12 4c-2 2-3 5-3 9" />
    <path d="M7 6c2 1 4 2 5-2 1 4 3 3 5 2" />
  </svg>
);

export const KidsSoundOnIcon: React.FC<IconProps> = ({ className = 'w-6 h-6', size }) => (
  <svg
    width={size}
    height={size}
    className={className}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2.5"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
    <path d="M15.54 8.46a5 5 0 0 1 0 7.07" />
    <path d="M19.07 4.93a10 10 0 0 1 0 14.14" />
  </svg>
);

export const KidsSoundOffIcon: React.FC<IconProps> = ({ className = 'w-6 h-6', size }) => (
  <svg
    width={size}
    height={size}
    className={className}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2.5"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <line x1="1" x2="23" y1="1" y2="23" />
    <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
    <path d="m15.5 8.5 4 4" />
    <path d="m19.5 8.5-4 4" />
  </svg>
);

export const KidsParentIcon: React.FC<IconProps> = ({ className = 'w-6 h-6', size }) => (
  <svg
    width={size}
    height={size}
    className={className}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2.5"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
    <circle cx="9" cy="7" r="4" />
    <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
    <path d="M16 3.13a4 4 0 0 1 0 7.75" />
  </svg>
);

export const KidsSparklesIcon: React.FC<IconProps> = ({ className = 'w-6 h-6', size }) => (
  <svg
    width={size}
    height={size}
    className={className}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2.5"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="m12 3-1.9 5.8a2 2 0 0 1-1.3 1.3L3 12l5.8 1.9a2 2 0 0 1 1.3 1.3L12 21l1.9-5.8a2 2 0 0 1 1.3-1.3L21 12l-5.8-1.9a2 2 0 0 1-1.3-1.3Z" />
    <path d="M5 3v4" />
    <path d="M3 5h4" />
    <path d="M19 17v4" />
    <path d="M17 19h4" />
  </svg>
);

export type KidsIconName =
  | 'home'
  | 'map'
  | 'listen'
  | 'speak'
  | 'star'
  | 'lock'
  | 'unlock'
  | 'play'
  | 'story'
  | 'games'
  | 'game'
  | 'island'
  | 'soundOn'
  | 'soundOff'
  | 'parent'
  | 'shield'
  | 'trophy'
  | 'sparkles';

export const KidsIcon: React.FC<IconProps & { name: KidsIconName; filled?: boolean }> = ({
  name,
  className,
  size,
  filled,
}) => {
  switch (name) {
    case 'home':
      return <KidsHomeIcon className={className} size={size} />;
    case 'map':
      return <KidsMapIcon className={className} size={size} />;
    case 'listen':
      return <KidsListenIcon className={className} size={size} />;
    case 'speak':
      return <KidsSpeakIcon className={className} size={size} />;
    case 'star':
      return <KidsStarIcon className={className} size={size} filled={filled} />;
    case 'lock':
      return <KidsLockIcon className={className} size={size} />;
    case 'unlock':
      return <KidsUnlockIcon className={className} size={size} />;
    case 'play':
      return <KidsPlayIcon className={className} size={size} />;
    case 'story':
      return <KidsStoryIcon className={className} size={size} />;
    case 'games':
    case 'game':
      return <KidsGameIcon className={className} size={size} />;
    case 'island':
      return <KidsIslandIcon className={className} size={size} />;
    case 'soundOn':
      return <KidsSoundOnIcon className={className} size={size} />;
    case 'soundOff':
      return <KidsSoundOffIcon className={className} size={size} />;
    case 'parent':
    case 'shield':
      return <KidsParentIcon className={className} size={size} />;
    case 'trophy':
    case 'sparkles':
      return <KidsSparklesIcon className={className} size={size} />;
    default:
      return <KidsSparklesIcon className={className} size={size} />;
  }
};
