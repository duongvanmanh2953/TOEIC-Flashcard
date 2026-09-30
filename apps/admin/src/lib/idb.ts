/**
 * IndexedDB Offline Cache & High-Speed Storage for VocabFlow
 * Provides asynchronous, zero-blocking storage for vocabulary lists, word banks (decks),
 * search indexes, and review state with versioning and cache invalidation.
 */

const DB_NAME = 'vocabflow_offline_db';
const DB_VERSION = 4;
const STORE_VOCAB = 'vocabulary';
const STORE_CACHE = 'api_cache';
const STORE_DECKS = 'local_decks';
const STORE_META = 'metadata';

export interface LocalDeck {
  id: string;
  userId?: string;
  languageId?: string; // 'en' | 'de' | 'es' | 'zh' | 'ja' | 'ko' | 'th' | etc.
  originDeckId?: string;
  title: string;
  description?: string;
  category?: string;
  cefrLevel?: string;
  words?: any[];
  wordCount?: number;
  isProtected?: boolean;
  hasPassword?: boolean;
  password?: string;
  status?: string;
  createdAt: number;
  updatedAt: number;
  isSyncedToCloud?: boolean;
  isCloned?: boolean;
  isImported?: boolean;
  isReadOnly?: boolean;
  authorName?: string;
  sourceName?: string;
  author?: { id: string; displayName: string; avatar?: string };
}

