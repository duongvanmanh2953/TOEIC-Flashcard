import { useState, useEffect, useCallback } from 'react';
import { idbGetMeta, idbSetMeta } from './idb';
import api from './api';

export interface OfflineReviewItem {
  id: string;
  vocabularyId?: string;
  cardId?: string;
  word?: string;
  rating: 'AGAIN' | 'HARD' | 'GOOD' | 'EASY' | string;
  isCorrect: boolean;
  confidence?: number;
  responseTimeMs?: number;
  reviewedAt: number;
  languageId?: string;
}

export interface OfflineReviewQueuePayload {
  reviews: OfflineReviewItem[];
  timestamp: number;
  languageId?: string;
}

const QUEUE_KEY = 'offline_review_queue';
export const NETWORK_STATUS_EVENT = 'VOCABFLOW_NETWORK_STATUS';

class OfflineSyncService {
  private _isOnline: boolean =
    typeof navigator !== 'undefined' && typeof navigator.onLine === 'boolean'
      ? navigator.onLine
      : true;
  private _isSyncing: boolean = false;
  private _listeners: Set<(status: boolean) => void> = new Set();
  private _syncListeners: Set<(isSyncing: boolean) => void> = new Set();

  constructor() {
    if (typeof window !== 'undefined') {
      window.addEventListener('online', () => this.handleOnline());
      window.addEventListener('offline', () => this.handleOffline());
    }
  }

  public get isOnline(): boolean {
    return this._isOnline;
  }

  public get isSyncing(): boolean {
    return this._isSyncing;
  }

  private handleOnline() {
    this._isOnline = true;
    this.notifyStatus(true);
    // When coming online, automatically trigger queue sync
    setTimeout(() => {
      this.syncPendingReviews();
    }, 1500);
  }

  private handleOffline() {
    this._isOnline = false;
    this.notifyStatus(false);
  }

  private notifyStatus(isOnline: boolean) {
    this._listeners.forEach((listener) => {
      try {
        listener(isOnline);
      } catch (err) {
        console.warn('Listener error in OfflineSyncService:', err);
      }
    });

    if (typeof window !== 'undefined') {
      window.dispatchEvent(
        new CustomEvent(NETWORK_STATUS_EVENT, {
          detail: { isOnline },
        }),
      );
    }
  }

  public subscribe(listener: (isOnline: boolean) => void): () => void {
    this._listeners.add(listener);
    return () => this._listeners.delete(listener);
  }

  public subscribeSync(listener: (isSyncing: boolean) => void): () => void {
    this._syncListeners.add(listener);
    return () => this._syncListeners.delete(listener);
  }

  private setSyncing(state: boolean) {
    this._isSyncing = state;
    this._syncListeners.forEach((l) => l(state));
  }

  /**
   * Enqueue a batch of reviews performed offline
   */
  public async enqueueOfflineReviews(
    reviews: OfflineReviewItem[],
    languageId?: string,
  ): Promise<number> {
    if (!reviews || reviews.length === 0) return 0;
    try {
      const existing = (await idbGetMeta<OfflineReviewItem[]>(QUEUE_KEY)) || [];
      const updated = [...existing, ...reviews];
      await idbSetMeta(QUEUE_KEY, updated);

      if (typeof window !== 'undefined') {
        window.dispatchEvent(
          new CustomEvent('VOCABFLOW_OFFLINE_SAVED', {
            detail: { count: updated.length, added: reviews.length },
          }),
        );
      }
      return updated.length;
    } catch (err) {
      console.warn('Failed to enqueue offline reviews:', err);
      return 0;
    }
  }

  /**
   * Get total count of pending reviews in offline queue
   */
  public async getPendingReviewCount(): Promise<number> {
    try {
      const existing = (await idbGetMeta<OfflineReviewItem[]>(QUEUE_KEY)) || [];
      return existing.length;
    } catch {
      return 0;
    }
  }

  /**
   * Synchronize pending offline reviews to backend API
   */
  public async syncPendingReviews(): Promise<{ synced: number; error?: string }> {
    if (!this._isOnline || this._isSyncing) {
      return { synced: 0 };
    }

    try {
      const queue = (await idbGetMeta<OfflineReviewItem[]>(QUEUE_KEY)) || [];
      if (queue.length === 0) {
        return { synced: 0 };
      }

      this.setSyncing(true);

      const payload = {
        reviews: queue.map((r) => ({
          vocabularyId: r.vocabularyId || r.cardId,
          rating: r.rating,
          isCorrect: r.isCorrect,
          confidence: r.confidence ?? 1.0,
          responseTimeMs: r.responseTimeMs ?? 1500,
          reviewedAt: r.reviewedAt || Date.now(),
        })),
        isOfflineSync: true,
      };

      const res = await api.post('/reviews/batch', payload, {
        headers: { 'x-offline-sync': 'true' },
        skipGlobalToast: true,
      } as any);

      // Successfully synced: clear the queue
      await idbSetMeta(QUEUE_KEY, []);

      if (typeof window !== 'undefined') {
        window.dispatchEvent(
          new CustomEvent('VOCABFLOW_TOAST', {
            detail: {
              type: 'success',
              title: 'Đã đồng bộ trực tuyến',
              message: `Đã tự động đồng bộ ${queue.length} lượt ôn tập ngoại tuyến vào máy chủ.`,
              duration: 4000,
            },
          }),
        );
      }

      return { synced: queue.length };
    } catch (err: any) {
      console.warn('Failed to sync offline reviews to server:', err);
      return { synced: 0, error: err?.message || 'Lỗi đồng bộ' };
    } finally {
      this.setSyncing(false);
    }
  }
}

export const offlineSyncService = new OfflineSyncService();

/**
 * React Hook for watching online/offline state and pending queue
 */
export function useNetworkStatus() {
  const [isOnline, setIsOnline] = useState<boolean>(offlineSyncService.isOnline);
  const [isSyncing, setIsSyncing] = useState<boolean>(offlineSyncService.isSyncing);
  const [pendingCount, setPendingCount] = useState<number>(0);

  const refreshPending = useCallback(async () => {
    const count = await offlineSyncService.getPendingReviewCount();
    setPendingCount(count);
  }, []);

  useEffect(() => {
    refreshPending();

    const unsubStatus = offlineSyncService.subscribe((online) => {
      setIsOnline(online);
      refreshPending();
    });

    const unsubSync = offlineSyncService.subscribeSync((syncing) => {
      setIsSyncing(syncing);
      if (!syncing) {
        refreshPending();
      }
    });

    const handleSaved = () => refreshPending();
    window.addEventListener('VOCABFLOW_OFFLINE_SAVED', handleSaved);

    return () => {
      unsubStatus();
      unsubSync();
      window.removeEventListener('VOCABFLOW_OFFLINE_SAVED', handleSaved);
    };
  }, [refreshPending]);

  const syncNow = useCallback(async () => {
    return await offlineSyncService.syncPendingReviews();
  }, []);

  return { isOnline, isSyncing, pendingCount, syncNow, refreshPending };
}
