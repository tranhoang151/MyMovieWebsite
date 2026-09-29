# Implementation Plan: Movie Streaming Website

## Overview

Kế hoạch triển khai website xem phim trực tuyến theo kiến trúc monorepo với backend **NestJS + TypeScript** và frontend **Next.js 14 App Router + TypeScript**. Các task được sắp xếp theo thứ tự dependency: schema → service → API → frontend.

## Tasks

- [x] 1. Thiết lập cấu trúc Monorepo và môi trường phát triển
  - Khởi tạo thư mục gốc `movie-app/` với `package.json` workspace (npm workspaces hoặc pnpm)
  - Tạo thư mục `frontend/` và `backend/` với `tsconfig.json` riêng
  - Cấu hình `.gitignore`, `README.md` và `.github/workflows/ci.yml` cơ bản
  - Cài đặt các dev dependencies dùng chung: TypeScript, ESLint, Prettier
  - _Requirements: Kiến trúc Monorepo trong design_

- [x] 1.5 Tạo và kết nối Supabase (PostgreSQL)
  - Truy cập https://supabase.com → tạo tài khoản → **New Project**
  - Đặt tên project (vd: `movie-app`), chọn region gần nhất (Southeast Asia), đặt database password → **Create Project**
  - Sau khi project sẵn sàng, vào **Project Settings → Database → Connection String**:
    - Tab **Transaction** (port 6543) → copy URL → đặt làm `DATABASE_URL` trong `backend/.env`
    - Tab **Session** (port 5432) → copy URL → đặt làm `DIRECT_URL` trong `backend/.env`
  - Format `.env`:
    ```env
    DATABASE_URL="postgresql://postgres.[ref]:[password]@aws-0-[region].pooler.supabase.com:6543/postgres?pgbouncer=true"
    DIRECT_URL="postgresql://postgres.[ref]:[password]@aws-0-[region].pooler.supabase.com:5432/postgres"
    ```
  - **Lưu ý:** `DATABASE_URL` (port 6543, PgBouncer) dùng cho runtime app; `DIRECT_URL` (port 6543) dùng riêng cho `prisma migrate deploy` — cả 2 đều bắt buộc phải có
  - Verify: `cd backend && npx prisma db push` — không báo lỗi là kết nối thành công
  - _Dùng cho: Prisma ORM, toàn bộ data persistence_

- [x] 1.6 Tạo và kết nối Upstash (Redis)
  - Truy cập https://upstash.com → tạo tài khoản → **Create Database**
  - Đặt tên (vd: `movie-app-redis`), chọn region gần nhất, chọn **Regional** (free tier) → **Create**
  - Sau khi tạo xong, trong dashboard database:
    - Vào tab **REST API** → copy `UPSTASH_REDIS_REST_URL` và `UPSTASH_REDIS_REST_TOKEN` → dùng cho `@upstash/redis` (Cache Service)
    - Vào tab **Details** → copy **Endpoint** và **Password** → tạo `REDIS_URL` dạng `rediss://default:[password]@[endpoint]:6379` → dùng cho `ioredis` (BullMQ)
  - Format `.env`:
    ```env
    UPSTASH_REDIS_REST_URL="https://[your-instance].upstash.io"
    UPSTASH_REDIS_REST_TOKEN="your_upstash_token"
    REDIS_URL="rediss://default:[password]@[your-instance].upstash.io:6379"
    ```
  - **Lưu ý:** 2 biến `UPSTASH_REDIS_REST_*` chỉ dùng cho Cache Service (`@upstash/redis` REST client); `REDIS_URL` chỉ dùng cho BullMQ (`ioredis` TCP client) — không hoán đổi
  - Verify kết nối REST trong `backend/src/config/redis.config.ts`:
    ```typescript
    const redis = new Redis({
      url: process.env.UPSTASH_REDIS_REST_URL,
      token: process.env.UPSTASH_REDIS_REST_TOKEN,
    });
    await redis.set('ping', 'pong');
    console.log(await redis.get('ping')); // 'pong' → kết nối thành công
    ```
  - _Dùng cho: Cache Service (`@upstash/redis`) và BullMQ queue (`ioredis`)_

