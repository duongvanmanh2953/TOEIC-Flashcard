import React from 'react';

/**
 * KidsViviUniverse.tsx
 * High-fidelity vector illustrations for LetStuN Kid Mode
 * Inspired by Pixar-style storybook & modern children's edtech design:
 * - Vivi the Fox (Mascot): Hero explorer with backpack, reader with headphones, sleeping on cloud
 * - Wooden signpost with 4 planks: Words, Listening, Speaking, Test
 * - Lesson cards: Beach crab, Restaurant plate, City bus, Panda bamboo
 * - Hot air balloon challenge banner
 */

// ============================================================================
// 1. VIVI HERO WITH BACKPACK & WOODEN SIGNPOST
// ============================================================================
export const ViviHeroAdventureScene: React.FC<{
  className?: string;
  onSignClick?: (destination: string) => void;
}> = ({ className = '', onSignClick }) => {
  return (
    <div className={`relative w-full h-full flex items-center justify-end select-none pointer-events-auto ${className}`}>
      <svg
        viewBox="0 0 520 280"
        className="w-full h-full object-contain"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          {/* Fairytale Castle & Mountain Gradients */}
          <linearGradient id="castleGrad" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#bae6fd" stopOpacity="0.8" />
            <stop offset="100%" stopColor="#7dd3fc" stopOpacity="0.4" />
          </linearGradient>
          <linearGradient id="hillsGrad" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#86efac" />
            <stop offset="100%" stopColor="#4ade80" />
          </linearGradient>

          {/* Fox Fur Gradients */}
          <radialGradient id="viviFur" cx="40%" cy="35%" r="65%">
            <stop offset="0%" stopColor="#fb923c" />
            <stop offset="70%" stopColor="#f97316" />
            <stop offset="100%" stopColor="#ea580c" />
          </radialGradient>
          <linearGradient id="viviCream" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#ffffff" />
            <stop offset="100%" stopColor="#fff7ed" />
          </linearGradient>

          {/* Wooden Signpost Gradients */}
          <linearGradient id="woodPost" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#9a3412" />
            <stop offset="50%" stopColor="#c2410c" />
            <stop offset="100%" stopColor="#7c2d12" />
          </linearGradient>
          <linearGradient id="plankWords" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#ea580c" />
            <stop offset="100%" stopColor="#c2410c" />
          </linearGradient>
          <linearGradient id="plankListen" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#f97316" />
            <stop offset="100%" stopColor="#ea580c" />
          </linearGradient>
          <linearGradient id="plankSpeak" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#fb923c" />
            <stop offset="100%" stopColor="#f97316" />
          </linearGradient>
          <linearGradient id="plankTest" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#d97706" />
            <stop offset="100%" stopColor="#b45309" />
          </linearGradient>

          {/* Soft Filter Shadow */}
          <filter id="softPlankShadow" x="-10%" y="-10%" width="120%" height="130%">
            <feDropShadow dx="0" dy="4" stdDeviation="3" floodColor="#7c2d12" floodOpacity="0.25" />
          </filter>
        </defs>

        {/* 1. DISTANT FAIRYTALE CASTLE ON HILL */}
        <g opacity="0.65" transform="translate(10, 30)">
          {/* Distant Hills */}
          <ellipse cx="140" cy="180" rx="110" ry="40" fill="url(#hillsGrad)" opacity="0.5" />
          {/* Main Castle Spire */}
          <rect x="126" y="90" width="28" height="60" fill="url(#castleGrad)" rx="2" />
          <polygon points="122,90 140,55 158,90" fill="#38bdf8" />
          {/* Small Spires */}
          <rect x="104" y="110" width="18" height="40" fill="url(#castleGrad)" rx="2" />
          <polygon points="100,110 113,85 126,110" fill="#38bdf8" />
          <rect x="158" y="105" width="20" height="45" fill="url(#castleGrad)" rx="2" />
          <polygon points="154,105 168,80 182,105" fill="#38bdf8" />
          {/* Castle Windows */}
          <rect x="136" y="105" width="8" height="14" rx="4" fill="#ffffff" opacity="0.8" />
          <rect x="110" y="122" width="6" height="10" rx="3" fill="#ffffff" opacity="0.8" />
          <rect x="165" y="118" width="6" height="10" rx="3" fill="#ffffff" opacity="0.8" />
        </g>

        {/* 2. WOODEN SIGNPOST (Right side) */}
        <g id="wooden-signpost" transform="translate(350, 20)">
          {/* Main vertical wooden pole */}
          <rect x="52" y="30" width="16" height="230" rx="5" fill="url(#woodPost)" />
          {/* Grass patches at base */}
          <path d="M40 255 Q50 240 60 255 Q70 238 80 255 Z" fill="#22c55e" />

          {/* Plank 1: Words */}
          <g
            className="cursor-pointer transition-transform hover:scale-105"
            onClick={() => onSignClick?.('words')}
            filter="url(#softPlankShadow)"
          >
            <path
              d="M10 38 L95 38 L112 56 L95 74 L10 74 Z"
              fill="url(#plankWords)"
              stroke="#7c2d12"
              strokeWidth="2.5"
            />
            {/* Wooden Nails */}
            <circle cx="56" cy="48" r="2.5" fill="#431407" />
            <circle cx="64" cy="64" r="2.5" fill="#431407" />
            <text x="50" y="61" fill="#ffffff" fontSize="16" fontWeight="900" fontFamily="sans-serif" textAnchor="middle">
              Words
            </text>
          </g>

          {/* Plank 2: Listening */}
          <g
            className="cursor-pointer transition-transform hover:scale-105"
            onClick={() => onSignClick?.('listening')}
            filter="url(#softPlankShadow)"
          >
            <path
              d="M110 90 L25 90 L8 108 L25 126 L110 126 Z"
              fill="url(#plankListen)"
              stroke="#7c2d12"
              strokeWidth="2.5"
            />
            <circle cx="56" cy="100" r="2.5" fill="#431407" />
            <circle cx="64" cy="116" r="2.5" fill="#431407" />
            <text x="60" y="113" fill="#ffffff" fontSize="15" fontWeight="900" fontFamily="sans-serif" textAnchor="middle">
              Listening
            </text>
          </g>

          {/* Plank 3: Speaking */}
          <g
            className="cursor-pointer transition-transform hover:scale-105"
            onClick={() => onSignClick?.('speaking')}
            filter="url(#softPlankShadow)"
          >
            <path
              d="M6 142 L95 142 L114 160 L95 178 L6 178 Z"
              fill="url(#plankSpeak)"
              stroke="#7c2d12"
              strokeWidth="2.5"
            />
            <circle cx="56" cy="152" r="2.5" fill="#431407" />
            <circle cx="64" cy="168" r="2.5" fill="#431407" />
            <text x="52" y="165" fill="#ffffff" fontSize="15" fontWeight="900" fontFamily="sans-serif" textAnchor="middle">
              Speaking
            </text>
          </g>

          {/* Plank 4: Test */}
          <g
            className="cursor-pointer transition-transform hover:scale-105"
            onClick={() => onSignClick?.('test')}
            filter="url(#softPlankShadow)"
          >
            <path
              d="M105 194 L22 194 L6 212 L22 230 L105 230 Z"
              fill="url(#plankTest)"
              stroke="#7c2d12"
              strokeWidth="2.5"
            />
            <circle cx="56" cy="204" r="2.5" fill="#431407" />
            <circle cx="64" cy="220" r="2.5" fill="#431407" />
            <text x="60" y="217" fill="#ffffff" fontSize="16" fontWeight="900" fontFamily="sans-serif" textAnchor="middle">
              Test
            </text>
          </g>
        </g>

        {/* 3. VIVI THE FOX MASCOT (Center / Foreground) */}
        <g id="vivi-mascot" transform="translate(240, 60)">
          {/* Shadow beneath Vivi */}
          <ellipse cx="60" cy="205" rx="45" ry="12" fill="#0f172a" fillOpacity="0.12" />

          {/* Backpack (Blue) */}
          <rect x="80" y="105" width="34" height="48" rx="14" fill="#0284c7" stroke="#0369a1" strokeWidth="2.5" />
          <rect x="84" y="112" width="26" height="20" rx="8" fill="#38bdf8" />
          {/* Backpack straps */}
          <path d="M82 110 C75 118, 70 135, 78 145" stroke="#0369a1" strokeWidth="4" strokeLinecap="round" />

          {/* Fluffy Tail */}
          <path
            d="M30 160 C5 160, -20 120, -5 95 C10 80, 25 110, 42 140 Z"
            fill="url(#viviFur)"
          />
          {/* White Tail Tip */}
          <path
            d="M-5 95 C-2 88, 5 85, 12 92 C9 105, 0 115, -5 95 Z"
            fill="#ffffff"
          />

          {/* Legs & Paws */}
          {/* Left Leg */}
          <ellipse cx="44" cy="186" rx="10" ry="18" fill="url(#viviFur)" />
          <ellipse cx="42" cy="198" rx="13" ry="8" fill="#ffffff" />
          {/* Right Leg */}
          <ellipse cx="76" cy="186" rx="10" ry="18" fill="url(#viviFur)" />
          <ellipse cx="78" cy="198" rx="13" ry="8" fill="#ffffff" />

          {/* Body */}
          <ellipse cx="60" cy="138" rx="28" ry="36" fill="url(#viviFur)" />
          {/* White Chest Fur */}
          <path
            d="M48 118 Q60 148 72 118 Q60 165 48 118 Z"
            fill="url(#viviCream)"
          />

          {/* Left Arm (Relaxed) */}
          <path d="M34 125 Q26 142 36 155" stroke="url(#viviFur)" strokeWidth="12" strokeLinecap="round" />
          <circle cx="36" cy="155" r="6" fill="#ffffff" />

          {/* Head */}
          <g transform="translate(0, 0)">
            {/* Left Ear */}
            <path
              d="M32 60 L14 16 C12 12, 18 8, 24 12 L50 48 Z"
              fill="url(#viviFur)"
            />
            {/* Left Ear Inner */}
            <path d="M30 52 L19 22 L42 45 Z" fill="#ffedd5" />

            {/* Right Ear */}
            <path
              d="M84 60 L104 16 C106 12, 100 8, 94 12 L68 48 Z"
              fill="url(#viviFur)"
            />
            {/* Right Ear Inner */}
            <path d="M86 52 L97 22 L74 45 Z" fill="#ffedd5" />

            {/* Head Sphere */}
            <circle cx="60" cy="68" r="34" fill="url(#viviFur)" />

            {/* Cheeks Fluff (White) */}
            <path
              d="M30 70 C24 82, 34 94, 46 94 C54 94, 60 88, 60 78 C60 88, 66 94, 74 94 C86 94, 96 82, 90 70 C96 64, 88 56, 80 62 C74 58, 66 58, 60 62 C54 58, 46 58, 40 62 C32 56, 24 64, 30 70 Z"
              fill="url(#viviCream)"
            />

            {/* Cute Fox Nose */}
            <path d="M56 74 Q60 71 64 74 Q60 79 56 74 Z" fill="#431407" />

            {/* Happy Open Smile */}
            <path d="M54 78 Q60 85 66 78" stroke="#431407" strokeWidth="2.5" strokeLinecap="round" fill="none" />
            <path d="M56 80 Q60 86 64 80 Z" fill="#f43f5e" />

            {/* Rosy Cheeks */}
            <circle cx="38" cy="74" r="5" fill="#fb7185" opacity="0.6" />
            <circle cx="82" cy="74" r="5" fill="#fb7185" opacity="0.6" />

            {/* Cheerful Cartoon Eyes */}
            {/* Left Eye */}
            <circle cx="48" cy="62" r="6" fill="#1e293b" />
            <circle cx="46" cy="60" r="2.2" fill="#ffffff" />
            <circle cx="50" cy="64" r="1.2" fill="#ffffff" />
            {/* Right Eye */}
            <circle cx="72" cy="62" r="6" fill="#1e293b" />
            <circle cx="70" cy="60" r="2.2" fill="#ffffff" />
            <circle cx="74" cy="64" r="1.2" fill="#ffffff" />

            {/* Forehead cute tuft */}
            <path d="M58 35 Q60 28 64 34 Q66 29 70 36 Z" fill="url(#viviFur)" />
          </g>

          {/* Right Arm (Waving enthusiastically at child) */}
          <g className="animate-wiggle origin-bottom-left">
            <path d="M84 122 C96 110, 108 96, 114 84" stroke="url(#viviFur)" strokeWidth="12" strokeLinecap="round" />
            <circle cx="114" cy="84" r="7" fill="#ffffff" />
            {/* Tiny paw pads */}
            <circle cx="114" cy="84" r="3" fill="#f43f5e" opacity="0.5" />
          </g>

          {/* Speech Bubble: "Let's learn!" */}
          <g transform="translate(-50, -10)">
            <rect x="0" y="0" width="82" height="34" rx="17" fill="#ffffff" stroke="#bae6fd" strokeWidth="2" filter="url(#softPlankShadow)" />
            {/* Bubble Tail pointing to Vivi's mouth */}
            <path d="M60 33 L66 42 L72 33 Z" fill="#ffffff" />
            <text x="41" y="22" fill="#0284c7" fontSize="13" fontWeight="900" fontFamily="sans-serif" textAnchor="middle">
              Let's learn!
            </text>
          </g>
        </g>
      </svg>
    </div>
  );
};

