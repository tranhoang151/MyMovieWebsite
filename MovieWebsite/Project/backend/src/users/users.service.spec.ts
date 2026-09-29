jest.mock('../prisma/prisma.service', () => ({ PrismaService: jest.fn() }));

import { NotFoundException } from '@nestjs/common';
import { UsersService } from './users.service';

describe('UsersService', () => {
  let service: UsersService;
  let mockPrisma: any;

  beforeEach(() => {
    mockPrisma = {
      user: {
        findUnique: jest.fn(),
        update: jest.fn(),
        findMany: jest.fn(),
      },
    };

    service = new UsersService(mockPrisma as any);
  });

  it('should return the current user profile', async () => {
    const user = {
      id: 'user-1',
      email: 'john@example.com',
      name: 'John Doe',
      avatar: null,
      role: 'USER',
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    mockPrisma.user.findUnique.mockResolvedValue(user);
    const result = await service.getProfile('user-1');

    expect(result).toEqual(user);
    expect(mockPrisma.user.findUnique).toHaveBeenCalledWith({
      where: { id: 'user-1' },
      select: expect.any(Object),
    });
  });

  it('should throw NotFoundException when profile does not exist', async () => {
    mockPrisma.user.findUnique.mockResolvedValue(null);

    await expect(service.getProfile('missing')).rejects.toThrow(NotFoundException);
  });

  it('should update the profile with provided fields', async () => {
    const existingUser = {
      id: 'user-1',
      email: 'john@example.com',
      name: 'John Doe',
      avatar: null,
      role: 'USER',
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const updatedUser = {
      ...existingUser,
      name: 'Jane Doe',
      avatar: 'https://example.com/avatar.png',
      updatedAt: new Date(),
    };

    mockPrisma.user.findUnique.mockResolvedValue(existingUser);
    mockPrisma.user.update.mockResolvedValue(updatedUser);

    const result = await service.updateProfile('user-1', {
      name: 'Jane Doe',
      avatar: 'https://example.com/avatar.png',
    });

    expect(result).toEqual(updatedUser);
    expect(mockPrisma.user.update).toHaveBeenCalledWith({
      where: { id: 'user-1' },
      data: {
        name: 'Jane Doe',
        avatar: 'https://example.com/avatar.png',
      },
      select: expect.any(Object),
    });
  });

  it('should throw NotFoundException when updating a missing user', async () => {
    mockPrisma.user.findUnique.mockResolvedValue(null);

    await expect(
      service.updateProfile('missing', { name: 'Jane Doe' }),
    ).rejects.toThrow(NotFoundException);
  });

  it('should return list of users', async () => {
    const users = [
      { id: 'user-1', email: 'john@example.com', name: 'John Doe', role: 'USER', isActive: true, avatar: null, createdAt: new Date(), updatedAt: new Date() },
      { id: 'user-2', email: 'jane@example.com', name: 'Jane Doe', role: 'ADMIN', isActive: true, avatar: null, createdAt: new Date(), updatedAt: new Date() },
    ];

    mockPrisma.user.findMany.mockResolvedValue(users);
    const result = await service.listUsers();

    expect(result).toEqual(users);
    expect(mockPrisma.user.findMany).toHaveBeenCalledWith({
      select: expect.any(Object),
      orderBy: { createdAt: 'desc' },
    });
  });

  it('should return a user by id', async () => {
    const user = {
      id: 'user-1',
      email: 'john@example.com',
      name: 'John Doe',
      avatar: null,
      role: 'USER',
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    mockPrisma.user.findUnique.mockResolvedValue(user);
    const result = await service.getUserById('user-1');

    expect(result).toEqual(user);
  });

  it('should throw NotFoundException when getUserById does not exist', async () => {
    mockPrisma.user.findUnique.mockResolvedValue(null);

    await expect(service.getUserById('missing')).rejects.toThrow(NotFoundException);
  });
});
