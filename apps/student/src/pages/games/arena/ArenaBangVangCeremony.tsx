import React, { useEffect, useRef } from 'react';
import { Crown, Trophy, Star, Users, CheckCircle2, MessageSquare, Award, Sparkles, Flame, Radio, RotateCcw, Home, ArrowRight, Medal } from 'lucide-react';
import { CountryFlag } from '../../../components/language/CountryFlag';
import { playVictoryFanfare } from '@vocabflow/shared';

export interface BangVangPlayer {
  rank: number;
  displayName: string;
  avatar?: string;
  score: number;
  isCurrentUser?: boolean;
  countryCode?: string;
  isCommenter?: boolean;
}

export interface BangVangStatItem {
  label: string;
  value: string | number;
  icon?: React.ReactNode;
  color?: string;
}

export interface ArenaBangVangCeremonyProps {
  headerTitle?: string;
  topPlayers?: BangVangPlayer[];
  topCommenters?: BangVangPlayer[];
  totalPlayersCount?: string | number;
  accuracyRate?: string | number;
  correctCommentsCount?: string | number;
  customStats?: BangVangStatItem[];
  showTable4To10?: boolean;
  countdownSec?: number;
  nextMatchTitle?: string;
  isMuted?: boolean;
  className?: string;
  onPlayAgain?: () => void;
  onLeaveLobby?: () => void;
  onNextMatchNow?: () => void;
}

/**
 * Ceremony Avatar: Uses real photo if available; otherwise falls back to a stylish letter initial avatar.
 */
export const CeremonyAvatar: React.FC<{
  avatar?: string | null;
  displayName: string;
  className?: string;
}> = ({ avatar, displayName, className = 'w-full h-full' }) => {
  const hasRealAvatar = Boolean(avatar && avatar.trim().length > 0);
  const initial = (displayName || 'P').trim().charAt(0).toUpperCase();
  const getGradient = (name: string) => {
    const list = [
      'from-indigo-600 to-violet-600',
      'from-emerald-500 to-teal-600',
      'from-amber-500 to-orange-600',
      'from-rose-500 to-pink-600',
      'from-sky-500 to-blue-600',
      'from-purple-600 to-fuchsia-600',
    ];
    let h = 0;
    for (let i = 0; i < name.length; i++) h = (h << 5) - h + name.charCodeAt(i);
    return list[Math.abs(h) % list.length];
  };

  return (
    <div className={`relative overflow-hidden flex items-center justify-center font-black text-white w-full h-full rounded-full ${className}`}>
      {hasRealAvatar ? (
        <img
          src={avatar!}
          alt={displayName}
          className="w-full h-full object-cover"
          onError={(e) => {
            (e.target as HTMLElement).style.display = 'none';
            const fallback = (e.target as HTMLElement).parentElement?.querySelector('.ceremony-avatar-fallback');
            if (fallback) (fallback as HTMLElement).classList.remove('hidden');
          }}
        />
      ) : null}
      <span
        className={`ceremony-avatar-fallback w-full h-full flex items-center justify-center font-black text-white bg-gradient-to-br ${getGradient(displayName)} ${
          hasRealAvatar ? 'hidden' : ''
        }`}
      >
        {initial}
      </span>
    </div>
  );
};

/**
 * Tier-specific Championship Cups (Gold #1, Silver #2, Bronze #3)
 */
export const PodiumTrophyCup: React.FC<{
  tier: 'gold' | 'silver' | 'bronze';
  className?: string;
  size?: number;
}> = ({ tier, className = '', size = 28 }) => {
  const config = {
    gold: {
      id: 'podiumCupGold',
      stop1: '#FFFDE7',
      stop2: '#FDE047',
      stop3: '#EAB308',
      stop4: '#A16207',
      rim: '#FEF08A',
      star: '#FFFBEB',
      glow: 'rgba(250, 204, 21, 0.85)',
      num: '1',
    },
    silver: {
      id: 'podiumCupSilver',
      stop1: '#FFFFFF',
      stop2: '#E2E8F0',
      stop3: '#94A3B8',
      stop4: '#475569',
      rim: '#F8FAFC',
      star: '#FFFFFF',
      glow: 'rgba(226, 232, 240, 0.75)',
      num: '2',
    },
    bronze: {
      id: 'podiumCupBronze',
      stop1: '#FFEDD5',
      stop2: '#FB923C',
      stop3: '#D97706',
      stop4: '#7C2D12',
      rim: '#FED7AA',
      star: '#FFF7ED',
      glow: 'rgba(217, 119, 6, 0.7)',
      num: '3',
    },
  }[tier];

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`shrink-0 drop-shadow-[0_4px_10px_${config.glow}] ${className}`}
      aria-hidden="true"
    >
      <defs>
        <linearGradient id={`${config.id}_body`} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor={config.stop1} />
          <stop offset="30%" stopColor={config.stop2} />
          <stop offset="70%" stopColor={config.stop3} />
          <stop offset="100%" stopColor={config.stop4} />
        </linearGradient>
        <linearGradient id={`${config.id}_handle`} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor={config.stop1} />
          <stop offset="100%" stopColor={config.stop4} />
        </linearGradient>
      </defs>

      {/* Handles */}
      <path
        d="M20 18 C11 18 9 32 19 35 C19.5 35 20 33.5 19.5 32 C13 30 14 21 21 21 Z"
        fill={`url(#${config.id}_handle)`}
      />
      <path
        d="M44 18 C53 18 55 32 45 35 C44.5 35 44 33.5 44.5 32 C51 30 50 21 43 21 Z"
        fill={`url(#${config.id}_handle)`}
      />

      {/* Cup Body */}
      <path
        d="M18 14 H46 C46 14 47 30 32 38 C17 30 18 14 18 14 Z"
        fill={`url(#${config.id}_body)`}
        stroke={config.rim}
        strokeWidth="1"
      />

      {/* Rim */}
      <ellipse cx="32" cy="14" rx="14" ry="3.5" fill={config.rim} />
      <ellipse cx="32" cy="14" rx="11" ry="2" fill={config.stop4} opacity="0.6" />

      {/* Stem */}
      <path d="M29 37 H35 L34 46 H30 Z" fill={`url(#${config.id}_body)`} />

      {/* Base */}
      <ellipse cx="32" cy="46" rx="8" ry="2.5" fill={config.rim} />
      <path d="M25 47 L39 47 L41 54 L23 54 Z" fill={`url(#${config.id}_body)`} stroke={config.rim} strokeWidth="0.8" />
      <rect x="21" y="54" width="22" height="3" rx="1.5" fill="#1E293B" stroke={config.stop3} strokeWidth="0.8" />

      {/* Star / Number badge on cup */}
      <circle cx="32" cy="24" r="5" fill="#0F172A" opacity="0.45" />
      <text
        x="32"
        y="27"
        textAnchor="middle"
        fontSize="8"
        fontWeight="900"
        fill={config.star}
        fontFamily="sans-serif"
      >
        {config.num}
      </text>
    </svg>
  );
};

