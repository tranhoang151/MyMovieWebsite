# Requirements Document

## Introduction

Website xem phim trực tuyến (Movie Streaming Website) là một nền tảng web cho phép người dùng khám phá, tìm kiếm và xem phim với giao diện tương tự Netflix/Crunchyroll. Dữ liệu phim được lấy từ API của NguonC.com và lưu trữ trong cơ sở dữ liệu nội bộ. Hệ thống hỗ trợ hai vai trò: **User** (xem phim, quản lý tủ phim cá nhân) và **Admin** (quản lý nội dung, người dùng, đồng bộ phim từ nguồn bên ngoài).

---

## Glossary

- **Website**: Ứng dụng web xem phim trực tuyến được xây dựng trong dự án này.
- **NguonC_API**: API bên thứ ba tại `https://phim.nguonc.com/api/film/{slug}` cung cấp dữ liệu phim.
- **NguonC_Parser**: Module backend chịu trách nhiệm gọi NguonC_API, parse JSON response và ánh xạ dữ liệu vào cơ sở dữ liệu nội bộ.
- **Movie_DB**: Cơ sở dữ liệu PostgreSQL nội bộ lưu trữ thông tin phim, tập phim, danh mục.
- **User**: Người dùng đã đăng ký và đăng nhập vào Website với vai trò thông thường.
- **Admin**: Người dùng có vai trò quản trị viên với quyền quản lý nội dung và người dùng.
- **Auth_Service**: Module xử lý đăng ký, đăng nhập, xác thực JWT và phân quyền RBAC.
- **Movie_Service**: Module backend xử lý các thao tác CRUD và truy vấn phim.
- **Episode**: Một tập phim thuộc một bộ phim, bao gồm tên tập, slug, URL embed và URL m3u8.
- **Watchlist**: Tủ phim cá nhân của User, lưu danh sách phim yêu thích.
- **Watch_History**: Lịch sử xem phim của User, bao gồm tiến trình xem từng tập.
- **Video_Player**: Trình phát video tích hợp HLS.js hỗ trợ stream m3u8, có fallback sang iframe embed.
- **Cache_Service**: Module Redis (Upstash) lưu cache response API để giảm tải database.
- **Scheduler**: Module BullMQ thực hiện các tác vụ nền như tự động đồng bộ tập mới.
- **JSON_Import**: Tính năng cho phép Admin import dữ liệu phim từ file JSON có cấu trúc tương tự NguonC_API response.
- **Category**: Danh mục phân loại phim bao gồm Định dạng (Phim bộ/Phim lẻ), Thể loại, Quốc gia.
- **Slug**: Chuỗi định danh URL-friendly của phim (ví dụ: "full-metal-panic").
- **HLS**: HTTP Live Streaming — định dạng stream video qua file m3u8.
- **RBAC**: Role-Based Access Control — cơ chế phân quyền theo vai trò.
- **JWT**: JSON Web Token — cơ chế xác thực stateless.
- **Admin_Dashboard**: Trang tổng quan quản trị hiển thị các số liệu thống kê về hệ thống dành cho Admin.

---

## Requirements

### Yêu Cầu 1: Đăng Ký và Đăng Nhập Tài Khoản

**User Story:** Là một khách truy cập, tôi muốn đăng ký và đăng nhập tài khoản, để có thể sử dụng các tính năng cá nhân hóa như tủ phim và lịch sử xem.

#### Tiêu Chí Chấp Nhận

