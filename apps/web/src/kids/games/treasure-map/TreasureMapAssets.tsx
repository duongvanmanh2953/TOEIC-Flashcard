// ============================================================================
// TREASURE MAP ASSETS — HIGH-FIDELITY STORYBOOK VECTOR GRAPHICS
// Pure SVG artwork: Island landscape, Explorer Mascot, Key, Gate, Bridge, Flag, Torch, Chest
// ============================================================================

import React from 'react';
import { CharacterActionState } from './TreasureMapData';

// 1. STORYBOOK ISLAND ENVIRONMENT (Background SVG Layer)
export const TreasureMapBackground: React.FC = () => {
  return (
    <g id="treasure-map-environment">
      <defs>
        {/* Ocean Gradient */}
        <radialGradient id="oceanGrad" cx="50%" cy="50%" r="70%">
          <stop offset="0%" stopColor="#38bdf8" />
          <stop offset="60%" stopColor="#0ea5e9" />
          <stop offset="100%" stopColor="#0284c7" />
        </radialGradient>

        {/* Island Sand Shore Gradient */}
        <linearGradient id="sandGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#fef08a" />
          <stop offset="50%" stopColor="#fde047" />
          <stop offset="100%" stopColor="#eab308" />
        </linearGradient>

        {/* Tropical Island Jungle Green Gradient */}
        <linearGradient id="jungleGrad" x1="0%" y1="100%" x2="0%" y2="0%">
          <stop offset="0%" stopColor="#15803d" />
          <stop offset="50%" stopColor="#22c55e" />
          <stop offset="100%" stopColor="#4ade80" />
        </linearGradient>

        {/* Mountain Rock Gradient */}
        <linearGradient id="mountainGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#94a3b8" />
          <stop offset="50%" stopColor="#64748b" />
          <stop offset="100%" stopColor="#475569" />
        </linearGradient>

        {/* River Blue Gradient */}
        <linearGradient id="riverGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#67e8f9" />
          <stop offset="100%" stopColor="#06b6d4" />
        </linearGradient>

        {/* Gold Glow Filter */}
        <filter id="goldGlow" x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="6" result="blur" />
          <feComposite in="SourceGraphic" in2="blur" operator="over" />
        </filter>
      </defs>

      {/* 1.1 Azure Sea Water Surface */}
      <rect width="800" height="820" fill="url(#oceanGrad)" rx="24" />

      {/* Gentle Ocean Waves Ripple Lines */}
      <g opacity="0.35" stroke="#ffffff" strokeWidth="2" strokeLinecap="round" fill="none">
        <path d="M 40 120 Q 70 110 100 120 T 160 120" />
        <path d="M 640 90 Q 670 80 700 90 T 760 90" />
        <path d="M 50 420 Q 80 410 110 420 T 170 420" />
        <path d="M 680 520 Q 710 510 740 520 T 790 520" />
        <path d="M 40 760 Q 70 750 100 760 T 150 760" />
        <path d="M 660 720 Q 690 710 720 720 T 770 720" />
      </g>

      {/* 1.2 Main Adventure Island Sand Shore Silhouette */}
      <path
        d="M 80 760
           C 40 680, 50 560, 110 470
           C 160 400, 220 370, 290 340
           C 360 310, 420 270, 470 210
           C 530 140, 600 70, 710 90
           C 770 120, 770 260, 740 370
           C 710 470, 720 580, 670 660
           C 610 740, 480 780, 380 780
           C 280 780, 180 810, 80 760 Z"
        fill="url(#sandGrad)"
        opacity="0.95"
        stroke="#ca8a04"
        strokeWidth="4"
      />

      {/* 1.3 Inner Lush Jungle & Hills Landmass */}
      <path
        d="M 110 730
           C 80 660, 90 560, 140 480
           C 190 410, 250 380, 320 350
           C 390 320, 450 280, 490 230
           C 550 160, 610 110, 680 120
           C 730 150, 730 270, 700 370
           C 670 460, 680 560, 630 630
           C 580 700, 460 740, 370 740
           C 280 740, 180 770, 110 730 Z"
        fill="url(#jungleGrad)"
        stroke="#166534"
        strokeWidth="4"
      />

      {/* 1.4 Rocky Mountain Terrain (Upper Right) */}
      <g id="rocky-mountains">
        {/* Mountain 1 (Summit background) */}
        <polygon points="260,110 330,30 400,110" fill="url(#mountainGrad)" stroke="#334155" strokeWidth="3" />
        <polygon points="310,50 330,30 350,50 340,55 330,50 320,55" fill="#f8fafc" /> {/* Snowcap */}

        {/* Mountain 2 (East Peak) */}
        <polygon points="600,320 670,220 740,320" fill="url(#mountainGrad)" stroke="#334155" strokeWidth="3" />
        <polygon points="650,250 670,220 690,250 680,255 670,250 660,255" fill="#f8fafc" />
      </g>

      {/* 1.5 Jungle River (Winding from Mountains to Coast) */}
      <path
        d="M 640 290
           C 580 340, 560 370, 540 410
           C 510 460, 460 490, 420 540
           C 380 590, 330 630, 270 660
           L 290 690
           C 360 650, 420 610, 460 560
           C 500 510, 540 470, 575 420
           C 600 380, 620 350, 675 305 Z"
        fill="url(#riverGrad)"
        stroke="#0891b2"
        strokeWidth="3"
      />

      {/* River Foamy Water Currents */}
      <path
        d="M 545 405 Q 525 435 490 475 M 460 520 Q 420 560 370 605"
        stroke="#ffffff"
        strokeWidth="2.5"
        strokeDasharray="6 8"
        fill="none"
        opacity="0.6"
      />

      {/* 1.6 Tropical Palm Trees Clusters */}
      {/* Beach Palms */}
      <g transform="translate(130, 540) scale(0.7)">
        <path d="M 20 70 Q 25 35 15 10" stroke="#78350f" strokeWidth="6" strokeLinecap="round" fill="none" />
        <ellipse cx="5" cy="5" rx="20" ry="8" fill="#15803d" transform="rotate(-30 5 5)" />
        <ellipse cx="25" cy="5" rx="20" ry="8" fill="#22c55e" transform="rotate(30 25 5)" />
        <ellipse cx="15" cy="-5" rx="22" ry="9" fill="#16a34a" />
      </g>
      <g transform="translate(230, 640) scale(0.65)">
        <path d="M 20 70 Q 15 35 25 10" stroke="#78350f" strokeWidth="6" strokeLinecap="round" fill="none" />
        <ellipse cx="5" cy="5" rx="20" ry="8" fill="#15803d" transform="rotate(-25 5 5)" />
        <ellipse cx="25" cy="5" rx="20" ry="8" fill="#22c55e" transform="rotate(25 25 5)" />
        <ellipse cx="15" cy="-5" rx="22" ry="9" fill="#16a34a" />
      </g>
      {/* Forest Trees */}
      <g transform="translate(260, 430) scale(0.8)">
        <ellipse cx="20" cy="30" rx="28" ry="32" fill="#15803d" />
        <ellipse cx="45" cy="35" rx="24" ry="28" fill="#16a34a" />
        <ellipse cx="32" cy="15" rx="22" ry="24" fill="#22c55e" />
      </g>
      <g transform="translate(420, 240) scale(0.75)">
        <ellipse cx="20" cy="30" rx="26" ry="30" fill="#15803d" />
        <ellipse cx="40" cy="32" rx="22" ry="26" fill="#16a34a" />
        <ellipse cx="30" cy="12" rx="20" ry="22" fill="#22c55e" />
      </g>

      {/* 1.7 Little Pirate Ship in the Bay */}
      <g transform="translate(680, 640) scale(0.55)">
        <path d="M 10 50 C 30 75, 90 75, 110 50 L 100 40 L 20 40 Z" fill="#78350f" stroke="#451a03" strokeWidth="3" />
        <line x1="60" y1="40" x2="60" y2="5" stroke="#451a03" strokeWidth="4" />
        <path d="M 60 10 L 95 25 L 60 35 Z" fill="#f8fafc" stroke="#cbd5e1" strokeWidth="2" />
        <polygon points="60,5 60,0 75,3" fill="#ef4444" />
      </g>

      {/* 1.8 Classic Compass Rose (Upper Left) */}
      <g transform="translate(80, 80) scale(0.8)" opacity="0.85">
        <circle cx="40" cy="40" r="32" fill="#ffffff" stroke="#94a3b8" strokeWidth="2.5" />
        <circle cx="40" cy="40" r="28" fill="#fef3c7" />
        <polygon points="40,15 45,35 40,40 35,35" fill="#ef4444" /> {/* North Red */}
        <polygon points="40,65 45,45 40,40 35,45" fill="#3b82f6" /> {/* South Blue */}
        <polygon points="15,40 35,45 40,40 35,35" fill="#64748b" /> {/* West */}
        <polygon points="65,40 45,45 40,40 45,35" fill="#64748b" /> {/* East */}
        <circle cx="40" cy="40" r="4" fill="#fbbf24" stroke="#78350f" strokeWidth="1.5" />
        <text x="40" y="11" textAnchor="middle" fontSize="10" fontWeight="900" fill="#dc2626">N</text>
      </g>
    </g>
  );
};

