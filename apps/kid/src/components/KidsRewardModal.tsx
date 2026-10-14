import React, { useEffect, useRef, useState, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { KidsMascot } from './KidsMascot';
import { kidsSound } from '../services/sound/KidsSoundManager';
import { Play, RotateCcw, ArrowLeft, Sparkles } from 'lucide-react';
import { kidAsset } from '../utils/kidAsset';

interface KidsRewardModalProps {
  isOpen: boolean;
  stars?: number;
  starsEarned?: number;
  xpEarned?: number;
  scorePercent?: number;
  errorCount?: number;
  nextLessonTitle?: string;
  unlockedNextLessonTitle?: string;
  unlockedItemName?: string;
  unlockedItemEmoji?: string;
  onNext?: () => void;
  onContinue?: () => void;
  onReplay?: () => void;
  onClose?: () => void;
  onGoHome?: () => void;
}

// =========================================================================
// Confetti & Firework Canvas Animation (Pure Canvas, Zero External Libs)
// =========================================================================
interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  color: string;
  alpha: number;
  decay: number;
  gravity: number;
  shape: 'circle' | 'rect' | 'star';
  rotation: number;
  rotSpeed: number;
  width?: number;
  height?: number;
}

const CONFETTI_COLORS = [
  '#ff6b6b', '#feca57', '#48dbfb', '#ff9ff3', '#54a0ff',
  '#5f27cd', '#01a3a4', '#f368e0', '#ff9f43', '#0abde3',
  '#ee5a24', '#10ac84', '#c8d6e5', '#ffd32a', '#7bed9f',
];

function createConfettiParticle(canvasW: number, canvasH: number): Particle {
  const color = CONFETTI_COLORS[Math.floor(Math.random() * CONFETTI_COLORS.length)];
  const shapes: Particle['shape'][] = ['circle', 'rect', 'star'];
  return {
    x: Math.random() * canvasW,
    y: -10 - Math.random() * canvasH * 0.3,
    vx: (Math.random() - 0.5) * 4,
    vy: 2 + Math.random() * 3,
    radius: 3 + Math.random() * 5,
    color,
    alpha: 1,
    decay: 0.003 + Math.random() * 0.005,
    gravity: 0.03 + Math.random() * 0.02,
    shape: shapes[Math.floor(Math.random() * shapes.length)],
    rotation: Math.random() * Math.PI * 2,
    rotSpeed: (Math.random() - 0.5) * 0.15,
    width: 4 + Math.random() * 8,
    height: 2 + Math.random() * 4,
  };
}

function createFireworkParticle(cx: number, cy: number): Particle {
  const angle = Math.random() * Math.PI * 2;
  const speed = 1 + Math.random() * 5;
  const color = CONFETTI_COLORS[Math.floor(Math.random() * CONFETTI_COLORS.length)];
  return {
    x: cx,
    y: cy,
    vx: Math.cos(angle) * speed,
    vy: Math.sin(angle) * speed,
    radius: 1.5 + Math.random() * 2.5,
    color,
    alpha: 1,
    decay: 0.015 + Math.random() * 0.01,
    gravity: 0.04,
    shape: 'circle',
    rotation: 0,
    rotSpeed: 0,
  };
}

function drawStar(ctx: CanvasRenderingContext2D, cx: number, cy: number, r: number) {
  ctx.beginPath();
  for (let i = 0; i < 5; i++) {
    const angle = (i * 4 * Math.PI) / 5 - Math.PI / 2;
    const method = i === 0 ? 'moveTo' : 'lineTo';
    ctx[method](cx + r * Math.cos(angle), cy + r * Math.sin(angle));
  }
  ctx.closePath();
  ctx.fill();
}

// =========================================================================
// Star Rating Messages
// =========================================================================
function getStarMessage(stars: number): { title: string; subtitle: string } {
  switch (stars) {
    case 3:
      return { title: 'Xuất sắc quá bé ơi! 🎉', subtitle: 'Amazing! Perfect Score!' };
    case 2:
      return { title: 'Bé làm tốt lắm! 👏', subtitle: 'Great job! Well done!' };
    default:
      return { title: 'Cố gắng lên nhé! 💪', subtitle: 'Good try! Keep going!' };
  }
}

