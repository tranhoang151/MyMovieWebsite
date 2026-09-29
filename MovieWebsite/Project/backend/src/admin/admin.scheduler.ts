import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { AdminService } from './admin.service';
import { ConfigService } from '@nestjs/config';
import { BullmqService } from '../bullmq/bullmq.service';

@Injectable()
export class AdminScheduler {
  private readonly logger = new Logger(AdminScheduler.name);

  constructor(
    private readonly admin: AdminService,
    private readonly bullmq: BullmqService,
    private readonly config: ConfigService,
  ) {}

  // Public method to allow unit testing without relying on Cron timer
  async runScheduledSync() {
    const raw = this.config.get<string>('NGUONC_SYNC_SLUGS') || '';
    const slugs = raw.split(',').map((s) => s.trim()).filter(Boolean);
    for (const slug of slugs) {
      try {
        await this.bullmq.enqueueSync(slug);
      } catch (err) {
        this.logger.error(`Failed to enqueue sync for ${slug}: ${err}`);
      }
    }
  }

  @Cron('0 */30 * * * *')
  async handleCron() {
    await this.runScheduledSync();
  }
}
