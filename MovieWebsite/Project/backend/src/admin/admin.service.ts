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
    try {
      const parsed: ParsedMovie = await this.nguonc.fetchAndParse(slug);

      if (!parsed) throw new HttpException('Parsed empty', HttpStatus.BAD_GATEWAY);

      // Upsert categories (deduplicate by slug)
      const categoryMap = new Map<string, any>();
      for (const c of parsed.categories || []) {
        const slug = c.slug?.trim();
        if (!slug) continue;
        if (categoryMap.has(slug)) continue; // skip duplicates
        const cat = await this.prisma.category.upsert({
          where: { slug },
          create: {
            nguoncId: c.nguoncId || slug,
            slug,
            name: c.name,
            group: c.group,
          },
          update: {
            name: c.name,
            group: c.group,
            nguoncId: c.nguoncId || slug,
          },
        });
        categoryMap.set(slug, cat);
      }
      const categoryRecords = Array.from(categoryMap.values());

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

      // Re-create category relations (deduplicated)
      await this.prisma.categoriesOnMovies.deleteMany({ where: { movieId: movie.id } });
      for (const cat of categoryRecords) {
        await this.prisma.categoriesOnMovies.create({
          data: { movieId: movie.id, categoryId: cat.id },
        });
      }

      // Upsert episodes (deduplicate by serverName + slug)
      const seenEpisodes = new Set<string>();
      for (let i = 0; i < (parsed.episodes || []).length; i++) {
        const ep = parsed.episodes[i];
        const key = `${ep.serverName}_${ep.slug}`;
        if (seenEpisodes.has(key)) continue;
        seenEpisodes.add(key);

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
    } catch (error) {
      console.error('SyncFromSlug error:', error);
      if (error instanceof HttpException) throw error;
      throw new HttpException(
        `Sync failed: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
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
    let existing = await this.prisma.movie.findUnique({ where: { slug } });
    if (!existing) {
      existing = await this.prisma.movie.findUnique({ where: { id: slug } });
    }
    if (!existing) throw new NotFoundException('Movie not found');

    const deleted = await this.prisma.movie.delete({ where: { slug: existing.slug } });
    return { movieId: deleted.id, deleted: true };
  }
}
