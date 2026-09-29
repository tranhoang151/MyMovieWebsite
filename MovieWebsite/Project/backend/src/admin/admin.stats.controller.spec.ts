jest.mock('../prisma/prisma.service', () => ({ PrismaService: jest.fn() }));

import { AdminStatsController } from './admin.stats.controller';
import { AdminStatsService } from './admin.stats.service';

describe('AdminStatsController', () => {
  let controller: AdminStatsController;
  const mockService = { getStats: jest.fn().mockResolvedValue({ totalMovies: 1, totalUsers: 1, newUsersLast7Days: 1, newMoviesLast7Days: 1 }) };

  beforeEach(() => {
    controller = new AdminStatsController(mockService as unknown as AdminStatsService);
  });

  it('should return admin statistics', async () => {
    const result = await controller.getStats();
    expect(result).toEqual({ totalMovies: 1, totalUsers: 1, newUsersLast7Days: 1, newMoviesLast7Days: 1 });
    expect(mockService.getStats).toHaveBeenCalled();
  });
});