// ============================================================================
// 2. VIVI READING COMPANION WITH HEADPHONES (Sidebar Bottom Mascot)
// ============================================================================
export const ViviReadingCompanion: React.FC<{ className?: string }> = ({ className = '' }) => {
  return (
    <div className={`relative flex items-center justify-center select-none ${className}`}>
      <svg
        viewBox="0 0 160 160"
        className="w-full h-full object-contain"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <radialGradient id="viviReadFur" cx="40%" cy="35%" r="65%">
            <stop offset="0%" stopColor="#fb923c" />
            <stop offset="70%" stopColor="#f97316" />
            <stop offset="100%" stopColor="#ea580c" />
          </radialGradient>
        </defs>

        {/* Soft shadow */}
        <ellipse cx="80" cy="144" rx="55" ry="10" fill="#0f172a" fillOpacity="0.12" />

        {/* Fluffy tail on side */}
        <path d="M40 120 C15 120, 10 90, 25 80 C35 75, 42 100, 50 115 Z" fill="url(#viviReadFur)" />
        <path d="M25 80 C28 75, 34 76, 36 82 C32 90, 26 92, 25 80 Z" fill="#ffffff" />

        {/* Body seated */}
        <ellipse cx="80" cy="116" rx="32" ry="26" fill="url(#viviReadFur)" />
        {/* White chest */}
        <ellipse cx="80" cy="110" rx="16" ry="14" fill="#ffffff" />

        {/* Paws on floor holding the book */}
        <ellipse cx="56" cy="138" rx="12" ry="7" fill="#ffffff" />
        <ellipse cx="104" cy="138" rx="12" ry="7" fill="#ffffff" />

        {/* OPEN BLUE BOOK */}
        <g id="open-book" transform="translate(50, 105)">
          {/* Left page */}
          <path d="M30 16 L5 12 L2 34 L30 36 Z" fill="#ffffff" stroke="#0284c7" strokeWidth="2" />
          {/* Right page */}
          <path d="M30 16 L55 12 L58 34 L30 36 Z" fill="#ffffff" stroke="#0284c7" strokeWidth="2" />
          {/* Book Spine */}
          <line x1="30" y1="15" x2="30" y2="37" stroke="#0369a1" strokeWidth="3" strokeLinecap="round" />
          {/* Text lines */}
          <line x1="8" y1="18" x2="25" y2="19" stroke="#93c5fd" strokeWidth="2" strokeLinecap="round" />
          <line x1="8" y1="24" x2="23" y2="25" stroke="#93c5fd" strokeWidth="2" strokeLinecap="round" />
          <line x1="35" y1="19" x2="52" y2="18" stroke="#93c5fd" strokeWidth="2" strokeLinecap="round" />
          <line x1="35" y1="25" x2="50" y2="24" stroke="#93c5fd" strokeWidth="2" strokeLinecap="round" />
        </g>

        {/* Head */}
        <g id="vivi-read-head">
          {/* Ears */}
          <path d="M52 46 L36 12 C34 8, 40 5, 46 9 L68 38 Z" fill="url(#viviReadFur)" />
          <path d="M50 40 L40 18 L60 34 Z" fill="#ffedd5" />
          <path d="M108 46 L124 12 C126 8, 120 5, 114 9 L92 38 Z" fill="url(#viviReadFur)" />
          <path d="M110 40 L120 18 L100 34 Z" fill="#ffedd5" />

          {/* Head sphere */}
          <circle cx="80" cy="56" r="32" fill="url(#viviReadFur)" />

          {/* White cheeks */}
          <path
            d="M50 58 C46 68, 54 80, 68 80 C74 80, 80 74, 80 66 C80 74, 86 80, 92 80 C106 80, 114 68, 110 58 C116 52, 108 44, 100 50 C94 46, 86 46, 80 50 C74 46, 66 46, 60 50 C52 44, 44 52, 50 58 Z"
            fill="#ffffff"
          />

          {/* Snout & smile */}
          <path d="M76 62 Q80 59 84 62 Q80 67 76 62 Z" fill="#431407" />
          <path d="M75 66 Q80 72 85 66" stroke="#431407" strokeWidth="2" strokeLinecap="round" fill="none" />
          <circle cx="62" cy="62" r="4.5" fill="#fb7185" opacity="0.6" />
          <circle cx="98" cy="62" r="4.5" fill="#fb7185" opacity="0.6" />

          {/* Big Sparkly Eyes */}
          <ellipse cx="68" cy="52" rx="5.5" ry="6" fill="#1e293b" />
          <circle cx="66.5" cy="50" r="2" fill="#ffffff" />
          <circle cx="70" cy="54" r="1" fill="#ffffff" />
          <ellipse cx="92" cy="52" rx="5.5" ry="6" fill="#1e293b" />
          <circle cx="90.5" cy="50" r="2" fill="#ffffff" />
          <circle cx="94" cy="54" r="1" fill="#ffffff" />

          {/* BLUE STEREO HEADPHONES */}
          {/* Headband */}
          <path d="M46 54 C46 26, 114 26, 114 54" stroke="#0284c7" strokeWidth="6" strokeLinecap="round" fill="none" />
          <path d="M50 54 C50 30, 110 30, 110 54" stroke="#38bdf8" strokeWidth="2.5" strokeLinecap="round" fill="none" />
          {/* Ear Cushion Left */}
          <rect x="38" y="44" width="14" height="24" rx="7" fill="#0369a1" stroke="#0284c7" strokeWidth="2" />
          <rect x="42" y="48" width="6" height="16" rx="3" fill="#38bdf8" />
          {/* Ear Cushion Right */}
          <rect x="108" y="44" width="14" height="24" rx="7" fill="#0369a1" stroke="#0284c7" strokeWidth="2" />
          <rect x="112" y="48" width="6" height="16" rx="3" fill="#38bdf8" />
        </g>
      </svg>
    </div>
  );
};

