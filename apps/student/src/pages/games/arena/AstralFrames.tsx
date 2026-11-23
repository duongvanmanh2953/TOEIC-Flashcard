import React, { useEffect, useRef } from 'react';

export type AstralScene = 'main' | 'live' | 'boss' | 'champion';

const sceneAssets = {
  main: 'arena-main-background',
  live: 'arena-live-background',
  boss: 'arena-boss-background',
  champion: 'arena-champion-background',
  transition: 'arena-round-transition',
} as const;

const artwork = (scene: keyof typeof sceneAssets) => `/game-assets/arena/${sceneAssets[scene]}.webp`;

const queuedArt = new Set<string>();

export function ArenaEnvironment({ scene }: { scene: AstralScene }) {
  const environment = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const preload = () => {
      const preloadTargets: (keyof typeof sceneAssets)[] = ['transition', 'champion', ...(scene === 'main' ? (['boss'] as AstralScene[]) : [])];
      for (const next of preloadTargets) {
        const source = artwork(next);
        if (queuedArt.has(source)) continue;
        queuedArt.add(source);
        const image = new Image();
        image.onerror = () => queuedArt.delete(source);
        image.src = source;
      }
    };
    const id = window.setTimeout(preload, 350);
    return () => window.clearTimeout(id);
  }, [scene]);

  useEffect(() => {
    const layer = environment.current;
    const frame = layer?.parentElement;
    if (!frame || !window.matchMedia('(pointer: fine) and (prefers-reduced-motion: no-preference)').matches) return;
    let request = 0;
    const look = ({ clientX, clientY }: PointerEvent) => {
      cancelAnimationFrame(request);
      request = requestAnimationFrame(() => {
        const bounds = frame.getBoundingClientRect();
        layer.style.setProperty('--look-x', `${((clientX - bounds.left) / bounds.width - 0.5) * 12}px`);
        layer.style.setProperty('--look-y', `${((clientY - bounds.top) / bounds.height - 0.5) * 8}px`);
      });
    };
    const reset = () => {
      cancelAnimationFrame(request);
      layer.style.removeProperty('--look-x');
      layer.style.removeProperty('--look-y');
    };
    frame.addEventListener('pointermove', look, { passive: true });
    frame.addEventListener('pointerleave', reset);
    return () => {
      frame.removeEventListener('pointermove', look);
      frame.removeEventListener('pointerleave', reset);
      reset();
    };
  }, []);

  return (
    <div ref={environment} className="astral-environment" aria-hidden="true" data-scene={scene}>
      {/* Layer 1: Base artwork */}
      <div className="astral-art" style={{ backgroundImage: `url(${artwork(scene)})` }} />
      {/* Layer 2: Deep navy tint */}
      <div className="astral-tint" />
      {/* Layer 3: Atmospheric gradient overlay */}
      <div className="astral-haze" />
      {/* Layer 4: Distant light particles */}
      <div className="astral-particles" />
      {/* Layer 5: Central arena illumination */}
      <div className="astral-core-light" />
      {/* Layer 6: Peripheral vignette */}
      <div className="astral-vignette" />
      {/* Layer 7: Foreground decorative energy rail */}
      <div className="astral-foreground" />
    </div>
  );
}

export function DecorativeCorner() {
  return (
    <span className="astral-corners" aria-hidden="true">
      <span className="astral-corner tl" />
      <span className="astral-corner tr" />
      <span className="astral-corner bl" />
      <span className="astral-corner br" />
    </span>
  );
}

export function EnergyDivider() {
  return (
    <span className="astral-divider" aria-hidden="true">
      <span className="astral-divider-core" />
    </span>
  );
}

type FrameKind = 'header' | 'question' | 'panel' | 'leaderboard' | 'analytics' | 'champion';
type FrameProps = React.HTMLAttributes<HTMLElement> & { variant?: FrameKind };

export function ArenaFrame({ variant = 'panel', className = '', children, ...props }: FrameProps) {
  const Element = variant === 'header' ? 'header' : 'section';
  return (
    <Element className={`astral-frame astral-${variant} ${className}`} {...props}>
      <DecorativeCorner />
      {children}
    </Element>
  );
}

export const ArenaPanel = ArenaFrame;
export const ArenaHeaderFrame = (props: FrameProps) => <ArenaFrame {...props} variant="header" />;
export const QuestionStageFrame = (props: FrameProps) => <ArenaFrame {...props} variant="question" />;
export const LeaderboardFrame = (props: FrameProps) => <ArenaFrame {...props} variant="leaderboard" />;
export const AnalyticsFrame = (props: FrameProps) => <ArenaFrame {...props} variant="analytics" />;
export const ChampionFrame = (props: FrameProps) => <ArenaFrame {...props} variant="champion" />;

type AnswerFrameProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  passive?: boolean;
  state?: 'selected' | 'correct' | 'wrong';
};

export function AnswerFrame({ passive, state, children, className = '', ...props }: AnswerFrameProps) {
  return passive ? (
    <li className={`arena-option astral-answer ${className}`} data-state={state}>
      <span className="astral-answer-notch" aria-hidden="true" />
      {children}
    </li>
  ) : (
    <button
      {...props}
      type="button"
      className={`arena-button arena-option astral-answer ${className}`}
      data-state={state}
    >
      <span className="astral-answer-notch" aria-hidden="true" />
      {children}
    </button>
  );
}

export function RankFrame({ rank, children }: { rank: number; children: React.ReactNode }) {
  return (
    <li className="astral-rank-frame" data-medal={rank <= 3 ? rank : undefined}>
      {children}
    </li>
  );
}
