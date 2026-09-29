import { Test, TestingModule } from '@nestjs/testing';
import fc from 'fast-check';
// Mock PrismaService to avoid importing ESM-generated Prisma client during Jest run
jest.mock('../prisma/prisma.service', () => ({ PrismaService: class {} }));
import { AdminService } from './admin.service';
import { NguonCService } from '../nguonc/nguonc.service';
import { PrismaService } from '../prisma/prisma.service';

const makePrismaMock = (overrides = {}) => ({
  category: { upsert: jest.fn().mockResolvedValue({ id: 'cat1' }) },
  movie: {
    upsert: jest.fn().mockResolvedValue({ id: 'm1', lastSyncedAt: new Date() }),
    findUnique: jest.fn().mockResolvedValue({ id: 'm1', slug: 'existing' }),
    update: jest.fn().mockResolvedValue({ id: 'm1', slug: 'updated' }),
    delete: jest.fn().mockResolvedValue({ id: 'm1', slug: 'deleted' }),
  },
  categoriesOnMovies: { deleteMany: jest.fn().mockResolvedValue({}), create: jest.fn().mockResolvedValue({}) },
  episode: {
    upsert: jest.fn().mockResolvedValue({}),
    deleteMany: jest.fn().mockResolvedValue({}),
  },
  ...overrides,
});

describe('AdminService', () => {
  let service: AdminService;
  let prismaMock: any;
  let nguonc: NguonCService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AdminService,
        { provide: NguonCService, useValue: { fetchAndParse: jest.fn() } },
        { provide: PrismaService, useValue: makePrismaMock() },
      ],
    }).compile();

    service = module.get(AdminService);
    prismaMock = module.get(PrismaService);
    nguonc = module.get(NguonCService) as NguonCService;
  });

  it('syncFromSlug upserts movie/categories/episodes', async () => {
    (nguonc.fetchAndParse as jest.Mock).mockResolvedValue({
      nguoncId: 'gid',
      slug: 's1',
      name: 'Name',
      categories: [{ slug: 'a', name: 'A', group: 'G' }],
      episodes: [{ serverName: 'S', name: 'E1', slug: 'e1' }],
      totalEpisodes: 1,
    });

    const res = await service.syncFromSlug('s1');
    expect(prismaMock.category.upsert).toHaveBeenCalled();
    expect(prismaMock.movie.upsert).toHaveBeenCalled();
    expect(prismaMock.categoriesOnMovies.deleteMany).toHaveBeenCalled();
    expect(prismaMock.episode.upsert).toHaveBeenCalled();
    expect(res.movieId).toBeDefined();
  });

  it('updateMovie updates an existing movie', async () => {
    const dto = { name: 'Updated movie', quality: 'HD', isActive: false };
    const result = await service.updateMovie('existing', dto as any);

    expect(prismaMock.movie.findUnique).toHaveBeenCalledWith({ where: { slug: 'existing' } });
    expect(prismaMock.movie.update).toHaveBeenCalledWith({ where: { slug: 'existing' }, data: dto });
    expect(result).toEqual({ id: 'm1', slug: 'updated' });
  });

  it('deleteMovieBySlug removes an existing movie', async () => {
    const result = await service.deleteMovieBySlug('existing');

    expect(prismaMock.movie.findUnique).toHaveBeenCalledWith({ where: { slug: 'existing' } });
    expect(prismaMock.movie.delete).toHaveBeenCalledWith({ where: { slug: 'existing' } });
    expect(result).toEqual({ movieId: 'm1', deleted: true });
  });

  it('syncFromSlug is idempotent on repeated imports', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          slug: fc.string({ minLength: 1, maxLength: 15 }),
          nguoncId: fc.string({ minLength: 1, maxLength: 15 }),
          name: fc.string({ minLength: 1, maxLength: 30 }),
          description: fc.string({ minLength: 1, maxLength: 40 }),
          quality: fc.constantFrom('HD', 'FHD', 'SD'),
          language: fc.constantFrom('Vietsub', 'Thuyết Minh', 'English'),
          status: fc.constantFrom('ongoing', 'completed'),
          year: fc.string({ minLength: 1, maxLength: 4 }),
          categories: fc.array(
            fc.record({
              slug: fc.string({ minLength: 1, maxLength: 10 }),
              name: fc.string({ minLength: 1, maxLength: 20 }),
              group: fc.string({ minLength: 1, maxLength: 20 }),
            }),
            { minLength: 1, maxLength: 3 },
          ),
          episodes: fc.array(
            fc.record({
              serverName: fc.string({ minLength: 1, maxLength: 10 }),
              name: fc.string({ minLength: 1, maxLength: 20 }),
              slug: fc.string({ minLength: 1, maxLength: 15 }),
            }),
            { minLength: 1, maxLength: 5 },
          ),
        }),
        async (parsed) => {
          const response = {
            ...parsed,
            thumbUrl: null,
            posterUrl: null,
            director: null,
            casts: null,
            time: null,
            totalEpisodes: parsed.episodes.length,
            currentEpisode: '1',
            lastSyncedAt: new Date(),
          };

          (nguonc.fetchAndParse as jest.Mock).mockResolvedValue(response);
          prismaMock.category.upsert.mockClear();
          prismaMock.movie.upsert.mockClear();
          prismaMock.categoriesOnMovies.deleteMany.mockClear();
          prismaMock.episode.upsert.mockClear();

          await service.syncFromSlug(parsed.slug);
          await service.syncFromSlug(parsed.slug);

          expect(prismaMock.movie.upsert).toHaveBeenCalledTimes(2);
          expect(prismaMock.categoriesOnMovies.deleteMany).toHaveBeenCalledTimes(2);
          expect(prismaMock.episode.upsert).toHaveBeenCalledTimes(parsed.episodes.length * 2);
        },
      ),
      { numRuns: 10 },
    );
  });

  it('import only adds new episodes and does not remove existing episodes', async () => {
    const parsed = {
      slug: 'series-slug',
      nguoncId: 'gid',
      name: 'Series Name',
      description: 'A new season',
      quality: 'HD',
      language: 'Vietsub',
      status: 'ongoing',
      year: '2026',
      categories: [{ slug: 'action', name: 'Action', group: 'Thể loại' }],
      episodes: [
        { serverName: 'S1', name: 'E1', slug: 'e1' },
        { serverName: 'S1', name: 'E2', slug: 'e2' },
      ],
    };

    (nguonc.fetchAndParse as jest.Mock).mockResolvedValue({
      ...parsed,
      thumbUrl: null,
      posterUrl: null,
      director: null,
      casts: null,
      time: null,
      totalEpisodes: parsed.episodes.length,
      currentEpisode: '2',
      lastSyncedAt: new Date(),
    });

    prismaMock.episode.upsert.mockClear();
    prismaMock.episode.deleteMany.mockClear();

    await service.syncFromSlug(parsed.slug);

    expect(prismaMock.episode.upsert).toHaveBeenCalledTimes(parsed.episodes.length);
    expect(prismaMock.episode.deleteMany).not.toHaveBeenCalled();
    expect(prismaMock.episode.upsert).toHaveBeenNthCalledWith(1, expect.objectContaining({
      create: expect.objectContaining({ slug: 'e1' }),
    }));
    expect(prismaMock.episode.upsert).toHaveBeenNthCalledWith(2, expect.objectContaining({
      create: expect.objectContaining({ slug: 'e2' }),
    }));
  });
});
