import {
  Controller,
  Get,
  Post,
  Query,
  Param,
  Req,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import { Request } from 'express';
import { MoviesService } from './movies.service';
import { QueryMoviesDto } from './dto/query-movies.dto';
import { Public } from '../common/decorators/public.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@Controller('movies')
export class MoviesController {
  constructor(private readonly movies: MoviesService) {}

  @Get()
  @UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
  async list(@Query() query: QueryMoviesDto) {
    return this.movies.findAll(query);
  }

  @Get(':slug')
  async detail(@Param('slug') slug: string) {
    return this.movies.findBySlug(slug);
  }

  /**
   * POST /api/movies/:slug/view — Ghi nhận lượt xem cho phim
   */
  @Public()
  @Post(':slug/view')
  async recordMovieView(
    @Param('slug') slug: string,
    @Req() req: Request,
    @Query('serverName') serverName?: string,
    @CurrentUser() user?: { id: string },
  ) {
    const forwarded = req.headers['x-forwarded-for'];
    const clientIp =
      typeof forwarded === 'string'
        ? forwarded.split(',')[0].trim()
        : req.socket?.remoteAddress;
    return this.movies.incrementView(
      slug,
      undefined,
      serverName,
      clientIp,
      user?.id,
    );
  }

  /**
   * POST /api/movies/:slug/episodes/:episodeSlug/view — Ghi nhận lượt xem cho từng tập phim
   */
  @Public()
  @Post(':slug/episodes/:episodeSlug/view')
  async recordEpisodeView(
    @Param('slug') slug: string,
    @Param('episodeSlug') episodeSlug: string,
    @Req() req: Request,
    @Query('serverName') serverName?: string,
    @CurrentUser() user?: { id: string },
  ) {
    const forwarded = req.headers['x-forwarded-for'];
    const clientIp =
      typeof forwarded === 'string'
        ? forwarded.split(',')[0].trim()
        : req.socket?.remoteAddress;
    return this.movies.incrementView(
      slug,
      episodeSlug,
      serverName,
      clientIp,
      user?.id,
    );
  }
}
