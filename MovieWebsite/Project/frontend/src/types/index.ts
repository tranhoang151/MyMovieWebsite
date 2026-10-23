export interface User {
  id: string;
  email: string;
  name: string;
  role: 'USER' | 'ADMIN';
  avatar?: string;
  isActive?: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Movie {
  id: string;
  nguoncId: string;
  slug: string;
  name: string;
  originalName?: string;
  description?: string;
  thumbUrl?: string;
  posterUrl?: string;
  quality?: string | null;
  language?: string | null;
  director?: string;
  casts?: string;
  time?: string;
  totalEpisodes: number;
  currentEpisode?: string;
  status?: string;
  year?: string | null;
  views?: number;
  isActive: boolean;
  nguoncCreatedAt?: string;
  lastSyncedAt?: string;
  createdAt: string;
  updatedAt: string;
  episodes?: Episode[];
  categories?: { category: Category }[] | Category[];
}

export interface Episode {
  id: string;
  movieId: string;
  serverName: string;
  name: string;
  slug: string;
  embedUrl?: string;
  m3u8Url?: string;
  sortOrder: number;
  views?: number;
}

export interface Category {
  id: string;
  nguoncId: string;
  slug: string;
  name: string;
  group: string;
}

export interface Watchlist {
  id: string;
  userId: string;
  movieId: string;
  addedAt: string;
  movie?: Movie;
}

export interface WatchHistory {
  id: string;
  userId: string;
  movieId: string;
  episodeId?: string;
  episodeSlug: string;
  serverName: string;
  progressSec: number;
  watchedAt: string;
  updatedAt: string;
  movie?: Movie;
  episode?: Episode;
}

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}

export interface PaginatedResponse<T> {
  success: boolean;
  data: {
    items: T[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
  message?: string;
}
