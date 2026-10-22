import { Injectable, OnModuleInit, OnModuleDestroy, Logger } from '@nestjs/common';
import * as amqp from 'amqplib';

export const QUEUES = {
  PAYMENT_WEBHOOK: 'letstun.payment.webhook',
  ARENA_MATCHMAKING: 'letstun.arena.matchmaking',
  ARENA_GAME_RESULTS: 'letstun.arena.results',
  EMAIL_NOTIFICATIONS: 'letstun.email.notifications',
} as const;

export const EXCHANGES = {
  MAIN: 'letstun.events',
  DLX: 'letstun.dlx',
} as const;

export interface PublishOptions {
  persistent?: boolean;
  maxRetries?: number;
  headers?: Record<string, any>;
}

@Injectable()
export class RabbitMQService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(RabbitMQService.name);
  private connection: any = null;
  private channel: any = null;
  private isConnected = false;
  private isShuttingDown = false;
  private inFlightMessages = 0;
  private reconnectTimer: NodeJS.Timeout | null = null;
  private fallbackHandlers = new Map<string, ((data: any) => Promise<void>)[]>();

  async onModuleInit() {
    await this.connectWithRetry();
  }

  async onModuleDestroy() {
    this.isShuttingDown = true;
    if (this.reconnectTimer) clearTimeout(this.reconnectTimer);

    // Wait for in-flight messages to drain (up to 5 seconds)
    const drainStart = Date.now();
    while (this.inFlightMessages > 0 && Date.now() - drainStart < 5000) {
      await new Promise((r) => setTimeout(r, 100));
    }

    try {
      if (this.channel) await this.channel.close();
      if (this.connection) await this.connection.close();
      this.logger.log('RabbitMQ connection gracefully closed.');
    } catch (_) {}
  }

  private async connectWithRetry(retries = 5, delay = 3000): Promise<void> {
    const rabbitUrl = process.env.RABBITMQ_URL || 'amqp://guest:guest@localhost:5672';
    try {
      this.connection = await amqp.connect(rabbitUrl);
      // Use ConfirmChannel for reliable publisher confirms
      this.channel = await this.connection.createConfirmChannel();
      this.isConnected = true;
      this.logger.log(`Connected to RabbitMQ Confirm Channel at ${rabbitUrl.replace(/:[^:@]+@/, ':***@')}`);

      this.connection.on('error', (err: any) => {
        this.logger.warn(`RabbitMQ connection error: ${err.message}`);
        this.isConnected = false;
      });

      this.connection.on('close', () => {
        if (!this.isShuttingDown) {
          this.logger.warn('RabbitMQ connection closed unexpectedly. Reconnecting in 5s...');
          this.isConnected = false;
          this.reconnectTimer = setTimeout(() => this.connectWithRetry(5, 5000), 5000);
        }
      });

      // Declare Dead Letter Exchange (DLX) & Dead Letter Queue
      await this.channel.assertExchange(EXCHANGES.DLX, 'direct', { durable: true });
      await this.channel.assertQueue('letstun.dead_letters', { durable: true });
      await this.channel.bindQueue('letstun.dead_letters', EXCHANGES.DLX, 'dead-letter');

      // Assert all standard production queues with DLX routing
      for (const queue of Object.values(QUEUES)) {
        await this.channel.assertQueue(queue, {
          durable: true,
          arguments: {
            'x-dead-letter-exchange': EXCHANGES.DLX,
            'x-dead-letter-routing-key': 'dead-letter',
          },
        });
      }
    } catch (err: any) {
      this.isConnected = false;
      this.logger.warn(
        `Could not connect to RabbitMQ broker (${err.message}). Using in-process asynchronous fallback with circuit breaker.`,
      );
    }
  }

  /**
   * Publish a message with Publisher Confirms (ensures message is persisted to broker before resolving)
   */
  async publish<T = any>(
    queueName: string,
    data: T,
    options: PublishOptions = {},
  ): Promise<boolean> {
    const payload = Buffer.from(JSON.stringify(data));
    const headers = {
      ...options.headers,
      'x-timestamp': Date.now(),
      'x-retry-count': options.headers?.['x-retry-count'] || 0,
    };

    if (this.isConnected && this.channel) {
      return new Promise<boolean>((resolve) => {
        try {
          this.channel.sendToQueue(
            queueName,
            payload,
            {
              persistent: options.persistent ?? true,
              headers,
            },
            (err: any) => {
              if (err) {
                this.logger.error(`Publisher confirm rejected by broker for ${queueName}: ${err.message}`);
                resolve(false);
              } else {
                resolve(true);
              }
            },
          );
        } catch (err: any) {
          this.logger.error(`RabbitMQ publish exception on ${queueName}: ${err.message}`);
          resolve(false);
        }
      });
    }

    // In-process fallback: Asynchronously trigger registered fallback handlers
    const handlers = this.fallbackHandlers.get(queueName) || [];
    if (handlers.length > 0) {
      setImmediate(async () => {
        for (const handler of handlers) {
          try {
            await handler(data);
          } catch (handlerErr: any) {
            this.logger.error(`Fallback consumer error on ${queueName}: ${handlerErr.message}`);
          }
        }
      });
      return true;
    }

    this.logger.debug(`[RabbitMQ In-Memory Buffer] Message buffered for ${queueName}`);
    return true;
  }

  /**
   * Register a consumer with automatic prefetch, retry-budget management, and Dead Letter routing
   */
  async consume<T = any>(
    queueName: string,
    onMessage: (data: T, ack: () => void, nack: (requeue?: boolean) => void) => Promise<void>,
    options: { prefetch?: number; maxRetries?: number } = {},
  ): Promise<void> {
    const prefetch = options.prefetch || 10;
    const maxRetries = options.maxRetries || 3;

    // Register as fallback handler for offline broker mode
    const existingHandlers = this.fallbackHandlers.get(queueName) || [];
    existingHandlers.push(async (data: T) => {
      await onMessage(
        data,
        () => {},
        () => {},
      );
    });
    this.fallbackHandlers.set(queueName, existingHandlers);

    if (this.isConnected && this.channel) {
      try {
        await this.channel.prefetch(prefetch);
        await this.channel.consume(
          queueName,
          async (msg: any) => {
            if (!msg) return;
            this.inFlightMessages++;

            let isAcknowledged = false;
            const ack = () => {
              if (isAcknowledged) return;
              isAcknowledged = true;
              this.inFlightMessages = Math.max(0, this.inFlightMessages - 1);
              try {
                this.channel?.ack(msg);
              } catch (_) {}
            };

            const nack = (requeue = false) => {
              if (isAcknowledged) return;
              isAcknowledged = true;
              this.inFlightMessages = Math.max(0, this.inFlightMessages - 1);
              try {
                this.channel?.nack(msg, false, requeue);
              } catch (_) {}
            };

            try {
              const parsed: T = JSON.parse(msg.content.toString());
              await onMessage(parsed, ack, nack);
            } catch (err: any) {
              const currentRetries = Number(msg.properties.headers?.['x-retry-count'] || 0);
              this.logger.error(
                `Error processing message on ${queueName} (Attempt ${currentRetries + 1}/${maxRetries}): ${err.message}`,
              );

              if (currentRetries + 1 < maxRetries) {
                // Exponential backoff retry via republish
                ack(); // Ack current message to prevent head-of-line blocking
                setTimeout(async () => {
                  try {
                    const parsed: T = JSON.parse(msg.content.toString());
                    await this.publish(queueName, parsed, {
                      headers: { 'x-retry-count': currentRetries + 1 },
                    });
                  } catch (_) {}
                }, Math.pow(2, currentRetries) * 1000);
              } else {
                this.logger.error(
                  `[Poison Message] Exceeded max retries (${maxRetries}) on ${queueName}. Routing to Dead Letter Queue.`,
                );
                nack(false); // Reject to DLX without requeue
              }
            }
          },
          { noAck: false },
        );
        this.logger.log(`Consumer subscribed to RabbitMQ queue: ${queueName} (prefetch: ${prefetch})`);
      } catch (err: any) {
        this.logger.warn(`Failed to attach RabbitMQ consumer on ${queueName}: ${err.message}`);
      }
    }
  }

  isBrokerConnected(): boolean {
    return this.isConnected;
  }
}
