openc# System Design: Movie Streaming Website
> Tài liệu này là nguồn sự thật duy nhất (single source of truth) cho AI Agent triển khai toàn bộ website xem phim. Bao gồm kiến trúc, tech stack, cấu trúc dự án, database schema, API, UI design system và thứ tự triển khai.

---

## 1. Tổng quan dự án

| Thuộc tính | Giá trị |
|---|---|
| Loại ứng dụng | Website xem phim trực tuyến (streaming) |
| Nguồn phim | API bên thứ ba: **NguonC.com** |
| Phân quyền | `admin` và `user` |
| Tham chiếu UI | **Netflix** (dark theme, layout, UX pattern) |
| Database cloud | **Supabase** (PostgreSQL managed) |
| Cache/Queue cloud | **Upstash** (Redis managed) |

### Tính năng theo vai trò

**User:**
- Đăng ký / đăng nhập (email + password, OAuth Google)
- Xem phim theo tập (HLS.js player, fallback iframe)
- Thêm / xoá phim khỏi tủ phim (Watchlist)
- Lịch sử xem, tiếp tục xem từ chỗ dừng
- Tìm kiếm, lọc phim theo thể loại / quốc gia / năm

**Admin:**
- Quản lý danh sách user (khoá, xoá, phân quyền)
- Thêm phim mới từ API NguonC (theo slug)
- Cập nhật tập mới cho phim bộ đang chiếu
- Xem thống kê lượt xem, user mới

---

## 2. Tech Stack

### Frontend
| Công nghệ | Vai trò |
|---|---|
| **Next.js 14+** (App Router) | Framework chính — SSR/SSG, routing, metadata SEO |
| **TypeScript** | Type safety toàn bộ codebase |
| **Tailwind CSS** | Styling utility-first |
| **shadcn/ui** | Component library (Button, Dialog, Table...) |
| **Zustand** | Global state (auth, UI state) |
| **React Query (TanStack Query)** | Server state, caching, pagination |
| **HLS.js** | Phát video từ m3u8 stream link |
| **Axios** | HTTP client gọi backend API |
| **Framer Motion** | Animation (hero banner, card hover, transition) |
| **Swiper.js** | Carousel/slider cho movie rows |

### Backend
| Công nghệ | Vai trò |
|---|---|
| **NestJS** | Framework chính — module-based architecture |
| **TypeScript** | Type safety |
| **Prisma ORM** | Database access, migration, schema |
| **PostgreSQL** | Database chính (hosted trên **Supabase**) |
| **Redis** | Cache response API, session, queue (hosted trên **Upstash**) |
| **BullMQ** | Queue và cron job (tự động cập nhật tập mới) |
| **JWT + Passport.js** | Authentication |
| **RBAC (Role Guard)** | Phân quyền admin / user |
| **Bcrypt** | Hash password |
| **Helmet + Rate Limiting** | Bảo mật HTTP headers |

### Infrastructure (không dùng Docker)
| Công nghệ | Vai trò |
|---|---|
| **Supabase** | PostgreSQL managed cloud — thay thế hoàn toàn Docker postgres |
| **Upstash** | Redis managed cloud — thay thế hoàn toàn Docker redis |
| **Vercel** | Deploy frontend |
| **Railway / Render** | Deploy backend NestJS |
| **Supabase Storage** | Lưu trữ thumbnail / poster (thay Cloudinary) |
| **GitHub Actions** | CI/CD pipeline |

### Lý do không dùng Docker
- Dev local chỉ cần chạy `npm run dev` cho frontend và backend
- PostgreSQL do Supabase quản lý hoàn toàn — kết nối qua `DATABASE_URL`
- Redis do Upstash quản lý hoàn toàn — kết nối qua `REDIS_URL`
- Không cần cài PostgreSQL hay Redis trên máy

---

## 3. Cấu trúc thư mục dự án

