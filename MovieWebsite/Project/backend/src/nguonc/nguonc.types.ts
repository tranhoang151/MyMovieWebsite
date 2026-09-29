export interface NguonCMovieRaw {
  status: string;
  movie?: any;
  message?: string;
}

export interface NguonCCategoryRaw {
  [key: string]: any;
}

export interface ParsedCategory {
  nguoncId: string;
  slug: string;
  name: string;
  group: string;
}

export interface ParsedEpisode {
  serverName: string;
  name: string;
  slug: string;
  embedUrl?: string | null;
  m3u8Url?: string | null;
}

export interface ParsedMovie {
  nguoncId: string;
  slug: string;
  name: string;
  originalName?: string | null;
  description?: string | null;
  thumbUrl?: string | null;
  posterUrl?: string | null;
  quality?: string | null;
  language?: string | null;
  director?: string | null;
  casts?: string | null;
  time?: string | null;
  totalEpisodes?: number;
  currentEpisode?: string | null;
  status?: 'ongoing' | 'completed' | null;
  year?: string | null;
  episodes: ParsedEpisode[];
  categories: ParsedCategory[];
}