1. WHEN một khách truy cập gửi yêu cầu đăng ký với email hợp lệ, mật khẩu tối thiểu 8 ký tự và tên hiển thị, THE Auth_Service SHALL tạo tài khoản mới với vai trò USER và trả về thông báo thành công.
2. WHEN một khách truy cập chọn đăng nhập bằng Google, THE Auth_Service SHALL thực hiện luồng OAuth 2.0 với Google và xác thực danh tính người dùng.
3. WHEN đăng nhập Google thành công lần đầu tiên với một địa chỉ email chưa tồn tại trong hệ thống, THE Auth_Service SHALL tự động tạo tài khoản mới với vai trò USER, sử dụng thông tin email và tên hiển thị từ Google profile.
4. IF email đã tồn tại trong hệ thống, THEN THE Auth_Service SHALL trả về lỗi HTTP 409 với thông báo "Email đã được sử dụng".
5. IF email không đúng định dạng hoặc mật khẩu ít hơn 8 ký tự, THEN THE Auth_Service SHALL trả về lỗi HTTP 400 với danh sách các trường không hợp lệ.
6. WHEN một User gửi yêu cầu đăng nhập với email và mật khẩu đúng, THE Auth_Service SHALL trả về accessToken (JWT, hết hạn sau 15 phút) và refreshToken (hết hạn sau 7 ngày).
7. IF email hoặc mật khẩu không đúng, THEN THE Auth_Service SHALL trả về lỗi HTTP 401 với thông báo "Email hoặc mật khẩu không chính xác".
8. WHEN một User gửi refreshToken hợp lệ đến endpoint refresh, THE Auth_Service SHALL trả về accessToken mới VÀ refreshToken mới (token rotation), đồng thời vô hiệu hóa refreshToken cũ — refreshToken cũ SHALL bị từ chối ở mọi lần gọi tiếp theo.
9. IF tài khoản User bị Admin khóa (isActive = false), THEN THE Auth_Service SHALL từ chối đăng nhập và trả về lỗi HTTP 403 với thông báo "Tài khoản đã bị khóa".
10. WHEN một User đăng xuất, THE Auth_Service SHALL vô hiệu hóa refreshToken hiện tại.

---

### Yêu Cầu 2: Xem Danh Sách và Tìm Kiếm Phim

**User Story:** Là một khách truy cập, tôi muốn duyệt và tìm kiếm phim, để có thể khám phá nội dung phù hợp với sở thích của mình.

#### Tiêu Chí Chấp Nhận

1. THE Movie_Service SHALL cung cấp endpoint công khai (không yêu cầu đăng nhập) để lấy danh sách phim với phân trang, mỗi trang tối đa 24 phim.
2. WHEN một khách truy cập lọc danh sách phim theo thể loại, quốc gia, năm sản xuất hoặc định dạng (phim bộ/phim lẻ), THE Movie_Service SHALL trả về danh sách phim khớp với tất cả bộ lọc được chọn.
3. WHEN một khách truy cập tìm kiếm phim theo từ khóa, THE Movie_Service SHALL trả về danh sách phim có tên (name hoặc original_name) chứa từ khóa đó, không phân biệt hoa thường.
4. THE Movie_Service SHALL trả về kết quả tìm kiếm trong vòng 500ms cho các truy vấn thông thường nhờ Cache_Service.
5. WHEN một khách truy cập xem chi tiết phim theo slug, THE Movie_Service SHALL trả về đầy đủ thông tin phim bao gồm mô tả, danh mục, danh sách tập phim theo từng server.
6. IF slug phim không tồn tại trong Movie_DB, THEN THE Movie_Service SHALL trả về lỗi HTTP 404.
7. THE Cache_Service SHALL lưu cache kết quả danh sách phim trong 5 phút và chi tiết phim trong 10 phút.

---

### Yêu Cầu 3: Xem Phim (Video Player)

**User Story:** Là một User đã đăng nhập, tôi muốn xem phim với trình phát video chất lượng cao, để có trải nghiệm xem phim mượt mà.

#### Tiêu Chí Chấp Nhận

1. THE Video_Player SHALL cho phép khách truy cập (chưa đăng nhập) xem phim mà không yêu cầu xác thực — chỉ tính năng lưu tiến trình (3.6) và resume (3.7) mới yêu cầu đăng nhập.
2. WHEN một User chọn xem một tập phim có URL m3u8 hợp lệ, THE Video_Player SHALL phát video qua HLS.js stream.
2. WHEN một User chọn xem một tập phim có URL m3u8 hợp lệ, THE Video_Player SHALL phát video qua HLS.js stream.
3. IF URL m3u8 không khả dụng hoặc lỗi tải, THEN THE Video_Player SHALL tự động chuyển sang phát qua iframe embed URL.
4. WHEN một User đang xem phim, THE Video_Player SHALL hiển thị các điều khiển: play/pause, tua nhanh/lùi 10 giây, điều chỉnh âm lượng, toàn màn hình và chọn server.
5. WHEN một phim có nhiều server (ví dụ: "Vietsub #1", "Thuyết minh #1"), THE Video_Player SHALL cho phép User chuyển đổi giữa các server mà không cần tải lại trang.
6. WHEN một phim bộ đang phát, THE Video_Player SHALL hiển thị nút điều hướng đến tập trước và tập tiếp theo.
7. WHILE một User đang xem phim và đã đăng nhập, THE Watch_History SHALL tự động lưu tiến trình xem (progressSec) mỗi 10 giây.
8. WHEN một User quay lại xem một tập phim đã xem dở, THE Video_Player SHALL tự động tiếp tục từ vị trí đã lưu trong Watch_History.

