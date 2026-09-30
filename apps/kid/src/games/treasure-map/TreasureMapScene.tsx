// ============================================================================
// TREASURE MAP SCENE — INTERACTIVE WORLD VIEWPORT & HITBOX SYSTEM
// Responsive SVG viewport with continuous path, dynamic landmarks, and Bobby mascot
// ============================================================================

import React from 'react';
import {
  MAP_LANDMARKS,
  TREASURE_MAP_CONTINUOUS_PATH,
  CharacterActionState,
  TreasureMapSavedState,
  TreasureQuest,
} from './TreasureMapData';
import {
  TreasureMapBackground,
  ExplorerBobby,
  VectorGoldenKey,
  VectorAncientGate,
  VectorRiverBridge,
  VectorBlueFlag,
  VectorCrystalTorch,
  VectorTreasureChest,
} from './TreasureMapAssets';
import { SparkleParticle } from './TreasureMapAnimation';

interface TreasureMapSceneProps {
  savedState: TreasureMapSavedState;
  activeQuest: TreasureQuest;
  characterPos: { x: number; y: number };
  characterAction: CharacterActionState;
  facing?: 'left' | 'right';
  particles: SparkleParticle[];
  onInteractTarget: (targetType: string) => void;
  onWaypointClick: (nodeId: string) => void;
}

