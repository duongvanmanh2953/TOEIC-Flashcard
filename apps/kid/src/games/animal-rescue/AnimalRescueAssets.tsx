// ============================================================================
// ANIMAL RESCUE ASSETS — 3D METALLIC CHAINS, GOLDEN PADLOCKS & JUNGLE SANCTUARY
// Clear, tactile, child-friendly vector artwork for "Thả Xích Cho Thú"
// ============================================================================

import React from 'react';

// 1. JUNGLE SANCTUARY BACKGROUND SVG
export const SanctuaryBackdrop: React.FC = () => {
  return (
    <g id="sanctuary-backdrop">
      <defs>
        {/* Tropical Canopy Gradient */}
        <linearGradient id="skyGrad" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#bae6fd" />
          <stop offset="60%" stopColor="#dcfce7" />
          <stop offset="100%" stopColor="#bbf7d0" />
        </linearGradient>

        {/* Forest Floor Gradient */}
        <linearGradient id="groundGrad" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#15803d" />
          <stop offset="40%" stopColor="#166534" />
          <stop offset="100%" stopColor="#14532d" />
        </linearGradient>

        {/* Sunlight Beams */}
        <linearGradient id="sunbeamGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#fef08a" stopOpacity="0.4" />
          <stop offset="100%" stopColor="#fef08a" stopOpacity="0" />
        </linearGradient>

        {/* Metallic Chain Links Gradient */}
        <linearGradient id="metalGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#e2e8f0" />
          <stop offset="25%" stopColor="#94a3b8" />
          <stop offset="50%" stopColor="#f8fafc" />
          <stop offset="75%" stopColor="#64748b" />
          <stop offset="100%" stopColor="#334155" />
        </linearGradient>

        {/* Golden Padlock Gradient */}
        <linearGradient id="goldPadlockGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#fef08a" />
          <stop offset="35%" stopColor="#f59e0b" />
          <stop offset="70%" stopColor="#d97706" />
          <stop offset="100%" stopColor="#b45309" />
        </linearGradient>

        {/* Shackle Steel Gradient */}
        <linearGradient id="shackleGrad" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#cbd5e1" />
          <stop offset="50%" stopColor="#64748b" />
          <stop offset="100%" stopColor="#334155" />
        </linearGradient>

        {/* Glow Filter */}
        <filter id="goldenPulse" x="-30%" y="-30%" width="160%" height="160%">
          <feGaussianBlur stdDeviation="5" result="blur" />
          <feComposite in="SourceGraphic" in2="blur" operator="over" />
        </filter>
      </defs>

      {/* Sunny Sky & Mist */}
      <rect width="800" height="600" fill="url(#skyGrad)" rx="32" />

      {/* Sun Rays */}
      <polygon points="100,0 220,0 380,600 200,600" fill="url(#sunbeamGrad)" />
      <polygon points="400,0 520,0 680,600 500,600" fill="url(#sunbeamGrad)" />

      {/* Jungle Trees Background Layer */}
      <g opacity="0.35">
        <circle cx="80" cy="180" r="140" fill="#22c55e" />
        <circle cx="720" cy="160" r="150" fill="#16a34a" />
        <circle cx="200" cy="140" r="100" fill="#4ade80" />
        <circle cx="620" cy="130" r="110" fill="#22c55e" />
      </g>

      {/* Hanging Tropical Vines & Leaves Top */}
      <g stroke="#15803d" strokeWidth="4" fill="none">
        <path d="M 60,0 Q 80,100 50,160" />
        <path d="M 120,0 Q 140,80 110,130" />
        <path d="M 680,0 Q 660,110 700,180" />
        <path d="M 740,0 Q 720,70 750,120" />
      </g>
      {/* Decorative Jungle Leaves */}
      <ellipse cx="50" cy="160" rx="14" ry="7" fill="#22c55e" transform="rotate(30 50 160)" />
      <ellipse cx="110" cy="130" rx="12" ry="6" fill="#16a34a" transform="rotate(-20 110 130)" />
      <ellipse cx="700" cy="180" rx="16" ry="8" fill="#22c55e" transform="rotate(-35 700 180)" />
      <ellipse cx="750" cy="120" rx="13" ry="7" fill="#4ade80" transform="rotate(25 750 120)" />

      {/* Sanctuary Grass Ground Platform */}
      <path
        d="M 0,440 C 200,420 600,420 800,440 L 800,600 L 0,600 Z"
        fill="url(#groundGrad)"
      />

      {/* Grass Tufts on Forest Ground */}
      <g fill="#4ade80" opacity="0.8">
        <path d="M 120,440 Q 125,415 130,440" stroke="#4ade80" strokeWidth="3" />
        <path d="M 125,440 Q 133,420 138,440" stroke="#4ade80" strokeWidth="3" />
        <path d="M 660,440 Q 665,418 670,440" stroke="#4ade80" strokeWidth="3" />
        <path d="M 667,440 Q 675,422 680,440" stroke="#4ade80" strokeWidth="3" />
      </g>
    </g>
  );
};

