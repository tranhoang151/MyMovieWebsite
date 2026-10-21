export const ROUTES = {
  HOME: '/',
  LOGIN: '/login',
  REGISTER: '/register',
  MOVIES: '/movies',
  MOVIE_DETAIL: '/movies',
  WATCH: '/watch',
  WATCHLIST: '/watchlist',
  PROFILE: '/profile',
  ADMIN_DASHBOARD: '/admin/dashboard',
  ADMIN_MOVIES: '/admin/movies',
  ADMIN_USERS: '/admin/users',
} as const;

export const API_ENDPOINTS = {
  AUTH: {
    REGISTER: '/auth/register',
    LOGIN: '/auth/login',
    REFRESH: '/auth/refresh',
    LOGOUT: '/auth/logout',
    GOOGLE: '/auth/google',
    GOOGLE_CALLBACK: '/auth/google/callback',
  },
  MOVIES: {
    LIST: '/movies',
    DETAIL: '/movies',
    SEARCH: '/movies/search',
    SYNC: '/admin/movies/import',
    SYNC_EPISODES: '/movies',
    DELETE: '/admin/movies',
    UPDATE: '/admin/movies',
  },
  USERS: {
    ME: '/users/me',
    UPDATE_ME: '/users/me',
    LIST: '/users',
    BLOCK: '/users',
    DELETE: '/users',
  },
  WATCHLIST: '/watchlist',
  HISTORY: '/history',
  ADMIN: {
    STATS: '/admin/stats',
  },
} as const;

export const QUERY_KEYS = {
  MOVIES: 'movies',
  MOVIE: 'movie',
  WATCHLIST: 'watchlist',
  HISTORY: 'history',
  USER: 'user',
  ADMIN_STATS: 'admin-stats',
  ADMIN_USERS: 'admin-users',
  ADMIN_MOVIES: 'admin-movies',
} as const;
