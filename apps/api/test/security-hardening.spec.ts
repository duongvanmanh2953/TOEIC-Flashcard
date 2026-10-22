import * as assert from 'assert';
import { ExecutionContext, CallHandler, ConflictException, BadRequestException } from '@nestjs/common';
import { of, throwError } from 'rxjs';
import { IdempotencyInterceptor } from '../src/common/interceptors/idempotency.interceptor';
import { RedisCacheService } from '../src/common/cache/redis-cache.service';
import { RabbitMQService, QUEUES } from '../src/common/rabbitmq/rabbitmq.service';

/**
 * Mock Reflector
 */
class MockReflector {
  constructor(private options: any) {}
  get() {
    return this.options;
  }
}

/**
 * Mock ExecutionContext
 */
function createMockContext(headers: Record<string, string>, body: any, userId = 'user_123'): ExecutionContext {
  const req = {
    method: 'POST',
    url: '/subscriptions/create-payment',
    headers,
    body,
    user: { id: userId },
  };
  return {
    switchToHttp: () => ({
      getRequest: () => req,
    }),
    getHandler: () => ({}),
    getClass: () => ({}),
  } as any;
}

/**
 * Mock CallHandler
 */
function createCallHandler(response: any): CallHandler {
  return {
    handle: () => of(response),
  };
}