export const TreasureMapScene: React.FC<TreasureMapSceneProps> = ({
  savedState,
  activeQuest,
  characterPos,
  characterAction,
  facing = 'right',
  particles,
  onInteractTarget,
  onWaypointClick,
}) => {
  const currentStep = activeQuest.stepIndex;

  // Has key been picked up?
  const hasKey = savedState.inventory.some((i) => i.id === 'golden_key');

  return (
    <div className="relative w-full aspect-[800/820] max-h-[75vh] mx-auto rounded-3xl overflow-hidden border-4 border-amber-300 shadow-xl bg-sky-200 select-none">
      <svg
        viewBox="0 0 800 820"
        className="w-full h-full object-contain"
        preserveAspectRatio="xMidYMid meet"
      >
        {/* Layer 1: Storybook Environment & Island Landmass */}
        <TreasureMapBackground />

        {/* Layer 2: Continuous Path Track */}
        {/* 2.1 Base High-Contrast Stone Trail (Visible for entire map, locked trail is clear, not invisible) */}
        <path
          d={TREASURE_MAP_CONTINUOUS_PATH}
          fill="none"
          stroke="#78350f"
          strokeWidth="12"
          strokeLinecap="round"
          strokeLinejoin="round"
          opacity="0.35"
        />
        <path
          d={TREASURE_MAP_CONTINUOUS_PATH}
          fill="none"
          stroke="#fde68a"
          strokeWidth="6"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeDasharray="10 12"
        />

        {/* 2.2 Golden Explorer Highway (Unlocked path up to active area) */}
        <path
          d={TREASURE_MAP_CONTINUOUS_PATH}
          fill="none"
          stroke="#f59e0b"
          strokeWidth="6"
          strokeLinecap="round"
          strokeLinejoin="round"
          filter="url(#goldGlow)"
          opacity="0.9"
        />

        {/* Layer 3: Landmark Waypoints on Path */}
        {MAP_LANDMARKS.map((node) => {
          const isCurrent = node.id === savedState.characterNodeId;
          const isCompleted = node.questIndex >= 0 && savedState.completedQuestIds.includes(`quest_${node.questIndex + 1}_${node.area === 'beach' ? 'key' : node.area === 'gate' ? 'gate' : node.area === 'river' ? 'bridge' : node.area === 'mountain' ? 'flag' : node.area === 'cave' ? 'torch' : 'chest'}`);
          const isTarget = node.questIndex === currentStep;

          return (
            <g
              key={node.id}
              transform={`translate(${node.x}, ${node.y})`}
              className="cursor-pointer"
              onClick={() => onWaypointClick(node.id)}
            >
              {/* Waypoint Base Stone */}
              <circle
                cx="0"
                cy="0"
                r={isCurrent || isTarget ? 18 : 13}
                fill={isCurrent ? '#f59e0b' : isCompleted ? '#22c55e' : '#e2e8f0'}
                stroke={isCurrent ? '#b45309' : isCompleted ? '#15803d' : '#94a3b8'}
                strokeWidth="3.5"
                className={isTarget ? 'animate-pulse' : ''}
              />

              {/* Waypoint Inner Dot */}
              <circle
                cx="0"
                cy="0"
                r={isCurrent ? 8 : 5}
                fill={isCurrent ? '#ffffff' : isCompleted ? '#f0fdf4' : '#64748b'}
              />

              {/* Label Tag */}
              <rect
                x="-40"
                y="20"
                width="80"
                height="18"
                rx="9"
                fill="#ffffff"
                stroke="#cbd5e1"
                strokeWidth="1.5"
                opacity="0.95"
              />
              <text
                x="0"
                y="32"
                textAnchor="middle"
                fontSize="9"
                fontWeight="900"
                fill="#1e293b"
              >
                {node.nameVi}
              </text>
            </g>
          );
        })}

        {/* Layer 4: Interactive Landmarks / Quest Objects */}

        {/* 4.1 Golden Key at Beach (x: 200, y: 590) */}
        {!hasKey && (
          <g transform="translate(200, 590)">
            <VectorGoldenKey
              isFloating={true}
              onClick={() => onInteractTarget('key')}
            />
            {/* Mobile Touch Hitbox */}
            <circle
              cx="0"
              cy="0"
              r="40"
              fill="transparent"
              onClick={() => onInteractTarget('key')}
            />
          </g>
        )}

        {/* 4.2 Ancient Forest Gate (x: 350, y: 470) */}
        <g transform="translate(350, 470)">
          <VectorAncientGate
            isOpen={savedState.gateUnlocked}
            onClick={() => onInteractTarget('gate')}
          />
          <circle
            cx="0"
            cy="0"
            r="44"
            fill="transparent"
            onClick={() => onInteractTarget('gate')}
          />
        </g>

        {/* 4.3 River Bridge (x: 540, y: 380) */}
        <g transform="translate(540, 380)">
          <VectorRiverBridge
            planksPlaced={savedState.bridgePlanksPlaced}
            onAddPlank={() => onInteractTarget('bridge')}
          />
          <circle
            cx="0"
            cy="0"
            r="44"
            fill="transparent"
            onClick={() => onInteractTarget('bridge')}
          />
        </g>

        {/* 4.4 Blue Flag on Mountain (x: 670, y: 270) */}
        <g transform="translate(670, 270)">
          <VectorBlueFlag
            isDiscovered={savedState.flagDiscovered}
            onClick={() => onInteractTarget('flag')}
          />
          <circle
            cx="0"
            cy="0"
            r="40"
            fill="transparent"
            onClick={() => onInteractTarget('flag')}
          />
        </g>

        {/* 4.5 Crystal Torch in Cave (x: 540, y: 150) */}
        <g transform="translate(540, 150)">
          <VectorCrystalTorch
            isLit={savedState.caveLit}
            onClick={() => onInteractTarget('torch')}
          />
          <circle
            cx="0"
            cy="0"
            r="40"
            fill="transparent"
            onClick={() => onInteractTarget('torch')}
          />
        </g>

        {/* 4.6 Treasure Chest at Summit (x: 330, y: 80) */}
        <g transform="translate(330, 80)">
          <VectorTreasureChest
            isOpen={savedState.chestOpened}
            onClick={() => onInteractTarget('chest')}
          />
          <circle
            cx="0"
            cy="0"
            r="48"
            fill="transparent"
            onClick={() => onInteractTarget('chest')}
          />
        </g>

        {/* Layer 5: Character Explorer Bobby on Path */}
        <ExplorerBobby
          x={characterPos.x}
          y={characterPos.y}
          state={characterAction}
          facing={facing}
        />

        {/* Layer 6: Dynamic Particle Sparks Layer */}
        {particles.map((p) => (
          <circle
            key={p.id}
            cx={p.x}
            cy={p.y}
            r={p.size}
            fill={p.color}
            opacity={p.alpha}
          />
        ))}
      </svg>
    </div>
  );
};