// 2. ENCLOSURE / SANCTUARY CAGE FRAME
export const SanctuaryEnclosure: React.FC<{ isOpen: boolean; children: React.ReactNode }> = ({
  isOpen,
  children,
}) => {
  return (
    <g id="sanctuary-enclosure">
      {/* Stage Shadow */}
      <ellipse cx="400" cy="450" rx="200" ry="32" fill="#0f172a" opacity="0.2" />

      {/* Wooden Platform Base */}
      <rect x="220" y="420" width="360" height="28" rx="8" fill="#78350f" stroke="#451a03" strokeWidth="3" />
      <rect x="230" y="423" width="340" height="8" rx="4" fill="#92400e" />

      {/* Stone Foundation Pedestal */}
      <path
        d="M 200,448 L 220,420 L 580,420 L 600,448 Z"
        fill="#64748b"
        stroke="#334155"
        strokeWidth="3"
      />

      {/* Animal Chamber Interior (Soft Sky Glass/Glow Background) */}
      <rect
        x="240"
        y="150"
        width="320"
        height="270"
        rx="24"
        fill={isOpen ? '#fef9c3' : '#f8fafc'}
        stroke={isOpen ? '#facc15' : '#cbd5e1'}
        strokeWidth="4"
        className="transition-colors duration-500"
      />

      {/* Ambient Backlight inside Chamber */}
      <circle
        cx="400"
        cy="285"
        r="110"
        fill={isOpen ? '#fef08a' : '#e2e8f0'}
        opacity={isOpen ? 0.9 : 0.4}
        className="transition-opacity duration-500"
      />

      {/* Golden Celebration Light Beams when Freed */}
      {isOpen && (
        <g id="celebration-rays" opacity="0.75">
          <line x1="400" y1="285" x2="310" y2="180" stroke="#f59e0b" strokeWidth="4" strokeDasharray="6 6" />
          <line x1="400" y1="285" x2="490" y2="180" stroke="#f59e0b" strokeWidth="4" strokeDasharray="6 6" />
          <line x1="400" y1="285" x2="270" y2="285" stroke="#f59e0b" strokeWidth="4" strokeDasharray="6 6" />
          <line x1="400" y1="285" x2="530" y2="285" stroke="#f59e0b" strokeWidth="4" strokeDasharray="6 6" />
          <line x1="400" y1="285" x2="320" y2="380" stroke="#f59e0b" strokeWidth="4" strokeDasharray="6 6" />
          <line x1="400" y1="285" x2="480" y2="380" stroke="#f59e0b" strokeWidth="4" strokeDasharray="6 6" />
        </g>
      )}

      {/* THE ANIMAL ITSELF (Inside Chamber) */}
      <g id="trapped-animal-slot">{children}</g>

      {/* Outer Cage Wooden Frame Pillars */}
      {/* Left Pillar */}
      <rect x="224" y="130" width="28" height="300" rx="8" fill="#78350f" stroke="#451a03" strokeWidth="3" />
      <rect x="228" y="138" width="6" height="284" fill="#92400e" />
      {/* Left Pillar Top Cap */}
      <circle cx="238" cy="128" r="16" fill="#ca8a04" stroke="#78350f" strokeWidth="3" />

      {/* Right Pillar */}
      <rect x="548" y="130" width="28" height="300" rx="8" fill="#78350f" stroke="#451a03" strokeWidth="3" />
      <rect x="552" y="138" width="6" height="284" fill="#92400e" />
      {/* Right Pillar Top Cap */}
      <circle cx="562" cy="128" r="16" fill="#ca8a04" stroke="#78350f" strokeWidth="3" />

      {/* Top Arch Header */}
      <path
        d="M 220,140 Q 400,90 580,140 L 580,165 Q 400,115 220,165 Z"
        fill="#78350f"
        stroke="#451a03"
        strokeWidth="3"
      />
      <path
        d="M 240,143 Q 400,100 560,143 L 560,152 Q 400,109 240,152 Z"
        fill="#b45309"
      />

      {/* Sanctuary Sign Plaque */}
      <g id="sanctuary-sign" transform="translate(400, 105)">
        <rect x="-90" y="-14" width="180" height="28" rx="14" fill="#fef08a" stroke="#ca8a04" strokeWidth="2.5" />
        <text
          x="0"
          y="5"
          textAnchor="middle"
          fontSize="13"
          fontWeight="900"
          fill="#78350f"
          letterSpacing="1"
        >
          {isOpen ? '🎉 ĐÃ GIẢI CỨU! 🎉' : '🌿 LỒNG CỨU HỘ 🌿'}
        </text>
      </g>
    </g>
  );
};