// ============================================================================
// 3. VIVI SLEEPING ON A CLOUD (Right Dashboard Top Card)
// ============================================================================
export const ViviSleepingCloudScene: React.FC<{ className?: string }> = ({ className = '' }) => {
  return (
    <div className={`relative w-full h-full flex items-center justify-center select-none ${className}`}>
      <svg
        viewBox="0 0 220 120"
        className="w-full h-full object-contain"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <linearGradient id="cloudGrad" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#ffffff" />
            <stop offset="100%" stopColor="#f0f9ff" />
          </linearGradient>
          <radialGradient id="viviSleepFur" cx="40%" cy="35%" r="65%">
            <stop offset="0%" stopColor="#fb923c" />
            <stop offset="70%" stopColor="#f97316" />
            <stop offset="100%" stopColor="#ea580c" />
          </radialGradient>
        </defs>

        {/* 1. FLUFFY DREAM CLOUD */}
        <g id="cloud-base" transform="translate(10, 45)">
          <path
            d="M30 45 C15 45, 5 35, 10 20 C15 8, 30 10, 38 15 C45 2, 70 -5, 90 8 C105 -4, 135 -2, 145 15 C160 5, 185 10, 190 25 C195 40, 180 50, 165 48 C155 52, 45 52, 30 45 Z"
            fill="url(#cloudGrad)"
            stroke="#e0f2fe"
            strokeWidth="2"
          />
        </g>

        {/* 2. VIVI SLEEPING PEACEFULLY */}
        <g id="vivi-sleep" transform="translate(60, 20)">
          {/* Curled Body */}
          <ellipse cx="48" cy="46" rx="34" ry="22" fill="url(#viviSleepFur)" />

          {/* Curled Fluffy Tail over body */}
          <path d="M18 48 C10 40, 15 25, 30 24 C45 22, 60 32, 68 40 Z" fill="url(#viviSleepFur)" />
          <path d="M16 42 C14 36, 18 28, 26 27 C24 35, 20 40, 16 42 Z" fill="#ffffff" />

          {/* Sleeping Head */}
          <circle cx="72" cy="42" r="20" fill="url(#viviSleepFur)" />
          {/* White cheek */}
          <ellipse cx="78" cy="48" rx="12" ry="8" fill="#ffffff" />

          {/* Sleepy Closed Eye (Happy curved arc ^) */}
          <path d="M66 40 Q71 35 76 40" stroke="#431407" strokeWidth="2.5" strokeLinecap="round" fill="none" />
          {/* Nose & gentle smile */}
          <circle cx="82" cy="46" r="2.5" fill="#431407" />
          <path d="M78 50 Q82 54 85 50" stroke="#431407" strokeWidth="1.8" strokeLinecap="round" fill="none" />
          {/* Rosy Cheek */}
          <circle cx="72" cy="48" r="3.5" fill="#fb7185" opacity="0.6" />

          {/* Folded Ears */}
          <path d="M58 26 L50 8 C48 5, 54 4, 58 7 L68 24 Z" fill="url(#viviSleepFur)" />
          <path d="M56 22 L52 12 L62 20 Z" fill="#ffedd5" />

          {/* Sleepy Nightcap (Blue with white pompom) */}
          <path d="M62 26 Q74 15 85 24 Q78 30 64 30 Z" fill="#0284c7" />
          <path d="M85 24 C95 28, 102 42, 98 48" stroke="#0284c7" strokeWidth="5" strokeLinecap="round" fill="none" />
          <circle cx="98" cy="48" r="4.5" fill="#ffffff" />
        </g>

        {/* 3. FLOATING DREAM SPARKLES & STARS */}
        <g id="dream-stars" opacity="0.8">
          <circle cx="35" cy="25" r="2.5" fill="#facc15" />
          <path d="M48 15 L50 20 L55 22 L50 24 L48 29 L46 24 L41 22 L46 20 Z" fill="#facc15" />
          <circle cx="185" cy="30" r="2" fill="#38bdf8" />
          <path d="M175 16 L177 20 L181 21 L177 22 L175 26 L173 22 L169 21 L173 20 Z" fill="#facc15" />
        </g>
      </svg>
    </div>
  );
};

