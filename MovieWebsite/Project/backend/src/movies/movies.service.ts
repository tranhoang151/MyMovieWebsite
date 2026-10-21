import { Injectable, Optional } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CacheService } from '../services/cache.service';
import { QueryMoviesDto } from './dto/query-movies.dto';

@Injectable()
export class MoviesService {
  constructor(
    private readonly prisma: PrismaService,
    @Optional() private readonly cacheService?: CacheService,
  ) {}

  async findAll(params: QueryMoviesDto) {
    const { skip = 0, take = 20, search, quality, language, status, category, type } = params;
    const limit = take > 0 ? take : 20;

    // 1. Kiểm tra cache Redis trước khi truy vấn PostgreSQL
    const cacheKey = `movies:list:s${skip}_t${limit}_q${quality || ''}_l${language || ''}_st${status || ''}_c${category || ''}_tp${type || ''}_kw${search || ''}`;
    if (this.cacheService) {
      const cached = await this.cacheService.get(cacheKey);
      if (cached) {
        return cached;
      }
    }

    const where: any = {};
    const andConditions: any[] = [];

    if (search) {
      const searchOr = [
        { name: { contains: search, mode: 'insensitive' } },
        { originalName: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ];
      if (type) {
        andConditions.push({ OR: searchOr });
      } else {
        where.OR = searchOr;
      }
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

    // 2. Tối ưu: Chỉ lấy tối đa 1 tập đầu tiên (để phục vụ Banner "Xem ngay") thay vì hàng trăm tập
    const [items, total] = await Promise.all([
      this.prisma.movie.findMany({
        skip,
        take: limit,
        where,
        orderBy: { createdAt: 'desc' },
        include: {
          episodes: {
            take: 1,
            select: { slug: true, name: true },
          },
          categories: { include: { category: true } },
        },
      }),
      this.prisma.movie.count({ where }),
    ]);

    const page = Math.floor(skip / limit) + 1;
    const totalPages = Math.ceil(total / limit) || 1;

    const result = {
      items,
      total,
      page,
      limit,
      totalPages,
    };

    // 3. Lưu kết quả vào Redis Cache với TTL 5 phút (300 giây)
    if (this.cacheService) {
      await this.cacheService.set(cacheKey, result, 300);
    }

    return result;
  }

  async findBySlug(slug: string) {
    const cacheKey = `movie:detail:${slug}`;

    if (this.cacheService) {
      const cached = await this.cacheService.get(cacheKey);
      if (cached) {
        return cached;
      }
    }

    const movie = await this.prisma.movie.findUnique({
      where: { slug },
      include: {
        episodes: { orderBy: { sortOrder: 'asc' } },
        categories: { include: { category: true } },
      },
    });

    if (movie && this.cacheService) {
      // Lưu chi tiết phim vào Redis Cache với TTL 10 phút (600 giây)
      await this.cacheService.set(cacheKey, movie, 600);
    }

    return movie;
  }

  // Minimal upsert wrapper used by admin import flows
  async upsertFromParsed(data: any) {
    const result = await this.prisma.movie.upsert({
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

    // Tự động xóa cache khi có cập nhật phim
    if (this.cacheService) {
      await this.cacheService.invalidateMovie(data.slug);
      await this.cacheService.delPattern('movies:list:*');
    }

    return result;
  }
}
