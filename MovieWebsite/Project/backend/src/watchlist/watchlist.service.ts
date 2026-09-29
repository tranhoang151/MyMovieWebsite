import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class WatchlistService {
  constructor(private readonly prisma: PrismaService) {}

  async addToWatchlist(userId: string, movieSlug: string) {
    const movie = await this.prisma.movie.findUnique({ where: { slug: movieSlug } });
    if (!movie) throw new NotFoundException('Movie not found');

    const existing = await this.prisma.watchlist.findUnique({
      where: { userId_movieId: { userId, movieId: movie.id } },
    });

    if (existing) return existing;

    return this.prisma.watchlist.create({
      data: { userId, movieId: movie.id },
    });
  }

  async removeFromWatchlist(userId: string, movieSlug: string) {
    const movie = await this.prisma.movie.findUnique({ where: { slug: movieSlug } });
    if (!movie) throw new NotFoundException('Movie not found');

    await this.prisma.watchlist.deleteMany({
      where: { userId, movieId: movie.id },
    });

    return { deleted: true };
  }

  async listWatchlist(userId: string) {
    return this.prisma.watchlist.findMany({
      where: { userId },
      include: { movie: true },
      orderBy: { addedAt: 'desc' },
    });
  }
}