- [x] 2. Thiết lập Backend boilerplate NestJS và Prisma Schema
  - [x] 2.1 Khởi tạo dự án backend với NestJS + TypeScript
    - Chạy `nest new backend` để tạo dự án NestJS
    - Cài đặt: `@nestjs/common`, `@nestjs/core`, `@nestjs/platform-express`, `@nestjs/jwt`, `@nestjs/passport`, `@nestjs/throttler`, `@nestjs/bull`, `@nestjs/schedule`, `helmet`, `dotenv`
    - Tạo `backend/src/app.module.ts` với ThrottlerModule, ScheduleModule, BullModule đã cấu hình
    - Tạo `backend/src/main.ts` với global pipes, filters, interceptors và CORS
    - Tạo `backend/src/common/interceptors/transform-response.interceptor.ts` — bọc response thành `{ success, data, message }`
    - Tạo `backend/src/common/filters/http-exception.filter.ts` — chuẩn hóa lỗi thành `{ success: false, error, details }`
    - _Requirements: Kiến trúc backend trong design_

  - [x] 2.2 Định nghĩa Prisma Schema và chạy migration
    - Tạo `backend/prisma/schema.prisma` với đầy đủ các model: `User`, `Movie`, `Episode`, `Category`, `CategoriesOnMovies`, `Watchlist`, `WatchHistory`
    - Định nghĩa enum `Role { USER ADMIN }` và tất cả quan hệ cascade
    - Chạy `prisma migrate dev` để tạo migration đầu tiên
    - Tạo `backend/src/prisma/prisma.service.ts` export singleton PrismaClient (Prisma 7.x — output to `src/generated/prisma`)
    - Tạo `backend/src/prisma/prisma.module.ts` — Global PrismaModule
    - _Requirements: 1.1, 2.1, 4.1, 5.1, 6.1_

  - [x] 2.3 Cấu hình Redis (Upstash) và BullMQ
    - Cài đặt `@upstash/redis` (REST client cho cache) và `ioredis` (TCP client cho BullMQ)
    - **Lưu ý quan trọng:** Upstash hỗ trợ 2 kiểu kết nối khác nhau:
      - `@upstash/redis` — REST-based, dùng `UPSTASH_REDIS_REST_URL` + `UPSTASH_REDIS_REST_TOKEN` → chỉ dùng cho Cache Service
      - `ioredis` — TCP connection, dùng `REDIS_URL` dạng `rediss://...@...upstash.io:6379` → chỉ dùng cho BullMQ
      - Hai env vars phải được cấu hình riêng biệt trong `.env`
    - Tạo `backend/src/config/redis.config.ts` khởi tạo Upstash REST client (`@upstash/redis`) cho cache
    - Tạo `backend/src/config/bullmq.config.ts` khởi tạo `ioredis` connection từ `REDIS_URL` cho BullMQ
    - Tạo `backend/src/config/jwt.config.ts` cấu hình JWT secret và expiry
    - Tạo `backend/src/services/cache.service.ts` với các method: `get`, `set`, `del`, `delPattern`, `invalidateMovie`
    - _Requirements: 2.7, 6.6, 9.4, 10.4_

