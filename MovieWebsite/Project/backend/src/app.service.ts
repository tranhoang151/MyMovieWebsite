import { Injectable, Optional } from '@nestjs/common';
import { PrismaService } from './prisma/prisma.service';
import { CacheService } from './services/cache.service';

@Injectable()
export class AppService {
  constructor(
    private readonly prisma: PrismaService,
    @Optional() private readonly cacheService?: CacheService,
  ) {}

  getHello(): string {
    return 'CineStream API is running';
  }

  async getHealth() {
    let dbStatus = 'ok';
    let dbError: string | null = null;
    try {
      await this.prisma.$queryRaw`SELECT 1`;
    } catch (err: any) {
      dbStatus = 'error';
      dbError = err?.message || String(err);
    }

    let redisStatus = 'disabled';
    if (this.cacheService) {
      try {
        const ok = await this.cacheService.ping();
        redisStatus = ok ? 'ok' : 'error';
      } catch (err: any) {
        redisStatus = 'error';
      }
    }

    return {
      status: dbStatus === 'ok' ? 'ok' : 'degraded',
      timestamp: new Date().toISOString(),
      database: { status: dbStatus, error: dbError },
      redis: { status: redisStatus },
      environment: process.env.NODE_ENV || 'unknown',
    };
  }
}
