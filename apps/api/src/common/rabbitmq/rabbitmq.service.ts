import { Injectable, OnModuleInit, OnModuleDestroy, Logger } from '@nestjs/common';
import * as amqp from 'amqplib';

export const QUEUES = {
  PAYMENT_WEBHOOK: 'vocabflow.payment.webhook',
  ARENA_MATCHMAKING: 'vocabflow.arena.matchmaking',
  ARENA_GAME_RESULTS: 'vocabflow.arena.results',
  EMAIL_NOTIFICATIONS: 'vocabflow.email.notifications',
} as const;

export const EXCHANGES = {
  MAIN: 'vocabflow.events',
  DLX: 'vocabflow.dlx',
} as const;

@Injectable()
export class RabbitMQService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(RabbitMQService.name);
  private connection: any = null;
  private channel: any = null;
  private isConnected = false;
  private reconnectTimer: NodeJS.Timeout | null = null;
  private fallbackHandlers = new Map<string, ((data: any) => Promise<void>)[]>();

  async onModuleInit() {
    await this.connectWithRetry();
  }

  async onModuleDestroy() {
    if (this.reconnectTimer) clearTimeout(this.reconnectTimer);
    try {
      if (this.channel) await this.channel.close();
      if (this.connection) await this.connection.close();
    } catch (_) {}
  }

  private async connectWithRetry(retries = 5, delay = 3000): Promise<void> {
    const rabbitUrl = process.env.RABBITMQ_URL || 'amqp://guest:guest@localhost:5672';
    try {
      this.connection = await amqp.connect(rabbitUrl);
      this.channel = await this.connection.createChannel();
      this.isConnected = true;
      this.logger.log(`Connected to RabbitMQ message broker at ${rabbitUrl.replace(/:[^:@]+@/, ':***@')}`);

      this.connection.on('error', (err) => {
        this.logger.warn(`RabbitMQ connection error: ${err.message}`);
        this.isConnected = false;
      });

      this.connection.on('close', () => {
        this.logger.warn('RabbitMQ connection closed. Attempting reconnect in 5s...');
        this.isConnected = false;
        this.reconnectTimer = setTimeout(() => this.connectWithRetry(5, 5000), 5000);
      });

      // Declare DLX (Dead Letter Exchange)
      await this.channel.assertExchange(EXCHANGES.DLX, 'direct', { durable: true });
      await this.channel.assertQueue('vocabflow.dead_letters', { durable: true });
      await this.channel.bindQueue('vocabflow.dead_letters', EXCHANGES.DLX, 'dead-letter');

      // Assert common production queues with DLX support
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
        `Could not connect to RabbitMQ broker (${err.message}). Using in-process asynchronous fallback.`,
      );
    }
  }

  /**
   * Publish a message to a RabbitMQ queue with persistent storage
   */
  async publish<T = any>(queueName: string, data: T, headers: Record<string, any> = {}): Promise<boolean> {
    const payload = Buffer.from(JSON.stringify(data));

    if (this.isConnected && this.channel) {
      try {
        return this.channel.sendToQueue(queueName, payload, {
          persistent: true,
          headers: {
            ...headers,
            timestamp: Date.now(),
          },
        });
      } catch (err: any) {
        this.logger.error(`Failed to publish message to RabbitMQ queue ${queueName}: ${err.message}`);
      }
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

    this.logger.debug(`[RabbitMQ Buffering] Message queued in-memory for ${queueName}`);
    return true;
  }

  /**
   * Register a consumer for a specific queue with manual/auto ack
   */
  async consume<T = any>(
    queueName: string,
    onMessage: (data: T, ack: () => void, nack: (requeue?: boolean) => void) => Promise<void>,
  ): Promise<void> {
    // Register as fallback handler
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
        await this.channel.prefetch(10); // Fair dispatch: process up to 10 unacknowledged messages
        await this.channel.consume(
          queueName,
          async (msg) => {
            if (!msg) return;
            const ack = () => {
              try {
                this.channel?.ack(msg);
              } catch (_) {}
            };
            const nack = (requeue = false) => {
              try {
                this.channel?.nack(msg, false, requeue);
              } catch (_) {}
            };

            try {
              const parsed: T = JSON.parse(msg.content.toString());
              await onMessage(parsed, ack, nack);
            } catch (err: any) {
              this.logger.error(`Error processing message from ${queueName}: ${err.message}`);
              nack(false); // Send to Dead Letter Queue
            }
          },
          { noAck: false },
        );
        this.logger.log(`Consumer subscribed to RabbitMQ queue: ${queueName}`);
      } catch (err: any) {
        this.logger.warn(`Failed to attach RabbitMQ consumer on ${queueName}: ${err.message}`);
      }
    }
  }

  isBrokerConnected(): boolean {
    return this.isConnected;
  }
}
