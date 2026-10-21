import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { ParsedMovie, NguonCMovieRaw, ParsedCategory, ParsedEpisode } from './nguonc.types';

@Injectable()
export class NguonCService {
  constructor() {}

  /**
   * Parse raw JSON response from NguonC API into ParsedMovie shape.
   * Throws HttpException on invalid structure or upstream error.
   */
  parseFromJson(raw: NguonCMovieRaw): ParsedMovie {
    if (!raw || raw.status !== 'success' || !raw.movie) {
      throw new HttpException(
        raw?.message || 'Invalid NguonC response',
        HttpStatus.BAD_GATEWAY,
      );
    }

    const movie = raw.movie;

    // Required fields
    if (!movie.id || !movie.slug || !movie.name) {
      throw new HttpException(
        'Missing required movie fields',
        HttpStatus.BAD_REQUEST,
      );
    }

    // Categories: movie.category is an object with numeric keys
    const categoriesRaw = movie.category || {};
    const categoriesValues = Object.values(categoriesRaw) as any[];

    const categories: ParsedCategory[] = categoriesValues
      .map((c) => {
        if (!c) return null;
        return {
          nguoncId: String(c.id ?? ''),
          slug: String(c.slug ?? '').trim(),
          name: String(c.name ?? '').trim(),
          group: String(c.group ?? '').trim(),
        } as ParsedCategory;
      })
      .filter((c): c is ParsedCategory => c !== null);

    // Determine year from categories group if present
    const yearCat = categories.find((c) => /năm/i.test(c.group || ''));
    const year = yearCat ? yearCat.name : null;

    // Episodes mapping — defensive: support multiple structures (Array, { items: [...] }, { "0": {...} })
    const episodes: ParsedEpisode[] = [];
    try {
      const eps = (movie as any).episodes ?? (movie as any).episode ?? null;
      let serverList: any[] = [];
      if (Array.isArray(eps)) {
        serverList = eps;
      } else if (eps && Array.isArray(eps.items)) {
        serverList = eps.items;
      } else if (eps && typeof eps === 'object') {
        serverList = Object.values(eps);
      }

      for (const item of serverList) {
        if (!item || typeof item !== 'object') continue;
        const serverName = item.server_name || item.serverName || item.server || 'default';
        const inner = Array.isArray(item.items) ? item.items : [item];
        for (const ep of inner) {
          if (!ep || typeof ep !== 'object') continue;
          episodes.push({
            serverName: String(serverName),
            name: String(ep.name ?? ep.title ?? ''),
            slug: String(ep.slug ?? ep.id ?? ''),
            embedUrl: ep.embed ?? ep.embed_url ?? ep.embedUrl ?? null,
            m3u8Url: ep.m3u8 ?? ep.m3u8_url ?? ep.m3u8Url ?? null,
          });
        }
      }
    } catch {}

    const parsed: ParsedMovie = {
      nguoncId: String(movie.id),
      slug: String(movie.slug),
      name: String(movie.name),
      originalName: movie.original_name ?? movie.originalName ?? null,
      description: movie.description ?? null,
      thumbUrl: movie.thumb_url ?? null,
      posterUrl: movie.poster_url ?? null,
      quality: movie.quality ?? null,
      language: movie.language ?? null,
      director: movie.director ?? null,
      casts: movie.casts ?? null,
      time: movie.time ?? null,
      totalEpisodes: Number(movie.total_episodes ?? movie.totalEpisodes ?? (episodes.length || 0)),
      currentEpisode: movie.current_episode ?? movie.currentEpisode ?? null,
      status: (() => {
        const ce = (movie.current_episode ?? movie.currentEpisode ?? '') as string;
        if (!ce) return null;
        if (/hoàn hoàn|hoàn tất|full/i.test(ce)) return 'completed';
        if (/full/i.test(ce)) return 'completed';
        return 'ongoing';
      })(),
      year,
      episodes,
      categories,
    };

    return parsed;
  }

  /**
   * Fetch from NguonC API by slug and parse result.
   */
  async fetchAndParse(slug: string, baseUrl = process.env.NGUONC_API_URL) {
    if (!baseUrl) throw new Error('NGUONC_API_URL not configured');
    const url = `${baseUrl}/film/${encodeURIComponent(slug)}`;
    const res = await fetch(url, { method: 'GET' });
    if (!res.ok) {
      throw new HttpException('NguonC upstream error', HttpStatus.BAD_GATEWAY);
    }
    const json = (await res.json()) as NguonCMovieRaw;
    return this.parseFromJson(json);
  }
}
