# 🎬 CineStream - Website Xem Phim Trực Tuyến

Website xem phim trực tuyến theo kiến trúc Monorepo với **NestJS + TypeScript** (Backend) và **Next.js 14 App Router + TypeScript** (Frontend).

---

## 📋 Yêu cầu hệ thống

- **Node.js**: v18+ 
- **npm**: v9+
- **PostgreSQL** (Supabase hoặc local)
- **Redis** (Upstash hoặc local)

---

## 🚀 Bước 1: Clone và cài đặt dependencies

```bash
# Clone repository
git clone <repo-url>
cd MovieWebsite/Project

# Cài dependencies cho backend
cd backend
npm install

# Cài dependencies cho frontend
cd ../frontend
npm install
```

---

## 🗄️ Bước 2: Thiết lập Database (Supabase)

1. Truy cập https://supabase.com → Tạo tài khoản → **New Project**
2. Vào **Project Settings → Database → Connection String**
3. Copy URL từ tab **Transaction** (port 6543) → đặt làm `DATABASE_URL`
4. Copy URL từ tab **Session** (port 5432) → đặt làm `DIRECT_URL`

Tạo file `backend/.env`:
```env
DATABASE_URL="postgresql://postgres.[ref]:[password]@aws-0-[region].pooler.supabase.com:6543/postgres?pgbouncer=true"
DIRECT_URL="postgresql://postgres.[ref]:[password]@aws-0-[region].pooler.supabase.com:5432/postgres"
```

---

## 🔴 Bước 3: Thiết lập Redis (Upstash)

1. Truy cập https://upstash.com → Tạo tài khoản → **Create Database**
2. Copy `UPSTASH_REDIS_REST_URL` và `UPSTASH_REDIS_REST_TOKEN` từ tab **REST API**
3. Copy **Endpoint** và **Password** từ tab **Details** → tạo `REDIS_URL`

Thêm vào `backend/.env`:
```env
UPSTASH_REDIS_REST_URL="https://[your-instance].upstash.io"
UPSTASH_REDIS_REST_TOKEN="your_upstash_token"
REDIS_URL="rediss://default:[password]@[your-instance].upstash.io:6379"
```

---

## ⚙️ Bước 4: Cấu hình Backend

### Thêm các biến môi trường vào `backend/.env`:

```env
# Database
DATABASE_URL="..."
DIRECT_URL="..."

# Redis
UPSTASH_REDIS_REST_URL="..."
UPSTASH_REDIS_REST_TOKEN="..."
REDIS_URL="..."

# JWT
JWT_SECRET="your-super-secret-jwt-key"
JWT_EXPIRES_IN="15m"
JWT_REFRESH_EXPIRES_IN="7d"

# Google OAuth
GOOGLE_CLIENT_ID="your-google-client-id"
GOOGLE_CLIENT_SECRET="your-google-client-secret"

# Frontend URL
FRONTEND_URL="http://localhost:3000"
```

### Chạy Prisma Migration:

```bash
cd backend
npx prisma migrate deploy
```

> **Chú ý**: Dự án sử dụng migration files trong `prisma/migrations/`. Dùng `db push` chỉ nên dùng cho development nhanh, không áp dụng cho môi trường production.

---

## 🖥️ Bước 5: Chạy Backend

```bash
# Từ thư mục Project/
cd backend
npm run start:dev
```

Backend sẽ chạy tại `http://localhost:3001`

---

## 🎨 Bước 6: Cấu hình Frontend

Tạo file `frontend/.env.local`:
```env
NEXT_PUBLIC_API_URL=http://localhost:3001/api
```

---

## 🌐 Bước 7: Chạy Frontend

```bash
# Từ thư mục Project/
cd frontend
npm run dev
```

Frontend sẽ chạy tại `http://localhost:3000`

---

## 📦 Cấu trúc thư mục

```
Project/
├── backend/                    # Backend NestJS
│   ├── src/
│   │   ├── auth/              # Auth module (JWT, Google OAuth)
│   │   ├── movies/            # Movies module (CRUD, Search, Filter)
│   │   ├── nguonc/            # NguonC Parser (sync phim)
│   │   ├── watchlist/         # Watchlist module
│   │   ├── history/           # Watch History module
│   │   ├── users/             # Users module
│   │   ├── admin/             # Admin module (Stats, Movie/User Management)
│   │   ├── bullmq/            # BullMQ Scheduler
│   │   ├── prisma/            # Prisma Service
│   │   ├── common/            # Guards, Decorators, Filters, Interceptors
│   │   └── config/            # Config (JWT, Redis, BullMQ)
│   └── prisma/
│       └── schema.prisma      # Database Schema
│
├── frontend/                   # Frontend Next.js 14
│   └── src/
│       ├── app/               # App Router
│       │   ├── (auth)/        # Auth pages (Login, Register)
│       │   ├── (user)/        # User pages (Home, Movies, Profile, Watchlist)
│       │   ├── (admin)/       # Admin pages (Dashboard, Movies, Users)
│       │   └── watch/         # Watch page (Video Player)
│       ├── components/        # UI Components
│       │   ├── movie/         # MovieCard, MovieRow, MovieBanner
│       │   ├── player/        # VideoPlayer, PlayerControls, EpisodeNav
│       │   ├── layout/        # Navbar, Footer, AdminSidebar
│       │   └── ui/            # shadcn/ui components
│       ├── hooks/             # Custom hooks (useMovies)
│       ├── store/             # Zustand stores (authStore, uiStore)
│       ├── lib/               # Axios client, utils
│       └── types/             # TypeScript interfaces
└── package.json               # Monorepo config
```