- [x] 3. Triển khai Auth Module (Đăng ký, Đăng nhập, JWT, OAuth Google)
  - [x] 3.1 Implement Auth Module với NestJS pattern
    - ✅ Cài đặt `bcrypt`, `passport`, `passport-jwt`, `passport-google-oauth20`, `@nestjs/passport`
    - ✅ Tạo `auth.module.ts` import PassportModule, JwtModule
    - ✅ Tạo `auth.service.ts` với các method: `register`, `login`, `refresh`, `logout`, `handleGoogleCallback`, `generateTokens`
    - ✅ Hash mật khẩu bcrypt cost factor 12, sign accessToken (15m) và refreshToken (7d)
    - ✅ Lưu refreshToken hash vào Redis với TTL 7 ngày; token rotation khi refresh
    - ✅ Tạo `jwt.strategy.ts` — Passport JwtStrategy verify Bearer token
    - ✅ Tạo `guards/jwt-auth.guard.ts` — JwtAuthGuard extends AuthGuard('jwt')
    - ✅ Tạo `common/guards/roles.guard.ts` — RolesGuard kiểm tra metadata từ @Roles()
    - ✅ Tạo `common/decorators/roles.decorator.ts`, `current-user.decorator.ts`, `public.decorator.ts`
    - ✅ Rate limiting: Thêm `@UseGuards(ThrottlerGuard)` vào register/login endpoints
    - _Requirements: 1.1, 1.4, 1.5, 1.6, 1.7, 1.8, 1.9, 1.10, 12.1, 12.2, 12.6, 12.7_

  - [x] 3.2 Tạo Auth Controller với NestJS controller pattern
    - ✅ Tạo `auth.controller.ts` với decorators: `@Controller('auth')`, các endpoint register/login/refresh/logout/google/google/callback
    - ✅ Thêm `@UseGuards(ThrottlerGuard)` cho register/login
    - ✅ Đăng ký `AuthModule` vào `AppModule`
    - _Requirements: 1.1, 1.4, 1.6, 1.8_

  - [x] 3.3 Implement Google OAuth 2.0
    - ✅ Cài đặt `passport-google-oauth20`
    - ✅ Tạo `google.strategy.ts` — GoogleStrategy extends PassportStrategy(Strategy, 'google')
    - ✅ Cấu hình scope: `['email', 'profile']`, clientID/clientSecret từ env
    - ✅ Endpoint `@Get('google')` — redirect đến Google consent screen
    - ✅ Endpoint `@Get('google/callback')` — nhận Google profile, upsert user, trả về tokens
    - _Requirements: 1.2, 1.3_

  - [x] 3.4 Viết property test cho Auth validation (Property 1)
    - ✅ **Property 1: Validation đầu vào đăng ký từ chối mọi input không hợp lệ**
    - File: `backend/src/auth/auth.property.spec.ts`

  - [x] 3.5 Viết property test cho JWT login (Property 2)
    - ✅ **Property 2: Đăng nhập thành công trả về JWT hợp lệ**
    - File: `backend/src/auth/auth.property.spec.ts`

  - [x] 3.6 Viết property test cho RefreshToken round-trip (Property 3)
    - ✅ **Property 3: Refresh token round-trip tạo accessToken mới**
    - File: `backend/src/auth/auth.property.spec.ts`

  - [x] 3.7 Viết property test cho logout vô hiệu hóa token (Property 4)
    - ✅ **Property 4: Đăng xuất vô hiệu hóa refreshToken**
    - File: `backend/src/auth/auth.property.spec.ts`

  - [x] 3.8 Viết unit tests cho Auth Service
    - ✅ Test đăng ký email đã tồn tại → 409
    - ✅ Test đăng nhập mật khẩu sai → 401
    - ✅ Test đăng nhập tài khoản bị khóa → 403
    - ✅ Test Google OAuth upsert user theo email
    - ✅ Test Google OAuth không tạo duplicate user
    - File: `backend/src/auth/auth.service.spec.ts`

- [x] 4. Checkpoint — Xác nhận Auth hoạt động
  - ✅ Code Auth backend hoàn chỉnh (service, controller, strategies, guards, decorators, DTOs)
  - ✅ Rate limiting (ThrottlerGuard) gắn vào register/login
  - ✅ Unit tests (auth.service.spec.ts) + Property tests (auth.property.spec.ts)

- [x] 5. Triển khai NguonC Parser Service
  - [x] 5.1 Định nghĩa types NguonC và implement parse logic (`nguonc.types.ts`, `nguonc.service.ts`)
  - [x] 5.2 Implement validation JSON và fetch từ NguonC API
  - [x] 5.3 Viết property test cho NguonC mapping round-trip (Property 16)
  - [x] 5.4 Viết property test cho parse category (Property 17)
  - [x] 5.5 Viết property test cho sync idempotent (Property 18)
  - [x] 5.6 Viết property test cho determineStatus (Property 21)
  - [x] 5.7 Viết property test cho nullable fields (Property 22)
  - [x] 5.8 Viết property test cho validation JSON thiếu trường (Property 19)
  - [x] 5.9 Viết unit tests cho NguonC Parser (`nguonc.service.spec.ts`, `nguonc.property.spec.ts`)