export interface CachedWordItem {
  id: string;
  userId?: string;
  languageId?: string; // 'en' | 'de' | 'es' | 'zh' | 'ja' | 'ko' | 'th' | etc.
  deckId?: string;
  deckName?: string;
  word: string;
  phonetic?: string;
  pronunciation?: string;
  partOfSpeech?: string;
  meaning: string;
  definition?: string;
  example?: string;
  exampleTranslation?: string;
  topic?: string;
  cefrLevel?: string;
  status?: string;
  isFavorite?: boolean;
  vocabulary?: any;
  createdAt?: number;
  updatedAt?: number;
  // Multi-language specific attributes
  article?: string; // 'der' | 'die' | 'das' | 'el' | 'la'
  gender?: string; // 'masculine' | 'feminine' | 'neuter'
  pinyin?: string; // Chinese Pinyin e.g. 'nǐ hǎo'
  tone?: string; // Chinese tone notation
  romaji?: string; // Japanese Romaji e.g. 'konnichiwa'
  transliteration?: string; // Thai / Korean romanization
  script?: string;
  // Spaced Repetition (FSRS-compatible) tracking fields
  dueAt?: number;
  lastReviewedAt?: number;
  reviewCount?: number;
  correctCount?: number;
  wrongCount?: number;
  consecutiveCorrect?: number;
  consecutiveWrong?: number;
  interval?: number;
  stability?: number;
  difficulty?: number;
  masteryScore?: number;
}

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof indexedDB === 'undefined') {
      return reject(new Error('IndexedDB not supported'));
    }

    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event: IDBVersionChangeEvent) => {
      const db = (event.target as IDBOpenDBRequest).result;
      let vocabStore: IDBObjectStore;
      if (!db.objectStoreNames.contains(STORE_VOCAB)) {
        vocabStore = db.createObjectStore(STORE_VOCAB, { keyPath: 'id' });
        vocabStore.createIndex('deckId', 'deckId', { unique: false });
        vocabStore.createIndex('topic', 'topic', { unique: false });
        vocabStore.createIndex('languageId', 'languageId', { unique: false });
      } else {
        const tx = (event.target as IDBOpenDBRequest).transaction;
        if (tx) {
          vocabStore = tx.objectStore(STORE_VOCAB);
          if (!vocabStore.indexNames.contains('languageId')) {
            vocabStore.createIndex('languageId', 'languageId', { unique: false });
          }
        }
      }

      if (!db.objectStoreNames.contains(STORE_CACHE)) {
        db.createObjectStore(STORE_CACHE, { keyPath: 'key' });
      }

      let deckStore: IDBObjectStore;
      if (!db.objectStoreNames.contains(STORE_DECKS)) {
        deckStore = db.createObjectStore(STORE_DECKS, { keyPath: 'id' });
        deckStore.createIndex('languageId', 'languageId', { unique: false });
      } else {
        const tx = (event.target as IDBOpenDBRequest).transaction;
        if (tx) {
          deckStore = tx.objectStore(STORE_DECKS);
          if (!deckStore.indexNames.contains('languageId')) {
            deckStore.createIndex('languageId', 'languageId', { unique: false });
          }
        }
      }

      if (!db.objectStoreNames.contains(STORE_META)) {
        db.createObjectStore(STORE_META, { keyPath: 'key' });
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

// =============================================================================
// METADATA & VERSIONING
// =============================================================================

export async function idbSetMeta(key: string, value: any): Promise<void> {
  try {
    const db = await openDB();
    const tx = db.transaction(STORE_META, 'readwrite');
    const store = tx.objectStore(STORE_META);
    store.put({ key, value, updatedAt: Date.now() });
  } catch (_) { }
}

export async function idbGetMeta<T = any>(key: string): Promise<T | null> {
  try {
    const db = await openDB();
    return new Promise((resolve) => {
      const tx = db.transaction(STORE_META, 'readonly');
      const store = tx.objectStore(STORE_META);
      const req = store.get(key);
      req.onsuccess = () => resolve(req.result?.value ?? null);
      req.onerror = () => resolve(null);
    });
  } catch {
    return null;
  }
}

// =============================================================================
// VOCABULARY CRUD OPERATIONS
// =============================================================================

export async function idbSaveWords(
  words: any[],
  userId?: string,
  onProgress?: (saved: number, total: number) => void,
  languageId?: string
): Promise<void> {
  try {
    const db = await openDB();
    const BATCH_SIZE = 50;
    const total = words.length;

    for (let i = 0; i < total; i += BATCH_SIZE) {
      const chunk = words.slice(i, i + BATCH_SIZE);
      await new Promise<void>((resolve, reject) => {
        const tx = db.transaction(STORE_VOCAB, 'readwrite');
        const store = tx.objectStore(STORE_VOCAB);
        for (const word of chunk) {
          if (!word) continue;
          const wordObj = { ...word };
          if (userId) {
            wordObj.userId = userId;
          }
          // Ensure languageId is preserved or assigned
          wordObj.languageId = wordObj.languageId || languageId || 'en';

          if (!wordObj.id) {
            const cleanW = (wordObj.vocabulary?.word || wordObj.word || '')
              .toString()
              .trim()
              .toLowerCase()
              .replace(/[^a-z0-9]/g, '_');
            wordObj.id = `idb_vocab_${cleanW || Math.random().toString(36).substring(2)}`;
          }
          // Ensure real topic is not lost
          wordObj.topic = wordObj.topic || wordObj.vocabulary?.topic || 'General';
          store.put(wordObj);
        }
        tx.oncomplete = () => resolve();
        tx.onerror = () => reject(tx.error);
      });

      if (onProgress) {
        onProgress(Math.min(i + BATCH_SIZE, total), total);
      }

      // Yield to main thread so the browser never stutters or drops frames
      await new Promise((r) => setTimeout(r, 0));
    }
    await idbSetMeta('vocab_last_updated', Date.now());
  } catch (err) {
    console.warn('IDB write failure:', err);
  }
}

export async function idbGetWords(userId?: string, languageId?: string): Promise<any[]> {
  try {
    const db = await openDB();
    return new Promise((resolve) => {
      const tx = db.transaction(STORE_VOCAB, 'readonly');
      const store = tx.objectStore(STORE_VOCAB);
      const req = store.getAll();
      req.onsuccess = () => {
        const all: any[] = req.result || [];
        const filtered = all.filter((w) => {
          // Isolate by user: match user ID or guest session
          const userMatch = !userId || w.userId === userId || (!w.userId && (userId === 'guest' || userId.startsWith('anon_')));
          if (!userMatch) return false;

          // Isolate by language: match specified languageId (or treat missing as 'en' for backward compatibility)
          if (languageId) {
            return w.languageId === languageId || (!w.languageId && languageId === 'en');
          }
          return true;
        });
        resolve(filtered);
      };
      req.onerror = () => resolve([]);
    });
  } catch {
    return [];
  }
}

export async function idbUpdateWord(id: string, updates: Partial<CachedWordItem>): Promise<void> {
  try {
    const db = await openDB();
    const tx = db.transaction(STORE_VOCAB, 'readwrite');
    const store = tx.objectStore(STORE_VOCAB);
    const req = store.get(id);
    req.onsuccess = () => {
      const existing = req.result;
      if (existing) {
        const updated = {
          ...existing,
          ...updates,
          vocabulary: {
            ...(existing.vocabulary || {}),
            ...(updates.vocabulary || {}),
            ...(updates.word ? { word: updates.word } : {}),
            ...(updates.meaning ? { definition: updates.meaning, shortDefinition: updates.meaning } : {}),
            ...(updates.phonetic !== undefined ? { phonetic: updates.phonetic } : {}),
            ...(updates.topic ? { topic: updates.topic } : {}),
            ...(updates.cefrLevel ? { cefrLevel: updates.cefrLevel } : {}),
          },
          updatedAt: Date.now(),
        };
        store.put(updated);
      }
    };
  } catch (err) {
    console.warn('IDB update word failure:', err);
  }
}

export async function idbUpdateWordProgress(
  id: string,
  progress: {
    dueAt?: number;
    lastReviewedAt?: number;
    reviewCount?: number;
    correctCount?: number;
    wrongCount?: number;
    consecutiveCorrect?: number;
    consecutiveWrong?: number;
    interval?: number;
    stability?: number;
    difficulty?: number;
    masteryScore?: number;
    status?: string;
  }
): Promise<void> {
  try {
    const db = await openDB();
    const tx = db.transaction(STORE_VOCAB, 'readwrite');
    const store = tx.objectStore(STORE_VOCAB);
    const req = store.get(id);
    req.onsuccess = () => {
      const existing = req.result;
      if (existing) {
        const updated = {
          ...existing,
          ...progress,
          vocabulary: {
            ...(existing.vocabulary || {}),
            ...progress,
          },
          updatedAt: Date.now(),
        };
        store.put(updated);
      }
    };
  } catch (err) {
    console.warn('IDB update word progress failure:', err);
  }
}

export async function idbDeleteWord(id: string): Promise<void> {
  try {
    const db = await openDB();
    const tx = db.transaction(STORE_VOCAB, 'readwrite');
    const store = tx.objectStore(STORE_VOCAB);
    store.delete(id);
  } catch (err) {
    console.warn('IDB delete word failure:', err);
  }
}

export async function idbDeleteWords(ids: string[]): Promise<void> {
  try {
    const db = await openDB();
    const tx = db.transaction(STORE_VOCAB, 'readwrite');
    const store = tx.objectStore(STORE_VOCAB);
    for (const id of ids) {
      store.delete(id);
    }
  } catch (err) {
    console.warn('IDB bulk delete words failure:', err);
  }
}

export async function idbToggleFavorite(id: string): Promise<boolean> {
  try {
    const db = await openDB();
    const tx = db.transaction(STORE_VOCAB, 'readwrite');
    const store = tx.objectStore(STORE_VOCAB);
    return new Promise((resolve) => {
      const req = store.get(id);
      req.onsuccess = () => {
        const item = req.result;
        if (item) {
          item.isFavorite = !item.isFavorite;
          if (item.vocabulary) item.vocabulary.isFavorite = item.isFavorite;
          store.put(item);
          resolve(item.isFavorite);
        } else {
          resolve(false);
        }
      };
      req.onerror = () => resolve(false);
    });
  } catch {
    return false;
  }
}

export async function idbClearAllWords(): Promise<void> {
  try {
    const db = await openDB();
    const tx = db.transaction(STORE_VOCAB, 'readwrite');
    const store = tx.objectStore(STORE_VOCAB);
    store.clear();
  } catch (err) {
    console.warn('IDB clear words failure:', err);
  }
}

// =============================================================================
// DECK / WORD BANK CRUD OPERATIONS
// =============================================================================

export async function idbSaveLocalDeck(deck: LocalDeck, userId?: string, languageId?: string): Promise<void> {
  try {
    const db = await openDB();
    const tx = db.transaction(STORE_DECKS, 'readwrite');
    const store = tx.objectStore(STORE_DECKS);
    const deckToSave = { ...deck };
    if (userId) {
      deckToSave.userId = userId;
    }
    deckToSave.languageId = deckToSave.languageId || languageId || 'en';
    store.put(deckToSave);
  } catch (err) {
    console.warn('IDB deck write failure:', err);
  }
}

export async function idbUpdateLocalDeck(id: string, updates: Partial<LocalDeck>): Promise<void> {
  try {
    const db = await openDB();
    const tx = db.transaction(STORE_DECKS, 'readwrite');
    const store = tx.objectStore(STORE_DECKS);
    const req = store.get(id);
    req.onsuccess = () => {
      const existing = req.result;
      if (existing) {
        store.put({ ...existing, ...updates, updatedAt: Date.now() });
      }
    };
  } catch (err) {
    console.warn('IDB deck update failure:', err);
  }
}

export async function idbGetLocalDecks(userId?: string, languageId?: string): Promise<LocalDeck[]> {
  try {
    const db = await openDB();
    return new Promise((resolve) => {
      const tx = db.transaction(STORE_DECKS, 'readonly');
      const store = tx.objectStore(STORE_DECKS);
      const req = store.getAll();
      req.onsuccess = () => {
        const all: LocalDeck[] = req.result || [];
        const filtered = all.filter((d) => {
          const userMatch = !userId || d.userId === userId || (!d.userId && (userId === 'guest' || userId.startsWith('anon_')));
          if (!userMatch) return false;

          if (languageId) {
            return d.languageId === languageId || (!d.languageId && languageId === 'en');
          }
          return true;
        });
        resolve(filtered);
      };
      req.onerror = () => resolve([]);
    });
  } catch {
    return [];
  }
}

/**
 * Resets all words and decks for a specific language without affecting other languages or user profile
 */
export async function idbResetLanguageData(userId: string | undefined, languageId: string): Promise<void> {
  try {
    const words = await idbGetWords(userId, languageId);
    const wordIds = words.map((w) => w.id);
    if (wordIds.length > 0) {
      await idbDeleteWords(wordIds);
    }

    const decks = await idbGetLocalDecks(userId, languageId);
    const deckIds = decks.map((d) => d.id);
    if (deckIds.length > 0) {
      await idbDeleteLocalDecks(deckIds);
    }
  } catch (err) {
    console.warn(`IDB reset language [${languageId}] failure:`, err);
  }
}

/**
 * Idempotent data migration: ensures all existing un-tagged records are assigned to 'en' (English)
 */
export async function migrateUserLearningData(userId?: string): Promise<void> {
  try {
    const db = await openDB();
    const MIGRATION_FLAG = `vocabflow:migration:v4:${userId || 'guest'}`;
    if (typeof localStorage !== 'undefined' && localStorage.getItem(MIGRATION_FLAG) === 'completed') {
      return;
    }

    // 1. Tag legacy words missing languageId as 'en'
    const wordsTx = db.transaction(STORE_VOCAB, 'readwrite');
    const wordsStore = wordsTx.objectStore(STORE_VOCAB);
    const wordsReq = wordsStore.getAll();
    wordsReq.onsuccess = () => {
      const allWords: any[] = wordsReq.result || [];
      for (const w of allWords) {
        if (!w.languageId) {
          w.languageId = 'en';
          wordsStore.put(w);
        }
      }
    };

    // 2. Tag legacy decks missing languageId as 'en'
    const decksTx = db.transaction(STORE_DECKS, 'readwrite');
    const decksStore = decksTx.objectStore(STORE_DECKS);
    const decksReq = decksStore.getAll();
    decksReq.onsuccess = () => {
      const allDecks: any[] = decksReq.result || [];
      for (const d of allDecks) {
        if (!d.languageId) {
          d.languageId = 'en';
          decksStore.put(d);
        }
      }
    };

    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(MIGRATION_FLAG, 'completed');
    }
  } catch (err) {
    console.warn('Migration to multi-language schema completed with note:', err);
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

export async function idbDeleteLocalDecks(ids: string[]): Promise<void> {
  try {
    const db = await openDB();
    const tx = db.transaction(STORE_DECKS, 'readwrite');
    const store = tx.objectStore(STORE_DECKS);
    for (const id of ids) {
      store.delete(id);
    }
  } catch (err) {
    console.warn('IDB bulk delete decks failure:', err);
  }
}

export async function idbClearAllDecks(): Promise<void> {
  try {
    const db = await openDB();
    const tx = db.transaction(STORE_DECKS, 'readwrite');
    const store = tx.objectStore(STORE_DECKS);
    store.clear();
  } catch (err) {
    console.warn('IDB clear decks failure:', err);
  }
}

/**
 * Completely purges offline stores when switching accounts to ensure zero leakage
 */
export async function idbClearAllUserData(): Promise<void> {
  await Promise.allSettled([
    idbClearAllDecks(),
    idbClearAllWords(),
  ]);
}

// =============================================================================
// API CACHE OPERATIONS (TTL, Invalidation)
// =============================================================================

export async function idbSetCache(key: string, data: any, ttlMs: number = 3600000): Promise<void> {
  try {
    const db = await openDB();
    const tx = db.transaction(STORE_CACHE, 'readwrite');
    const store = tx.objectStore(STORE_CACHE);
    store.put({ key, data, expiresAt: Date.now() + ttlMs, cachedAt: Date.now() });
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

export async function idbInvalidateCache(keyPrefix: string): Promise<void> {
  try {
    const db = await openDB();
    const tx = db.transaction(STORE_CACHE, 'readwrite');
    const store = tx.objectStore(STORE_CACHE);
    const req = store.getAllKeys();
    req.onsuccess = () => {
      const keys = req.result as string[];
      for (const k of keys) {
        if (typeof k === 'string' && k.startsWith(keyPrefix)) {
          store.delete(k);
        }
      }
    };
  } catch (_) { }
}

export async function idbGetWordsByDeck(deckId: string): Promise<any[]> {
  const all = await idbGetWords();
  return all.filter((w) => w.deckId === deckId);
}

export const idbGetDecks = idbGetLocalDecks;

export function getSessionUnlockedDecks(): Record<string, boolean> {
  try {
    const raw = sessionStorage.getItem('vocabflow_unlocked_decks');
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

export function saveSessionUnlockedDeck(deckId: string): void {
  try {
    const existing = getSessionUnlockedDecks();
    existing[deckId] = true;
    sessionStorage.setItem('vocabflow_unlocked_decks', JSON.stringify(existing));
  } catch { }
}


