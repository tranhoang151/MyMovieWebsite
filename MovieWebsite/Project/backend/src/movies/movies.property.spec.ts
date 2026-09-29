import fc from 'fast-check';
// Mock PrismaService to avoid importing the generated ESM Prisma client in Jest
jest.mock('../prisma/prisma.service', () => ({ PrismaService: class {} }));
import { MoviesService } from './movies.service';
import { PrismaService } from '../prisma/prisma.service';

const createService = () => {
  const prisma: any = {
    movie: {
      findMany: jest.fn().mockResolvedValue([]),
      findUnique: jest.fn().mockResolvedValue({ id: '1', slug: 'test' }),
    },
  };
  return { service: new MoviesService(prisma as PrismaService), prisma };
};

describe('MoviesService property tests', () => {
  it('handles pagination and search inputs', async () => {
    const { service, prisma } = createService();

    await fc.assert(
      fc.asyncProperty(
        fc.string({ minLength: 1, maxLength: 20 }),
        fc.integer({ min: 0, max: 50 }),
        fc.integer({ min: 1, max: 100 }),
        async (search, skip, take) => {
          await service.findAll({ search, skip, take });
          expect(prisma.movie.findMany).toHaveBeenCalledWith(
            expect.objectContaining({ skip, take, where: expect.any(Object) }),
          );
        },
      ),
      { numRuns: 20 },
    );
  });

  it('supports filter combinations for quality, status, and language', async () => {
    const { service, prisma } = createService();
    await fc.assert(
      fc.asyncProperty(
        fc.string({ minLength: 1, maxLength: 10 }),
        fc.string({ minLength: 1, maxLength: 10 }),
        fc.string({ minLength: 1, maxLength: 10 }),
        async (quality, language, status) => {
          await service.findAll({ quality, language, status });
          expect(prisma.movie.findMany).toHaveBeenCalledWith(
            expect.objectContaining({
              where: expect.objectContaining({
                quality: expect.objectContaining({ equals: quality }),
                language: expect.objectContaining({ equals: language }),
                status: expect.objectContaining({ equals: status }),
              }),
            }),
          );
        },
      ),
      { numRuns: 20 },
    );
  });

  it('returns detail for slug and includes relations', async () => {
    const { service, prisma } = createService();
    await service.findBySlug('my-movie');
    expect(prisma.movie.findUnique).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { slug: 'my-movie' },
        include: expect.any(Object),
      }),
    );
  });
});
