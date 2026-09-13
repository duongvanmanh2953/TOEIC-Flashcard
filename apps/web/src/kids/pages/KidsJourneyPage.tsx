import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  KidsMapIcon,
  KidsStarIcon,
  KidsLockIcon,
  KidsTrophyIcon,
  KidsPlayIcon,
  KidsCheckIcon,
} from '../assets/icons/KidsIcons';
import { KidsMascot } from '../components/KidsMascot';
import { WORLDS_DATA, KidsWorld, KidsLesson } from '../curriculum/kidsCurriculum';
import { getKidsProgress } from '../curriculum/curriculumProgress';
import { soundManager } from '../services/sound/KidsSoundManager';
import { celebrationManager } from '../services/celebration/CelebrationManager';
import { HeroTreasureChest, HeroAchievementBadge } from '../assets/illustrations/KidsHeroAssets';
import {
  Play,
  RotateCcw,
  Lock,
  Flag,
  Compass,
  Sparkles,
  Mountain,
  Trees,
  Waves,
  Castle,
  Rocket,
  ChevronRight,
  Star,
  CheckCircle2,
} from 'lucide-react';

interface WorldBiomeConfig {
  id: string;
  name: string;
  subtitle: string;
  icon: React.ReactNode;
  gradient: string;
  border: string;
  trailColor: string;
  badgeBg: string;
}

const WORLD_BIOMES: WorldBiomeConfig[] = [
  {
    id: 'world-1-jungle',
    name: 'Rừng Rậm Diệu Kỳ',
    subtitle: 'Khám phá muông thú, màu sắc & lời chào đầu đời',
    icon: <Trees className="w-4 h-4 text-emerald-600" />,
    gradient: 'from-emerald-500 via-teal-600 to-emerald-700',
    border: 'border-emerald-400',
    trailColor: '#10b981',
    badgeBg: 'bg-emerald-50 text-emerald-900 border-emerald-300',
  },
  {
    id: 'world-2-city',
    name: 'Thành Phố Tương Lai',
    subtitle: 'Chế tạo robot, phương tiện & công trình hiện đại',
    icon: <Mountain className="w-4 h-4 text-sky-600" />,
    gradient: 'from-sky-500 via-indigo-600 to-blue-700',
    border: 'border-sky-400',
    trailColor: '#0284c7',
    badgeBg: 'bg-sky-50 text-sky-900 border-sky-300',
  },
  {
    id: 'world-3-ocean',
    name: 'Đại Dương Huyền Bí',
    subtitle: 'Lặn xuống biển sâu, khám phá rạn san hô & sinh vật biển',
    icon: <Waves className="w-4 h-4 text-cyan-600" />,
    gradient: 'from-cyan-500 via-teal-600 to-blue-700',
    border: 'border-cyan-400',
    trailColor: '#06b6d4',
    badgeBg: 'bg-cyan-50 text-cyan-900 border-cyan-300',
  },
  {
    id: 'world-4-castle',
    name: 'Lâu Đài Cổ Tích',
    subtitle: 'Giải cứu vương quốc từ vựng & mở khóa kho báu hoàng gia',
    icon: <Castle className="w-4 h-4 text-amber-600" />,
    gradient: 'from-amber-500 via-orange-500 to-rose-600',
    border: 'border-amber-400',
    trailColor: '#f59e0b',
    badgeBg: 'bg-amber-50 text-amber-900 border-amber-300',
  },
  {
    id: 'world-5-space',
    name: 'Trạm Vũ Trụ Không Gian',
    subtitle: 'Du hành giữa các vì sao & chinh phục đỉnh cao tiếng Anh',
    icon: <Rocket className="w-4 h-4 text-indigo-600" />,
    gradient: 'from-indigo-600 via-purple-600 to-slate-900',
    border: 'border-indigo-400',
    trailColor: '#6366f1',
    badgeBg: 'bg-indigo-50 text-indigo-900 border-indigo-300',
  },
];

