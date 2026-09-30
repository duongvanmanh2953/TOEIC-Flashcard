import React, { useEffect } from 'react';
import { soundManager } from '../services/sound/KidsSoundManager';

export type ExplosionType = 'bubble' | 'star' | 'fruit' | 'balloon' | 'chest_burst' | 'lock_break';

interface KidsExplosionFXProps {
  type: ExplosionType;
  fruitName?: string;
  className?: string;
  onDone?: () => void;
}

export const KidsExplosionFX: React.FC<KidsExplosionFXProps> = ({
  type,
  fruitName = 'apple',
  className = '',
  onDone,
}) => {
  useEffect(() => {
    // Trigger authentic Web Audio sound effect
    if (type === 'bubble') soundManager.play('bubble_burst');
    else if (type === 'star') soundManager.play('star_burst');
    else if (type === 'fruit') soundManager.play('fruit_pop');
    else if (type === 'balloon') soundManager.play('pop');
    else if (type === 'chest_burst') soundManager.play('coin_clink');
    else if (type === 'lock_break') soundManager.play('robot_snap');

    const timer = setTimeout(() => {
      onDone?.();
    }, 700);
    return () => clearTimeout(timer);
  }, [type, onDone]);

  // =========================================================================
  // 1. SOAP BUBBLE MULTI-PIECE SHATTER (6 Curved Membrane Shards + 8 Droplets)
  // =========================================================================
  if (type === 'bubble') {
    // 6 distinct curved bubble membrane shards
    const bubbleShards = [
      { clip: 'polygon(50% 0%, 100% 20%, 80% 80%, 20% 60%)', tx: -55, ty: -50, rot: -75, scale: 0.9 },
      { clip: 'polygon(20% 0%, 90% 10%, 100% 85%, 40% 95%)', tx: 60, ty: -55, rot: 80, scale: 0.85 },
      { clip: 'polygon(0% 25%, 85% 0%, 100% 65%, 15% 90%)', tx: 75, ty: 25, rot: 130, scale: 0.95 },
      { clip: 'polygon(30% 10%, 100% 40%, 75% 100%, 0% 80%)', tx: 40, ty: 70, rot: 170, scale: 0.8 },
      { clip: 'polygon(10% 0%, 80% 30%, 90% 100%, 10% 70%)', tx: -50, ty: 65, rot: -140, scale: 0.88 },
      { clip: 'polygon(0% 10%, 75% 0%, 95% 75%, 25% 100%)', tx: -75, ty: 10, rot: -90, scale: 0.9 },
    ];

    const droplets = [0, 45, 90, 135, 180, 225, 270, 315];

    return (
      <div className={`absolute inset-0 flex items-center justify-center pointer-events-none z-40 ${className}`}>
        {/* Shockwave expanding ring */}
        <div className="absolute w-24 h-24 rounded-full border-2 border-sky-300/90 animate-ping opacity-70" />

        {/* Comic POP Badge */}
        <div className="absolute -top-4 animate-star-burst-explode select-none">
          <span className="px-3 py-1 rounded-full bg-gradient-to-r from-sky-500 to-cyan-500 text-white text-xs font-black uppercase tracking-wider shadow-md">
            PÓC! 🫧
          </span>
        </div>

        {/* 6 Real Membrane Fragments Flying Out */}
        {bubbleShards.map((s, idx) => (
          <div
            key={`shard-${idx}`}
            className="absolute w-8 h-8 bg-gradient-to-br from-white/90 via-sky-200/80 to-cyan-400/50 backdrop-blur-xs border border-white/70 shadow-xs animate-fragment-scatter"
            style={
              {
                clipPath: s.clip,
                '--tx': `${s.tx}px`,
                '--ty': `${s.ty}px`,
                '--rot': `${s.rot}deg`,
                '--scale-end': `${s.scale * 0.2}`,
                animationDelay: `${idx * 0.015}s`,
              } as React.CSSProperties
            }
          />
        ))}

        {/* 8 Soap droplets */}
        {droplets.map((angle, idx) => {
          const rad = (angle * Math.PI) / 180;
          const dist = 50 + (idx % 2) * 16;
          const tx = Math.cos(rad) * dist;
          const ty = Math.sin(rad) * dist;
          return (
            <div
              key={`drop-${idx}`}
              className="absolute w-3 h-3 rounded-full bg-gradient-to-tr from-sky-300 via-cyan-100 to-white border border-sky-400/80 shadow-xs animate-particle-fly"
              style={
                {
                  '--tx': `${tx}px`,
                  '--ty': `${ty}px`,
                  '--scale-end': '0.1',
                  '--rot': `${angle}deg`,
                  animationDelay: `${idx * 0.02}s`,
                } as React.CSSProperties
              }
            />
          );
        })}
      </div>
    );
  }

  // =========================================================================
  // 2. BALLOON RUBBER TEARING & SHATTER (6 Jagged Strips + Rubber Knot)
  // =========================================================================
  if (type === 'balloon') {
    const rubberShards = [
      { clip: 'polygon(0% 0%, 100% 15%, 85% 100%, 15% 85%)', tx: -65, ty: -55, rot: -110, color: 'bg-rose-500' },
      { clip: 'polygon(25% 0%, 100% 0%, 75% 100%, 0% 75%)', tx: 65, ty: -60, rot: 95, color: 'bg-rose-600' },
      { clip: 'polygon(0% 30%, 80% 0%, 100% 80%, 20% 100%)', tx: 75, ty: 20, rot: 140, color: 'bg-rose-400' },
      { clip: 'polygon(15% 0%, 100% 35%, 70% 100%, 0% 65%)', tx: 35, ty: 75, rot: 190, color: 'bg-rose-600' },
      { clip: 'polygon(0% 20%, 90% 10%, 100% 90%, 10% 100%)', tx: -45, ty: 70, rot: -160, color: 'bg-rose-500' },
      { clip: 'polygon(10% 0%, 100% 20%, 80% 100%, 0% 90%)', tx: -75, ty: 15, rot: -85, color: 'bg-rose-400' },
    ];

    return (
      <div className={`absolute inset-0 flex items-center justify-center pointer-events-none z-40 ${className}`}>
        <div className="absolute w-28 h-28 rounded-full border-4 border-rose-400/80 animate-ping opacity-75" />
        <div className="absolute -top-4 animate-star-burst-explode select-none">
          <span className="px-3 py-1 rounded-full bg-rose-600 text-white text-xs font-black uppercase tracking-wider shadow-lg">
            BÙM! 💥
          </span>
        </div>

        {/* Torn Rubber Shards */}
        {rubberShards.map((s, idx) => (
          <div
            key={idx}
            className={`absolute w-10 h-10 ${s.color} border border-rose-300 shadow-md animate-fragment-scatter`}
            style={
              {
                clipPath: s.clip,
                '--tx': `${s.tx}px`,
                '--ty': `${s.ty}px`,
                '--rot': `${s.rot}deg`,
                '--scale-end': '0.35',
                animationDelay: `${idx * 0.02}s`,
              } as React.CSSProperties
            }
          />
        ))}

        {/* Small flying confetti sparkles */}
        {[-30, 30, -50, 50].map((offset, i) => (
          <span
            key={`sparkle-${i}`}
            className="absolute text-sm animate-particle-fly select-none"
            style={
              {
                '--tx': `${offset * 1.5}px`,
                '--ty': `${-40 + (i % 2) * 80}px`,
                '--scale-end': '0.2',
                '--rot': `${offset * 4}deg`,
              } as React.CSSProperties
            }
          >
            ✨
          </span>
        ))}
      </div>
    );
  }

  // =========================================================================
  // 3. FRUIT POP SPLATTER (Apple, Banana, Orange Pulp Wedges + Juice Drops)
  // =========================================================================
  if (type === 'fruit') {
    const fruitConfig: Record<string, { emoji: string; slice: string; color: string; soundText: string; bg: string }> = {
      apple: { emoji: '🍎', slice: '🍎', color: 'text-rose-600', soundText: 'CRUNCH! 🍎', bg: 'bg-rose-500' },
      banana: { emoji: '🍌', slice: '🍌', color: 'text-amber-500', soundText: 'YUMMY! 🍌', bg: 'bg-amber-400' },
      orange: { emoji: '🍊', slice: '🍊', color: 'text-orange-500', soundText: 'JUICY! 🍊', bg: 'bg-orange-500' },
      grape: { emoji: '🍇', slice: '🍇', color: 'text-purple-600', soundText: 'SWEET! 🍇', bg: 'bg-purple-500' },
      fish: { emoji: '🐟', slice: '🐟', color: 'text-sky-500', soundText: 'MUM MUM! 🐟', bg: 'bg-sky-500' },
      carrot: { emoji: '🥕', slice: '🥕', color: 'text-orange-600', soundText: 'CRUNCH! 🥕', bg: 'bg-orange-600' },
    };

    const fInfo = fruitConfig[fruitName.toLowerCase()] || fruitConfig.apple;

    // 6 fruit wedge fragments
    const fruitWedges = [
      { clip: 'polygon(50% 0%, 100% 50%, 50% 100%, 0% 50%)', tx: -60, ty: -50, rot: -75 },
      { clip: 'polygon(30% 0%, 100% 20%, 80% 100%, 0% 70%)', tx: 55, ty: -60, rot: 85 },
      { clip: 'polygon(0% 0%, 100% 30%, 70% 100%, 10% 80%)', tx: 70, ty: 15, rot: 130 },
      { clip: 'polygon(40% 0%, 100% 50%, 60% 100%, 0% 60%)', tx: 40, ty: 70, rot: 175 },
      { clip: 'polygon(15% 0%, 85% 15%, 100% 85%, 0% 100%)', tx: -45, ty: 65, rot: -140 },
      { clip: 'polygon(0% 30%, 70% 0%, 100% 70%, 30% 100%)', tx: -70, ty: 10, rot: -80 },
    ];

    return (
      <div className={`absolute inset-0 flex items-center justify-center pointer-events-none z-40 ${className}`}>
        <div className="absolute w-24 h-24 rounded-full border-4 border-amber-300 animate-ping opacity-80" />
        <div className="absolute -top-4 animate-star-burst-explode select-none">
          <span className="px-3 py-1 rounded-full bg-emerald-600 text-white text-xs font-black uppercase tracking-wider shadow-lg">
            {fInfo.soundText}
          </span>
        </div>

        {/* 6 Pulp Wedge Fragments */}
        {fruitWedges.map((s, idx) => (
          <div
            key={idx}
            className={`absolute w-9 h-9 ${fInfo.bg} border-2 border-white/80 shadow-md animate-fragment-scatter flex items-center justify-center`}
            style={
              {
                clipPath: s.clip,
                '--tx': `${s.tx}px`,
                '--ty': `${s.ty}px`,
                '--rot': `${s.rot}deg`,
                '--scale-end': '0.4',
                animationDelay: `${idx * 0.015}s`,
              } as React.CSSProperties
            }
          >
            <span className="text-xs select-none">✨</span>
          </div>
        ))}

        {/* Flying droplets */}
        {[-35, 35, -55, 55, 0].map((tx, idx) => (
          <div
            key={`drop-${idx}`}
            className={`absolute w-3.5 h-3.5 rounded-full ${fInfo.bg} shadow-xs animate-particle-fly`}
            style={
              {
                '--tx': `${tx}px`,
                '--ty': `${idx % 2 === 0 ? -45 : 45}px`,
                '--scale-end': '0.2',
                '--rot': `${tx * 3}deg`,
              } as React.CSSProperties
            }
          />
        ))}
      </div>
    );
  }

  // =========================================================================
  // 4. STAR EXPLOSION (8 Golden Crystal Shards & Sparkles)
  // =========================================================================
  if (type === 'star') {
    const starFragments = [
      { emoji: '⭐', tx: -45, ty: -50, rot: -45 },
      { emoji: '✨', tx: 0, ty: -65, rot: 15 },
      { emoji: '🌟', tx: 50, ty: -45, rot: 35 },
      { emoji: '✨', tx: 65, ty: 0, rot: 90 },
      { emoji: '⭐', tx: 45, ty: 50, rot: 120 },
      { emoji: '🌟', tx: 0, ty: 60, rot: 180 },
      { emoji: '✨', tx: -45, ty: 45, rot: -120 },
      { emoji: '⭐', tx: -65, ty: 0, rot: -90 },
    ];
    return (
      <div className={`absolute inset-0 flex items-center justify-center pointer-events-none z-40 ${className}`}>
        <div className="absolute w-24 h-24 rounded-full bg-amber-400/40 animate-ping pointer-events-none" />
        <div className="absolute -top-4 animate-star-burst-explode select-none">
          <span className="px-3 py-1 rounded-full bg-amber-500 text-white text-xs font-black uppercase tracking-wider shadow-md">
            TING! ⭐
          </span>
        </div>
        {starFragments.map((f, idx) => (
          <span
            key={idx}
            className="absolute text-xl select-none animate-particle-fly"
            style={
              {
                '--tx': `${f.tx}px`,
                '--ty': `${f.ty}px`,
                '--rot': `${f.rot}deg`,
                '--scale-end': '0.4',
                animationDelay: `${idx * 0.02}s`,
              } as React.CSSProperties
            }
          >
            {f.emoji}
          </span>
        ))}
      </div>
    );
  }

  // =========================================================================
  // 5. CHEST BURST (Treasure Hunt Coins, Diamonds & Golden Rays)
  // =========================================================================
  if (type === 'chest_burst') {
    const treasureItems = [
      { item: '🪙', tx: -60, ty: -65, rot: -30 },
      { item: '💎', tx: 0, ty: -75, rot: 20 },
      { item: '🪙', tx: 60, ty: -60, rot: 45 },
      { item: '👑', tx: 70, ty: -10, rot: 75 },
      { item: '💎', tx: 55, ty: 45, rot: 110 },
      { item: '🪙', tx: 0, ty: 65, rot: 160 },
      { item: '✨', tx: -55, ty: 45, rot: -100 },
      { item: '💎', tx: -70, ty: -10, rot: -50 },
    ];
    return (
      <div className={`absolute inset-0 flex items-center justify-center pointer-events-none z-40 ${className}`}>
        <div className="absolute w-28 h-28 rounded-full border-4 border-amber-400 animate-ping opacity-90" />
        <div className="absolute -top-5 animate-star-burst-explode select-none">
          <span className="px-3.5 py-1 rounded-full bg-gradient-to-r from-amber-500 to-yellow-500 text-white text-xs font-black uppercase tracking-wider shadow-lg">
            KHO BÁU MỞ! 🎁
          </span>
        </div>
        {treasureItems.map((t, idx) => (
          <span
            key={idx}
            className="absolute text-2xl select-none animate-fragment-scatter"
            style={
              {
                '--tx': `${t.tx}px`,
                '--ty': `${t.ty}px`,
                '--rot': `${t.rot}deg`,
                '--scale-end': '0.5',
                animationDelay: `${idx * 0.02}s`,
              } as React.CSSProperties
            }
          >
            {t.item}
          </span>
        ))}
      </div>
    );
  }

  // =========================================================================
  // 6. LOCK BREAK (Animal Rescue Lock / Cage Shackle Shatter)
  // =========================================================================
  const lockShards = [
    { clip: 'polygon(0% 0%, 100% 20%, 80% 100%, 0% 80%)', tx: -50, ty: -45, rot: -90 },
    { clip: 'polygon(20% 0%, 100% 0%, 75% 100%, 10% 90%)', tx: 50, ty: -50, rot: 90 },
    { clip: 'polygon(0% 20%, 85% 0%, 100% 80%, 20% 100%)', tx: 60, ty: 35, rot: 140 },
    { clip: 'polygon(10% 0%, 90% 20%, 80% 100%, 0% 70%)', tx: -55, ty: 40, rot: -130 },
  ];
  return (
    <div className={`absolute inset-0 flex items-center justify-center pointer-events-none z-40 ${className}`}>
      <div className="absolute w-20 h-20 rounded-full border-2 border-emerald-400 animate-ping opacity-80" />
      <div className="absolute -top-4 animate-star-burst-explode select-none">
        <span className="px-3 py-1 rounded-full bg-emerald-600 text-white text-xs font-black uppercase tracking-wider shadow-md">
          MỞ KHÓA! 🔓
        </span>
      </div>
      {lockShards.map((s, idx) => (
        <div
          key={idx}
          className="absolute w-8 h-8 bg-gradient-to-br from-slate-400 to-slate-700 border border-slate-300 shadow-md animate-fragment-scatter"
          style={
            {
              clipPath: s.clip,
              '--tx': `${s.tx}px`,
              '--ty': `${s.ty}px`,
              '--rot': `${s.rot}deg`,
              '--scale-end': '0.3',
              animationDelay: `${idx * 0.02}s`,
            } as React.CSSProperties
          }
        />
      ))}
    </div>
  );
};