// ============================================================================
// 4. LESSON CARDS ILLUSTRATIONS (At the Beach, Restaurant, Bus, Panda)
// ============================================================================

// A. Beach & Crab
export const IllustrationBeachCrab: React.FC<{ className?: string }> = ({ className = 'w-full h-full' }) => (
  <svg viewBox="0 0 200 120" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
    {/* Sky & Ocean */}
    <rect width="200" height="120" rx="16" fill="#e0f2fe" />
    <path d="M0 60 C50 55, 150 65, 200 60 L200 120 L0 120 Z" fill="#7dd3fc" />
    {/* Sandy Shore */}
    <path d="M0 78 C70 70, 130 85, 200 75 L200 120 L0 120 Z" fill="#fde68a" />
    {/* Palm Tree Left */}
    <path d="M15 85 C18 60, 28 40, 22 20" stroke="#a16207" strokeWidth="5" strokeLinecap="round" />
    {/* Palm Leaves */}
    <path d="M22 20 C10 16, 2 24, 0 30" stroke="#16a34a" strokeWidth="4" strokeLinecap="round" />
    <path d="M22 20 C24 8, 36 10, 42 16" stroke="#16a34a" strokeWidth="4" strokeLinecap="round" />
    <path d="M22 20 C12 6, 20 -2, 26 2" stroke="#22c55e" strokeWidth="4" strokeLinecap="round" />
    {/* Happy Red Crab */}
    <g transform="translate(110, 68)">
      <ellipse cx="25" cy="18" rx="18" ry="12" fill="#ef4444" />
      {/* Crab Eyes */}
      <circle cx="18" cy="8" r="4" fill="#ffffff" stroke="#b91c1c" strokeWidth="1.5" />
      <circle cx="19" cy="8" r="2" fill="#1e293b" />
      <circle cx="32" cy="8" r="4" fill="#ffffff" stroke="#b91c1c" strokeWidth="1.5" />
      <circle cx="31" cy="8" r="2" fill="#1e293b" />
      {/* Crab Smile */}
      <path d="M20 19 Q25 24 30 19" stroke="#7f1d1d" strokeWidth="2" strokeLinecap="round" fill="none" />
      {/* Claws */}
      <path d="M8 12 Q-2 6 2 0 Q10 4 10 10" stroke="#ef4444" strokeWidth="4" strokeLinecap="round" fill="none" />
      <path d="M42 12 Q52 6 48 0 Q40 4 40 10" stroke="#ef4444" strokeWidth="4" strokeLinecap="round" fill="none" />
    </g>
  </svg>
);