// 3. DETAILED 3D METALLIC CHAIN SEGMENT (Real Interlocking Links)
interface ChainSegmentProps {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  numLinks?: number;
}

export const VectorChainSegment: React.FC<ChainSegmentProps> = ({
  x1,
  y1,
  x2,
  y2,
  numLinks = 8,
}) => {
  const dx = x2 - x1;
  const dy = y2 - y1;
  const angle = (Math.atan2(dy, dx) * 180) / Math.PI;
  const length = Math.sqrt(dx * dx + dy * dy);
  const step = length / numLinks;

  const links = [];
  for (let i = 0; i < numLinks; i++) {
    const isAlt = i % 2 === 1;
    const cx = step * (i + 0.5);
    links.push(
      <g key={i} transform={`translate(${cx}, 0)`}>
        {isAlt ? (
          // Link viewed head-on (thicker, rounded)
          <g>
            <ellipse cx="0" cy="0" rx="13" ry="8" fill="url(#metalGrad)" stroke="#1e293b" strokeWidth="2.5" />
            <ellipse cx="0" cy="0" rx="6" ry="3" fill="#334155" />
            {/* Highlight */}
            <path d="M -8 -3 Q 0 -6 8 -3" stroke="#ffffff" strokeWidth="1.5" strokeLinecap="round" fill="none" />
          </g>
        ) : (
          // Link viewed edge-on (narrow, elongated)
          <g>
            <rect x="-14" y="-5" width="28" height="10" rx="5" fill="url(#metalGrad)" stroke="#1e293b" strokeWidth="2.5" />
            <rect x="-8" y="-2" width="16" height="4" rx="2" fill="#0f172a" />
            {/* Specular Glint */}
            <line x1="-10" y1="-2.5" x2="6" y2="-2.5" stroke="#ffffff" strokeWidth="1.5" strokeLinecap="round" />
          </g>
        )}
      </g>
    );
  }

  return (
    <g transform={`translate(${x1}, ${y1}) rotate(${angle})`}>
      {links}
    </g>
  );
};

// 4. BIG INTERACTIVE GOLDEN PADLOCK WITH PULSE & NUMBER BADGE
interface GoldenPadlockProps {
  cx: number;
  cy: number;
  lockNumber: number;
  isUnlocked: boolean;
  label: string;
  onClick: () => void;
}

