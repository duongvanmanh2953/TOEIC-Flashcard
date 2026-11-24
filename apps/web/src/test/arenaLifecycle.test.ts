import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { GameModeType } from '@prisma/client';
import { GameRoomManager } from '../../../api/src/modules/games/game-room.manager';

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

describe('Arena lifecycle and authoritative answer intake', () => {
  let manager: GameRoomManager;

  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-11-22T12:00:00Z'));
    manager = new GameRoomManager();
  });

  afterEach(() => vi.useRealTimers());

  function prepare(questions = [question]) {
    const room = manager.createRoom('TEST01', GameModeType.TRANSLATION_RUSH, 'Office', questions, 5);
    const player = manager.addPlayer(room.roomCode, 'student', 'Mai', '', 'socket-1')!;
    return { room, player };
  }

  it('keeps lobbies and finished rooms from advancing', () => {
    const { room } = prepare();
    expect(manager.startRound(room.roomCode)).toBeNull();
    room.status = 'STARTING';
    expect(manager.startRound(room.roomCode)?.round).toBe(1);
    room.status = 'FINISHED';
    expect(manager.startRound(room.roomCode)).toBeNull();
    expect(room.currentRound).toBe(1);
  });

  it('does not start a room with no questions', () => {
    const { room } = prepare([]);
    room.status = 'STARTING';
    expect(manager.startRound(room.roomCode)).toBeNull();
    expect(room.currentRound).toBe(0);
  });

  it('scores concurrent answers from one player at most once and preserves the result on reconnect', async () => {
    const { room, player } = prepare();
    room.status = 'STARTING';
    manager.startRound(room.roomCode);
    vi.advanceTimersByTime(700);
    const results = await Promise.all([
      manager.submitAnswer(room.roomCode, player.userId, 'A', 1),
      manager.submitAnswer(room.roomCode, player.userId, 'A', 1),
    ]);
    expect(results.filter(Boolean)).toHaveLength(1);
    expect(player.correctCount).toBe(1);
    expect(player.answeredCount).toBe(1);
    expect(room.roundAnswerCount).toBe(1);
    manager.removePlayer(room.roomCode, player.userId);
    const reconnected = manager.addPlayer(room.roomCode, player.userId, 'Mai', '', 'socket-2');
    expect(reconnected).toBe(player);
    expect(reconnected?.score).toBeGreaterThan(0);
    expect(await manager.submitAnswer(room.roomCode, player.userId, 'A', 1)).toBeNull();
  });

  it('rejects a previous-round submission and a submission exactly at the cutoff', async () => {
    const { room, player } = prepare([question, { ...question, id: 'q2' }]);
    room.status = 'STARTING';
    manager.startRound(room.roomCode);
    room.status = 'ROUND_SUMMARY';
    manager.startRound(room.roomCode);
    expect(await manager.submitAnswer(room.roomCode, player.userId, 'A', 1)).toBeNull();
    vi.advanceTimersByTime(5000);
    expect(await manager.submitAnswer(room.roomCode, player.userId, 'A', 2)).toBeNull();
    expect(player.score).toBe(0);
  });

  it('resets the extension to the configured duration on the next question', () => {
    const { room } = prepare([question, { ...question, id: 'q2' }]);
    room.status = 'STARTING';
    manager.startRound(room.roomCode);
    manager.extendRoundTime(room.roomCode, 5);
    expect(room.roundDurationSec).toBe(10);
    room.status = 'ROUND_SUMMARY';
    manager.startRound(room.roomCode);
    expect(room.roundDurationSec).toBe(5);
  });
});

describe('Arena data selection boundaries', () => {
  it('does not replace a previously initialized room or its question list', () => {
    const manager = new GameRoomManager();
    const room = manager.createRoom('TEST02', GameModeType.TRANSLATION_RUSH, 'Workplace', [question]);
    const second = manager.createRoom('test02', GameModeType.TRANSLATION_RUSH, 'Duplicate', []);
    expect(second).toBe(room);
    expect(second.totalRounds).toBe(1);
  });
});

