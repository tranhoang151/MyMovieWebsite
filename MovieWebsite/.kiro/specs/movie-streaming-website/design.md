# Design Document

## Overview

Website xem phim trực tuyến là ứng dụng web full-stack theo kiến trúc client-server tách biệt. Frontend **Next.js 14+ App Router** giao tiếp với Backend **NestJS** qua REST API. Dữ liệu phim được lấy từ NguonC API bên ngoài, parse và lưu vào PostgreSQL nội bộ. Redis (Upstash) đảm nhận caching để giảm tải database và tăng tốc độ phản hồi. BullMQ xử lý các tác vụ nền như tự động đồng bộ tập mới **mỗi 30 phút**.

Hệ thống hỗ trợ hai vai trò: **User** (xem phim, quản lý tủ phim, lịch sử xem) và **Admin** (quản lý nội dung, người dùng, đồng bộ phim từ NguonC). Xác thực dùng **JWT + Passport.js** stateless với accessToken ngắn hạn (15 phút) và refreshToken dài hạn (7 ngày) kèm **token rotation** (mỗi lần refresh trả về refreshToken mới, vô hiệu hóa cái cũ). Hỗ trợ đăng nhập bằng **Google OAuth 2.0**.

---

## Architecture

### Monorepo Structure

```
movie-app/
├── frontend/          # Next.js 14+ App Router + TypeScript
├── backend/           # NestJS + TypeScript
├── .github/
│   └── workflows/ci.yml
└── README.md
```

### Sơ Đồ Kiến Trúc Tổng Thể

```mermaid
graph TB
    subgraph Client["Frontend (Vercel — Next.js 14)"]
        UI[Next.js App Router]
        HLS[HLS.js Player]
        ZS[Zustand Store]
        RQ[React Query Cache]
    end

    subgraph Server["Backend (Railway/Render — NestJS)"]
        NM[NestJS Modules]
        AUTH[JwtAuthGuard + RolesGuard]
        MS[MoviesService]
        AS[AuthService]
        WS[WatchlistService]
        HS[HistoryService]
        NP[NguoncService]
        SCH[BullMQ Scheduler]
    end

    subgraph Data["Data Layer"]
        PG[(PostgreSQL - Supabase)]
        RD[(Redis - Upstash)]
    end

    subgraph External["External"]
        NGUONC[NguonC API\nphim.nguonc.com]
        CDN[HLS CDN\nm3u8 streams]
        GOOGLE[Google OAuth 2.0]
    end

    UI -->|REST API calls| NM
    NM --> AUTH
    AUTH --> MS
    AUTH --> AS
    AUTH --> WS
    AUTH --> HS
    MS --> NP
    NP -->|fetch| NGUONC
    MS -->|read/write| PG
    AS -->|read/write| PG
    WS -->|read/write| PG
    HS -->|read/write| PG
    MS -->|cache| RD
    SCH -->|queue jobs| RD
    SCH --> NP
    HLS -->|stream| CDN
    AS -->|OAuth| GOOGLE
```

### Luồng Request Chính

```mermaid
sequenceDiagram
    participant C as Client
    participant N as NestJS Controller
    participant J as JwtAuthGuard
    participant R as RolesGuard
    participant S as Service
    participant RD as Redis
    participant DB as PostgreSQL

    C->>N: HTTP Request + Bearer Token
    N->>J: Verify JWT (Passport JwtStrategy)
    J-->>N: user payload (id, role)
    N->>R: Check @Roles() decorator
    R-->>N: authorized / 403
    N->>S: call service method
    S->>RD: cache lookup
    alt Cache hit
        RD-->>S: cached data
    else Cache miss
        S->>DB: query
        DB-->>S: data
        S->>RD: set cache + TTL
    end
    S-->>N: result
    N-->>C: JSON response (TransformResponseInterceptor)
```

---

## Components and Interfaces

### Cấu Trúc Thư Mục Chi Tiết

### Frontend (`frontend/`)

```
frontend/
├── public/                       # favicon, og-image, logo
└── src/
    ├── app/                      # Next.js App Router
    │   ├── (auth)/               # Route group: login, register
    │   │   ├── login/page.tsx
    │   │   └── register/page.tsx
    │   ├── (user)/               # Route group: layout user thường
    │   │   ├── layout.tsx        # Navbar + Footer
    │   │   ├── page.tsx          # Trang chủ (hero + movie rows)
    │   │   ├── movies/page.tsx   # Danh sách phim + filter
    │   │   ├── watchlist/page.tsx
    │   │   └── profile/page.tsx
    │   ├── (admin)/              # Route group: layout admin
    │   │   ├── layout.tsx        # Sidebar admin
    │   │   ├── dashboard/page.tsx
    │   │   ├── movies/page.tsx   # Quản lý phim
    │   │   └── users/page.tsx    # Quản lý user
    │   ├── movies/
    │   │   └── [slug]/page.tsx   # Chi tiết phim
    │   └── watch/
    │       └── [slug]/
    │           └── [ep]/page.tsx # Trang xem phim + player
    ├── components/
    │   ├── ui/                   # shadcn/ui components
    │   ├── movie/
    │   │   ├── MovieCard.tsx
    │   │   ├── MovieRow.tsx
    │   │   ├── MovieGrid.tsx
    │   │   ├── MovieBanner.tsx
    │   │   ├── MovieDetail.tsx
    │   │   ├── EpisodeList.tsx
    │   │   └── MovieCardSkeleton.tsx
    │   ├── player/
    │   │   ├── VideoPlayer.tsx
    │   │   ├── PlayerControls.tsx
    │   │   ├── ServerSelector.tsx
    │   │   └── EpisodeNav.tsx
    │   ├── layout/
    │   │   ├── Navbar.tsx
    │   │   ├── Footer.tsx
    │   │   └── AdminSidebar.tsx
    │   └── admin/
    │       ├── DataTable.tsx
    │       ├── MovieForm.tsx
    │       ├── UserTable.tsx
    │       └── StatsCard.tsx
    ├── hooks/
    │   ├── useAuth.ts
    │   ├── useWatchlist.ts
    │   ├── useMovies.ts
    │   └── useWatchHistory.ts
    ├── services/
    │   └── api.ts                # Tất cả axios calls đến backend
    ├── store/
    │   ├── authStore.ts
    │   └── uiStore.ts
    ├── lib/
    │   ├── utils.ts
    │   ├── constants.ts
    │   └── cn.ts
    └── types/
        ├── movie.ts
        ├── user.ts
        ├── episode.ts
        └── api.ts
├── .env.local
├── next.config.ts
└── tailwind.config.ts
```

### Backend (`backend/`)

```
backend/
├── src/
│   ├── auth/
│   │   ├── auth.module.ts
│   │   ├── auth.controller.ts
│   │   ├── auth.service.ts
│   │   ├── jwt.strategy.ts
│   │   └── guards/
│   │       ├── jwt-auth.guard.ts
│   │       └── roles.guard.ts
│   ├── users/
│   │   ├── users.module.ts
│   │   ├── users.controller.ts
│   │   └── users.service.ts
│   ├── movies/
│   │   ├── movies.module.ts
│   │   ├── movies.controller.ts
│   │   └── movies.service.ts
│   ├── episodes/
│   │   ├── episodes.module.ts
│   │   └── episodes.service.ts
│   ├── watchlist/
│   │   ├── watchlist.module.ts
│   │   ├── watchlist.controller.ts
│   │   └── watchlist.service.ts
│   ├── history/
│   │   ├── history.module.ts
│   │   ├── history.controller.ts
│   │   └── history.service.ts
│   ├── nguonc/
│   │   ├── nguonc.module.ts
│   │   ├── nguonc.service.ts     # Fetch + map API NguonC
│   │   └── nguonc.types.ts       # TypeScript interfaces cho JSON NguonC
│   ├── scheduler/
│   │   ├── scheduler.module.ts
│   │   └── update-episodes.job.ts
│   ├── common/
│   │   ├── decorators/           # @Roles(), @CurrentUser()
│   │   ├── guards/
│   │   ├── interceptors/         # TransformResponseInterceptor
│   │   └── pipes/
│   ├── config/
│   │   ├── database.config.ts    # Prisma config từ Supabase URL
│   │   ├── redis.config.ts       # Upstash Redis config
│   │   └── jwt.config.ts
│   ├── app.module.ts
│   └── main.ts
├── prisma/
│   ├── schema.prisma
│   └── migrations/
├── .env
├── nest-cli.json
└── tsconfig.json
```