// =========================================================================
// Victory Star Award Sound (C5 → E5 → G5 rising pitch)
// =========================================================================
function playStarAwardSound(starIndex: number) {
  try {
    const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    if (ctx.state === 'suspended') ctx.resume().catch(() => {});
    const now = ctx.currentTime;
    // C5=523.25, E5=659.25, G5=783.99
    const pitches = [523.25, 659.25, 783.99];
    const freq = pitches[Math.min(starIndex, 2)];

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(freq, now);

    gain.gain.setValueAtTime(0, now);
    gain.gain.linearRampToValueAtTime(0.35, now + 0.03);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.5);

    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.55);

    // Crystal shimmer overtone
    const osc2 = ctx.createOscillator();
    const gain2 = ctx.createGain();
    osc2.type = 'sine';
    osc2.frequency.setValueAtTime(freq * 2, now + 0.05);
    gain2.gain.setValueAtTime(0, now + 0.05);
    gain2.gain.linearRampToValueAtTime(0.15, now + 0.08);
    gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.4);
    osc2.connect(gain2);
    gain2.connect(ctx.destination);
    osc2.start(now + 0.05);
    osc2.stop(now + 0.45);
  } catch (_) {}
}

function playFireworkBurstSound() {
  try {
    const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    if (ctx.state === 'suspended') ctx.resume().catch(() => {});
    const now = ctx.currentTime;

    // Crackle burst
    for (let i = 0; i < 6; i++) {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'triangle';
      const freq = 800 + Math.random() * 2000;
      const t = now + i * 0.03;
      osc.frequency.setValueAtTime(freq, t);
      osc.frequency.exponentialRampToValueAtTime(200, t + 0.08);
      gain.gain.setValueAtTime(0.12, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.1);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(t);
      osc.stop(t + 0.12);
    }
  } catch (_) {}
}

