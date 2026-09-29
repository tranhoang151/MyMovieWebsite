import { Controller, Get, Post, Delete, Body, Param, UseGuards, UsePipes, ValidationPipe } from '@nestjs/common';
import { WatchlistService } from './watchlist.service';
import { CreateWatchlistDto } from './dto/create-watchlist.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@Controller('watchlist')
@UseGuards(JwtAuthGuard)
@UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
export class WatchlistController {
  constructor(private readonly watchlist: WatchlistService) {}

  @Get()
  async list(@CurrentUser() user: { id: string }) {
    return this.watchlist.listWatchlist(user.id);
  }

  @Post()
  async add(@CurrentUser() user: { id: string }, @Body() dto: CreateWatchlistDto) {
    return this.watchlist.addToWatchlist(user.id, dto.movieSlug);
  }

  @Delete(':slug')
  async remove(@CurrentUser() user: { id: string }, @Param('slug') slug: string) {
    return this.watchlist.removeFromWatchlist(user.id, slug);
  }
}
