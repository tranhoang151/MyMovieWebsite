import { Controller, Get, Query, Param, UsePipes, ValidationPipe } from '@nestjs/common';
import { MoviesService } from './movies.service';
import { QueryMoviesDto } from './dto/query-movies.dto';

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
}