// 2. EXPLORER BOBBY (Mascot Character in Explorer Safari Hat & Backpack)
interface ExplorerBobbyProps {
  x: number;
  y: number;
  state: CharacterActionState;
}

export const ExplorerBobby: React.FC<ExplorerBobbyProps> = ({ x, y, state }) => {
  const isWalking = state === 'walk';
  const isCelebrating = state === 'celebrate' || state === 'happy';

  return (
    <g
      id="explorer-bobby"
      transform={`translate(${x}, ${y})`}
      className="transition-all duration-500 ease-out"
      style={{ cursor: 'pointer' }}
    >
      {/* Soft Ground Shadow */}
      <ellipse cx="0" cy="22" rx="22" ry="7" fill="#0f172a" opacity="0.25" />

      {/* Backpack on Bobby's back */}
      <g transform="translate(-16, -10)">
        <rect x="0" y="0" width="10" height="20" rx="4" fill="#92400e" stroke="#78350f" strokeWidth="1.5" />
        <rect x="1" y="4" width="8" height="6" rx="2" fill="#b45309" />
        <circle cx="5" cy="7" r="1.5" fill="#fbbf24" />
      </g>

      {/* Main Body (Friendly Rounded Bear/Mascot) */}
      <circle cx="0" cy="0" r="20" fill="#f59e0b" stroke="#b45309" strokeWidth="2.5" />
      <circle cx="0" cy="3" r="13" fill="#fef3c7" /> {/* Tummy */}

      {/* Left & Right Ears */}
      <circle cx="-14" cy="-16" r="6" fill="#f59e0b" stroke="#b45309" strokeWidth="2" />
      <circle cx="-14" cy="-16" r="3.5" fill="#fed7aa" />
      <circle cx="14" cy="-16" r="6" fill="#f59e0b" stroke="#b45309" strokeWidth="2" />
      <circle cx="14" cy="-16" r="3.5" fill="#fed7aa" />

      {/* Explorer Safari Pith Helmet */}
      <g id="safari-helmet" transform="translate(0, -18)">
        <path d="M -22 6 Q 0 4 22 6 L 19 2 Q 0 0 -19 2 Z" fill="#d97706" stroke="#92400e" strokeWidth="1.5" /> {/* Brim */}
        <path d="M -15 2 C -16 -12, 16 -12, 15 2 Z" fill="#fbbf24" stroke="#b45309" strokeWidth="2" /> {/* Dome */}
        {/* Safari Hat Band */}
        <rect x="-14" y="-1" width="28" height="3" fill="#78350f" />
        {/* Golden Explorer Compass Badge */}
        <circle cx="0" cy="0" r="3" fill="#fef08a" stroke="#ca8a04" strokeWidth="1" />
      </g>

      {/* Cute Eyes */}
      <circle cx="-6" cy="-4" r="3" fill="#1e293b" />
      <circle cx="-5" cy="-5" r="1" fill="#ffffff" />
      <circle cx="6" cy="-4" r="3" fill="#1e293b" />
      <circle cx="7" cy="-5" r="1" fill="#ffffff" />

      {/* Cheerful Nose & Smile */}
      <ellipse cx="0" cy="1" rx="2.5" ry="2" fill="#78350f" />
      <path d="M -4 4 Q 0 8 4 4" stroke="#78350f" strokeWidth="1.5" fill="none" strokeLinecap="round" />

      {/* Rosy Cheeks */}
      <circle cx="-11" cy="0" r="3" fill="#f43f5e" opacity="0.4" />
      <circle cx="11" cy="0" r="3" fill="#f43f5e" opacity="0.4" />

      {/* Animated Arms */}
      {isCelebrating ? (
        // Arms Up High Celebrating!
        <g>
          <path d="M -16 -2 Q -24 -16 -18 -22" stroke="#d97706" strokeWidth="5" strokeLinecap="round" fill="none" />
          <path d="M 16 -2 Q 24 -16 18 -22" stroke="#d97706" strokeWidth="5" strokeLinecap="round" fill="none" />
        </g>
      ) : (
        // Rest or Walking Arms
        <g>
          <path d="M -16 0 Q -22 8 -16 14" stroke="#d97706" strokeWidth="4.5" strokeLinecap="round" fill="none" />
          <path d="M 16 0 Q 22 8 16 14" stroke="#d97706" strokeWidth="4.5" strokeLinecap="round" fill="none" />
        </g>
      )}

      {/* Walking Boots / Legs */}
      <g id="explorer-boots" className={isWalking ? 'animate-bounce' : ''}>
        <ellipse cx="-8" cy="19" rx="5" ry="4" fill="#78350f" stroke="#451a03" strokeWidth="1" />
        <ellipse cx="8" cy="19" rx="5" ry="4" fill="#78350f" stroke="#451a03" strokeWidth="1" />
      </g>

      {/* Sparkling Auras when Happy/Celebrating */}
      {isCelebrating && (
        <g opacity="0.9">
          <polygon points="0,-32 3,-26 9,-26 4,-22 6,-16 0,-20 -6,-16 -4,-22 -9,-26 -3,-26" fill="#facc15" />
          <polygon points="22,-24 24,-20 28,-20 25,-17 26,-13 22,-16 18,-13 19,-17 16,-20 20,-20" fill="#38bdf8" />
          <polygon points="-22,-24 -20,-20 -16,-20 -19,-17 -18,-13 -22,-16 -26,-13 -25,-17 -28,-20 -24,-20" fill="#ec4899" />
        </g>
      )}
    </g>
  );
};