export const GoldenPadlock: React.FC<GoldenPadlockProps> = ({
  cx,
  cy,
  lockNumber,
  isUnlocked,
  label,
  onClick,
}) => {
  if (isUnlocked) {
    // Unlocked and open state
    return (
      <g transform={`translate(${cx}, ${cy})`} className="opacity-40 transition-opacity">
        {/* Shackle swung open */}
        <path
          d="M -12 -12 C -12 -28 12 -28 16 -16"
          stroke="url(#shackleGrad)"
          strokeWidth="6"
          strokeLinecap="round"
          fill="none"
        />
        {/* Unlocked Body */}
        <rect x="-24" y="-12" width="48" height="38" rx="8" fill="#15803d" stroke="#166534" strokeWidth="2.5" />
        <circle cx="0" cy="7" r="10" fill="#22c55e" />
        <text x="0" y="11" textAnchor="middle" fontSize="12" fontWeight="900" fill="#ffffff">
          ✓
        </text>
      </g>
    );
  }

  return (
    <g
      transform={`translate(${cx}, ${cy})`}
      onClick={onClick}
      className="cursor-pointer group select-none"
    >
      {/* Outer Pulse Beacon to attract child's finger/touch */}
      <circle
        cx="0"
        cy="6"
        r="38"
        fill="#fde047"
        opacity="0.35"
        className="animate-ping pointer-events-none"
        style={{ animationDuration: '2s' }}
      />
      <circle
        cx="0"
        cy="6"
        r="34"
        fill="#fde047"
        opacity="0.4"
        filter="url(#goldenPulse)"
      />

      {/* Shackle (U-bar inserted into body) */}
      <path
        d="M -14 -8 C -14 -28 14 -28 14 -8"
        stroke="url(#shackleGrad)"
        strokeWidth="7"
        strokeLinecap="round"
        fill="none"
      />

      {/* Solid Padlock Body (3D Gold with Rounded Corners) */}
      <rect
        x="-26"
        y="-8"
        width="52"
        height="44"
        rx="10"
        fill="url(#goldPadlockGrad)"
        stroke="#78350f"
        strokeWidth="3"
        className="group-hover:scale-110 transition-transform origin-center shadow-lg"
      />

      {/* Bevel Highlight */}
      <path
        d="M -20 -3 L 20 -3"
        stroke="#fef08a"
        strokeWidth="2.5"
        strokeLinecap="round"
      />

      {/* Keyhole Ring */}
      <circle cx="0" cy="14" r="11" fill="#78350f" />
      <circle cx="0" cy="14" r="9" fill="#1c1917" />
      {/* Keyhole Slot */}
      <path d="M -2.5 12 L 2.5 12 L 3.5 18 L -3.5 18 Z" fill="#fef08a" />

      {/* Prominent Number Badge (1, 2, or 3) */}
      <g transform="translate(0, -18)">
        <circle cx="0" cy="0" r="13" fill="#ef4444" stroke="#ffffff" strokeWidth="2.5" />
        <text
          x="0"
          y="4.5"
          textAnchor="middle"
          fontSize="13"
          fontWeight="900"
          fill="#ffffff"
        >
          {lockNumber}
        </text>
      </g>

      {/* Touch Tap Banner */}
      <g transform="translate(0, 48)">
        <rect
          x="-50"
          y="-10"
          width="100"
          height="20"
          rx="10"
          fill="#1e293b"
          stroke="#fde047"
          strokeWidth="1.5"
          opacity="0.95"
        />
        <text
          x="0"
          y="4"
          textAnchor="middle"
          fontSize="10"
          fontWeight="900"
          fill="#fde047"
        >
          {label}
        </text>
      </g>
    </g>
  );
};