// B. Restaurant Breakfast Plate
export const IllustrationRestaurantPlate: React.FC<{ className?: string }> = ({ className = 'w-full h-full' }) => (
  <svg viewBox="0 0 200 120" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect width="200" height="120" rx="16" fill="#fff7ed" />
    {/* Checkered Tablecloth Detail */}
    <path d="M0 90 L200 90" stroke="#ffedd5" strokeWidth="12" strokeDasharray="16 16" />
    {/* Ceramic White Plate */}
    <ellipse cx="100" cy="62" rx="64" ry="42" fill="#ffffff" stroke="#fed7aa" strokeWidth="3" />
    <ellipse cx="100" cy="62" rx="52" ry="34" fill="#fffbf5" />
    {/* Sunny Side Up Egg 1 */}
    <ellipse cx="82" cy="58" rx="20" ry="16" fill="#ffffff" stroke="#f1f5f9" strokeWidth="1.5" />
    <circle cx="82" cy="58" r="8" fill="#f59e0b" />
    <circle cx="80" cy="56" r="2.5" fill="#fef08a" />
    {/* Sunny Side Up Egg 2 */}
    <ellipse cx="114" cy="66" rx="18" ry="14" fill="#ffffff" stroke="#f1f5f9" strokeWidth="1.5" />
    <circle cx="114" cy="66" r="7" fill="#f59e0b" />
    {/* Fresh Tomatoes / Strawberries */}
    <circle cx="130" cy="52" r="8" fill="#ef4444" />
    <circle cx="120" cy="46" r="7" fill="#ef4444" />
    {/* Green Salad Leaves */}
    <path d="M62 60 C58 50, 68 44, 76 50 Z" fill="#22c55e" />
    <path d="M68 68 C60 62, 64 54, 74 60 Z" fill="#16a34a" />
    {/* Fork on Left, Spoon on Right */}
    <path d="M24 45 L24 80" stroke="#94a3b8" strokeWidth="3" strokeLinecap="round" />
    <path d="M20 45 L20 54 M24 45 L24 54 M28 45 L28 54" stroke="#94a3b8" strokeWidth="2" strokeLinecap="round" />
    <path d="M176 45 L176 80" stroke="#94a3b8" strokeWidth="3" strokeLinecap="round" />
    <ellipse cx="176" cy="48" rx="6" ry="9" fill="#cbd5e1" stroke="#94a3b8" strokeWidth="2" />
  </svg>
);

