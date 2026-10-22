import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  ConflictException,
  Logger,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Observable, of } from 'rxjs';
import { tap, catchError } from 'rxjs/operators';
import { RedisCacheService } from '../cache/redis-cache.service';
import { IDEMPOTENT_KEY, IdempotentOptions } from '../decorators/idempotent.decorator';

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
    const headerKey = request.headers['x-idempotency-key'] as string;

    // Build unique idempotency key for this operation
    const idempotencyKey = headerKey
      ? `idemp:key:${userId}:${headerKey}`
      : `idemp:op:${userId}:${request.method}:${request.url}`;

    const userLockKey = `lock:payment:user:${userId}`;
    const ttl = options.ttlSeconds || 120;

    // 1. User Concurrency Lock (1 user chỉ được thực hiện 1 giao dịch tại 1 thời điểm)
    if (options.lockUser && userId !== 'anonymous') {
      const lockAcquired = await this.redisCache.setIfNotExists(userLockKey, 'LOCKED', 10);
      if (!lockAcquired) {
        throw new ConflictException(
          'Giao dịch của bạn đang được xử lý hoặc có yêu cầu cùng lúc. Vui lòng chờ vài giây trước khi thử lại!',
        );
      }
    }

    // 2. Check Idempotency Key cache
    const existing = await this.redisCache.get(idempotencyKey);
    if (existing) {
      // Release user lock if returning early
      if (options.lockUser && userId !== 'anonymous') {
        await this.redisCache.del(userLockKey);
      }

      if (existing.status === 'PROCESSING') {
        throw new ConflictException(
          'Yêu cầu này đang được xử lý trong hàng đợi, vui lòng không gửi lại nhiều lần!',
        );
      }

      if (existing.status === 'COMPLETED') {
        this.logger.log(`[Idempotency Hit] Serving cached response for key: ${idempotencyKey}`);
        return of(existing.response);
      }
    }

    // Mark as PROCESSING in Redis
    await this.redisCache.set(idempotencyKey, { status: 'PROCESSING', startedAt: Date.now() }, ttl);

    return next.handle().pipe(
      tap(async (response) => {
        // Cache successful response as COMPLETED
        await this.redisCache.set(
          idempotencyKey,
          { status: 'COMPLETED', response, finishedAt: Date.now() },
          ttl,
        );
        // Release user concurrency lock
        if (options.lockUser && userId !== 'anonymous') {
          await this.redisCache.del(userLockKey);
        }
      }),
      catchError(async (err) => {
        // In case of error, delete idempotency key and release lock so user can retry safely
        await this.redisCache.del(idempotencyKey);
        if (options.lockUser && userId !== 'anonymous') {
          await this.redisCache.del(userLockKey);
        }
        throw err;
      }),
    );
  }
}
