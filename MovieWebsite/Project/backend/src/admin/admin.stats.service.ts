import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AdminStatsService {
  constructor(private readonly prisma: PrismaService) {}

  async getStats() {
    const [usersCount, moviesCount, newUsersCount, newMoviesCount] = await Promise.all([
      this.prisma.user.count(),
      this.prisma.movie.count(),
      this.prisma.user.count({ where: { createdAt: { gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) } } }),
      this.prisma.movie.count({ where: { createdAt: { gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) } } }),
    ]);

    return {
      totalMovies: moviesCount,
      totalUsers: usersCount,
      newUsersLast7Days: newUsersCount,
      newMoviesLast7Days: newMoviesCount,
    };
  }
}
