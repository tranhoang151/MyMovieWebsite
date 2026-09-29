import { Test, TestingModule } from '@nestjs/testing';
// Mock PrismaService to avoid importing the generated ESM Prisma client in Jest
jest.mock('../prisma/prisma.service', () => ({ PrismaService: class {} }));
import { MoviesController } from './movies.controller';
import { MoviesService } from './movies.service';

describe('MoviesController', () => {
  let controller: MoviesController;
  const serviceMock = {
    findAll: jest.fn().mockResolvedValue([]),
    findBySlug: jest.fn().mockResolvedValue(null),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [MoviesController],
      providers: [{ provide: MoviesService, useValue: serviceMock }],
    }).compile();

    controller = module.get<MoviesController>(MoviesController);
  });

  it('delegates list query parameters to MoviesService', async () => {
    await controller.list({ search: 'test', skip: 2, take: 5 } as any);
    expect(serviceMock.findAll).toHaveBeenCalledWith({ search: 'test', skip: 2, take: 5 });
  });

  it('delegates detail slug to MoviesService', async () => {
    await controller.detail('batman');
    expect(serviceMock.findBySlug).toHaveBeenCalledWith('batman');
  });
});