// C. Blue School Bus & Town
export const IllustrationGrammarBus: React.FC<{ className?: string }> = ({ className = 'w-full h-full' }) => (
  <svg viewBox="0 0 200 120" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect width="200" height="120" rx="16" fill="#f0f9ff" />
    {/* City Skyline Silhouette */}
    <rect x="25" y="35" width="24" height="50" rx="2" fill="#bae6fd" opacity="0.6" />
    <rect x="55" y="25" width="30" height="60" rx="2" fill="#7dd3fc" opacity="0.6" />
    <rect x="95" y="40" width="22" height="45" rx="2" fill="#bae6fd" opacity="0.6" />
    <rect x="125" y="28" width="34" height="57" rx="2" fill="#7dd3fc" opacity="0.6" />
    {/* Road */}
    <rect x="0" y="85" width="200" height="35" fill="#94a3b8" />
    <line x1="10" y1="102" x2="190" y2="102" stroke="#ffffff" strokeWidth="3" strokeDasharray="14 12" />
    {/* Cheerful Blue Bus */}
    <g transform="translate(60, 52)">
      {/* Bus Body */}
      <rect x="0" y="0" width="82" height="40" rx="10" fill="#0284c7" />
      <rect x="2" y="16" width="78" height="6" fill="#ffffff" opacity="0.8" />
      {/* Bus Windows */}
      <rect x="8" y="5" width="16" height="12" rx="3" fill="#e0f2fe" />
      <rect x="28" y="5" width="16" height="12" rx="3" fill="#e0f2fe" />
      <rect x="48" y="5" width="16" height="12" rx="3" fill="#e0f2fe" />
      <rect x="68" y="5" width="10" height="12" rx="2" fill="#e0f2fe" />
      {/* Front Headlight */}
      <circle cx="78" cy="28" r="3" fill="#facc15" />
      {/* Wheels */}
      <circle cx="20" cy="40" r="9" fill="#1e293b" />
      <circle cx="20" cy="40" r="4" fill="#94a3b8" />
      <circle cx="64" cy="40" r="9" fill="#1e293b" />
      <circle cx="64" cy="40" r="4" fill="#94a3b8" />
    </g>
  </svg>
);

