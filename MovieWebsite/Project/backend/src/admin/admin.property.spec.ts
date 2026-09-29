jest.mock('../prisma/prisma.service', () => ({ PrismaService: jest.fn() }));

import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule, JwtService } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import * as fc from 'fast-check';
import request from 'supertest';
import { UsersController } from '../users/users.controller';
import { UsersService } from '../users/users.service';
import { AdminStatsController } from './admin.stats.controller';
import { AdminStatsService } from './admin.stats.service';
import { JwtStrategy } from '../auth/jwt.strategy';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { PrismaService } from '../prisma/prisma.service';

const mockPrisma = {
  user: {
    findUnique: jest.fn(),
    findMany: jest.fn(),
    count: jest.fn(),
  },
  movie: { count: jest.fn() },
  watchlist: { count: jest.fn() },
  watchHistory: { count: jest.fn() },
};

describe('Property tests for RBAC and JWT protected endpoints', () => {
  let app: INestApplication;
  let jwtService: JwtService;

  beforeAll(async () => {
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
            signOptions: { expiresIn: (configService.get<string>('JWT_EXPIRES_IN') || '15m') as any },
          }),
        }),
      ],
      controllers: [UsersController, AdminStatsController],
      providers: [
        UsersService,
        AdminStatsService,
        JwtStrategy,
        JwtAuthGuard,
        RolesGuard,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
    app.setGlobalPrefix('api');
    await app.init();

    jwtService = moduleFixture.get(JwtService);
  });

  afterAll(async () => {
    await app.close();
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('Property 23: admin endpoint should only allow ADMIN role', async () => {
    await fc.assert(
      fc.asyncProperty(fc.constantFrom('ADMIN', 'USER'), fc.uuid(), async (role, userId) => {
        const user = {
          id: userId,
          email: `${role.toLowerCase()}@example.com`,
          name: 'User',
          role,
          isActive: true,
        };

        mockPrisma.user.findUnique.mockResolvedValue(user);
        mockPrisma.user.count.mockResolvedValue(5);
        mockPrisma.movie.count.mockResolvedValue(10);
        mockPrisma.watchlist.count.mockResolvedValue(2);
        mockPrisma.watchHistory.count.mockResolvedValue(3);

        const token = await jwtService.signAsync({ sub: userId, email: user.email, role });

        const response = await request(app.getHttpServer())
          .get('/api/admin/stats')
          .set('Authorization', `Bearer ${token}`);

        if (role === 'ADMIN') {
          expect(response.status).toBe(200);
          expect(response.body).toMatchObject({ totalUsers: 5, totalMovies: 10, newUsersLast7Days: 5, newMoviesLast7Days: 10 });
        } else {
          expect(response.status).toBe(403);
        }
      }),
      { numRuns: 20 },
    );
  });

  it('Property 24: JWT protected endpoint should reject invalid tokens', async () => {
    await fc.assert(
      fc.asyncProperty(fc.string({ minLength: 1, maxLength: 100 }), async (invalidToken) => {
        const response = await request(app.getHttpServer())
          .get('/api/users/me')
          .set('Authorization', `Bearer ${invalidToken}`);

        expect(response.status).toBe(401);
      }),
      { numRuns: 20 },
    );
  });
});