// 3. VECTOR GOLDEN KEY (Target 1: Beach Quest)
export const VectorGoldenKey: React.FC<{ isFloating?: boolean; onClick?: () => void }> = ({
  isFloating = true,
  onClick,
}) => {
  return (
    <g
      id="target-golden-key"
      onClick={onClick}
      className={`${isFloating ? 'animate-bounce' : ''} cursor-pointer transition-transform hover:scale-110 active:scale-95`}
    >
      {/* Pulsing Light Aura */}
      <circle cx="0" cy="0" r="26" fill="#fef08a" opacity="0.45" />

      {/* Key Bow Ring */}
      <circle cx="0" cy="-12" r="14" fill="#eab308" stroke="#ca8a04" strokeWidth="3" />
      <circle cx="0" cy="-12" r="7" fill="#fef08a" stroke="#ca8a04" strokeWidth="2" />
      {/* Ruby Gem in Key Head */}
      <circle cx="0" cy="-12" r="3.5" fill="#ef4444" stroke="#991b1b" strokeWidth="1" />

      {/* Key Shaft */}
      <rect x="-3" y="-2" width="6" height="24" rx="2" fill="#eab308" stroke="#ca8a04" strokeWidth="2" />

      {/* Key Teeth */}
      <rect x="0" y="10" width="8" height="4" rx="1" fill="#eab308" stroke="#ca8a04" strokeWidth="1.5" />
      <rect x="0" y="17" width="10" height="4" rx="1" fill="#eab308" stroke="#ca8a04" strokeWidth="1.5" />

      {/* Sparkles */}
      <polygon points="14,-22 16,-18 20,-18 17,-15 18,-11 14,-13 10,-11 11,-15 8,-18 12,-18" fill="#fde047" />
    </g>
  );
};

