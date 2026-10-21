import { Controller, Get, Post, Delete, Param, Body, UseGuards, UsePipes, ValidationPipe } from '@nestjs/common';
import { HistoryService } from './history.service';
import { UpsertHistoryDto } from './dto/upsert-history.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@Controller('history')
@UseGuards(JwtAuthGuard)
@UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
export class HistoryController {
  constructor(private readonly history: HistoryService) {}

  @Get()
  async list(@CurrentUser() user: { id: string }) {
    return this.history.listHistory(user.id);
  }

  @Post()
  async upsert(@CurrentUser() user: { id: string }, @Body() dto: UpsertHistoryDto) {
    return this.history.upsertHistory(user.id, dto);
  }

  @Delete('movie/:slug')
  async deleteByMovie(@CurrentUser() user: { id: string }, @Param('slug') slug: string) {
    return this.history.deleteHistoryByMovie(user.id, slug);
  }

  @Delete(':id')
  async deleteById(@CurrentUser() user: { id: string }, @Param('id') id: string) {
    return this.history.deleteHistoryById(user.id, id);
  }
}
