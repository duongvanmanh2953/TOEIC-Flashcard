import React, { useMemo } from 'react';

export type ArenaBackgroundTheme = 'business' | 'science' | 'travel' | 'nature' | 'esports';

interface ArenaDynamicBackgroundProps {
  theme?: ArenaBackgroundTheme;
  category?: string;
  languageId?: string;
  difficulty?: string;
  gameState?: string;
  className?: string;
  showHoloGamepad?: boolean;
}

export const ArenaDynamicBackground: React.FC<ArenaDynamicBackgroundProps> = ({
  theme,
  category = '',
  languageId = '',
  gameState = 'IN_ROUND',
  className = '',
  showHoloGamepad = false,
}) => {
  // Auto-resolve theme if not explicitly forced
  const resolvedTheme: ArenaBackgroundTheme = useMemo(() => {
    if (theme) return theme;
    const cat = category.toLowerCase();
    if (cat.includes('business') || cat.includes('toeic') || cat.includes('work') || cat.includes('finance')) {
      return 'business';
    }
    if (cat.includes('science') || cat.includes('tech') || cat.includes('academic') || cat.includes('stem')) {
      return 'science';
    }
    if (cat.includes('travel') || cat.includes('culture') || cat.includes('world') || cat.includes('country')) {
      return 'travel';
    }
    if (cat.includes('nature') || cat.includes('animal') || cat.includes('environment') || cat.includes('life')) {
      return 'nature';
    }
    return 'esports';
  }, [theme, category]);

  return (
    <div
      aria-hidden="true"
      className={`fixed inset-0 pointer-events-none overflow-hidden select-none z-0 bg-[#060918] ${className}`}
      data-theme={resolvedTheme}
    >
      {/* ======================================================== */}
      {/* 0. PURE GENERATIVE CYBER STADIUM BACKDROP (CSS/SVG)      */}
      {/* ======================================================== */}
      {/* 0. Primary High-Res Cyberpunk Stadium Backdrop with Graceful Fallback */}
      <img
        src="/game-assets/arena/arena-stage-cyberpunk.jpg"
        alt=""
        className="arena-stage-cyberpunk cyberpunk absolute inset-0 w-full h-full object-cover object-bottom opacity-50 mix-blend-screen scale-105 pointer-events-none filter contrast-125 brightness-100"
        onError={(e) => {
          (e.currentTarget as HTMLElement).style.display = 'none';
        }}
      />

      {/* Flat system-colored stadium backdrop */}
      <div className="absolute inset-0 bg-[#0b1029]" />

      {/* Overhead Arena Trusses & Light Rigs */}
      <svg
        className="absolute top-0 inset-x-0 w-full h-48 opacity-25"
        preserveAspectRatio="none"
        viewBox="0 0 1200 200"
      >
        <defs>
        </defs>
        {/* Overhead scaffolding beams */}
        <line x1="0" y1="20" x2="1200" y2="20" stroke="#818CF8" strokeOpacity="0.8" strokeWidth="3" />
        <line x1="0" y1="50" x2="1200" y2="50" stroke="#4F46E5" strokeOpacity="0.55" strokeWidth="2" />
        {/* Diagonal struts */}
        {Array.from({ length: 24 }).map((_, i) => (
          <line
            key={i}
            x1={i * 50}
            y1="20"
            x2={(i + 1) * 50}
            y2="50"
            stroke="#6366F1"
            strokeOpacity="0.5"
            strokeWidth="1.5"
          />
        ))}
        {Array.from({ length: 24 }).map((_, i) => (
          <line
            key={`rev-${i}`}
            x1={(i + 1) * 50}
            y1="20"
            x2={i * 50}
            y2="50"
            stroke="#6366F1"
            strokeOpacity="0.5"
            strokeWidth="1.5"
          />
        ))}
      </svg>

      {/* 1. Volumetric Overhead Spotlights & Atmospheric Glow */}
      <div className="absolute -top-20 left-1/2 -translate-x-1/2 w-[80vw] max-w-4xl h-72 bg-indigo-500/10 blur-3xl pointer-events-none" />
      <div className="absolute -top-10 left-10 w-80 h-80 bg-purple-600/20 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute -top-10 right-10 w-80 h-80 bg-cyan-500/20 rounded-full blur-[120px] pointer-events-none" />

      {/* 2. Central Holographic Gamepad Watermark */}
      {showHoloGamepad && (
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 opacity-15 pointer-events-none filter drop-shadow-[0_0_30px_rgba(148,122,255,0.4)]">
          <svg width="280" height="200" viewBox="0 0 24 24" fill="none" stroke="#947AFF" strokeWidth="1.5">
            <rect x="2" y="6" width="20" height="12" rx="6" />
            <path d="M6 12h4m-2-2v4m10-2h.01m-2-2h.01m2 4h.01" strokeWidth="2" strokeLinecap="round" />
            <polygon points="10 9 15 12 10 15" fill="#947AFF" opacity="0.6" />
          </svg>
        </div>
      )}

      {/* 3. Theme Specific Ambient Accents */}
      {/* Flat background accents use the selected theme's base colors. */}

      {/* 5. Glowing Floor Arena Ring (Concentric Stage Floor) */}
      <div className="absolute -bottom-24 left-1/2 -translate-x-1/2 w-[120vw] max-w-5xl h-64 rounded-[100%] border-4 border-cyan-400/40 shadow-[0_0_60px_rgba(6,182,212,0.5),inset_0_0_60px_rgba(6,182,212,0.3)] bg-indigo-950/40 pointer-events-none">
        <div className="absolute inset-4 rounded-[100%] border-2 border-indigo-500/50" />
        <div className="absolute inset-10 rounded-[100%] border border-cyan-300/30" />
      </div>

      {/* 6. Crowd Silhouette along bottom edge */}
      <div className="absolute bottom-0 inset-x-0 h-24 bg-[#060812]/90 pointer-events-none" />

      {/* 7. Dynamic flash feedback on round evaluation */}
      {gameState === 'ROUND_OVER' && (
        <div className="absolute inset-0 bg-emerald-500/10 transition-opacity duration-500 pointer-events-none" />
      )}
    </div>
  );
};
