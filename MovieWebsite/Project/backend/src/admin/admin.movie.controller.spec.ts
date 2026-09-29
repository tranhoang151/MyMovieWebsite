// Mock PrismaService import in nested AdminService dependency before loading controller module
jest.mock('../prisma/prisma.service', () => ({ PrismaService: class {} }));
import { AdminMovieController } from './admin.movie.controller';

describe('AdminMovieController', () => {
  let controller: AdminMovieController;
  let adminService: any;

  beforeEach(() => {
    adminService = {
      syncFromSlug: jest.fn().mockResolvedValue({ movieId: 'm1' }),
      updateMovie: jest.fn().mockResolvedValue({ movieId: 'm1', slug: 'updated' }),
      deleteMovieBySlug: jest.fn().mockResolvedValue({ movieId: 'm1', deleted: true }),
    };
    controller = new AdminMovieController(adminService);
  });

  it('imports a movie from slug', async () => {
    const result = await controller.import({ slug: 'movie-slug' });
    expect(adminService.syncFromSlug).toHaveBeenCalledWith('movie-slug');
    expect(result).toEqual({ movieId: 'm1' });
  });

  it('updates a movie by slug', async () => {
    const dto = { name: 'Updated title' };
    const result = await controller.update('movie-slug', dto);
    expect(adminService.updateMovie).toHaveBeenCalledWith('movie-slug', dto);
    expect(result).toEqual({ movieId: 'm1', slug: 'updated' });
  });

  it('deletes a movie by slug', async () => {
    const result = await controller.remove('movie-slug');
    expect(adminService.deleteMovieBySlug).toHaveBeenCalledWith('movie-slug');
    expect(result).toEqual({ movieId: 'm1', deleted: true });
  });
});
