import { Test, TestingModule } from '@nestjs/testing';
// Mock PrismaService to avoid importing ESM-generated Prisma client during Jest run
jest.mock('../prisma/prisma.service', () => ({ PrismaService: class {} }));
import { AdminController } from './admin.controller';
import { AdminService } from './admin.service';

describe('AdminController', () => {
  let controller: AdminController;
  const mockAdminService = { syncFromSlug: jest.fn().mockResolvedValue({ movieId: 'm1' }) };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AdminController],
      providers: [{ provide: AdminService, useValue: mockAdminService }],
    }).compile();

    controller = module.get<AdminController>(AdminController);
  });

  it('calls adminService.syncFromSlug', async () => {
    const res = await controller.sync({ slug: 's1' } as any);
    expect(mockAdminService.syncFromSlug).toHaveBeenCalledWith('s1');
    expect(res.movieId).toBe('m1');
  });
});
