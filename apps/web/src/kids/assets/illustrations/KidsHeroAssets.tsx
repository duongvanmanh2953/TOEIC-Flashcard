import React from 'react';

/**
 * KidsHeroAssets.tsx
 * Premium Stylized Vector Learning Assets for Kids English Mode
 * - 100% SVG Vector (Scalable to 400px+ with zero blur)
 * - Consistent 3D-toy lighting, soft directional floor shadows, specular highlights
 * - Zero tiny emojis used as primary gameplay art
 */

// ============================================================================
// 1. HERO APPLE (Glossy, 3D curved shading, dewdrop, soft ground shadow)
// ============================================================================
export const HeroApple: React.FC<{ size?: number; className?: string; onClick?: () => void }> = ({
  size = 180,
  className = '',
  onClick,
}) => (
  <div
    style={{ width: size, height: size }}
    className={`relative flex items-center justify-center cursor-pointer transition-transform duration-300 hover:scale-105 active:scale-95 ${className}`}
    onClick={onClick}
  >
    <svg viewBox="0 0 200 200" width="100%" height="100%" fill="none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        {/* Apple Body Gradient */}
        <radialGradient id="appleGrad" cx="35%" cy="30%" r="65%">
          <stop offset="0%" stopColor="#ff4d6d" />
          <stop offset="45%" stopColor="#e60039" />
          <stop offset="85%" stopColor="#b30026" />
          <stop offset="100%" stopColor="#7a0018" />
        </radialGradient>
        {/* Leaf Gradient */}
        <linearGradient id="leafGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#4ade80" />
          <stop offset="100%" stopColor="#15803d" />
        </linearGradient>
        {/* Stem Gradient */}
        <linearGradient id="stemGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#a16207" />
          <stop offset="100%" stopColor="#451a03" />
        </linearGradient>
        {/* Soft Floor Shadow Filter */}
        <filter id="appleShadow" x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="8" />
        </filter>
      </defs>

      {/* Soft Studio Floor Shadow */}
      <ellipse cx="100" cy="180" rx="65" ry="14" fill="#0f172a" fillOpacity="0.18" filter="url(#appleShadow)" />

      {/* Stem */}
      <path
        d="M98 62 C96 45, 110 32, 122 28 C120 36, 112 48, 104 62 Z"
        fill="url(#stemGrad)"
      />

      {/* Leaf */}
      <path
        d="M106 48 C128 32, 150 42, 154 58 C136 64, 116 58, 106 48 Z"
        fill="url(#leafGrad)"
      />
      {/* Leaf vein */}
      <path d="M108 50 C125 50, 140 54, 150 56" stroke="#86efac" strokeWidth="2" strokeLinecap="round" opacity="0.6" />

      {/* Apple Body Shape */}
      <path
        d="M100 70 
           C75 48, 38 60, 32 96 
           C24 140, 52 178, 88 178 
           C96 178, 98 174, 100 174 
           C102 174, 104 178, 112 178 
           C148 178, 176 140, 168 96 
           C162 60, 125 48, 100 70 Z"
        fill="url(#appleGrad)"
      />

      {/* Primary Specular Highlight */}
      <ellipse cx="65" cy="85" rx="20" ry="32" transform="rotate(-28 65 85)" fill="#ffffff" fillOpacity="0.45" />
      {/* Secondary Soft Rim Reflection */}
      <path
        d="M152 100 C156 125, 145 152, 125 165"
        stroke="#ffffff"
        strokeWidth="5"
        strokeLinecap="round"
        strokeOpacity="0.25"
      />
      {/* Crisp Dewdrop */}
      <circle cx="78" cy="115" r="4.5" fill="#ffffff" fillOpacity="0.75" />
    </svg>
  </div>
);

