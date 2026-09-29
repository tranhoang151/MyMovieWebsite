jest.mock('../prisma/prisma.service', () => ({ PrismaService: jest.fn() }));
jest.mock('bcrypt', () => ({ hash: jest.fn(async () => '$2b$12$hashed'), compare: jest.fn(async () => true) }));
jest.mock('../config/redis.config', () => ({ redisClient: { get: jest.fn(), set: jest.fn(), del: jest.fn() } }));

import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule, JwtService } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { ThrottlerGuard } from '@nestjs/throttler';
import request from 'supertest';
import * as bcrypt from 'bcrypt';
import * as fc from 'fast-check';
import { App } from 'supertest/types';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { JwtStrategy } from './jwt.strategy';
import { GoogleStrategy } from './google.strategy';
import { PrismaService } from '../prisma/prisma.service';
import { CacheService } from '../services/cache.service';

describe('Auth (Property-based tests)', () => {
  let app: INestApplication<App>;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let mockPrisma: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let mockCache: any;

  beforeAll(async () => {
    mockPrisma = {
      user: {
        findUnique: jest.fn(),
        create: jest.fn(),
      },
    };

    mockCache = {
      get: jest.fn(),
      set: jest.fn((_key: string, _value: string, _ttl?: number) => Promise.resolve(true)),
      del: jest.fn(),
    };

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({ isGlobal: true }),
        PassportModule.register({ defaultStrategy: 'jwt' }),
        JwtModule.registerAsync({
          imports: [ConfigModule],
          inject: [ConfigService],
          useFactory: (configService: ConfigService) => ({
            secret:
              configService.get<string>('JWT_SECRET') ||
              'fallback_secret_change_in_production_32chars_min',
            signOptions: {
              expiresIn: (configService.get<string>('JWT_EXPIRES_IN') || '15m') as any,
            },
          }),
        }),
      ],
      controllers: [AuthController],
      providers: [
        AuthService,
        JwtStrategy,
        {
          provide: GoogleStrategy,
          useFactory: () => ({}),
        },
        { provide: PrismaService, useValue: mockPrisma },
        { provide: CacheService, useValue: mockCache },
      ],
    })
      .overrideGuard(ThrottlerGuard)
      .useValue({ canActivate: () => true })
      .overrideProvider(JwtStrategy)
      .useValue({ validate: jest.fn() })
      .compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true }));
    app.setGlobalPrefix('api');
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  // ─────────────────────────────────────────────────
  // Property 1: Validation đầu vào đăng ký từ chối mọi input không hợp lệ
  // ─────────────────────────────────────────────────
  describe('Property 1: Register validation rejects invalid inputs', () => {
    it('should reject invalid emails', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.string({ minLength: 1, maxLength: 50 }),
          fc.string({ minLength: 8, maxLength: 20 }),
          fc.string({ minLength: 1, maxLength: 50 }),
          async (badEmail, password, name) => {
            fc.pre(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(badEmail));

            await request(app.getHttpServer())
              .post('/api/auth/register')
              .send({ email: badEmail, password, name })
              .expect(400);
          },
        ),
        { numRuns: 50 },
      );
    });

    it('should reject short passwords (< 8 chars)', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.emailAddress(),
          fc.string({ minLength: 1, maxLength: 7 }),
          fc.string({ minLength: 1, maxLength: 50 }),
          async (email, shortPassword, name) => {
            await request(app.getHttpServer())
              .post('/api/auth/register')
              .send({ email, password: shortPassword, name })
              .expect(400);
          },
        ),
        { numRuns: 50 },
      );
    });
  });

  // ─────────────────────────────────────────────────
  // Property 2: Đăng nhập thành công trả về JWT hợp lệ
  // ─────────────────────────────────────────────────
  describe('Property 2: Successful login returns valid JWT', () => {
    it('should return accessToken and refreshToken for valid credentials', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.emailAddress(),
          fc.string({ minLength: 8, maxLength: 20 }),
          fc.string({ minLength: 1, maxLength: 50 }),
          async (email, password, name) => {
            const hashedPassword = await bcrypt.hash(password, 12);
            mockPrisma.user.findUnique.mockResolvedValue({
              id: 'prop-user-id',
              email,
              password: hashedPassword,
              name,
              role: 'USER',
              isActive: true,
              avatar: null,
              createdAt: new Date(),
              updatedAt: new Date(),
            });
            mockCache.set.mockImplementation(() => Promise.resolve(true));

            const response = await request(app.getHttpServer())
              .post('/api/auth/login')
              .send({ email, password });

            expect(response.status).toBe(200);
            expect(response.body).toHaveProperty('accessToken');
            expect(response.body).toHaveProperty('refreshToken');
            expect(typeof response.body.accessToken).toBe('string');
            expect(typeof response.body.refreshToken).toBe('string');
            expect(response.body.accessToken.split('.')).toHaveLength(3);
          },
        ),
        { numRuns: 50 },
      );
    });
  });

  // ─────────────────────────────────────────────────
  // Property 3: RefreshToken round-trip tạo accessToken mới
  // ─────────────────────────────────────────────────
  describe('Property 3: Refresh token round-trip creates a new token and invalidates the old one', () => {
    it('should return a new refreshToken when refreshing a valid token', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.emailAddress(),
          fc.string({ minLength: 8, maxLength: 20 }),
          fc.string({ minLength: 1, maxLength: 50 }),
          async (email, password, name) => {
            mockPrisma.user.findUnique.mockClear();
            mockCache.get.mockClear();
            mockCache.set.mockClear();
            mockCache.del.mockClear();

            const user = {
              id: 'prop-refresh-id',
              email,
              password: await bcrypt.hash(password, 12),
              name,
              role: 'USER',
              isActive: true,
              avatar: null,
              createdAt: new Date(),
              updatedAt: new Date(),
            };

            // First login resolves user lookup and the user info read after token generation
            mockPrisma.user.findUnique
              .mockResolvedValueOnce(user)
              .mockResolvedValueOnce(user);
            mockCache.set.mockImplementation(() => Promise.resolve(true));

            const loginResponse = await request(app.getHttpServer())
              .post('/api/auth/login')
              .send({ email, password });

            expect(loginResponse.status).toBe(200);
            const originalRefreshToken = loginResponse.body.refreshToken;
            expect(originalRefreshToken).toBeDefined();

            // Prepare refresh path: return stored hash and same user lookup
            const refreshHash = await bcrypt.hash(originalRefreshToken, 10);
            mockCache.get.mockResolvedValueOnce(refreshHash);
            mockPrisma.user.findUnique.mockResolvedValueOnce(user);
            mockCache.del.mockResolvedValueOnce(true);
            mockCache.set.mockResolvedValueOnce(true);

            const refreshResponse = await request(app.getHttpServer())
              .post('/api/auth/refresh')
              .send({ refreshToken: originalRefreshToken });

            expect(refreshResponse.status).toBe(200);
            expect(refreshResponse.body).toHaveProperty('refreshToken');
            expect(refreshResponse.body.refreshToken).not.toBe(originalRefreshToken);
            expect(mockCache.del).toHaveBeenCalledWith(`refresh:${user.id}`);

            // Old refresh token should no longer be valid
            mockCache.get.mockResolvedValueOnce(null);
            await request(app.getHttpServer())
              .post('/api/auth/refresh')
              .send({ refreshToken: originalRefreshToken })
              .expect(401);
          },
        ),
        { numRuns: 30 },
      );
    });
  });

  // ─────────────────────────────────────────────────
  // Property 4: Đăng xuất vô hiệu hóa refreshToken
  // ─────────────────────────────────────────────────
  describe('Property 4: Logout invalidates refreshToken', () => {
    it('should delete refresh token from cache on logout', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.uuid(),
          async (userId) => {
            mockCache.del.mockClear();
            mockCache.del.mockImplementation(() => Promise.resolve(true));

            const module = app.get(AuthService);
            await module.logout(userId);

            expect(mockCache.del).toHaveBeenCalledWith(`refresh:${userId}`);
          },
        ),
        { numRuns: 30 },
      );
    });
  });
});