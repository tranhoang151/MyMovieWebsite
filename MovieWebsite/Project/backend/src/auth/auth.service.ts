import {
  Injectable,
  ConflictException,
  UnauthorizedException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { randomUUID } from 'crypto';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../prisma/prisma.service';
import { CacheService } from '../services/cache.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { JwtPayload } from './jwt.strategy';

const BCRYPT_COST = 12;

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly cacheService: CacheService,
  ) {}

  /**
   * Đăng ký tài khoản mới.
   */
  async register(dto: RegisterDto) {
    // Kiểm tra email đã tồn tại
    const existingUser = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });

    if (existingUser) {
      throw new ConflictException('Email đã được sử dụng');
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(dto.password, BCRYPT_COST);

    // Tạo user mới
    const user = await this.prisma.user.create({
      data: {
        email: dto.email,
        password: hashedPassword,
        name: dto.name,
      },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        createdAt: true,
      },
    });

    return { message: 'Đăng ký thành công', user };
  }

  /**
   * Đăng nhập bằng email + password.
   */
  async login(dto: LoginDto) {
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });

    if (!user) {
      throw new UnauthorizedException('Email hoặc mật khẩu không chính xác');
    }

    if (!user.isActive) {
      throw new ForbiddenException('Tài khoản đã bị khóa');
    }

    if (!user.password) {
      throw new UnauthorizedException(
        'Tài khoản này đã đăng nhập bằng Google. Vui lòng sử dụng Google để đăng nhập.',
      );
    }

    const isPasswordValid = await bcrypt.compare(dto.password, user.password);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Email hoặc mật khẩu không chính xác');
    }

    return this.generateTokens(user.id, user.email, user.role);
  }

  /**
   * Refresh token — tạo accessToken + refreshToken mới (token rotation).
   * Xóa refreshToken cũ và lưu refreshToken mới.
   */
  async refresh(refreshToken: string) {
    try {
      const payload = this.jwtService.verify(refreshToken);

      // Kiểm tra refreshToken có trong Redis không
      const storedHash = await this.cacheService.get<string>(
        `refresh:${payload.sub}`,
      );

      if (!storedHash) {
        throw new UnauthorizedException('Refresh token đã bị vô hiệu hóa');
      }

      // Verify refreshToken hash
      const isValid = await bcrypt.compare(refreshToken, storedHash);
      if (!isValid) {
        throw new UnauthorizedException('Refresh token không hợp lệ');
      }

      // Xóa refreshToken cũ
      await this.cacheService.del(`refresh:${payload.sub}`);

      // Tạo tokens mới
      const user = await this.prisma.user.findUnique({
        where: { id: payload.sub },
        select: { id: true, email: true, role: true, isActive: true },
      });

      if (!user || !user.isActive) {
        throw new UnauthorizedException('Tài khoản không tồn tại hoặc bị khóa');
      }

      return this.generateTokens(user.id, user.email, user.role);
    } catch {
      throw new UnauthorizedException('Refresh token không hợp lệ hoặc đã hết hạn');
    }
  }

  /**
   * Đăng xuất — vô hiệu hóa refreshToken trong Redis.
   */
  async logout(userId: string) {
    await this.cacheService.del(`refresh:${userId}`);
    return { message: 'Đăng xuất thành công' };
  }

  /**
   * Xử lý Google OAuth callback — upsert user theo email.
   */
  async handleGoogleCallback(profile: {
    email: string;
    name: string;
    avatar?: string;
  }) {
    let user = await this.prisma.user.findUnique({
      where: { email: profile.email },
    });

    if (!user) {
      // Tạo user mới từ Google profile
      user = await this.prisma.user.create({
        data: {
          email: profile.email,
          name: profile.name,
          avatar: profile.avatar,
        },
      });
    }

    if (!user.isActive) {
      throw new ForbiddenException('Tài khoản đã bị khóa');
    }

    return this.generateTokens(user.id, user.email, user.role);
  }

  /**
   * Tạo temporary one-time OAuth exchange code lưu trong Redis (TTL 60s)
   */
  async createOAuthExchangeCode(data: any): Promise<string> {
    const code = randomUUID();
    await this.cacheService.set(`oauth:code:${code}`, JSON.stringify(data), 60);
    return code;
  }

  /**
   * Đổi temporary OAuth code lấy tokens và user info
   */
  async exchangeOAuthCode(code: string) {
    const stored = await this.cacheService.get<string>(`oauth:code:${code}`);
    if (!stored) {
      throw new UnauthorizedException('Mã xác thực không hợp lệ hoặc đã hết hạn');
    }
    // Delete immediately (one-time use)
    await this.cacheService.del(`oauth:code:${code}`);
    return typeof stored === 'string' ? JSON.parse(stored) : stored;
  }

  /**
   * Tạo accessToken + refreshToken và lưu refreshToken hash vào Redis.
   */
  private async generateTokens(userId: string, email: string, role: string) {
    const payload: JwtPayload = { sub: userId, email, role };

    const accessExpiresIn = this.configService.get('JWT_EXPIRES_IN') || '15m';
    const refreshExpiresIn = this.configService.get('JWT_REFRESH_EXPIRES_IN') || '7d';

    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(payload, {
        expiresIn: accessExpiresIn as any,
      }),
      this.jwtService.signAsync(payload, {
        expiresIn: refreshExpiresIn as any,
        jwtid: randomUUID(),
      }),
    ]);

    // Hash refreshToken và lưu vào Redis với TTL 7 ngày
    const refreshHash = await bcrypt.hash(refreshToken, 10);
    const refreshTtlDays = 7 * 24 * 60 * 60; // 7 ngày tính bằng giây
    await this.cacheService.set(`refresh:${userId}`, refreshHash, refreshTtlDays);

    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        avatar: true,
      },
    });

    return {
      accessToken,
      refreshToken,
      user,
    };
  }
}