// D. Cute Panda in Bamboo (Animals)
export const IllustrationPandaBamboo: React.FC<{ className?: string }> = ({ className = 'w-full h-full' }) => (
  <svg viewBox="0 0 200 120" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect width="200" height="120" rx="16" fill="#f0fdf4" />
    {/* Bamboo Stalks */}
    <g stroke="#16a34a" strokeWidth="6" strokeLinecap="round">
      <line x1="20" y1="10" x2="20" y2="110" />
      <line x1="40" y1="5" x2="40" y2="110" />
      <line x1="165" y1="10" x2="165" y2="110" />
      <line x1="185" y1="15" x2="185" y2="110" />
    </g>
    {/* Bamboo Leaves */}
    <path d="M20 30 Q35 22 45 28" stroke="#22c55e" strokeWidth="3" strokeLinecap="round" fill="none" />
    <path d="M165 40 Q150 32 140 38" stroke="#22c55e" strokeWidth="3" strokeLinecap="round" fill="none" />

    {/* Fluffy Panda (Center) */}
    <g transform="translate(75, 30)">
      {/* Body */}
      <ellipse cx="26" cy="56" rx="22" ry="20" fill="#ffffff" stroke="#1e293b" strokeWidth="2" />
      {/* Dark Arms */}
      <ellipse cx="6" cy="52" rx="7" ry="14" fill="#1e293b" transform="rotate(-15 6 52)" />
      <ellipse cx="46" cy="52" rx="7" ry="14" fill="#1e293b" transform="rotate(15 46 52)" />
      {/* Paws */}
      <ellipse cx="14" cy="74" rx="8" ry="6" fill="#1e293b" />
      <ellipse cx="38" cy="74" rx="8" ry="6" fill="#1e293b" />

      {/* Ears */}
      <circle cx="10" cy="14" r="8" fill="#1e293b" />
      <circle cx="42" cy="14" r="8" fill="#1e293b" />

      {/* Head */}
      <circle cx="26" cy="28" r="22" fill="#ffffff" stroke="#e2e8f0" strokeWidth="1" />

      {/* Eye Patches */}
      <ellipse cx="17" cy="27" rx="6" ry="8" fill="#1e293b" transform="rotate(-15 17 27)" />
      <ellipse cx="35" cy="27" rx="6" ry="8" fill="#1e293b" transform="rotate(15 35 27)" />
      {/* White glint inside eyes */}
      <circle cx="18" cy="26" r="2" fill="#ffffff" />
      <circle cx="34" cy="26" r="2" fill="#ffffff" />

      {/* Nose & Smile */}
      <ellipse cx="26" cy="34" rx="3.5" ry="2.5" fill="#1e293b" />
      <path d="M22 37 Q26 41 30 37" stroke="#1e293b" strokeWidth="1.8" strokeLinecap="round" fill="none" />
      <circle cx="12" cy="36" r="3" fill="#fb7185" opacity="0.6" />
      <circle cx="40" cy="36" r="3" fill="#fb7185" opacity="0.6" />
    </g>
  </svg>
);

