import { Module } from '@nestjs/common';
import { WatchlistService } from './watchlist.service';
import { WatchlistController } from './watchlist.controller';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  providers: [WatchlistService],
  controllers: [WatchlistController],
  exports: [WatchlistService],
})
export class WatchlistModule {}
