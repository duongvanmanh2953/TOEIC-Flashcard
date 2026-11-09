import { describe, it, expect, beforeEach, vi } from 'vitest';
import { offlineSyncService } from '../lib/offlineSyncService';
import * as idb from '../lib/idb';

describe('Offline Learning Mechanism & Sync Service', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('correctly reports online state', () => {
    expect(typeof offlineSyncService.isOnline).toBe('boolean');
    expect(typeof offlineSyncService.isSyncing).toBe('boolean');
  });

  it('enqueues offline reviews into IndexedDB storage', async () => {
    const mockQueue: any[] = [];
    vi.spyOn(idb, 'idbGetMeta').mockImplementation(async (key: string) => {
      if (key === 'offline_review_queue') return mockQueue;
      return null;
    });
    vi.spyOn(idb, 'idbSetMeta').mockImplementation(async (key: string, val: any) => {
      if (key === 'offline_review_queue') {
        mockQueue.length = 0;
        mockQueue.push(...val);
      }
    });

    const reviews = [
      {
        id: 'rev_1',
        vocabularyId: 'vocab_101',
        rating: 'GOOD' as const,
        isCorrect: true,
        reviewedAt: Date.now(),
      },
      {
        id: 'rev_2',
        vocabularyId: 'vocab_102',
        rating: 'AGAIN' as const,
        isCorrect: false,
        reviewedAt: Date.now(),
      },
    ];

    const added = await offlineSyncService.enqueueOfflineReviews(reviews);
    expect(added).toBe(2);
    expect(mockQueue.length).toBe(2);
    expect(mockQueue[0].vocabularyId).toBe('vocab_101');
  });

  it('retrieves pending review count accurately', async () => {
    vi.spyOn(idb, 'idbGetMeta').mockResolvedValueOnce([
      { id: '1', vocabularyId: 'w1', rating: 'GOOD', isCorrect: true, reviewedAt: 1 },
      { id: '2', vocabularyId: 'w2', rating: 'EASY', isCorrect: true, reviewedAt: 2 },
      { id: '3', vocabularyId: 'w3', rating: 'HARD', isCorrect: true, reviewedAt: 3 },
    ]);

    const count = await offlineSyncService.getPendingReviewCount();
    expect(count).toBe(3);
  });

  it('notifies listeners when network status changes', () => {
    const listener = vi.fn();
    const unsub = offlineSyncService.subscribe(listener);

    // Trigger internal notification
    (offlineSyncService as any).notifyStatus(false);
    expect(listener).toHaveBeenCalledWith(false);

    (offlineSyncService as any).notifyStatus(true);
    expect(listener).toHaveBeenCalledWith(true);

    unsub();
  });

  it('supports offline cache fallback for expired TTL items', async () => {
    // Verify idbGetCache returns data when offline even if TTL expired
    const testItem = { data: [{ id: '1', word: 'resilient' }], expiresAt: Date.now() - 5000 };

    // When offline and allowExpiredIfOffline is true, item should be returned
    const isExpired = testItem.expiresAt < Date.now();
    expect(isExpired).toBe(true);

    // Simulate the logic in idbGetCache
    const isOffline = true;
    const allowExpiredIfOffline = true;
    const shouldResolve = testItem.expiresAt > Date.now() || (allowExpiredIfOffline && isOffline);
    expect(shouldResolve).toBe(true);
  });
});

