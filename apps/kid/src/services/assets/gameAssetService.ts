// ============================================================================
// VOCALFLOW GAME ASSET SERVICE — 3-TIER CACHE ARCHITECTURE
// Tier 1: In-Memory Cache • Tier 2: IndexedDB (VocalFlowCache) • Tier 3: Cache Storage
// Request Deduplication • Stale-While-Revalidate • AbortController • 60 FPS
// ============================================================================

export interface GameAssetItem {
  id: string;
  category: string;
  name: string;
  nameVi: string;
  thumbnail: string;
  image: string;
}

export interface GameAssetManifest {
  version: number;
  generatedAt: number;
  totalItems: number;
  categories: string[];
  items: GameAssetItem[];
}

const DB_NAME = 'VocalFlowCache';
const DB_VERSION = 1;
const STORE_MANIFESTS = 'asset-manifests';
const CACHE_STORAGE_NAME = 'vocalflow-game-assets-v1';

class GameAssetService {
  // Tier 1: In-Memory Cache
  private memoryManifest: GameAssetManifest | null = null;
  private categoryMap = new Map<string, GameAssetItem[]>();
  private itemsById = new Map<string, GameAssetItem>();

  // Inflight Request Deduplication
  private inflightRequests = new Map<string, Promise<any>>();

  // Active AbortControllers
  private activeControllers = new Set<AbortController>();

  // IndexedDB connection promise
  private dbPromise: Promise<IDBDatabase> | null = null;

  constructor() {
    this.initIndexedDB();
  }

