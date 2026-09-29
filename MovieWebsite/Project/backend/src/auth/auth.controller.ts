import {
  Controller,
  Post,
  Get,
  Body,
  UseGuards,
  Req,
  Res,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ThrottlerGuard } from '@nestjs/throttler';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Public } from '../common/decorators/public.decorator';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  /**
   * POST /api/auth/register — Đăng ký tài khoản mới
   */
  @Public()
  @UseGuards(ThrottlerGuard)
  @Post('register')
  async register(@Body() dto: RegisterDto) {
    return this.authService.register(dto);
  }

  /**
   * POST /api/auth/login — Đăng nhập
   */
  @Public()
  @UseGuards(ThrottlerGuard)
  @HttpCode(HttpStatus.OK)
  @Post('login')
  async login(@Body() dto: LoginDto) {
    return this.authService.login(dto);
  }

  /**
   * POST /api/auth/refresh — Đổi refresh token
   */
  @Public()
  @HttpCode(HttpStatus.OK)
  @Post('refresh')
  async refresh(@Body('refreshToken') refreshToken: string) {
    return this.authService.refresh(refreshToken);
  }

  /**
   * POST /api/auth/logout — Đăng xuất
   */
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  @Post('logout')
  async logout(@CurrentUser() user: { id: string }) {
    return this.authService.logout(user.id);
  }

  /**
   * GET /api/auth/google — Redirect đến Google OAuth
   */
  @Public()
  @Get('google')
  @UseGuards(AuthGuard('google'))
  async googleAuth() {
    // Handled by Passport — redirects to Google
  }

  /**
   * GET /api/auth/google/callback — Google OAuth callback
   */
  @Public()
  @Get('google/callback')
  @UseGuards(AuthGuard('google'))
  async googleCallback(@Req() req: any, @Res() res: any) {
    const result = await this.authService.handleGoogleCallback(req.user);
    // Redirect về frontend với tokens
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
    const params = new URLSearchParams({
      accessToken: result.accessToken,
      refreshToken: result.refreshToken,
    });
    return res.redirect(`${frontendUrl}/auth/callback?${params.toString()}`);
  }
}