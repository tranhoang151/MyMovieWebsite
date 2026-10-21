import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { QueryMoviesDto } from './dto/query-movies.dto';

@Injectable()
export class MoviesService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(params: QueryMoviesDto) {
    const { skip = 0, take = 20, search, quality, language, status, category, type } = params;
    const where: any = {};
    const andConditions: any[] = [];

    if (search) {
      andConditions.push({
        OR: [
          { name: { contains: search, mode: 'insensitive' } },
          { originalName: { contains: search, mode: 'insensitive' } },
          { description: { contains: search, mode: 'insensitive' } },
        ],
      });
    }

    if (quality) where.quality = { equals: quality, mode: 'insensitive' };
    if (language) where.language = { equals: language, mode: 'insensitive' };
    if (status) where.status = { equals: status, mode: 'insensitive' };
    if (category) {
      where.categories = { some: { category: { slug: category } } };
    }

    // Filter by type: series (Phim bộ) or single (Phim lẻ)
    if (type === 'series') {
      andConditions.push({
        OR: [
          { totalEpisodes: { gt: 1 } },
          { categories: { some: { category: { slug: 'phim-bo' } } } },
          { categories: { some: { category: { name: { contains: 'Phim bộ', mode: 'insensitive' } } } } },
        ],
      });
    } else if (type === 'single') {
      andConditions.push({
        OR: [
          { totalEpisodes: { equals: 1 } },
          { totalEpisodes: { equals: -1 } },
          { currentEpisode: { equals: 'FULL', mode: 'insensitive' } },
          { categories: { some: { category: { slug: 'phim-le' } } } },
          { categories: { some: { category: { name: { contains: 'Phim lẻ', mode: 'insensitive' } } } } },
        ],
      });
    }

    if (andConditions.length > 0) {
      where.AND = andConditions;
    }

    const limit = take > 0 ? take : 20;
    const [items, total] = await Promise.all([
      this.prisma.movie.findMany({
        skip,
        take: limit,
        where,
        orderBy: { createdAt: 'desc' },
        include: { episodes: true, categories: { include: { category: true } } },
      }),
      this.prisma.movie.count({ where }),
    ]);

    const page = Math.floor(skip / limit) + 1;
    const totalPages = Math.ceil(total / limit) || 1;

    return {
      items,
      total,
      page,
      limit,
      totalPages,
    };
  }

  async findBySlug(slug: string) {
    return this.prisma.movie.findUnique({
      where: { slug },
      include: {
        episodes: { orderBy: { sortOrder: 'asc' } },
        categories: { include: { category: true } },
      },
    });
  }

  // Minimal upsert wrapper used by admin import flows
  async upsertFromParsed(data: any) {
    return this.prisma.movie.upsert({
      where: { nguoncId: data.nguoncId },
      create: {
        nguoncId: data.nguoncId,
        slug: data.slug,
        name: data.name,
      },
      update: {
        slug: data.slug,
        name: data.name,
      },
    });
  }
}
