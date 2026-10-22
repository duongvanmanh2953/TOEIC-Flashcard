import { Injectable, OnModuleInit, OnModuleDestroy, Logger } from '@nestjs/common';
import Redis from 'ioredis';
import * as crypto from 'crypto';

@Injectable()
export class RedisCacheService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(RedisCacheService.name);
  private client: Redis | null = null;
  private isConnected = false;
  private inMemoryFallback = new Map<string, { value: string; expiresAt: number }>();

  onModuleInit() {
    const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';
    try {
      this.client = new Redis(redisUrl, {
        maxRetriesPerRequest: 1,
        retryStrategy: (times) => {
          if (times > 3) {
            this.logger.warn(`Redis connection retry limit reached. Using in-memory fallback.`);
            return null;
          }
          return Math.min(times * 100, 2000);
        },
        lazyConnect: true,
      });

      this.client.connect().then(() => {
        this.isConnected = true;
        this.logger.log(`Connected to Redis cache at ${redisUrl}`);
      }).catch((err) => {
        this.isConnected = false;
        this.logger.warn(`Could not connect to Redis (${err.message}). Using memory fallback.`);
      });

      this.client.on('error', (err) => {
        this.isConnected = false;
        this.logger.warn(`Redis client error: ${err.message}`);
      });

      this.client.on('connect', () => {
        this.isConnected = true;
      });
    } catch (err: any) {
      this.logger.warn(`Failed to initialize Redis client: ${err.message}. Using memory fallback.`);
    }
  }

  async onModuleDestroy() {
    if (this.client) {
      try {
        await this.client.quit();
      } catch (_) {}
    }
  }

  async get<T = any>(key: string): Promise<T | null> {
    if (this.isConnected && this.client) {
      try {
        const raw = await this.client.get(key);
        if (raw) return JSON.parse(raw);
      } catch (err: any) {
        this.logger.warn(`Redis get error for key ${key}: ${err.message}`);
      }
    }

    // Fallback to in-memory
    const item = this.inMemoryFallback.get(key);
    if (item) {
      if (item.expiresAt > Date.now()) {
        try {
          return JSON.parse(item.value);
        } catch {
          return null;
        }
      } else {
        this.inMemoryFallback.delete(key);
      }
    }
    return null;
  }

  private static readonly MAX_FALLBACK_ENTRIES = 2000;

  async set(key: string, value: any, ttlSeconds: number = 3600): Promise<void> {
    const serialized = JSON.stringify(value);

    if (this.isConnected && this.client) {
      try {
        await this.client.set(key, serialized, 'EX', ttlSeconds);
        return;
      } catch (err: any) {
        this.logger.warn(`Redis set error for key ${key}: ${err.message}`);
      }
    }

    // Fallback to bounded in-memory cache to prevent memory leaks
    if (this.inMemoryFallback.size >= RedisCacheService.MAX_FALLBACK_ENTRIES) {
      const now = Date.now();
      for (const [k, v] of this.inMemoryFallback.entries()) {
        if (v.expiresAt <= now) {
          this.inMemoryFallback.delete(k);
        }
      }
      if (this.inMemoryFallback.size >= RedisCacheService.MAX_FALLBACK_ENTRIES) {
        let evictCount = Math.floor(RedisCacheService.MAX_FALLBACK_ENTRIES * 0.2);
        for (const k of this.inMemoryFallback.keys()) {
          this.inMemoryFallback.delete(k);
          if (--evictCount <= 0) break;
        }
      }
    }

    this.inMemoryFallback.set(key, {
      value: serialized,
      expiresAt: Date.now() + ttlSeconds * 1000,
    });
  }

  /**
   * Distributed Lock / Idempotency setter (SETNX with TTL)
   * Returns true if lock was acquired, false if key already exists
   */
  async setIfNotExists(key: string, value: any, ttlSeconds: number = 60): Promise<boolean> {
    const serialized = JSON.stringify(value);

    if (this.isConnected && this.client) {
      try {
        const res = await this.client.set(key, serialized, 'EX', ttlSeconds, 'NX');
        return res === 'OK';
      } catch (err: any) {
        this.logger.warn(`Redis setNX error for key ${key}: ${err.message}`);
      }
    }

    // In-memory fallback
    const existing = this.inMemoryFallback.get(key);
    if (existing && existing.expiresAt > Date.now()) {
      return false;
    }

    this.inMemoryFallback.set(key, {
      value: serialized,
      expiresAt: Date.now() + ttlSeconds * 1000,
    });
    return true;
  }

  /**
   * Acquire a distributed lock with a unique ownership token
   * Returns lockToken (string) if acquired, null if already locked
   */
  async acquireLock(key: string, ttlSeconds: number = 10): Promise<string | null> {
    const lockToken = crypto.randomUUID();

    if (this.isConnected && this.client) {
      try {
        const res = await this.client.set(key, lockToken, 'EX', ttlSeconds, 'NX');
        if (res === 'OK') {
          return lockToken;
        }
        return null;
      } catch (err: any) {
        this.logger.warn(`Redis acquireLock error for key ${key}: ${err.message}`);
      }
    }

    // In-memory fallback with token ownership
    const existing = this.inMemoryFallback.get(key);
    if (existing && existing.expiresAt > Date.now()) {
      return null;
    }

    this.inMemoryFallback.set(key, {
      value: lockToken,
      expiresAt: Date.now() + ttlSeconds * 1000,
    });
    return lockToken;
  }

  /**
   * Atomic Lua script release lock: Only the owner with matching token can delete the lock.
   * Prevents removing another process's lock if TTL expired.
   */
  async releaseLock(key: string, lockToken: string): Promise<boolean> {
    if (!lockToken) return false;

    if (this.isConnected && this.client) {
      try {
        // Lua script: check value matches token, only then delete
        const luaScript = `
          if redis.call("get", KEYS[1]) == ARGV[1] then
            return redis.call("del", KEYS[1])
          else
            return 0
          end
        `;
        const result = await this.client.eval(luaScript, 1, key, lockToken);
        return result === 1;
      } catch (err: any) {
        this.logger.warn(`Redis releaseLock error for key ${key}: ${err.message}`);
      }
    }

    // In-memory fallback: only delete if token matches
    const existing = this.inMemoryFallback.get(key);
    if (existing && existing.value === lockToken) {
      this.inMemoryFallback.delete(key);
      return true;
    }
    return false;
  }

  async del(key: string): Promise<void> {
    if (this.isConnected && this.client) {
      try {
        await this.client.del(key);
      } catch (err: any) {
        this.logger.warn(`Redis del error for key ${key}: ${err.message}`);
      }
    }
    this.inMemoryFallback.delete(key);
  }

  async delPattern(pattern: string): Promise<void> {
    if (this.isConnected && this.client) {
      try {
        const stream = this.client.scanStream({ match: pattern, count: 100 });
        const pipeline = this.client.pipeline();
        let pendingDeletes = 0;

        await new Promise<void>((resolve, reject) => {
          stream.on('data', (keys: string[]) => {
            if (keys && keys.length > 0) {
              for (const k of keys) {
                pipeline.del(k);
                pendingDeletes++;
              }
              if (pendingDeletes >= 500) {
                pipeline.exec().catch(() => {});
                pendingDeletes = 0;
              }
            }
          });
          stream.on('end', async () => {
            if (pendingDeletes > 0) {
              await pipeline.exec().catch(() => {});
            }
            resolve();
          });
          stream.on('error', (err) => {
            reject(err);
          });
        });
      } catch (err: any) {
        this.logger.warn(`Redis delPattern error for pattern ${pattern}: ${err.message}`);
      }
    }

    // In-memory pattern deletion
    const regex = new RegExp('^' + pattern.replace(/\*/g, '.*') + '$');
    for (const key of this.inMemoryFallback.keys()) {
      if (regex.test(key)) {
        this.inMemoryFallback.delete(key);
      }
    }
  }

  async invalidateUserVocab(userId: string): Promise<void> {
    await this.delPattern(`vocabulary:all:${userId}*`);
    await this.delPattern(`vocabulary:my-words:${userId}*`);
  }

  async invalidateDeck(deckId: string): Promise<void> {
    await this.delPattern(`vocabulary:deck:${deckId}*`);
    await this.delPattern(`community:decks*`);
  }

  async invalidateTopics(): Promise<void> {
    await this.del(`topic:list`);
    await this.del(`level:list`);
  }
}
