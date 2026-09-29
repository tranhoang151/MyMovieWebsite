import { Injectable, Logger, OnModuleDestroy } from '@nestjs/common';
import { Queue, QueueEvents } from 'bullmq';
import { bullmqConnection } from '../config/bullmq.config';

export const SYNC_QUEUE_NAME = 'sync-movie-queue';

@Injectable()
export class BullmqService implements OnModuleDestroy {
  private readonly logger = new Logger(BullmqService.name);
  private readonly queueEvents: QueueEvents;
  public readonly syncQueue: Queue;

  constructor() {
    if (!bullmqConnection) {
      throw new Error('REDIS_URL is not configured for BullMQ');
    }

    this.syncQueue = new Queue(SYNC_QUEUE_NAME, {
      connection: bullmqConnection as any,
      defaultJobOptions: {
        removeOnComplete: true,
        removeOnFail: true,
        attempts: 3,
        backoff: {
          type: 'exponential',
          delay: 5000,
        },
      },
    });

    this.queueEvents = new QueueEvents(SYNC_QUEUE_NAME, {
      connection: bullmqConnection as any,
    });
  }

  async enqueueSync(slug: string) {
    this.logger.log(`Enqueue sync job for slug=${slug}`);
    await this.syncQueue.add(`sync-${slug}-${Date.now()}`, { slug });
  }

  async onModuleDestroy() {
    await Promise.all([this.syncQueue.close(), this.queueEvents.close()]);
  }
}