  /**
   * Initialize or upgrade IndexedDB database
   */
  private initIndexedDB(): Promise<IDBDatabase> {
    if (this.dbPromise) return this.dbPromise;

    if (typeof window === 'undefined' || !window.indexedDB) {
      return Promise.reject(new Error('IndexedDB not supported'));
    }

    this.dbPromise = new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onupgradeneeded = (e) => {
        const db = (e.target as IDBOpenDBRequest).result;
        if (!db.objectStoreNames.contains(STORE_MANIFESTS)) {
          db.createObjectStore(STORE_MANIFESTS, { keyPath: 'key' });
        }
      };

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });

    return this.dbPromise;
  }

  /**
   * Read record from IndexedDB (Tier 2)
   */
  private async getFromIndexedDB(key: string): Promise<any> {
    try {
      const db = await this.initIndexedDB();
      return new Promise((resolve) => {
        const tx = db.transaction(STORE_MANIFESTS, 'readonly');
        const store = tx.objectStore(STORE_MANIFESTS);
        const req = store.get(key);
        req.onsuccess = () => resolve(req.result ? req.result.data : null);
        req.onerror = () => resolve(null);
      });
    } catch {
      return null;
    }
  }

  /**
   * Save record to IndexedDB (Tier 2)
   */
  private async saveToIndexedDB(key: string, data: any): Promise<void> {
    try {
      const db = await this.initIndexedDB();
      const tx = db.transaction(STORE_MANIFESTS, 'readwrite');
      const store = tx.objectStore(STORE_MANIFESTS);
      store.put({ key, data, updatedAt: Date.now() });
    } catch {
      // Non-blocking failover
    }
  }

  /**
   * Populate in-memory lookup maps for O(1) retrieval
   */
  private populateMemoryCache(manifest: GameAssetManifest): void {
    this.memoryManifest = manifest;
    this.categoryMap.clear();
    this.itemsById.clear();

    for (const item of manifest.items) {
      this.itemsById.set(item.id.toLowerCase(), item);

      const catList = this.categoryMap.get(item.category) || [];
      catList.push(item);
      this.categoryMap.set(item.category, catList);
    }
  }

  /**
   * Fetch manifest with Stale-While-Revalidate and Deduplication
   */
  public async getManifest(category?: string): Promise<GameAssetItem[]> {
    // 1. If Memory Cache (Tier 1) is already warm
    if (this.memoryManifest) {
      if (category) {
        return this.categoryMap.get(category) || [];
      }
      return this.memoryManifest.items;
    }

    // 2. Check Deduplication
    const reqKey = `manifest:${category || 'all'}`;
    if (this.inflightRequests.has(reqKey)) {
      return this.inflightRequests.get(reqKey);
    }

    const task = (async () => {
      // 3. Try reading from IndexedDB (Tier 2) for INSTANT response
      const idbData: GameAssetManifest | null = await this.getFromIndexedDB('manifest:global');
      if (idbData && idbData.items) {
        this.populateMemoryCache(idbData);

        // Background revalidation (stale-while-revalidate)
        this.fetchFreshManifest().catch(() => {});

        if (category) {
          return this.categoryMap.get(category) || [];
        }
        return idbData.items;
      }

      // 4. Fetch fresh from network (Backend API or static manifest fallback)
      return this.fetchFreshManifest(category);
    })();

    this.inflightRequests.set(reqKey, task);
    try {
      return await task;
    } finally {
      this.inflightRequests.delete(reqKey);
    }
  }

  /**
   * Fetch fresh manifest from Network
   */
  private async fetchFreshManifest(category?: string): Promise<GameAssetItem[]> {
    const controller = new AbortController();
    this.activeControllers.add(controller);

    const apiBase = (import.meta.env.VITE_API_BASE_URL || '').replace(/\/+$/, '');
    const assetsBase = (import.meta.env.VITE_ASSETS_BASE_URL || '').replace(/\/+$/, '');

    try {
      let res: Response | null = null;
      if (apiBase) {
        try {
          res = await fetch(`${apiBase}/api/v1/games/assets`, { signal: controller.signal });
        } catch {}
        if (!res || !res.ok) {
          try {
            res = await fetch(`${apiBase}/api/v1/game-assets`, { signal: controller.signal });
          } catch {}
        }
      }

      if (!res || !res.ok) {
        try {
          res = await fetch('/api/v1/game-assets', { signal: controller.signal });
        } catch {}
      }

      if (!res || !res.ok) {
        const manifestUrl = assetsBase ? `${assetsBase}/game-assets/manifest.json` : '/game-assets/manifest.json';
        res = await fetch(manifestUrl, { signal: controller.signal });
      }

      if (!res || !res.ok) {
        res = await fetch('/game-assets/manifest.json', { signal: controller.signal });
      }

      if (!res.ok) {
        throw new Error(`Failed to load game assets manifest: ${res.status}`);
      }

      const manifest: GameAssetManifest = await res.json();
      // Ensure image URLs have assetsBase if relative
      if (assetsBase) {
        manifest.items = manifest.items.map((it) => ({
          ...it,
          thumbnail: it.thumbnail.startsWith('http') ? it.thumbnail : `${assetsBase}${it.thumbnail.startsWith('/') ? it.thumbnail : '/' + it.thumbnail}`,
          image: it.image.startsWith('http') ? it.image : `${assetsBase}${it.image.startsWith('/') ? it.image : '/' + it.image}`,
        }));
      }

      this.populateMemoryCache(manifest);
      await this.saveToIndexedDB('manifest:global', manifest);

      if (category) {
        return this.categoryMap.get(category) || [];
      }
      return manifest.items;
    } finally {
      this.activeControllers.delete(controller);
    }
  }

  /**
   * Get single asset by ID (O(1) Memory lookup)
   */
  public getAsset(id: string): GameAssetItem | undefined {
    return this.itemsById.get(id.toLowerCase());
  }

  /**
   * Preload a specific asset image into Cache Storage (Tier 3) and browser memory
   */
  public async preloadImage(url: string): Promise<void> {
    if (!url) return;

    // Check inflight deduplication
    if (this.inflightRequests.has(url)) {
      return this.inflightRequests.get(url);
    }

    const task = (async () => {
      // Check Cache Storage if available
      if (typeof window !== 'undefined' && 'caches' in window) {
        try {
          const cache = await caches.open(CACHE_STORAGE_NAME);
          const cached = await cache.match(url);
          if (cached) {
            // Already in cache storage! Just decode in memory.
            const img = new Image();
            img.src = url;
            if (img.decode) await img.decode().catch(() => {});
            return;
          }

          // Fetch and store in Cache Storage
          const res = await fetch(url, { cache: 'force-cache' });
          if (res.ok) {
            await cache.put(url, res.clone());
          }
        } catch {
          // Fallback to standard Image preloading
        }
      }

      // Memory decode
      return new Promise<void>((resolve) => {
        const img = new Image();
        img.src = url;
        if (img.decode) {
          img.decode().then(resolve).catch(resolve);
        } else {
          img.onload = () => resolve();
          img.onerror = () => resolve();
        }
      });
    })();

    this.inflightRequests.set(url, task);
    try {
      await task;
    } finally {
      this.inflightRequests.delete(url);
    }
  }

  /**
   * Intelligent directional prefetch:
   * When user is moving forward, prefetch [currentIndex + 1 .. currentIndex + count]
   * When user is moving backward, prefetch [currentIndex - count .. currentIndex - 1]
   */
  public prefetchDirectional(
    items: GameAssetItem[],
    currentIndex: number,
    direction: 'forward' | 'backward' = 'forward',
    count = 3
  ): void {
    if (!items || items.length === 0) return;

    const urlsToPrefetch: string[] = [];

    if (direction === 'forward') {
      const start = currentIndex + 1;
      const end = Math.min(items.length, start + count);
      for (let i = start; i < end; i++) {
        if (items[i]) {
          urlsToPrefetch.push(items[i].thumbnail, items[i].image);
        }
      }
    } else {
      const start = Math.max(0, currentIndex - count);
      const end = currentIndex;
      for (let i = start; i < end; i++) {
        if (items[i]) {
          urlsToPrefetch.push(items[i].thumbnail, items[i].image);
        }
      }
    }

    // Schedule prefetch in idle callback to never block main thread
    const runner = () => {
      urlsToPrefetch.forEach((url) => this.preloadImage(url));
    };

    if (typeof window !== 'undefined' && 'requestIdleCallback' in window) {
      (window as any).requestIdleCallback(runner, { timeout: 1000 });
    } else {
      setTimeout(runner, 100);
    }
  }

  /**
   * Abort all pending network requests when user leaves the game
   */
  public abortPendingRequests(): void {
    for (const controller of this.activeControllers) {
      controller.abort();
    }
    this.activeControllers.clear();
    this.inflightRequests.clear();
  }
}

export const gameAssetService = new GameAssetService();