// ============================================================================
// 2. HERO ELEPHANT (Lush jungle explorer, warm friendly expression)
// ============================================================================
export const HeroElephant: React.FC<{ size?: number; className?: string; onClick?: () => void }> = ({
  size = 200,
  className = '',
  onClick,
}) => (
  <div
    style={{ width: size, height: size }}
    className={`relative flex items-center justify-center cursor-pointer transition-transform duration-300 hover:scale-105 active:scale-95 ${className}`}
    onClick={onClick}
  >
    <svg viewBox="0 0 200 200" width="100%" height="100%" fill="none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <radialGradient id="elephantBody" cx="40%" cy="35%" r="65%">
          <stop offset="0%" stopColor="#94a3b8" />
          <stop offset="60%" stopColor="#64748b" />
          <stop offset="100%" stopColor="#334155" />
        </radialGradient>
        <radialGradient id="elephantEar" cx="30%" cy="30%" r="70%">
          <stop offset="0%" stopColor="#f472b6" />
          <stop offset="70%" stopColor="#cbd5e1" />
          <stop offset="100%" stopColor="#64748b" />
        </radialGradient>
        <filter id="elephShadow" x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="8" />
        </filter>
      </defs>

      {/* Floor Shadow */}
      <ellipse cx="100" cy="180" rx="72" ry="15" fill="#0f172a" fillOpacity="0.18" filter="url(#elephShadow)" />

      {/* Back Legs */}
      <rect x="58" y="125" width="22" height="48" rx="10" fill="#475569" />
      <rect x="118" y="125" width="22" height="48" rx="10" fill="#475569" />

      {/* Main Body */}
      <ellipse cx="96" cy="118" rx="55" ry="46" fill="url(#elephantBody)" />

      {/* Front Legs */}
      <rect x="68" y="132" width="22" height="44" rx="10" fill="url(#elephantBody)" />
      <rect x="108" y="132" width="22" height="44" rx="10" fill="url(#elephantBody)" />
      {/* Toenails */}
      <circle cx="73" cy="172" r="3.5" fill="#e2e8f0" />
      <circle cx="79" cy="172" r="3.5" fill="#e2e8f0" />
      <circle cx="113" cy="172" r="3.5" fill="#e2e8f0" />
      <circle cx="119" cy="172" r="3.5" fill="#e2e8f0" />

      {/* Head */}
      <circle cx="138" cy="94" r="36" fill="url(#elephantBody)" />

      {/* Big Round Ear */}
      <ellipse cx="112" cy="92" rx="24" ry="30" fill="url(#elephantEar)" />

      {/* Joyful Eye */}
      <ellipse cx="145" cy="85" rx="6.5" ry="8" fill="#0f172a" />
      <circle cx="147" cy="82" r="2.8" fill="#ffffff" />

      {/* Curved Playful Trunk */}
      <path
        d="M162 102 C178 112, 192 98, 184 82 C178 72, 168 76, 168 84"
        stroke="url(#elephantBody)"
        strokeWidth="14"
        strokeLinecap="round"
      />
      {/* Ivory Tusk */}
      <path d="M152 110 C162 118, 168 114, 168 108" stroke="#fef08a" strokeWidth="5" strokeLinecap="round" />

      {/* Cheerful Blush */}
      <ellipse cx="132" cy="102" rx="7" ry="4.5" fill="#f43f5e" fillOpacity="0.4" />
    </svg>
  </div>
);

// ============================================================================
// 3. HERO ROBOT COMPONENT ASSETS (White pearl + graphite + cyan glow)
// ============================================================================
export const HeroRobotHead: React.FC<{ size?: number; className?: string }> = ({ size = 110, className = '' }) => (
  <svg viewBox="0 0 120 120" width={size} height={size} className={className} fill="none">
    <defs>
      <linearGradient id="headArmor" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#ffffff" />
        <stop offset="50%" stopColor="#f1f5f9" />
        <stop offset="100%" stopColor="#cbd5e1" />
      </linearGradient>
      <linearGradient id="visorGlow" x1="0%" y1="0%" x2="100%" y2="0%">
        <stop offset="0%" stopColor="#06b6d4" />
        <stop offset="50%" stopColor="#22d3ee" />
        <stop offset="100%" stopColor="#06b6d4" />
      </linearGradient>
    </defs>
    {/* Neck Connector */}
    <rect x="52" y="98" width="16" height="14" rx="4" fill="#334155" />
    {/* Helmet Cranium */}
    <rect x="24" y="24" width="72" height="74" rx="22" fill="url(#headArmor)" stroke="#94a3b8" strokeWidth="2.5" />
    {/* Ear Communication Pods */}
    <rect x="14" y="44" width="12" height="32" rx="6" fill="#1e293b" />
    <rect x="94" y="44" width="12" height="32" rx="6" fill="#1e293b" />
    {/* Cyan LED Visor */}
    <rect x="34" y="46" width="52" height="20" rx="8" fill="#0f172a" stroke="#0891b2" strokeWidth="1.5" />
    <rect x="38" y="50" width="44" height="12" rx="5" fill="url(#visorGlow)" />
    {/* Forehead Antenna Beacon */}
    <circle cx="60" cy="18" r="5" fill="#06b6d4" />
    <rect x="58" y="21" width="4" height="6" fill="#64748b" />
  </svg>
);

