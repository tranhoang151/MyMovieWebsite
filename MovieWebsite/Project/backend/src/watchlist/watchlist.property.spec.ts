import fc from 'fast-check';
// Mock PrismaService to avoid importing the generated ESM Prisma client in Jest
jest.mock('../prisma/prisma.service', () => ({ PrismaService: class {} }));
import { WatchlistService } from './watchlist.service';
import { PrismaService } from '../prisma/prisma.service';

describe('Watchlist Service property tests', () => {
  const createService = () => {
    const prisma: any = {
      movie: { findUnique: jest.fn() },
      watchlist: {
        findUnique: jest.fn(),
        create: jest.fn().mockResolvedValue({ id: 'w1' }),
        deleteMany: jest.fn().mockResolvedValue({ count: 1 }),
        findMany: jest.fn().mockResolvedValue([]),
      },
    };
    return { service: new WatchlistService(prisma as PrismaService), prisma };
  };

  it('Property 10: adding a movie reflects in user watchlist', async () => {
    await fc.assert(
      fc.asyncProperty(fc.uuid(), fc.string({ minLength: 1, maxLength: 20 }), async (userId, movieSlug) => {
        const { service, prisma } = createService();
        prisma.movie.findUnique.mockResolvedValue({ id: 'm1' });
        prisma.watchlist.findUnique.mockResolvedValue(null);
        prisma.watchlist.findMany.mockResolvedValue([{ id: 'w1', movie: { slug: movieSlug } }]);

        await service.addToWatchlist(userId, movieSlug);
        const list = await service.listWatchlist(userId);

        expect(prisma.watchlist.create).toHaveBeenCalledWith({ data: { userId, movieId: 'm1' } });
        expect(list).toEqual([{ id: 'w1', movie: { slug: movieSlug } }]);
      }),
      { numRuns: 10 },
    );
  });

  it('Property 11: removing a movie removes it from the watchlist', async () => {
    await fc.assert(
      fc.asyncProperty(fc.uuid(), fc.string({ minLength: 1, maxLength: 20 }), async (userId, movieSlug) => {
        const { service, prisma } = createService();
        prisma.movie.findUnique.mockResolvedValue({ id: 'm2' });
        prisma.watchlist.findMany.mockResolvedValue([]);

        const result = await service.removeFromWatchlist(userId, movieSlug);
        expect(prisma.watchlist.deleteMany).toHaveBeenCalledWith({ where: { userId, movieId: 'm2' } });
        expect(result).toEqual({ deleted: true });
      }),
      { numRuns: 10 },
    );
  });

  it('Property 12: watchlist is ordered by newest addedAt first', async () => {
    await fc.assert(
      fc.asyncProperty(fc.uuid(), async (userId) => {
        const { service, prisma } = createService();
        await service.listWatchlist(userId);
        expect(prisma.watchlist.findMany).toHaveBeenCalledWith(
          expect.objectContaining({
            where: { userId },
            orderBy: { addedAt: 'desc' },
          }),
        );
      }),
      { numRuns: 10 },
    );
  });
});