/**
 * Pure SVG Golden Trophy Cup artwork with metallic gradients (Maintains goldCupBody for tests)
 */
export const GoldenTrophyArtwork: React.FC<{ className?: string }> = ({ className = 'w-16 h-16 sm:w-24 sm:h-24' }) => (
  <svg
    viewBox="0 0 160 160"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={`filter drop-shadow-[0_0_30px_rgba(245,158,11,0.85)] ${className}`}
    aria-hidden="true"
  >
    <defs>
      <linearGradient id="goldCupBody" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#FFFBEB" />
        <stop offset="25%" stopColor="#FDE68A" />
        <stop offset="50%" stopColor="#F59E0B" />
        <stop offset="80%" stopColor="#D97706" />
        <stop offset="100%" stopColor="#78350F" />
      </linearGradient>
      <linearGradient id="goldCupRim" x1="0%" y1="0%" x2="100%" y2="0%">
        <stop offset="0%" stopColor="#FEF3C7" />
        <stop offset="50%" stopColor="#F59E0B" />
        <stop offset="100%" stopColor="#B45309" />
      </linearGradient>
      <linearGradient id="goldHandle" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#FDE68A" />
        <stop offset="50%" stopColor="#D97706" />
        <stop offset="100%" stopColor="#78350F" />
      </linearGradient>
      <radialGradient id="trophyGodRay" cx="50%" cy="50%" r="50%">
        <stop offset="0%" stopColor="rgba(251,191,36,0.45)" />
        <stop offset="65%" stopColor="rgba(245,158,11,0.12)" />
        <stop offset="100%" stopColor="transparent" />
      </radialGradient>
      <linearGradient id="laurelLeafGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#FEF08A" />
        <stop offset="100%" stopColor="#D97706" />
      </linearGradient>
    </defs>

    {/* God-ray aura behind cup */}
    <circle cx="80" cy="70" r="70" fill="url(#trophyGodRay)" />

    {/* Laurel Wreath Leaves (Left) */}
    <g stroke="url(#laurelLeafGrad)" strokeWidth="2" strokeLinecap="round" opacity="0.9">
      <path d="M 40,110 C 24,90 26,58 42,38" fill="none" />
      <ellipse cx="32" cy="94" rx="4" ry="7" transform="rotate(-30 32 94)" fill="url(#laurelLeafGrad)" />
      <ellipse cx="27" cy="74" rx="4" ry="7" transform="rotate(-15 27 74)" fill="url(#laurelLeafGrad)" />
      <ellipse cx="32" cy="54" rx="4" ry="7" transform="rotate(15 32 54)" fill="url(#laurelLeafGrad)" />
      <ellipse cx="42" cy="38" rx="4" ry="6" transform="rotate(35 42 38)" fill="url(#laurelLeafGrad)" />
    </g>

    {/* Laurel Wreath Leaves (Right) */}
    <g stroke="url(#laurelLeafGrad)" strokeWidth="2" strokeLinecap="round" opacity="0.9">
      <path d="M 120,110 C 136,90 134,58 118,38" fill="none" />
      <ellipse cx="128" cy="94" rx="4" ry="7" transform="rotate(30 128 94)" fill="url(#laurelLeafGrad)" />
      <ellipse cx="133" cy="74" rx="4" ry="7" transform="rotate(15 133 74)" fill="url(#laurelLeafGrad)" />
      <ellipse cx="128" cy="54" rx="4" ry="7" transform="rotate(-15 128 54)" fill="url(#laurelLeafGrad)" />
      <ellipse cx="118" cy="38" rx="4" ry="6" transform="rotate(-35 118 38)" fill="url(#laurelLeafGrad)" />
    </g>

    {/* Left Handle */}
    <path
      d="M50 48 C28 48 24 78 46 84 C48 84.5 49 81 48 78 C32 74 34 54 50 54 Z"
      fill="url(#goldHandle)"
      stroke="#FDE68A"
      strokeWidth="1.2"
    />

    {/* Right Handle */}
    <path
      d="M110 48 C132 48 136 78 114 84 C112 84.5 111 81 112 78 C128 74 126 54 110 54 Z"
      fill="url(#goldHandle)"
      stroke="#FDE68A"
      strokeWidth="1.2"
    />

    {/* Trophy Cup Body */}
    <path
      d="M48 40 L112 40 C112 40 114 74 80 92 C46 74 48 40 48 40 Z"
      fill="url(#goldCupBody)"
      stroke="#FDE68A"
      strokeWidth="1.5"
    />

    {/* Top Rim */}
    <ellipse cx="80" cy="40" rx="32" ry="7" fill="url(#goldCupRim)" stroke="#FFFBEB" strokeWidth="1.5" />
    <ellipse cx="80" cy="40" rx="26" ry="4.5" fill="#78350F" opacity="0.6" />

    {/* Stem */}
    <path d="M74 91 L86 91 L84 108 L76 108 Z" fill="url(#goldCupBody)" stroke="#FDE68A" strokeWidth="1" />
    <ellipse cx="80" cy="108" rx="12" ry="3" fill="url(#goldCupRim)" />

    {/* Pedestal Base */}
    <path d="M66 110 L94 110 L98 126 L62 126 Z" fill="url(#goldCupBody)" stroke="#FDE68A" strokeWidth="1" />
    <rect x="58" y="126" width="44" height="6" rx="2" fill="#451A03" stroke="#F59E0B" strokeWidth="1.2" />

    {/* Embossed Gold Star on Body */}
    <polygon
      points="80,56 83,64 92,64 85,69 88,78 80,72 72,78 75,69 68,64 77,64"
      fill="#FFFBEB"
      stroke="#D97706"
      strokeWidth="1"
    />
  </svg>
);

