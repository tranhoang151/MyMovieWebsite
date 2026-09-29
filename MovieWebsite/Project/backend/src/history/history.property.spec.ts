import fc from 'fast-check';
// Mock PrismaService to avoid importing the generated ESM Prisma client in Jest
jest.mock('../prisma/prisma.service', () => ({ PrismaService: class {} }));
import { HistoryService } from './history.service';
import { PrismaService } from '../prisma/prisma.service';

const createService = () => {
  const prisma: any = {
    movie: { findUnique: jest.fn() },
    episode: { findUnique: jest.fn() },
    watchHistory: {
      upsert: jest.fn().mockResolvedValue({ id: 'h1' }),
      findMany: jest.fn().mockResolvedValue([]),
      findUnique: jest.fn().mockResolvedValue(null),
      deleteMany: jest.fn().mockResolvedValue({ count: 0 }),
    },
  };
  return { service: new HistoryService(prisma as PrismaService), prisma };
};

describe('History Service property tests', () => {
  it('Property 13: upsert history does not create duplicate records', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.uuid(),
        fc.string({ minLength: 1, maxLength: 20 }),
        fc.string({ minLength: 1, maxLength: 20 }),
        fc.string({ minLength: 1, maxLength: 20 }),
        fc.integer({ min: 0, max: 600 }),
        async (userId, movieSlug, episodeSlug, serverName, progressSec) => {
          const { service, prisma } = createService();
          prisma.movie.findUnique.mockResolvedValue({ id: 'm1' });
          prisma.episode.findUnique.mockResolvedValue({ id: 'e1' });

          await service.upsertHistory(userId, { movieSlug, episodeSlug, serverName, progressSec });
          await service.upsertHistory(userId, { movieSlug, episodeSlug, serverName, progressSec: progressSec + 1 });

          expect(prisma.watchHistory.upsert).toHaveBeenCalledTimes(2);
          expect(prisma.watchHistory.upsert).toHaveBeenNthCalledWith(2, expect.objectContaining({
            where: { userId_episodeId: { userId, episodeId: 'e1' } },
          }));
        },
      ),
      { numRuns: 10 },
    );
  });

  it('Property 14: history list is ordered by watchedAt descending', async () => {
    await fc.assert(
      fc.asyncProperty(fc.uuid(), async (userId) => {
        const { service, prisma } = createService();
        await service.listHistory(userId);

        expect(prisma.watchHistory.findMany).toHaveBeenCalledWith(
          expect.objectContaining({
            where: { userId },
            orderBy: { watchedAt: 'desc' },
          }),
        );
      }),
      { numRuns: 10 },
    );
  });

  it('Property 15: deleting movie history removes all records for that movie', async () => {
    await fc.assert(
      fc.asyncProperty(fc.uuid(), fc.string({ minLength: 1, maxLength: 20 }), async (userId, movieSlug) => {
        const { service, prisma } = createService();
        prisma.movie.findUnique.mockResolvedValue({ id: 'm1' });

        const result = await service.deleteHistoryByMovie(userId, movieSlug);
        expect(prisma.watchHistory.deleteMany).toHaveBeenCalledWith({
          where: { userId, movieId: 'm1' },
        });
        expect(result).toEqual({ deleted: true });
      }),
      { numRuns: 10 },
    );
  });

  it('Property 9: progress round-trip returns latest progress for an episode', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.uuid(),
        fc.string({ minLength: 1, maxLength: 20 }),
        fc.string({ minLength: 1, maxLength: 20 }),
        fc.string({ minLength: 1, maxLength: 20 }),
        fc.integer({ min: 0, max: 600 }),
        async (userId, movieSlug, episodeSlug, serverName, progressSec) => {
          const { service, prisma } = createService();
          prisma.movie.findUnique.mockResolvedValue({ id: 'm1' });
          prisma.episode.findUnique.mockResolvedValue({ id: 'e1' });
          prisma.watchHistory.findUnique.mockResolvedValue({ id: 'h1', progressSec });

          const result = await service.getEpisodeHistory(userId, movieSlug, serverName, episodeSlug);
          expect(prisma.watchHistory.findUnique).toHaveBeenCalledWith({
            where: { userId_episodeId: { userId, episodeId: 'e1' } },
            include: { movie: true, episode: true },
          });
          expect(result).toEqual({ id: 'h1', progressSec });
        },
      ),
      { numRuns: 10 },
    );
  });
});