export const KidsJourneyPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [progress, setProgress] = useState(getKidsProgress());

  // Current selected world
  const initialWorldId = searchParams.get('world') || WORLDS_DATA[0].id;
  const [selectedWorldId, setSelectedWorldId] = useState(initialWorldId);

  useEffect(() => {
    setProgress(getKidsProgress());
  }, []);

  const currentWorld: KidsWorld =
    WORLDS_DATA.find((w) => w.id === selectedWorldId) || WORLDS_DATA[0];

  const currentBiome =
    WORLD_BIOMES.find((b) => b.id === currentWorld.id) || WORLD_BIOMES[0];

  const isWorldUnlocked =
    currentWorld.id === WORLDS_DATA[0].id ||
    (progress.unlockedWorlds || []).includes(currentWorld.id);

  // Flatten lessons in current world with chapter context
  const allWorldLessons: { lesson: KidsLesson; chapterTitle: string; index: number }[] = [];
  let globalLessonIdx = 0;
  currentWorld.chapters.forEach((chap) => {
    chap.lessons.forEach((lesson) => {
      allWorldLessons.push({
        lesson,
        chapterTitle: chap.title,
        index: globalLessonIdx++,
      });
    });
  });

  const handleSelectLesson = (lesson: KidsLesson, isUnlocked: boolean) => {
    if (isUnlocked) {
      soundManager.playDing();
      navigate(`/kids/lesson/${lesson.id}`);
    } else {
      soundManager.playIncorrect();
      celebrationManager.speakPraise('Bé hãy hoàn thành các trạm đèo phía trước để mở khóa nhé!');
    }
  };

  // Find active lesson index
  let activeLessonIdx = 0;
  for (let i = 0; i < allWorldLessons.length; i++) {
    const lId = allWorldLessons[i].lesson.id;
    const isUnlocked =
      ((i === 0 && isWorldUnlocked) || (progress.unlockedLessons || []).includes(lId)) && isWorldUnlocked;
    const score = (progress.lessonScores || {})[lId];
    if (isUnlocked && (!score || score.stars === 0)) {
      activeLessonIdx = i;
      break;
    }
    if (isUnlocked) {
      activeLessonIdx = i;
    }
  }

  const activeLesson = allWorldLessons[activeLessonIdx]?.lesson;

  // Calculate completed stations count
  const completedCount = allWorldLessons.filter(
    (item) => ((progress.lessonScores || {})[item.lesson.id]?.stars || 0) > 0
  ).length;

  return (
    <div className="space-y-6 sm:space-y-8 animate-fadeIn max-w-4xl mx-auto pb-6 select-none">
      {/* ================================================================ */}
      {/* 1. REALM BIOMES SELECTOR (CLEAN TACTILE PILL TABS)               */}
      {/* ================================================================ */}
      <div className="flex items-center gap-2.5 overflow-x-auto pb-2 scrollbar-none">
        {WORLDS_DATA.map((world, wIdx) => {
          const biome = WORLD_BIOMES[wIdx] || WORLD_BIOMES[0];
          const unlocked = wIdx === 0 || (progress.unlockedWorlds || []).includes(world.id);
          const active = world.id === selectedWorldId;

          return (
            <button
              key={world.id}
              onClick={() => {
                soundManager.playPop();
                setSelectedWorldId(world.id);
              }}
              className={`flex items-center gap-2.5 px-4 py-2.5 rounded-2xl font-black text-xs sm:text-sm whitespace-nowrap transition-all cursor-pointer border-2 ${
                active
                  ? 'bg-amber-400 text-amber-950 border-amber-500 shadow-sm scale-102'
                  : 'bg-white text-slate-700 border-slate-200 hover:border-amber-300 hover:bg-amber-50/50'
              }`}
            >
              <div className="shrink-0">{biome.icon}</div>
              <span>{world.title}</span>
              {!unlocked && (
                <span className="text-[10px] bg-slate-200 text-slate-600 px-1.5 py-0.5 rounded-full font-bold inline-flex items-center gap-0.5">
                  <Lock className="w-2.5 h-2.5" />
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* ================================================================ */}
      {/* 2. ADVENTURE WORLD HEADER (ATMOSPHERIC CINEMATIC BANNER)         */}
      {/* ================================================================ */}
      <div
        className={`relative overflow-hidden rounded-3xl bg-gradient-to-r ${currentBiome.gradient} text-white p-5 sm:p-7 lg:p-8 border-2 ${currentBiome.border} shadow-sm`}
      >
        <div className="relative z-10 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-5 sm:gap-6">
          <div className="space-y-2 max-w-xl min-w-0 flex-1">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/20 backdrop-blur-md text-[11px] sm:text-xs font-black uppercase tracking-wider border border-white/30">
              <KidsMapIcon size={16} />
              <span>Cung Đường Thám Hiểm</span>
              <span>•</span>
              <span>Cấp độ {currentWorld.level}</span>
            </div>
            <h1 className="text-xl sm:text-2xl lg:text-3xl font-black tracking-tight text-white">
              {currentWorld.title}
            </h1>
            <p className="text-white/90 font-medium text-xs sm:text-sm leading-relaxed">
              {currentBiome.subtitle}
            </p>
          </div>

          {/* Expedition Quick Milestone Box */}
          <div className="bg-white/15 backdrop-blur-md p-3 sm:p-4 rounded-2xl border border-white/30 flex items-center gap-3 sm:gap-4 shrink-0 shadow-xs self-stretch sm:self-auto">
            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-amber-400 text-amber-950 flex items-center justify-center font-black shadow-xs shrink-0">
              <Flag className="w-5 h-5 sm:w-6 sm:h-6" />
            </div>
            <div>
              <p className="text-[10px] font-black uppercase tracking-wider text-white/80">Tiến độ chặng</p>
              <p className="text-sm sm:text-base font-black text-white">
                {completedCount} / {allWorldLessons.length} Trạm
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* ================================================================ */}
      {/* 3. BOBBY EXPEDITION COMPANION BAR (NEXT STATION JUMP)            */}
      {/* ================================================================ */}
      <div className="bg-amber-50/90 p-4 sm:p-5 rounded-3xl border-2 border-amber-300 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-xs">
        <div className="flex items-center gap-4 text-center sm:text-left">
          <div
            onClick={() => {
              soundManager.playPop();
            }}
            className="shrink-0"
          >
            <KidsMascot mood="excited" size={52} />
          </div>
          <div>
            <span className="text-[11px] font-black px-2.5 py-0.5 rounded-full bg-amber-200 text-amber-950 border border-amber-300 inline-flex items-center gap-1">
              <Compass className="w-3.5 h-3.5 text-amber-800" />
              Bạn Đồng Hành Bobby
            </span>
            <h3 className="font-black text-slate-900 text-base sm:text-lg mt-0.5">
              Trạm kế tiếp: {activeLesson ? activeLesson.title : 'Đỉnh Vinh Quang'}
            </h3>
            <p className="text-xs font-semibold text-amber-900/80">
              Vượt qua từng trạm để thu thập ngôi sao và cắm cờ tại đỉnh núi!
            </p>
          </div>
        </div>

        {activeLesson && (
          <button
            onClick={() => handleSelectLesson(activeLesson, true)}
            className="w-full sm:w-auto px-6 py-3.5 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white font-black text-xs sm:text-sm flex items-center justify-center gap-2 border-b-4 border-emerald-700 cursor-pointer active:scale-95 shrink-0 shadow-sm"
          >
            <KidsPlayIcon size={18} />
            <span>VÀO TRẠM NÀY NGAY</span>
            <Play className="w-4 h-4 fill-current" />
          </button>
        )}
      </div>

      {/* ================================================================ */}
      {/* 4. ADVENTURE WORLD: CONTINUOUS SVG PATH MOUNTAIN ROADMAP         */}
      {/* ================================================================ */}
      <div className="relative rounded-3xl bg-gradient-to-b from-emerald-100 via-green-50 to-emerald-200/90 border-3 border-emerald-400 p-3 sm:p-8 overflow-hidden shadow-md select-none">
        
        {/* Atmosphere Background Silhouette (Layer 1: Behind Path) */}
        <div className="absolute inset-0 pointer-events-none opacity-30 overflow-hidden">
          <svg viewBox="0 0 700 1400" className="w-full h-full object-cover">
            <path d="M0,1400 L200,900 L400,1100 L600,750 L700,950 L700,1400 Z" fill="#86efac" />
            <path d="M0,950 L150,650 L350,800 L550,500 L700,650 L700,1400 L0,1400 Z" fill="#bbf7d0" />
          </svg>
        </div>

        {/* DATA-DRIVEN CONTINUOUS SVG ROADMAP CANVAS */}
        {(() => {
          const CANVAS_WIDTH = 700;
          const NODE_SPACING_Y = 220; // Expanded generous vertical height for majestic winding mountain trail
          const TOP_OFFSET = 260;     // Space for majestic Summit & Golden Treasure Chest
          const BOTTOM_OFFSET = 180;  // Space for Trailhead Entrance Gate
          const N = allWorldLessons.length;
          const CANVAS_HEIGHT = Math.max(900, N * NODE_SPACING_Y + TOP_OFFSET + BOTTOM_OFFSET);

          const summitPoint = { x: 350, y: 120 };
          const startPoint = { x: 350, y: CANVAS_HEIGHT - 70 };

          // Build exact (x, y) coordinates for each station node
          const roadmapNodes: Array<{
            id: string;
            lesson: KidsLesson;
            chapterTitle: string;
            index: number;
            x: number;
            y: number;
            status: 'completed' | 'current' | 'locked';
            stars: number;
            isUnlocked: boolean;
          }> = allWorldLessons.map((item, idx) => {
            const isUnlocked =
              ((item.index === 0 && isWorldUnlocked) ||
                (progress.unlockedLessons || []).includes(item.lesson.id)) &&
              isWorldUnlocked;
            const score = (progress.lessonScores || {})[item.lesson.id];
            const stars = score?.stars || 0;
            const isCurrent = item.index === activeLessonIdx;
            const status = isCurrent ? 'current' : stars > 0 ? 'completed' : 'locked';

            // Y ascends gracefully from bottom to top with tall spacing
            const y = CANVAS_HEIGHT - BOTTOM_OFFSET - idx * NODE_SPACING_Y;
            // X alternates smoothly: left (190) to right (510)
            const x = idx % 2 === 0 ? 190 : 510;

            return {
              id: item.lesson.id,
              lesson: item.lesson,
              chapterTitle: item.chapterTitle,
              index: item.index,
              x,
              y,
              status,
              stars,
              isUnlocked,
            };
          });

          // 1. Build Single Continuous Cubic Bézier Path (Starting Gate -> Station 0 -> ... -> Station N-1 -> Summit)
          let fullPathD = `M ${startPoint.x} ${startPoint.y}`;
          if (roadmapNodes.length > 0) {
            const n0 = roadmapNodes[0];
            const dy0 = n0.y - startPoint.y;
            fullPathD += ` C ${startPoint.x} ${startPoint.y + dy0 * 0.45}, ${n0.x} ${n0.y - dy0 * 0.45}, ${n0.x} ${n0.y}`;
          }

          for (let i = 0; i < roadmapNodes.length - 1; i++) {
            const curr = roadmapNodes[i];
            const next = roadmapNodes[i + 1];
            const dy = next.y - curr.y;
            const cp1x = curr.x;
            const cp1y = curr.y + dy * 0.45;
            const cp2x = next.x;
            const cp2y = next.y - dy * 0.45;
            fullPathD += ` C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${next.x} ${next.y}`;
          }

          // Connect top station to summit
          if (roadmapNodes.length > 0) {
            const lastNode = roadmapNodes[roadmapNodes.length - 1];
            const dy = summitPoint.y - lastNode.y;
            fullPathD += ` C ${lastNode.x} ${lastNode.y + dy * 0.5}, ${summitPoint.x} ${summitPoint.y - dy * 0.5}, ${summitPoint.x} ${summitPoint.y}`;
          }

          // 2. Build Completed Highway Path (Up to activeLessonIdx)
          let completedPathD = '';
          if (roadmapNodes.length > 0 && activeLessonIdx >= 0) {
            completedPathD = `M ${startPoint.x} ${startPoint.y}`;
            const n0 = roadmapNodes[0];
            const dy0 = n0.y - startPoint.y;
            completedPathD += ` C ${startPoint.x} ${startPoint.y + dy0 * 0.45}, ${n0.x} ${n0.y - dy0 * 0.45}, ${n0.x} ${n0.y}`;

            const targetIdx = Math.min(activeLessonIdx, roadmapNodes.length - 1);
            for (let i = 0; i < targetIdx; i++) {
              const curr = roadmapNodes[i];
              const next = roadmapNodes[i + 1];
              const dy = next.y - curr.y;
              const cp1x = curr.x;
              const cp1y = curr.y + dy * 0.45;
              const cp2x = next.x;
              const cp2y = next.y - dy * 0.45;
              completedPathD += ` C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${next.x} ${next.y}`;
            }
          }

          // 3. Generate Rich Scattered Grass Tufts & Patches (Điểm cỏ đồng cỏ xanh)
          const grassPatches: Array<{
            id: string;
            x: number;
            y: number;
            type: 'tuftA' | 'tuftB' | 'small' | 'pebble' | 'clover';
            scale: number;
          }> = [];

          const totalTiers = N + 2;
          for (let tier = 0; tier <= totalTiers; tier++) {
            const baseY = CANVAS_HEIGHT - 60 - tier * (CANVAS_HEIGHT / (totalTiers + 1));
            grassPatches.push(
              {
                id: `g_l_far_${tier}`,
                x: 35 + ((tier * 47) % 65),
                y: baseY - 20 + ((tier * 31) % 45),
                type: tier % 3 === 0 ? 'tuftB' : 'tuftA',
                scale: 0.9 + ((tier % 3) * 0.12),
              },
              {
                id: `g_l_mid_${tier}`,
                x: 120 + ((tier * 37) % 55),
                y: baseY + 35 - ((tier * 19) % 50),
                type: tier % 2 === 0 ? 'clover' : 'small',
                scale: 0.85 + ((tier % 2) * 0.15),
              },
              {
                id: `g_ctr_${tier}`,
                x: 320 + (((tier * 59) % 70) - 35),
                y: baseY - 50,
                type: tier % 2 === 0 ? 'tuftB' : 'tuftA',
                scale: 0.8,
              },
              {
                id: `g_r_mid_${tier}`,
                x: 525 + ((tier * 41) % 50),
                y: baseY + 20 - ((tier * 29) % 45),
                type: tier % 3 === 1 ? 'clover' : 'small',
                scale: 0.85,
              },
              {
                id: `g_r_far_${tier}`,
                x: 615 + ((tier * 53) % 55),
                y: baseY - 15 + ((tier * 23) % 40),
                type: tier % 4 === 0 ? 'pebble' : 'tuftA',
                scale: 0.95,
              }
            );
          }

          return (
            <div className="relative w-full max-w-3xl mx-auto select-none">
              <svg
                viewBox={`0 0 ${CANVAS_WIDTH} ${CANVAS_HEIGHT}`}
                className="w-full h-auto overflow-visible"
                style={{ filter: 'drop-shadow(0 6px 14px rgba(16,185,129,0.08))' }}
              >
                <defs>
                  {/* Soft Meadow Gradient Background */}
                  <linearGradient id="meadowGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                    <stop offset="0%" stopColor="#ecfdf5" />
                    <stop offset="50%" stopColor="#d1fae5" />
                    <stop offset="100%" stopColor="#bbf7d0" />
                  </linearGradient>

                  {/* Completed / Active Road Gradient */}
                  <linearGradient id="completedRoadGrad" x1="0%" y1="100%" x2="0%" y2="0%">
                    <stop offset="0%" stopColor="#10b981" />
                    <stop offset="50%" stopColor="#f59e0b" />
                    <stop offset="100%" stopColor="#fbbf24" />
                  </linearGradient>

                  {/* Node Gradients */}
                  <radialGradient id="completedNodeGrad" cx="35%" cy="35%" r="65%">
                    <stop offset="0%" stopColor="#34d399" />
                    <stop offset="100%" stopColor="#059669" />
                  </radialGradient>
                  <radialGradient id="currentNodeGrad" cx="35%" cy="35%" r="65%">
                    <stop offset="0%" stopColor="#fde047" />
                    <stop offset="100%" stopColor="#d97706" />
                  </radialGradient>
                  <radialGradient id="lockedNodeGrad" cx="35%" cy="35%" r="65%">
                    <stop offset="0%" stopColor="#ffffff" />
                    <stop offset="100%" stopColor="#cbd5e1" />
                  </radialGradient>

                  {/* SVG Grass Tufts (Điểm Cỏ Xanh & Hoa Đồng Nội) */}
                  <g id="grassTuftA">
                    <ellipse cx="0" cy="8" rx="14" ry="4" fill="#065f46" fillOpacity="0.15" />
                    <path d="M-6 8 C-10 2, -14 -6, -16 -12 C-13 -6, -8 0, -4 8" fill="#16a34a" />
                    <path d="M-3 8 C-4 -2, -2 -14, 0 -20 C2 -14, 2 -2, 3 8" fill="#22c55e" />
                    <path d="M2 8 C6 2, 12 -4, 15 -8 C11 -4, 6 2, 4 8" fill="#15803d" />
                    <path d="M-1 8 C2 4, 6 0, 8 -3 C6 2, 3 5, 1 8" fill="#4ade80" />
                  </g>

                  <g id="grassTuftB">
                    <ellipse cx="0" cy="8" rx="16" ry="5" fill="#065f46" fillOpacity="0.16" />
                    <path d="M-7 8 C-12 1, -16 -7, -18 -13 C-14 -7, -9 -1, -5 8" fill="#15803d" />
                    <path d="M-4 8 C-5 -3, -3 -15, -1 -22 C1 -15, 1 -3, 2 8" fill="#22c55e" />
                    <path d="M3 8 C7 1, 14 -5, 17 -10 C13 -5, 7 1, 5 8" fill="#16a34a" />
                    {/* Little daisy flower */}
                    <path d="M-1 8 C-1 0, 4 -8, 6 -14" stroke="#15803d" strokeWidth="2" strokeLinecap="round" fill="none" />
                    <circle cx="6" cy="-14" r="5" fill="#ffffff" />
                    <circle cx="6" cy="-14" r="2.5" fill="#fbbf24" />
                  </g>

                  <g id="grassTuftSmall">
                    <path d="M-4 5 C-7 0, -10 -5, -11 -9 C-9 -4, -6 1, -3 5" fill="#16a34a" />
                    <path d="M-2 5 C-3 -1, -1 -9, 1 -13 C2 -9, 2 -1, 2 5" fill="#22c55e" />
                    <path d="M1 5 C4 1, 8 -3, 9 -6 C7 -2, 4 2, 3 5" fill="#15803d" />
                  </g>

                  <g id="cloverPatch">
                    <circle cx="-4" cy="0" r="4.5" fill="#22c55e" />
                    <circle cx="4" cy="0" r="4.5" fill="#16a34a" />
                    <circle cx="0" cy="-5" r="4.5" fill="#4ade80" />
                    <path d="M0 0 L0 8" stroke="#15803d" strokeWidth="2" strokeLinecap="round" />
                  </g>

                  <g id="pebbleCluster">
                    <ellipse cx="-4" cy="2" rx="5" ry="3" fill="#94a3b8" />
                    <ellipse cx="4" cy="3" rx="4" ry="2.5" fill="#cbd5e1" />
                    <ellipse cx="1" cy="-1" rx="3" ry="2" fill="#64748b" />
                  </g>
                </defs>

                {/* -------------------------------------------------------- */}
                {/* 0. MEADOW GREEN BASE & ROLLING HILL CONTOURS             */}
                {/* -------------------------------------------------------- */}
                <rect width={CANVAS_WIDTH} height={CANVAS_HEIGHT} fill="url(#meadowGrad)" rx="28" />

                {/* Rolling Grass Hills Silhouette Contours */}
                <path
                  d={`M0,${CANVAS_HEIGHT} L0,${CANVAS_HEIGHT * 0.8} Q180,${CANVAS_HEIGHT * 0.74} 350,${CANVAS_HEIGHT * 0.82} T700,${CANVAS_HEIGHT * 0.76} L700,${CANVAS_HEIGHT} Z`}
                  fill="#86efac"
                  opacity="0.45"
                />
                <path
                  d={`M0,${CANVAS_HEIGHT * 0.8} L0,${CANVAS_HEIGHT * 0.54} Q200,${CANVAS_HEIGHT * 0.46} 420,${CANVAS_HEIGHT * 0.56} T700,${CANVAS_HEIGHT * 0.48} L700,${CANVAS_HEIGHT} L0,${CANVAS_HEIGHT} Z`}
                  fill="#bbf7d0"
                  opacity="0.5"
                />
                <path
                  d={`M0,${CANVAS_HEIGHT * 0.54} L0,${CANVAS_HEIGHT * 0.28} Q150,${CANVAS_HEIGHT * 0.2} 380,${CANVAS_HEIGHT * 0.26} T700,${CANVAS_HEIGHT * 0.22} L700,${CANVAS_HEIGHT} L0,${CANVAS_HEIGHT} Z`}
                  fill="#86efac"
                  opacity="0.35"
                />

                {/* -------------------------------------------------------- */}
                {/* 1. SCATTERED GRASS TUFTS & WILDFLOWER PATCHES (Điểm Cỏ)  */}
                {/* -------------------------------------------------------- */}
                {grassPatches.map((patch) => {
                  const href =
                    patch.type === 'tuftB'
                      ? '#grassTuftB'
                      : patch.type === 'small'
                      ? '#grassTuftSmall'
                      : patch.type === 'clover'
                      ? '#cloverPatch'
                      : patch.type === 'pebble'
                      ? '#pebbleCluster'
                      : '#grassTuftA';

                  return (
                    <use
                      key={patch.id}
                      href={href}
                      x={patch.x}
                      y={patch.y}
                      transform={`scale(${patch.scale})`}
                      transform-origin={`${patch.x} ${patch.y}`}
                      opacity="0.9"
                    />
                  );
                })}

                {/* -------------------------------------------------------- */}
                {/* 2. BASE TRACK: FULL HIGHWAY (High-contrast stone path)   */}
                {/* -------------------------------------------------------- */}
                {/* Outer Road Grass Shadow */}
                <path
                  d={fullPathD}
                  fill="none"
                  stroke="#047857"
                  strokeWidth="36"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  opacity="0.14"
                />
                {/* Outer Stone Foundation Highway */}
                <path
                  d={fullPathD}
                  fill="none"
                  stroke="#ffffff"
                  strokeWidth="30"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                {/* Cobblestone Texture Inner Trail */}
                <path
                  d={fullPathD}
                  fill="none"
                  stroke="#e2e8f0"
                  strokeWidth="24"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                {/* High Contrast Center Lane Stepping Stones */}
                <path
                  d={fullPathD}
                  fill="none"
                  stroke="#94a3b8"
                  strokeWidth="5"
                  strokeDasharray="14 10"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  opacity="0.85"
                />

                {/* -------------------------------------------------------- */}
                {/* 3. COMPLETED / ACTIVE TRAIL (Vibrant Glow Highway)        */}
                {/* -------------------------------------------------------- */}
                {completedPathD && (
                  <>
                    <path
                      d={completedPathD}
                      fill="none"
                      stroke="url(#completedRoadGrad)"
                      strokeWidth="20"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                    <path
                      d={completedPathD}
                      fill="none"
                      stroke="#ffffff"
                      strokeWidth="3.5"
                      strokeDasharray="8 8"
                      strokeLinecap="round"
                      opacity="0.85"
                    />
                  </>
                )}

                {/* -------------------------------------------------------- */}
                {/* 4. STARTING TRAILHEAD GATE (At the bottom of the map)    */}
                {/* -------------------------------------------------------- */}
                <g transform={`translate(${startPoint.x}, ${startPoint.y})`}>
                  {/* Ground shadow & pedestal */}
                  <ellipse cx="0" cy="14" rx="42" ry="14" fill="#047857" fillOpacity="0.2" />
                  <circle cx="0" cy="0" r="30" fill="#10b981" stroke="#047857" strokeWidth="4" />
                  <circle cx="0" cy="0" r="36" fill="none" stroke="#6ee7b7" strokeWidth="2" strokeDasharray="5 5" />
                  
                  {/* Flag Icon */}
                  <foreignObject width="36" height="36" x="-18" y="-18">
                    <div className="w-full h-full flex items-center justify-center text-xl select-none">
                      🏁
                    </div>
                  </foreignObject>

                  {/* Trailhead Pill Label */}
                  <foreignObject width="180" height="40" x="-90" y="34">
                    <div className="text-center">
                      <span className="px-3 py-1 rounded-full bg-emerald-800 text-emerald-100 font-black text-[10px] tracking-wider uppercase border border-emerald-600 shadow-sm inline-flex items-center gap-1">
                        <span>CỔNG XUẤT PHÁT</span>
                      </span>
                    </div>
                  </foreignObject>
                </g>

                {/* -------------------------------------------------------- */}
                {/* 5. SUMMIT CITADEL: GOLDEN TREASURE CHEST AT THE TOP      */}
                {/* -------------------------------------------------------- */}
                <g transform={`translate(${summitPoint.x}, ${summitPoint.y})`}>
                  {/* Summit Base Pedestal */}
                  <ellipse cx="0" cy="20" rx="72" ry="24" fill="#047857" fillOpacity="0.2" />
                  <circle cx="0" cy="10" r="56" fill="#fef3c7" stroke="#f59e0b" strokeWidth="4" />
                  <circle cx="0" cy="10" r="66" fill="none" stroke="#fbbf24" strokeWidth="2" strokeDasharray="6 6" className="animate-spin-slow" />
                  
                  {/* Treasure Chest Icon / Artwork */}
                  <g transform="translate(-48, -48)">
                    <foreignObject width="96" height="96">
                      <div className="w-full h-full flex items-center justify-center">
                        <HeroTreasureChest isOpen={completedCount === allWorldLessons.length} size={84} />
                      </div>
                    </foreignObject>
                  </g>

                  {/* Summit Flag & Label */}
                  <foreignObject width="240" height="70" x="-120" y="70">
                    <div className="text-center space-y-0.5">
                      <span className="px-3 py-1 rounded-full bg-amber-500 text-white font-black text-xs border border-amber-600 shadow-xs inline-flex items-center gap-1">
                        <Sparkles className="w-3.5 h-3.5" />
                        <span>ĐỈNH VINH QUANG</span>
                      </span>
                      <p className="text-[11px] font-bold text-slate-600">
                        {completedCount === allWorldLessons.length ? 'Đã mở trọn vẹn!' : `${completedCount} / ${allWorldLessons.length} Trạm`}
                      </p>
                    </div>
                  </foreignObject>
                </g>

                {/* -------------------------------------------------------- */}
                {/* 6. EXACT PATH WAYPOINT NODES & INTERACTIVE CARDS         */}
                {/* -------------------------------------------------------- */}
                {roadmapNodes.map((node) => {
                  const isCurrent = node.status === 'current';
                  const isCompleted = node.status === 'completed';
                  const isLeft = node.x < 350;

                  return (
                    <g key={node.id} transform={`translate(${node.x}, ${node.y})`}>
                      {/* Active Node Pulsing Aura Ring */}
                      {isCurrent && (
                        <>
                          <circle cx="0" cy="0" r="48" fill="none" stroke="#f59e0b" strokeWidth="4" opacity="0.4" className="animate-ping" />
                          <circle cx="0" cy="0" r="42" fill="none" stroke="#fbbf24" strokeWidth="4" />
                        </>
                      )}

                      {/* Tactile Station Disc (Radius 34px) */}
                      <circle
                        cx="0"
                        cy="0"
                        r="34"
                        fill={
                          isCurrent
                            ? 'url(#currentNodeGrad)'
                            : isCompleted
                            ? 'url(#completedNodeGrad)'
                            : 'url(#lockedNodeGrad)'
                        }
                        stroke={
                          isCurrent
                            ? '#b45309'
                            : isCompleted
                            ? '#047857'
                            : '#94a3b8'
                        }
                        strokeWidth="4"
                        className="cursor-pointer transition-transform duration-200 hover:scale-110 shadow-md"
                        onClick={() => handleSelectLesson(node.lesson, node.isUnlocked)}
                      />

                      {/* Waypoint Number Pill */}
                      <g transform="translate(0, -38)">
                        <rect
                          x="-18"
                          y="-10"
                          width="36"
                          height="20"
                          rx="10"
                          fill={isCurrent ? '#f59e0b' : isCompleted ? '#10b981' : '#64748b'}
                          stroke="#ffffff"
                          strokeWidth="2"
                        />
                        <text
                          x="0"
                          y="4"
                          textAnchor="middle"
                          fill="#ffffff"
                          fontSize="11"
                          fontWeight="900"
                        >
                          #{node.index + 1}
                        </text>
                      </g>

                      {/* Node Center Icon */}
                      {isCompleted ? (
                        <g transform="translate(-12, -12)" pointerEvents="none">
                          <foreignObject width="24" height="24">
                            <CheckCircle2 className="w-6 h-6 text-white" />
                          </foreignObject>
                        </g>
                      ) : isCurrent ? (
                        <g transform="translate(-10, -10)" pointerEvents="none">
                          <foreignObject width="20" height="20">
                            <Play className="w-5 h-5 fill-white text-white" />
                          </foreignObject>
                        </g>
                      ) : (
                        <g transform="translate(-10, -10)" pointerEvents="none">
                          <foreignObject width="20" height="20">
                            <Lock className="w-5 h-5 text-slate-500" />
                          </foreignObject>
                        </g>
                      )}

                      {/* Bobby Mascot Pin (Current Node Only) */}
                      {isCurrent && (
                        <g transform="translate(0, -68)">
                          <foreignObject width="140" height="34" x="-70" y="-10">
                            <div className="flex items-center justify-center">
                              <span className="px-2.5 py-1 rounded-full bg-amber-500 border-2 border-white text-white font-black text-[10px] shadow-md animate-bounce flex items-center gap-1 whitespace-nowrap">
                                <span>Bé ở đây 📍</span>
                              </span>
                            </div>
                          </foreignObject>
                        </g>
                      )}

                      {/* Interactive Station Info Card (Adjacent to Node) */}
                      <foreignObject
                        width="240"
                        height="110"
                        x={isLeft ? 46 : -286}
                        y={-50}
                      >
                        <div
                          onClick={() => handleSelectLesson(node.lesson, node.isUnlocked)}
                          className={`p-3.5 rounded-2xl border-2 transition-all cursor-pointer bg-white shadow-sm flex flex-col justify-between h-full ${
                            isCurrent
                              ? 'border-amber-400 bg-amber-50/70 ring-2 ring-amber-300/60'
                              : isCompleted
                              ? 'border-emerald-200 hover:border-emerald-400'
                              : 'border-slate-200 opacity-80'
                          }`}
                        >
                          <div>
                            <div className="flex items-center justify-between gap-1">
                              <span className="text-[10px] font-black uppercase text-slate-500 tracking-wider">
                                {node.chapterTitle}
                              </span>
                              {node.stars > 0 && (
                                <div className="flex items-center text-amber-400">
                                  {[1, 2, 3].map((s) => (
                                    <Star
                                      key={s}
                                      className={`w-3 h-3 ${
                                        s <= node.stars ? 'fill-amber-400 text-amber-500' : 'text-slate-200'
                                      }`}
                                    />
                                  ))}
                                </div>
                              )}
                            </div>
                            <h4 className="font-black text-slate-900 text-xs sm:text-sm truncate mt-0.5">
                              {node.lesson.title}
                            </h4>
                          </div>

                          <div className="flex items-center justify-end">
                            {isCurrent ? (
                              <span className="px-3 py-1 rounded-xl bg-amber-400 text-amber-950 font-black text-xs border border-amber-500 shadow-xs flex items-center gap-1">
                                <span>BẮT ĐẦU</span>
                                <Play className="w-3 h-3 fill-current" />
                              </span>
                            ) : isCompleted ? (
                              <span className="px-2.5 py-0.5 rounded-xl bg-emerald-50 text-emerald-800 font-black text-[11px] border border-emerald-200 flex items-center gap-1">
                                <RotateCcw className="w-3 h-3" />
                                <span>Luyện Lại</span>
                              </span>
                            ) : (
                              <span className="px-2 py-0.5 rounded-xl bg-slate-100 text-slate-400 font-medium text-[11px] flex items-center gap-1">
                                <Lock className="w-3 h-3" />
                                <span>Chưa Mở</span>
                              </span>
                            )}
                          </div>
                        </div>
                      </foreignObject>
                    </g>
                  );
                })}
              </svg>
            </div>
          );
        })()}
      </div>
    </div>
  );
};

export default KidsJourneyPage;