export const ArenaBangVangCeremony: React.FC<ArenaBangVangCeremonyProps> = ({
  headerTitle = 'BẢNG VÀNG VOCABFLOW',
  topPlayers = [],
  topCommenters = [],
  totalPlayersCount,
  accuracyRate,
  correctCommentsCount,
  customStats,
  showTable4To10 = true,
  countdownSec = 20,
  nextMatchTitle,
  isMuted = false,
  className = '',
  onPlayAgain,
  onLeaveLobby,
  onNextMatchNow,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Play fanfare once on mount (respecting mute)
  useEffect(() => {
    if (!isMuted) {
      try {
        playVictoryFanfare();
      } catch (_) {}
    }
  }, [isMuted]);

  // Metallic Fireworks & Confetti Canvas Animation
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;
    let width = (canvas.width = canvas.parentElement?.clientWidth || 360);
    let height = (canvas.height = canvas.parentElement?.clientHeight || 640);

    const particles: Array<{
      x: number;
      y: number;
      vx: number;
      vy: number;
      size: number;
      color: string;
      alpha: number;
      decay: number;
    }> = [];

    const colors = ['#F59E0B', '#FBBF24', '#FEF08A', '#FCD34D', '#10B981', '#38BDF8', '#EC4899', '#A855F7'];

    const spawnFireworks = (originX: number, originY: number) => {
      const count = 30;
      for (let i = 0; i < count; i++) {
        const angle = Math.random() * Math.PI * 2;
        const speed = Math.random() * 4 + 1.5;
        particles.push({
          x: originX,
          y: originY,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed,
          size: Math.random() * 3 + 1.5,
          color: colors[Math.floor(Math.random() * colors.length)],
          alpha: 1,
          decay: Math.random() * 0.015 + 0.01,
        });
      }
    };

    // Initial burst
    spawnFireworks(width * 0.25, height * 0.22);
    spawnFireworks(width * 0.75, height * 0.22);
    spawnFireworks(width * 0.5, height * 0.16);

    const interval = setInterval(() => {
      spawnFireworks(Math.random() * width * 0.8 + width * 0.1, Math.random() * height * 0.35 + height * 0.08);
    }, 2800);

    const render = () => {
      ctx.clearRect(0, 0, width, height);

      for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        p.x += p.vx;
        p.y += p.vy;
        p.vy += 0.05; // gravity
        p.alpha -= p.decay;

        if (p.alpha <= 0) {
          particles.splice(i, 1);
          continue;
        }

        ctx.save();
        ctx.globalAlpha = p.alpha;
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }

      animId = requestAnimationFrame(render);
    };

    render();

    return () => {
      clearInterval(interval);
      cancelAnimationFrame(animId);
    };
  }, []);

  // Sort players authoritatively by rank (1, 2, 3...)
  const sortedPlayers = [...topPlayers].sort((a, b) => a.rank - b.rank);
  const p1 = sortedPlayers.find((p) => p.rank === 1) || sortedPlayers[0] || null;
  const p2 = sortedPlayers.find((p) => p.rank === 2) || (sortedPlayers.length >= 2 ? sortedPlayers[1] : null);
  const p3 = sortedPlayers.find((p) => p.rank === 3) || (sortedPlayers.length >= 3 ? sortedPlayers[2] : null);

  // Real ranks 4 to 10 only (and beyond)
  const ranks4to10 = sortedPlayers.filter((p) => p.rank >= 4 && p.rank <= 10);
  const currentUserBeyond10 = sortedPlayers.find((p) => p.isCurrentUser && p.rank > 10);

  // Top 3 TikTok commenters
  const sortedCommenters = [...topCommenters].sort((a, b) => a.rank - b.rank).slice(0, 3);

  // Compute stats pills to show
  const statsList: BangVangStatItem[] = customStats || [
    ...(totalPlayersCount !== undefined
      ? [
          {
            label: 'Đấu thủ tham gia',
            value: totalPlayersCount,
            icon: <Users className="w-3.5 h-3.5 text-indigo-400" />,
            color: 'border-indigo-500/30 text-indigo-300',
          },
        ]
      : []),
    ...(accuracyRate !== undefined
      ? [
          {
            label: 'Độ chính xác',
            value: accuracyRate,
            icon: <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />,
            color: 'border-emerald-500/30 text-emerald-300',
          },
        ]
      : []),
    ...(correctCommentsCount !== undefined
      ? [
          {
            label: 'Comment đoán đúng',
            value: correctCommentsCount,
            icon: <MessageSquare className="w-3.5 h-3.5 text-purple-400" />,
            color: 'border-purple-500/30 text-purple-300',
          },
        ]
      : []),
  ];

  return (
    <div
      className={`relative w-full rounded-3xl flex flex-col items-center justify-start text-white select-none bg-gradient-to-b from-[#070b1e] via-[#0d1433] to-[#050713] border-2 border-amber-500/40 shadow-[0_0_60px_rgba(245,158,11,0.28)] p-2.5 sm:p-5 overflow-hidden ${className}`}
    >
      {/* ======================================================== */}
      {/* 0. FIREWORKS CANVAS OVERLAY & DYNAMIC SPOTLIGHTS         */}
      {/* ======================================================== */}
      <canvas
        ref={canvasRef}
        className="absolute inset-0 w-full h-full pointer-events-none z-20"
      />

      <div className="absolute inset-0 pointer-events-none overflow-hidden z-0">
        <div className="absolute -top-12 left-1/4 w-80 h-80 bg-amber-400/20 rounded-full blur-3xl animate-pulse" />
        <div className="absolute -top-12 right-1/4 w-80 h-80 bg-indigo-500/25 rounded-full blur-3xl" />
        <div className="absolute bottom-0 inset-x-0 h-44 bg-[linear-gradient(to_right,rgba(245,158,11,0.08)_1px,transparent_1px),linear-gradient(to_bottom,rgba(245,158,11,0.08)_1px,transparent_1px)] bg-[size:24px_24px] [mask-image:radial-gradient(ellipse_at_bottom,black_50%,transparent_90%)]" />
      </div>

      {/* ======================================================== */}
      {/* 1. TOP RIBBON: 👑 BẢNG VÀNG VOCABFLOW (METALLIC GOLD)     */}
      {/* ======================================================== */}
      <div className="relative z-10 pt-1 pb-1 sm:pb-2 flex flex-col items-center text-center w-full px-2">
        <div className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-amber-500/20 border border-amber-400/50 text-amber-300 text-[10px] font-black uppercase tracking-widest mb-1 shadow-sm">
          <Sparkles className="w-3 h-3 text-amber-400 animate-spin" style={{ animationDuration: '6s' }} />
          <span>VINH DANH ĐẤU TRƯỜNG • HALL OF FAME</span>
          <Sparkles className="w-3 h-3 text-amber-400" />
        </div>

        <div className="relative inline-flex items-center justify-center max-w-full px-4 sm:px-10 py-1.5 sm:py-2.5 bg-gradient-to-r from-purple-950 via-indigo-900 to-purple-950 border-2 border-amber-400 rounded-2xl shadow-[0_0_30px_rgba(245,158,11,0.5)]">
          <Star className="w-4 h-4 sm:w-5 sm:h-5 text-amber-400 fill-amber-400 mr-1.5 sm:mr-2 drop-shadow-[0_0_8px_rgba(255,215,0,0.8)] shrink-0" />

          {/* Guaranteed high-contrast metallic gold text */}
          <h2 className="font-black text-sm sm:text-2xl tracking-wider text-amber-300 uppercase drop-shadow-[0_2px_12px_rgba(245,158,11,0.8)] truncate">
            {headerTitle}
          </h2>

          <Star className="w-4 h-4 sm:w-5 sm:h-5 text-amber-400 fill-amber-400 ml-1.5 sm:mr-2 drop-shadow-[0_0_8px_rgba(255,215,0,0.8)] shrink-0" />

          {/* Ribbon Tail wings */}
          <div className="absolute -left-2 top-1/2 -translate-y-1/2 w-2 h-3.5 bg-purple-950 border-l border-y border-amber-400/60 rounded-l" />
          <div className="absolute -right-2 top-1/2 -translate-y-1/2 w-2 h-3.5 bg-purple-950 border-r border-y border-amber-400/60 rounded-r" />
        </div>
      </div>

      {/* ======================================================== */}
      {/* 2. GRAND GOLDEN TROPHY CUP CENTERPIECE                    */}
      {/* ======================================================== */}
      <div className="relative z-10 -mt-1 flex flex-col items-center">
        <GoldenTrophyArtwork className="w-14 h-14 sm:w-20 sm:h-20" />
      </div>

      {/* ======================================================== */}
      {/* 3. PODIUM TOP 3 PLAYERS (RANK 2 - RANK 1 - RANK 3)       */}
      {/* ======================================================== */}
      <div className="relative z-10 w-full max-w-lg mx-auto px-1 sm:px-2 pt-2 sm:pt-4 grid grid-cols-3 gap-1.5 sm:gap-3 items-end">
        {/* ------------------------------------------------------ */}
        {/* RANK 2: SILVER PODIUM (LEFT - 2ND HIGHEST)             */}
        {/* ------------------------------------------------------ */}
        <div className="flex flex-col items-center text-center">
          {p2 ? (
            <>
              <div className="relative mb-1 overflow-visible flex flex-col items-center">
                {/* Silver Laurel / Crown */}
                <div className="flex items-center justify-center gap-1 absolute -top-3.5 sm:-top-4 left-1/2 -translate-x-1/2 z-20 pointer-events-none">
                  <Crown className="w-5 h-5 sm:w-6 sm:h-6 text-slate-100 fill-slate-200 drop-shadow-[0_0_8px_rgba(255,255,255,0.9)]" />
                </div>

                {/* Avatar with Silver Ring */}
                <div className="w-11 h-11 sm:w-16 sm:h-16 rounded-full border-2 border-slate-200 shadow-[0_0_20px_rgba(226,232,240,0.6)] ring-2 ring-slate-300/40 overflow-hidden bg-slate-800 flex items-center justify-center">
                  <CeremonyAvatar
                    avatar={p2.avatar}
                    displayName={p2.displayName}
                  />
                </div>

                {/* Silver Cup Badge Right on Avatar Header */}
                <span className="absolute -top-1.5 -right-2 z-20">
                  <PodiumTrophyCup tier="silver" size={20} className="sm:w-6 sm:h-6" />
                </span>

                {/* Rank Badge */}
                <span className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-4 h-4 sm:w-5 sm:h-5 rounded-full bg-gradient-to-r from-slate-200 to-slate-400 text-slate-950 font-black text-[9px] sm:text-xs flex items-center justify-center shadow z-20 border border-slate-900">
                  2
                </span>
              </div>

              {/* Name & Score pill */}
              <div className="w-full py-0.5 sm:py-1 px-1 sm:px-1.5 rounded-xl bg-slate-900/95 border border-slate-300/60 shadow-md">
                <div className="flex items-center justify-center gap-1">
                  {p2.countryCode && <CountryFlag countryCode={p2.countryCode} size="xs" />}
                  <span className="font-bold text-[10px] sm:text-xs text-white truncate max-w-[70px] sm:max-w-[130px]">
                    {p2.displayName}
                  </span>
                </div>
                <span className="font-mono font-black text-[10px] sm:text-xs text-slate-200 tabular-nums">
                  {p2.score.toLocaleString()} XP
                </span>
              </div>
            </>
          ) : (
            <div className="w-full py-2 px-1 text-center rounded-xl border border-dashed border-slate-600/60 bg-slate-900/40 mb-1">
              <span className="text-[9px] text-slate-400 block font-bold">2ND • Á QUÂN</span>
              <span className="text-[8px] text-slate-500 block italic">Đang chờ</span>
            </div>
          )}

          {/* Silver Pedestal - Taller than Bronze */}
          <div className="w-full h-20 sm:h-28 mt-1 rounded-t-2xl bg-gradient-to-t from-slate-950 via-slate-900/95 to-slate-800/80 border-t-3 sm:border-t-4 border-x border-slate-300/80 shadow-[0_0_20px_rgba(226,232,240,0.35)] flex flex-col items-center justify-center relative overflow-hidden py-1.5 sm:py-2">
            <div className="absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r from-transparent via-white/80 to-transparent pointer-events-none" />
            <div className="absolute inset-0 bg-radial-gradient from-slate-200/10 to-transparent pointer-events-none" />
            <span className="font-black font-mono text-lg sm:text-2xl text-transparent bg-clip-text bg-gradient-to-b from-white via-slate-100 to-slate-400 drop-shadow-[0_2px_8px_rgba(255,255,255,0.5)]">
              2ND
            </span>
            <span className="text-[8px] sm:text-[10px] font-black uppercase tracking-widest text-slate-300 mt-0.5">
              Á QUÂN
            </span>
          </div>
        </div>

        {/* ------------------------------------------------------ */}
        {/* RANK 1: LUXURIOUS GOLD PODIUM (CENTER - TALLEST DAIS)  */}
        {/* ------------------------------------------------------ */}
        <div className="flex flex-col items-center text-center -mt-6 sm:-mt-8 z-10">
          {p1 ? (
            <>
              <div className="relative mb-1 overflow-visible flex flex-col items-center">
                {/* Gold Royal Crown with Gems */}
                <div className="flex items-center justify-center gap-1 absolute -top-4 sm:-top-5 left-1/2 -translate-x-1/2 z-20 pointer-events-none">
                  <Crown className="w-7 h-7 sm:w-9 sm:h-9 text-yellow-300 fill-amber-300 animate-bounce drop-shadow-[0_0_15px_rgba(245,158,11,1)]" />
                </div>

                {/* Avatar with Opulent Golden Double Ring */}
                <div className="w-14 h-14 sm:w-20 sm:h-20 rounded-full border-2 sm:border-4 border-yellow-300 shadow-[0_0_35px_rgba(245,158,11,0.95)] ring-2 sm:ring-4 ring-amber-400/60 overflow-hidden bg-slate-800 flex items-center justify-center">
                  <CeremonyAvatar
                    avatar={p1.avatar}
                    displayName={p1.displayName}
                  />
                </div>

                {/* Gold Cup Badge Right on Avatar Header */}
                <span className="absolute -top-2 -right-2.5 z-20">
                  <PodiumTrophyCup tier="gold" size={26} className="sm:w-8 sm:h-8" />
                </span>

                {/* Rank #1 Badge */}
                <span className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-gradient-to-r from-amber-400 to-yellow-500 text-slate-950 font-black text-[10px] sm:text-sm flex items-center justify-center shadow-lg shadow-amber-500/50 ring-2 ring-yellow-300 z-20 border border-slate-900">
                  1
                </span>
              </div>

              {/* Name & Score pill */}
              <div className="w-full py-1 px-1 sm:px-2 rounded-xl bg-slate-900/95 border-2 border-amber-400/80 shadow-lg shadow-amber-500/30">
                <div className="flex items-center justify-center gap-1">
                  {p1.countryCode && <CountryFlag countryCode={p1.countryCode} size="xs" />}
                  <span className="font-black text-xs sm:text-sm text-amber-200 truncate max-w-[80px] sm:max-w-[140px]">
                    {p1.displayName}
                  </span>
                </div>
                <span className="font-mono font-black text-xs sm:text-sm text-yellow-300 flex items-center justify-center gap-0.5">
                  <Star className="w-3 h-3 text-amber-400 fill-amber-400 shrink-0" />
                  <span>{p1.score.toLocaleString()} XP</span>
                </span>
              </div>
            </>
          ) : (
            <div className="w-full py-2 px-1 text-center rounded-xl border border-dashed border-amber-500/60 bg-amber-950/20 mb-1">
              <span className="text-[10px] sm:text-xs text-amber-300 font-bold block">1ST • VÔ ĐỊCH</span>
              <span className="text-[8px] sm:text-[9px] text-amber-500/80 block italic">Đang chờ</span>
            </div>
          )}

          {/* Luxurious Gold Pedestal - Tallest Dais */}
          <div className="w-full h-30 sm:h-42 mt-1 rounded-t-2xl bg-gradient-to-t from-slate-950 via-amber-950/80 to-amber-900/50 border-t-4 border-x border-amber-400 shadow-[0_0_35px_rgba(245,158,11,0.65)] flex flex-col items-center justify-center relative overflow-hidden py-1.5 sm:py-2">
            <div className="absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r from-transparent via-yellow-200 to-transparent pointer-events-none" />
            <div className="absolute inset-0 bg-radial-gradient from-amber-400/25 to-transparent pointer-events-none" />
            <span className="font-black font-mono text-2xl sm:text-4xl text-transparent bg-clip-text bg-gradient-to-b from-yellow-100 via-amber-300 to-amber-500 drop-shadow-[0_2px_14px_rgba(245,158,11,0.9)]">
              1ST
            </span>
            <span className="text-[9px] sm:text-xs font-black uppercase tracking-widest text-amber-300 mt-0.5 drop-shadow">
              VÔ ĐỊCH
            </span>
          </div>
        </div>

        {/* ------------------------------------------------------ */}
        {/* RANK 3: BRONZE PODIUM (RIGHT)                          */}
        {/* ------------------------------------------------------ */}
        <div className="flex flex-col items-center text-center">
          {p3 ? (
            <>
              <div className="relative mb-1 overflow-visible flex flex-col items-center">
                {/* Bronze Laurel / Crown */}
                <div className="flex items-center justify-center gap-1 absolute -top-3 sm:-top-3.5 left-1/2 -translate-x-1/2 z-20 pointer-events-none">
                  <Crown className="w-4 h-4 sm:w-5 sm:h-5 text-amber-500 fill-amber-500 drop-shadow-[0_0_6px_rgba(217,119,6,0.8)]" />
                </div>

                {/* Avatar with Bronze Ring */}
                <div className="w-10 h-10 sm:w-14 sm:h-14 rounded-full border-2 border-amber-600 shadow-[0_0_18px_rgba(217,119,6,0.45)] ring-2 ring-amber-700/40 overflow-hidden bg-slate-800 flex items-center justify-center">
                  <CeremonyAvatar
                    avatar={p3.avatar}
                    displayName={p3.displayName}
                  />
                </div>

                {/* Bronze Cup Badge Right on Avatar Header */}
                <span className="absolute -top-1.5 -right-2 z-20">
                  <PodiumTrophyCup tier="bronze" size={20} className="sm:w-6 sm:h-6" />
                </span>

                {/* Rank Badge */}
                <span className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-4 h-4 sm:w-5 sm:h-5 rounded-full bg-gradient-to-r from-amber-700 to-amber-900 text-white font-black text-[9px] sm:text-xs flex items-center justify-center shadow z-20 border border-slate-900">
                  3
                </span>
              </div>

              {/* Name & Score pill */}
              <div className="w-full py-0.5 sm:py-1 px-1 sm:px-1.5 rounded-xl bg-slate-900/95 border border-amber-700/60 shadow-md">
                <div className="flex items-center justify-center gap-1">
                  {p3.countryCode && <CountryFlag countryCode={p3.countryCode} size="xs" />}
                  <span className="font-bold text-[10px] sm:text-xs text-white truncate max-w-[70px] sm:max-w-[130px]">
                    {p3.displayName}
                  </span>
                </div>
                <span className="font-mono font-black text-[10px] sm:text-xs text-amber-400 tabular-nums">
                  {p3.score.toLocaleString()} XP
                </span>
              </div>
            </>
          ) : (
            <div className="w-full py-2 px-1 text-center rounded-xl border border-dashed border-amber-700/60 bg-amber-950/20 mb-1">
              <span className="text-[9px] text-amber-400 font-bold block">3RD • HẠNG 3</span>
              <span className="text-[8px] text-slate-500 block italic">Đang chờ</span>
            </div>
          )}

          {/* Bronze Pedestal - Shortest Dais */}
          <div className="w-full h-14 sm:h-20 mt-1 rounded-t-2xl bg-gradient-to-t from-slate-950 via-[#271207]/90 to-amber-900/50 border-t-3 sm:border-t-4 border-x border-amber-600/80 shadow-[0_0_20px_rgba(217,119,6,0.4)] flex flex-col items-center justify-center relative overflow-hidden py-1.5 sm:py-2">
            <div className="absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r from-transparent via-amber-300/60 to-transparent pointer-events-none" />
            <div className="absolute inset-0 bg-radial-gradient from-amber-600/15 to-transparent pointer-events-none" />
            <span className="font-black font-mono text-lg sm:text-2xl text-transparent bg-clip-text bg-gradient-to-b from-amber-100 via-amber-400 to-amber-600 drop-shadow-[0_2px_8px_rgba(217,119,6,0.7)]">
              3RD
            </span>
            <span className="text-[8px] sm:text-[10px] font-black uppercase tracking-widest text-amber-400 mt-0.5">
              HẠNG 3
            </span>
          </div>
        </div>
      </div>

      {/* ======================================================== */}
      {/* 4. SEPARATE SECTION: TOP 3 TIKTOK COMMENTERS (IF ANY)    */}
      {/* ======================================================== */}
      {sortedCommenters.length > 0 && (
        <div className="relative z-10 w-full max-w-lg mx-auto px-1 sm:px-2 mt-2.5">
          <div className="p-2 sm:p-2.5 rounded-2xl bg-slate-900/90 border border-purple-500/40 shadow-xl backdrop-blur-md">
            <div className="flex items-center justify-between pb-1.5 border-b border-white/10 text-[11px] font-black">
              <div className="flex items-center gap-1.5 text-purple-300">
                <Radio className="w-3.5 h-3.5 text-rose-400 animate-pulse" />
                <span className="uppercase tracking-wider">Top Comment TikTok (Tốc Độ)</span>
              </div>
              <span className="text-[9px] text-slate-400 font-mono">30đ • 20đ • 15đ</span>
            </div>

            <div className="grid grid-cols-3 gap-1.5 pt-1.5">
              {[0, 1, 2].map((idx) => {
                const c = sortedCommenters[idx];
                const rank = idx + 1;
                const badgeBg =
                  rank === 1
                    ? 'border-amber-400/80 bg-amber-500/10 text-amber-300'
                    : rank === 2
                    ? 'border-slate-400/80 bg-slate-500/10 text-slate-200'
                    : 'border-amber-700/80 bg-amber-900/10 text-amber-400';

                if (!c) {
                  return (
                    <div
                      key={idx}
                      className="p-1 rounded-xl border border-dashed border-white/10 text-center text-[9px] text-slate-500"
                    >
                      #{rank} Trống
                    </div>
                  );
                }

                return (
                  <div
                    key={c.displayName || idx}
                    className={`p-1 sm:p-1.5 rounded-xl border ${badgeBg} flex flex-col items-center text-center`}
                  >
                    <div className="relative mb-0.5">
                      <CeremonyAvatar
                        avatar={c.avatar}
                        displayName={c.displayName}
                      />
                    </div>
                    <span className="font-bold text-[9px] text-white truncate max-w-[65px] block">
                      {c.displayName}
                    </span>
                    <span className="font-mono font-black text-[10px] text-amber-300">
                      +{c.score}đ
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* 5. BẢNG XẾP HẠNG TOP 4 - 10+ ĐẤU THỦ TRONG PHÒNG         */}
      {/* ======================================================== */}
      {showTable4To10 && (
        <div className="relative z-10 w-full max-w-lg mx-auto px-1 sm:px-2 mt-2.5 flex-1 min-h-[140px] flex flex-col">
          <div className="p-2.5 sm:p-3 rounded-2xl bg-slate-900/95 border border-amber-500/30 shadow-xl backdrop-blur-md flex-1 flex flex-col">
            <div className="flex items-center justify-between pb-2 border-b border-white/10 text-[11px] font-black">
              <div className="flex items-center gap-1.5 text-amber-300">
                <Award className="w-4 h-4 text-amber-400" />
                <span className="uppercase tracking-wider">Bảng Vàng Đấu Thủ (Top 4 - 10)</span>
              </div>
              <span className="text-[10px] text-slate-400 font-mono font-bold">
                {sortedPlayers.length} Đấu thủ
              </span>
            </div>

            <div className="mt-2 space-y-1.5 overflow-y-auto max-h-[260px] sm:max-h-[340px] pr-1 scrollbar-thin scrollbar-thumb-white/10 flex-1">
              {ranks4to10.length > 0 ? (
                ranks4to10.map((player) => (
                  <div
                    key={player.displayName + player.rank}
                    className={`flex items-center justify-between p-2 rounded-xl border transition ${
                      player.isCurrentUser
                        ? 'bg-indigo-950/90 border-indigo-400 shadow-[0_0_12px_rgba(99,102,241,0.5)] ring-1 ring-indigo-400'
                        : 'bg-slate-950/60 border-white/10 hover:border-white/20'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <span className="w-6 h-6 rounded-lg bg-slate-800 border border-white/10 font-mono font-black text-xs text-slate-300 flex items-center justify-center shrink-0">
                        #{player.rank}
                      </span>
                      <div className="w-7 h-7 rounded-full overflow-hidden bg-slate-800 border border-white/20 shrink-0">
                        <CeremonyAvatar
                          avatar={player.avatar}
                          displayName={player.displayName}
                        />
                      </div>
                      <div className="flex items-center gap-1.5 min-w-0">
                        {player.countryCode && <CountryFlag countryCode={player.countryCode} size="xs" />}
                        <span className={`text-xs truncate ${player.isCurrentUser ? 'text-amber-300 font-black' : 'text-slate-200 font-bold'}`}>
                          {player.displayName}
                        </span>
                        {player.isCurrentUser && (
                          <span className="px-1.5 py-0.5 rounded-md bg-indigo-600 text-[9px] font-black uppercase text-white shadow-xs">
                            BẠN
                          </span>
                        )}
                      </div>
                    </div>
                    <span className="font-mono font-black text-xs text-amber-300 shrink-0">
                      {player.score.toLocaleString()}đ
                    </span>
                  </div>
                ))
              ) : (
                <div className="py-4 text-center text-xs text-slate-400 italic">
                  {sortedPlayers.length <= 3
                    ? 'Tất cả đấu thủ đã vinh danh trên Bục Top 3 Bảng Vàng! 🏆'
                    : 'Chưa có dữ liệu xếp hạng'}
                </div>
              )}

              {/* If current user is ranked > 10, pin their current standing row */}
              {currentUserBeyond10 && (
                <div className="pt-1.5 border-t border-dashed border-indigo-500/40">
                  <div className="flex items-center justify-between p-2 rounded-xl bg-indigo-950/90 border border-indigo-400 shadow-[0_0_12px_rgba(99,102,241,0.5)] ring-1 ring-indigo-400">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <span className="w-6 h-6 rounded-lg bg-indigo-600 font-mono font-black text-xs text-white flex items-center justify-center shrink-0">
                        #{currentUserBeyond10.rank}
                      </span>
                      <div className="w-7 h-7 rounded-full overflow-hidden bg-slate-800 border border-white/20 shrink-0">
                        <CeremonyAvatar
                          avatar={currentUserBeyond10.avatar}
                          displayName={currentUserBeyond10.displayName}
                        />
                      </div>
                      <div className="flex items-center gap-1.5 min-w-0">
                        <span className="text-xs font-black text-amber-300 truncate">
                          {currentUserBeyond10.displayName}
                        </span>
                        <span className="px-1.5 py-0.5 rounded-md bg-indigo-600 text-[9px] font-black uppercase text-white shadow-xs">
                          BẠN
                        </span>
                      </div>
                    </div>
                    <span className="font-mono font-black text-xs text-amber-300 shrink-0">
                      {currentUserBeyond10.score.toLocaleString()}đ
                    </span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* 6. SUMMARY STATS PILLS (Real Data Only)                  */}
      {/* ======================================================== */}
      {statsList.length > 0 && (
        <div className="relative z-10 w-full max-w-lg mx-auto px-1 sm:px-2 mt-2 grid grid-cols-3 gap-1.5">
          {statsList.map((st, idx) => (
            <div
              key={idx}
              className={`flex items-center gap-1.5 py-1 px-2 rounded-xl bg-slate-900/90 border backdrop-blur-md shadow-md ${
                st.color || 'border-indigo-500/30 text-white'
              }`}
            >
              {st.icon && (
                <div className="w-5 h-5 rounded-lg bg-white/10 flex items-center justify-center shrink-0">
                  {st.icon}
                </div>
              )}
              <div className="min-w-0 text-left">
                <span className="text-[9px] text-slate-400 block truncate">{st.label}</span>
                <span className="font-black font-mono text-[11px] text-white block truncate">
                  {st.value}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ======================================================== */}
      {/* 7. 20-SECOND COUNTDOWN & AUTO-NEXT ROTATION TICKER        */}
      {/* ======================================================== */}
      <div className="relative z-10 w-full max-w-lg mx-auto px-1 sm:px-2 mt-2.5 space-y-2">
        {nextMatchTitle && (
          <div className="flex items-center justify-between gap-2 p-2 rounded-2xl bg-gradient-to-r from-purple-950/90 via-indigo-950/90 to-purple-950/90 border border-amber-400/50 shadow-lg text-[11px]">
            <div className="flex items-center gap-1.5 min-w-0">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping shrink-0" />
              <span className="font-bold text-amber-200 truncate">
                {nextMatchTitle ? `Kế tiếp: ${nextMatchTitle}` : 'Đấu trường tự động liên tục'}
              </span>
            </div>

            <div className="flex items-center gap-1 px-2 py-0.5 rounded-xl bg-amber-500/20 border border-amber-400/60 font-mono font-black text-amber-300 text-xs shrink-0 shadow-sm">
              {countdownSec > 0 && <span>{countdownSec}s</span>}
            </div>
          </div>
        )}

        {/* User Navigation & Match Transition Action Buttons */}
        <div className="flex items-center justify-center gap-2 pt-1">
          {onPlayAgain && (
            <button
              type="button"
              onClick={onPlayAgain}
              className="flex-1 py-2.5 px-3 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-black text-xs shadow-md shadow-emerald-600/30 transition-all flex items-center justify-center gap-1.5 cursor-pointer hover:scale-[1.02] active:scale-95"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Đấu Ván Mới</span>
            </button>
          )}

          {onNextMatchNow && (
            <button
              type="button"
              onClick={onNextMatchNow}
              className="flex-1 py-2.5 px-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-md shadow-indigo-600/30 transition-all flex items-center justify-center gap-1.5 cursor-pointer hover:scale-[1.02] active:scale-95"
            >
              <ArrowRight className="w-3.5 h-3.5" />
              <span>Chuyển Trận Ngay</span>
            </button>
          )}

          {onLeaveLobby && (
            <button
              type="button"
              onClick={onLeaveLobby}
              className="py-2.5 px-3.5 rounded-xl bg-slate-900/90 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-700/80 font-bold text-xs transition flex items-center justify-center gap-1 cursor-pointer shadow-sm"
              title="Quay lại sảnh đấu chính"
            >
              <Home className="w-3.5 h-3.5" />
              <span>Về Sảnh Đấu</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
