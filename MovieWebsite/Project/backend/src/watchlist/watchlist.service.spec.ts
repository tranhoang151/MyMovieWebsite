import { Test, TestingModule } from '@nestjs/testing';
// Mock PrismaService and avoid Prisma ESM import issues
jest.mock('../prisma/prisma.service', () => ({ PrismaService: class {} }));
import { WatchlistService } from './watchlist.service';
import { PrismaService } from '../prisma/prisma.service';

describe('WatchlistService', () => {
  let service: WatchlistService;
  let prisma: any;

  beforeEach(async () => {
    prisma = {
      movie: { findUnique: jest.fn() },
      watchlist: {
        findUnique: jest.fn(),
        create: jest.fn().mockResolvedValue({ id: 'w1' }),
        deleteMany: jest.fn().mockResolvedValue({ count: 1 }),
        findMany: jest.fn().mockResolvedValue([]),
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        WatchlistService,
        { provide: PrismaService, useValue: prisma },
      ],
    }).compile();

    service = module.get<WatchlistService>(WatchlistService);
  });

  it('adds a movie to watchlist when it exists', async () => {
    prisma.movie.findUnique.mockResolvedValue({ id: 'm1' });
    prisma.watchlist.findUnique.mockResolvedValue(null);

    await service.addToWatchlist('u1', 'movie-slug');
    expect(prisma.watchlist.create).toHaveBeenCalledWith({
      data: { userId: 'u1', movieId: 'm1' },
    });
  });

  it('returns existing watchlist item if already present', async () => {
    prisma.movie.findUnique.mockResolvedValue({ id: 'm1' });
    prisma.watchlist.findUnique.mockResolvedValue({ id: 'w1' });

    const result = await service.addToWatchlist('u1', 'movie-slug');
    expect(result).toEqual({ id: 'w1' });
    expect(prisma.watchlist.create).not.toHaveBeenCalled();
  });

  it('removes a movie from watchlist', async () => {
    prisma.movie.findUnique.mockResolvedValue({ id: 'm2' });

    const result = await service.removeFromWatchlist('u1', 'movie-slug');
    expect(prisma.watchlist.deleteMany).toHaveBeenCalledWith({
      where: { userId: 'u1', movieId: 'm2' },
    });
    expect(result).toEqual({ deleted: true });
  });

  it('lists a user watchlist with movie relation', async () => {
    await service.listWatchlist('u1');
    expect(prisma.watchlist.findMany).toHaveBeenCalledWith({
      where: { userId: 'u1' },
      include: { movie: true },
      orderBy: { addedAt: 'desc' },
    });
  });
});