- [x] 6. Triển khai Movies Module và Admin Movie Endpoints
  - [x] 6.1 Implement Movies Service (public endpoints)
  - [x] 6.2 Implement Admin Movie Service (sync, import, update, delete)
  - [x] 6.3 Tạo Movies Controller với NestJS controller pattern
  - [x] 6.4 Viết property test cho phân trang (Property 5)
  - [x] 6.5 Viết property test cho filter phim (Property 6)
  - [x] 6.6 Viết property test cho tìm kiếm case-insensitive (Property 7)
  - [x] 6.7 Viết property test cho chi tiết phim (Property 8)
  - [x] 6.8 Viết property test cho import chỉ thêm tập mới (Property 20)
  - [x] 6.9 Viết unit tests cho Movie Service (`movies.service.spec.ts`, `movies.property.spec.ts`)

- [x] 7. Triển khai Watchlist Module và History Module
  - [x] 7.1 Implement Watchlist Module (`watchlist.module.ts`, `watchlist.service.ts`, `watchlist.controller.ts`)
  - [x] 7.2 Implement History Module (`history.module.ts`, `history.service.ts`, `history.controller.ts`)
  - [x] 7.3 Viết property test cho Watchlist thêm phim (Property 10)
  - [x] 7.4 Viết property test cho Watchlist xóa phim (Property 11)
  - [x] 7.5 Viết property test cho Watchlist sắp xếp (Property 12)
  - [x] 7.6 Viết property test cho upsert lịch sử xem (Property 13)
  - [x] 7.7 Viết property test cho lịch sử sắp xếp (Property 14)
  - [x] 7.8 Viết property test cho xóa lịch sử phim (Property 15)
  - [x] 7.9 Viết property test cho tiến trình xem round-trip (Property 9)
  - [x] 7.10 Viết unit tests cho Watchlist và History (`watchlist.service.spec.ts`, `history.service.spec.ts`, `*.property.spec.ts`)

- [x] 8. Triển khai Users Module và Admin Module
  - [x] 8.1 Implement Users Module (quản lý người dùng) (`users.module.ts`, `users.service.ts`, `users.controller.ts`)
  - [x] 8.2 Implement Admin Stats Module (`admin.stats.service.ts`, `admin.stats.controller.ts`)
  - [x] 8.3 Viết property test cho RBAC admin endpoints (Property 23)
  - [x] 8.4 Viết property test cho JWT bảo vệ protected endpoints (Property 24)
  - [x] 8.5 Viết unit tests cho User Service và Admin Service (`users.service.spec.ts`, `admin.service.spec.ts`, `admin.property.spec.ts`)

- [x] 9. Triển khai BullMQ Scheduler
  - [x] 9.1 Implement Scheduler với NestJS @Processor và @Cron pattern (`admin.scheduler.ts`, `bullmq.module.ts`)
  - [x] 9.2 Viết unit tests cho Scheduler (`admin.scheduler.spec.ts`)

- [x] 10. Checkpoint — Xác nhận toàn bộ Backend API hoạt động
  - ✅ Đảm bảo tất cả tests backend pass (22 test suites, 72 tests passed).
  - ✅ Backend API đã sẵn sàng để tích hợp với Frontend.

- [x] 11. Thiết lập Frontend boilerplate Next.js 14 và cấu hình
  - [x] 11.1 Khởi tạo dự án Frontend với Next.js 14 App Router
    - ✅ Đã chạy `npx create-next-app@14` — cấu trúc thư mục sẵn sàng
    - ✅ Đã cài đặt dependencies: `@tanstack/react-query`, `zustand`, `axios`, `hls.js`, `swiper`, `framer-motion`, `lucide-react`, `clsx`, `tailwind-merge`
    - ✅ Đã cài đặt và khởi tạo shadcn/ui
    - ✅ Đã cấu hình `next.config.mjs` với API proxy và remote image patterns
    - ✅ Đã cấu hình `tailwind.config.ts` với netflix-* colors, Outfit font, và aspect ratios
    - _Requirements: 13.4, 13.5_

  - [x] 11.2 Thiết lập State Management và API Client
    - ✅ Đã tạo `src/lib/axios.ts` với interceptors tự động gắn Bearer token và xử lý refresh token
    - ✅ Đã tạo `src/store/authStore.ts` (Zustand) với persist middleware
    - ✅ Đã tạo `src/store/uiStore.ts` (Zustand) cho UI state
    - ✅ Đã tạo `src/types/index.ts` với các interfaces: User, Movie, Episode, Category, Watchlist, WatchHistory, ApiResponse, PaginatedResponse

  - [x] 11.3 Thiết lập Next.js App Router layout và middleware
    - ✅ Đã tạo `src/middleware.ts` để bảo vệ routes `/watchlist`, `/profile`, `/admin`
    - ✅ Đã tạo `src/components/layout/Navbar.tsx` (Netflix-style, transparent -> dark on scroll)
    - ✅ Đã tạo `src/components/layout/Footer.tsx`
    - ✅ Đã tạo `src/components/layout/AdminSidebar.tsx`
    - ✅ Đã tạo `src/app/(user)/layout.tsx` (Navbar + Footer)
    - ✅ Đã tạo `src/app/(admin)/layout.tsx` (AdminSidebar)