// 5. THE 3 FULL COMPOSITE CHAINS (CHAIN 1: DIAGONAL LEFT, CHAIN 2: DIAGONAL RIGHT, CHAIN 3: HORIZONTAL)
interface RescueChainsOverlayProps {
  severed: boolean[]; // [chain1, chain2, chain3]
  onUnlockChain: (chainIndex: number) => void;
}

export const RescueChainsOverlay: React.FC<RescueChainsOverlayProps> = ({
  severed,
  onUnlockChain,
}) => {
  return (
    <g id="rescue-chains-overlay">
      {/* ============================================================= */}
      {/* CHAIN 1: DIAGONAL TOP-LEFT (240, 160) -> BOTTOM-RIGHT (560, 410) */}
      {/* ============================================================= */}
      {!severed[0] ? (
        <g id="chain-diagonal-1">
          {/* Left Segment: (240, 160) to Lock (360, 255) */}
          <VectorChainSegment x1={240} y1={160} x2={360} y2={255} numLinks={6} />
          {/* Right Segment: Lock (400, 285) to (560, 410) */}
          <VectorChainSegment x1={400} y1={285} x2={560} y2={410} numLinks={7} />
          {/* Padlock 1 */}
          <GoldenPadlock
            cx={380}
            cy={270}
            lockNumber={1}
            isUnlocked={false}
            label="MỞ XÍCH 1"
            onClick={() => onUnlockChain(0)}
          />
        </g>
      ) : (
        /* Snapped Chain Residue 1 */
        <g opacity="0.35">
          <VectorChainSegment x1={240} y1={160} x2={290} y2={220} numLinks={3} />
          <VectorChainSegment x1={510} y1={370} x2={560} y2={410} numLinks={3} />
        </g>
      )}

      {/* ============================================================= */}
      {/* CHAIN 2: DIAGONAL TOP-RIGHT (560, 160) -> BOTTOM-LEFT (240, 410) */}
      {/* ============================================================= */}
      {!severed[1] ? (
        <g id="chain-diagonal-2">
          {/* Right Segment: (560, 160) to Lock (440, 255) */}
          <VectorChainSegment x1={560} y1={160} x2={440} y2={255} numLinks={6} />
          {/* Left Segment: Lock (400, 285) to (240, 410) */}
          <VectorChainSegment x1={400} y1={285} x2={240} y2={410} numLinks={7} />
          {/* Padlock 2 */}
          <GoldenPadlock
            cx={420}
            cy={270}
            lockNumber={2}
            isUnlocked={false}
            label="MỞ XÍCH 2"
            onClick={() => onUnlockChain(1)}
          />
        </g>
      ) : (
        /* Snapped Chain Residue 2 */
        <g opacity="0.35">
          <VectorChainSegment x1={560} y1={160} x2={510} y2={220} numLinks={3} />
          <VectorChainSegment x1={290} y1={370} x2={240} y2={410} numLinks={3} />
        </g>
      )}

      {/* ============================================================= */}
      {/* CHAIN 3: HEAVY HORIZONTAL MIDDLE LOCK (230, 310) -> (570, 310)  */}
      {/* ============================================================= */}
      {!severed[2] ? (
        <g id="chain-horizontal-3">
          {/* Left Segment: (230, 310) to (370, 310) */}
          <VectorChainSegment x1={230} y1={310} x2={370} y2={310} numLinks={6} />
          {/* Right Segment: (430, 310) to (570, 310) */}
          <VectorChainSegment x1={430} y1={310} x2={570} y2={310} numLinks={6} />
          {/* Master Padlock 3 in Dead Center */}
          <GoldenPadlock
            cx={400}
            cy={310}
            lockNumber={3}
            isUnlocked={false}
            label="MỞ XÍCH 3"
            onClick={() => onUnlockChain(2)}
          />
        </g>
      ) : (
        /* Snapped Chain Residue 3 */
        <g opacity="0.35">
          <VectorChainSegment x1={230} y1={310} x2={280} y2={310} numLinks={2} />
          <VectorChainSegment x1={520} y1={310} x2={570} y2={310} numLinks={2} />
        </g>
      )}
    </g>
  );
};