// E. Hot Air Balloon
export const IllustrationHotAirBalloon: React.FC<{ className?: string }> = ({ className = 'w-16 h-16' }) => (
  <svg viewBox="0 0 100 120" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
    {/* Balloon Body */}
    <defs>
      <linearGradient id="balloonStripe1" x1="0%" y1="0%" x2="100%" y2="0%">
        <stop offset="0%" stopColor="#f59e0b" />
        <stop offset="50%" stopColor="#ef4444" />
        <stop offset="100%" stopColor="#f59e0b" />
      </linearGradient>
    </defs>
    {/* Main Balloon Envelope */}
    <path
      d="M50 8 C25 8, 12 28, 16 52 C20 70, 38 85, 42 90 L58 90 C62 85, 80 70, 84 52 C88 28, 75 8, 50 8 Z"
      fill="url(#balloonStripe1)"
    />
    {/* Stripes */}
    <path
      d="M50 8 C40 8, 34 32, 38 58 C42 74, 46 88, 48 90 L52 90 C54 88, 58 74, 62 58 C66 32, 60 8, 50 8 Z"
      fill="#fef08a"
    />
    <path
      d="M50 8 C46 8, 44 32, 46 58 C48 74, 49 88, 50 90 L50 90 C51 88, 52 74, 54 58 C56 32, 54 8, 50 8 Z"
      fill="#38bdf8"
    />

    {/* Ropes */}
    <line x1="42" y1="90" x2="44" y2="102" stroke="#78350f" strokeWidth="1.5" />
    <line x1="58" y1="90" x2="56" y2="102" stroke="#78350f" strokeWidth="1.5" />

    {/* Wicker Basket */}
    <rect x="42" y="102" width="16" height="12" rx="3" fill="#b45309" stroke="#78350f" strokeWidth="1.5" />
  </svg>
);
