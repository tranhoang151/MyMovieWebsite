import { Controller, Post, Patch, Delete, Body, Param, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { AdminService } from './admin.service';
import { UpdateMovieDto } from './dto/update-movie.dto';

@Controller('admin/movies')
export class AdminMovieController {
  constructor(private readonly admin: AdminService) {}

  @Post('import')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  async import(@Body() body: { slug: string }) {
    return this.admin.syncFromSlug(body.slug);
  }

  @Patch(':slug')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  async update(@Param('slug') slug: string, @Body() dto: UpdateMovieDto) {
    return this.admin.updateMovie(slug, dto);
  }

  @Delete(':slug')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  async remove(@Param('slug') slug: string) {
    return this.admin.deleteMovieBySlug(slug);
  }
}