---

### Yêu Cầu 4: Quản Lý Tủ Phim Cá Nhân (Watchlist)

**User Story:** Là một User đã đăng nhập, tôi muốn thêm phim vào tủ phim cá nhân, để dễ dàng tìm lại và xem sau.

#### Tiêu Chí Chấp Nhận

1. WHEN một User gửi yêu cầu thêm phim vào Watchlist, THE Movie_Service SHALL lưu bản ghi với userId và movieId vào bảng watchlist.
2. IF phim đã tồn tại trong Watchlist của User, THEN THE Movie_Service SHALL trả về lỗi HTTP 409 và không tạo bản ghi trùng lặp.
3. WHEN một User gửi yêu cầu xóa phim khỏi Watchlist, THE Movie_Service SHALL xóa bản ghi tương ứng và trả về HTTP 200.
4. WHEN một User xem trang Watchlist của mình, THE Movie_Service SHALL trả về danh sách phim đã thêm, sắp xếp theo thời gian thêm mới nhất trước.
5. THE Movie_Service SHALL yêu cầu User đăng nhập (JWT hợp lệ) cho tất cả thao tác với Watchlist; IF không có JWT hợp lệ, THEN THE Auth_Service SHALL trả về lỗi HTTP 401.

---

### Yêu Cầu 5: Lịch Sử Xem Phim

**User Story:** Là một User đã đăng nhập, tôi muốn xem lại lịch sử xem phim của mình, để tiếp tục xem từ chỗ đã dừng.

#### Tiêu Chí Chấp Nhận

1. WHEN một User gửi yêu cầu lưu tiến trình xem với movieId, episodeSlug, serverName và progressSec, THE Watch_History SHALL tạo mới hoặc cập nhật bản ghi tương ứng (upsert theo userId + movieId + episodeSlug + serverName).
2. WHEN một User xem trang lịch sử, THE Watch_History SHALL trả về danh sách phim đã xem, sắp xếp theo thời gian xem gần nhất trước, kèm thông tin tập và tiến trình.
3. WHEN một User xóa lịch sử của một phim, THE Watch_History SHALL xóa tất cả bản ghi lịch sử của phim đó thuộc User và trả về HTTP 200.
4. THE Movie_Service SHALL yêu cầu User đăng nhập (JWT hợp lệ) cho tất cả thao tác với Watch_History.

---

### Yêu Cầu 6: Đồng Bộ Phim Từ NguonC API (Admin)

> **Phân biệt với Req 7:** Req 6 là Admin nhập slug → backend tự gọi NguonC API để fetch dữ liệu (online). Req 7 là Admin upload file JSON trực tiếp (offline, không cần kết nối NguonC API).

**User Story:** Là một Admin, tôi muốn đồng bộ phim từ NguonC API vào hệ thống bằng cách nhập slug, để nhanh chóng thêm nội dung mới mà không cần nhập tay.

#### Tiêu Chí Chấp Nhận

1. WHEN một Admin gửi yêu cầu sync phim với slug hợp lệ, THE NguonC_Parser SHALL gọi `GET https://phim.nguonc.com/api/film/{slug}`, parse JSON response và lưu dữ liệu vào Movie_DB.
2. THE NguonC_Parser SHALL ánh xạ đầy đủ các trường từ NguonC_API response sang Movie_DB theo bảng mapping đã định nghĩa, bao gồm thông tin phim, danh mục và tất cả tập phim.
3. THE NguonC_Parser SHALL parse trường `category` là object với các key số ("1","2","3","4") bằng cách dùng `Object.values()`, trích xuất năm sản xuất từ group "Năm" vào `Movie.year`, và upsert các danh mục còn lại (Định dạng, Thể loại, Quốc gia) vào bảng Category.
4. IF NguonC_API trả về status khác "success" hoặc không thể kết nối, THEN THE NguonC_Parser SHALL trả về lỗi HTTP 502 với thông báo mô tả lỗi từ nguồn bên ngoài.
5. IF phim với slug đã tồn tại trong Movie_DB, THEN THE NguonC_Parser SHALL cập nhật (upsert) thông tin phim và tập phim thay vì tạo mới.
6. WHEN sync phim thành công, THE Cache_Service SHALL xóa cache `movie:{slug}` và tất cả cache có prefix `movies:*`.
7. THE Auth_Service SHALL từ chối yêu cầu sync từ User không có vai trò ADMIN và trả về lỗi HTTP 403.

