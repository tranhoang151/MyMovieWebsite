import { Controller, Get, Post, Delete, Body, Param, UseGuards, UsePipes, ValidationPipe, BadRequestException } from '@nestjs/common';
import { WatchlistService } from './watchlist.service';
import { CreateWatchlistDto } from './dto/create-watchlist.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@Controller('watchlist')
@UseGuards(JwtAuthGuard)
export class WatchlistController {
  constructor(private readonly watchlist: WatchlistService) {}

  @Get()
  async list(@CurrentUser() user: { id: string }) {
    return this.watchlist.listWatchlist(user.id);
  }

  @Post(':identifier')
  async addByParam(
    @CurrentUser() user: { id: string },
    @Param('identifier') identifier: string,
  ) {
    return this.watchlist.addToWatchlist(user.id, identifier);
  }

  @Post()
  @UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
  async add(
    @CurrentUser() user: { id: string },
    @Body() dto: CreateWatchlistDto,
  ) {
    const identifier = dto.movieId || dto.movieSlug;
    if (!identifier) {
      throw new BadRequestException('movieId or movieSlug is required');
    }
    return this.watchlist.addToWatchlist(user.id, identifier);
  }

  @Delete(':identifier')
  async remove(
    @CurrentUser() user: { id: string },
    @Param('identifier') identifier: string,
  ) {
    return this.watchlist.removeFromWatchlist(user.id, identifier);
  }
}