export const HeroRobotChest: React.FC<{ size?: number; className?: string }> = ({ size = 130, className = '' }) => (
  <svg viewBox="0 0 140 140" width={size} height={size} className={className} fill="none">
    <defs>
      <linearGradient id="chestArmor" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#f8fafc" />
        <stop offset="50%" stopColor="#e2e8f0" />
        <stop offset="100%" stopColor="#94a3b8" />
      </linearGradient>
      <radialGradient id="reactorCore" cx="50%" cy="50%" r="50%">
        <stop offset="0%" stopColor="#fef08a" />
        <stop offset="40%" stopColor="#06b6d4" />
        <stop offset="100%" stopColor="#0891b2" />
      </radialGradient>
    </defs>
    {/* Shoulder Sockets */}
    <circle cx="16" cy="38" r="14" fill="#1e293b" stroke="#475569" strokeWidth="2" />
    <circle cx="124" cy="38" r="14" fill="#1e293b" stroke="#475569" strokeWidth="2" />
    {/* Torso Plate */}
    <path
      d="M26 24 L114 24 L104 116 L36 116 Z"
      fill="url(#chestArmor)"
      stroke="#64748b"
      strokeWidth="2.5"
    />
    {/* Dark Chassis Center Insert */}
    <rect x="42" y="36" width="56" height="56" rx="14" fill="#0f172a" />
    {/* Glowing Energy Reactor Core */}
    <circle cx="70" cy="64" r="18" fill="url(#reactorCore)" />
    <circle cx="70" cy="64" r="12" fill="#ffffff" fillOpacity="0.8" />
  </svg>
);

export const HeroRobotArm: React.FC<{ isRight?: boolean; size?: number; className?: string }> = ({
  isRight = false,
  size = 110,
  className = '',
}) => (
  <svg
    viewBox="0 0 80 140"
    width={size * 0.58}
    height={size}
    className={`${isRight ? 'scale-x-[-1]' : ''} ${className}`}
    fill="none"
  >
    {/* Shoulder Joint Ball */}
    <circle cx="40" cy="22" r="18" fill="#1e293b" stroke="#64748b" strokeWidth="2" />
    {/* Upper Arm Bicep */}
    <rect x="26" y="36" width="28" height="38" rx="8" fill="#f1f5f9" stroke="#94a3b8" strokeWidth="2" />
    {/* Elbow Servo Joint */}
    <circle cx="40" cy="78" r="12" fill="#334155" />
    <circle cx="40" cy="78" r="5" fill="#06b6d4" />
    {/* Forearm Armor */}
    <rect x="24" y="86" width="32" height="36" rx="9" fill="#e2e8f0" stroke="#64748b" strokeWidth="2" />
    {/* Clenched Fist */}
    <circle cx="40" cy="126" r="11" fill="#0f172a" />
  </svg>
);

export const HeroRobotLeg: React.FC<{ isRight?: boolean; size?: number; className?: string }> = ({
  isRight = false,
  size = 120,
  className = '',
}) => (
  <svg
    viewBox="0 0 80 150"
    width={size * 0.54}
    height={size}
    className={`${isRight ? 'scale-x-[-1]' : ''} ${className}`}
    fill="none"
  >
    {/* Hip Servo Joint */}
    <circle cx="40" cy="20" r="16" fill="#1e293b" stroke="#475569" strokeWidth="2" />
    {/* Thigh Armor */}
    <rect x="25" y="32" width="30" height="42" rx="9" fill="#f8fafc" stroke="#94a3b8" strokeWidth="2" />
    {/* Knee Hydraulic Joint */}
    <circle cx="40" cy="80" r="13" fill="#334155" />
    <circle cx="40" cy="80" r="6" fill="#06b6d4" />
    {/* Shin Guard */}
    <rect x="22" y="90" width="36" height="42" rx="10" fill="#e2e8f0" stroke="#64748b" strokeWidth="2" />
    {/* Planted Heavy Foot */}
    <path d="M14 142 L66 142 L62 130 L22 130 Z" fill="#0f172a" />
  </svg>
);