// 4. VECTOR ANCIENT GATE (Target 2: Forest Gate Quest)
export const VectorAncientGate: React.FC<{ isOpen: boolean; onClick?: () => void }> = ({
  isOpen,
  onClick,
}) => {
  return (
    <g id="target-ancient-gate" onClick={onClick} className="cursor-pointer">
      {/* Stone Pillars Left & Right */}
      <rect x="-36" y="-35" width="16" height="70" rx="4" fill="#64748b" stroke="#334155" strokeWidth="2.5" />
      <rect x="20" y="-35" width="16" height="70" rx="4" fill="#64748b" stroke="#334155" strokeWidth="2.5" />
      {/* Stone Capstones */}
      <rect x="-40" y="-40" width="24" height="8" rx="2" fill="#475569" stroke="#1e293b" strokeWidth="2" />
      <rect x="16" y="-40" width="24" height="8" rx="2" fill="#475569" stroke="#1e293b" strokeWidth="2" />

      {/* Heavy Wood Gate Doors */}
      {isOpen ? (
        // Open Gate (Doors swung back to pillars)
        <g>
          {/* Left Door Swung Open */}
          <rect x="-44" y="-30" width="10" height="60" rx="2" fill="#78350f" stroke="#451a03" strokeWidth="2" />
          {/* Right Door Swung Open */}
          <rect x="34" y="-30" width="10" height="60" rx="2" fill="#78350f" stroke="#451a03" strokeWidth="2" />
          {/* Golden Pathway Opening Shimmer */}
          <rect x="-20" y="-28" width="40" height="56" rx="4" fill="#fef08a" opacity="0.3" />
        </g>
      ) : (
        // Closed Gate with Giant Padlock
        <g>
          {/* Left Timber Door */}
          <rect x="-20" y="-30" width="19" height="60" fill="#92400e" stroke="#451a03" strokeWidth="2" />
          <line x1="-16" y1="-10" x2="-3" y2="-10" stroke="#78350f" strokeWidth="2" />
          <line x1="-16" y1="12" x2="-3" y2="12" stroke="#78350f" strokeWidth="2" />

          {/* Right Timber Door */}
          <rect x="1" y="-30" width="19" height="60" fill="#92400e" stroke="#451a03" strokeWidth="2" />
          <line x1="3" y1="-10" x2="16" y2="-10" stroke="#78350f" strokeWidth="2" />
          <line x1="3" y1="12" x2="16" y2="12" stroke="#78350f" strokeWidth="2" />

          {/* Heavy Brass Lock in Center */}
          <circle cx="0" cy="0" r="11" fill="#eab308" stroke="#854d0e" strokeWidth="2" />
          <path d="M -5 -4 Q -5 -11 0 -11 Q 5 -11 5 -4" fill="none" stroke="#713f12" strokeWidth="2.5" />
          <circle cx="0" cy="0" r="2.5" fill="#451a03" />
          <line x1="0" y1="0" x2="0" y2="5" stroke="#451a03" strokeWidth="2" />
        </g>
      )}

      {/* Jungle Vines across Gate top */}
      <path d="M -38 -36 Q 0 -28 38 -36" fill="none" stroke="#16a34a" strokeWidth="3" />
      <circle cx="-10" cy="-33" r="3" fill="#22c55e" />
      <circle cx="12" cy="-32" r="3.5" fill="#22c55e" />
    </g>
  );
};

