import React from 'react';
import { kidAsset } from '../../utils/kidAsset';

export type KidsIllustrationName =
  // Animals
  | 'dog'
  | 'cat'
  | 'rabbit'
  | 'lion'
  | 'elephant'
  | 'bear'
  | 'monkey'
  | 'frog'
  | 'bird'
  | 'duck'
  | 'fish'
  // Food
  | 'apple'
  | 'banana'
  | 'pizza'
  | 'burger'
  | 'hamburger'
  | 'milk'
  | 'bread'
  | 'carrot'
  | 'strawberry'
  | 'ice-cream'
  | 'cookie'
  // Transport
  | 'car'
  | 'bus'
  | 'train'
  | 'rocket'
  | 'airplane'
  | 'boat'
  | 'bicycle'
  // Scenes & Games
  | 'space'
  | 'forest'
  | 'island'
  | 'kitchen'
  | 'treasure-chest'
  | 'balloons'
  // School & Nature
  | 'book'
  | 'pencil'
  | 'clock'
  | 'sun'
  | 'cloud';

interface KidsIllustrationProps {
  name: string;
  className?: string;
  size?: number | string;
  alt?: string;
}

const KID_PHOTO_ASSETS: Record<string, string> = {
  // 20 Animals
  rabbit: '/kid/animals/rabbit.png',
  panda: '/kid/animals/panda.png',
  lion: '/kid/animals/lion.png',
  tiger: '/kid/animals/tiger.png',
  elephant: '/kid/animals/elephant.png',
  monkey: '/kid/animals/monkey.png',
  penguin: '/kid/animals/penguin.png',
  bear: '/kid/animals/bear.png',
  cat: '/kid/animals/cat.png',
  dog: '/kid/animals/dog.png',
  bird: '/kid/animals/bird.png',
  giraffe: '/kid/animals/giraffe.png',
  zebra: '/kid/animals/zebra.png',
  frog: '/kid/animals/frog.png',
  turtle: '/kid/animals/turtle.png',
  dolphin: '/kid/animals/dolphin.png',
  whale: '/kid/animals/whale.png',
  butterfly: '/kid/animals/butterfly.png',
  bee: '/kid/animals/bee.png',
  fox: '/kid/animals/fox.png',
  // Rewards & Items
  'treasure-chest': '/kid/rewards/chest.png',
  chest: '/kid/rewards/chest.png',
  star: '/kid/rewards/star.png',
  trophy: '/kid/rewards/trophy.png',
  crown: '/kid/rewards/crown.png',
  xp: '/kid/rewards/xp.png',
  gem: '/kid/rewards/gem.png',
  ticket: '/kid/rewards/ticket.png',
};

