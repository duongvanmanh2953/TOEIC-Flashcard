// ============================================================================
// TREASURE MAP CONTROLLER — GAME STATE MACHINE & PEDAGOGICAL PROGRESSION
// Contextual exploration, smooth character walking, and state persistence
// ============================================================================

import { useState, useEffect, useCallback, useRef } from 'react';
import {
  MAP_LANDMARKS,
  TREASURE_QUESTS,
  INITIAL_TREASURE_STATE,
  TreasureMapSavedState,
  GameMachineState,
  CharacterActionState,
  samplePathBetweenNodes,
} from './TreasureMapData';
import { treasureAudio } from './TreasureMapAudio';
import { generateBurstParticles, SparkleParticle } from './TreasureMapAnimation';

const STORAGE_KEY = 'leximind_treasure_map_v1';

export function useTreasureMapController(onStarsAwarded?: (stars: number) => void) {
  // 1. Persistent State
  const [savedState, setSavedState] = useState<TreasureMapSavedState>(() => {
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem(STORAGE_KEY);
        if (saved) {
          const parsed = JSON.parse(saved);
          return { ...INITIAL_TREASURE_STATE, ...parsed };
        }
      } catch (err) {
        console.warn('Failed to load treasure map state from localStorage:', err);
      }
    }
    return INITIAL_TREASURE_STATE;
  });

  // 2. Runtime Game State Machine
  const [gameState, setGameState] = useState<GameMachineState>('loading');
  const [characterAction, setCharacterAction] = useState<CharacterActionState>('idle');
  const [facing, setFacing] = useState<'left' | 'right'>('right');
  const [particles, setParticles] = useState<SparkleParticle[]>([]);
  const [showWinModal, setShowWinModal] = useState(false);

  // Active Quest
  const activeQuestIndex = Math.min(savedState.currentQuestIndex, TREASURE_QUESTS.length - 1);
  const activeQuest = TREASURE_QUESTS[activeQuestIndex];

  // Character Canvas Position
  const currentNode = MAP_LANDMARKS.find((n) => n.id === savedState.characterNodeId) || MAP_LANDMARKS[0];
  const [characterPos, setCharacterPos] = useState({ x: currentNode.x, y: currentNode.y });
  const characterPosRef = useRef({ x: currentNode.x, y: currentNode.y });
  const isWalkingRef = useRef<boolean>(false);

  const animFrameRef = useRef<number | null>(null);

  // Sync position on mount or node change (only when not actively walking)
  useEffect(() => {
    if (!isWalkingRef.current) {
      const node = MAP_LANDMARKS.find((n) => n.id === savedState.characterNodeId) || MAP_LANDMARKS[0];
      characterPosRef.current = { x: node.x, y: node.y };
      setCharacterPos({ x: node.x, y: node.y });
    }
  }, [savedState.characterNodeId]);

  // Persist State to LocalStorage
  const persistState = useCallback((newState: TreasureMapSavedState) => {
    setSavedState(newState);
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(newState));
      } catch (err) {
        console.warn('Failed to persist treasure map state:', err);
      }
    }
  }, []);

  // Smooth Character Walk Animation along the continuous Bézier trail
  const walkAlongPathToNode = useCallback((targetNodeId: string, onArrival?: () => void) => {
    const fromNodeId = savedState.characterNodeId;
    if (fromNodeId === targetNodeId) {
      if (onArrival) onArrival();
      return;
    }

    const fromIdx = MAP_LANDMARKS.findIndex((n) => n.id === fromNodeId);
    const toIdx = MAP_LANDMARKS.findIndex((n) => n.id === targetNodeId);
    if (fromIdx < 0 || toIdx < 0) {
      if (onArrival) onArrival();
      return;
    }

    if (animFrameRef.current) {
      cancelAnimationFrame(animFrameRef.current);
      animFrameRef.current = null;
    }

    isWalkingRef.current = true;
    setCharacterAction('walk');

    const hops = Math.abs(toIdx - fromIdx);
    const duration = Math.max(900, Math.min(2600, hops * 750));
    const startTime = performance.now();

    // Play footstep cadence
    let stepCount = 0;
    const maxSteps = Math.max(4, hops * 4);
    const footstepInterval = setInterval(() => {
      treasureAudio.playFootstep();
      stepCount++;
      if (stepCount >= maxSteps) clearInterval(footstepInterval);
    }, 220);

    let lastX = characterPosRef.current.x;

    const animate = (currentTime: number) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      // Smooth ease-in-out
      const ease = progress < 0.5 ? 4 * progress * progress * progress : 1 - Math.pow(-2 * progress + 2, 3) / 2;

      const pt = samplePathBetweenNodes(fromNodeId, targetNodeId, ease);

      if (Math.abs(pt.x - lastX) > 0.5) {
        setFacing(pt.x >= lastX ? 'right' : 'left');
        lastX = pt.x;
      }

      characterPosRef.current = pt;
      setCharacterPos(pt);

      if (progress < 1) {
        animFrameRef.current = requestAnimationFrame(animate);
      } else {
        clearInterval(footstepInterval);
        isWalkingRef.current = false;
        const targetNode = MAP_LANDMARKS[toIdx];
        characterPosRef.current = { x: targetNode.x, y: targetNode.y };
        setCharacterPos({ x: targetNode.x, y: targetNode.y });
        setCharacterAction('happy');
        setTimeout(() => setCharacterAction('idle'), 500);
        if (onArrival) onArrival();
      }
    };

    animFrameRef.current = requestAnimationFrame(animate);
  }, [savedState.characterNodeId]);

  // Clean animation frame on unmount
  useEffect(() => {
    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
      treasureAudio.stopAllAudio();
    };
  }, []);

  // Initialize Game on Mount (Ensures NO blank screen!)
  useEffect(() => {
    setGameState('exploring');
  }, []);

  // Replay English Audio
  const replayAudio = useCallback(() => {
    treasureAudio.speakEnglish(`${activeQuest.targetWord}. ${activeQuest.instructionEn}`);
  }, [activeQuest]);

  // Proceed from teaching phase
  const proceedFromTeaching = useCallback(() => {
    setGameState('exploring');
    treasureAudio.speakEnglish(activeQuest.instructionEn);
  }, [activeQuest]);

  // Quest Interaction Handlers
  const handleInteractTarget = useCallback((targetType: string) => {
    // 1. BEACH KEY QUEST
    if (targetType === 'key' && activeQuest.targetType === 'key') {
      const beachNode = MAP_LANDMARKS.find((n) => n.id === 'beach')!;
      walkAlongPathToNode('beach', () => {
        treasureAudio.playPickupChime();
        treasureAudio.playKeyRattle();
        setParticles(generateBurstParticles(beachNode.x, beachNode.y));

        const updatedInventory = [
          ...savedState.inventory,
          { id: 'golden_key', nameEn: 'Golden Key', nameVi: 'Chìa khóa vàng', iconType: 'key' as const },
        ];

        const nextQuestIdx = Math.min(activeQuestIndex + 1, TREASURE_QUESTS.length - 1);
        persistState({
          ...savedState,
          currentQuestIndex: nextQuestIdx,
          completedQuestIds: [...savedState.completedQuestIds, activeQuest.id],
          inventory: updatedInventory,
          characterNodeId: 'beach',
          totalStarsEarned: savedState.totalStarsEarned + activeQuest.stars,
        });

        if (onStarsAwarded) onStarsAwarded(activeQuest.stars);

        treasureAudio.speakEnglish('Golden Key! You found the key!', () => {
          setGameState('teaching');
        });
      });
      return;
    }

    // 2. FOREST GATE QUEST
    if (targetType === 'gate' && activeQuest.targetType === 'gate') {
      const hasKey = savedState.inventory.some((i) => i.id === 'golden_key');
      if (!hasKey) {
        treasureAudio.speakEnglish('We need the golden key first!');
        return;
      }

      const gateNode = MAP_LANDMARKS.find((n) => n.id === 'gate')!;
      walkAlongPathToNode('gate', () => {
        treasureAudio.playLockTurn();
        treasureAudio.playGateSwing();
        setParticles(generateBurstParticles(gateNode.x, gateNode.y));

        const nextQuestIdx = Math.min(activeQuestIndex + 1, TREASURE_QUESTS.length - 1);
        persistState({
          ...savedState,
          gateUnlocked: true,
          currentQuestIndex: nextQuestIdx,
          completedQuestIds: [...savedState.completedQuestIds, activeQuest.id],
          characterNodeId: 'gate',
          totalStarsEarned: savedState.totalStarsEarned + activeQuest.stars,
        });

        if (onStarsAwarded) onStarsAwarded(activeQuest.stars);

        treasureAudio.speakEnglish('The gate is open! Walk through!', () => {
          setGameState('teaching');
        });
      });
      return;
    }

    // 3. RIVER BRIDGE QUEST
    if (targetType === 'bridge' && activeQuest.targetType === 'bridge') {
      const riverNode = MAP_LANDMARKS.find((n) => n.id === 'river')!;
      walkAlongPathToNode('river', () => {
        const nextPlanks = savedState.bridgePlanksPlaced + 1;
        treasureAudio.playWoodImpact();
        setParticles(generateBurstParticles(riverNode.x, riverNode.y, 8));

        if (nextPlanks < 3) {
          persistState({
            ...savedState,
            bridgePlanksPlaced: nextPlanks,
            characterNodeId: 'river',
          });
          treasureAudio.speakEnglish(`Plank ${nextPlanks}! Place one more!`);
        } else {
          // Bridge Completed
          const nextQuestIdx = Math.min(activeQuestIndex + 1, TREASURE_QUESTS.length - 1);
          persistState({
            ...savedState,
            bridgePlanksPlaced: 3,
            currentQuestIndex: nextQuestIdx,
            completedQuestIds: [...savedState.completedQuestIds, activeQuest.id],
            characterNodeId: 'river',
            totalStarsEarned: savedState.totalStarsEarned + activeQuest.stars,
          });

          if (onStarsAwarded) onStarsAwarded(activeQuest.stars);

          treasureAudio.speakEnglish('Bridge completed! Cross the river!', () => {
            setGameState('teaching');
          });
        }
      });
      return;
    }

    // 4. MOUNTAIN FLAG QUEST
    if (targetType === 'flag' && activeQuest.targetType === 'flag') {
      const mountainNode = MAP_LANDMARKS.find((n) => n.id === 'mountain')!;
      walkAlongPathToNode('mountain', () => {
        treasureAudio.playFlagWave();
        treasureAudio.playPickupChime();
        setParticles(generateBurstParticles(mountainNode.x, mountainNode.y));

        const nextQuestIdx = Math.min(activeQuestIndex + 1, TREASURE_QUESTS.length - 1);
        persistState({
          ...savedState,
          flagDiscovered: true,
          currentQuestIndex: nextQuestIdx,
          completedQuestIds: [...savedState.completedQuestIds, activeQuest.id],
          characterNodeId: 'mountain',
          totalStarsEarned: savedState.totalStarsEarned + activeQuest.stars,
        });

        if (onStarsAwarded) onStarsAwarded(activeQuest.stars);

        treasureAudio.speakEnglish('Blue flag! Path to summit discovered!', () => {
          setGameState('teaching');
        });
      });
      return;
    }

    // 5. CAVE TORCH QUEST
    if (targetType === 'torch' && activeQuest.targetType === 'torch') {
      const caveNode = MAP_LANDMARKS.find((n) => n.id === 'cave')!;
      walkAlongPathToNode('cave', () => {
        treasureAudio.playTorchIgnite();
        treasureAudio.playPickupChime();
        setParticles(generateBurstParticles(caveNode.x, caveNode.y));

        const updatedInventory = [
          ...savedState.inventory,
          { id: 'cave_torch', nameEn: 'Flaming Torch', nameVi: 'Đuốc sáng', iconType: 'torch' as const },
        ];

        const nextQuestIdx = Math.min(activeQuestIndex + 1, TREASURE_QUESTS.length - 1);
        persistState({
          ...savedState,
          caveLit: true,
          currentQuestIndex: nextQuestIdx,
          completedQuestIds: [...savedState.completedQuestIds, activeQuest.id],
          inventory: updatedInventory,
          characterNodeId: 'cave',
          totalStarsEarned: savedState.totalStarsEarned + activeQuest.stars,
        });

        if (onStarsAwarded) onStarsAwarded(activeQuest.stars);

        treasureAudio.speakEnglish('Torch is lit! The cave is bright!', () => {
          setGameState('teaching');
        });
      });
      return;
    }

    // 6. TREASURE CHEST AT SUMMIT QUEST
    if (targetType === 'chest' && activeQuest.targetType === 'chest') {
      const summitNode = MAP_LANDMARKS.find((n) => n.id === 'summit')!;
      walkAlongPathToNode('summit', () => {
        treasureAudio.playLockTurn();
        treasureAudio.playChestOpen();
        treasureAudio.playCelebrationCheer();
        setCharacterAction('celebrate');
        setParticles(generateBurstParticles(summitNode.x, summitNode.y, 40));

        persistState({
          ...savedState,
          chestOpened: true,
          completedQuestIds: [...savedState.completedQuestIds, activeQuest.id],
          characterNodeId: 'summit',
          totalStarsEarned: savedState.totalStarsEarned + activeQuest.stars,
        });

        if (onStarsAwarded) onStarsAwarded(activeQuest.stars);

        treasureAudio.speakEnglish('Treasure chest unlocked! Gold and gems!', () => {
          setShowWinModal(true);
          setGameState('completed');
        });
      });
      return;
    }
  }, [activeQuest, activeQuestIndex, savedState, walkAlongPathToNode, persistState, onStarsAwarded]);

  // Click on Waypoints to navigate along the continuous trail
  const handleWaypointClick = useCallback((nodeId: string) => {
    if (isWalkingRef.current) return;
    const node = MAP_LANDMARKS.find((n) => n.id === nodeId);
    if (!node) return;

    // Allow walking to already reached landmarks or current target
    const maxAccessibleQuestIndex = savedState.currentQuestIndex;
    const isAccessible = node.questIndex <= maxAccessibleQuestIndex;

    if (!isAccessible) {
      treasureAudio.playLockTurn();
      treasureAudio.speakEnglish(`Let's find the ${activeQuest.targetWord} first!`);
      return;
    }

    walkAlongPathToNode(nodeId, () => {
      persistState({
        ...savedState,
        characterNodeId: nodeId,
      });
    });
  }, [walkAlongPathToNode, savedState, persistState, activeQuest]);

  // Reset Game Progress
  const resetGame = useCallback(() => {
    persistState(INITIAL_TREASURE_STATE);
    setShowWinModal(false);
    setGameState('intro');
    treasureAudio.playPickupChime();
  }, [persistState]);

  return {
    savedState,
    gameState,
    characterPos,
    characterAction,
    facing,
    activeQuest,
    particles,
    showWinModal,
    setShowWinModal,
    replayAudio,
    proceedFromTeaching,
    handleInteractTarget,
    handleWaypointClick,
    resetGame,
  };
}