```
movie-app/
├── frontend/                         # Next.js App
│   ├── public/                       # favicon, og-image, logo
│   └── src/
│       ├── app/                      # App Router
│       │   ├── (auth)/               # Route group: login, register
│       │   │   ├── login/page.tsx
│       │   │   └── register/page.tsx
│       │   ├── (user)/               # Route group: layout user thường
│       │   │   ├── layout.tsx        # Navbar + Footer
│       │   │   ├── page.tsx          # Trang chủ (hero + movie rows)
│       │   │   ├── movies/page.tsx   # Danh sách phim + filter
│       │   │   ├── watchlist/page.tsx
│       │   │   └── profile/page.tsx
│       │   ├── (admin)/              # Route group: layout admin
│       │   │   ├── layout.tsx        # Sidebar admin
│       │   │   ├── dashboard/page.tsx
│       │   │   ├── movies/page.tsx   # Quản lý phim
│       │   │   └── users/page.tsx    # Quản lý user
│       │   ├── movies/
│       │   │   └── [slug]/page.tsx   # Chi tiết phim
│       │   └── watch/
│       │       └── [slug]/
│       │           └── [ep]/page.tsx # Trang xem phim + player
│       ├── components/
│       │   ├── ui/                   # shadcn components
│       │   ├── movie/
│       │   │   ├── MovieCard.tsx         # Card ảnh + hover overlay
│       │   │   ├── MovieRow.tsx          # Hàng phim có tiêu đề + swiper
│       │   │   ├── MovieGrid.tsx         # Lưới phim (trang danh sách)
│       │   │   ├── MovieBanner.tsx       # Hero banner trang chủ
│       │   │   ├── MovieDetail.tsx       # Thông tin chi tiết phim
│       │   │   ├── EpisodeList.tsx       # Danh sách tập + server selector
│       │   │   └── MovieCardSkeleton.tsx # Loading skeleton
│       │   ├── player/
│       │   │   ├── VideoPlayer.tsx       # HLS.js player custom
│       │   │   ├── PlayerControls.tsx    # Play/pause/seek/volume/fullscreen
│       │   │   ├── ServerSelector.tsx    # Chọn server (Vietsub #1, #2...)
│       │   │   └── EpisodeNav.tsx        # Tập trước / tập sau
│       │   ├── layout/
│       │   │   ├── Navbar.tsx            # Netflix-style top navbar
│       │   │   ├── Footer.tsx
│       │   │   └── AdminSidebar.tsx
│       │   └── admin/
│       │       ├── DataTable.tsx         # Bảng quản lý chung
│       │       ├── MovieForm.tsx         # Form thêm/sửa phim
│       │       ├── UserTable.tsx
│       │       └── StatsCard.tsx
│       ├── hooks/
│       │   ├── useAuth.ts
│       │   ├── useWatchlist.ts
│       │   ├── useMovies.ts
│       │   └── useWatchHistory.ts
│       ├── services/
│       │   └── api.ts                # Tất cả axios calls đến backend
│       ├── store/
│       │   ├── authStore.ts          # Zustand: user, token, login/logout
│       │   └── uiStore.ts            # Zustand: modal, sidebar state
│       ├── lib/
│       │   ├── utils.ts
│       │   ├── constants.ts          # ROUTES, API_ENDPOINTS
│       │   └── cn.ts                 # className merger
│       └── types/
│           ├── movie.ts
│           ├── user.ts
│           ├── episode.ts
│           └── api.ts                # Response wrapper types
│   ├── .env.local
│   ├── next.config.ts
│   └── tailwind.config.ts
│
├── backend/                          # NestJS App
│   ├── src/
│   │   ├── auth/
│   │   │   ├── auth.module.ts
│   │   │   ├── auth.controller.ts
│   │   │   ├── auth.service.ts
│   │   │   ├── jwt.strategy.ts
│   │   │   └── guards/
│   │   │       ├── jwt-auth.guard.ts
│   │   │       └── roles.guard.ts
│   │   ├── users/
│   │   ├── movies/
│   │   ├── episodes/
│   │   ├── watchlist/
│   │   ├── history/
│   │   ├── nguonc/
│   │   │   ├── nguonc.module.ts
│   │   │   ├── nguonc.service.ts     # Fetch + map API NguonC
│   │   │   └── nguonc.types.ts       # Typing cho JSON response NguonC
│   │   ├── scheduler/
│   │   │   ├── scheduler.module.ts
│   │   │   └── update-episodes.job.ts
│   │   ├── common/
│   │   │   ├── decorators/           # @Roles(), @CurrentUser()
│   │   │   ├── guards/
│   │   │   ├── interceptors/         # TransformResponseInterceptor
│   │   │   └── pipes/
│   │   ├── config/
│   │   │   ├── database.config.ts    # Prisma config từ Supabase URL
│   │   │   ├── redis.config.ts       # Upstash Redis config
│   │   │   └── jwt.config.ts
│   │   ├── app.module.ts
│   │   └── main.ts
│   ├── prisma/
│   │   ├── schema.prisma
│   │   └── migrations/
│   ├── .env
│   ├── nest-cli.json
│   └── tsconfig.json
│
├── .github/
│   └── workflows/
│       └── ci.yml
├── .gitignore
└── README.md
```

> **Lưu ý:** Không có `docker-compose.yml`. PostgreSQL và Redis đều dùng cloud service.

---

## 4. Database Schema (Prisma)

```prisma
// backend/prisma/schema.prisma

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
  id          String    @id @default(cuid())
  email       String    @unique
  password    String?
  name        String
  avatar      String?
  role        Role      @default(USER)
  isActive    Boolean   @default(true)
  createdAt   DateTime  @default(now())
  updatedAt   DateTime  @updatedAt

  watchlist   Watchlist[]
  history     WatchHistory[]

  @@map("users")
}

model Movie {
  id              String    @id @default(cuid())
  nguoncId        String    @unique  // map: movie.id
  slug            String    @unique  // map: movie.slug
  name            String             // map: movie.name
  originalName    String?            // map: movie.original_name
  description     String?   @db.Text // map: movie.description
  thumbUrl        String?            // map: movie.thumb_url
  posterUrl       String?            // map: movie.poster_url
  quality         String?            // map: movie.quality (HD, FHD...)
  language        String?            // map: movie.language (Vietsub, Thuyết Minh...)
  director        String?            // map: movie.director (null nếu phim bộ)
  casts           String?            // map: movie.casts (null nếu phim bộ)
  time            String?            // map: movie.time ("104 phút" hoặc null)
  totalEpisodes   Int       @default(0) // map: movie.total_episodes
  currentEpisode  String?            // map: movie.current_episode ("Hoàn tất (24/24)" | "FULL" | "Tập 12")
  status          String?            // "ongoing" | "completed" — suy ra từ current_episode
  year            String?            // map: category[3].list[0].name (group "Năm")
  isActive        Boolean   @default(true)
  nguoncCreatedAt DateTime?          // map: movie.created
  lastSyncedAt    DateTime?          // map: movie.modified
  createdAt       DateTime  @default(now())
  updatedAt       DateTime  @updatedAt

  episodes        Episode[]
  categories      CategoriesOnMovies[]
  watchlist       Watchlist[]
  history         WatchHistory[]

  @@map("movies")
}

model Episode {
  id          String  @id @default(cuid())
  movieId     String
  serverName  String
  name        String
  slug        String
  embedUrl    String?
  m3u8Url     String?
  sortOrder   Int     @default(0)

  movie       Movie   @relation(fields: [movieId], references: [id], onDelete: Cascade)

  @@unique([movieId, serverName, slug])
  @@map("episodes")
}

model Category {
  // Lưu TẤT CẢ các nhóm phân loại từ category object của NguonC:
  // group "Định dạng"  → Phim bộ, Phim lẻ, TV Shows...
  // group "Thể loại"   → Hành Động, Hình Sự, Hoạt Hình...
  // group "Quốc gia"   → Nhật Bản, Trung Quốc, Hàn Quốc...
  // group "Năm"        → KHÔNG lưu vào đây (lưu vào Movie.year)
  id        String @id @default(cuid())
  nguoncId  String @unique  // id của item trong list[] từ NguonC
  slug      String @unique  // tự generate từ name (vd: "hanh-dong")
  name      String          // vd: "Hành Động", "Nhật Bản", "Phim bộ"
  group     String          // vd: "Thể loại", "Quốc gia", "Định dạng"
  movies    CategoriesOnMovies[]

  @@map("categories")
}

model CategoriesOnMovies {
  movieId     String
  categoryId  String
  movie       Movie    @relation(fields: [movieId], references: [id], onDelete: Cascade)
  category    Category @relation(fields: [categoryId], references: [id])

  @@id([movieId, categoryId])
  @@map("categories_on_movies")
}

model Watchlist {
  id        String   @id @default(cuid())
  userId    String
  movieId   String
  addedAt   DateTime @default(now())

  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  movie     Movie    @relation(fields: [movieId], references: [id], onDelete: Cascade)

  @@unique([userId, movieId])
  @@map("watchlist")
}

model WatchHistory {
  id            String   @id @default(cuid())
  userId        String
  movieId       String
  episodeSlug   String
  serverName    String
  progressSec   Int      @default(0)
  watchedAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt

  user          User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  movie         Movie    @relation(fields: [movieId], references: [id], onDelete: Cascade)

  @@unique([userId, movieId, episodeSlug, serverName])
  @@map("watch_history")
}
```

