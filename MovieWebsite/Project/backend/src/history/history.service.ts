import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UpsertHistoryDto } from './dto/upsert-history.dto';

@Injectable()
export class HistoryService {
  constructor(private readonly prisma: PrismaService) {}

  async upsertHistory(userId: string, dto: UpsertHistoryDto) {
    if (!dto.movieSlug && !dto.movieId) {
      throw new BadRequestException('Either movieSlug or movieId must be provided');
    }

    const movie = dto.movieSlug
      ? await this.prisma.movie.findUnique({ where: { slug: dto.movieSlug } })
      : await this.prisma.movie.findUnique({ where: { id: dto.movieId } });

    if (!movie) throw new NotFoundException('Movie not found');

    let episode: any = null;
    if (dto.serverName && dto.episodeSlug) {
      episode = await this.prisma.episode.findUnique({
        where: {
          movieId_serverName_slug: {
            movieId: movie.id,
            serverName: dto.serverName,
            slug: dto.episodeSlug,
          },
        },
      });
    }

    if (!episode && dto.episodeSlug) {
      episode = await this.prisma.episode.findFirst({
        where: {
          movieId: movie.id,
          slug: dto.episodeSlug,
        },
      });
    }

    if (!episode) {
      episode = await this.prisma.episode.findFirst({
        where: { movieId: movie.id },
      });
    }

    if (!episode) throw new NotFoundException('Episode not found');

    return this.prisma.watchHistory.upsert({
      where: { userId_episodeId: { userId, episodeId: episode.id } },
      create: {
        userId,
        movieId: movie.id,
        episodeId: episode.id,
        episodeSlug: dto.episodeSlug || episode.slug,
        serverName: episode.serverName || dto.serverName || 'Default',
        progressSec: dto.progressSec ?? 0,
        watchedAt: new Date(),
      },
      update: {
        progressSec: dto.progressSec ?? 0,
        watchedAt: new Date(),
      },
      include: {
        movie: true,
        episode: true,
      },
    });
  }

  async getEpisodeHistory(
    userId: string,
    movieSlug: string,
    serverName: string,
    episodeSlug: string,
  ) {
    const movie = await this.prisma.movie.findUnique({ where: { slug: movieSlug } });
    if (!movie) throw new NotFoundException('Movie not found');

    const episode = await this.prisma.episode.findUnique({
      where: {
        movieId_serverName_slug: {
          movieId: movie.id,
          serverName,
          slug: episodeSlug,
        },
      },
    });

    if (!episode) throw new NotFoundException('Episode not found');

    return this.prisma.watchHistory.findUnique({
      where: { userId_episodeId: { userId, episodeId: episode.id } },
      include: { movie: true, episode: true },
    });
  }

  async deleteHistoryByMovie(userId: string, movieSlug: string) {
    const movie = await this.prisma.movie.findUnique({ where: { slug: movieSlug } });
    if (!movie) throw new NotFoundException('Movie not found');

    await this.prisma.watchHistory.deleteMany({
      where: { userId, movieId: movie.id },
    });

    return { deleted: true };
  }

  async deleteHistoryById(userId: string, id: string) {
    await this.prisma.watchHistory.deleteMany({
      where: { id, userId },
    });
    return { deleted: true };
  }

  async listHistory(userId: string) {
    return this.prisma.watchHistory.findMany({
      where: { userId },
      include: {
        movie: {
          include: {
            categories: {
              include: {
                category: true,
              },
            },
          },
        },
        episode: true,
      },
      orderBy: { watchedAt: 'desc' },
    });
  }
}
