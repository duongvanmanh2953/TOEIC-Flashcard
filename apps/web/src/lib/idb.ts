/**
 * IndexedDB Offline Cache & High-Speed Storage for VocabFlow
 * Provides asynchronous, zero-blocking storage for vocabulary lists, search indexes, and review state.
 */

const DB_NAME = 'vocabflow_offline_db';
const DB_VERSION = 2;
const STORE_VOCAB = 'vocabulary';
const STORE_CACHE = 'api_cache';
const STORE_DECKS = 'local_decks';

export interface LocalDeck {
  id: string;
  title: string;
  description?: string;
  category?: string;
  cefrLevel?: string;
  words: any[];
  isProtected?: boolean;
  hasPassword?: boolean;
  status?: string;
  createdAt: number;
  updatedAt: number;
  isSyncedToCloud?: boolean;
}

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof indexedDB === 'undefined') {
      return reject(new Error('IndexedDB not supported'));
    }

    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event: IDBVersionChangeEvent) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORE_VOCAB)) {
        db.createObjectStore(STORE_VOCAB, { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains(STORE_CACHE)) {
        db.createObjectStore(STORE_CACHE, { keyPath: 'key' });
      }
      if (!db.objectStoreNames.contains(STORE_DECKS)) {
        db.createObjectStore(STORE_DECKS, { keyPath: 'id' });
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

export async function idbSaveWords(words: any[]): Promise<void> {
  try {
    const db = await openDB();
    const tx = db.transaction(STORE_VOCAB, 'readwrite');
    const store = tx.objectStore(STORE_VOCAB);
    for (const word of words) {
      store.put(word);
    }
  } catch (err) {
    console.warn('IDB write failure (fallback to RAM):', err);
  }
}

export async function idbGetWords(): Promise<any[]> {
  try {
    const db = await openDB();
    return new Promise((resolve) => {
      const tx = db.transaction(STORE_VOCAB, 'readonly');
      const store = tx.objectStore(STORE_VOCAB);
      const req = store.getAll();
      req.onsuccess = () => resolve(req.result || []);
      req.onerror = () => resolve([]);
    });
  } catch {
    return [];
  }
}

export async function idbSetCache(key: string, data: any, ttlMs: number = 3600000): Promise<void> {
  try {
    const db = await openDB();
    const tx = db.transaction(STORE_CACHE, 'readwrite');
    const store = tx.objectStore(STORE_CACHE);
    store.put({ key, data, expiresAt: Date.now() + ttlMs });
  } catch {
    // Ignored
  }
}

export async function idbGetCache<T = any>(key: string): Promise<T | null> {
  try {
    const db = await openDB();
    return new Promise((resolve) => {
      const tx = db.transaction(STORE_CACHE, 'readonly');
      const store = tx.objectStore(STORE_CACHE);
      const req = store.get(key);
      req.onsuccess = () => {
        const item = req.result;
        if (item && item.expiresAt > Date.now()) {
          resolve(item.data as T);
        } else {
          resolve(null);
        }
      };
      req.onerror = () => resolve(null);
    });
  } catch {
    return null;
  }
}

export async function idbSaveLocalDeck(deck: LocalDeck): Promise<void> {
  try {
    const db = await openDB();
    const tx = db.transaction(STORE_DECKS, 'readwrite');
    const store = tx.objectStore(STORE_DECKS);
    store.put(deck);
  } catch (err) {
    console.warn('IDB deck write failure:', err);
  }
}

export async function idbGetLocalDecks(): Promise<LocalDeck[]> {
  try {
    const db = await openDB();
    return new Promise((resolve) => {
      const tx = db.transaction(STORE_DECKS, 'readonly');
      const store = tx.objectStore(STORE_DECKS);
      const req = store.getAll();
      req.onsuccess = () => resolve(req.result || []);
      req.onerror = () => resolve([]);
    });
  } catch {
    return [];
  }
}

export async function idbDeleteLocalDeck(id: string): Promise<void> {
  try {
    const db = await openDB();
    const tx = db.transaction(STORE_DECKS, 'readwrite');
    const store = tx.objectStore(STORE_DECKS);
    store.delete(id);
  } catch (err) {
    console.warn('IDB deck delete failure:', err);
  }
}
