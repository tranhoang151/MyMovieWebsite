import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { ParsedMovie, NguonCMovieRaw, ParsedCategory, ParsedEpisode } from './nguonc.types';

function slugify(text: string): string {
  if (!text) return '';
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[đĐ]/g, 'd')
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');
}

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

    // Categories: NguonC structure:
    // { "1": { group: { id: "...", name: "Định dạng" }, list: [{ id: "...", name: "Phim lẻ" }] }, ... }
    const categories: ParsedCategory[] = [];
    const categoriesRaw = movie.category || {};
    const categoriesValues = Object.values(categoriesRaw) as any[];

    for (const c of categoriesValues) {
      if (!c) continue;
      const groupName = (typeof c.group === 'object' ? c.group?.name : c.group) || '';

      if (Array.isArray(c.list)) {
        for (const item of c.list) {
          if (!item) continue;
          const name = String(item.name || '').trim();
          if (!name) continue;
          const slug = String(item.slug || slugify(name)).trim();
          categories.push({
            nguoncId: String(item.id || item.nguoncId || slug),
            slug,
            name,
            group: String(groupName).trim(),
          });
        }
      } else if (c.name) {
        const name = String(c.name).trim();
        const slug = String(c.slug || slugify(name)).trim();
        categories.push({
          nguoncId: String(c.id || c.nguoncId || slug),
          slug,
          name,
          group: String(groupName).trim(),
        });
      }
    }

    // Determine year from categories group if present, or fallback to movie.year
    const yearCat = categories.find((c) => /năm/i.test(c.group || ''));
    const year = yearCat ? yearCat.name : (movie.year ? String(movie.year) : null);

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

    // Calculate totalEpisodes accurately
    const rawTotal = Number(movie.total_episodes ?? movie.totalEpisodes);
    let totalEpisodes = isNaN(rawTotal) ? 0 : rawTotal;
    const isSingle =
      categories.some((c) => c.slug === 'phim-le' || /phim lẻ/i.test(c.name)) ||
      /full/i.test(movie.current_episode ?? movie.currentEpisode ?? '') ||
      totalEpisodes === 1 ||
      totalEpisodes === -1;

    if (isSingle && (totalEpisodes <= 0 || totalEpisodes === -1)) {
      totalEpisodes = 1;
    } else if (totalEpisodes <= 0 && episodes.length > 0) {
      totalEpisodes = episodes.length;
    }

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
      totalEpisodes,
      currentEpisode: movie.current_episode ?? movie.currentEpisode ?? null,
      status: (() => {
        const ce = (movie.current_episode ?? movie.currentEpisode ?? '') as string;
        if (!ce) return null;
        if (/hoàn hoàn|hoàn tất|full/i.test(ce)) return 'completed';
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