export const KidsIllustration: React.FC<KidsIllustrationProps> = ({
  name,
  className = 'w-16 h-16',
  size,
  alt,
}) => {
  const normalized = (name || '').toLowerCase().trim().replace(/\s+/g, '-');
  const style = size ? { width: size, height: size } : undefined;

  if (KID_PHOTO_ASSETS[normalized]) {
    return (
      <img
        src={kidAsset(KID_PHOTO_ASSETS[normalized])}
        alt={alt || normalized}
        className={`${className} object-contain select-none drop-shadow-sm transition-transform duration-200 hover:scale-105`}
        style={style}
        loading="lazy"
        onError={(e) => {
          (e.target as HTMLImageElement).src = '/kid/mascot/vivi-wave.png';
        }}
      />
    );
  }

  switch (normalized) {
    /* ----------------------------------------------------
     * ANIMALS
     * ---------------------------------------------------- */
    case 'dog':
      return (
        <svg viewBox="0 0 100 100" className={className} style={style} aria-label={alt || 'Dog'}>
          {/* Floppy Ears */}
          <ellipse cx="24" cy="42" rx="14" ry="24" fill="#8d5b4c" transform="rotate(-15 24 42)" />
          <ellipse cx="76" cy="42" rx="14" ry="24" fill="#8d5b4c" transform="rotate(15 76 42)" />
          {/* Head */}
          <ellipse cx="50" cy="52" rx="34" ry="30" fill="#c68a6b" />
          {/* Forehead Patch */}
          <path d="M42 24 Q50 36 58 24 Q55 42 45 42 Z" fill="#fff" opacity="0.6" />
          {/* Snout */}
          <ellipse cx="50" cy="62" rx="18" ry="14" fill="#fdf0e6" />
          {/* Nose */}
          <path d="M45 56 Q50 54 55 56 Q50 62 45 56 Z" fill="#2d1e18" />
          {/* Mouth & Tongue */}
          <path d="M47 62 Q50 66 53 62" stroke="#2d1e18" strokeWidth="2.5" strokeLinecap="round" fill="none" />
          <path d="M48 64 Q50 72 52 64 Z" fill="#ff6b81" />
          {/* Cheerful Eyes */}
          <circle cx="38" cy="46" r="4.5" fill="#2d1e18" />
          <circle cx="39.5" cy="44.5" r="1.5" fill="#fff" />
          <circle cx="62" cy="46" r="4.5" fill="#2d1e18" />
          <circle cx="63.5" cy="44.5" r="1.5" fill="#fff" />
          {/* Rosy Cheeks */}
          <circle cx="28" cy="54" r="5" fill="#ff8a9e" opacity="0.45" />
          <circle cx="72" cy="54" r="5" fill="#ff8a9e" opacity="0.45" />
        </svg>
      );

    case 'cat':
      return (
        <svg viewBox="0 0 100 100" className={className} style={style} aria-label={alt || 'Cat'}>
          {/* Triangle Ears */}
          <polygon points="20,40 32,14 44,34" fill="#f59e0b" />
          <polygon points="24,37 32,20 40,33" fill="#fde68a" />
          <polygon points="80,40 68,14 56,34" fill="#f59e0b" />
          <polygon points="76,37 68,20 60,33" fill="#fde68a" />
          {/* Head */}
          <circle cx="50" cy="54" r="32" fill="#fbbf24" />
          {/* Big Green Eyes */}
          <ellipse cx="38" cy="48" rx="6" ry="8" fill="#10b981" />
          <ellipse cx="38" cy="48" rx="2.5" ry="7" fill="#064e3b" />
          <circle cx="39.5" cy="45" r="2" fill="#fff" />
          <ellipse cx="62" cy="48" rx="6" ry="8" fill="#10b981" />
          <ellipse cx="62" cy="48" rx="2.5" ry="7" fill="#064e3b" />
          <circle cx="63.5" cy="45" r="2" fill="#fff" />
          {/* Pink Nose */}
          <polygon points="47,56 53,56 50,60" fill="#f472b6" />
          {/* Mouth */}
          <path d="M46 61 Q50 64 54 61" stroke="#78350f" strokeWidth="2" fill="none" strokeLinecap="round" />
          {/* Whiskers */}
          <line x1="22" y1="56" x2="34" y2="58" stroke="#78350f" strokeWidth="2" strokeLinecap="round" />
          <line x1="20" y1="64" x2="34" y2="63" stroke="#78350f" strokeWidth="2" strokeLinecap="round" />
          <line x1="78" y1="56" x2="66" y2="58" stroke="#78350f" strokeWidth="2" strokeLinecap="round" />
          <line x1="80" y1="64" x2="66" y2="63" stroke="#78350f" strokeWidth="2" strokeLinecap="round" />
        </svg>
      );

    case 'rabbit':
      return (
        <svg viewBox="0 0 100 100" className={className} style={style} aria-label={alt || 'Rabbit'}>
          {/* Long Ears */}
          <ellipse cx="36" cy="24" rx="9" ry="22" fill="#f8fafc" stroke="#001531" strokeWidth="2" />
          <ellipse cx="36" cy="24" rx="5" ry="16" fill="#fbcfe8" />
          <ellipse cx="64" cy="24" rx="9" ry="22" fill="#f8fafc" stroke="#001531" strokeWidth="2" />
          <ellipse cx="64" cy="24" rx="5" ry="16" fill="#fbcfe8" />
          {/* Head */}
          <circle cx="50" cy="58" r="30" fill="#ffffff" stroke="#001531" strokeWidth="2" />
          {/* Big Sparkly Eyes */}
          <circle cx="38" cy="52" r="5" fill="#1e293b" />
          <circle cx="39.5" cy="50" r="1.8" fill="#fff" />
          <circle cx="62" cy="52" r="5" fill="#1e293b" />
          <circle cx="63.5" cy="50" r="1.8" fill="#fff" />
          {/* Pink Nose & Buck Teeth */}
          <ellipse cx="50" cy="62" rx="3.5" ry="2.5" fill="#f472b6" />
          <rect x="47" y="65" width="6" height="5" rx="1.5" fill="#fff" stroke="#5fa8ff" strokeWidth="1" />
          <line x1="50" y1="65" x2="50" y2="70" stroke="#5fa8ff" strokeWidth="1" />
          {/* Whiskers */}
          <line x1="24" y1="60" x2="36" y2="61" stroke="#94a3b8" strokeWidth="1.5" strokeLinecap="round" />
          <line x1="22" y1="66" x2="36" y2="64" stroke="#94a3b8" strokeWidth="1.5" strokeLinecap="round" />
          <line x1="76" y1="60" x2="64" y2="61" stroke="#94a3b8" strokeWidth="1.5" strokeLinecap="round" />
          <line x1="78" y1="66" x2="64" y2="64" stroke="#94a3b8" strokeWidth="1.5" strokeLinecap="round" />
          {/* Blush */}
          <circle cx="30" cy="60" r="4.5" fill="#fbcfe8" />
          <circle cx="70" cy="60" r="4.5" fill="#fbcfe8" />
        </svg>
      );

    case 'lion':
      return (
        <svg viewBox="0 0 100 100" className={className} style={style} aria-label={alt || 'Lion'}>
          {/* Fluffy Mane */}
          <circle cx="50" cy="50" r="42" fill="#d97706" />
          <circle cx="28" cy="28" r="12" fill="#b45309" />
          <circle cx="72" cy="28" r="12" fill="#b45309" />
          <circle cx="22" cy="52" r="12" fill="#b45309" />
          <circle cx="78" cy="52" r="12" fill="#b45309" />
          <circle cx="32" cy="74" r="12" fill="#b45309" />
          <circle cx="68" cy="74" r="12" fill="#b45309" />
          {/* Face */}
          <circle cx="50" cy="52" r="28" fill="#fcd34d" />
          {/* Ears */}
          <circle cx="32" cy="30" r="8" fill="#fcd34d" />
          <circle cx="32" cy="30" r="4.5" fill="#f59e0b" />
          <circle cx="68" cy="30" r="8" fill="#fcd34d" />
          <circle cx="68" cy="30" r="4.5" fill="#f59e0b" />
          {/* Eyes */}
          <circle cx="40" cy="46" r="4" fill="#451a03" />
          <circle cx="41.5" cy="44.5" r="1.5" fill="#fff" />
          <circle cx="60" cy="46" r="4" fill="#451a03" />
          <circle cx="61.5" cy="44.5" r="1.5" fill="#fff" />
          {/* Muzzle */}
          <ellipse cx="50" cy="60" rx="12" ry="8" fill="#fef3c7" />
          <polygon points="46,55 54,55 50,60" fill="#78350f" />
          <path d="M47 62 Q50 65 53 62" stroke="#78350f" strokeWidth="2" fill="none" strokeLinecap="round" />
        </svg>
      );

    case 'elephant':
      return (
        <svg viewBox="0 0 100 100" className={className} style={style} aria-label={alt || 'Elephant'}>
          {/* Big Ears */}
          <circle cx="20" cy="48" r="18" fill="#93c5fd" />
          <circle cx="20" cy="48" r="11" fill="#bfdbfe" />
          <circle cx="80" cy="48" r="18" fill="#93c5fd" />
          <circle cx="80" cy="48" r="11" fill="#bfdbfe" />
          {/* Head */}
          <circle cx="50" cy="50" r="28" fill="#60a5fa" />
          {/* Friendly Eyes */}
          <circle cx="38" cy="44" r="3.5" fill="#1e3a8a" />
          <circle cx="39" cy="43" r="1.2" fill="#fff" />
          <circle cx="62" cy="44" r="3.5" fill="#1e3a8a" />
          <circle cx="63" cy="43" r="1.2" fill="#fff" />
          {/* Trunk curled up happily */}
          <path d="M46 54 Q44 68 52 74 Q58 76 60 70 Q60 66 55 68" stroke="#3b82f6" strokeWidth="6" strokeLinecap="round" fill="none" />
          {/* Cheeks */}
          <circle cx="32" cy="54" r="4" fill="#f472b6" opacity="0.6" />
          <circle cx="68" cy="54" r="4" fill="#f472b6" opacity="0.6" />
        </svg>
      );

    case 'bear':
      return (
        <svg viewBox="0 0 100 100" className={className} style={style} aria-label={alt || 'Bear'}>
          {/* Round Ears */}
          <circle cx="26" cy="28" r="12" fill="#78350f" />
          <circle cx="26" cy="28" r="7" fill="#b45309" />
          <circle cx="74" cy="28" r="12" fill="#78350f" />
          <circle cx="74" cy="28" r="7" fill="#b45309" />
          {/* Head */}
          <circle cx="50" cy="54" r="32" fill="#92400e" />
          {/* Eyes */}
          <circle cx="38" cy="46" r="4" fill="#1f130b" />
          <circle cx="39.5" cy="44.5" r="1.5" fill="#fff" />
          <circle cx="62" cy="46" r="4" fill="#1f130b" />
          <circle cx="63.5" cy="44.5" r="1.5" fill="#fff" />
          {/* Snout */}
          <ellipse cx="50" cy="62" rx="15" ry="11" fill="#fde68a" />
          <ellipse cx="50" cy="58" rx="5" ry="3.5" fill="#1f130b" />
          <path d="M47 64 Q50 67 53 64" stroke="#1f130b" strokeWidth="2" fill="none" strokeLinecap="round" />
        </svg>
      );

    case 'monkey':
      return (
        <svg viewBox="0 0 100 100" className={className} style={style} aria-label={alt || 'Monkey'}>
          {/* Ears */}
          <circle cx="18" cy="50" r="14" fill="#92400e" />
          <circle cx="18" cy="50" r="8" fill="#fde68a" />
          <circle cx="82" cy="50" r="14" fill="#92400e" />
          <circle cx="82" cy="50" r="8" fill="#fde68a" />
          {/* Head */}
          <circle cx="50" cy="50" r="30" fill="#78350f" />
          {/* Inner Face Mask */}
          <ellipse cx="41" cy="46" rx="14" ry="16" fill="#fde68a" />
          <ellipse cx="59" cy="46" rx="14" ry="16" fill="#fde68a" />
          <ellipse cx="50" cy="62" rx="20" ry="14" fill="#fde68a" />
          {/* Eyes */}
          <circle cx="40" cy="44" r="4" fill="#1c1917" />
          <circle cx="41" cy="43" r="1.5" fill="#fff" />
          <circle cx="60" cy="44" r="4" fill="#1c1917" />
          <circle cx="61" cy="43" r="1.5" fill="#fff" />
          {/* Nostrils & Smile */}
          <circle cx="47" cy="58" r="1.5" fill="#78350f" />
          <circle cx="53" cy="58" r="1.5" fill="#78350f" />
          <path d="M42 66 Q50 72 58 66" stroke="#78350f" strokeWidth="2.5" fill="none" strokeLinecap="round" />
        </svg>
      );

    case 'frog':
      return (
        <svg viewBox="0 0 100 100" className={className} style={style} aria-label={alt || 'Frog'}>
          {/* Bulging Eye Pods */}
          <circle cx="32" cy="30" r="16" fill="#22c55e" />
          <circle cx="32" cy="30" r="11" fill="#ffffff" />
          <circle cx="34" cy="30" r="6" fill="#14532d" />
          <circle cx="36" cy="28" r="2" fill="#fff" />
          <circle cx="68" cy="30" r="16" fill="#22c55e" />
          <circle cx="68" cy="30" r="11" fill="#ffffff" />
          <circle cx="66" cy="30" r="6" fill="#14532d" />
          <circle cx="68" cy="28" r="2" fill="#fff" />
          {/* Face */}
          <ellipse cx="50" cy="56" rx="36" ry="26" fill="#4ade80" />
          {/* Big Wide Smile */}
          <path d="M30 58 Q50 74 70 58" stroke="#15803d" strokeWidth="3" fill="none" strokeLinecap="round" />
          {/* Rosy Cheeks */}
          <circle cx="26" cy="56" r="5" fill="#f43f5e" opacity="0.4" />
          <circle cx="74" cy="56" r="5" fill="#f43f5e" opacity="0.4" />
        </svg>
      );

    case 'bird':
      return (
        <svg viewBox="0 0 100 100" className={className} style={style} aria-label={alt || 'Bird'}>
          {/* Body */}
          <ellipse cx="48" cy="54" rx="28" ry="24" fill="#38bdf8" />
          {/* Wing */}
          <path d="M36 50 C24 50 20 66 36 68 C44 70 48 58 36 50 Z" fill="#0284c7" />
          {/* Big Eye */}
          <circle cx="64" cy="46" r="6.5" fill="#fff" />
          <circle cx="66" cy="46" r="3.5" fill="#0f172a" />
          <circle cx="67" cy="44.5" r="1.2" fill="#fff" />
          {/* Beak */}
          <polygon points="74,48 90,52 74,58" fill="#f59e0b" />
          {/* Crest */}
          <path d="M50 28 Q54 18 64 22 Q58 28 54 32 Z" fill="#0284c7" />
        </svg>
      );

    case 'duck':
      return (
        <svg viewBox="0 0 100 100" className={className} style={style} aria-label={alt || 'Duck'}>
          {/* Body */}
          <ellipse cx="46" cy="62" rx="28" ry="20" fill="#facc15" />
          {/* Tail */}
          <path d="M20 54 Q14 46 26 56 Z" fill="#eab308" />
          {/* Head */}
          <circle cx="62" cy="42" r="18" fill="#facc15" />
          {/* Wing */}
          <ellipse cx="44" cy="62" rx="14" ry="10" fill="#eab308" />
          {/* Eye */}
          <circle cx="66" cy="38" r="3" fill="#1e293b" />
          <circle cx="67" cy="37" r="1" fill="#fff" />
          {/* Bill */}
          <ellipse cx="80" cy="44" rx="10" ry="5" fill="#ea580c" />
        </svg>
      );

    /* ----------------------------------------------------
     * FOOD & DISHES
     * ---------------------------------------------------- */
    case 'apple':
      return (
        <svg viewBox="0 0 100 100" className={className} style={style} aria-label={alt || 'Apple'}>
          {/* Leaf & Stem */}
          <path d="M50 26 Q52 14 58 10" stroke="#78350f" strokeWidth="4" strokeLinecap="round" fill="none" />
          <path d="M52 18 Q66 12 68 24 Q58 26 52 18 Z" fill="#22c55e" />
          {/* Apple Body */}
          <path
            d="M34 32 C18 32 16 52 24 70 C30 84 46 88 50 82 C54 88 70 84 76 70 C84 52 82 32 66 32 C58 32 52 38 50 38 C48 38 42 32 34 32 Z"
            fill="#ef4444"
          />
          {/* Shiny Highlight */}
          <ellipse cx="36" cy="44" rx="7" ry="12" fill="#fff" opacity="0.4" transform="rotate(-20 36 44)" />
        </svg>
      );

    case 'banana':
      return (
        <svg viewBox="0 0 100 100" className={className} style={style} aria-label={alt || 'Banana'}>
          {/* Banana Curve */}
          <path
            d="M20 74 C34 86 66 84 82 44 C84 38 80 32 74 34 C64 58 42 66 26 62 C22 61 18 68 20 74 Z"
            fill="#facc15"
            stroke="#ca8a04"
            strokeWidth="2"
          />
          {/* Banana Stem and Tip */}
          <rect x="74" y="30" width="8" height="6" rx="2" fill="#854d0e" transform="rotate(30 78 33)" />
          <circle cx="21" cy="72" r="3" fill="#854d0e" />
          {/* Rib Line */}
          <path d="M26 68 C44 76 66 68 76 44" stroke="#eab308" strokeWidth="2.5" fill="none" />
        </svg>
      );

    case 'pizza':
      return (
        <svg viewBox="0 0 100 100" className={className} style={style} aria-label={alt || 'Pizza'}>
          {/* Crust */}
          <path d="M18 26 Q50 14 82 26 L50 88 Z" fill="#d97706" />
          {/* Melted Cheese Surface */}
          <path d="M22 30 Q50 20 78 30 L50 82 Z" fill="#fbbf24" />
          {/* Pepperoni Slices */}
          <circle cx="50" cy="40" r="7" fill="#dc2626" />
          <circle cx="38" cy="52" r="6" fill="#dc2626" />
          <circle cx="62" cy="54" r="6.5" fill="#dc2626" />
          <circle cx="50" cy="68" r="5" fill="#dc2626" />
          {/* Green Peppers */}
          <rect x="42" y="32" width="6" height="2.5" rx="1" fill="#16a34a" transform="rotate(30 45 33)" />
          <rect x="56" y="44" width="7" height="2.5" rx="1" fill="#16a34a" transform="rotate(-40 59 45)" />
          <rect x="36" y="64" width="6" height="2.5" rx="1" fill="#16a34a" transform="rotate(15 39 65)" />
        </svg>
      );

    case 'burger':
    case 'hamburger':
      return (
        <svg viewBox="0 0 100 100" className={className} style={style} aria-label={alt || 'Hamburger'}>
          {/* Top Bun */}
          <path d="M20 44 C20 24 80 24 80 44 Z" fill="#f59e0b" />
          {/* Sesame Seeds */}
          <ellipse cx="38" cy="34" rx="2" ry="1.2" fill="#fef3c7" transform="rotate(15 38 34)" />
          <ellipse cx="50" cy="30" rx="2" ry="1.2" fill="#fef3c7" />
          <ellipse cx="62" cy="34" rx="2" ry="1.2" fill="#fef3c7" transform="rotate(-15 62 34)" />
          {/* Tomato */}
          <rect x="22" y="44" width="56" height="6" rx="3" fill="#ef4444" />
          {/* Melted Cheese */}
          <polygon points="20,50 80,50 74,57 58,57 50,62 42,57 26,57" fill="#facc15" />
          {/* Patty */}
          <rect x="18" y="56" width="64" height="10" rx="5" fill="#78350f" />
          {/* Lettuce */}
          <path d="M16 66 Q24 70 32 66 Q40 70 48 66 Q56 70 64 66 Q72 70 84 66" stroke="#22c55e" strokeWidth="4" fill="none" strokeLinecap="round" />
          {/* Bottom Bun */}
          <path d="M22 68 C22 80 78 80 78 68 Z" fill="#f59e0b" />
        </svg>
      );

    case 'milk':
      return (
        <svg viewBox="0 0 100 100" className={className} style={style} aria-label={alt || 'Milk'}>
          {/* Carton Top */}
          <polygon points="36,26 50,14 64,26" fill="#38bdf8" />
          <rect x="46" y="10" width="8" height="6" fill="#0284c7" />
          {/* Carton Body */}
          <rect x="32" y="26" width="36" height="58" rx="4" fill="#f0f9ff" stroke="#0099e9" strokeWidth="2" />
          {/* Blue Wave Stripe */}
          <path d="M32 52 Q50 62 68 52 L68 70 Q50 80 32 70 Z" fill="#0284c7" />
          {/* Straw */}
          <line x1="58" y1="8" x2="68" y2="2" stroke="#f43f5e" strokeWidth="4" strokeLinecap="round" />
          {/* Text/Logo "MILK" */}
          <text x="50" y="44" textAnchor="middle" fill="#0284c7" fontSize="9" fontWeight="900">
            MILK
          </text>
        </svg>
      );

    case 'bread':
      return (
        <svg viewBox="0 0 100 100" className={className} style={style} aria-label={alt || 'Bread'}>
          {/* Loaf Body */}
          <rect x="22" y="42" width="56" height="36" rx="6" fill="#f59e0b" />
          {/* Rounded Top Crust */}
          <ellipse cx="50" cy="42" rx="32" ry="18" fill="#d97706" />
          <ellipse cx="50" cy="42" rx="27" ry="14" fill="#fbbf24" />
          {/* Baker Slits */}
          <line x1="38" y1="36" x2="44" y2="46" stroke="#b45309" strokeWidth="3" strokeLinecap="round" />
          <line x1="50" y1="34" x2="54" y2="48" stroke="#b45309" strokeWidth="3" strokeLinecap="round" />
          <line x1="62" y1="36" x2="66" y2="46" stroke="#b45309" strokeWidth="3" strokeLinecap="round" />
        </svg>
      );

    case 'carrot':
      return (
        <svg viewBox="0 0 100 100" className={className} style={style} aria-label={alt || 'Carrot'}>
          {/* Green Leaf Tops */}
          <path d="M48 26 Q40 8 32 14 Q44 18 48 26 Z" fill="#16a34a" />
          <path d="M52 26 Q50 6 56 6 Q56 16 52 26 Z" fill="#22c55e" />
          <path d="M54 26 Q62 10 70 16 Q60 20 54 26 Z" fill="#16a34a" />
          {/* Tapered Carrot Body */}
          <path d="M38 28 C42 26 58 26 62 28 C64 44 54 82 50 90 C46 82 36 44 38 28 Z" fill="#f97316" />
          {/* Skin Creases */}
          <line x1="42" y1="42" x2="52" y2="42" stroke="#ea580c" strokeWidth="2.5" strokeLinecap="round" />
          <line x1="48" y1="56" x2="58" y2="56" stroke="#ea580c" strokeWidth="2.5" strokeLinecap="round" />
          <line x1="44" y1="70" x2="52" y2="70" stroke="#ea580c" strokeWidth="2.5" strokeLinecap="round" />
        </svg>
      );

    case 'strawberry':
      return (
        <svg viewBox="0 0 100 100" className={className} style={style} aria-label={alt || 'Strawberry'}>
          {/* Green Calyx */}
          <polygon points="50,22 42,14 46,26 34,24 44,30 50,26 56,30 66,24 54,26 58,14" fill="#22c55e" />
          {/* Berry Body */}
          <path d="M30 32 C18 46 26 76 50 90 C74 76 82 46 70 32 C58 24 42 24 30 32 Z" fill="#e11d48" />
          {/* Seeds */}
          <circle cx="42" cy="42" r="1.5" fill="#fef08a" />
          <circle cx="58" cy="42" r="1.5" fill="#fef08a" />
          <circle cx="50" cy="52" r="1.5" fill="#fef08a" />
          <circle cx="38" cy="62" r="1.5" fill="#fef08a" />
          <circle cx="62" cy="62" r="1.5" fill="#fef08a" />
          <circle cx="50" cy="72" r="1.5" fill="#fef08a" />
        </svg>
      );

    case 'ice-cream':
      return (
        <svg viewBox="0 0 100 100" className={className} style={style} aria-label={alt || 'Ice Cream'}>
          {/* Waffle Cone */}
          <polygon points="34,54 66,54 50,92" fill="#d97706" />
          <line x1="40" y1="62" x2="58" y2="76" stroke="#b45309" strokeWidth="1.5" />
          <line x1="60" y1="62" x2="42" y2="76" stroke="#b45309" strokeWidth="1.5" />
          {/* Bottom Chocolate Scoop */}
          <circle cx="50" cy="50" r="18" fill="#78350f" />
          {/* Top Strawberry Scoop */}
          <circle cx="50" cy="34" r="18" fill="#f43f5e" />
          {/* Cherry on Top */}
          <circle cx="50" cy="16" r="6" fill="#991b1b" />
          <path d="M50 14 Q56 4 64 6" stroke="#78350f" strokeWidth="2" fill="none" />
        </svg>
      );

    case 'cookie':
      return (
        <svg viewBox="0 0 100 100" className={className} style={style} aria-label={alt || 'Cookie'}>
          {/* Cookie Base */}
          <circle cx="50" cy="50" r="36" fill="#d97706" />
          <circle cx="50" cy="50" r="32" fill="#f59e0b" />
          {/* Chocolate Chips */}
          <circle cx="38" cy="38" r="4.5" fill="#451a03" />
          <circle cx="62" cy="36" r="4" fill="#451a03" />
          <circle cx="48" cy="52" r="5" fill="#451a03" />
          <circle cx="34" cy="64" r="4" fill="#451a03" />
          <circle cx="64" cy="62" r="4.5" fill="#451a03" />
        </svg>
      );

    /* ----------------------------------------------------
     * TRANSPORT & VEHICLES
     * ---------------------------------------------------- */
    case 'car':
      return (
        <svg viewBox="0 0 100 100" className={className} style={style} aria-label={alt || 'Car'}>
          {/* Body Top Cabin */}
          <path d="M30 48 L40 30 L66 30 L76 48 Z" fill="#ef4444" />
          {/* Windows */}
          <polygon points="42,34 50,34 50,46 36,46" fill="#0099e9" />
          <polygon points="54,34 64,34 70,46 54,46" fill="#0099e9" />
          {/* Main Car Body */}
          <rect x="18" y="46" width="68" height="22" rx="8" fill="#dc2626" />
          {/* Headlight & Taillight */}
          <rect x="80" y="52" width="6" height="6" rx="2" fill="#fef08a" />
          <rect x="18" y="52" width="4" height="6" rx="1" fill="#f97316" />
          {/* Wheels */}
          <circle cx="34" cy="68" r="11" fill="#1e293b" />
          <circle cx="34" cy="68" r="5" fill="#94a3b8" />
          <circle cx="70" cy="68" r="11" fill="#1e293b" />
          <circle cx="70" cy="68" r="5" fill="#94a3b8" />
        </svg>
      );

    case 'bus':
      return (
        <svg viewBox="0 0 100 100" className={className} style={style} aria-label={alt || 'Bus'}>
          {/* Bus Body */}
          <rect x="14" y="24" width="72" height="46" rx="8" fill="#facc15" stroke="#eab308" strokeWidth="2" />
          {/* Black Stripes */}
          <line x1="14" y1="52" x2="86" y2="52" stroke="#1e293b" strokeWidth="2.5" />
          {/* Windows */}
          <rect x="22" y="32" width="14" height="14" rx="2" fill="#38bdf8" />
          <rect x="42" y="32" width="14" height="14" rx="2" fill="#38bdf8" />
          <rect x="62" y="32" width="18" height="14" rx="2" fill="#38bdf8" />
          {/* Headlight */}
          <circle cx="82" cy="58" r="3.5" fill="#fff" />
          {/* Wheels */}
          <circle cx="30" cy="70" r="10" fill="#1e293b" />
          <circle cx="30" cy="70" r="4" fill="#5fa8ff" />
          <circle cx="70" cy="70" r="10" fill="#1e293b" />
          <circle cx="70" cy="70" r="4" fill="#5fa8ff" />
        </svg>
      );

    case 'train':
      return (
        <svg viewBox="0 0 100 100" className={className} style={style} aria-label={alt || 'Train'}>
          {/* Steam Locomotive Cabin */}
          <rect x="18" y="28" width="30" height="42" rx="4" fill="#8b5cf6" />
          <rect x="24" y="34" width="16" height="14" rx="2" fill="#c4b5fd" />
          {/* Boiler Tank */}
          <rect x="44" y="40" width="38" height="30" rx="6" fill="#7c3aed" />
          {/* Smokestack */}
          <rect x="66" y="24" width="10" height="16" fill="#4c1d95" />
          <ellipse cx="71" cy="24" rx="7" ry="3" fill="#6d28d9" />
          {/* Smoke Puffs */}
          <circle cx="74" cy="14" r="5" fill="#001531" opacity="0.8" />
          <circle cx="82" cy="8" r="6.5" fill="#001531" opacity="0.6" />
          {/* Front Cowcatcher */}
          <polygon points="82,60 92,72 82,72" fill="#f59e0b" />
          {/* Wheels */}
          <circle cx="32" cy="72" r="10" fill="#1e293b" />
          <circle cx="32" cy="72" r="4" fill="#fde047" />
          <circle cx="56" cy="74" r="8" fill="#1e293b" />
          <circle cx="56" cy="74" r="3" fill="#fde047" />
          <circle cx="74" cy="74" r="8" fill="#1e293b" />
          <circle cx="74" cy="74" r="3" fill="#fde047" />
        </svg>
      );

    case 'rocket':
      return (
        <svg viewBox="0 0 100 100" className={className} style={style} aria-label={alt || 'Rocket'}>
          {/* Fire Exhaust */}
          <polygon points="44,74 56,74 50,96" fill="#f97316" />
          <polygon points="46,74 54,74 50,88" fill="#facc15" />
          {/* Fins */}
          <polygon points="34,56 22,74 36,70" fill="#ef4444" />
          <polygon points="66,56 78,74 64,70" fill="#ef4444" />
          {/* Body */}
          <path d="M50 12 C38 30 36 56 36 72 L64 72 C64 56 62 30 50 12 Z" fill="#f8fafc" stroke="#001531" strokeWidth="2" />
          {/* Nose Cone */}
          <path d="M50 12 C44 22 40 28 38 34 L62 34 C60 28 56 22 50 12 Z" fill="#ef4444" />
          {/* Portal Window */}
          <circle cx="50" cy="46" r="8" fill="#0284c7" />
          <circle cx="50" cy="46" r="6" fill="#38bdf8" />
          <circle cx="52" cy="44" r="2" fill="#fff" />
        </svg>
      );

    case 'airplane':
      return (
        <svg viewBox="0 0 100 100" className={className} style={style} aria-label={alt || 'Airplane'}>
          {/* Tailfin */}
          <polygon points="20,44 14,24 28,38" fill="#3b82f6" />
          {/* Wings */}
          <polygon points="46,50 30,76 44,72 58,50" fill="#2563eb" />
          <polygon points="46,46 30,20 44,24 58,46" fill="#2563eb" />
          {/* Fuselage Body */}
          <ellipse cx="50" cy="48" rx="38" ry="8" fill="#f8fafc" stroke="#5fa8ff" strokeWidth="2" />
          {/* Cockpit Window */}
          <path d="M80 46 Q86 48 80 50 Z" fill="#0284c7" />
        </svg>
      );

    case 'boat':
      return (
        <svg viewBox="0 0 100 100" className={className} style={style} aria-label={alt || 'Boat'}>
          {/* Water Waves */}
          <path d="M10 80 Q30 74 50 80 Q70 86 90 80 L90 92 L10 92 Z" fill="#38bdf8" />
          {/* Boat Hull */}
          <polygon points="20,62 80,62 70,76 30,76" fill="#ea580c" />
          {/* Mast */}
          <line x1="48" y1="20" x2="48" y2="62" stroke="#78350f" strokeWidth="3" />
          {/* Large Striped Sail */}
          <polygon points="50,22 78,54 50,54" fill="#ffffff" stroke="#ef4444" strokeWidth="2" />
          <polygon points="50,22 34,54 50,54" fill="#3b82f6" />
        </svg>
      );

    case 'bicycle':
      return (
        <svg viewBox="0 0 100 100" className={className} style={style} aria-label={alt || 'Bicycle'}>
          {/* Wheels */}
          <circle cx="28" cy="64" r="16" fill="none" stroke="#1e293b" strokeWidth="4" />
          <circle cx="72" cy="64" r="16" fill="none" stroke="#1e293b" strokeWidth="4" />
          {/* Frame */}
          <polygon points="28,64 48,64 62,46 44,46" fill="none" stroke="#06b6d4" strokeWidth="4" strokeLinejoin="round" />
          <line x1="48" y1="64" x2="44" y2="38" stroke="#06b6d4" strokeWidth="4" />
          <line x1="62" y1="46" x2="72" y2="64" stroke="#06b6d4" strokeWidth="4" />
          {/* Handlebars & Seat */}
          <line x1="60" y1="36" x2="68" y2="36" stroke="#1e293b" strokeWidth="4" strokeLinecap="round" />
          <line x1="40" y1="38" x2="48" y2="38" stroke="#1e293b" strokeWidth="4" strokeLinecap="round" />
        </svg>
      );

    /* ----------------------------------------------------
     * SCENES & ENVIRONMENTS
     * ---------------------------------------------------- */
    case 'space':
      return (
        <svg viewBox="0 0 100 100" className={className} style={style} aria-label={alt || 'Space'}>
          <rect width="100" height="100" rx="16" fill="#0f172a" />
          {/* Stars */}
          <circle cx="20" cy="20" r="1.5" fill="#fff" />
          <circle cx="82" cy="24" r="2" fill="#facc15" />
          <circle cx="70" cy="76" r="1.5" fill="#fff" />
          <circle cx="28" cy="80" r="2" fill="#fff" />
          {/* Saturn-like Ringed Planet */}
          <circle cx="50" cy="50" r="16" fill="#8b5cf6" />
          <ellipse cx="50" cy="50" rx="28" ry="6" fill="none" stroke="#f472b6" strokeWidth="3" transform="rotate(-20 50 50)" />
        </svg>
      );

    case 'forest':
      return (
        <svg viewBox="0 0 100 100" className={className} style={style} aria-label={alt || 'Forest'}>
          <rect width="100" height="100" rx="16" fill="#dcfce7" />
          {/* Hills */}
          <ellipse cx="30" cy="90" rx="40" ry="24" fill="#86efac" />
          <ellipse cx="76" cy="90" rx="36" ry="20" fill="#4ade80" />
          {/* Pine Trees */}
          <polygon points="50,26 36,46 64,46" fill="#15803d" />
          <polygon points="50,38 32,60 68,60" fill="#16a34a" />
          <rect x="46" y="60" width="8" height="14" fill="#78350f" />
          {/* Cute Mushroom */}
          <path d="M72 74 C72 66 86 66 86 74 Z" fill="#ef4444" />
          <circle cx="76" cy="70" r="1.5" fill="#fff" />
          <circle cx="82" cy="70" r="1.5" fill="#fff" />
          <rect x="77" y="74" width="4" height="6" fill="#fef08a" />
        </svg>
      );

    case 'island':
      return (
        <svg viewBox="0 0 100 100" className={className} style={style} aria-label={alt || 'Island'}>
          {/* Sea */}
          <rect width="100" height="100" rx="16" fill="#38bdf8" />
          {/* Sandy Mound */}
          <ellipse cx="50" cy="76" rx="40" ry="18" fill="#fde68a" />
          {/* Palm Trunk */}
          <path d="M46 72 Q52 50 64 36" stroke="#b45309" strokeWidth="5" strokeLinecap="round" fill="none" />
          {/* Palm Fronds */}
          <path d="M64 36 Q46 30 36 38" stroke="#16a34a" strokeWidth="4" fill="none" strokeLinecap="round" />
          <path d="M64 36 Q68 18 80 26" stroke="#16a34a" strokeWidth="4" fill="none" strokeLinecap="round" />
          <path d="M64 36 Q80 40 84 50" stroke="#16a34a" strokeWidth="4" fill="none" strokeLinecap="round" />
          {/* Coconuts */}
          <circle cx="62" cy="38" r="3" fill="#78350f" />
          <circle cx="66" cy="40" r="3" fill="#78350f" />
        </svg>
      );

    case 'kitchen':
      return (
        <svg viewBox="0 0 100 100" className={className} style={style} aria-label={alt || 'Kitchen'}>
          <rect width="100" height="100" rx="16" fill="#fef3c7" />
          {/* Chef Hat */}
          <path d="M36 40 C30 30 44 20 50 26 C56 20 70 30 64 40 Z" fill="#ffffff" stroke="#5fa8ff" strokeWidth="2" />
          <rect x="36" y="38" width="28" height="8" rx="2" fill="#ffffff" stroke="#5fa8ff" strokeWidth="2" />
          {/* Wooden Cutting Board */}
          <rect x="24" y="58" width="52" height="24" rx="4" fill="#d97706" />
          <rect x="28" y="62" width="44" height="16" rx="2" fill="#f59e0b" />
          <circle cx="29" cy="70" r="2" fill="#78350f" />
        </svg>
      );

    case 'treasure-chest':
    case 'treasure':
      return (
        <svg viewBox="0 0 100 100" className={className} style={style} aria-label={alt || 'Treasure Chest'}>
          {/* Sparkling Gold Coins */}
          <circle cx="44" cy="40" r="5" fill="#facc15" stroke="#ca8a04" strokeWidth="1" />
          <circle cx="56" cy="38" r="5.5" fill="#fde047" stroke="#ca8a04" strokeWidth="1" />
          <circle cx="50" cy="34" r="6" fill="#facc15" stroke="#ca8a04" strokeWidth="1" />
          {/* Rubies & Gems */}
          <polygon points="36,36 40,32 44,36 40,40" fill="#ef4444" />
          <polygon points="62,34 66,30 70,34 66,38" fill="#3b82f6" />
          {/* Chest Base */}
          <rect x="22" y="44" width="56" height="34" rx="4" fill="#92400e" stroke="#78350f" strokeWidth="2" />
          {/* Golden Bands */}
          <rect x="30" y="44" width="6" height="34" fill="#eab308" />
          <rect x="64" y="44" width="6" height="34" fill="#eab308" />
          {/* Keyhole Plate */}
          <circle cx="50" cy="58" r="5" fill="#facc15" />
          <polygon points="49,58 51,58 52,65 48,65" fill="#78350f" />
        </svg>
      );

    case 'balloons':
      return (
        <svg viewBox="0 0 100 100" className={className} style={style} aria-label={alt || 'Balloons'}>
          {/* Strings */}
          <path d="M34 56 Q46 72 50 90" stroke="#94a3b8" strokeWidth="1.5" fill="none" />
          <path d="M50 54 Q50 72 50 90" stroke="#94a3b8" strokeWidth="1.5" fill="none" />
          <path d="M66 56 Q54 72 50 90" stroke="#94a3b8" strokeWidth="1.5" fill="none" />
          {/* Cyan Balloon */}
          <ellipse cx="34" cy="40" rx="14" ry="18" fill="#06b6d4" />
          <polygon points="32,58 36,58 34,60" fill="#0891b2" />
          {/* Pink Balloon */}
          <ellipse cx="66" cy="42" rx="14" ry="18" fill="#ec4899" />
          <polygon points="64,60 68,60 66,62" fill="#be185d" />
          {/* Center Amber Balloon */}
          <ellipse cx="50" cy="34" rx="16" ry="20" fill="#f59e0b" />
          <polygon points="48,54 52,54 50,56" fill="#d97706" />
          <ellipse cx="46" cy="26" rx="3.5" ry="7" fill="#fff" opacity="0.5" transform="rotate(-20 46 26)" />
        </svg>
      );

    /* ----------------------------------------------------
     * OBJECTS & NATURE
     * ---------------------------------------------------- */
    case 'book':
      return (
        <svg viewBox="0 0 100 100" className={className} style={style} aria-label={alt || 'Book'}>
          {/* Open Book Wings */}
          <path d="M16 34 C30 32 46 36 50 40 L50 78 C46 74 30 70 16 72 Z" fill="#60a5fa" stroke="#2563eb" strokeWidth="2" />
          <path d="M84 34 C70 32 54 36 50 40 L50 78 C54 74 70 70 84 72 Z" fill="#f8fafc" stroke="#5fa8ff" strokeWidth="2" />
          {/* Left Pages */}
          <path d="M20 38 C32 36 44 40 48 44 L48 74 C44 70 32 66 20 68 Z" fill="#ffffff" />
          {/* Text Lines */}
          <line x1="26" y1="48" x2="42" y2="48" stroke="#93c5fd" strokeWidth="2" strokeLinecap="round" />
          <line x1="26" y1="56" x2="42" y2="56" stroke="#93c5fd" strokeWidth="2" strokeLinecap="round" />
          <line x1="58" y1="48" x2="74" y2="48" stroke="#5fa8ff" strokeWidth="2" strokeLinecap="round" />
          <line x1="58" y1="56" x2="74" y2="56" stroke="#5fa8ff" strokeWidth="2" strokeLinecap="round" />
        </svg>
      );

    case 'pencil':
      return (
        <svg viewBox="0 0 100 100" className={className} style={style} aria-label={alt || 'Pencil'}>
          {/* Eraser */}
          <rect x="22" y="24" width="14" height="12" rx="3" fill="#f43f5e" transform="rotate(45 28 30)" />
          {/* Wooden Shaft */}
          <polygon points="34,30 70,66 60,76 24,40" fill="#facc15" stroke="#ca8a04" strokeWidth="1.5" />
          {/* Sharpened Wood Cone */}
          <polygon points="68,64 78,74 86,86 74,78 64,68" fill="#fed7aa" />
          {/* Lead Tip */}
          <polygon points="80,80 86,86 82,86" fill="#1e293b" />
        </svg>
      );

    case 'sun':
      return (
        <svg viewBox="0 0 100 100" className={className} style={style} aria-label={alt || 'Sun'}>
          {/* Rays */}
          <g stroke="#f59e0b" strokeWidth="4" strokeLinecap="round">
            <line x1="50" y1="12" x2="50" y2="20" />
            <line x1="50" y1="80" x2="50" y2="88" />
            <line x1="12" y1="50" x2="20" y2="50" />
            <line x1="80" y1="50" x2="88" y2="50" />
            <line x1="24" y1="24" x2="30" y2="30" />
            <line x1="70" y1="70" x2="76" y2="76" />
            <line x1="24" y1="76" x2="30" y2="70" />
            <line x1="70" y1="30" x2="76" y2="24" />
          </g>
          {/* Center Face */}
          <circle cx="50" cy="50" r="24" fill="#facc15" />
          {/* Smiling Face */}
          <circle cx="42" cy="46" r="3" fill="#78350f" />
          <circle cx="58" cy="46" r="3" fill="#78350f" />
          <path d="M42 54 Q50 62 58 54" stroke="#78350f" strokeWidth="2.5" fill="none" strokeLinecap="round" />
          {/* Cheeks */}
          <circle cx="36" cy="52" r="3.5" fill="#f97316" opacity="0.6" />
          <circle cx="64" cy="52" r="3.5" fill="#f97316" opacity="0.6" />
        </svg>
      );

    case 'cloud':
      return (
        <svg viewBox="0 0 100 100" className={className} style={style} aria-label={alt || 'Cloud'}>
          <path
            d="M32 64 C22 64 16 56 18 46 C20 36 30 32 36 34 C40 22 56 20 64 28 C72 24 82 32 82 42 C88 46 88 58 80 64 Z"
            fill="#e0f2fe"
            stroke="#7dd3fc"
            strokeWidth="3"
          />
          {/* Cute face */}
          <circle cx="44" cy="46" r="2.5" fill="#0369a1" />
          <circle cx="56" cy="46" r="2.5" fill="#0369a1" />
          <path d="M47 52 Q50 56 53 52" stroke="#0369a1" strokeWidth="2" fill="none" strokeLinecap="round" />
        </svg>
      );

    case 'clock':
      return (
        <svg viewBox="0 0 100 100" className={className} style={style} aria-label={alt || 'Clock'}>
          <circle cx="50" cy="50" r="36" fill="#f8fafc" stroke="#3b82f6" strokeWidth="6" />
          <circle cx="50" cy="50" r="4" fill="#1e293b" />
          <line x1="50" y1="50" x2="50" y2="28" stroke="#1e293b" strokeWidth="4" strokeLinecap="round" />
          <line x1="50" y1="50" x2="68" y2="50" stroke="#ef4444" strokeWidth="3" strokeLinecap="round" />
        </svg>
      );

    /* ----------------------------------------------------
     * SCENARIO & GAME OBJECTS (Kids V4 Simulation Items)
     * ---------------------------------------------------- */
    case 'shopping-cart':
    case 'cart':
      return (
        <svg viewBox="0 0 100 100" className={className} style={style} aria-label={alt || 'Shopping Cart'}>
          {/* Basket Mesh */}
          <path d="M22 28 H82 L72 62 H30 Z" fill="#38bdf8" fillOpacity="0.25" stroke="#0284c7" strokeWidth="4" strokeLinejoin="round" />
          <line x1="42" y1="28" x2="38" y2="62" stroke="#0284c7" strokeWidth="2.5" />
          <line x1="62" y1="28" x2="54" y2="62" stroke="#0284c7" strokeWidth="2.5" />
          <line x1="26" y1="45" x2="77" y2="45" stroke="#0284c7" strokeWidth="2.5" />
          {/* Cart Handle & Frame */}
          <path d="M12 20 H22 L30 65 H76" stroke="#0369a1" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" fill="none" />
          {/* Wheels */}
          <circle cx="36" cy="76" r="7" fill="#334155" stroke="#0284c7" strokeWidth="3" />
          <circle cx="68" cy="76" r="7" fill="#334155" stroke="#0284c7" strokeWidth="3" />
          <circle cx="36" cy="76" r="2.5" fill="#f8fafc" />
          <circle cx="68" cy="76" r="2.5" fill="#f8fafc" />
        </svg>
      );

    case 'shelf':
      return (
        <svg viewBox="0 0 100 100" className={className} style={style} aria-label={alt || 'Supermarket Shelf'}>
          <rect x="8" y="15" width="84" height="70" rx="4" fill="#fed7aa" stroke="#b45309" strokeWidth="4" />
          <line x1="8" y1="40" x2="92" y2="40" stroke="#b45309" strokeWidth="5" strokeLinecap="round" />
          <line x1="8" y1="65" x2="92" y2="65" stroke="#b45309" strokeWidth="5" strokeLinecap="round" />
          <line x1="50" y1="15" x2="50" y2="85" stroke="#b45309" strokeWidth="3" />
        </svg>
      );

    case 'cheese':
      return (
        <svg viewBox="0 0 100 100" className={className} style={style} aria-label={alt || 'Cheese'}>
          <polygon points="15,68 85,68 75,32 40,32" fill="#facc15" stroke="#ca8a04" strokeWidth="3" strokeLinejoin="round" />
          <polygon points="40,32 75,32 85,42 50,42" fill="#fde047" />
          <circle cx="35" cy="54" r="5" fill="#ca8a04" opacity="0.3" />
          <circle cx="60" cy="50" r="7" fill="#ca8a04" opacity="0.3" />
          <circle cx="70" cy="60" r="4" fill="#ca8a04" opacity="0.3" />
        </svg>
      );

    case 'tomato':
      return (
        <svg viewBox="0 0 100 100" className={className} style={style} aria-label={alt || 'Tomato'}>
          <circle cx="50" cy="56" r="32" fill="#ef4444" stroke="#b91c1c" strokeWidth="3" />
          <ellipse cx="40" cy="45" rx="6" ry="12" fill="#f87171" opacity="0.6" transform="rotate(-25 40 45)" />
          {/* Calyx / Leaf */}
          <path d="M50 24 L52 14" stroke="#15803d" strokeWidth="4" strokeLinecap="round" />
          <path d="M50 24 Q40 22 36 28 Q44 26 50 26 Q56 26 64 28 Q60 22 50 24 Z" fill="#22c55e" />
        </svg>
      );

    case 'lettuce':
      return (
        <svg viewBox="0 0 100 100" className={className} style={style} aria-label={alt || 'Lettuce'}>
          <path d="M22 65 C15 45 30 25 50 25 C70 25 85 45 78 65 C70 80 30 80 22 65 Z" fill="#86efac" stroke="#16a34a" strokeWidth="3" />
          <path d="M30 60 C32 45 42 35 50 35 C58 35 68 45 70 60" stroke="#15803d" strokeWidth="3" fill="none" />
          <line x1="50" y1="35" x2="50" y2="72" stroke="#15803d" strokeWidth="3" strokeLinecap="round" />
        </svg>
      );

    case 'orange':
      return (
        <svg viewBox="0 0 100 100" className={className} style={style} aria-label={alt || 'Orange'}>
          <circle cx="50" cy="55" r="32" fill="#fb923c" stroke="#c2410c" strokeWidth="3" />
          <ellipse cx="40" cy="45" rx="5" ry="10" fill="#fdba74" opacity="0.6" transform="rotate(-20 40 45)" />
          <ellipse cx="50" cy="24" rx="8" ry="4" fill="#15803d" transform="rotate(15 50 24)" />
        </svg>
      );

    case 'footprints':
    case 'paw':
      return (
        <svg viewBox="0 0 100 100" className={className} style={style} aria-label={alt || 'Footprints'}>
          {/* Main pad */}
          <ellipse cx="50" cy="62" rx="18" ry="14" fill="#a16207" />
          {/* 4 Toes */}
          <circle cx="32" cy="40" r="7" fill="#a16207" />
          <circle cx="45" cy="34" r="8" fill="#a16207" />
          <circle cx="58" cy="34" r="8" fill="#a16207" />
          <circle cx="70" cy="42" r="7" fill="#a16207" />
        </svg>
      );

    case 'dog-house':
    case 'house':
      return (
        <svg viewBox="0 0 100 100" className={className} style={style} aria-label={alt || 'Dog House'}>
          {/* Main Walls */}
          <rect x="22" y="44" width="56" height="42" rx="3" fill="#fed7aa" stroke="#c2410c" strokeWidth="4" />
          {/* Door / Entry */}
          <path d="M40 86 V62 C40 54 60 54 60 62 V86 Z" fill="#78350f" />
          {/* Triangular Roof */}
          <polygon points="50,15 12,46 88,46" fill="#dc2626" stroke="#991b1b" strokeWidth="4" strokeLinejoin="round" />
          {/* Cute Bone sign above entry */}
          <ellipse cx="50" cy="51" rx="6" ry="2.5" fill="#f8fafc" />
        </svg>
      );

    case 'umbrella':
      return (
        <svg viewBox="0 0 100 100" className={className} style={style} aria-label={alt || 'Umbrella'}>
          <path d="M16 54 C16 30 32 18 50 18 C68 18 84 30 84 54 C72 50 62 56 50 52 C38 56 28 50 16 54 Z" fill="#f59e0b" stroke="#b45309" strokeWidth="3" />
          <line x1="50" y1="12" x2="50" y2="18" stroke="#78350f" strokeWidth="3" strokeLinecap="round" />
          <path d="M50 52 V78 C50 84 42 84 42 78" stroke="#78350f" strokeWidth="4" strokeLinecap="round" fill="none" />
        </svg>
      );

    case 'sunglasses':
      return (
        <svg viewBox="0 0 100 100" className={className} style={style} aria-label={alt || 'Sunglasses'}>
          <rect x="16" y="38" width="30" height="24" rx="8" fill="#1e293b" stroke="#0284c7" strokeWidth="3" />
          <rect x="54" y="38" width="30" height="24" rx="8" fill="#1e293b" stroke="#0284c7" strokeWidth="3" />
          <path d="M46 45 Q50 42 54 45" stroke="#0284c7" strokeWidth="3" fill="none" />
          <line x1="16" y1="44" x2="8" y2="38" stroke="#0284c7" strokeWidth="3" strokeLinecap="round" />
          <line x1="84" y1="44" x2="92" y2="38" stroke="#0284c7" strokeWidth="3" strokeLinecap="round" />
        </svg>
      );

    case 'jacket':
      return (
        <svg viewBox="0 0 100 100" className={className} style={style} aria-label={alt || 'Warm Jacket'}>
          <path d="M28 28 L12 55 L24 60 L32 44 V82 H68 V44 L76 60 L88 55 L72 28 Z" fill="#3b82f6" stroke="#1d4ed8" strokeWidth="3" strokeLinejoin="round" />
          <line x1="50" y1="28" x2="50" y2="82" stroke="#1e3a8a" strokeWidth="3" strokeDasharray="4 2" />
          <polygon points="40,28 50,38 60,28" fill="#93c5fd" />
        </svg>
      );

    case 'helmet':
      return (
        <svg viewBox="0 0 100 100" className={className} style={style} aria-label={alt || 'Space Helmet'}>
          <circle cx="50" cy="50" r="36" fill="#f1f5f9" stroke="#0284c7" strokeWidth="4" />
          <ellipse cx="50" cy="52" rx="26" ry="18" fill="#0f172a" stroke="#38bdf8" strokeWidth="3" />
          <ellipse cx="44" cy="46" rx="8" ry="4" fill="#38bdf8" opacity="0.6" transform="rotate(-15 44 46)" />
          <line x1="50" y1="14" x2="50" y2="8" stroke="#0284c7" strokeWidth="3" />
          <circle cx="50" cy="7" r="3" fill="#ef4444" />
        </svg>
      );

    case 'fuel-canister':
    case 'fuel':
      return (
        <svg viewBox="0 0 100 100" className={className} style={style} aria-label={alt || 'Fuel Canister'}>
          <rect x="28" y="32" width="44" height="52" rx="8" fill="#10b981" stroke="#047857" strokeWidth="4" />
          <rect x="42" y="20" width="16" height="12" rx="3" fill="#047857" />
          {/* Energy Bolt */}
          <polygon points="52,42 42,56 48,56 46,70 58,54 52,54" fill="#fef08a" stroke="#ca8a04" strokeWidth="1.5" />
        </svg>
      );

    case 'meteor':
      return (
        <svg viewBox="0 0 100 100" className={className} style={style} aria-label={alt || 'Meteor'}>
          <polygon points="25,30 45,18 78,28 85,55 70,82 38,80 18,60" fill="#78350f" stroke="#451a03" strokeWidth="4" strokeLinejoin="round" />
          <circle cx="42" cy="40" r="6" fill="#451a03" opacity="0.5" />
          <circle cx="62" cy="56" r="8" fill="#451a03" opacity="0.5" />
          <circle cx="38" cy="65" r="4" fill="#451a03" opacity="0.5" />
        </svg>
      );

    case 'alien-planet':
      return (
        <svg viewBox="0 0 100 100" className={className} style={style} aria-label={alt || 'Alien Planet'}>
          {/* Ring */}
          <ellipse cx="50" cy="52" rx="44" ry="14" fill="none" stroke="#e879f9" strokeWidth="6" transform="rotate(-18 50 52)" />
          {/* Sphere */}
          <circle cx="50" cy="50" r="30" fill="#8b5cf6" stroke="#6d28d9" strokeWidth="3" />
          <ellipse cx="40" cy="40" rx="8" ry="4" fill="#c084fc" opacity="0.5" />
        </svg>
      );

    case 'gold-key':
    case 'key':
      return (
        <svg viewBox="0 0 100 100" className={className} style={style} aria-label={alt || 'Golden Key'}>
          <circle cx="36" cy="42" r="16" fill="#facc15" stroke="#b45309" strokeWidth="3" />
          <circle cx="36" cy="42" r="7" fill="#fff" />
          <rect x="48" y="38" width="38" height="8" rx="2" fill="#facc15" stroke="#b45309" strokeWidth="2" />
          <rect x="74" y="46" width="6" height="12" rx="2" fill="#facc15" stroke="#b45309" strokeWidth="2" />
          <rect x="64" y="46" width="6" height="8" rx="2" fill="#facc15" stroke="#b45309" strokeWidth="2" />
        </svg>
      );

    case 'backpack':
      return (
        <svg viewBox="0 0 100 100" className={className} style={style} aria-label={alt || 'School Backpack'}>
          <rect x="26" y="28" width="48" height="56" rx="12" fill="#ec4899" stroke="#9d174d" strokeWidth="4" />
          <rect x="34" y="52" width="32" height="24" rx="6" fill="#f472b6" stroke="#9d174d" strokeWidth="2" />
          <path d="M42 28 V18 C42 14 58 14 58 18 V28" stroke="#9d174d" strokeWidth="4" fill="none" />
        </svg>
      );

    /* ----------------------------------------------------
     * ULTRA-SAFE DEFAULT FALLBACK (Never a broken box!)
     * ---------------------------------------------------- */
    default:
      return (
        <svg viewBox="0 0 100 100" className={className} style={style} aria-label={alt || name}>
          <circle cx="50" cy="50" r="40" fill="#fef08a" stroke="#f59e0b" strokeWidth="3" />
          <polygon points="50,22 58,38 76,40 62,54 66,72 50,62 34,72 38,54 24,40 42,38" fill="#f59e0b" />
          <circle cx="50" cy="50" r="10" fill="#ffffff" />
          <circle cx="50" cy="50" r="5" fill="#f59e0b" />
        </svg>
      );
  }
};