---

## 5. Ví dụ Cấu trúc JSON của 1 phim từ NguonC API

### Response mẫu (`GET https://phim.nguonc.com/api/film/{slug}`)


- Phim bộ: (Ví dụ: https://phim.nguonc.com/phim/full-metal-panic)
```json
{
  "status": "success",
  "movie": {
    "id": "d0b4e54ddd9f0982db522becb8041071",
    "name": "Full Metal Panic!",
    "slug": "full-metal-panic",
    "original_name": "FMP, Fullmetal Panic!",
    "thumb_url": "https://phim.nguonc.com/public/images/Film/317.jpg",
    "poster_url": "https://phim.nguonc.com/public/images/Film/317.jpg",
    "created": "2023-07-18T01:24:10.000000Z",
    "modified": "2024-02-09T03:14:32.000000Z",
    "description": "Mithril, một tổ chức quân sự bí mật sử dụng công nghệ hiện đại để chống lại các hoạt động khủng bố, chỉ định một đội chuyên trách thực hiện một nhiệm vụ nhạy cảm. Dưới sự chỉ huy của sĩ quan cấp trên Melissa Mao, các trung sĩ Sousuke Sagara và Kurz Weber phải bí mật bảo vệ Kaname Chidori - một cô gái tuổi teen nắm giữ kiến ​​thức khoa học đột phá một cách vô thức và được coi là \"Người thì thầm\" - từ các cơ quan tình báo và các tổ chức khác theo đuổi khả năng của cô.",
    "total_episodes": 24,
    "current_episode": "Hoàn tất (24/24)",
    "time": null,
    "quality": "HD",
    "language": "Vietsub",
    "director": null,
    "casts": null,
    "category": {
      "1": {
        "group": {
          "id": "c4ca4238a0b923820dcc509a6f75849b",
          "name": "Định dạng"
        },
        "list": [
          {
            "id": "eccbc87e4b5ce2fe28308fd9f2a7baf3",
            "name": "Phim bộ"
          }
        ]
      },
      "2": {
        "group": {
          "id": "1679091c5a880faf6fb5e6087eb1b2dc",
          "name": "Thể loại"
        },
        "list": [
          {
            "id": "45c48cce2e2d7fbdea1afc51c7c6ad26",
            "name": "Hoạt Hình"
          }
        ]
      },
      "3": {
        "group": {
          "id": "8e296a067a37563370ded05f5a3bf3ec",
          "name": "Năm"
        },
        "list": [
          {
            "id": "43ec517d68b6edd3015b3edc9a11367b",
            "name": "2002"
          }
        ]
      },
      "4": {
        "group": {
          "id": "67c6a1e7ce56d3d6fa748ab6d9af3fd7",
          "name": "Quốc gia"
        },
        "list": [
          {
            "id": "d2ddea18f00665ce8623e36bd4e3c7c5",
            "name": "Nhật Bản"
          }
        ]
      }
    },
    "episodes": [
      {
        "server_name": "Vietsub #1",
        "items": [
          {
            "name": "1",
            "slug": "tap-1",
            "embed": "https://embed1.streamc.xyz/embed.php?hash=7ff6d2fc55b6241a23c3400aacf98528",
            "m3u8": "https://hls.streamvda.top/7ff6d2fc55b6241a23c3400aacf98528/hls.m3u8"
          },
          {
            "name": "2",
            "slug": "tap-2",
            "embed": "https://embed1.streamc.xyz/embed.php?hash=63dfb10b0ac3d7bd54bda59e909307ba",
            "m3u8": "https://hls.streamvda.top/63dfb10b0ac3d7bd54bda59e909307ba/hls.m3u8"
          },
          {
            "name": "3",
            "slug": "tap-3",
            "embed": "https://embed1.streamc.xyz/embed.php?hash=f09c5985bfffa88078a008469c3459e2",
            "m3u8": "https://hls.streamvda.top/f09c5985bfffa88078a008469c3459e2/hls.m3u8"
          },
          {
            "name": "4",
            "slug": "tap-4",
            "embed": "https://embed1.streamc.xyz/embed.php?hash=cd32aa27391bbef144c269553a118f76",
            "m3u8": "https://hls.streamvda.top/cd32aa27391bbef144c269553a118f76/hls.m3u8"
          },
          {
            "name": "5",
            "slug": "tap-5",
            "embed": "https://embed1.streamc.xyz/embed.php?hash=7cf1f39640a4d8c68210959447995842",
            "m3u8": "https://hls.streamvda.top/7cf1f39640a4d8c68210959447995842/hls.m3u8"
          },
          {
            "name": "6",
            "slug": "tap-6",
            "embed": "https://embed1.streamc.xyz/embed.php?hash=31bb4998dfbb715e81641b6a42161f6f",
            "m3u8": "https://hls.streamvda.top/31bb4998dfbb715e81641b6a42161f6f/hls.m3u8"
          },
          {
            "name": "7",
            "slug": "tap-7",
            "embed": "https://embed1.streamc.xyz/embed.php?hash=9ebbc828b01731a30451d5d660ecbff4",
            "m3u8": "https://hls.streamvda.top/9ebbc828b01731a30451d5d660ecbff4/hls.m3u8"
          },
          {
            "name": "8",
            "slug": "tap-8",
            "embed": "https://embed1.streamc.xyz/embed.php?hash=01e5e0d3d0a1cd15d974a96c6c37bf76",
            "m3u8": "https://hls.streamvda.top/01e5e0d3d0a1cd15d974a96c6c37bf76/hls.m3u8"
          },
          {
            "name": "9",
            "slug": "tap-9",
            "embed": "https://embed1.streamc.xyz/embed.php?hash=b9657c8489d432a1901b6b094de6a947",
            "m3u8": "https://hls.streamvda.top/b9657c8489d432a1901b6b094de6a947/hls.m3u8"
          },
          {
            "name": "10",
            "slug": "tap-10",
            "embed": "https://embed1.streamc.xyz/embed.php?hash=0fc2018742cdd96d99f6469fca0089b7",
            "m3u8": "https://hls.streamvda.top/0fc2018742cdd96d99f6469fca0089b7/hls.m3u8"
          },
          {
            "name": "11",
            "slug": "tap-11",
            "embed": "https://embed1.streamc.xyz/embed.php?hash=1b12abecc13188d99a7e615ca93eeb49",
            "m3u8": "https://hls.streamvda.top/1b12abecc13188d99a7e615ca93eeb49/hls.m3u8"
          },
          {
            "name": "12",
            "slug": "tap-12",
            "embed": "https://embed1.streamc.xyz/embed.php?hash=e6cb705ea21cf6fe81e7c7b541ddfdfe",
            "m3u8": "https://hls.streamvda.top/e6cb705ea21cf6fe81e7c7b541ddfdfe/hls.m3u8"
          },
          {
            "name": "13",
            "slug": "tap-13",
            "embed": "https://embed1.streamc.xyz/embed.php?hash=929c4614339f33cdab52da54205a5572",
            "m3u8": "https://hls.streamvda.top/929c4614339f33cdab52da54205a5572/hls.m3u8"
          },
          {
            "name": "14",
            "slug": "tap-14",
            "embed": "https://embed1.streamc.xyz/embed.php?hash=ca7c78a64644ef650190ce67ca32ab2d",
            "m3u8": "https://hls.streamvda.top/ca7c78a64644ef650190ce67ca32ab2d/hls.m3u8"
          },
          {
            "name": "15",
            "slug": "tap-15",
            "embed": "https://embed1.streamc.xyz/embed.php?hash=2cca0a5c2d18ff3de30214115239154f",
            "m3u8": "https://hls.streamvda.top/2cca0a5c2d18ff3de30214115239154f/hls.m3u8"
          },
          {
            "name": "16",
            "slug": "tap-16",
            "embed": "https://embed1.streamc.xyz/embed.php?hash=80377775ddb8daca48de3a03d7a050cc",
            "m3u8": "https://hls.streamvda.top/80377775ddb8daca48de3a03d7a050cc/hls.m3u8"
          },
          {
            "name": "17",
            "slug": "tap-17",
            "embed": "https://embed1.streamc.xyz/embed.php?hash=7a75203d35d74172d952b201d5afc59a",
            "m3u8": "https://hls.streamvda.top/7a75203d35d74172d952b201d5afc59a/hls.m3u8"
          },
          {
            "name": "18",
            "slug": "tap-18",
            "embed": "https://embed1.streamc.xyz/embed.php?hash=277e0eb0daa3505d8dcb349b88bd1840",
            "m3u8": "https://hls.streamvda.top/277e0eb0daa3505d8dcb349b88bd1840/hls.m3u8"
          },
          {
            "name": "19",
            "slug": "tap-19",
            "embed": "https://embed1.streamc.xyz/embed.php?hash=64695334dcb29869ff6cacacbcb3653d",
            "m3u8": "https://hls.streamvda.top/64695334dcb29869ff6cacacbcb3653d/hls.m3u8"
          },
          {
            "name": "20",
            "slug": "tap-20",
            "embed": "https://embed1.streamc.xyz/embed.php?hash=3af07cab2d560194824b543174fce511",
            "m3u8": "https://hls.streamvda.top/3af07cab2d560194824b543174fce511/hls.m3u8"
          },
          {
            "name": "21",
            "slug": "tap-21",
            "embed": "https://embed1.streamc.xyz/embed.php?hash=f214bc9f784eedc53f561827da84083c",
            "m3u8": "https://hls.streamvda.top/f214bc9f784eedc53f561827da84083c/hls.m3u8"
          },
          {
            "name": "22",
            "slug": "tap-22",
            "embed": "https://embed1.streamc.xyz/embed.php?hash=46fbfa788bea61a9b43a6cd5f80e590a",
            "m3u8": "https://hls.streamvda.top/46fbfa788bea61a9b43a6cd5f80e590a/hls.m3u8"
          },
          {
            "name": "23",
            "slug": "tap-23",
            "embed": "https://embed1.streamc.xyz/embed.php?hash=b923ff0a93ef08fd5ac931ed0a24fc21",
            "m3u8": "https://hls.streamvda.top/b923ff0a93ef08fd5ac931ed0a24fc21/hls.m3u8"
          },
          {
            "name": "24",
            "slug": "tap-24",
            "embed": "https://embed1.streamc.xyz/embed.php?hash=191de5e440d43205400373787472504d",
            "m3u8": "https://hls.streamvda.top/191de5e440d43205400373787472504d/hls.m3u8"
          }
        ]
      }
    ]
  }
}
```

- Phim lẻ: (Ví dụ: https://phim.nguonc.com/phim/su-thuc-tinh-lang-tham)
```json
{
  "status": "success",
  "movie": {
    "id": "3c8de217c75149c1f5e4efe802d4e2b6",
    "name": "Sự Thức Tỉnh Lặng Thầm",
    "slug": "su-thuc-tinh-lang-tham",
    "original_name": "Scare Out",
    "thumb_url": "https://phim.nguonc.com/public/images/Film/cPdZiwjdLel5DD7Nm99FcSsXuSr.jpg",
    "poster_url": "https://phim.nguonc.com/public/images/Film/tNfhsO5CdMRzThEx3XlkTEp808Q.jpg",
    "created": "2026-05-28T09:28:19.000000Z",
    "modified": "2026-05-28T09:32:39.000000Z",
    "description": "Tình báo quốc gia quan trọng bất ngờ bị rò rỉ, buộc nhóm an ninh quốc gia phải khẩn cấp vào cuộc, quyết tâm truy tìm kẻ phản bội đứng sau vụ việc. Thế nhưng, các chiến dịch truy bắt liên tiếp thất bại nặng nề, đẩy tình hình vào thế căng như dây đàn. Khi cuộc điều tra càng đi sâu, mọi nghi ngờ bất ngờ hướng về chính nội bộ của nhóm an ninh.",
    "total_episodes": 1,
    "current_episode": "FULL",
    "time": "104 phút",
    "quality": "HD",
    "language": "Vietsub + Thuyết Minh",
    "director": "Zhang Yimou",
    "casts": "Jackson Yee, Zhu Yilong, Song Jia",
    "category": {
      "1": {
        "group": {
          "id": "c4ca4238a0b923820dcc509a6f75849b",
          "name": "Định dạng"
        },
        "list": [
          {
            "id": "a87ff679a2f3e71d9181a67b7542122c",
            "name": "Phim lẻ"
          }
        ]
      },
      "2": {
        "group": {
          "id": "1679091c5a880faf6fb5e6087eb1b2dc",
          "name": "Thể loại"
        },
        "list": [
          {
            "id": "8f14e45fceea167a5a36dedd4bea2543",
            "name": "Hành Động"
          },
          {
            "id": "6512bd43d9caa6e02c990b0a82652dca",
            "name": "Hình Sự"
          },
          {
            "id": "b6d767d2f8ed5d21a44b0e5886680cb9",
            "name": "Gây Cấn"
          }
        ]
      },
      "3": {
        "group": {
          "id": "8e296a067a37563370ded05f5a3bf3ec",
          "name": "Năm"
        },
        "list": [
          {
            "id": "7e7757b1e12abcb736ab9a754ffb617a",
            "name": "2026"
          }
        ]
      },
      "4": {
        "group": {
          "id": "67c6a1e7ce56d3d6fa748ab6d9af3fd7",
          "name": "Quốc gia"
        },
        "list": [
          {
            "id": "c0c7c76d30bd3dcaefc96f40275bdc0a",
            "name": "Trung Quốc"
          }
        ]
      }
    },
    "episodes": [
      {
        "server_name": "Vietsub #1",
        "items": [
          {
            "name": "FULL",
            "slug": "tap-full",
            "embed": "https://embed14.streamc.xyz/embed.php?hash=4c9a3524ca3c9d47530a2d72bf2d79a9",
            "m3u8": "https://sing.phimmoi.net/4c9a3524ca3c9d47530a2d72bf2d79a9/hls.m3u8"
          }
        ]
      },
      {
        "server_name": "Thuyết minh #1",
        "items": [
          {
            "name": "Full",
            "slug": "tap-full",
            "embed": "https://embed14.streamc.xyz/embed.php?hash=38de6671fab671fa80ba7fe40eab1853",
            "m3u8": "https://sing.phimmoi.net/38de6671fab671fa80ba7fe40eab1853/hls.m3u8"
          }
        ]
      }
    ]
  }
}
```

### Mapping NguonC → Database nội bộ

> **Lưu ý quan trọng:** `category` trong JSON NguonC là **object** với key số "1","2","3","4" — **không phải array**. Mỗi key có `group.name` (tên nhóm) và `list[]` (danh sách items). Khi parse phải dùng `Object.values(movie.category)`.

| Field NguonC | Field DB | Ghi chú |
|---|---|---|
| `movie.id` | `Movie.nguoncId` | |
| `movie.slug` | `Movie.slug` | |
| `movie.name` | `Movie.name` | |
| `movie.original_name` | `Movie.originalName` | |
| `movie.thumb_url` | `Movie.thumbUrl` | |
| `movie.poster_url` | `Movie.posterUrl` | |
| `movie.description` | `Movie.description` | |
| `movie.quality` | `Movie.quality` | |
| `movie.language` | `Movie.language` | |
| `movie.director` | `Movie.director` | null ở phim bộ |
| `movie.casts` | `Movie.casts` | null ở phim bộ |
| `movie.time` | `Movie.time` | null ở phim bộ, "104 phút" ở phim lẻ |
| `movie.total_episodes` | `Movie.totalEpisodes` | |
| `movie.current_episode` | `Movie.currentEpisode` | "Hoàn tất (24/24)" / "FULL" / "Tập 12" |
| `movie.created` | `Movie.nguoncCreatedAt` | |
| `movie.modified` | `Movie.lastSyncedAt` | |
| `category["3"].list[0].name` | `Movie.year` | group "Năm" — lưu thẳng vào Movie |
| `category[key].list[i]` (group ≠ "Năm") | `Category` (upsert by nguoncId) | Định dạng + Thể loại + Quốc gia |
| `episodes[].server_name` | `Episode.serverName` | |
| `episodes[].items[].name` | `Episode.name` | "1","2",..."FULL" |
| `episodes[].items[].slug` | `Episode.slug` | "tap-1","tap-full" |
| `episodes[].items[].embed` | `Episode.embedUrl` | |
| `episodes[].items[].m3u8` | `Episode.m3u8Url` | |

### Logic parse `category` object

```typescript
// nguonc.service.ts
const categoryGroups = Object.values(movie.category); // ["1","2","3","4"] → array of groups

for (const group of categoryGroups) {
  if (group.group.name === 'Năm') {
    // Lấy năm lưu vào Movie.year
    movieData.year = group.list[0]?.name ?? null;
    continue;
  }
  // Các nhóm còn lại (Định dạng, Thể loại, Quốc gia) → upsert vào bảng Category
  for (const item of group.list) {
    await prisma.category.upsert({
      where: { nguoncId: item.id },
      create: {
        nguoncId: item.id,
        name: item.name,
        group: group.group.name,
        slug: slugify(item.name),
      },
      update: { name: item.name },
    });
  }
}
```

---

## 6. API Endpoints (Backend REST)

### Auth
```
POST   /api/auth/register         Đăng ký tài khoản mới
POST   /api/auth/login            Đăng nhập → { accessToken, refreshToken }
POST   /api/auth/refresh          Đổi refresh token → access token mới
POST   /api/auth/logout           Xoá refresh token (blacklist)
```

### Movies (public)
```
GET    /api/movies                Danh sách phim (filter: category, country, year, status; pagination)
GET    /api/movies/:slug          Chi tiết phim + toàn bộ episodes
GET    /api/movies/search?q=      Tìm kiếm theo tên
```

### Movies (admin only)
```
POST   /api/movies/sync/:slug     Sync phim từ NguonC API vào DB
PUT    /api/movies/:id            Cập nhật metadata
DELETE /api/movies/:id            Xoá phim
POST   /api/movies/:id/sync-episodes   Sync tập mới cho 1 phim
```

### Users
```
GET    /api/users/me              Profile user hiện tại
PUT    /api/users/me              Cập nhật profile, đổi password
GET    /api/users                 [ADMIN] Danh sách tất cả user
PATCH  /api/users/:id/block       [ADMIN] Khoá / mở khoá user
DELETE /api/users/:id             [ADMIN] Xoá user
```

### Watchlist
```
GET    /api/watchlist             Tủ phim của user đang đăng nhập
POST   /api/watchlist/:movieId    Thêm phim vào tủ
DELETE /api/watchlist/:movieId    Xoá phim khỏi tủ
```

### Watch History
```
GET    /api/history               Lịch sử xem (sort: mới nhất trước)
POST   /api/history               Lưu / cập nhật tiến trình xem
                                  body: { movieId, episodeSlug, serverName, progressSec }
DELETE /api/history/:movieId      Xoá lịch sử của 1 phim
```

---

## 7. Luồng phân quyền (RBAC)

```
HTTP Request
  → JwtAuthGuard   (verify JWT token, gắn user vào request)
  → RolesGuard     (kiểm tra role từ @Roles() decorator)
  → Controller Handler
```

| Route | Quyền |
|---|---|
| `GET /api/movies/*` | Public (không cần đăng nhập) |
| `GET /api/movies/search` | Public |
| `/api/watchlist/*` | Đăng nhập (USER hoặc ADMIN) |
| `/api/history/*` | Đăng nhập (USER hoặc ADMIN) |
| `GET /api/users/me` | Đăng nhập |
| `POST /api/movies/sync/*` | ADMIN only |
| `DELETE /api/movies/:id` | ADMIN only |
| `GET /api/users` | ADMIN only |
| `PATCH /api/users/:id/block` | ADMIN only |

```typescript
// Cách dùng trong controller
@Roles('ADMIN')
@UseGuards(JwtAuthGuard, RolesGuard)
@Post('sync/:slug')
syncMovie(@Param('slug') slug: string) { ... }
```

---

## 8. Cơ chế Caching (Upstash Redis)

| Dữ liệu | TTL | Redis Key |
|---|---|---|
| Chi tiết phim | 10 phút | `movie:{slug}` |
| Danh sách phim trang N | 5 phút | `movies:page:{n}:limit:{l}:filter:{hash}` |
| Kết quả tìm kiếm | 2 phút | `search:{query}` |
| Response raw từ NguonC | 15 phút | `nguonc:raw:{slug}` |

**Invalidation rule:** Khi admin sync hoặc cập nhật phim → xoá `movie:{slug}` và toàn bộ keys có prefix `movies:*`.

### Kết nối Upstash trong NestJS
```typescript
// Dùng @upstash/redis thay vì ioredis
import { Redis } from '@upstash/redis';

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL,
  token: process.env.UPSTASH_REDIS_REST_TOKEN,
});
```

> **Lưu ý:** Upstash dùng REST API thay TCP socket, nên dùng `@upstash/redis` package thay `ioredis`. BullMQ vẫn dùng `ioredis` trỏ vào Upstash Redis URL.

---

## 9. Cron Job — Cập nhật tập mới (BullMQ + Upstash)

```
Scheduler chạy mỗi 30 phút:
  1. Query DB: lấy tất cả Movie có status = "ongoing"
  2. Với mỗi phim:
     a. Gọi NguonC API: GET /api/phim/{slug}
     b. So sánh episodes trả về với episodes trong DB
     c. Nếu có slug mới → INSERT vào bảng Episode
     d. Cập nhật Movie.currentEpisode và Movie.lastSyncedAt
     e. DEL Redis cache: movie:{slug}
  3. Log kết quả (số phim cập nhật, số tập mới)
```

```typescript
// backend/src/nguonc/nguonc.types.ts — TypeScript interfaces cho JSON NguonC

interface NguoncCategoryItem {
  id: string;
  name: string;
}

interface NguoncCategoryGroup {
  group: { id: string; name: string };
  list: NguoncCategoryItem[];
}

interface NguoncEpisodeItem {
  name: string;   // "1", "2", "FULL", "Full"
  slug: string;   // "tap-1", "tap-full"
  embed: string;
  m3u8: string;
}

interface NguoncEpisodeServer {
  server_name: string;  // "Vietsub #1", "Thuyết minh #1"
  items: NguoncEpisodeItem[];
}

interface NguoncMovie {
  id: string;
  name: string;
  slug: string;
  original_name: string | null;
  thumb_url: string;
  poster_url: string;
  created: string;           // ISO datetime
  modified: string;          // ISO datetime
  description: string;
  total_episodes: number;
  current_episode: string;   // "Hoàn tất (24/24)" | "FULL" | "Tập 12"
  time: string | null;       // "104 phút" (phim lẻ) | null (phim bộ)
  quality: string;
  language: string;
  director: string | null;
  casts: string | null;
  category: Record<string, NguoncCategoryGroup>;  // object với key "1","2","3","4"
  episodes: NguoncEpisodeServer[];
}

interface NguoncApiResponse {
  status: 'success' | 'error';
  movie: NguoncMovie;
}
```

```typescript
// backend/src/scheduler/update-episodes.job.ts
@Processor('update-episodes')
export class UpdateEpisodesJob {
  @Cron('0 */30 * * * *')
  async handle() { ... }
}
```

---

## 10. Video Player — Chiến lược phát video

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

### Lưu watch progress
```tsx
// Cứ mỗi 10 giây lưu tiến trình
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
  }, 10000);
  return () => clearInterval(interval);
}, [episode]);
```

---

## 11. UI Design System — Netflix Style

> AI Agent phải tuân thủ toàn bộ design system này khi viết code frontend.

### 11.1 Color Palette

```css
/* globals.css hoặc tailwind.config.ts */
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

### 11.2 Typography

```typescript
// tailwind.config.ts
fontFamily: {
  sans: ['Netflix Sans', 'Helvetica Neue', 'Helvetica', 'Arial', 'sans-serif'],
  // Netflix Sans không public → fallback về Inter hoặc Outfit
  // Dùng: @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;700&display=swap')
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

### 11.3 Component Specs

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
- Link chuyển giữa login/register
```

#### Admin Panel
```
- Layout: sidebar trái (240px) + content phải
- Sidebar: background #1f1f1f, logo + nav links với icon
- Màu accent admin: giữ nguyên đỏ #E50914 cho active state
- Bảng dữ liệu: dark theme, dùng shadcn DataTable
- Stats cards: nền #2d2d2d, số to, icon Tabler
```

### 11.4 Animation & Transition

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

### 11.5 Responsive Breakpoints

| Breakpoint | Movie card per row | Hero height |
|---|---|---|
| Mobile < 640px | 2 cards | 70vw |
| Tablet 640–1024px | 3–4 cards | 60vw |
| Desktop > 1024px | 5–6 cards | 56vw |

```typescript
// tailwind.config.ts — giữ breakpoint mặc định của Tailwind
// sm: 640px | md: 768px | lg: 1024px | xl: 1280px | 2xl: 1536px
```

### 11.6 Tailwind Config tóm tắt

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

## 12. Biến môi trường

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

# Supabase Storage (thay Cloudinary)
SUPABASE_URL=https://[project-ref].supabase.co
SUPABASE_SERVICE_KEY=your_service_role_key

PORT=3001
NODE_ENV=development
```

> **Giải thích 2 database URL của Supabase:**
> - `DATABASE_URL` (pooler port 6543): dùng cho runtime app (PgBouncer connection pooling)
> - `DIRECT_URL` (port 5432): dùng riêng cho `prisma migrate deploy` — bắt buộc phải có

---

## 13. Setup Supabase + Upstash (thay Docker)

### Supabase
```
1. Tạo project tại supabase.com
2. Vào Settings → Database → Connection string
   → Copy "Transaction" URL → DATABASE_URL
   → Copy "Direct connection" URL → DIRECT_URL
3. Chạy migration: npx prisma migrate dev --name init
4. (Tùy chọn) Bật Supabase Storage để lưu thumbnail
```

### Upstash
```
1. Tạo database tại upstash.com (chọn region gần nhất)
2. Vào database → REST API tab:
   → Copy UPSTASH_REDIS_REST_URL
   → Copy UPSTASH_REDIS_REST_TOKEN
3. Vào Details tab:
   → Copy Redis URL (bắt đầu bằng rediss://) → REDIS_URL (dùng cho BullMQ)
4. Cài package: npm install @upstash/redis
```

---

## 14. Thứ tự triển khai cho AI Agent

```
BƯỚC 1: Setup cloud services
  → Tạo Supabase project, lấy DATABASE_URL và DIRECT_URL
  → Tạo Upstash database, lấy REDIS_URL và REST credentials
  → Tạo GitHub repo

BƯỚC 2: Khởi tạo monorepo
  → mkdir movie-app && cd movie-app
  → npx create-next-app@latest frontend --typescript --tailwind --app
  → nest new backend

BƯỚC 3: Cài dependencies
  Frontend:
    npm install axios zustand @tanstack/react-query hls.js
    npm install framer-motion swiper
    npm install @radix-ui/react-* (shadcn/ui)
    npx shadcn-ui@latest init

  Backend:
    npm install @prisma/client prisma
    npm install @nestjs/jwt @nestjs/passport passport-jwt bcrypt
    npm install @upstash/redis bullmq
    npm install helmet @nestjs/throttler
    npm install class-validator class-transformer

BƯỚC 4: Database
  → Viết prisma/schema.prisma theo schema mục 4
  → Điền DATABASE_URL và DIRECT_URL vào backend/.env
  → npx prisma migrate dev --name init
  → npx prisma generate

BƯỚC 5: Backend — Auth module
  → Viết auth.module, auth.service, auth.controller
  → Viết JwtStrategy, JwtAuthGuard, RolesGuard
  → Viết @Roles() decorator và @CurrentUser() decorator
  → Test: POST /api/auth/register và /api/auth/login

BƯỚC 6: Backend — NguonC service
  → Viết nguonc.service.ts: fetch API NguonC, map dữ liệu theo bảng mục 5
  → Viết nguonc.types.ts với đầy đủ TypeScript interface

BƯỚC 7: Backend — Movies, Episodes, Users
  → Viết movies module với CRUD + sync endpoint
  → Viết episodes module
  → Viết users module
  → Thêm Redis cache theo mục 8

BƯỚC 8: Backend — Watchlist, History, Scheduler
  → Viết watchlist module
  → Viết history module
  → Viết scheduler job (BullMQ) theo logic mục 9

BƯỚC 9: Frontend — Global setup
  → Cấu hình tailwind.config.ts theo mục 11.6
  → Thêm globals.css với CSS variables mục 11.1
  → Cấu hình Axios base URL
  → Tạo authStore (Zustand), uiStore

BƯỚC 10: Frontend — Layout components
  → Viết Navbar (fixed, transparent → dark on scroll)
  → Viết Footer
  → Viết layout cho (user) và (admin) route groups

BƯỚC 11: Frontend — Trang chủ
  → Viết MovieBanner (hero) với gradient overlay
  → Viết MovieCard với hover effect
  → Viết MovieRow với Swiper.js
  → Lắp vào page.tsx

BƯỚC 12: Frontend — Trang phim
  → Trang danh sách /movies với filter + MovieGrid
  → Trang chi tiết /movies/[slug] với EpisodeList
  → Trang xem /watch/[slug]/[ep] với VideoPlayer

BƯỚC 13: Frontend — Auth pages
  → Trang /login và /register theo spec mục 11.3
  → Kết nối với backend API, lưu token vào authStore

BƯỚC 14: Frontend — User features
  → Trang /watchlist
  → Trang /profile
  → Lưu watch progress mỗi 10 giây (mục 10)

BƯỚC 15: Frontend — Admin panel
  → Layout admin với sidebar
  → Trang dashboard (stats cards)
  → Trang quản lý phim (sync từ NguonC, sửa, xoá)
  → Trang quản lý user (khoá, phân quyền)

BƯỚC 16: Deploy
  → Deploy backend lên Railway (set tất cả env vars)
  → Deploy frontend lên Vercel (set NEXT_PUBLIC_API_URL = Railway URL)
  → Chạy prisma migrate deploy trên production
  → Test toàn bộ luồng: đăng ký → xem phim → watchlist → admin sync
```

---

## 15. Quy tắc coding cho AI Agent

1. **Luôn dùng TypeScript** — không dùng `any`, định nghĩa interface rõ ràng
2. **Mọi API call phải có error handling** — try/catch và trả về lỗi có nghĩa
3. **Mọi component phải responsive** — mobile first với Tailwind
4. **Màu sắc phải dùng CSS variables hoặc Tailwind class `netflix-*`** — không hardcode hex trực tiếp trong JSX
5. **Skeleton loading** cho mọi component fetch dữ liệu — dùng `MovieCardSkeleton`
6. **Protected routes** — middleware Next.js kiểm tra token trước khi vào (user), (admin)
7. **Prisma queries phải có `select`** — không lấy toàn bộ fields, chỉ lấy những gì cần
8. **Cache-first strategy** — luôn check Redis trước khi query Postgres

---

*Tài liệu v4.0 — Cập nhật: đồng bộ database schema và mapping table theo cấu trúc JSON thực tế của NguonC API (category là object không phải array, bỏ model Country, thêm director/casts/time/nguoncCreatedAt vào Movie, thêm field group vào Category, thêm NguonC TypeScript interfaces đầy đủ).*
