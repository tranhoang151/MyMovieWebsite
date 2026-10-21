import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { QueryMoviesDto } from './dto/query-movies.dto';

@Injectable()
export class MoviesService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(params: QueryMoviesDto) {
    const { skip = 0, take = 20, search, quality, language, status, category, type } = params;
    const where: any = {};

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { originalName: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (quality) where.quality = { equals: quality, mode: 'insensitive' };
    if (language) where.language = { equals: language, mode: 'insensitive' };
    if (status) where.status = { equals: status, mode: 'insensitive' };
    if (category) {
      where.categories = { some: { category: { slug: category } } };
    }

    // Filter by type: series (totalEpisodes > 1) or single (totalEpisodes = 1)
    if (type === 'series') {
      where.totalEpisodes = { gt: 1 };
    } else if (type === 'single') {
      where.totalEpisodes = { equals: 1 };
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