---

## Data Models

### Prisma Schema

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider  = "postgresql"
  url       = env("DATABASE_URL")       // Supabase connection string (Transaction mode)
  directUrl = env("DIRECT_URL")         // Supabase direct connection (dùng cho migrate)
}

enum Role {
  USER
  ADMIN
}

model User {
  id        String   @id @default(cuid())
  email     String   @unique
  password  String?
  name      String
  avatar    String?
  role      Role     @default(USER)
  isActive  Boolean  @default(true)
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  watchlist Watchlist[]
  history   WatchHistory[]

  @@map("users")
}
```

```prisma
model Movie {
  id             String    @id @default(cuid())
  nguoncId       String    @unique  // movie.id từ NguonC
  slug           String    @unique  // movie.slug
  name           String             // movie.name
  originalName   String?            // movie.original_name
  description    String?   @db.Text
  thumbUrl       String?
  posterUrl      String?
  quality        String?            // "HD", "FHD"
  language       String?            // "Vietsub", "Thuyết Minh"
  director       String?            // null ở phim bộ
  casts          String?            // null ở phim bộ
  time           String?            // "104 phút" hoặc null
  totalEpisodes  Int       @default(0)
  currentEpisode String?            // "Hoàn tất (24/24)" | "FULL" | "Tập 12"
  status         String?            // "ongoing" | "completed"
  year           String?            // từ category group "Năm"
  isActive       Boolean   @default(true)
  nguoncCreatedAt DateTime?
  lastSyncedAt   DateTime?
  createdAt      DateTime  @default(now())
  updatedAt      DateTime  @updatedAt

  episodes   Episode[]
  categories CategoriesOnMovies[]
  watchlist  Watchlist[]
  history    WatchHistory[]

  @@map("movies")
}

model Episode {
  id         String  @id @default(cuid())
  movieId    String
  serverName String
  name       String
  slug       String
  embedUrl   String?
  m3u8Url    String?
  sortOrder  Int     @default(0)

  movie   Movie        @relation(fields: [movieId], references: [id], onDelete: Cascade)
  history WatchHistory[]

  @@unique([movieId, serverName, slug])
  @@map("episodes")
}

model Category {
  id       String @id @default(cuid())
  nguoncId String  // id từ NguonC — NOT globally unique (khác group có thể trùng id)
  slug     String @unique
  name     String
  group    String  // "Thể loại" | "Quốc gia" | "Định dạng"

  movies CategoriesOnMovies[]

  @@unique([nguoncId, group])  // unique trong cùng 1 group, tránh collision giữa các group khác nhau
  @@map("categories")
}

model CategoriesOnMovies {
  movieId    String
  categoryId String

  movie    Movie    @relation(fields: [movieId], references: [id], onDelete: Cascade)
  category Category @relation(fields: [categoryId], references: [id])

  @@id([movieId, categoryId])
  @@map("categories_on_movies")
}

model Watchlist {
  id      String   @id @default(cuid())
  userId  String
  movieId String
  addedAt DateTime @default(now())

  user  User  @relation(fields: [userId], references: [id], onDelete: Cascade)
  movie Movie @relation(fields: [movieId], references: [id], onDelete: Cascade)

  @@unique([userId, movieId])
  @@map("watchlist")
}