---

### Yêu Cầu 7: Import Phim Từ File JSON (Admin)

> **Phân biệt với Req 6:** Req 7 là Admin upload file JSON trực tiếp (offline) — backend không gọi NguonC API, chỉ parse file được upload. Dùng khi không có kết nối internet hoặc muốn import hàng loạt.

**User Story:** Là một Admin, tôi muốn import phim từ file JSON có cấu trúc tương tự NguonC API response, để cập nhật hàng loạt hoặc thêm phim bộ có tập mới mà không cần gọi API bên ngoài.

#### Tiêu Chí Chấp Nhận

1. WHEN một Admin upload file JSON có cấu trúc hợp lệ (chứa trường `status: "success"` và `movie` object), THE NguonC_Parser SHALL parse file và lưu dữ liệu vào Movie_DB theo cùng logic với sync từ API.
2. IF file JSON không đúng cấu trúc (thiếu trường bắt buộc như `movie.id`, `movie.slug`, `movie.name`, `episodes`), THEN THE NguonC_Parser SHALL trả về lỗi HTTP 400 với danh sách các trường bị thiếu hoặc sai định dạng.
3. IF file upload không phải định dạng JSON hoặc vượt quá 10MB, THEN THE NguonC_Parser SHALL trả về lỗi HTTP 400 với thông báo mô tả lỗi.
4. WHEN import từ file JSON thành công cho phim bộ đang chiếu, THE NguonC_Parser SHALL chỉ thêm các tập phim mới (chưa tồn tại theo movieId + serverName + slug) mà không xóa tập cũ.
5. WHEN import thành công, THE Cache_Service SHALL xóa cache liên quan đến phim vừa được cập nhật.
6. THE Auth_Service SHALL từ chối yêu cầu import từ User không có vai trò ADMIN và trả về lỗi HTTP 403.

---

### Yêu Cầu 8: Quản Lý Người Dùng (Admin)

**User Story:** Là một Admin, tôi muốn quản lý danh sách người dùng, để kiểm soát quyền truy cập và xử lý các tài khoản vi phạm.

#### Tiêu Chí Chấp Nhận

1. WHEN một Admin gửi yêu cầu lấy danh sách người dùng, THE Auth_Service SHALL trả về danh sách tất cả User với thông tin id, email, tên, vai trò, trạng thái (isActive) và ngày tạo, có phân trang.
2. WHEN một Admin gửi yêu cầu khóa tài khoản User, THE Auth_Service SHALL cập nhật `isActive = false` cho User đó và trả về HTTP 200.
3. WHEN một Admin gửi yêu cầu mở khóa tài khoản User, THE Auth_Service SHALL cập nhật `isActive = true` cho User đó và trả về HTTP 200.
4. WHEN một Admin gửi yêu cầu xóa tài khoản User, THE Auth_Service SHALL xóa User và tất cả dữ liệu liên quan (watchlist, watch_history) theo cascade và trả về HTTP 200.
5. IF Admin cố gắng khóa hoặc xóa tài khoản Admin khác, THEN THE Auth_Service SHALL từ chối và trả về lỗi HTTP 403 với thông báo "Không thể thực hiện thao tác này với tài khoản Admin".
6. THE Auth_Service SHALL từ chối tất cả yêu cầu quản lý người dùng từ User không có vai trò ADMIN và trả về lỗi HTTP 403.

---

### Yêu Cầu 9: Quản Lý Phim (Admin)

**User Story:** Là một Admin, tôi muốn quản lý danh sách phim trong hệ thống, để duy trì chất lượng nội dung và cập nhật thông tin khi cần.

#### Tiêu Chí Chấp Nhận