// 5. VECTOR RIVER BRIDGE (Target 3: River Bridge Quest)
export const VectorRiverBridge: React.FC<{
  planksPlaced: number; // 0 to 3
  onAddPlank?: () => void;
}> = ({ planksPlaced, onAddPlank }) => {
  return (
    <g id="target-river-bridge" onClick={onAddPlank} className="cursor-pointer">
      {/* Stone Foundation Abutments */}
      <rect x="-38" y="-22" width="14" height="44" rx="3" fill="#64748b" stroke="#334155" strokeWidth="2" />
      <rect x="24" y="-22" width="14" height="44" rx="3" fill="#64748b" stroke="#334155" strokeWidth="2" />

      {/* Bridge Support Beams */}
      <line x1="-30" y1="-15" x2="30" y2="-15" stroke="#78350f" strokeWidth="4" />
      <line x1="-30" y1="15" x2="30" y2="15" stroke="#78350f" strokeWidth="4" />

      {/* Wooden Plank 1 (Left slot) */}
      {planksPlaced >= 1 ? (
        <g>
          <rect x="-24" y="-18" width="14" height="36" rx="2" fill="#b45309" stroke="#78350f" strokeWidth="2" />
          <circle cx="-17" cy="-13" r="1" fill="#451a03" />
          <circle cx="-17" cy="13" r="1" fill="#451a03" />
        </g>
      ) : (
        <rect x="-24" y="-18" width="14" height="36" rx="2" fill="#fed7aa" stroke="#f97316" strokeWidth="2" strokeDasharray="3 3" opacity="0.7" />
      )}

      {/* Wooden Plank 2 (Middle slot) */}
      {planksPlaced >= 2 ? (
        <g>
          <rect x="-7" y="-18" width="14" height="36" rx="2" fill="#b45309" stroke="#78350f" strokeWidth="2" />
          <circle cx="0" cy="-13" r="1" fill="#451a03" />
          <circle cx="0" cy="13" r="1" fill="#451a03" />
        </g>
      ) : (
        <rect x="-7" y="-18" width="14" height="36" rx="2" fill="#fed7aa" stroke="#f97316" strokeWidth="2" strokeDasharray="3 3" opacity="0.7" />
      )}

      {/* Wooden Plank 3 (Right slot) */}
      {planksPlaced >= 3 ? (
        <g>
          <rect x="10" y="-18" width="14" height="36" rx="2" fill="#b45309" stroke="#78350f" strokeWidth="2" />
          <circle cx="17" cy="-13" r="1" fill="#451a03" />
          <circle cx="17" cy="13" r="1" fill="#451a03" />
        </g>
      ) : (
        <rect x="10" y="-18" width="14" height="36" rx="2" fill="#fed7aa" stroke="#f97316" strokeWidth="2" strokeDasharray="3 3" opacity="0.7" />
      )}

      {/* Rope Railings */}
      <path d="M -36 -18 Q 0 -24 36 -18" fill="none" stroke="#ca8a04" strokeWidth="2" />
      <path d="M -36 18 Q 0 24 36 18" fill="none" stroke="#ca8a04" strokeWidth="2" />
    </g>
  );
};

