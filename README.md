# 🎬 CineStream - Nền tảng Xem Phim Trực Tuyến Chất Lượng Cao

[![Next.js](https://img.shields.io/badge/Frontend-Next.js%2014%20App%20Router-black?logo=next.js)](https://nextjs.org/)
[![NestJS](https://img.shields.io/badge/Backend-NestJS%2011-ea2845?logo=nestjs)](https://nestjs.com/)
[![PostgreSQL](https://img.shields.io/badge/Database-PostgreSQL%20(Prisma)-336791?logo=postgresql)](https://www.postgresql.org/)
[![Redis](https://img.shields.io/badge/Cache-Redis%20(Upstash)-dc382d?logo=redis)](https://redis.io/)
[![Tailwind CSS](https://img.shields.io/badge/Styling-Tailwind%20CSS-38bdf8?logo=tailwindcss)](https://tailwindcss.com/)
[![License](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)

**CineStream** là dự án website xem phim trực tuyến hiện đại được xây dựng theo mô hình **Monorepo**, kết hợp sức mạnh của **Next.js 14 App Router** ở Frontend và **NestJS + Prisma** ở Backend. Hệ thống được tích hợp **Redis Caching**, cơ chế cào và đồng bộ phim tự động qua **BullMQ**, video streaming chất lượng cao với **HLS.js**, cùng kiến trúc bảo mật chuẩn **OWASP Top 10**.

---

## 📑 Mục lục

1. [Kiến trúc hệ thống](#-kiến-trúc-hệ-thống)
2. [Tính năng nổi bật](#-tính-năng-nổi-bật)
3. [Công nghệ sử dụng (Tech Stack)](#-công-nghệ-sử-dụng)
4. [Yêu cầu hệ thống](#-yêu-cầu-hệ-thống)
5. [Hướng dẫn cài đặt & Chạy dự án](#-hướng-dẫn-cài-đặt--chạy-dự-án)
6. [Cấu hình biến môi trường](#-cấu-hình-biến-môi-trường)
7. [Tối ưu hóa hiệu năng & Bảo mật](#-tối-ưu-hóa-hiệu-năng--bảo-mật)
8. [Danh mục API Endpoints chính](#-danh-mục-api-endpoints-chính)
9. [Cấu trúc thư mục dự án](#-cấu-trúc-thư-mục-dự-án)
10. [Kiểm thử (Testing)](#-kiểm-thử-testing)

---

## 🏛️ Kiến trúc hệ thống

```mermaid
flowchart TD
    User["👤 Người dùng (Trình duyệt / Mobile / Desktop)"]
    
    subgraph Frontend["Frontend (Next.js 14 App Router - Port 3000)"]
        UI["Tailwind CSS + Framer Motion"]
        State["Zustand + React Query (Cache 5m)"]
        Player["Video Player (HLS.js / Iframe Fallback)"]
        Watcher["SessionWatcher (Kiểm tra hạn 7 ngày)"]
    end

    subgraph Backend["Backend (NestJS 11 - Port 3001)"]
        Guard["Helmet + CORS + ThrottlerGuard (Rate Limit)"]
        AuthModule["Auth Service (JWT + Refresh Token + Google OAuth)"]
        MovieModule["Movies Service (Search, Filter, Pagination)"]
        HistoryModule["Watch History & Watchlist"]
        BullMQ["BullMQ Worker (Auto Sync Cronjob)"]
        Compress["Compression Middleware (Gzip/Deflate)"]
    end

    subgraph Storage["Data & Cache Layer"]
        Redis[("Redis (Upstash / Local)\n- Token Rotation\n- Movie List / Detail Cache")]
        Postgres[("PostgreSQL (Supabase / Local)\n- Movies, Episodes, Categories\n- Users, Watchlist, WatchHistory")]
    end

    subgraph CDN["External Video CDN"]
        NguonC["NguonC Streaming Server (HLS .m3u8 / Iframe)"]
    end

    User <--> Frontend
    Frontend <-->|REST API + Bearer Token| Backend
    Backend <-->|Read / Write Cache| Redis
    Backend <-->|Prisma ORM (Indexes)| Postgres
    Backend <-->|Cào dữ liệu phim| NguonC
    Player -.->|Stream Video Trực Tiếp| NguonC
```

---

## ✨ Tính năng nổi bật

### 1. Phía Người dùng (User Experience)
* 🏠 **Trang chủ hiện đại:** Hero Banner phim nổi bật, thanh cuộn Carousel phim theo chủ đề (Phim mới cập nhật, Phim bộ đang chiếu, Phim lẻ hot) với Swiper mượt mà.
* 🔍 **Tìm kiếm & Bộ lọc linh hoạt:** Tìm kiếm phim theo tên, lọc theo định dạng (Phim bộ / Phim lẻ), thể loại, quốc gia, năm phát hành, trạng thái hoàn tất/đang chiếu.
* 🎬 **Trình phát video thông minh:**
  * Hỗ trợ phát luồng **HLS (.m3u8)** với chất lượng cao và fallback sang **Iframe** khi luồng gốc gặp sự cố.
  * Tùy chọn chuyển đổi Server phát video nhanh chóng.
  * Thanh điều hướng tập phim trực quan cho phim bộ.
  * Thanh Navbar được giữ nguyên ở đầu trang giúp người dùng chuyển trang dễ dàng khi đang xem phim.
* ⏱️ **Tiếp tục xem phim dở (Resume Playback):**
  * Tự động lưu tiến độ xem phim ngầm mỗi 5 giây vào cơ sở dữ liệu.
  * Hiển thị danh sách **"Phim đang xem dở"** ngay trong trang **Trang cá nhân (`/profile`)** kèm tên tập đang xem và thanh tiến trình thời gian.
  * Nhấn vào phim sẽ tự động mở đúng tập phim đó và tua trực tiếp đến phút dừng trước đó.
* ⭐ **Tủ phim yêu thích (Watchlist):** Thêm và quản lý danh sách phim dự định xem, đồng bộ theo từng tài khoản.
* 📱 **Thiết kế Responsive 100%:** Tối ưu hóa hoàn hảo cho mọi kích thước màn hình từ điện thoại di động (Mobile Menu trượt), Tablet đến màn hình máy tính lớn.

### 2. Quản trị viên (Admin Portal)
* 📊 **Dashboard Thống kê:** Báo cáo trực quan tổng số phim, người dùng, lượt xem và hoạt động hệ thống.
* 📥 **Tự động hóa đồng bộ phim (Crawler):**
  * Đồng bộ phim tự động từ nguồn dữ liệu mở qua hàng đợi **BullMQ** theo chu kỳ Cron job.
  * Công cụ Sync phim thủ công theo slug dành cho Admin.
* 👥 **Quản lý người dùng:** Xem danh sách, phân quyền (USER / ADMIN), khóa hoặc mở khóa tài khoản người dùng vi phạm.
* 🎥 **Quản lý danh mục phim:** Duyệt, lọc và xóa phim lỗi khỏi hệ thống.

---

## 🔒 Bảo mật chuyên sâu (OWASP Top 10 Compliant)

Hệ thống được kiểm định và áp dụng đầy đủ các biện pháp phòng chống tấn công theo tiêu chuẩn **OWASP**:

1. **Helmet Security Headers:** Bảo vệ chống clickjacking, MIME sniffing, ép buộc HTTPS và cấu hình CSP/COOP/CORP.
2. **Luồng xác thực Google OAuth 2.0 an toàn (One-Time Code Exchange):**
   * Không bao giờ truyền trực tiếp JWT Access/Refresh Token qua URL Query parameters.
   * Sử dụng mã xác thực dùng 1 lần (TTL 60s lưu trong Redis) để hoán đổi lấy token an toàn.
3. **Cơ chế phiên đăng nhập 7 ngày tuyệt đối (Absolute 7-Day Session):**
   * Phiên đăng nhập có thời hạn tối đa đúng 7 ngày kể từ lúc người dùng đăng nhập lần đầu.
   * Token refresh không gia hạn cuốn chiếu vô tận.
   * `SessionWatcher` và Axios interceptors tự động phát hiện và đăng xuất người dùng về trang chủ khi phiên hết hạn.
4. **Rate Limiting toàn diện:** Sử dụng `ThrottlerGuard` giới hạn 100 req/phút cho API công khai và 30 req/phút cho các API đăng nhập/đăng ký nhằm ngăn chặn tấn công Brute-force & DoS.
5. **Iframe Sandboxing:** Chặn mã độc XSS khi phát video qua iframe nhúng từ bên ngoài.
6. **Bảo vệ mật khẩu:** Hash mật khẩu an toàn với **bcrypt** (cost 12) và kiểm tra regex độ phức tạp mật khẩu bắt buộc.

---

## ⚡ Tối ưu hóa hiệu năng & Tốc độ

* 🚀 **Redis Multi-tier Caching:**
  * Caching danh sách phim (`findAll`) trong 5 phút.
  * Caching chi tiết phim (`findBySlug`) trong 10 phút.
  * Tự động xóa cache (Invalidation) ngay khi có phim mới được sync.
* 📦 **Payload Optimization:** Cắt bỏ việc trả về hàng ngàn tập phim ở API danh sách, giảm kích thước JSON response từ ~1MB xuống còn **~20KB** (giảm 95% dữ liệu mạng).
* 🗄️ **Database Indexing:** Bổ sung composite index trên PostgreSQL (`[isActive, createdAt DESC]`, `[categoryId]`, `[userId, watchedAt DESC]`), loại bỏ hoàn toàn Full Table Scan.
* 🗜️ **HTTP Gzip/Deflate Compression:** Toàn bộ API response được nén tự động trước khi gửi đến client.
* 🖼️ **Next.js Image Modern Formats:** Tự động nén ảnh poster sang chuẩn **AVIF & WebP** với thời gian cache 24h, giúp tải nhanh gấp đôi trên mạng di động.

---

## 🛠️ Công nghệ sử dụng

### Backend
* **Ngôn ngữ & Nền tảng:** Node.js, TypeScript
* **Framework:** NestJS 11 (Modular Architecture)
* **ORM & Database:** Prisma 7.x, PostgreSQL (Supabase / Local)
* **In-Memory Cache & Queue:** Redis (Upstash / Local), BullMQ
* **Bảo mật & Auth:** Passport.js, JWT, bcrypt, Helmet, NestJS Throttler
* **API Documentation:** Swagger / OpenAPI

### Frontend
* **Framework:** Next.js 14 (App Router, Server & Client Components)
* **Giao diện & Styling:** Tailwind CSS, shadcn/ui, Framer Motion
* **Quản lý trạng thái:** Zustand (với LocalStorage Persist), TanStack React Query (StaleTime 5m)
* **Xử lý Media & Trình phát:** HLS.js, Swiper Carousel
* **HTTP Client:** Axios (Custom Request & Response Interceptors)
* **Icons:** Lucide React

---

## 📋 Yêu cầu hệ thống

* **Node.js:** v18.17.0 trở lên (khuyên dùng Node.js 20 LTS)
* **npm:** v9 trở lên
* **PostgreSQL:** v14 trở lên (hoặc tài khoản [Supabase](https://supabase.com))
* **Redis:** v6 trở lên (hoặc tài khoản [Upstash Redis](https://upstash.com))

---

## 🚀 Hướng dẫn cài đặt & Chạy dự án

### Bước 1: Clone repository và cài đặt Dependencies

```bash
# Clone repository
git clone https://github.com/<your-username>/MyMovieWebsite.git
cd MyMovieWebsite/MovieWebsite/Project

# Cài đặt dependencies cho Backend
cd backend
npm install

# Cài đặt dependencies cho Frontend
cd ../frontend
npm install
```

---

### Bước 2: Cấu hình biến môi trường

#### 1. Backend (`MovieWebsite/Project/backend/.env`)

Tạo file `.env` trong thư mục `backend/`:

```env
# Server Port & Môi trường
PORT=3001
NODE_ENV=development
FRONTEND_URL="http://localhost:3000"

# PostgreSQL Database (Supabase hoặc Local)
DATABASE_URL="postgresql://postgres:password@localhost:5432/cinestream?schema=public"
DIRECT_URL="postgresql://postgres:password@localhost:5432/cinestream"

# Redis Cache (Upstash REST API hoặc Local)
UPSTASH_REDIS_REST_URL="https://your-upstash-redis.upstash.io"
UPSTASH_REDIS_REST_TOKEN="your_upstash_token"
REDIS_URL="redis://localhost:6379"

# JWT Authentication
JWT_SECRET="cinestream_jwt_secret_change_this_in_production_32chars_min"
JWT_EXPIRES_IN="15m"
JWT_REFRESH_EXPIRES_IN="7d"

# Google OAuth 2.0 (Tùy chọn)
GOOGLE_CLIENT_ID="your-google-client-id.apps.googleusercontent.com"
GOOGLE_CLIENT_SECRET="your-google-client-secret"
GOOGLE_CALLBACK_URL="http://localhost:3001/api/auth/google/callback"

# NguonC API Endpoint
NGUONC_API_URL="https://phim.nguonc.com/api/film"
NGUONC_SYNC_SLUGS="vi-sao-dua-anh-toi,dao-hai-tac,chu-thuat-hoi-chien"
```

#### 2. Frontend (`MovieWebsite/Project/frontend/.env.local`)

Tạo file `.env.local` trong thư mục `frontend/`:

```env
NEXT_PUBLIC_API_URL="http://localhost:3001/api"
```

---

### Bước 3: Khởi tạo Cơ sở dữ liệu (Prisma Migration)

Di chuyển vào thư mục `backend/` và chạy lệnh đồng bộ schema:

```bash
cd backend
npx prisma generate
npx prisma migrate dev --name init
```

*(Tùy chọn) Chạy seed dữ liệu mẫu nếu có:*
```bash
npm run db:seed
```

---

### Bước 4: Khởi chạy ứng dụng

Mở 2 cửa sổ terminal riêng biệt để chạy Backend và Frontend:

#### Terminal 1: Chạy Backend (Port 3001)
```bash
cd MovieWebsite/Project/backend
npm run start:dev
```
* Backend API hoạt động tại: `http://localhost:3001/api`
* Swagger Tài liệu API (Dev mode): `http://localhost:3001/api/docs`

#### Terminal 2: Chạy Frontend (Port 3000)
```bash
cd MovieWebsite/Project/frontend
npm run dev
```
* Mở trình duyệt và truy cập: `http://localhost:3000`

---

## 📌 Danh mục API Endpoints chính

| Phương thức | Endpoint | Mô tả | Quyền truy cập |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/auth/register` | Đăng ký tài khoản người dùng mới | Công khai |
| `POST` | `/api/auth/login` | Đăng nhập bằng Email & Mật khẩu | Công khai |
| `POST` | `/api/auth/refresh` | Đổi Refresh Token lấy Access Token mới | Công khai |
| `POST` | `/api/auth/oauth-exchange` | Đổi mã xác thực Google OAuth lấy Token | Công khai |
| `POST` | `/api/auth/logout` | Đăng xuất và thu hồi Refresh Token trên Redis | Người dùng |
| `GET` | `/api/movies` | Danh sách phim (phân trang, lọc, tìm kiếm - Cache Redis 5m) | Công khai |
| `GET` | `/api/movies/:slug` | Chi tiết phim và danh sách tập (Cache Redis 10m) | Công khai |
| `GET` | `/api/history` | Lấy lịch sử xem phim và tiến trình dừng của người dùng | Người dùng |
| `POST` | `/api/history` | Lưu / Cập nhật tiến độ xem tập phim (giây dừng) | Người dùng |
| `GET` | `/api/watchlist` | Lấy danh sách phim yêu thích | Người dùng |
| `POST` | `/api/watchlist/:movieId` | Thêm phim vào danh sách yêu thích | Người dùng |
| `DELETE` | `/api/watchlist/:movieId` | Xóa phim khỏi danh sách yêu thích | Người dùng |
| `GET` | `/api/users` | Lấy danh sách người dùng trong hệ thống | Admin |
| `PATCH` | `/api/users/:id/block` | Khóa hoặc mở khóa tài khoản người dùng | Admin |
| `GET` | `/api/admin/stats` | Thống kê số lượng phim, user, tương tác | Admin |
| `POST` | `/api/movies/sync/:slug` | Đồng bộ thủ công dữ liệu phim từ NguonC | Admin |

---

## 📂 Cấu trúc thư mục dự án

```
MyMovieWebsite/
├── MovieWebsite/
│   └── Project/
│       ├── backend/                      # NestJS RESTful API
│       │   ├── prisma/
│       │   │   └── schema.prisma         # Định nghĩa Models & Indexes PostgreSQL
│       │   ├── src/
│       │   │   ├── admin/                # Quản trị hệ thống & Scheduler
│       │   │   ├── auth/                 # JWT Auth, Google Strategy, Session Logic
│       │   │   ├── bullmq/               # Hàng đợi cào phim ngầm
│       │   │   ├── common/               # Guards, Interceptors, Filters OWASP
│       │   │   ├── config/               # Cấu hình Redis, JWT, App
│       │   │   ├── history/              # Quản lý lịch sử xem & resume time
│       │   │   ├── movies/               # CRUD Phim, Redis Cache, Filter
│       │   │   ├── nguonc/               # Parser dữ liệu NguonC
│       │   │   ├── prisma/               # Prisma Service & Adapter
│       │   │   ├── services/             # CacheService (Redis wrapper)
│       │   │   ├── users/                # Quản lý tài khoản
│       │   │   ├── watchlist/            # Quản lý phim yêu thích
│       │   │   ├── app.module.ts
│       │   │   └── main.ts               # Entrypoint (Helmet, Gzip, Pipes)
│       │   └── package.json
│       │
│       ├── frontend/                     # Next.js 14 App Router
│       │   ├── src/
│       │   │   ├── app/                  # Routes hệ thống
│       │   │   │   ├── (auth)/           # /login, /register
│       │   │   │   ├── (admin)/          # /admin/dashboard, /admin/movies, /admin/users
│       │   │   │   ├── (user)/           # /, /movies, /movies/[slug], /profile, /watchlist
│       │   │   │   ├── auth/callback/    # Google OAuth callback handler
│       │   │   │   ├── watch/[slug]/[ep] # Trang trình phát phim chính
│       │   │   │   ├── layout.tsx
│       │   │   │   └── not-found.tsx
│       │   │   ├── components/           # UI Components
│       │   │   │   ├── layout/           # Navbar, Footer, AdminSidebar
│       │   │   │   ├── movie/            # MovieCard, MovieRow, MovieBanner, MovieGrid
│       │   │   │   ├── player/           # VideoPlayer, ServerSelector, EpisodeNav
│       │   │   │   ├── ui/               # shadcn/ui components (Button, Modal, Toast)
│       │   │   │   └── SessionWatcher.tsx# Đồng bộ phiên đăng nhập tự động
│       │   │   ├── hooks/                # Custom hooks (useAuth, useMovies, useWatchHistory)
│       │   │   ├── lib/                  # Axios instance, Interceptors, Constants
│       │   │   ├── store/                # Zustand stores (authStore)
│       │   │   └── types/                # TypeScript Interfaces & Types
│       │   ├── next.config.mjs           # Cấu hình AVIF, WebP, Gzip, Rewrites
│       │   └── tailwind.config.ts        # Bảng màu chủ đề Netflix Dark
│       └── package.json
└── README.md                             # Tài liệu tổng quan dự án
```

---

## 🧪 Kiểm thử (Testing)

Dự án chú trọng độ tin cậy và sự ổn định cao với cả **Unit Testing** và **Property-based Testing** (dùng `fast-check`):

### 1. Kiểm thử Backend (22 Test Suites - 83 Tests Passed 100%)
```bash
cd MovieWebsite/Project/backend

# Chạy toàn bộ Unit Tests & Property Tests
npm test

# Chạy test kiểm tra độ bao phủ mã nguồn
npm run test:cov
```

### 2. Kiểm thử Frontend (Type Check & Production Build)
```bash
cd MovieWebsite/Project/frontend

# Kiểm tra cú pháp và kiểu dữ liệu TypeScript (0 errors)
npx tsc --noEmit

# Biên dịch thử nghiệm chế độ Production (15/15 routes static/dynamic)
npm run build
```

---

## 📄 Giấy phép (License)

Dự án được phân phối dưới giấy phép **MIT License**. Mọi đóng góp và mã nguồn đều tự do sử dụng cho mục đích học tập và nghiên cứu.
