import { describe, expect, it, vi } from 'vitest';
import { GameModeType } from '@prisma/client';
import { GameRoomManager } from '../src/modules/games/game-room.manager';
import { GamesGateway } from '../src/modules/games/games.gateway';

const question = {
  id: 'q1',
  prompt: 'Choose the matching word',
  direction: 'EN_VI',
  correctAnswer: 'A',
  acceptedAnswers: ['A'],
  options: ['A. Schedule', 'B. Receipt'],
  correctOptionIndex: 0,
  difficulty: 1,
  category: 'Office',
};

describe('Arena gateway clocks', () => {
  it('locks live intake at 20s, advances after the two result phases, and settles once', async () => {
    vi.useFakeTimers();
    const roomManager = new GameRoomManager();
    const room = roomManager.createRoom('CLOCK', GameModeType.TRANSLATION_RUSH, 'Clock', [
      question, { ...question, id: 'q2' },
    ], 20, 'en', true);
    const host = roomManager.addPlayer(room.roomCode, 'host', 'Host', '', 'host-socket')!;
    host.isHost = true;
    const persistGameResults = vi.fn().mockResolvedValue(undefined);
    const updateMany = vi.fn().mockResolvedValue({ count: 1 });
    const gateway = new GamesGateway(
      { roomManager, persistGameResults, prisma: { customGameRoom: { updateMany } } } as unknown as ConstructorParameters<typeof GamesGateway>[0],
      null!, null!, null!, null!,
    );
    const emit = vi.fn();
    gateway.server = { to: () => ({ emit }) } as unknown as typeof gateway.server;
    const socket = { id: 'host-socket', data: { roomCode: room.roomCode, userId: host.userId } } as Parameters<typeof gateway.handleHostStartGame>[0];
    const events = (name: string) => emit.mock.calls.filter(([event]) => event === name);

    try {
      expect(gateway.handleHostStartGame(socket, { roomCode: room.roomCode })).toMatchObject({ status: 'starting' });
      await vi.advanceTimersByTimeAsync(4000);
      expect(events('round_started')).toHaveLength(1);
      await vi.advanceTimersByTimeAsync(19999);
      expect(events('round_ended')).toHaveLength(0);
      await vi.advanceTimersByTimeAsync(1);
      expect(room.status).toBe('ROUND_SUMMARY');
      const reveal = events('round_ended')[0][1];
      expect(reveal.summaryEndsAt - reveal.serverTime).toBe(10000);
      await vi.advanceTimersByTimeAsync(9999);
      expect(events('round_started')).toHaveLength(1);
      await vi.advanceTimersByTimeAsync(1);
      expect(events('round_started')).toHaveLength(2);
      expect(persistGameResults).not.toHaveBeenCalled();

      await vi.advanceTimersByTimeAsync(30000);
      expect(events('game_finished')).toHaveLength(1);
      gateway.handleHostEndGame(socket, { roomCode: room.roomCode });
      expect(events('game_finished')).toHaveLength(1);
      expect(persistGameResults).toHaveBeenCalledExactlyOnceWith(room.roomCode);
      expect(updateMany).toHaveBeenCalledTimes(1);
    } finally {
      gateway.onModuleDestroy();
      vi.useRealTimers();
    }
  });
});

it('offers three distinct Live presets within each learning language', async () => {
  const { getSystemPresetRooms } = await import('../src/modules/games/custom-rooms.service');
  const liveRooms = getSystemPresetRooms('ja').filter((room) => room.isLiveMode);
  expect(liveRooms.map((room) => room.roomCode)).toEqual([
    'JA-LIVE-REFLEX', 'JA-LIVE-LISTEN', 'JA-LIVE-BLITZ',
  ]);
  expect(new Set(liveRooms.map((room) => room.gameMode)).size).toBe(3);
  expect(liveRooms.every((room) =>
    room.languageId === 'ja' && room.allowLateJoin && room.roundDurationSec === 20 && room.playerCount === 0,
  )).toBe(true);
});
