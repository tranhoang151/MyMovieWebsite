import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';
import { ScheduleModule } from '@nestjs/schedule';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma.module';
import { CacheModule } from './services/cache.module';
import { AuthModule } from './auth/auth.module';
import { MoviesModule } from './movies/movies.module';
import { WatchlistModule } from './watchlist/watchlist.module';
import { HistoryModule } from './history/history.module';
import { AdminModule } from './admin/admin.module';
import { UsersModule } from './users/users.module';

@Module({
  imports: [
    // Load .env file globally
    ConfigModule.forRoot({
      isGlobal: true,
    }),

    // Rate limiting (OWASP A04)
    ThrottlerModule.forRoot([
      { name: 'short', ttl: 60000, limit: 100 },   // 100 req/phút (public)
      { name: 'auth', ttl: 60000, limit: 30 },      // 30 req/phút (auth endpoints)
    ]),

    // Cron job scheduler (BullMQ)
    ScheduleModule.forRoot(),

    // Prisma ORM — global module
    PrismaModule,

    // Redis Cache — global module
    CacheModule,

    // Auth (JWT, OAuth Google)
    AuthModule,
    // Movies public API
    MoviesModule,
    // Watchlist and user history
    WatchlistModule,
    HistoryModule,
    // User management
    UsersModule,
    // Admin endpoints (sync, import, stats)
    AdminModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule {}