- [x] 12. Triển khai trang Auth (Đăng nhập, Đăng ký)
  - [x] 12.1 Implement trang Login và Register
    - ✅ Đã tạo `src/app/(auth)/layout.tsx` (layout căn giữa form)
    - ✅ Đã tạo `src/app/(auth)/login/page.tsx` với form email/password, validation client-side, gọi `POST /api/auth/login`, lưu tokens vào authStore, và nút "Đăng nhập với Google"
    - ✅ Đã tạo `src/app/(auth)/register/page.tsx` với form name/email/password/confirmPassword, validation, gọi `POST /api/auth/register`
    - ✅ Đã thêm shadcn/ui components: `Input`, `Label`

- [x] 13. Triển khai trang phim (Home, List, Detail) với Framer Motion
  - [x] 13.1 Implement MovieCard và MovieRow components
    - ✅ Đã tạo `src/components/movie/MovieCard.tsx` với hiệu ứng hover Framer Motion
    - ✅ Đã tạo `src/components/movie/MovieRow.tsx` với Swiper.js carousel
    - ✅ Đã tạo `src/components/movie/MovieCardSkeleton.tsx` cho loading state
    - ✅ Đã tạo `src/components/movie/MovieBanner.tsx` (Hero Banner)
  - [x] 13.2 Implement trang Home với page transitions
    - ✅ Đã tạo `src/app/(user)/page.tsx` với MovieBanner và các MovieRow (phim mới, phim bộ, phim lẻ)
    - ✅ Đã tạo `src/hooks/useMovies.ts` (React Query hooks)
    - ✅ Đã tạo `src/components/Providers.tsx` (QueryClientProvider)
    - ✅ Đã cập nhật `src/app/layout.tsx` để wrap app với Providers
  - [x] 13.3 Implement trang danh sách phim với filter
    - ✅ Đã tạo `src/app/(user)/movies/page.tsx` với FilterBar (định dạng), MovieGrid, Pagination
    - ✅ FilterBar cập nhật URL query params khi thay đổi filter
    - ✅ Responsive grid: 6 cột desktop, 4 cột tablet, 2 cột mobile
  - [x] 13.4 Implement trang chi tiết phim
    - ✅ Đã tạo `src/app/(user)/movies/[slug]/page.tsx` với MovieDetailHero, EpisodeList, RelatedMovies
    - ✅ EpisodeList hiển thị buttons theo tập (cho phim bộ)
    - ✅ React Query hook `useMovie(slug)` với cache 5 phút
  - [x] 13.5 Viết property test cho MovieCard render (Property 25) — File `MovieCard.property.spec.tsx` tồn tại

- [x] 14. Triển khai Video Player
  - [x] 14.1 Implement VideoPlayer component với HLS.js — `VideoPlayer.tsx`, `PlayerControls.tsx`, `EpisodeNav.tsx`, `ServerSelector.tsx`
  - [x] 14.2 Implement trang Watch (`watch/[slug]/[ep]/page.tsx`) — VideoPlayer + episode nav + server selector

- [x] 15. Triển khai trang User (Watchlist, History, Profile)
  - [x] 15.1 Implement trang Watchlist (`(user)/watchlist/page.tsx`) — React Query, xóa phim, grid layout
  - [x] 15.2 Implement trang Profile và lịch sử xem (`(user)/profile/page.tsx`) — thông tin user + lịch sử xem
  - [x] 15.3 Viết property test cho protected route redirect (Property 26) — File `middleware.spec.ts` tồn tại