async function runTests() {
  console.log('\n======================================================');
  console.log('🧪 RUNNING VOCABFLOW SECURITY & FAULT TOLERANCE TESTS');
  console.log('======================================================\n');

  let passed = 0;
  let failed = 0;

  async function test(name: string, fn: () => Promise<void>) {
    try {
      await fn();
      console.log(`  ✅ PASS: ${name}`);
      passed++;
    } catch (err: any) {
      console.error(`  ❌ FAIL: ${name}`);
      console.error(`     Error: ${err.message}`);
      failed++;
    }
  }

  const redis = new RedisCacheService();
  redis.onModuleInit();

  // ---------------------------------------------------------------------------
  // TEST SUITE 1: REDIS DISTRIBUTED LOCK & ATOMIC LUA RELEASE
  // ---------------------------------------------------------------------------
  await test('Redis Lock: acquires token and prevents concurrent acquisition', async () => {
    const lockKey = 'test:lock:1';
    const token1 = await redis.acquireLock(lockKey, 5);
    assert.ok(token1, 'Token 1 should be acquired');

    // Second acquire on same key must fail
    const token2 = await redis.acquireLock(lockKey, 5);
    assert.strictEqual(token2, null, 'Token 2 must be null while locked');

    // Clean up
    await redis.releaseLock(lockKey, token1!);
  });

  await test('Redis Lock: cannot be released with invalid/stolen token (Anti-Hijack)', async () => {
    const lockKey = 'test:lock:2';
    const token = await redis.acquireLock(lockKey, 5);
    assert.ok(token, 'Token should be acquired');

    // Attempt release with wrong token
    const wrongReleased = await redis.releaseLock(lockKey, 'wrong-token-uuid');
    assert.strictEqual(wrongReleased, false, 'Release with wrong token must return false');

    // Release with correct token must succeed
    const correctReleased = await redis.releaseLock(lockKey, token!);
    assert.strictEqual(correctReleased, true, 'Release with correct token must succeed');
  });

  // ---------------------------------------------------------------------------
  // TEST SUITE 2: IDEMPOTENCY KEY VALIDATION & TAMPERING DETECTION
  // ---------------------------------------------------------------------------
  const reflector = new MockReflector({ ttlSeconds: 60, lockUser: true });
  const interceptor = new IdempotencyInterceptor(reflector as any, redis);

  await test('Idempotency: Rejects invalid header format (XSS / Overflow protection)', async () => {
    const ctx = createMockContext({ 'x-idempotency-key': 'bad!@#$%^&*()' }, { tier: 'PRO' });
    let threw = false;
    try {
      await interceptor.intercept(ctx, createCallHandler({ success: true }));
    } catch (err: any) {
      threw = true;
      assert.ok(err instanceof BadRequestException, 'Should throw BadRequestException for invalid key');
    }
    assert.ok(threw, 'Must reject malformed idempotency keys');
  });

  await test('Idempotency: Successfully returns cached result on duplicate completed request', async () => {
    const key = 'idem_valid_key_001';
    const body = { tier: 'PRO', billingCycle: 'yearly' };
    const initialResponse = { orderCode: 888123, qrUrl: 'https://img.vietqr.io/test' };

    // First request: processes and caches
    const ctx1 = createMockContext({ 'x-idempotency-key': key }, body, 'user_abc');
    const obs1 = await interceptor.intercept(ctx1, createCallHandler(initialResponse));
    const result1 = await obs1.toPromise();
    assert.deepStrictEqual(result1, initialResponse, 'First response must match handler');

    // Second request: identical key & body must return cached result without re-executing
    let secondHandlerExecuted = false;
    const trackingHandler: CallHandler = {
      handle: () => {
        secondHandlerExecuted = true;
        return of({ orderCode: 999999 }); // Different response that should NOT be called
      },
    };
    const ctx2 = createMockContext({ 'x-idempotency-key': key }, body, 'user_abc');
    const obs2 = await interceptor.intercept(ctx2, trackingHandler);
    const result2 = await obs2.toPromise();

    assert.strictEqual(secondHandlerExecuted, false, 'Handler must NOT be executed on cached hit');
    assert.deepStrictEqual(result2, initialResponse, 'Second response must return cached result');
  });

  await test('Idempotency: Rejects payload mismatch on duplicate key (Tampering Detection)', async () => {
    const key = 'idem_tamper_key_002';
    const bodyA = { tier: 'PLUS', billingCycle: 'monthly' };
    const bodyB = { tier: 'PRO', billingCycle: 'yearly' }; // Tampered payload with same key

    // First request with bodyA
    const ctx1 = createMockContext({ 'x-idempotency-key': key }, bodyA, 'user_tamper');
    const obs1 = await interceptor.intercept(ctx1, createCallHandler({ orderCode: 111 }));
    await obs1.toPromise();

    // Second request with bodyB and same key
    const ctx2 = createMockContext({ 'x-idempotency-key': key }, bodyB, 'user_tamper');
    let threw = false;
    try {
      await interceptor.intercept(ctx2, createCallHandler({ orderCode: 222 }));
    } catch (err: any) {
      threw = true;
      assert.ok(err instanceof ConflictException, 'Should throw ConflictException for payload mismatch');
      assert.ok(err.message.includes('khác nội dung'), 'Error message should describe mismatch');
    }
    assert.ok(threw, 'Must reject payload mismatch');
  });

  await test('Idempotency: Rejects concurrent request with 409 Conflict', async () => {
    const key = 'idem_concurrent_key_003';
    const body = { tier: 'PRO' };
    const user = 'user_concurrent';

    // Manually mark key as PROCESSING in Redis
    await redis.set(
      `idemp:key:${user}:${key}`,
      {
        status: 'PROCESSING',
        payloadHash: 'dummy',
        startedAt: Date.now(),
      },
      60,
    );

    const ctx = createMockContext({ 'x-idempotency-key': key }, body, user);
    let threw = false;
    try {
      await interceptor.intercept(ctx, createCallHandler({ orderCode: 333 }));
    } catch (err: any) {
      threw = true;
      assert.ok(err instanceof ConflictException, 'Should throw ConflictException when PROCESSING');
    }
    assert.ok(threw, 'Must reject concurrent in-flight request');
  });

  // ---------------------------------------------------------------------------
  // TEST SUITE 3: RABBITMQ PUBLISHER CONFIRM & IN-PROCESS FALLBACK RESILIENCE
  // ---------------------------------------------------------------------------
  await test('RabbitMQ: Buffers and publishes message without crashing when broker offline', async () => {
    const rabbitMQ = new RabbitMQService();
    await rabbitMQ.onModuleInit();

    let receivedData: any = null;
    await rabbitMQ.consume('vocabflow.test.queue', async (data, ack) => {
      receivedData = data;
      ack();
    });

    const testPayload = { matchId: 'room_101', score: 500 };
    const published = await rabbitMQ.publish('vocabflow.test.queue', testPayload);
    assert.strictEqual(published, true, 'Publish must return true');

    // Wait a tick for in-process fallback dispatch
    await new Promise((r) => setTimeout(r, 50));
    assert.deepStrictEqual(receivedData, testPayload, 'Consumer must receive published data');

    await rabbitMQ.onModuleDestroy();
  });

  // ---------------------------------------------------------------------------
  // TEST SUITE 4: PAYMENT WEBHOOK SECURITY & ANTI-REPLAY PREVENTION
  // ---------------------------------------------------------------------------
  await test('Payment Webhook: Rejects request when secret is configured but header is missing', async () => {
    process.env.PAYMENT_WEBHOOK_SECRET = 'secret_webhook_key_xyz';

    // Mock Prisma & SubscriptionsService
    const mockPrisma: any = {
      systemConfig: { findUnique: async () => null },
      plan: { findUnique: async () => ({ id: 'plan_pro', tier: 'PRO', priceMonthly: 199000 }) },
      paymentOrder: { findUnique: async () => null },
    };
    const mockRabbit: any = {
      consume: async () => {},
      publish: async () => true,
    };

    const { SubscriptionsService } = require('../src/modules/subscriptions/subscriptions.service');
    const subService = new SubscriptionsService(mockPrisma, mockRabbit);

    let threw = false;
    try {
      await subService.handleVietQRWebhook({ content: 'VF123456', amount: 199000 }, undefined);
    } catch (err: any) {
      threw = true;
      assert.strictEqual(err.status, 401, 'Should return 401 Unauthorized');
      assert.ok(err.message.includes('Chữ ký Webhook'), 'Error must mention missing signature');
    }
    assert.ok(threw, 'Must reject unsigned webhook when secret is set');

    delete process.env.PAYMENT_WEBHOOK_SECRET;
  });

  await test('Payment Webhook: Skips duplicate fulfillment on already PAID order', async () => {
    let transactionCommitted = false;
    let publishCount = 0;

    const mockPrisma: any = {
      systemConfig: { findUnique: async () => null },
      paymentOrder: {
        findUnique: async () => ({
          id: 'order_1',
          orderCode: 888999,
          status: 'PAID', // Already PAID!
          amount: 199000,
          plan: { id: 'plan_pro', name: 'PRO' },
        }),
      },
      $transaction: async (fn: any) => {
        transactionCommitted = true;
        return fn(mockPrisma);
      },
    };
    const mockRabbit: any = {
      consume: async () => {},
      publish: async () => {
        publishCount++;
        return true;
      },
    };

    const { SubscriptionsService } = require('../src/modules/subscriptions/subscriptions.service');
    const subService = new SubscriptionsService(mockPrisma, mockRabbit);

    const result = await subService.handleVietQRWebhook(
      { content: 'VF888999', amount: 199000 },
      undefined,
    );

    assert.strictEqual(result.success, true, 'Must return success for idempotent replay');
    assert.ok(result.message.includes('đã được kích hoạt trước đó'), 'Must return already activated message');
    assert.strictEqual(transactionCommitted, false, 'Database transaction must NOT be re-executed');
  });

  await test('Payment Webhook: Rejects external transaction code if already redeemed for another order', async () => {
    const mockPrisma: any = {
      systemConfig: { findUnique: async () => null },
      paymentOrder: {
        findUnique: async () => ({
          id: 'order_new_2',
          orderCode: 999111,
          status: 'PENDING',
          amount: 199000,
          plan: { id: 'plan_pro', name: 'PRO' },
        }),
        findFirst: async (args: any) => {
          // Simulate that transactionCode 'FT2410229988' was already redeemed for order #777666
          if (args?.where?.transactionCode === 'FT2410229988') {
            return { id: 'order_old_1', orderCode: 777666, status: 'PAID' };
          }
          return null;
        },
      },
    };
    const mockRabbit: any = {
      consume: async () => {},
      publish: async () => true,
    };

    const { SubscriptionsService } = require('../src/modules/subscriptions/subscriptions.service');
    const subService = new SubscriptionsService(mockPrisma, mockRabbit);

    const result = await subService.handleVietQRWebhook({
      content: 'VF999111',
      amount: 199000,
      referenceNumber: 'FT2410229988', // Replayed bank reference
    });

    assert.strictEqual(result.success, false, 'Must reject replayed external transaction code');
    assert.ok(result.message.includes('đã được sử dụng'), 'Message must indicate reused transaction');
  });

  // ---------------------------------------------------------------------------
  // TEST SUITE 5: ARENA GAME SETTLEMENT & CONCURRENCY PROTECTION
  // ---------------------------------------------------------------------------
  await test('Arena Settlement: Prevents double settlement & XP inflation via room-level distributed lock', async () => {
    let createdGameResults: any[] = [];
    let updatedXP: any[] = [];

    const mockPrisma: any = {
      gameResult: {
        findFirst: async ({ where }: any) => {
          return createdGameResults.find(
            (r) => r.roomCode === where.roomCode && (!where.userId || r.userId === where.userId),
          ) || null;
        },
        create: async ({ data }: any) => {
          createdGameResults.push(data);
          return data;
        },
      },
      userXP: {
        upsert: async ({ where, update, create }: any) => {
          updatedXP.push({ userId: where.userId, update, create });
        },
      },
      $transaction: async (callback: any) => {
        return callback(mockPrisma);
      },
    };

    const mockRabbit: any = {
      consume: async () => {},
      publish: async () => true,
    };

    const { GamesService } = require('../src/modules/games/games.service');
    const gamesService = new GamesService(mockPrisma, mockRabbit, redis);

    const matchData = {
      roomCode: 'ARENA_TEST_99',
      gameMode: 'TRANSLATION_RUSH',
      totalRounds: 5,
      date: '2026-10-22',
      durationSec: 120,
      topPlayers: [
        {
          userId: 'user_player_1',
          rank: 1,
          score: 500,
          correctCount: 5,
          bestStreak: 5,
          accuracy: 100,
        },
      ],
    };

    // First settlement execution
    await gamesService.processGameResultsJob(matchData);
    assert.strictEqual(createdGameResults.length, 1, 'First settlement must record 1 GameResult');
    assert.strictEqual(updatedXP.length, 1, 'First settlement must credit player XP once');

    // Second settlement execution (simulating duplicate worker delivery)
    await gamesService.processGameResultsJob(matchData);
    assert.strictEqual(createdGameResults.length, 1, 'Second settlement must NOT create duplicate records');
    assert.strictEqual(updatedXP.length, 1, 'Second settlement must NOT increment player XP twice');
  });

  console.log('\n------------------------------------------------------');
  console.log(`📊 TEST RESULTS: ${passed} PASSED, ${failed} FAILED`);
  console.log('------------------------------------------------------\n');

  await redis.onModuleDestroy();

  if (failed > 0) {
    process.exit(1);
  }
  process.exit(0);
}

runTests().catch((err) => {
  console.error('Fatal test runner error:', err);
  process.exit(1);
});