---

## 🔑 Tính năng chính

### User
- 🔐 Đăng nhập / Đăng ký / Google OAuth
- 🏠 Trang chủ với Hero Banner + Movie Rows (Swiper.js)
- 📋 Danh sách phim với Filter (Phim bộ/Phim lẻ) + Pagination
- 📄 Chi tiết phim (Hero, Metadata, Episode List, Server Selector)
- ▶️ Xem phim với Video Player (HLS.js + iframe fallback)
- 💾 Lưu phim yêu thích (Watchlist)
- 📊 Lịch sử xem phim

### Admin
- 📊 Dashboard với thống kê (tổng phim, user, hoạt động)
- 🎬 Quản lý phim (Sync từ NguonC, Xem danh sách, Xóa)
- 👤 Quản lý người dùng (Xem danh sách, Khóa/Mở khóa, Xóa)

---

## 🧪 Chạy Tests

### Backend Tests:
```bash
cd backend
npm test
```

### Frontend Build & Type Check:
```bash
cd frontend
npm run build
npm run lint
npx tsc --noEmit
```

---

## 📌 API Endpoints chính

### Auth
- `POST /api/auth/register` - Đăng ký
- `POST /api/auth/login` - Đăng nhập
- `POST /api/auth/refresh` - Refresh token
- `POST /api/auth/logout` - Đăng xuất
- `GET /api/auth/google` - Google OAuth redirect
- `GET /api/auth/google/callback` - Google OAuth callback

### Movies
- `GET /api/movies` - Danh sách phim (phân trang, filter, search)
- `GET /api/movies/:slug` - Chi tiết phim
- `POST /api/movies/sync/:slug` - Sync phim từ NguonC (Admin)
- `DELETE /api/movies/:id` - Xóa phim (Admin)

### Watchlist
- `GET /api/watchlist` - Danh sách phim yêu thích
- `POST /api/watchlist/:movieId` - Thêm vào yêu thích
- `DELETE /api/watchlist/:movieId` - Xóa khỏi yêu thích

### History
- `GET /api/history` - Lịch sử xem
- `POST /api/history` - Cập nhật tiến trình xem

### Users (Admin)
- `GET /api/users` - Danh sách user
- `PATCH /api/users/:id/block` - Khóa/Mở khóa user

### Admin Stats
- `GET /api/admin/stats` - Thống kê tổng quan

---

## 🛠️ Tech Stack

### Backend
- **Runtime**: Node.js
- **Framework**: NestJS
- **ORM**: Prisma
- **Database**: PostgreSQL (Supabase)
- **Cache**: Redis (Upstash)
- **Queue**: BullMQ
- **Auth**: JWT + Passport (Google OAuth)
- **Testing**: Jest + Property-based testing (fast-check)

### Frontend
- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **State Management**: Zustand + React Query
- **Styling**: Tailwind CSS + shadcn/ui
- **Video Player**: HLS.js
- **Animation**: Framer Motion
- **Carousel**: Swiper.js
- **Icons**: Lucide React

---

## ⚠️ Lưu ý quan trọng

1. **Upstash Redis**: Có 2 kiểu kết nối khác nhau:
   - `@upstash/redis` (REST client) → dùng cho Cache Service → env: `UPSTASH_REDIS_REST_URL` + `UPSTASH_REDIS_REST_TOKEN`
   - `ioredis` (TCP client) → dùng cho BullMQ → env: `REDIS_URL` (dạng `rediss://...`)

2. **BullMQ Scheduler**: Tự động sync phim mỗi 30 phút

3. **Video Player**: Hỗ trợ cả HLS.js (m3u8) và iframe embed

4. **Protected Routes**: Middleware tự động chuyển hướng đến `/login` nếu chưa đăng nhập
   - Routes được bảo vệ: `/watchlist`, `/profile`, `/admin`

---

## 📞 Hỗ trợ

Nếu gặp vấn đề, kiểm tra:
1. `backend/.env` đã đủ biến môi trường chưa
2. Database đã kết nối chưa: `cd backend && npx prisma migrate deploy`
3. Backend đã chạy chưa: `cd backend && npm run start:dev`
4. Frontend `.env.local` đã cấu hình `NEXT_PUBLIC_API_URL` chưa