model WatchHistory {
  id          String   @id @default(cuid())
  userId      String
  movieId     String
  episodeId   String   // FK → Episode.id (đảm bảo referential integrity)
  episodeSlug String   // denormalized để query nhanh — immutable sau khi tạo
  serverName  String
  progressSec Int      @default(0)
  watchedAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  user    User    @relation(fields: [userId], references: [id], onDelete: Cascade)
  movie   Movie   @relation(fields: [movieId], references: [id], onDelete: Cascade)
  episode Episode @relation(fields: [episodeId], references: [id], onDelete: Cascade)

  @@unique([userId, episodeId])  // unique per user per episode (FK-based, tránh orphan khi slug đổi)
  @@map("watch_history")
}
```

### Quan Hệ Giữa Các Model

```mermaid
erDiagram
    User ||--o{ Watchlist : "has"
    User ||--o{ WatchHistory : "has"
    Movie ||--o{ Episode : "has"
    Movie ||--o{ CategoriesOnMovies : "tagged with"
    Movie ||--o{ Watchlist : "in"
    Movie ||--o{ WatchHistory : "in"
    Category ||--o{ CategoriesOnMovies : "applied to"

    User {
        string id PK
        string email UK
        string password
        string name
        Role role
        boolean isActive
    }
    Movie {
        string id PK
        string nguoncId UK
        string slug UK
        string name
        string status
        string year
    }
    Episode {
        string id PK
        string movieId FK
        string serverName
        string slug
        string m3u8Url
        string embedUrl
    }
    Category {
        string id PK
        string nguoncId UK
        string slug UK
        string name
        string group
    }
```

---

## Thiết Kế API (API Design)

### Quy Ước Chung

- Base URL: `/api`
- Tất cả response đều bọc qua `TransformResponseInterceptor`: `{ success: boolean, data: T, message?: string }`
- Lỗi trả về: `{ success: false, error: string, details?: object }`
- Phân trang: query params `page` (default: 1) và `limit` (default: 24, max: 24)
- Auth header: `Authorization: Bearer <accessToken>`

### Auth Endpoints

| Method | Path | Auth | Mô tả |
|--------|------|------|-------|
| POST | `/api/auth/register` | Public | Đăng ký tài khoản mới |
| POST | `/api/auth/login` | Public | Đăng nhập, nhận tokens |
| POST | `/api/auth/refresh` | Public | Đổi refreshToken lấy accessToken mới |
| POST | `/api/auth/logout` | JWT | Vô hiệu hóa refreshToken |
| GET | `/api/auth/google` | Public | Bắt đầu luồng Google OAuth 2.0 |
| GET | `/api/auth/google/callback` | Public | Callback từ Google, trả về tokens |

**POST /api/auth/register**
```json
// Request body
{
  "email": "user@example.com",
  "password": "password123",
  "name": "Nguyễn Văn A"
}

// Response 201
{
  "success": true,
  "data": { "message": "Đăng ký thành công" }
}

// Response 409
{
  "success": false,
  "error": "Email đã được sử dụng"
}
```

**POST /api/auth/login**
```json
// Request body
{
  "email": "user@example.com",
  "password": "password123"
}

// Response 200
{
  "success": true,
  "data": {
    "accessToken": "eyJhbGci...",
    "refreshToken": "eyJhbGci...",
    "user": { "id": "...", "email": "...", "name": "...", "role": "USER" }
  }
}
```

**GET /api/auth/google** — Redirect đến Google OAuth consent screen

**GET /api/auth/google/callback** — Google redirect về đây sau khi user đồng ý
```json
// Response 200
{
  "success": true,
  "data": {
    "accessToken": "eyJhbGci...",
    "refreshToken": "eyJhbGci...",
    "user": { "id": "...", "email": "...", "name": "...", "role": "USER" }
  }
}
```

### Movie Endpoints (Public)

| Method | Path | Auth | Mô tả |
|--------|------|------|-------|
| GET | `/api/movies` | Public | Danh sách phim, filter + phân trang |
| GET | `/api/movies/search` | Public | Tìm kiếm theo từ khóa |
| GET | `/api/movies/:slug` | Public | Chi tiết phim + episodes |

### Movie Endpoints (Admin Only)

| Method | Path | Auth | Mô tả |
|--------|------|------|-------|
| POST | `/api/movies/sync/:slug` | ADMIN | Sync phim từ NguonC API |
| POST | `/api/movies/import` | ADMIN | Import phim từ file JSON |
| PUT | `/api/movies/:id` | ADMIN | Cập nhật metadata phim |
| DELETE | `/api/movies/:id` | ADMIN | Xóa phim |
| POST | `/api/movies/:id/sync-episodes` | ADMIN | Sync tập mới cho 1 phim |

### User Endpoints

| Method | Path | Auth | Mô tả |
|--------|------|------|-------|
| GET | `/api/users/me` | JWT | Lấy profile user hiện tại |
| PUT | `/api/users/me` | JWT | Cập nhật profile / đổi mật khẩu |
| GET | `/api/users` | ADMIN | Danh sách tất cả user (phân trang) |
| PATCH | `/api/users/:id/block` | ADMIN | Khóa / mở khóa user |
| DELETE | `/api/users/:id` | ADMIN | Xóa user |

### Watchlist Endpoints

| Method | Path | Auth | Mô tả |
|--------|------|------|-------|
| GET | `/api/watchlist` | JWT | Tủ phim của user hiện tại |
| POST | `/api/watchlist/:movieId` | JWT | Thêm phim vào tủ |
| DELETE | `/api/watchlist/:movieId` | JWT | Xóa phim khỏi tủ |

### Watch History Endpoints

| Method | Path | Auth | Mô tả |
|--------|------|------|-------|
| GET | `/api/history` | JWT | Lịch sử xem (sort: mới nhất trước) |
| POST | `/api/history` | JWT | Lưu / cập nhật tiến trình xem |
| DELETE | `/api/history/:movieId` | JWT | Xóa lịch sử của 1 phim |

### Admin Stats Endpoint

| Method | Path | Auth | Mô tả |
|--------|------|------|-------|
| GET | `/api/admin/stats` | ADMIN | Thống kê tổng quan hệ thống |

**GET /api/admin/stats**
```json
// Response 200
{
  "success": true,
  "data": {
    "totalMovies": 1250,
    "totalUsers": 3400,
    "newUsersLast7Days": 87,
    "newMoviesLast7Days": 34
  }
}
```

---

## Kiến Trúc Component Frontend

### Cây Component Chính

```
App (Next.js App Router)
├── (user)/layout.tsx  (Navbar + Footer)
│   ├── page.tsx (HomePage)
│   │   ├── HeroBanner
│   │   ├── MovieRow (Phim mới cập nhật)
│   │   ├── MovieRow (Phim bộ đang chiếu)
│   │   └── MovieRow (Theo thể loại...)
│   ├── movies/page.tsx (MoviesPage)
│   │   ├── FilterBar (thể loại, quốc gia, năm, định dạng)
│   │   ├── MovieGrid
│   │   │   └── MovieCard[]
│   │   └── Pagination
│   ├── movies/[slug]/page.tsx (MovieDetailPage)
│   │   ├── MovieDetailHero (poster, info, actions)
│   │   ├── EpisodeList (server tabs + episode buttons)
│   │   └── RelatedMovies
│   └── watch/[slug]/[ep]/page.tsx (WatchPage)
│       ├── VideoPlayer (HLS.js / iframe fallback)
│       │   ├── PlayerControls
│       │   └── ServerSelector
│       └── EpisodeNav (prev/next)
├── (auth)/login/page.tsx
├── (auth)/register/page.tsx
├── (user)/watchlist/page.tsx  (requires JWT)
├── (user)/profile/page.tsx    (requires JWT)
└── (admin)/layout.tsx (AdminSidebar)
    ├── (admin)/dashboard/page.tsx
    ├── (admin)/movies/page.tsx
    └── (admin)/users/page.tsx
```

### State Management

**Zustand stores:**
- `authStore`: `{ user, accessToken, isAuthenticated, login(), logout(), refreshToken() }`
- `uiStore`: `{ sidebarOpen, activeModal, setModal() }`

**React Query (TanStack Query):**
- `useMovies(filters)` — danh sách phim, cache 5 phút
- `useMovie(slug)` — chi tiết phim, cache 10 phút
- `useWatchlist()` — tủ phim user
- `useWatchHistory()` — lịch sử xem

### VideoPlayer Component Design

```mermaid
stateDiagram-v2
    [*] --> Loading: mount với m3u8Url
    Loading --> HLSPlaying: HLS.js load thành công
    Loading --> IframeFallback: HLS.js lỗi / m3u8 không khả dụng
    HLSPlaying --> ServerSwitching: user chọn server khác
    IframeFallback --> ServerSwitching: user chọn server khác
    ServerSwitching --> Loading: load server mới
    HLSPlaying --> ProgressSaving: mỗi 10 giây (nếu đã đăng nhập)
    ProgressSaving --> HLSPlaying: tiếp tục phát
```

---

## NguonC Parser — Logic Parse và Mapping

### Cấu Trúc JSON NguonC

NguonC API trả về JSON với cấu trúc đặc biệt: trường `category` là **object** với key số ("1","2","3","4"), không phải array. Mỗi key chứa `group` (tên nhóm) và `list[]` (danh sách items).

```typescript
// nguonc/nguonc.types.ts
export interface NguoncApiResponse {
  status: 'success' | 'error';
  movie: NguoncMovie;
}

export interface NguoncMovie {
  id: string;
  name: string;
  slug: string;
  original_name: string | null;
  thumb_url: string | null;
  poster_url: string | null;
  created: string;
  modified: string;
  description: string | null;
  total_episodes: number;
  current_episode: string | null;
  time: string | null;
  quality: string | null;
  language: string | null;
  director: string | null;
  casts: string | null;
  category: Record<string, NguoncCategoryGroup>;
  episodes: NguoncEpisodeServer[];
}

export interface NguoncCategoryGroup {
  group: { id: string; name: string };
  list: Array<{ id: string; name: string }>;
}

export interface NguoncEpisodeServer {
  server_name: string;
  items: NguoncEpisodeItem[];
}

export interface NguoncEpisodeItem {
  name: string;
  slug: string;
  embed: string;
  m3u8: string;
}
```

### Bảng Mapping NguonC → Database

| Field NguonC | Field DB | Ghi chú |
|---|---|---|
| `movie.id` | `Movie.nguoncId` | Unique ID từ NguonC |
| `movie.slug` | `Movie.slug` | URL-friendly identifier |
| `movie.name` | `Movie.name` | Tên tiếng Việt |
| `movie.original_name` | `Movie.originalName` | Tên gốc, có thể null |
| `movie.thumb_url` | `Movie.thumbUrl` | Ảnh thumbnail |
| `movie.poster_url` | `Movie.posterUrl` | Ảnh poster |
| `movie.description` | `Movie.description` | Mô tả phim |
| `movie.quality` | `Movie.quality` | "HD", "FHD" |
| `movie.language` | `Movie.language` | "Vietsub", "Thuyết Minh" |
| `movie.director` | `Movie.director` | null ở phim bộ |
| `movie.casts` | `Movie.casts` | null ở phim bộ |
| `movie.time` | `Movie.time` | "104 phút" hoặc null |
| `movie.total_episodes` | `Movie.totalEpisodes` | Tổng số tập |
| `movie.current_episode` | `Movie.currentEpisode` | "Hoàn tất (24/24)" / "FULL" |
| `movie.created` | `Movie.nguoncCreatedAt` | Ngày tạo trên NguonC |
| `movie.modified` | `Movie.lastSyncedAt` | Ngày sửa đổi cuối |
| `category["3"].list[0].name` | `Movie.year` | Group "Năm" → lưu thẳng |
| `category[key]` (group ≠ "Năm") | `Category` (upsert) | Định dạng + Thể loại + Quốc gia |
| `episodes[].server_name` | `Episode.serverName` | Tên server |
| `episodes[].items[].name` | `Episode.name` | "1", "2", "FULL" |
| `episodes[].items[].slug` | `Episode.slug` | "tap-1", "tap-full" |
| `episodes[].items[].embed` | `Episode.embedUrl` | iframe URL |
| `episodes[].items[].m3u8` | `Episode.m3u8Url` | HLS stream URL |

### Logic Parse Chi Tiết

```typescript
// nguonc/nguonc.service.ts
async parseAndSave(nguoncData: NguoncMovie): Promise<Movie> {
  // 1. Xác định status từ current_episode
  const status = this.determineStatus(nguoncData.current_episode);

  // 2. Parse categories — dùng Object.values() vì category là object
  const categoryGroups = Object.values(nguoncData.category);
  let year: string | null = null;
  const categoryIds: string[] = [];

  for (const group of categoryGroups) {
    if (group.group.name === 'Năm') {
      year = group.list[0]?.name ?? null;
      continue; // Năm không lưu vào bảng Category
    }
    for (const item of group.list) {
      const category = await this.prisma.category.upsert({
        where: { nguoncId: item.id },
        create: {
          nguoncId: item.id,
          name: item.name,
          group: group.group.name,
          slug: slugify(item.name, { locale: 'vi' }),
        },
        update: { name: item.name },
      });
      categoryIds.push(category.id);
    }
  }

  // 3. Upsert Movie
  const movie = await this.prisma.movie.upsert({
    where: { nguoncId: nguoncData.id },
    create: { /* all fields */ },
    update: { /* all fields */ },
  });

  // 4. Upsert Episodes — chỉ thêm mới, không xóa cũ
  let sortOrder = 0;
  for (const server of nguoncData.episodes) {
    for (const item of server.items) {
      await this.prisma.episode.upsert({
        where: {
          movieId_serverName_slug: {
            movieId: movie.id,
            serverName: server.server_name,
            slug: item.slug,
          },
        },
        create: {
          movieId: movie.id,
          serverName: server.server_name,
          name: item.name,
          slug: item.slug,
          embedUrl: item.embed,
          m3u8Url: item.m3u8,
          sortOrder: sortOrder++,
        },
        update: { embedUrl: item.embed, m3u8Url: item.m3u8 },
      });
    }
  }

  return movie;
}

determineStatus(currentEpisode: string | null): string {
  if (!currentEpisode) return 'ongoing';
  if (currentEpisode.includes('Hoàn tất') || currentEpisode === 'FULL') {
    return 'completed';
  }
  return 'ongoing';
}
```

### Luồng Sync Phim

```mermaid
flowchart TD
    A[Admin gọi POST /api/movies/sync/:slug] --> B{Slug hợp lệ?}
    B -- Không --> C[400 Bad Request]
    B -- Có --> D[Gọi NguonC API]
    D --> E{status = success?}
    E -- Không --> F[502 Bad Gateway]
    E -- Có --> G[Parse JSON response]
    G --> H[Object.values category]
    H --> I[Trích xuất year từ group Năm]
    I --> J[Upsert Categories]
    J --> K[Upsert Movie]
    K --> L[Upsert Episodes - chỉ thêm mới]
    L --> M[Xóa cache movie:slug và movies:*]
    M --> N[200 OK - trả về kết quả]
```

---

## Chiến Lược Caching (Caching Strategy)

### Redis Key Patterns và TTL

| Dữ liệu | Redis Key Pattern | TTL | Invalidation |
|---|---|---|---|
| Chi tiết phim | `movie:{slug}` | 10 phút | Khi sync/update/delete phim |
| Danh sách phim | `movies:page:{n}:limit:{l}:filter:{hash}` | 5 phút | Khi sync/update/delete bất kỳ phim |
| Kết quả tìm kiếm | `search:{encodedQuery}` | 2 phút | Tự hết hạn |
| Raw response NguonC | `nguonc:raw:{slug}` | 15 phút | Tự hết hạn |
| Watchlist user | `watchlist:{userId}` | 2 phút | Khi add/remove watchlist |
| Lịch sử xem | `history:{userId}` | 1 phút | Khi save/delete history |

### Kết Nối Upstash trong NestJS

```typescript
// config/redis.config.ts
// Dùng @upstash/redis thay vì ioredis (Upstash dùng REST API)
import { Redis } from '@upstash/redis';

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
});
```

> **Lưu ý:** Upstash dùng REST API thay TCP socket, nên dùng `@upstash/redis` package. BullMQ vẫn dùng `ioredis` trỏ vào `REDIS_URL` (rediss://).

### Cache-Aside Pattern

```mermaid
flowchart LR
    A[Request] --> B{Cache hit?}
    B -- Có --> C[Return cached data]
    B -- Không --> D[Query DB]
    D --> E[Store in cache]
    E --> F[Return data]
```

---

## Thiết Kế Scheduler (Scheduler Design)

### BullMQ Job Flow — Cập Nhật Tập Mới Mỗi 30 Phút

```mermaid
flowchart TD
    CRON[Cron: mỗi 30 phút] --> Q[BullMQ Queue: update-episodes]
    Q --> W[Worker: UpdateEpisodesJob]
    W --> DB1[Query DB: phim bộ chưa hoàn tất]
    DB1 --> LOOP{Còn phim?}
    LOOP -- Có --> FETCH[Gọi NguonC API slug]
    FETCH --> OK{API OK?}
    OK -- Có --> PARSE[Parse + upsert episodes]
    PARSE --> CACHE[Invalidate cache]
    CACHE --> LOG1[Log: phim X - thêm N tập]
    LOG1 --> LOOP
    OK -- Không --> LOG2[Log error: phim X - API lỗi]
    LOG2 --> LOOP
    LOOP -- Hết --> SUMMARY[Log summary: X phim, Y tập mới, Z lỗi]
```

### Scheduler Implementation (NestJS)

```typescript
// scheduler/update-episodes.job.ts
import { Processor, Process } from '@nestjs/bull';
import { Cron } from '@nestjs/schedule';

@Processor('update-episodes')
export class UpdateEpisodesJob {
  constructor(
    private readonly prisma: PrismaService,
    private readonly nguoncService: NguoncService,
    private readonly cacheService: CacheService,
  ) {}

  @Cron('0 */30 * * * *')  // Mỗi 30 phút
  async handle() {
    const ongoingMovies = await this.prisma.movie.findMany({
      where: { status: 'ongoing', isActive: true },
      select: { id: true, slug: true },
    });

    const results = { checked: 0, updated: 0, errors: 0 };

    for (const movie of ongoingMovies) {
      try {
        const added = await this.nguoncService.syncEpisodes(movie.slug);
        results.checked++;
        if (added > 0) {
          results.updated++;
          await this.cacheService.invalidateMovie(movie.slug);
        }
      } catch (err) {
        results.errors++;
        // Tiếp tục với phim tiếp theo, không dừng toàn bộ job
      }
    }
  }
}
```

---

## Thiết Kế Bảo Mật (Security Design)

### JWT + Passport.js Authentication Flow

```mermaid
sequenceDiagram
    participant C as Client
    participant A as AuthController
    participant P as PassportStrategy
    participant DB as Database
    participant RD as Redis

    C->>A: POST /auth/login {email, password}
    A->>DB: Find user by email
    DB-->>A: user record
    A->>A: bcrypt.compare(password, hash)
    A->>A: sign accessToken (15m) + refreshToken (7d)
    A->>RD: store refreshToken hash (TTL 7d)
    A-->>C: { accessToken, refreshToken }

    Note over C,A: Sau 15 phút, accessToken hết hạn

    C->>A: POST /auth/refresh {refreshToken}
    A->>RD: verify refreshToken exists
    RD-->>A: valid
    A->>A: sign new accessToken + new refreshToken (token rotation)
    A->>RD: delete old refreshToken hash, store new refreshToken hash (TTL 7d)
    A-->>C: { accessToken, refreshToken }  // refreshToken cũ không còn hợp lệ

    Note over C,A: Google OAuth

    C->>A: GET /auth/google
    A->>P: GoogleStrategy redirect
    P-->>C: Google consent screen
    C->>A: GET /auth/google/callback (code)
    A->>P: passport-google-oauth20 verify
    P-->>A: Google profile
    A->>DB: upsert user (email, name, avatar)
    A-->>C: { accessToken, refreshToken }
```

### RBAC với NestJS Decorators

```typescript
// common/decorators/roles.decorator.ts
import { SetMetadata } from '@nestjs/common';
export const Roles = (...roles: string[]) => SetMetadata('roles', roles);

// common/decorators/current-user.decorator.ts
import { createParamDecorator, ExecutionContext } from '@nestjs/common';
export const CurrentUser = createParamDecorator(
  (data: unknown, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    return request.user;
  },
);

// Sử dụng trong controller
@Roles('ADMIN')
@UseGuards(JwtAuthGuard, RolesGuard)
@Post('sync/:slug')
syncMovie(@Param('slug') slug: string) { ... }

// Protected route (bất kỳ user đã đăng nhập)
@UseGuards(JwtAuthGuard)
@Get('watchlist')
getWatchlist(@CurrentUser() user: JwtPayload) { ... }
```

### Bảng Phân Quyền

| Endpoint | Public | USER | ADMIN |
|---|---|---|---|
| `GET /api/movies/*` | ✅ | ✅ | ✅ |
| `GET /api/movies/search` | ✅ | ✅ | ✅ |
| `GET /api/auth/google` | ✅ | ✅ | ✅ |
| `GET /api/users/me` | ❌ | ✅ | ✅ |
| `PUT /api/users/me` | ❌ | ✅ | ✅ |
| `/api/watchlist/*` | ❌ | ✅ | ✅ |
| `/api/history/*` | ❌ | ✅ | ✅ |
| `POST /api/movies/sync/*` | ❌ | ❌ | ✅ |
| `POST /api/movies/import` | ❌ | ❌ | ✅ |
| `PUT /api/movies/:id` | ❌ | ❌ | ✅ |
| `DELETE /api/movies/:id` | ❌ | ❌ | ✅ |
| `GET /api/users` | ❌ | ❌ | ✅ |
| `PATCH /api/users/:id/block` | ❌ | ❌ | ✅ |
| `DELETE /api/users/:id` | ❌ | ❌ | ✅ |
| `GET /api/admin/stats` | ❌ | ❌ | ✅ |

### Password Security

```typescript
// Đăng ký: hash với bcrypt cost factor 12
const hashedPassword = await bcrypt.hash(password, 12);

// Đăng nhập: so sánh
const isValid = await bcrypt.compare(inputPassword, storedHash);
```

### Rate Limiting (NestJS Throttler)

```typescript
// app.module.ts
ThrottlerModule.forRoot([
  { name: 'short', ttl: 60000, limit: 100 },  // 100 req/phút (public)
  { name: 'auth',  ttl: 60000, limit: 30 },   // 30 req/phút (auth endpoints)
])
```

---

## Video Player — Chiến Lược Phát Video

### Mặc định: HLS.js (m3u8)

```tsx
// components/player/VideoPlayer.tsx
import Hls from 'hls.js';

useEffect(() => {
  if (!episode.m3u8Url) return;

  if (Hls.isSupported()) {
    const hls = new Hls();
    hls.loadSource(episode.m3u8Url);
    hls.attachMedia(videoRef.current);
  } else if (videoRef.current.canPlayType('application/vnd.apple.mpegurl')) {
    // Safari native HLS
    videoRef.current.src = episode.m3u8Url;
  }
}, [episode.m3u8Url]);
```

### Fallback: Embed iframe

```tsx
// Dùng khi m3u8Url không có hoặc lỗi
if (!episode.m3u8Url) {
  return (
    <iframe
      src={episode.embedUrl}
      allowFullScreen
      className="w-full aspect-video rounded-lg"
    />
  );
}
```

### Lưu Watch Progress — Mỗi 10 Giây

```tsx
// Cứ mỗi 10 giây lưu tiến trình xem
useEffect(() => {
  const interval = setInterval(() => {
    if (!videoRef.current?.paused) {
      api.post('/history', {
        movieId,
        episodeSlug: episode.slug,
        serverName: episode.serverName,
        progressSec: Math.floor(videoRef.current.currentTime),
      });
    }
  }, 10000); // 10 giây
  return () => clearInterval(interval);
}, [episode]);
```

---

## UI Design System — Netflix Style

> Toàn bộ frontend phải tuân thủ design system này.

### Color Palette

```css
/* globals.css */
:root {
  /* Backgrounds */
  --bg-primary:     #141414;   /* Nền chính toàn trang */
  --bg-secondary:   #1f1f1f;   /* Card, modal, sidebar */
  --bg-elevated:    #2d2d2d;   /* Hover state, dropdown */
  --bg-overlay:     rgba(0, 0, 0, 0.7); /* Overlay trên banner */

  /* Brand */
  --brand-red:      #E50914;   /* Netflix red — CTA chính */
  --brand-red-hover:#F40612;

  /* Text */
  --text-primary:   #FFFFFF;
  --text-secondary: #B3B3B3;
  --text-muted:     #6b7280;

  /* Border */
  --border:         rgba(255,255,255,0.1);

  /* Status */
  --success:        #46D369;   /* Badge "Hoàn tất" */
  --warning:        #FFA500;   /* Badge "Đang chiếu" */
}
```

### Typography

```typescript
// tailwind.config.ts
fontFamily: {
  sans: ['Outfit', 'Helvetica Neue', 'Arial', 'sans-serif'],
  // @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;700&display=swap')
}
```

| Element | Size | Weight | Color |
|---|---|---|---|
| Hero title | 3rem–5rem (responsive) | 700 | `--text-primary` |
| Section heading | 1.25rem | 600 | `--text-primary` |
| Movie card title | 0.875rem | 500 | `--text-primary` |
| Body / description | 1rem | 400 | `--text-secondary` |
| Badge / label | 0.75rem | 500 | varies |
| Nav link | 0.875rem | 400 | `--text-secondary` / white on hover |

### Component Specs

#### Navbar
```
- Background: transparent khi ở top, chuyển #141414 khi scroll xuống (transition: background 0.3s)
- Logo: bên trái, màu đỏ #E50914, font bold
- Nav links: Trang chủ | TV Shows | Phim lẻ | Phim bộ | Thể loại ▾ | Quốc gia ▾
- Bên phải: Search icon | Thông báo icon | Avatar user (dropdown: Profile, Tủ phim, Đăng xuất)
- Height: 68px
- Padding: 0 4% (responsive)
- Position: fixed top-0, z-index: 50
```

#### Hero Banner (trang chủ)
```
- Full viewport width, height: 56vw (min 400px, max 700px)
- Background: poster/thumb phim nổi bật + gradient overlay từ bottom
- Gradient: linear-gradient(to top, #141414 0%, transparent 60%, transparent 100%)
  + linear-gradient(to right, rgba(0,0,0,0.8) 40%, transparent 100%)
- Nội dung (căn trái, padding-left: 4%):
    - Logo phim hoặc tên phim (font 3–5rem, bold)
    - Mô tả ngắn (tối đa 3 dòng, màu secondary)
    - 2 nút: [▶ Xem ngay] (đỏ, text trắng) + [ℹ Thêm thông tin] (xám đục)
    - Badge: chất lượng (HD), ngôn ngữ (Vietsub), năm
- Auto-rotate mỗi 6 giây nếu có nhiều phim nổi bật
```

#### Movie Row (hàng phim)
```
- Tiêu đề hàng: góc trên trái, font 1.25rem, bold trắng
  → kèm link "Xem tất cả >" màu xanh lá (#46D369) ở hover
- Scroll ngang (Swiper.js), không hiện scrollbar
- Mỗi card: width ~200px, aspect-ratio 2/3 (poster) hoặc 16/9 (thumbnail)
- Spacing giữa cards: 8px
- Padding ngoài: 4% (trái phải)
- Không có nút prev/next khi idle, hiện khi hover vào row
```

#### Movie Card
```
- Default state:
    - Ảnh thumbnail full card, border-radius: 4px
    - Không có text overlay
- Hover state (transform: scale(1.08), z-index tăng, transition 0.3s):
    - Ảnh phóng to
    - Overlay gradient từ bottom: rgba(0,0,0,0.9)
    - Hiện: tên phim, số tập, chất lượng, năm
    - 2 icon button: [▶ Xem] [+ Tủ phim]
    - Badge status: "HD" | "Vietsub" | "Hoàn tất" | "Tập X"
- Border-radius: 4px
- Cursor: pointer
```

#### Trang chi tiết phim (`/movies/[slug]`)
```
- Header: ảnh poster full width + gradient overlay (tương tự hero)
- Thông tin dưới header (2 cột):
    - Trái (60%): tên phim, originalName (in nghiêng), mô tả, nút Xem ngay
    - Phải (40%): metadata grid (Trạng thái, Số tập, Chất lượng, Ngôn ngữ,
                                  Thể loại, Quốc gia, Năm, Đạo diễn, Diễn viên)
- Bên dưới: EpisodeList component
    - Server tabs: [Vietsub #1] [Vietsub #2] [Thuyết minh #1]
    - Lưới các tập: nút số tập 1-24, highlight tập đang xem màu đỏ
- Bên dưới nữa: Phim liên quan (MovieRow)
```

#### Trang xem phim (`/watch/[slug]/[ep]`)
```
- Layout: full screen dark
- Video player: width 100%, max-width 1280px, margin auto, aspect-ratio 16/9
- Dưới player: tên phim + tập đang xem
- ServerSelector: tab chọn server
- EpisodeNav: [← Tập trước] [Tập tiếp theo →]
- EpisodeList thu gọn bên dưới (có thể toggle show/hide)
- Không có Navbar/Footer — chỉ có nút back (←) góc trên trái
```

#### Trang đăng nhập / đăng ký
```
- Background: ảnh blur + overlay tối rgba(0,0,0,0.6)
- Form: card trắng mờ (rgba(0,0,0,0.75)) width 450px, centered
- Logo đỏ ở top-left
- Input fields: dark bg (#333), text trắng, border: none, border-radius: 4px
- Nút submit: màu đỏ #E50914, full width, border-radius: 4px
- Nút "Đăng nhập với Google": nền trắng, icon Google, full width
- Link chuyển giữa login/register
```

#### Admin Panel
```
- Layout: sidebar trái (240px) + content phải
- Sidebar: background #1f1f1f, logo + nav links với icon
- Màu accent admin: giữ nguyên đỏ #E50914 cho active state
- Bảng dữ liệu: dark theme, dùng shadcn DataTable
- Stats cards: nền #2d2d2d, số to, icon Tabler
- Dashboard hiển thị: tổng phim, tổng user, user mới 7 ngày, phim mới 7 ngày
```

### Animation & Transition

```css
/* Áp dụng nhất quán toàn bộ app */
--transition-fast:   0.15s ease;
--transition-normal: 0.3s ease;
--transition-slow:   0.5s ease;

/* Movie card hover */
.movie-card { transition: transform var(--transition-normal); }
.movie-card:hover { transform: scale(1.08); }

/* Navbar background */
.navbar { transition: background-color var(--transition-slow); }

/* Page transition (Framer Motion) */
/* Dùng AnimatePresence + motion.div với opacity: 0→1, y: 20→0 */
```

### Responsive Breakpoints

| Breakpoint | Movie card per row | Hero height |
|---|---|---|
| Mobile < 640px | 2 cards | 70vw |
| Tablet 640–1024px | 3–4 cards | 60vw |
| Desktop > 1024px | 5–6 cards | 56vw |

### Tailwind Config

```typescript
// tailwind.config.ts
export default {
  darkMode: 'class',  // Luôn ở dark mode
  theme: {
    extend: {
      colors: {
        'netflix-red':   '#E50914',
        'netflix-dark':  '#141414',
        'netflix-card':  '#1f1f1f',
        'netflix-hover': '#2d2d2d',
        'netflix-green': '#46D369',
      },
      fontFamily: {
        sans: ['Outfit', 'sans-serif'],
      },
      aspectRatio: {
        'movie-poster': '2/3',
        'movie-thumb':  '16/9',
      },
    },
  },
  plugins: [require('@tailwindcss/line-clamp')],
}
```

---

## Biến Môi Trường

### Frontend (`.env.local`)

```env
NEXT_PUBLIC_API_URL=http://localhost:3001
NEXT_PUBLIC_APP_NAME=CineStream
NEXTAUTH_SECRET=your_nextauth_secret
NEXTAUTH_URL=http://localhost:3000
```

### Backend (`.env`)

```env
# Supabase PostgreSQL
DATABASE_URL="postgresql://postgres.[project-ref]:[password]@aws-0-[region].pooler.supabase.com:6543/postgres?pgbouncer=true"
DIRECT_URL="postgresql://postgres.[project-ref]:[password]@aws-0-[region].pooler.supabase.com:5432/postgres"

# Upstash Redis
UPSTASH_REDIS_REST_URL="https://[your-instance].upstash.io"
UPSTASH_REDIS_REST_TOKEN="your_upstash_token"
REDIS_URL="rediss://default:[password]@[your-instance].upstash.io:6380"

# JWT
JWT_SECRET=your_jwt_secret_min_32_chars
JWT_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d

# NguonC API
NGUONC_API_URL=https://phim.nguonc.com/api

# Supabase Storage
SUPABASE_URL=https://[project-ref].supabase.co
SUPABASE_SERVICE_KEY=your_service_role_key

PORT=3001
NODE_ENV=development
```

> **Giải thích 2 database URL của Supabase:**
> - `DATABASE_URL` (pooler port 6543): dùng cho runtime app (PgBouncer connection pooling)
> - `DIRECT_URL` (port 5432): dùng riêng cho `prisma migrate deploy` — bắt buộc phải có

---

## Error Handling

### Chuẩn Response Lỗi

```typescript
// Tất cả lỗi đều theo format:
{
  "success": false,
  "error": "Mô tả lỗi ngắn gọn",
  "details": { /* optional: field errors, stack trace (dev only) */ }
}
```

### HTTP Status Codes

| Code | Tình huống |
|---|---|
| 400 | Dữ liệu đầu vào không hợp lệ (validation error) |
| 401 | Chưa xác thực / token hết hạn |
| 403 | Không đủ quyền (RBAC) |
| 404 | Resource không tồn tại |
| 409 | Conflict (email đã tồn tại, phim đã trong watchlist) |
| 502 | NguonC API không khả dụng hoặc trả về lỗi |
| 500 | Lỗi server nội bộ |

### Global Exception Filter (NestJS)

```typescript
// common/filters/http-exception.filter.ts
@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();

    if (exception instanceof HttpException) {
      const status = exception.getStatus();
      return response.status(status).json({
        success: false,
        error: exception.message,
      });
    }

    // Log unexpected errors
    return response.status(500).json({
      success: false,
      error: 'Lỗi server nội bộ',
    });
  }
}
```

---

## Correctness Properties

*Một property là đặc tính hoặc hành vi phải đúng trong mọi lần thực thi hợp lệ của hệ thống — về cơ bản là một phát biểu hình thức về những gì hệ thống phải làm. Properties là cầu nối giữa đặc tả dạng ngôn ngữ tự nhiên và các đảm bảo đúng đắn có thể kiểm chứng tự động bằng máy.*

**Đánh giá khả năng áp dụng PBT:** Feature này bao gồm nhiều pure function (parse, validate, filter, sort) và business logic rõ ràng (upsert, cascade delete, RBAC). PBT phù hợp cho các phần logic nghiệp vụ thuần túy. Các phần UI rendering và infrastructure (Redis TTL, cron schedule) sẽ dùng integration/snapshot test thay thế.

---

### Property 1: Validation đầu vào đăng ký từ chối mọi input không hợp lệ

*Với bất kỳ* chuỗi email không đúng định dạng (thiếu `@`, thiếu domain, có khoảng trắng) hoặc password có độ dài nhỏ hơn 8 ký tự, hàm validation SHALL từ chối input và trả về danh sách lỗi tương ứng.

**Validates: Requirements 1.3**

---

### Property 2: Đăng nhập thành công trả về JWT hợp lệ

*Với bất kỳ* user đã đăng ký hợp lệ trong hệ thống, khi đăng nhập với đúng email và password, AuthService SHALL trả về accessToken và refreshToken đều là JWT hợp lệ có thể decode được.

**Validates: Requirements 1.4**

---

### Property 3: RefreshToken round-trip tạo accessToken mới

*Với bất kỳ* user đã đăng nhập, sử dụng refreshToken của họ để gọi endpoint refresh SHALL trả về accessToken mới hợp lệ (khác với accessToken cũ).

**Validates: Requirements 1.6**

---

### Property 4: Đăng xuất vô hiệu hóa refreshToken

*Với bất kỳ* user đã đăng nhập, sau khi đăng xuất, refreshToken của họ SHALL bị từ chối khi dùng để refresh — không thể lấy accessToken mới.

**Validates: Requirements 1.8**

---

### Property 5: Phân trang không bao giờ vượt quá giới hạn

*Với bất kỳ* yêu cầu danh sách phim với bất kỳ tổ hợp filter nào, số lượng phim trả về trong một trang SHALL không bao giờ vượt quá 24.

**Validates: Requirements 2.1**

---

### Property 6: Filter phim trả về đúng kết quả khớp tất cả điều kiện

*Với bất kỳ* tổ hợp filter (thể loại, quốc gia, năm, định dạng), tất cả phim trong kết quả trả về SHALL thỏa mãn đồng thời tất cả các filter đã áp dụng — không có phim nào trong kết quả vi phạm bất kỳ filter nào.

**Validates: Requirements 2.2**

---

### Property 7: Tìm kiếm trả về phim chứa từ khóa (case-insensitive)

*Với bất kỳ* từ khóa tìm kiếm, tất cả phim trong kết quả SHALL có `name` hoặc `originalName` chứa từ khóa đó khi so sánh không phân biệt hoa thường.

**Validates: Requirements 2.3**

---

### Property 8: Chi tiết phim chứa đầy đủ các trường bắt buộc

*Với bất kỳ* slug phim tồn tại trong Movie_DB, endpoint chi tiết phim SHALL trả về response chứa đầy đủ: `description`, `categories` (mảng không rỗng), và `servers` (mảng episodes theo server).

**Validates: Requirements 2.5**

---

### Property 9: Tiến trình xem được khôi phục chính xác (round-trip)

*Với bất kỳ* user và tập phim, sau khi lưu `progressSec = N`, khi load lại trang xem tập đó SHALL nhận được `progressSec = N` từ WatchHistory để tiếp tục từ đúng vị trí.

**Validates: Requirements 3.7**

---

### Property 10: Thêm phim vào Watchlist phản ánh trong danh sách

*Với bất kỳ* user và phim chưa có trong Watchlist, sau khi thêm vào, danh sách Watchlist của user đó SHALL chứa phim vừa thêm.

**Validates: Requirements 4.1**

---

### Property 11: Xóa phim khỏi Watchlist loại bỏ hoàn toàn

*Với bất kỳ* phim đang có trong Watchlist của user, sau khi xóa, danh sách Watchlist SHALL không còn chứa phim đó.

**Validates: Requirements 4.3**

---

### Property 12: Watchlist được sắp xếp theo thời gian thêm mới nhất

*Với bất kỳ* Watchlist có từ 2 phim trở lên, thứ tự các phim trong danh sách SHALL là giảm dần theo `addedAt` — phim thêm sau luôn xuất hiện trước phim thêm trước.

**Validates: Requirements 4.4**

---

### Property 13: Upsert lịch sử xem không tạo bản ghi trùng lặp

*Với bất kỳ* tổ hợp (userId, movieId, episodeSlug, serverName), dù lưu tiến trình bao nhiêu lần, SHALL chỉ tồn tại đúng một bản ghi trong bảng `watch_history` với giá trị `progressSec` là lần lưu gần nhất.

**Validates: Requirements 5.1**

---

### Property 14: Lịch sử xem được sắp xếp theo thời gian xem gần nhất

*Với bất kỳ* lịch sử xem có từ 2 mục trở lên, thứ tự các mục SHALL là giảm dần theo `watchedAt` — phim xem gần nhất luôn xuất hiện đầu tiên.

**Validates: Requirements 5.2**

---

### Property 15: Xóa lịch sử phim xóa tất cả tập của phim đó

*Với bất kỳ* user đã xem nhiều tập của một phim, sau khi xóa lịch sử của phim đó, SHALL không còn bất kỳ bản ghi `watch_history` nào thuộc phim đó cho user đó.

**Validates: Requirements 5.3**

---

### Property 16: Mapping NguonC → DB bảo toàn tất cả trường (round-trip)

*Với bất kỳ* JSON response hợp lệ từ NguonC API, sau khi parse → lưu vào Movie_DB → đọc lại, dữ liệu đọc được SHALL tương đương với dữ liệu gốc: tất cả trường được ánh xạ đúng, không mất dữ liệu, không sai kiểu.

**Validates: Requirements 6.2, 11.4**

---

### Property 17: Parse category phân loại đúng nhóm

*Với bất kỳ* NguonC response có trường `category`, sau khi parse bằng `Object.values()`: năm sản xuất SHALL được lưu vào `Movie.year`, và tất cả items từ các group "Định dạng", "Thể loại", "Quốc gia" SHALL được upsert vào bảng `Category` với đúng `group` tương ứng.

**Validates: Requirements 6.3, 11.1**

---

### Property 18: Sync phim idempotent — không tạo bản ghi trùng lặp

*Với bất kỳ* slug phim, việc sync cùng một slug hai lần liên tiếp SHALL chỉ tạo ra đúng một bản ghi Movie trong DB (không duplicate), và số lượng Episode không tăng thêm ở lần sync thứ hai nếu NguonC không có tập mới.

**Validates: Requirements 6.5**

---

### Property 19: Validation JSON thiếu trường bắt buộc trả về danh sách lỗi

*Với bất kỳ* JSON thiếu một hoặc nhiều trường bắt buộc (`movie.id`, `movie.slug`, `movie.name`), NguoncParser SHALL từ chối và trả về danh sách chính xác các trường bị thiếu — không lưu dữ liệu không đầy đủ vào DB.

**Validates: Requirements 7.2, 11.5**

---

### Property 20: Import phim bộ chỉ thêm tập mới, không xóa tập cũ

*Với bất kỳ* phim bộ đang chiếu có N tập hiện có, sau khi import JSON chứa N+M tập (M tập mới), DB SHALL chứa đúng N+M tập — N tập cũ được giữ nguyên và M tập mới được thêm vào.

**Validates: Requirements 7.4, 9.3**

---

### Property 21: Xác định status phim từ current_episode

*Với bất kỳ* chuỗi `current_episode`, hàm `determineStatus` SHALL trả về "completed" nếu chuỗi chứa "Hoàn tất" hoặc bằng "FULL", và "ongoing" trong mọi trường hợp còn lại (bao gồm null).

**Validates: Requirements 11.3**

---

### Property 22: Xử lý đúng các trường nullable

*Với bất kỳ* NguonC response có `director`, `casts`, hoặc `time` là null, NguoncParser SHALL parse thành công và lưu các trường đó là null trong DB — không ném lỗi, không thay thế bằng giá trị mặc định sai.

**Validates: Requirements 11.6**

---

### Property 23: RBAC từ chối mọi request không đủ quyền đến admin endpoints

*Với bất kỳ* admin endpoint (sync, import, delete movie, manage users, admin stats), request từ user có role USER SHALL nhận HTTP 403 — không có admin endpoint nào có thể truy cập được bởi USER role.

**Validates: Requirements 12.1**

---

### Property 24: JWT bảo vệ mọi endpoint cá nhân hóa

*Với bất kỳ* protected endpoint (watchlist, history, profile), request không có JWT hoặc có JWT hết hạn SHALL nhận HTTP 401 — không có protected endpoint nào trả về dữ liệu khi không xác thực.

**Validates: Requirements 12.2**

---

### Property 25: MovieCard render đầy đủ thông tin bắt buộc

*Với bất kỳ* movie object hợp lệ, component MovieCard SHALL render ra HTML chứa: ảnh thumbnail (img với src), tên phim (text), và phần tử overlay (hiển thị khi hover).

**Validates: Requirements 13.2**

---

### Property 26: Route được bảo vệ chuyển hướng về trang đăng nhập

*Với bất kỳ* protected frontend route (watchlist, profile), khi truy cập mà không có auth token trong store, ứng dụng SHALL chuyển hướng đến trang đăng nhập thay vì hiển thị nội dung.

**Validates: Requirements 13.6**

---

## Testing Strategy

### Phương Pháp Kép (Dual Testing Approach)

Dự án sử dụng hai lớp kiểm thử bổ sung cho nhau:

1. **Unit tests / Example-based tests** — kiểm tra các ví dụ cụ thể, edge cases, error conditions
2. **Property-based tests** — kiểm tra các thuộc tính phổ quát trên nhiều input ngẫu nhiên

> **Lưu ý quan trọng:** Property 1–2 (Auth validation) phải test qua **HTTP integration test** (dùng `supertest`) — KHÔNG test `authService.register()` trực tiếp. Lý do: validation xảy ra ở tầng Pipe/DTO trước khi vào service; test trực tiếp service sẽ bypass pipe và cho kết quả false positive.

### Thư Viện Kiểm Thử

| Layer | Framework | PBT Library |
|---|---|---|
| Backend (NestJS) | Vitest | `fast-check` |
| Frontend (Next.js) | Vitest + React Testing Library | `fast-check` |

### Cấu Hình Property-Based Tests

```typescript
// Mỗi property test chạy tối thiểu 100 iterations
import fc from 'fast-check';

// Ví dụ: Property 7 — Tìm kiếm case-insensitive
test('Feature: movie-streaming-website, Property 7: search returns movies containing keyword', () => {
  fc.assert(
    fc.property(
      fc.string({ minLength: 1, maxLength: 50 }),
      (keyword) => {
        const results = searchMovies(mockMovies, keyword);
        return results.every(
          (movie) =>
            movie.name.toLowerCase().includes(keyword.toLowerCase()) ||
            (movie.originalName?.toLowerCase().includes(keyword.toLowerCase()) ?? false)
        );
      }
    ),
    { numRuns: 100 }
  );
});
```

### Unit Tests — Các Trường Hợp Cụ Thể

**AuthService:**
- Đăng ký với email đã tồn tại → 409
- Đăng nhập với mật khẩu sai → 401
- Đăng nhập với tài khoản bị khóa → 403
- Admin không thể khóa/xóa Admin khác → 403
- Google OAuth tạo user mới nếu email chưa tồn tại
- Google OAuth trả về token cho user đã tồn tại

**NguoncService:**
- Parse phim lẻ (su-thuc-tinh-lang-tham.json) — kiểm tra tất cả trường
- Parse phim bộ (full-metal-panic.json) — kiểm tra 24 episodes
- Parse với `director: null`, `casts: null`, `time: null`
- Parse với NguonC API trả về status ≠ "success" → 502

**MoviesService:**
- Lấy phim với slug không tồn tại → 404
- Thêm phim đã có trong Watchlist → 409
- Xóa phim cascade xóa episodes, categories_on_movies, watchlist, history

**VideoPlayer:**
- m3u8 lỗi → tự động fallback sang iframe
- Phim có nhiều server → hiển thị ServerSelector

### Integration Tests

- Kết nối Supabase PostgreSQL thành công
- Kết nối Upstash Redis thành công
- Cache TTL đúng (5 phút cho danh sách, 10 phút cho chi tiết)
- Rate limiting hoạt động đúng ngưỡng
- BullMQ scheduler đăng ký cron job 30 phút
- HLS.js load m3u8 stream thành công
- `GET /api/admin/stats` trả về đúng 4 trường thống kê

### Smoke Tests

- Bcrypt hash mật khẩu với cost factor = 12
- Scheduler được cấu hình với interval 30 phút (`0 */30 * * * *`)
- Tất cả environment variables bắt buộc có mặt khi khởi động
- Google OAuth credentials hợp lệ

### Tag Format cho Property Tests

```
// Feature: movie-streaming-website, Property {N}: {property_text}
```

Ví dụ:
```typescript
// Feature: movie-streaming-website, Property 16: NguonC mapping round-trip preserves all fields
test('NguonC mapping round-trip', () => { ... });
```

### Thứ Tự Ưu Tiên Kiểm Thử

1. **Cao nhất:** Properties 16, 17, 18 (NguoncParser — core business logic)
2. **Cao:** Properties 5, 6, 7 (Movie listing/search — user-facing)
3. **Cao:** Properties 23, 24 (Security — RBAC và JWT)
4. **Trung bình:** Properties 10–15 (Watchlist và History)
5. **Trung bình:** Properties 1–4 (Auth validation)
6. **Thấp hơn:** Properties 25, 26 (Frontend components)
