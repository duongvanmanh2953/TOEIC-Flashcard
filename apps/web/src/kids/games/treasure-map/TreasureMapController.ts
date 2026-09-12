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
  const [particles, setParticles] = useState<SparkleParticle[]>([]);
  const [showWinModal, setShowWinModal] = useState(false);

  // Active Quest
  const activeQuestIndex = Math.min(savedState.currentQuestIndex, TREASURE_QUESTS.length - 1);
  const activeQuest = TREASURE_QUESTS[activeQuestIndex];

  // Character Canvas Position
  const currentNode = MAP_LANDMARKS.find((n) => n.id === savedState.characterNodeId) || MAP_LANDMARKS[0];
  const [characterPos, setCharacterPos] = useState({ x: currentNode.x, y: currentNode.y });

  const animFrameRef = useRef<number | null>(null);

  // Sync position on mount or node change
  useEffect(() => {
    const node = MAP_LANDMARKS.find((n) => n.id === savedState.characterNodeId) || MAP_LANDMARKS[0];
    setCharacterPos({ x: node.x, y: node.y });
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

  // Smooth Character Walk Animation between coordinates
  const walkCharacterTo = useCallback((targetX: number, targetY: number, onArrival?: () => void) => {
    setCharacterAction('walk');
    const startX = characterPos.x;
    const startY = characterPos.y;
    const startTime = performance.now();
    const duration = 1200; // 1.2s smooth walk

    // Play footstep cadence
    let stepCount = 0;
    const footstepInterval = setInterval(() => {
      treasureAudio.playFootstep();
      stepCount++;
      if (stepCount > 5) clearInterval(footstepInterval);
    }, 200);

    const animate = (currentTime: number) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      // Smooth ease
      const ease = progress < 0.5 ? 2 * progress * progress : -1 + (4 - 2 * progress) * progress;

      setCharacterPos({
        x: startX + (targetX - startX) * ease,
        y: startY + (targetY - startY) * ease,
      });

      if (progress < 1) {
        animFrameRef.current = requestAnimationFrame(animate);
      } else {
        clearInterval(footstepInterval);
        setCharacterAction('happy');
        setTimeout(() => setCharacterAction('idle'), 600);
        if (onArrival) onArrival();
      }
    };

    animFrameRef.current = requestAnimationFrame(animate);
  }, [characterPos]);

  // Clean animation frame on unmount
  useEffect(() => {
    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
      treasureAudio.stopAllAudio();
    };
  }, []);

  // Initialize Game on Mount (Ensures NO blank screen!)
  useEffect(() => {
    const timer = setTimeout(() => {
      setGameState('intro');
      // Speak teaching of current quest
      treasureAudio.speakEnglish(activeQuest.targetWord, () => {
        treasureAudio.speakEnglish(activeQuest.instructionEn, () => {
          setGameState('exploring');
        });
      });
    }, 400);

    return () => clearTimeout(timer);
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
      walkCharacterTo(beachNode.x, beachNode.y, () => {
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
      walkCharacterTo(gateNode.x, gateNode.y, () => {
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
      walkCharacterTo(riverNode.x, riverNode.y, () => {
        const nextPlanks = savedState.bridgePlanksPlaced + 1;
        treasureAudio.playWoodImpact();
        setParticles(generateBurstParticles(riverNode.x, riverNode.y, 8));

        if (nextPlanks < 3) {
          persistState({
            ...savedState,
            bridgePlanksPlaced: nextPlanks,
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
      walkCharacterTo(mountainNode.x, mountainNode.y, () => {
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
      walkCharacterTo(caveNode.x, caveNode.y, () => {
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
      walkCharacterTo(summitNode.x, summitNode.y, () => {
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
  }, [activeQuest, activeQuestIndex, savedState, walkCharacterTo, persistState, onStarsAwarded]);

  // Click on Waypoints to navigate
  const handleWaypointClick = useCallback((nodeId: string) => {
    const node = MAP_LANDMARKS.find((n) => n.id === nodeId);
    if (!node) return;
    walkCharacterTo(node.x, node.y, () => {
      persistState({
        ...savedState,
        characterNodeId: nodeId,
      });
    });
  }, [walkCharacterTo, savedState, persistState]);

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
