import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  ConflictException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Observable, of } from 'rxjs';
import { tap, catchError } from 'rxjs/operators';
import * as crypto from 'crypto';
import { RedisCacheService } from '../cache/redis-cache.service';
import { IDEMPOTENT_KEY, IdempotentOptions } from '../decorators/idempotent.decorator';

const IDEMPOTENCY_KEY_REGEX = /^[A-Za-z0-9_\-\.:]{8,128}$/;

interface CachedIdempotentEntry {
  status: 'PROCESSING' | 'COMPLETED';
  payloadHash: string;
  response?: any;
  startedAt: number;
  finishedAt?: number;
}

@Injectable()
export class IdempotencyInterceptor implements NestInterceptor {
  private readonly logger = new Logger(IdempotencyInterceptor.name);

  constructor(
    private readonly reflector: Reflector,
    private readonly redisCache: RedisCacheService,
  ) {}

  async intercept(context: ExecutionContext, next: CallHandler): Promise<Observable<any>> {
    const options = this.reflector.get<IdempotentOptions>(IDEMPOTENT_KEY, context.getHandler());
    if (!options) {
      return next.handle();
    }

    const request = context.switchToHttp().getRequest();
    const userId = request.user?.id || 'anonymous';
    const headerKey = request.headers['x-idempotency-key'] as string | undefined;

    // 1. Validate X-Idempotency-Key if present
    if (headerKey) {
      if (!IDEMPOTENCY_KEY_REGEX.test(headerKey)) {
        throw new BadRequestException(
          'X-Idempotency-Key header không hợp lệ. Phải gồm từ 8 đến 128 ký tự chữ, số, gạch nối hoặc gạch dưới.',
        );
      }
    }

    // 2. Canonical Payload Fingerprint (Hash method, path, and sorted body)
    const sortedBody = this.sortObjectKeys(request.body || {});
    const canonicalPayload = JSON.stringify({
      method: request.method,
      path: request.url,
      body: sortedBody,
    });
    const currentPayloadHash = crypto.createHash('sha256').update(canonicalPayload).digest('hex');

    // 3. Namespace key by user and business operation to prevent collision
    const idempotencyKey = headerKey
      ? `idemp:key:${userId}:${headerKey}`
      : `idemp:op:${userId}:${request.method}:${request.url}`;

    // Scope concurrency lock per user AND business operation/path to prevent blocking unrelated actions
    const operationPath = (request.route?.path || request.url || 'default').split('?')[0].replace(/\//g, '_');
    const userLockKey = `lock:op:${operationPath}:user:${userId}`;
    const ttl = options.ttlSeconds || 120;
    let lockToken: string | null = null;

    // 4. Concurrency Lock: 1 user cannot initiate concurrent payments simultaneously
    if (options.lockUser && userId !== 'anonymous') {
      lockToken = await this.redisCache.acquireLock(userLockKey, 15);
      if (!lockToken) {
        throw new ConflictException(
          'Giao dịch của bạn đang được xử lý hoặc có yêu cầu cùng lúc. Vui lòng chờ vài giây trước khi thử lại!',
        );
      }
    }

    // 5. Check Idempotency Key Status
    try {
      const existing: CachedIdempotentEntry | null = await this.redisCache.get<CachedIdempotentEntry>(idempotencyKey);
      if (existing) {
        // If key exists, release user lock early
        if (lockToken) {
          await this.redisCache.releaseLock(userLockKey, lockToken);
          lockToken = null;
        }

        // Check for payload tampering / collision
        if (existing.payloadHash && existing.payloadHash !== currentPayloadHash) {
          throw new ConflictException(
            'X-Idempotency-Key đã được sử dụng cho một yêu cầu khác nội dung. Vui lòng tạo key mới!',
          );
        }

        if (existing.status === 'PROCESSING') {
          throw new ConflictException(
            'Yêu cầu này đang được xử lý trong hệ thống, vui lòng không gửi lại!',
          );
        }

        if (existing.status === 'COMPLETED') {
          this.logger.log(`[Idempotency Hit] Serving completed response for key: ${idempotencyKey}`);
          return of(existing.response);
        }
      }

      // Mark as PROCESSING in Redis
      await this.redisCache.set(
        idempotencyKey,
        {
          status: 'PROCESSING',
          payloadHash: currentPayloadHash,
          startedAt: Date.now(),
        },
        ttl,
      );
    } catch (err) {
      // Release lock on error before rethrowing
      if (lockToken) {
        await this.redisCache.releaseLock(userLockKey, lockToken);
      }
      throw err;
    }

    // 6. Execute business handler with state caching
    return next.handle().pipe(
      tap(async (response) => {
        // Cache successful response as COMPLETED
        await this.redisCache.set(
          idempotencyKey,
          {
            status: 'COMPLETED',
            payloadHash: currentPayloadHash,
            response,
            finishedAt: Date.now(),
          },
          ttl,
        );
        // Safely release lock using token ownership
        if (lockToken) {
          await this.redisCache.releaseLock(userLockKey, lockToken);
          lockToken = null;
        }
      }),
      catchError(async (err) => {
        // On error, delete idempotency key so client can safely retry
        await this.redisCache.del(idempotencyKey);
        if (lockToken) {
          await this.redisCache.releaseLock(userLockKey, lockToken);
          lockToken = null;
        }
        throw err;
      }),
    );
  }

  /**
   * Deterministically sort object keys for reproducible hashing
   */
  private sortObjectKeys(obj: any): any {
    if (obj === null || typeof obj !== 'object' || Array.isArray(obj)) {
      return obj;
    }
    const sorted: Record<string, any> = {};
    Object.keys(obj)
      .sort()
      .forEach((key) => {
        sorted[key] = this.sortObjectKeys(obj[key]);
      });
    return sorted;
  }
}
