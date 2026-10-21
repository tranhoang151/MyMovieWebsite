jest.mock('../prisma/prisma.service', () => ({ PrismaService: jest.fn() }));

import { UsersController } from './users.controller';
import { UsersService } from './users.service';

describe('UsersController', () => {
  let controller: UsersController;
  let service: any;

  beforeEach(() => {
    service = {
      getProfile: jest.fn().mockResolvedValue({ id: 'user-1' }),
      updateProfile: jest.fn().mockResolvedValue({ id: 'user-1', name: 'Updated' }),
      listUsers: jest.fn().mockResolvedValue([{ id: 'user-1' }]),
      getUserById: jest.fn().mockResolvedValue({ id: 'user-2' }),
      blockUser: jest.fn().mockResolvedValue({ id: 'user-2', isActive: false }),
      deleteUser: jest.fn().mockResolvedValue({ id: 'user-2', deleted: true }),
    };

    controller = new UsersController(service as UsersService);
  });

  it('should return profile for current user', async () => {
    const result = await controller.profile({ id: 'user-1' });
    expect(result).toEqual({ id: 'user-1' });
    expect(service.getProfile).toHaveBeenCalledWith('user-1');
  });

  it('should update current user profile', async () => {
    const result = await controller.updateProfile({ id: 'user-1' }, { name: 'Updated' });
    expect(result).toEqual({ id: 'user-1', name: 'Updated' });
    expect(service.updateProfile).toHaveBeenCalledWith('user-1', { name: 'Updated' });
  });

  it('should call listUsers for admin list', async () => {
    const result = await controller.listUsers();
    expect(result).toEqual([{ id: 'user-1' }]);
    expect(service.listUsers).toHaveBeenCalled();
  });

  it('should get user by id for admin', async () => {
    const result = await controller.getUser('user-2');
    expect(result).toEqual({ id: 'user-2' });
    expect(service.getUserById).toHaveBeenCalledWith('user-2');
  });

  it('should block or toggle user status for admin', async () => {
    const result = await controller.blockUser('user-2', { isActive: false });
    expect(result).toEqual({ id: 'user-2', isActive: false });
    expect(service.blockUser).toHaveBeenCalledWith('user-2', false);
  });

  it('should delete user for admin', async () => {
    const result = await controller.deleteUser('user-2');
    expect(result).toEqual({ id: 'user-2', deleted: true });
    expect(service.deleteUser).toHaveBeenCalledWith('user-2');
  });
});
