import { Test, TestingModule } from '@nestjs/testing';
// Mock PrismaService to avoid importing the generated ESM Prisma client in Jest
jest.mock('../prisma/prisma.service', () => ({ PrismaService: class {} }));
import { MoviesService } from './movies.service';
import { PrismaService } from '../prisma/prisma.service';

describe('MoviesService', () => {
  let service: MoviesService;
  let prisma: any;

  beforeEach(async () => {
    prisma = {
      movie: {
        findMany: jest.fn().mockResolvedValue([]),
        findUnique: jest.fn().mockResolvedValue(null),
        count: jest.fn().mockResolvedValue(0),
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MoviesService,
        { provide: PrismaService, useValue: prisma },
      ],
    }).compile();

    service = module.get<MoviesService>(MoviesService);
  });

  it('builds a search query and passes it to Prisma', async () => {
    await service.findAll({ search: 'batman', skip: 5, take: 10 });
    expect(prisma.movie.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        skip: 5,
        take: 10,
        where: expect.objectContaining({
          OR: expect.any(Array),
        }),
      }),
    );
  });

  it('includes filter conditions for quality, language, status, and category', async () => {
    await service.findAll({ quality: 'HD', language: 'Vietsub', status: 'ongoing', category: 'action' });
    expect(prisma.movie.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          quality: expect.objectContaining({ equals: 'HD' }),
          language: expect.objectContaining({ equals: 'Vietsub' }),
          status: expect.objectContaining({ equals: 'ongoing' }),
          categories: { some: { category: { slug: 'action' } } },
        }),
      }),
    );
  });

  it('returns null when detail slug not found', async () => {
    const result = await service.findBySlug('unknown');
    expect(prisma.movie.findUnique).toHaveBeenCalledWith(
      expect.objectContaining({ where: { slug: 'unknown' } }),
    );
    expect(result).toBeNull();
  });
});