// 6. VECTOR BLUE FLAG (Target 4: Mountain Peak Quest)
export const VectorBlueFlag: React.FC<{ isDiscovered: boolean; onClick?: () => void }> = ({
  isDiscovered,
  onClick,
}) => {
  return (
    <g
      id="target-blue-flag"
      onClick={onClick}
      className={`cursor-pointer transition-transform hover:scale-110 active:scale-95 ${isDiscovered ? '' : 'animate-bounce'}`}
    >
      {/* Rock Base Cairn */}
      <ellipse cx="0" cy="18" rx="14" ry="6" fill="#475569" />
      <ellipse cx="4" cy="15" rx="8" ry="4" fill="#64748b" />

      {/* Flagpole */}
      <line x1="0" y1="18" x2="0" y2="-32" stroke="#78350f" strokeWidth="3.5" strokeLinecap="round" />
      <circle cx="0" cy="-33" r="3" fill="#facc15" stroke="#ca8a04" strokeWidth="1" />

      {/* Sapphire Blue Flag Banner */}
      <g>
        <path
          d="M 0 -30 Q 18 -36 32 -30 Q 18 -18 32 -10 L 0 -14 Z"
          fill="#2563eb"
          stroke="#1d4ed8"
          strokeWidth="1.5"
        />
        {/* Golden Star Emblem on Flag */}
        <polygon points="14,-22 16,-18 20,-18 17,-15 18,-11 14,-13 10,-11 11,-15 8,-18 12,-18" fill="#fde047" />
      </g>
    </g>
  );
};

