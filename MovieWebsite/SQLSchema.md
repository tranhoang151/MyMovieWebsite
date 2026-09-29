-- WARNING: This schema is for context only and is not meant to be run.
-- Table order and constraints may not be valid for execution.

CREATE TABLE public._prisma_migrations (
  id character varying NOT NULL,
  checksum character varying NOT NULL,
  finished_at timestamp with time zone,
  migration_name character varying NOT NULL,
  logs text,
  rolled_back_at timestamp with time zone,
  started_at timestamp with time zone NOT NULL DEFAULT now(),
  applied_steps_count integer NOT NULL DEFAULT 0,
  CONSTRAINT _prisma_migrations_pkey PRIMARY KEY (id)
);
CREATE TABLE public.users (
  id text NOT NULL,
  email text NOT NULL,
  password text,
  name text NOT NULL,
  avatar text,
  role USER-DEFINED NOT NULL DEFAULT 'USER'::"Role",
  isActive boolean NOT NULL DEFAULT true,
  createdAt timestamp without time zone NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updatedAt timestamp without time zone NOT NULL,
  CONSTRAINT users_pkey PRIMARY KEY (id)
);
CREATE TABLE public.movies (
  id text NOT NULL,
  nguoncId text NOT NULL,
  slug text NOT NULL,
  name text NOT NULL,
  originalName text,
  description text,
  thumbUrl text,
  posterUrl text,
  quality text,
  language text,
  director text,
  casts text,
  time text,
  totalEpisodes integer NOT NULL DEFAULT 0,
  currentEpisode text,
  status text,
  year text,
  isActive boolean NOT NULL DEFAULT true,
  nguoncCreatedAt timestamp without time zone,
  lastSyncedAt timestamp without time zone,
  createdAt timestamp without time zone NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updatedAt timestamp without time zone NOT NULL,
  CONSTRAINT movies_pkey PRIMARY KEY (id)
);
CREATE TABLE public.episodes (
  id text NOT NULL,
  movieId text NOT NULL,
  serverName text NOT NULL,
  name text NOT NULL,
  slug text NOT NULL,
  embedUrl text,
  m3u8Url text,
  sortOrder integer NOT NULL DEFAULT 0,
  CONSTRAINT episodes_pkey PRIMARY KEY (id),
  CONSTRAINT episodes_movieId_fkey FOREIGN KEY (movieId) REFERENCES public.movies(id)
);
CREATE TABLE public.categories (
  id text NOT NULL,
  nguoncId text NOT NULL,
  slug text NOT NULL,
  name text NOT NULL,
  group text NOT NULL,
  CONSTRAINT categories_pkey PRIMARY KEY (id)
);
CREATE TABLE public.categories_on_movies (
  movieId text NOT NULL,
  categoryId text NOT NULL,
  CONSTRAINT categories_on_movies_pkey PRIMARY KEY (movieId, categoryId),
  CONSTRAINT categories_on_movies_movieId_fkey FOREIGN KEY (movieId) REFERENCES public.movies(id),
  CONSTRAINT categories_on_movies_categoryId_fkey FOREIGN KEY (categoryId) REFERENCES public.categories(id)
);
CREATE TABLE public.watchlist (
  id text NOT NULL,
  userId text NOT NULL,
  movieId text NOT NULL,
  addedAt timestamp without time zone NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT watchlist_pkey PRIMARY KEY (id),
  CONSTRAINT watchlist_userId_fkey FOREIGN KEY (userId) REFERENCES public.users(id),
  CONSTRAINT watchlist_movieId_fkey FOREIGN KEY (movieId) REFERENCES public.movies(id)
);
CREATE TABLE public.watch_history (
  id text NOT NULL,
  userId text NOT NULL,
  movieId text NOT NULL,
  episodeId text NOT NULL,
  episodeSlug text NOT NULL,
  serverName text NOT NULL,
  progressSec integer NOT NULL DEFAULT 0,
  watchedAt timestamp without time zone NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updatedAt timestamp without time zone NOT NULL,
  CONSTRAINT watch_history_pkey PRIMARY KEY (id),
  CONSTRAINT watch_history_userId_fkey FOREIGN KEY (userId) REFERENCES public.users(id),
  CONSTRAINT watch_history_movieId_fkey FOREIGN KEY (movieId) REFERENCES public.movies(id),
  CONSTRAINT watch_history_episodeId_fkey FOREIGN KEY (episodeId) REFERENCES public.episodes(id)
);