1. WHEN một Admin gửi yêu cầu cập nhật metadata phim (tên, mô tả, chất lượng, ngôn ngữ), THE Movie_Service SHALL cập nhật các trường tương ứng trong Movie_DB và trả về thông tin phim đã cập nhật.
2. WHEN một Admin gửi yêu cầu xóa phim, THE Movie_Service SHALL xóa phim và tất cả dữ liệu liên quan (episodes, categories_on_movies, watchlist entries, watch_history entries) theo cascade.
3. WHEN một Admin gửi yêu cầu sync tập mới cho một phim bộ đang chiếu, THE NguonC_Parser SHALL gọi NguonC_API với slug của phim đó và chỉ thêm các tập chưa tồn tại vào Movie_DB.
4. WHEN xóa hoặc cập nhật phim thành công, THE Cache_Service SHALL xóa cache liên quan đến phim đó.
5. THE Auth_Service SHALL từ chối tất cả yêu cầu quản lý phim (cập nhật, xóa, sync) từ User không có vai trò ADMIN và trả về lỗi HTTP 403.

---

### Yêu Cầu 10: Tự Động Đồng Bộ Tập Mới (Scheduler)

**User Story:** Là một Admin, tôi muốn hệ thống tự động kiểm tra và cập nhật tập mới cho các phim bộ đang chiếu, để người dùng luôn có nội dung mới nhất mà không cần Admin thao tác thủ công.

#### Tiêu Chí Chấp Nhận

1. THE Scheduler SHALL tự động chạy tác vụ đồng bộ tập mới mỗi 30 phút một lần cho tất cả phim bộ có `currentEpisode` chưa ở trạng thái hoàn tất (không chứa chuỗi "Hoàn tất").
2. WHEN Scheduler chạy tác vụ đồng bộ cho một phim, THE NguonC_Parser SHALL gọi NguonC_API và chỉ thêm các tập mới chưa tồn tại trong Movie_DB.
3. IF NguonC_API không khả dụng trong quá trình Scheduler chạy, THEN THE Scheduler SHALL ghi log lỗi và tiếp tục xử lý các phim còn lại trong hàng đợi mà không dừng toàn bộ tác vụ.
4. WHEN Scheduler hoàn thành đồng bộ cho một phim có tập mới, THE Cache_Service SHALL xóa cache liên quan đến phim đó.
5. THE Scheduler SHALL ghi log kết quả mỗi lần chạy, bao gồm số phim được kiểm tra, số phim có tập mới và số lỗi phát sinh.

---

### Yêu Cầu 11: Parse và Ánh Xạ Dữ Liệu NguonC (NguonC Parser)

**User Story:** Là một hệ thống, tôi muốn parse chính xác JSON response từ NguonC API, để dữ liệu phim được lưu trữ đúng và đầy đủ trong Movie_DB.

#### Tiêu Chí Chấp Nhận

1. WHEN NguonC_Parser nhận JSON response hợp lệ từ NguonC_API, THE NguonC_Parser SHALL parse object `category` bằng `Object.values()` và phân loại đúng các nhóm: "Định dạng", "Thể loại", "Quốc gia" vào bảng Category, và "Năm" vào trường `Movie.year`.
2. THE NguonC_Parser SHALL parse mảng `episodes` và tạo bản ghi Episode cho mỗi item trong `episodes[].items[]`, với đầy đủ các trường: serverName, name, slug, embedUrl, m3u8Url.
3. THE NguonC_Parser SHALL xác định trạng thái phim (status) từ trường `current_episode`: nếu chứa "Hoàn tất" hoặc bằng "FULL" thì status = "completed", ngược lại status = "ongoing".
4. FOR ALL JSON response hợp lệ từ NguonC_API, việc parse rồi lưu vào Movie_DB rồi đọc lại SHALL trả về dữ liệu tương đương với dữ liệu gốc (round-trip property).
5. IF JSON response thiếu trường bắt buộc (`movie.id`, `movie.slug`, `movie.name`), THEN THE NguonC_Parser SHALL ném lỗi validation với danh sách trường bị thiếu thay vì lưu dữ liệu không đầy đủ.
6. IF NguonC_API trả về response có `status !== "success"` (bao gồm các trường hợp API lỗi, slug không tồn tại, hoặc phim bị gỡ), THEN THE NguonC_Parser SHALL trả về lỗi HTTP 502 với thông báo mô tả lỗi từ upstream — không lưu bất kỳ dữ liệu nào vào Movie_DB.
7. THE NguonC_Parser SHALL xử lý đúng trường hợp các trường nullable: `director`, `casts`, `time` có thể là null (thường gặp ở phim bộ).

