import { Test, TestingModule } from '@nestjs/testing';
// Mock PrismaService to avoid importing ESM-generated Prisma client during Jest run
jest.mock('../prisma/prisma.service', () => ({ PrismaService: class {} }));
import { AdminScheduler } from './admin.scheduler';
import { AdminService } from './admin.service';
import { ConfigService } from '@nestjs/config';
import { BullmqService } from '../bullmq/bullmq.service';

describe('AdminScheduler', () => {
  let scheduler: AdminScheduler;
  const mockBullmq = { enqueueSync: jest.fn().mockResolvedValue(undefined) };
  const mockConfig = { get: jest.fn().mockReturnValue('s1,s2') };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AdminScheduler,
        { provide: AdminService, useValue: {} },
        { provide: BullmqService, useValue: mockBullmq },
        { provide: ConfigService, useValue: mockConfig },
      ],
    }).compile();

    scheduler = module.get(AdminScheduler);
  });

  it('queues sync jobs for configured slugs', async () => {
    await scheduler.runScheduledSync();
    expect(mockBullmq.enqueueSync).toHaveBeenCalledWith('s1');
    expect(mockBullmq.enqueueSync).toHaveBeenCalledWith('s2');
  });
});