// ============================================================================
// 4. HERO TREASURE CHEST (Oak wood, gleaming gold trims, giant lock)
// ============================================================================
export const HeroTreasureChest: React.FC<{ isOpen?: boolean; size?: number; className?: string }> = ({
  isOpen = false,
  size = 170,
  className = '',
}) => (
  <div style={{ width: size, height: size }} className={`relative flex items-center justify-center ${className}`}>
    <svg viewBox="0 0 200 200" width="100%" height="100%" fill="none">
      <defs>
        <linearGradient id="woodGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#9a3412" />
          <stop offset="50%" stopColor="#7c2d12" />
          <stop offset="100%" stopColor="#431407" />
        </linearGradient>
        <linearGradient id="goldTrim" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#fef08a" />
          <stop offset="50%" stopColor="#eab308" />
          <stop offset="100%" stopColor="#a16207" />
        </linearGradient>
      </defs>

      {/* Floor Shadow */}
      <ellipse cx="100" cy="175" rx="70" ry="14" fill="#0f172a" fillOpacity="0.2" />

      {/* Chest Base Box */}
      <rect x="36" y="96" width="128" height="68" rx="12" fill="url(#woodGrad)" stroke="#431407" strokeWidth="3" />
      {/* Gold Base Corner Straps */}
      <rect x="36" y="96" width="18" height="68" rx="4" fill="url(#goldTrim)" />
      <rect x="146" y="96" width="18" height="68" rx="4" fill="url(#goldTrim)" />

      {/* Chest Lid */}
      {isOpen ? (
        /* Open Lid swinging backward */
        <g transform="translate(0, -30)">
          <path d="M32 90 C32 40, 168 40, 168 90 Z" fill="url(#woodGrad)" stroke="#431407" strokeWidth="3" />
          {/* Gold Sparkles bursting out */}
          <circle cx="100" cy="70" r="14" fill="#facc15" />
          <circle cx="80" cy="55" r="9" fill="#38bdf8" />
          <circle cx="120" cy="55" r="9" fill="#f43f5e" />
        </g>
      ) : (
        /* Closed Heavy Lid */
        <g>
          <path d="M32 96 C32 52, 168 52, 168 96 Z" fill="url(#woodGrad)" stroke="#431407" strokeWidth="3" />
          <path d="M32 96 C32 52, 54 52, 54 96 Z" fill="url(#goldTrim)" />
          <path d="M146 96 C146 52, 168 52, 168 96 Z" fill="url(#goldTrim)" />
          {/* Golden Padlock */}
          <rect x="88" y="90" width="24" height="28" rx="6" fill="url(#goldTrim)" stroke="#78350f" strokeWidth="2" />
          <path d="M93 90 C93 78, 107 78, 107 90" stroke="#a16207" strokeWidth="4" strokeLinecap="round" />
          <circle cx="100" cy="102" r="3" fill="#451a03" />
        </g>
      )}
    </svg>
  </div>
);

// ============================================================================
// 5. HERO ACHIEVEMENT BADGE (Large visual reward, prestige crest)
// ============================================================================
export const HeroAchievementBadge: React.FC<{
  title: string;
  subtitle?: string;
  icon?: string;
  stars?: number;
  size?: number;
  className?: string;
}> = ({
  title,
  subtitle = 'Chiến Công Xuất Sắc',
  icon = '🏆',
  stars = 3,
  size = 180,
  className = '',
}) => (
  <div
    style={{ width: size }}
    className={`p-4 rounded-3xl bg-white border-2 border-amber-300 shadow-md flex flex-col items-center text-center space-y-2 transition-transform duration-300 hover:scale-105 ${className}`}
  >
    {/* Large Illustrated Crest */}
    <div className="w-24 h-24 rounded-2xl bg-gradient-to-br from-amber-300 via-yellow-400 to-amber-500 border-2 border-amber-400 flex items-center justify-center text-5xl shadow-sm">
      {icon}
    </div>

    {/* Stars */}
    <div className="flex items-center gap-1">
      {Array.from({ length: stars }).map((_, i) => (
        <span key={i} className="text-amber-400 text-base">★</span>
      ))}
    </div>

    {/* Title & Subtitle */}
    <div className="space-y-0.5">
      <h4 className="text-sm font-black text-slate-900 leading-tight">{title}</h4>
      <p className="text-[11px] font-bold text-slate-500">{subtitle}</p>
    </div>
  </div>
);
