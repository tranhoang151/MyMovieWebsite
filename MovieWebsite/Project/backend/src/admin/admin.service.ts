import { Injectable, HttpException, HttpStatus, NotFoundException } from '@nestjs/common';
import { NguonCService } from '../nguonc/nguonc.service';
import { PrismaService } from '../prisma/prisma.service';
import { ParsedMovie } from '../nguonc/nguonc.types';
import { UpdateMovieDto } from './dto/update-movie.dto';

@Injectable()
export class AdminService {
  constructor(
    private readonly nguonc: NguonCService,
    private readonly prisma: PrismaService,
  ) {}

  async syncFromSlug(slug: string) {
    const parsed: ParsedMovie = await this.nguonc.fetchAndParse(slug);

    if (!parsed) throw new HttpException('Parsed empty', HttpStatus.BAD_GATEWAY);

    // Upsert categories
    const categoryRecords = [] as any[];
    for (const c of parsed.categories || []) {
      const cat = await this.prisma.category.upsert({
        where: { slug: c.slug },
        create: {
          nguoncId: c.nguoncId || c.slug,
          slug: c.slug,
          name: c.name,
          group: c.group,
        },
        update: {
          name: c.name,
          group: c.group,
          nguoncId: c.nguoncId || c.slug,
        },
      });
      categoryRecords.push(cat);
    }

    // Upsert movie
    const movie = await this.prisma.movie.upsert({
      where: { nguoncId: parsed.nguoncId },
      create: {
        nguoncId: parsed.nguoncId,
        slug: parsed.slug,
        name: parsed.name,
        originalName: parsed.originalName,
        description: parsed.description,
        thumbUrl: parsed.thumbUrl,
        posterUrl: parsed.posterUrl,
        quality: parsed.quality,
        language: parsed.language,
        director: parsed.director,
        casts: parsed.casts,
        time: parsed.time,
        totalEpisodes: parsed.totalEpisodes ?? 0,
        currentEpisode: parsed.currentEpisode,
        status: parsed.status ?? null,
        year: parsed.year ?? null,
        lastSyncedAt: new Date(),
      },
      update: {
        slug: parsed.slug,
        name: parsed.name,
        originalName: parsed.originalName,
        description: parsed.description,
        thumbUrl: parsed.thumbUrl,
        posterUrl: parsed.posterUrl,
        quality: parsed.quality,
        language: parsed.language,
        director: parsed.director,
        casts: parsed.casts,
        time: parsed.time,
        totalEpisodes: parsed.totalEpisodes ?? 0,
        currentEpisode: parsed.currentEpisode,
        status: parsed.status ?? null,
        year: parsed.year ?? null,
        lastSyncedAt: new Date(),
      },
    });

    // Re-create category relations (simple approach)
    await this.prisma.categoriesOnMovies.deleteMany({ where: { movieId: movie.id } });
    for (const cat of categoryRecords) {
      await this.prisma.categoriesOnMovies.create({
        data: { movieId: movie.id, categoryId: cat.id },
      });
    }

    // Upsert episodes
    for (let i = 0; i < (parsed.episodes || []).length; i++) {
      const ep = parsed.episodes[i];
      await this.prisma.episode.upsert({
        where: {
          movieId_serverName_slug: {
            movieId: movie.id,
            serverName: ep.serverName,
            slug: ep.slug,
          },
        },
        create: {
          movieId: movie.id,
          serverName: ep.serverName,
          name: ep.name,
          slug: ep.slug,
          embedUrl: ep.embedUrl ?? null,
          m3u8Url: ep.m3u8Url ?? null,
          sortOrder: i,
        },
        update: {
          name: ep.name,
          embedUrl: ep.embedUrl ?? null,
          m3u8Url: ep.m3u8Url ?? null,
          sortOrder: i,
        },
      });
    }

    return { movieId: movie.id, updatedAt: movie.lastSyncedAt };
  }

  async updateMovie(slug: string, dto: UpdateMovieDto) {
    const existing = await this.prisma.movie.findUnique({ where: { slug } });
    if (!existing) throw new NotFoundException('Movie not found');

    return this.prisma.movie.update({
      where: { slug },
      data: { ...dto },
    });
  }

  async deleteMovieBySlug(slug: string) {
    const existing = await this.prisma.movie.findUnique({ where: { slug } });
    if (!existing) throw new NotFoundException('Movie not found');

    const deleted = await this.prisma.movie.delete({ where: { slug } });
    return { movieId: deleted.id, deleted: true };
  }
}
