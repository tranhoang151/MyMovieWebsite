jest.mock('../prisma/prisma.service', () => ({ PrismaService: jest.fn() }));
jest.mock('bcrypt', () => ({ hash: jest.fn(async () => '$2b$12$hashed'), compare: jest.fn(async () => true) }));
jest.mock('../config/redis.config', () => ({ redisClient: { get: jest.fn(), set: jest.fn(), del: jest.fn() } }));

import { ConflictException, UnauthorizedException, ForbiddenException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';

describe('AuthService', () => {
  let authService: AuthService;
  let mockPrisma: any;
  let mockJwt: any;
  let mockConfig: any;
  let mockCache: any;

  const mockUser = {
    id: 'user-1',
    email: 'test@example.com',
    name: 'Test User',
    password: '$2b$12$hashedpassword',
    role: 'USER' as const,
    isActive: true,
    avatar: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(() => {
    jest.clearAllMocks();

    mockPrisma = {
      user: {
        findUnique: jest.fn(),
        create: jest.fn(),
      },
    };

    mockJwt = {
      signAsync: jest.fn(),
      verify: jest.fn(),
    };

    mockConfig = {
      get: jest.fn((key: string) => {
        const configs: Record<string, string> = {
          JWT_SECRET: 'test-secret',
          JWT_EXPIRES_IN: '15m',
          JWT_REFRESH_EXPIRES_IN: '7d',
        };
        return configs[key];
      }),
    };

    mockCache = {
      get: jest.fn(),
      set: jest.fn(),
      del: jest.fn(),
    };

    // Instantiate AuthService directly with mocked dependencies
    authService = new AuthService(
      mockPrisma as any,
      mockJwt as any,
      mockConfig as any,
      mockCache as any,
    );
  });

  describe('register', () => {
    it('should throw ConflictException when email already exists', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(mockUser);
      const dto: RegisterDto = { email: 'test@example.com', password: 'password123', name: 'Test' };
      await expect(authService.register(dto)).rejects.toThrow(ConflictException);
    });

    it('should create a new user and return success', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);
      const createdUser = { id: 'new-id', email: 'new@example.com', name: 'New', role: 'USER', createdAt: new Date() };
      (mockPrisma.user.create as jest.Mock).mockResolvedValue(createdUser);
      (bcrypt.hash as jest.Mock).mockResolvedValue('$2b$12$hashed');

      const dto: RegisterDto = { email: 'new@example.com', password: 'password123', name: 'New' };
      const result = await authService.register(dto);
      expect(result.message).toBe('Đăng ký thành công');
      expect(result.user).toEqual(createdUser);
    });
  });

  describe('login', () => {
    it('should throw UnauthorizedException when email not found', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);
      const dto: LoginDto = { email: 'unknown@example.com', password: 'password123' };
      await expect(authService.login(dto)).rejects.toThrow(UnauthorizedException);
    });

    it('should throw ForbiddenException when account is blocked', async () => {
      mockPrisma.user.findUnique.mockResolvedValue({ ...mockUser, isActive: false });
      const dto: LoginDto = { email: 'test@example.com', password: 'password123' };
      await expect(authService.login(dto)).rejects.toThrow(ForbiddenException);
    });

    it('should throw UnauthorizedException when user has no password (Google-only)', async () => {
      mockPrisma.user.findUnique.mockResolvedValue({ ...mockUser, password: null });
      const dto: LoginDto = { email: 'test@example.com', password: 'password123' };
      await expect(authService.login(dto)).rejects.toThrow(UnauthorizedException);
    });

    it('should throw UnauthorizedException when password is wrong', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(mockUser);
      (bcrypt.compare as jest.Mock).mockResolvedValue(false);
      const dto: LoginDto = { email: 'test@example.com', password: 'wrongpassword' };
      await expect(authService.login(dto)).rejects.toThrow(UnauthorizedException);
    });

    it('should return tokens when login succeeds', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(mockUser);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);
      mockJwt.signAsync.mockResolvedValue('mock-access-token');
      mockCache.set.mockResolvedValue(true);

      const dto: LoginDto = { email: 'test@example.com', password: 'password123' };
      const result = await authService.login(dto);
      expect(result).toHaveProperty('accessToken');
      expect(result).toHaveProperty('refreshToken');
      expect(result).toHaveProperty('sessionExpiresAt');
      expect(result).toHaveProperty('user');
      expect(typeof result.sessionExpiresAt).toBe('number');
    });
  });

  describe('refresh', () => {
    it('should throw UnauthorizedException when refresh token is not in Redis', async () => {
      mockJwt.verify.mockReturnValue({ sub: 'user-1', email: 'test@example.com', role: 'USER' });
      mockCache.get.mockResolvedValue(null);

      await expect(authService.refresh('invalid-token')).rejects.toThrow(UnauthorizedException);
    });

    it('should throw UnauthorizedException when absolute 7-day session has expired', async () => {
      const pastExpiresAt = Math.floor(Date.now() / 1000) - 100; // expired 100s ago
      mockJwt.verify.mockReturnValue({ sub: 'user-1', email: 'test@example.com', role: 'USER', sessionExpiresAt: pastExpiresAt });
      mockCache.get.mockResolvedValue('$2b$10$hashedtoken');
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);

      await expect(authService.refresh('expired-token')).rejects.toThrow(UnauthorizedException);
    });

    it('should preserve existing sessionExpiresAt across token refreshes', async () => {
      const futureExpiresAt = Math.floor(Date.now() / 1000) + 3 * 24 * 60 * 60; // 3 days remaining
      mockJwt.verify.mockReturnValue({ sub: 'user-1', email: 'test@example.com', role: 'USER', sessionExpiresAt: futureExpiresAt });
      mockCache.get.mockResolvedValue('$2b$10$hashedtoken');
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);
      mockPrisma.user.findUnique.mockResolvedValue(mockUser);
      mockJwt.signAsync.mockResolvedValue('mock-new-token');
      mockCache.set.mockResolvedValue(true);

      const result = await authService.refresh('valid-token');
      expect(result).toHaveProperty('accessToken');
      expect(result).toHaveProperty('refreshToken');
      expect(result.sessionExpiresAt).toBe(futureExpiresAt * 1000);
    });
  });

  describe('handleGoogleCallback', () => {
    const googleProfile = { email: 'google@example.com', name: 'Google User', avatar: 'https://avatar.url' };

    it('should create new user for new email', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);
      const newUser = { id: 'new-id', email: 'google@example.com', name: 'Google User', role: 'USER', isActive: true };
      mockPrisma.user.create.mockResolvedValue(newUser);
      mockJwt.signAsync.mockResolvedValue('mock-token');
      const result = await authService.handleGoogleCallback(googleProfile);
      expect(result).toHaveProperty('accessToken');
    });

    it('should login existing user without creating a new one', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(mockUser);
      mockJwt.signAsync.mockResolvedValue('mock-token');
      mockCache.set.mockResolvedValue(true);
      const result = await authService.handleGoogleCallback(googleProfile);
      expect(result).toHaveProperty('accessToken');
      expect(mockPrisma.user.create).not.toHaveBeenCalled();
    });

    it('should throw ForbiddenException when account is blocked', async () => {
      mockPrisma.user.findUnique.mockResolvedValue({ ...mockUser, isActive: false });
      await expect(authService.handleGoogleCallback(googleProfile)).rejects.toThrow(ForbiddenException);
    });
  });
});