// 7. VECTOR CRYSTAL TORCH (Target 5: Cave Quest)
export const VectorCrystalTorch: React.FC<{ isLit: boolean; onClick?: () => void }> = ({
  isLit,
  onClick,
}) => {
  return (
    <g
      id="target-crystal-torch"
      onClick={onClick}
      className={`cursor-pointer transition-transform hover:scale-110 active:scale-95 ${isLit ? '' : 'animate-bounce'}`}
    >
      {/* Dark Cave Entrance Background */}
      <path d="M -30 20 C -30 -25, 30 -25, 30 20 Z" fill="#0f172a" stroke="#334155" strokeWidth="3" />

      {/* Stone Wall Bracket */}
      <rect x="-16" y="-2" width="32" height="6" rx="2" fill="#475569" stroke="#1e293b" strokeWidth="1" />

      {/* Torch Wooden Handle */}
      <rect x="-4" y="0" width="8" height="24" rx="2" fill="#78350f" stroke="#451a03" strokeWidth="1.5" />

      {/* Bronze Torch Head Bowl */}
      <polygon points="-8,0 8,0 6,-8 -6,-8" fill="#b45309" stroke="#78350f" strokeWidth="1.5" />

      {/* Flaming Fire when Lit */}
      {isLit ? (
        <g id="torch-fire" className="animate-pulse">
          {/* Radial Warm Glow */}
          <circle cx="0" cy="-14" r="28" fill="#fde047" opacity="0.35" />
          {/* Outer Orange Flame */}
          <path d="M -7 -8 C -10 -16, 0 -26, 0 -26 C 0 -26, 10 -16, 7 -8 Z" fill="#f97316" />
          {/* Inner Yellow Core Flame */}
          <path d="M -4 -8 C -6 -13, 0 -20, 0 -20 C 0 -20, 6 -13, 4 -8 Z" fill="#fef08a" />
          <circle cx="0" cy="-8" r="2" fill="#ffffff" />
        </g>
      ) : (
        // Unlit Torch
        <ellipse cx="0" cy="-8" rx="5" ry="3" fill="#334155" />
      )}
    </g>
  );
};

