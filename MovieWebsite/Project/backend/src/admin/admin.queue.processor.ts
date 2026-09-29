import { Injectable, Logger, OnModuleDestroy } from '@nestjs/common';
import { Worker, Job } from 'bullmq';
import { bullmqConnection } from '../config/bullmq.config';
import { AdminService } from './admin.service';
import { SYNC_QUEUE_NAME } from '../bullmq/bullmq.service';

@Injectable()
export class AdminQueueProcessor implements OnModuleDestroy {
  private readonly logger = new Logger(AdminQueueProcessor.name);
  private readonly worker: Worker;

  constructor(private readonly adminService: AdminService) {
    this.worker = new Worker(
      SYNC_QUEUE_NAME,
      async (job: Job) => {
        const slug = job.data.slug as string;
        if (!slug) {
          throw new Error('Missing slug for sync job');
        }

        this.logger.log(`Processing BullMQ sync job for slug=${slug}`);
        return this.adminService.syncFromSlug(slug);
      },
      {
        connection: bullmqConnection as any,
        concurrency: 1,
      },
    );

    this.worker.on('completed', (job) => {
      this.logger.log(`Sync job completed: ${job.id}`);
    });

    this.worker.on('failed', (job, err) => {
      this.logger.error(`Sync job failed: ${job?.id} — ${err.message}`);
    });
  }

  async onModuleDestroy() {
    await this.worker.close();
  }
}
