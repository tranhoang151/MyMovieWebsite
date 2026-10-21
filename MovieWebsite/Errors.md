- Tôi đã chạy lại dự án, nhập slug: full-metal-panic rồi nhấn nút Sync thì lại không thấy gì xảy ra, danh sách phim vẫn trống không và trang chủ không thấy có phim gì; trên database, bảng movies đã có thông tin của 2 phim full-metal-panic và reiwa-no-dara-san (trên admin dashboard tôi thấy Tổng phim: 2, Phim mới(7 ngày): 2). Tại sao lại có vấn đề này? nó xuất phát từ đâu

## Nguyên nhân: Backend không filter theo `type` (series/single)

**Root cause:** Frontend gửi query param `type=series` hoặc `type=single` để lọc phim bộ/phim lẻ, nhưng backend `MoviesService.findAll()` **không xử lý field `type`**. Movie model không có field `type`, nên backend bỏ qua param này → trả về toàn bộ phim (hoặc filter sai) → frontend không hiển thị gì vì filter `type` không hoạt động.

**Phân tích:**
- Movie model không có field `type` (xem schema.prisma)
- Frontend filter: `type=series` (phim bộ), `type=single` (phim lẻ)
- Backend `MoviesService.findAll()` chỉ filter `search`, `quality`, `language`, `status`, `category` → **bỏ qua `type`**
- Kết quả: API trả về tất cả phim, nhưng frontend filter client-side bằng `type` → không khớp → danh sách trống

## Đã sửa:

**File:** `backend/src/movies/movies.service.ts`
```typescript
// Thêm filter type vào where clause
if (type === 'series') {
  where.totalEpisodes = { gt: 1 };
} else if (type === 'single') {
  where.totalEpisodes = { equals: 1 };
}
```
- Sử dụng `totalEpisodes` để phân biệt: `>1` là phim bộ (series), `=1` là phim lẻ (single)

## Files đã sửa:
1. `backend/src/movies/movies.service.ts` - Thêm filter `type` dựa trên `totalEpisodes`
2. `backend/src/movies/dto/query-movies.dto.ts` - Đã có field `type` (sửa trước đó)
3. `backend/src/movies/dto/query-movies.dto.ts` - Sửa `page`/`limit` → `skip`/`take`
4. `backend/src/admin/admin.service.ts` - Deduplicate categories + try-catch
5. `frontend/src/app/(admin)/admin/movies/page.tsx` - Sửa endpoint sync + onError

## Kết quả sau khi sửa:
- GET `/api/movies?page=1&limit=20&type=series` → trả về chỉ phim bộ (totalEpisodes > 1)
- GET `/api/movies?page=1&limit=20&type=single` → trả về chỉ phim lẻ (totalEpisodes = 1)
- Danh sách phim trên trang chủ/admin hiển thị đúng theo filter

## Cần làm:
1. Restart backend: `cd backend && npm run start:dev`
2. Test: truy cập `/movies?type=series` và `/movies?type=single` → xem danh sách phim