describe('Arena server scoring and live round analytics', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-11-22T12:00:00Z'));
  });
  afterEach(() => vi.useRealTimers());

  function prepareLive(questions = [question]) {
    const manager = new GameRoomManager();
    const room = manager.createRoom('LIVE01', GameModeType.TRANSLATION_RUSH, 'Office', questions, 5, 'en', true);
    room.status = 'STARTING';
    manager.startRound(room.roomCode);
    const comment = (username: string, commentText: string, eventId = `${username}:${commentText}`) =>
      manager.submitLiveComment(room.roomCode, {
        eventId, username, displayName: username, commentText, timestamp: Date.now(), roomCode: room.roomCode, provider: 'MOCK',
      });
    return { manager, room, comment };
  }

  it('uses validated server time and awards zero for wrong answers and skips', async () => {
    const manager = new GameRoomManager();
    const room = manager.createRoom('BATTLE01', GameModeType.TRANSLATION_RUSH, 'Office', [question]);
    for (const id of ['correct', 'wrong', 'skip']) manager.addPlayer(room.roomCode, id, id, '', id);
    room.status = 'STARTING';
    manager.startRound(room.roomCode);
    vi.advanceTimersByTime(5100);
    expect((await manager.submitAnswer(room.roomCode, 'correct', 'A', 1))?.evaluation.score).toBe(95);
    expect((await manager.submitAnswer(room.roomCode, 'wrong', 'B', 1))?.evaluation.score).toBe(0);
    expect((await manager.submitAnswer(room.roomCode, 'skip', '', 1, true))?.evaluation.score).toBe(0);
    expect(await manager.submitAnswer(room.roomCode, 'skip', 'A', 1)).toBeNull();
    expect(manager.getInAppLeaderboard(room.roomCode).map(({ score }) => score)).toEqual([95, 0, 0]);
  });

  it('counts a wrong first answer, ignores duplicates, and preserves the fastest correct three', () => {
    const { manager, room, comment } = prepareLive();
    expect(room.roundDurationSec).toBe(20);
    expect(comment('spam', 'chọn C')).toBeNull();
    expect(comment('Alice', '2')).toMatchObject({ status: 'accepted', answer: 'B', isCorrect: false, score: 0 });
    expect(comment('alice', 'A')).toEqual({ status: 'duplicate' });
    for (const [index, name] of ['Minh', 'Hà', 'Mai', 'Hoa'].entries()) {
      vi.advanceTimersByTime(100);
      expect(comment(name, 'A')).toMatchObject({ status: 'accepted', score: [30, 20, 15, 0][index] });
    }
    expect(room.liveOptionVotes).toEqual({ A: 4, B: 1 });
    expect(room.questionCommentAwards?.get(1)?.map(({ displayName, points }) => [displayName, points]))
      .toEqual([['Minh', 30], ['Hà', 20], ['Mai', 15]]);
    expect(manager.getCommenterLeaderboard(room.roomCode).slice(0, 3).map(({ rank, score }) => [rank, score]))
      .toEqual([[1, 30], [2, 20], [3, 15]]);
    expect(manager.getInAppLeaderboard(room.roomCode)).toHaveLength(0);
  });

  it('keeps unverified answers out of the connected TikTok speed awards', () => {
    const { manager, room, comment } = prepareLive();
    room.liveProvider = 'TIKTOK_LIVE';
    expect(comment('local-fixture', 'A')).toBeNull();
    const verified = manager.submitLiveComment(room.roomCode, {
      eventId: 'native-chat', username: 'verified-account', displayName: 'Viewer', commentText: 'A',
      timestamp: Date.now(), roomCode: room.roomCode, provider: 'TIKTOK_LIVE', verifiedTikTok: true,
    });
    expect(verified).toMatchObject({ score: 30 });
    expect(room.hadUnverifiedLiveAnswers).toBeUndefined();
    expect(manager.getCommenterLeaderboard(room.roomCode)).toHaveLength(1);
  });

  it('freezes counts at the cutoff and rejects a replay from a past round', () => {
    const { manager, room, comment } = prepareLive([question, { ...question, id: 'q2' }]);
    expect(comment('Mai', 'A', 'old')?.status).toBe('accepted');
    vi.advanceTimersByTime(20000);
    expect(comment('An', 'B')).toBeNull();
    expect(room.liveOptionVotes).toEqual({ A: 1 });
    room.status = 'ROUND_SUMMARY';
    manager.startRound(room.roomCode);
    expect(room.liveOptionVotes).toEqual({});
    expect(comment('Mai', 'A', 'old')?.status).toBe('duplicate');
    expect(comment('Mai', 'A', 'new')?.status).toBe('accepted');
    expect(manager.getCommenterLeaderboard(room.roomCode)[0].score).toBe(60);
  });

  it('groups normalized fill-in responses and accepts question variations', () => {
    const { room, comment } = prepareLive([{
      ...question, correctAnswer: 'schedule', acceptedAnswers: ['timetable'], options: undefined,
    }]);
    expect(comment('one', '  Schedule!  ')).toMatchObject({ status: 'accepted', answer: 'schedule', isCorrect: true });
    expect(comment('two', 'ＳＣＨＥＤＵＬＥ')).toMatchObject({ status: 'accepted', answer: 'schedule', isCorrect: true });
    expect(comment('three', 'Timetable.')).toMatchObject({ status: 'accepted', answer: 'timetable', isCorrect: true });
    expect(comment('four', 'planning')).toMatchObject({ status: 'accepted', answer: 'planning', isCorrect: false });
    expect(comment('five', 'https://example.invalid')).toBeNull();
    expect(room.liveOptionVotes).toEqual({ schedule: 2, timetable: 1, planning: 1 });
  });
});
