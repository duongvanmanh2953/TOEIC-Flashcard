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

      {/* Dark stadium dome gradient */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-[#17204d] via-[#0b1029] to-[#040612]" />

      {/* Overhead Arena Trusses & Light Rigs */}
      <svg
        className="absolute top-0 inset-x-0 w-full h-48 opacity-25"
        preserveAspectRatio="none"
        viewBox="0 0 1200 200"
      >
        <defs>
          <linearGradient id="trussGrad" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#818CF8" stopOpacity="0.8" />
            <stop offset="100%" stopColor="#4F46E5" stopOpacity="0.0" />
          </linearGradient>
        </defs>
        {/* Overhead scaffolding beams */}
        <line x1="0" y1="20" x2="1200" y2="20" stroke="url(#trussGrad)" strokeWidth="3" />
        <line x1="0" y1="50" x2="1200" y2="50" stroke="url(#trussGrad)" strokeWidth="2" />
        {/* Diagonal struts */}
        {Array.from({ length: 24 }).map((_, i) => (
          <line
            key={i}
            x1={i * 50}
            y1="20"
            x2={(i + 1) * 50}
            y2="50"
            stroke="url(#trussGrad)"
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
            stroke="url(#trussGrad)"
            strokeWidth="1.5"
          />
        ))}
      </svg>

      {/* 1. Volumetric Overhead Spotlights & Atmospheric Glow */}
      <div className="absolute -top-20 left-1/2 -translate-x-1/2 w-[80vw] max-w-4xl h-72 bg-gradient-to-b from-indigo-500/25 via-cyan-500/10 to-transparent blur-3xl pointer-events-none" />
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
      {resolvedTheme === 'business' && (
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#2041F610_1px,transparent_1px),linear-gradient(to_bottom,#2041F610_1px,transparent_1px)] bg-[size:48px_48px] opacity-60" />
      )}

      {resolvedTheme === 'science' && (
        <div className="absolute inset-0 bg-[radial-gradient(#25C98A20_1px,transparent_1px)] bg-[size:32px_32px] opacity-60" />
      )}

      {/* 4. Glowing Perspective Arena Grid Floor */}
      <div className="absolute inset-x-0 bottom-0 h-64 bg-[linear-gradient(to_right,rgba(99,102,241,0.08)_1px,transparent_1px),linear-gradient(to_bottom,rgba(99,102,241,0.08)_1px,transparent_1px)] bg-[size:36px_36px] [mask-image:radial-gradient(ellipse_at_bottom,black_40%,transparent_90%)]" />

      {/* 5. Glowing Floor Arena Ring (Concentric Stage Floor) */}
      <div className="absolute -bottom-24 left-1/2 -translate-x-1/2 w-[120vw] max-w-5xl h-64 rounded-[100%] border-4 border-cyan-400/40 shadow-[0_0_60px_rgba(6,182,212,0.5),inset_0_0_60px_rgba(6,182,212,0.3)] bg-gradient-to-t from-indigo-950/60 via-purple-900/20 to-transparent pointer-events-none">
        <div className="absolute inset-4 rounded-[100%] border-2 border-indigo-500/50" />
        <div className="absolute inset-10 rounded-[100%] border border-cyan-300/30" />
      </div>

      {/* 6. Crowd Silhouette along bottom edge */}
      <div className="absolute bottom-0 inset-x-0 h-24 bg-gradient-to-t from-[#060812] via-[#060812]/90 to-transparent pointer-events-none" />

      {/* 7. Dynamic flash feedback on round evaluation */}
      {gameState === 'ROUND_OVER' && (
        <div className="absolute inset-0 bg-emerald-500/10 transition-opacity duration-500 pointer-events-none" />
      )}
    </div>
  );
};