// 8. VECTOR TREASURE CHEST (Target 6: Summit Treasure Quest)
export const VectorTreasureChest: React.FC<{ isOpen: boolean; onClick?: () => void }> = ({
  isOpen,
  onClick,
}) => {
  return (
    <g
      id="target-treasure-chest"
      onClick={onClick}
      className="cursor-pointer transition-transform hover:scale-105 active:scale-95"
    >
      {isOpen ? (
        // Open Chest Radiating Gold Coins & Diamonds!
        <g>
          {/* Radiant Golden Light Beams */}
          <g opacity="0.65" className="animate-pulse">
            <polygon points="0,-10 -50,-60 -30,-70" fill="#fef08a" />
            <polygon points="0,-10 -20,-75 0,-80" fill="#fef08a" />
            <polygon points="0,-10 20,-75 40,-70" fill="#fef08a" />
            <polygon points="0,-10 50,-60 65,-45" fill="#fef08a" />
          </g>

          {/* Chest Base Box */}
          <rect x="-32" y="-6" width="64" height="34" rx="4" fill="#78350f" stroke="#451a03" strokeWidth="3" />
          <rect x="-30" y="-4" width="60" height="6" fill="#b45309" />
          <rect x="-24" y="-6" width="6" height="34" fill="#fbbf24" /> {/* Gold Band Left */}
          <rect x="18" y="-6" width="6" height="34" fill="#fbbf24" /> {/* Gold Band Right */}

          {/* Open Lid Tilted Upwards */}
          <g transform="translate(0, -10) rotate(-40)">
            <rect x="-32" y="-18" width="64" height="20" rx="6" fill="#92400e" stroke="#451a03" strokeWidth="3" />
            <rect x="-24" y="-18" width="6" height="20" fill="#fbbf24" />
            <rect x="18" y="-18" width="6" height="20" fill="#fbbf24" />
          </g>

          {/* Heaping Gold Coins & Diamonds */}
          <g>
            <circle cx="-12" cy="-4" r="7" fill="#facc15" stroke="#ca8a04" strokeWidth="1.5" />
            <circle cx="0" cy="-8" r="8" fill="#fde047" stroke="#ca8a04" strokeWidth="1.5" />
            <circle cx="14" cy="-3" r="7.5" fill="#facc15" stroke="#ca8a04" strokeWidth="1.5" />
            {/* Sparkling Blue Diamond */}
            <polygon points="0,-18 6,-12 0,-6 -6,-12" fill="#38bdf8" stroke="#0284c7" strokeWidth="1" />
            {/* Ruby Gem */}
            <polygon points="-10,-12 -6,-8 -10,-4 -14,-8" fill="#ef4444" stroke="#991b1b" strokeWidth="1" />
          </g>
        </g>
      ) : (
        // Closed Solid Chest with Golden Straps & Giant Keyhole Lock
        <g className="animate-bounce">
          {/* Soft Ground Shadow */}
          <ellipse cx="0" cy="28" rx="34" ry="8" fill="#0f172a" opacity="0.3" />

          {/* Chest Base Box */}
          <rect x="-32" y="2" width="64" height="26" rx="3" fill="#78350f" stroke="#451a03" strokeWidth="3" />
          <rect x="-30" y="4" width="60" height="5" fill="#b45309" />

          {/* Curved Barrel Lid */}
          <path d="M -32 2 Q 0 -22 32 2 Z" fill="#92400e" stroke="#451a03" strokeWidth="3" />

          {/* Heavy Golden Iron Straps */}
          <rect x="-22" y="-10" width="8" height="38" rx="2" fill="#facc15" stroke="#b45309" strokeWidth="2" />
          <rect x="14" y="-10" width="8" height="38" rx="2" fill="#facc15" stroke="#b45309" strokeWidth="2" />

          {/* Center Golden Lock Plate */}
          <rect x="-10" y="-1" width="20" height="18" rx="3" fill="#fbbf24" stroke="#78350f" strokeWidth="2" />
          <circle cx="0" cy="6" r="3" fill="#451a03" />
          <polygon points="-1.5,7 1.5,7 2,12 -2,12" fill="#451a03" />
        </g>
      )}
    </g>
  );
};