---

### Yêu Cầu 12: Bảo Mật và Phân Quyền

**User Story:** Là một hệ thống, tôi muốn đảm bảo mọi endpoint được bảo vệ đúng theo vai trò, để ngăn chặn truy cập trái phép vào dữ liệu và chức năng quản trị.

#### Tiêu Chí Chấp Nhận

1. THE Auth_Service SHALL bảo vệ tất cả endpoint quản trị (sync phim, xóa phim, quản lý user) bằng cơ chế RBAC, chỉ cho phép User có vai trò ADMIN.
2. THE Auth_Service SHALL bảo vệ tất cả endpoint cá nhân hóa (watchlist, watch_history, profile) bằng JWT, chỉ cho phép User đã đăng nhập.
3. THE Auth_Service SHALL để các endpoint xem phim (danh sách phim, chi tiết phim, tìm kiếm) là công khai, không yêu cầu xác thực.
4. WHEN một request đến endpoint được bảo vệ không có JWT hoặc JWT hết hạn, THE Auth_Service SHALL trả về lỗi HTTP 401.
5. WHEN một User có JWT hợp lệ nhưng không đủ quyền truy cập endpoint ADMIN, THE Auth_Service SHALL trả về lỗi HTTP 403.
6. THE Auth_Service SHALL hash mật khẩu bằng bcrypt với cost factor tối thiểu 10 trước khi lưu vào cơ sở dữ liệu.
7. THE Website SHALL áp dụng rate limiting: tối đa 100 request/phút cho endpoint công khai và 30 request/phút cho endpoint đăng nhập/đăng ký.

---

### Yêu Cầu 13: Giao Diện Người Dùng (Frontend)

**User Story:** Là một khách truy cập, tôi muốn có giao diện trực quan và dễ sử dụng tương tự Netflix, để có trải nghiệm duyệt và xem phim thoải mái.

#### Tiêu Chí Chấp Nhận

1. THE Website SHALL hiển thị trang chủ với hero banner (phim nổi bật) và các hàng phim theo danh mục (phim mới, phim bộ đang chiếu, theo thể loại).
2. THE Website SHALL hiển thị MovieCard với ảnh thumbnail, tên phim và overlay thông tin khi hover, sử dụng Swiper.js cho các hàng phim dạng carousel.
3. WHEN trang đang tải dữ liệu phim, THE Website SHALL hiển thị skeleton loading thay vì màn hình trắng.
4. THE Website SHALL hỗ trợ giao diện responsive hoạt động đúng trên màn hình desktop (≥1024px), tablet (768px–1023px) và mobile (< 768px).
5. THE Website SHALL sử dụng dark theme làm giao diện mặc định, với màu nền chính là #141414 và màu chữ chính là #FFFFFF, tương tự Netflix.
6. WHEN một User chưa đăng nhập cố gắng truy cập trang watchlist hoặc profile, THE Website SHALL tự động chuyển hướng đến trang đăng nhập.
7. THE Website SHALL hiển thị trang quản trị Admin với sidebar điều hướng, bảng quản lý phim và bảng quản lý người dùng, chỉ accessible với tài khoản ADMIN.

---

### Yêu Cầu 14: Thống Kê Admin (Admin Dashboard)

**User Story:** Là một Admin, tôi muốn xem thống kê tổng quan về hệ thống, để nắm bắt tình trạng hoạt động của website.

#### Tiêu Chí Chấp Nhận

1. THE Admin_Dashboard SHALL hiển thị tổng số phim trong hệ thống.
2. THE Admin_Dashboard SHALL hiển thị tổng số user đã đăng ký.
3. THE Admin_Dashboard SHALL hiển thị số user mới đăng ký trong 7 ngày gần nhất.
4. THE Admin_Dashboard SHALL hiển thị số phim được thêm mới trong 7 ngày gần nhất.
5. THE Auth_Service SHALL từ chối truy cập dashboard stats từ User không có vai trò ADMIN và trả về lỗi HTTP 403.
