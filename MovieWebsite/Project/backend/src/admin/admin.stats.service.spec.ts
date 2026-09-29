jest.mock('../prisma/prisma.service', () => ({ PrismaService: jest.fn() }));

import { AdminStatsService } from './admin.stats.service';

describe('AdminStatsService', () => {
  let service: AdminStatsService;
  let mockPrisma: any;

  beforeEach(() => {
    mockPrisma = {
      user: { count: jest.fn() },
      movie: { count: jest.fn() },
      watchlist: { count: jest.fn() },
      watchHistory: { count: jest.fn() },
    };

    service = new AdminStatsService(mockPrisma as any);
  });

  it('should return aggregated statistics', async () => {
    mockPrisma.user.count.mockResolvedValue(4);
    mockPrisma.movie.count.mockResolvedValue(12);
    mockPrisma.watchlist.count.mockResolvedValue(5);
    mockPrisma.watchHistory.count.mockResolvedValue(8);

    const stats = await service.getStats();

    expect(stats).toEqual({
      totalMovies: 12,
      totalUsers: 4,
      newUsersLast7Days: 4,
      newMoviesLast7Days: 12,
    });
  });
});