// =========================================================================
// MAIN COMPONENT
// =========================================================================
export const KidsRewardModal: React.FC<KidsRewardModalProps> = ({
  isOpen,
  stars,
  starsEarned,
  xpEarned = 50,
  scorePercent = 100,
  errorCount,
  nextLessonTitle,
  unlockedNextLessonTitle,
  unlockedItemName,
  unlockedItemEmoji = '🎁',
  onNext,
  onContinue,
  onReplay,
  onClose,
  onGoHome,
}) => {
  // Determine final star count: from errorCount if provided, else from stars prop
  let finalStars = stars ?? starsEarned ?? 3;
  if (errorCount !== undefined && errorCount !== null) {
    if (errorCount <= 1) finalStars = 3;
    else if (errorCount <= 3) finalStars = 2;
    else finalStars = 1;
  }

  const finalNextLessonTitle = nextLessonTitle ?? unlockedNextLessonTitle;
  const starMessage = getStarMessage(finalStars);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animRef = useRef<number>(0);
  const particlesRef = useRef<Particle[]>([]);
  const [visibleStars, setVisibleStars] = useState(0);
  const [showContent, setShowContent] = useState(false);

  // Sequential star reveal with 350ms delay each
  useEffect(() => {
    if (!isOpen) {
      setVisibleStars(0);
      setShowContent(false);
      return;
    }

    // Initial delay before first star
    const t0 = setTimeout(() => setShowContent(true), 200);

    const timers: ReturnType<typeof setTimeout>[] = [t0];

    for (let i = 1; i <= finalStars; i++) {
      const t = setTimeout(() => {
        setVisibleStars(i);
        playStarAwardSound(i - 1);
      }, 500 + i * 350);
      timers.push(t);
    }

    // Victory fanfare after all stars
    const fanfareTimer = setTimeout(() => {
      kidsSound.play('celebration');
      playFireworkBurstSound();
    }, 300);
    timers.push(fanfareTimer);

    return () => timers.forEach(clearTimeout);
  }, [isOpen, finalStars]);

  // Canvas firework & confetti animation
  const startAnimation = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.parentElement?.getBoundingClientRect();
    canvas.width = rect?.width || 400;
    canvas.height = rect?.height || 500;

    const W = canvas.width;
    const H = canvas.height;

    // Initial burst of confetti
    for (let i = 0; i < 60; i++) {
      particlesRef.current.push(createConfettiParticle(W, H));
    }

    // Firework bursts at intervals
    let fireworkTimer = 0;

    const animate = () => {
      ctx.clearRect(0, 0, W, H);
      fireworkTimer++;

      // Periodically spawn firework bursts
      if (fireworkTimer % 45 === 0 && particlesRef.current.length < 300) {
        const bx = 40 + Math.random() * (W - 80);
        const by = 30 + Math.random() * (H * 0.4);
        for (let i = 0; i < 25; i++) {
          particlesRef.current.push(createFireworkParticle(bx, by));
        }
        playFireworkBurstSound();
      }

      // Add continuous confetti rain
      if (fireworkTimer % 8 === 0 && particlesRef.current.length < 250) {
        particlesRef.current.push(createConfettiParticle(W, H));
      }

      // Update and draw particles
      particlesRef.current = particlesRef.current.filter((p) => {
        p.x += p.vx;
        p.y += p.vy;
        p.vy += p.gravity;
        p.alpha -= p.decay;
        p.rotation += p.rotSpeed;

        if (p.alpha <= 0 || p.y > H + 20) return false;

        ctx.save();
        ctx.globalAlpha = Math.max(0, p.alpha);
        ctx.fillStyle = p.color;
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rotation);

        if (p.shape === 'circle') {
          ctx.beginPath();
          ctx.arc(0, 0, p.radius, 0, Math.PI * 2);
          ctx.fill();
        } else if (p.shape === 'rect') {
          ctx.fillRect(-(p.width || 6) / 2, -(p.height || 3) / 2, p.width || 6, p.height || 3);
        } else if (p.shape === 'star') {
          drawStar(ctx, 0, 0, p.radius);
        }

        ctx.restore();
        return true;
      });

      animRef.current = requestAnimationFrame(animate);
    };

    animRef.current = requestAnimationFrame(animate);
  }, []);

  useEffect(() => {
    if (isOpen) {
      particlesRef.current = [];
      const timer = setTimeout(startAnimation, 100);
      return () => {
        clearTimeout(timer);
        if (animRef.current) cancelAnimationFrame(animRef.current);
        particlesRef.current = [];
      };
    } else {
      if (animRef.current) cancelAnimationFrame(animRef.current);
      particlesRef.current = [];
    }
  }, [isOpen, startAnimation]);

  // Lock body scroll
  useEffect(() => {
    if (!isOpen) return;
    const original = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = original;
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const handlePrimaryAction = () => {
    kidsSound.play('click');
    if (onNext) onNext();
    else if (onContinue) onContinue();
    else if (onClose) onClose();
  };

  const handleSecondaryAction = () => {
    kidsSound.play('pop');
    if (onClose) onClose();
    else if (onGoHome) onGoHome();
  };

  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-6"
      style={{
        background: 'rgba(15, 23, 42, 0.85)',
        backdropFilter: 'blur(12px)',
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          // Don't auto-close on backdrop click for kids
        }
      }}
    >
      {/* Full-screen Firework & Confetti Canvas */}
      <canvas
        ref={canvasRef}
        className="absolute inset-0 w-full h-full pointer-events-none z-0"
        style={{ opacity: 0.9 }}
      />

      {/* Modal Card */}
      <div
        className={`kids-layout kids-modal relative z-10 w-full max-w-md rounded-[36px] border-4 border-amber-400 p-6 sm:p-8 space-y-4 text-center select-none overflow-hidden transition-all duration-500 ${
          showContent ? 'scale-100 opacity-100' : 'scale-75 opacity-0'
        }`}
        style={{
          background: 'linear-gradient(180deg, #FFFDF5 0%, #FFF7ED 40%, #FEF3C7 100%)',
          boxShadow: '0 24px 64px -12px rgba(245, 158, 11, 0.4), 0 12px 0 #CBD5E1, inset 0 3px 8px rgba(255,255,255,0.9)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Sparkle Header Badge */}
        <div className="flex items-center justify-center gap-2 text-amber-600 font-black text-sm uppercase tracking-wider">
          <Sparkles className="w-5 h-5 animate-pulse" />
          <span>🎊 Hoàn Thành Xuất Sắc! 🎊</span>
          <Sparkles className="w-5 h-5 animate-pulse" />
        </div>

        {/* Mascot Celebration */}
        <div className="py-1">
          <KidsMascot
            mood="celebrate"
            size="md"
            speechText={starMessage.title}
          />
        </div>

        {/* Title with Star Rating */}
        <h2 className="text-xl sm:text-2xl font-black text-amber-950 tracking-tight">
          {starMessage.title}
        </h2>
        <p className="text-sm font-bold text-amber-800">{starMessage.subtitle}</p>

        {/* ⭐ Animated 3-Star Display (sequential 350ms reveal) */}
        <div className="flex items-center justify-center gap-4 py-3">
          {[1, 2, 3].map((starIndex) => {
            const isEarned = starIndex <= finalStars;
            const isVisible = starIndex <= visibleStars;

            return (
              <div
                key={starIndex}
                className={`relative flex items-center justify-center transition-all duration-500 ${
                  starIndex === 2 ? 'w-20 h-20' : 'w-16 h-16'
                } ${
                  isVisible && isEarned
                    ? 'scale-110'
                    : isEarned
                    ? 'scale-0'
                    : 'scale-100'
                }`}
                style={{
                  transitionDelay: isVisible ? '0ms' : '0ms',
                }}
              >
                {/* Glow ring behind earned stars */}
                {isVisible && isEarned && (
                  <div
                    className="absolute inset-0 rounded-full animate-ping"
                    style={{
                      background: 'radial-gradient(circle, rgba(251,191,36,0.4) 0%, transparent 70%)',
                      animationDuration: '1.5s',
                      animationIterationCount: '2',
                    }}
                  />
                )}

                {isEarned ? (
                  <img
                    src={kidAsset('/kid/rewards/star.png')}
                    alt={`Star ${starIndex}`}
                    className={`w-full h-full object-contain drop-shadow-lg transition-all duration-500 ${
                      isVisible ? 'opacity-100 scale-100' : 'opacity-0 scale-0'
                    }`}
                    style={{
                      filter: isVisible ? 'drop-shadow(0 0 12px rgba(251,191,36,0.6))' : 'none',
                    }}
                    onError={(e) => {
                      (e.target as HTMLImageElement).style.display = 'none';
                    }}
                  />
                ) : (
                  /* Empty star placeholder */
                  <div className="w-full h-full rounded-full bg-slate-200/60 border-2 border-slate-300 flex items-center justify-center">
                    <svg viewBox="0 0 24 24" className="w-8 h-8 text-slate-300" fill="currentColor">
                      <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                    </svg>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* XP & Accuracy Summary */}
        <div className="flex items-center justify-center gap-3 py-1 text-xs font-black flex-wrap">
          <span className="px-4 py-1.5 rounded-full bg-amber-200 text-amber-950 border-2 border-amber-300 flex items-center gap-1">
            ✨ +{xpEarned} EXP
          </span>
          <span className="px-4 py-1.5 rounded-full bg-emerald-100 text-emerald-900 border-2 border-emerald-300 flex items-center gap-1">
            🎯 {scorePercent}%
          </span>
          {finalStars === 3 && (
            <span className="px-4 py-1.5 rounded-full bg-purple-100 text-purple-900 border-2 border-purple-300 flex items-center gap-1">
              👑 Hoàn hảo!
            </span>
          )}
        </div>

        {/* Next Lesson Info */}
        {finalNextLessonTitle && (
          <div className="p-3 rounded-2xl bg-emerald-50 border-2 border-emerald-300 text-xs font-black text-emerald-900 flex items-center justify-center gap-1.5">
            <span>🔓</span>
            <span>Đã Mở Khóa: <span className="text-amber-700">{finalNextLessonTitle}</span></span>
          </div>
        )}

        {/* Action Buttons (Claymorphism 3D style) */}
        <div className="space-y-2.5 pt-2">
          {/* Next Level / Continue Button */}
          <button
            onClick={handlePrimaryAction}
            className="w-full py-4 rounded-2xl text-white font-black text-base flex items-center justify-center gap-2 transition-all duration-200 cursor-pointer select-none active:translate-y-1"
            style={{
              background: 'linear-gradient(180deg, #80ED99 0%, #57CC99 100%)',
              color: '#0F3D3E',
              boxShadow: '0 7px 0 #2D8A61, 0 12px 20px rgba(87, 204, 153, 0.35), inset 0 3px 4px rgba(255, 255, 255, 0.7)',
              borderBottom: '4px solid #2D8A61',
              borderRadius: '26px',
              minHeight: '68px',
              fontSize: '1.25rem',
            }}
          >
            <span>⏭️ {finalNextLessonTitle ? 'MÀN TIẾP THEO' : 'TIẾP TỤC CHINH PHỤC'}</span>
            <Play className="w-5 h-5 fill-current" />
          </button>

          {/* Replay Button */}
          {onReplay && (
            <button
              onClick={() => {
                kidsSound.play('pop');
                onReplay();
              }}
              className="w-full py-3 rounded-2xl font-black text-sm flex items-center justify-center gap-2 transition-all cursor-pointer select-none active:translate-y-1"
              style={{
                background: 'linear-gradient(180deg, #FDE68A 0%, #FBBF24 100%)',
                color: '#78350F',
                boxShadow: '0 5px 0 #B45309, 0 8px 16px rgba(245, 158, 11, 0.3), inset 0 2px 3px rgba(255, 255, 255, 0.6)',
                borderBottom: '3px solid #B45309',
                borderRadius: '22px',
                minHeight: '56px',
              }}
            >
              <RotateCcw className="w-4 h-4" />
              <span>🔄 Chơi lại</span>
            </button>
          )}

          {/* Back to Map */}
          <button
            onClick={handleSecondaryAction}
            className="w-full py-2.5 rounded-xl text-xs font-black text-slate-700 hover:text-slate-950 transition cursor-pointer flex items-center justify-center gap-1.5"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Quay lại Bản đồ phiêu lưu</span>
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
};

export default KidsRewardModal;
