import { Test, TestingModule } from '@nestjs/testing';
// Mock PrismaService to avoid importing Prisma ESM client during Jest run
jest.mock('../prisma/prisma.service', () => ({ PrismaService: class {} }));
import { HistoryService } from './history.service';
import { PrismaService } from '../prisma/prisma.service';

describe('HistoryService', () => {
  let service: HistoryService;
  let prisma: any;

  beforeEach(async () => {
    prisma = {
      movie: { findUnique: jest.fn() },
      episode: { findUnique: jest.fn() },
      watchHistory: {
        upsert: jest.fn().mockResolvedValue({ id: 'h1' }),
        findMany: jest.fn().mockResolvedValue([]),
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        HistoryService,
        { provide: PrismaService, useValue: prisma },
      ],
    }).compile();

    service = module.get<HistoryService>(HistoryService);
  });

  it('upserts watch history when episode exists', async () => {
    prisma.movie.findUnique.mockResolvedValue({ id: 'm1' });
    prisma.episode.findUnique.mockResolvedValue({ id: 'e1' });

    await service.upsertHistory('u1', {
      movieSlug: 'movie-slug',
      episodeSlug: 'e1',
      serverName: 'S1',
      progressSec: 120,
    });

    expect(prisma.watchHistory.upsert).toHaveBeenCalledWith({
      where: { userId_episodeId: { userId: 'u1', episodeId: 'e1' } },
      create: expect.objectContaining({
        userId: 'u1',
        movieId: 'm1',
        episodeId: 'e1',
        serverName: 'S1',
        progressSec: 120,
        watchedAt: expect.any(Date),
      }),
      update: {
        progressSec: 120,
        watchedAt: expect.any(Date),
      },
    });
  });

  it('gets episode history by slug', async () => {
    prisma.movie.findUnique.mockResolvedValue({ id: 'm1' });
    prisma.episode.findUnique.mockResolvedValue({ id: 'e1' });
    prisma.watchHistory.findUnique = jest.fn().mockResolvedValue({ id: 'h1', progressSec: 90 });

    const result = await service.getEpisodeHistory('u1', 'movie-slug', 'S1', 'e1');
    expect(prisma.watchHistory.findUnique).toHaveBeenCalledWith({
      where: { userId_episodeId: { userId: 'u1', episodeId: 'e1' } },
      include: { movie: true, episode: true },
    });
    expect(result).toEqual({ id: 'h1', progressSec: 90 });
  });

  it('deletes history for a movie', async () => {
    prisma.movie.findUnique.mockResolvedValue({ id: 'm1' });
    prisma.watchHistory.deleteMany = jest.fn().mockResolvedValue({ count: 1 });

    const result = await service.deleteHistoryByMovie('u1', 'movie-slug');
    expect(prisma.watchHistory.deleteMany).toHaveBeenCalledWith({
      where: { userId: 'u1', movieId: 'm1' },
    });
    expect(result).toEqual({ deleted: true });
  });

  it('lists watch history for a user', async () => {
    await service.listHistory('u1');
    expect(prisma.watchHistory.findMany).toHaveBeenCalledWith({
      where: { userId: 'u1' },
      include: { movie: true, episode: true },
      orderBy: { watchedAt: 'desc' },
    });
  });
});