- [x] 16. Triển khai trang Admin
  - [x] 16.1 Implement Admin Dashboard với StatsCard (`(admin)/dashboard/page.tsx`) — 4 stat cards
  - [x] 16.2 Implement Admin Movie Management (`(admin)/movies/page.tsx`) — sync slug, bảng quản lý, xóa, pagination
  - [x] 16.3 Implement Admin User Management (`(admin)/users/page.tsx`) — bảng user, khóa/mở khóa, xóa, pagination

- [x] 17. Checkpoint cuối — Đảm bảo toàn bộ hệ thống hoạt động
  - ✅ Backend: 22 test suites, 72 tests passed
  - ✅ Frontend: Tất cả pages đã tạo, middleware.spec.ts cho protected routes

## Notes

- Các sub-task đánh dấu `*` là tùy chọn và có thể bỏ qua để triển khai MVP nhanh hơn
- Mỗi task tham chiếu đến requirements cụ thể để đảm bảo traceability
- Property-based tests dùng thư viện `fast-check` với tối thiểu 50-100 iterations mỗi property
- Checkpoints đảm bảo kiểm tra tăng dần sau mỗi nhóm tính năng lớn
- Thứ tự task theo dependency: schema → service → API → frontend
- Backend dùng NestJS module pattern: mỗi tính năng là 1 module độc lập
- Frontend dùng Next.js 14 App Router với middleware bảo vệ routes thay React Router
- Scheduler chạy mỗi 30 phút (`0 */30 * * * *`), auto-save tiến trình xem mỗi 10 giây
- **Task 1-9 (Backend):** Đã hoàn thành toàn bộ code + tests (22 test suites, 72 tests passed). Các module: Auth, NguonC, Movies, Watchlist, History, Users, Admin, BullMQ Scheduler đều đã có đầy đủ service, controller, module và file test (.spec.ts, .property.spec.ts).
- **Task 10:** Đã kiểm tra backend tests pass (22 suites, 72 tests). Cần chạy manual test hoặc e2e test để xác nhận toàn bộ API hoạt động trơn tru.
- **Task 11-17 (Frontend):** Đã triển khai toàn bộ custom code — Tailwind config, shadcn/ui, Zustand stores, React Query hooks, tất cả pages (home, movies, watch, auth, watchlist, profile, admin), components (MovieBanner, MovieCard, MovieRow, VideoPlayer, UserTable, StatsCard, MovieForm...), middleware bảo vệ routes, và MovieCard.property.spec.tsx.

## Task Dependency Graph

```json
{
  "waves": [
    { "id": -1, "tasks": ["1"] },
    { "id": 0, "tasks": ["1.5", "1.6"] },
    { "id": 1, "tasks": ["2.1"] },
    { "id": 2, "tasks": ["2.2"] },
    { "id": 3, "tasks": ["2.3"] },
    { "id": 4, "tasks": ["3.1", "5.1"] },
    { "id": 5, "tasks": ["3.2", "3.3", "5.2"] },
    { "id": 6, "tasks": ["3.4", "3.5", "3.6", "3.7", "3.8", "5.3", "5.4", "5.5", "5.6", "5.7", "5.8", "5.9"] },
    { "id": 7, "tasks": ["6.1", "7.1", "7.2", "8.1"] },
    { "id": 8, "tasks": ["6.2", "8.2"] },
    { "id": 9, "tasks": ["6.3", "9.1"] },
    { "id": 10, "tasks": ["6.4", "6.5", "6.6", "6.7", "6.8", "6.9", "7.3", "7.4", "7.5", "7.6", "7.7", "7.8", "7.9", "7.10", "8.3", "8.4", "8.5", "9.2"] },
    { "id": 11, "tasks": ["11.1"] },
    { "id": 12, "tasks": ["11.2"] },
    { "id": 13, "tasks": ["11.3", "12.1"] },
    { "id": 14, "tasks": ["13.1"] },
    { "id": 15, "tasks": ["13.2", "13.3", "13.4"] },
    { "id": 16, "tasks": ["13.5", "14.1"] },
    { "id": 13, "tasks": ["11.3", "12.1"] },
    { "id": 14, "tasks": ["13.1"] },
    { "id": 15, "tasks": ["13.2", "13.3", "13.4"] },
    { "id": 16, "tasks": ["13.5", "14.1"] },
    { "id": 17, "tasks": ["14.2", "15.1", "15.2"] },
    { "id": 18, "tasks": ["15.3", "16.1", "16.2", "16.3"] }
  ]
}