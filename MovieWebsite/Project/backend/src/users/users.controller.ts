import { Controller, Get, Patch, Delete, Body, Param, UseGuards, UsePipes, ValidationPipe } from '@nestjs/common';
import { UsersService } from './users.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { UpdateUserDto } from './dto/update-user.dto';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';

@Controller('users')
@UseGuards(JwtAuthGuard)
@UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get('me')
  async profile(@CurrentUser() user: { id: string }) {
    return this.usersService.getProfile(user.id);
  }

  @Patch('me')
  async updateProfile(@CurrentUser() user: { id: string }, @Body() dto: UpdateUserDto) {
    return this.usersService.updateProfile(user.id, dto);
  }

  @Get()
  @UseGuards(RolesGuard)
  @Roles('ADMIN')
  async listUsers() {
    return this.usersService.listUsers();
  }

  @Get(':id')
  @UseGuards(RolesGuard)
  @Roles('ADMIN')
  async getUser(@Param('id') id: string) {
    return this.usersService.getUserById(id);
  }

  @Patch(':id/block')
  @UseGuards(RolesGuard)
  @Roles('ADMIN')
  async blockUser(@Param('id') id: string, @Body() body?: { isActive?: boolean }) {
    return this.usersService.blockUser(id, body?.isActive);
  }

  @Patch(':id')
  @UseGuards(RolesGuard)
  @Roles('ADMIN')
  async toggleBlockUser(@Param('id') id: string, @Body() body?: { isActive?: boolean }) {
    return this.usersService.blockUser(id, body?.isActive);
  }

  @Delete(':id')
  @UseGuards(RolesGuard)
  @Roles('ADMIN')
  async deleteUser(@Param('id') id: string) {
    return this.usersService.deleteUser(id);
  }
}
