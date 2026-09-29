import { Controller, Post, Body, UseGuards } from '@nestjs/common';
import { AdminService } from './admin.service';
import { SyncDto } from './dto/sync.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';

@Controller('admin')
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Post('sync')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  async sync(@Body() dto: SyncDto) {
    return this.adminService.syncFromSlug(dto.slug);
  }
}
