import { Module } from '@nestjs/common';
import { AdminService } from './admin.service';
import { AdminController } from './admin.controller';
import { AdminMovieController } from './admin.movie.controller';
import { AdminStatsController } from './admin.stats.controller';
import { AdminStatsService } from './admin.stats.service';
import { PrismaModule } from '../prisma/prisma.module';
import { NguonCModule } from '../nguonc/nguonc.module';
import { AuthModule } from '../auth/auth.module';
import { AdminScheduler } from './admin.scheduler';
import { ConfigModule } from '@nestjs/config';
import { BullmqModule } from '../bullmq/bullmq.module';
import { AdminQueueProcessor } from './admin.queue.processor';

@Module({
  imports: [PrismaModule, NguonCModule, AuthModule, ConfigModule, BullmqModule],
  providers: [AdminService, AdminScheduler, AdminStatsService, AdminQueueProcessor],
  controllers: [AdminController, AdminMovieController, AdminStatsController],
})
export class AdminModule {}
