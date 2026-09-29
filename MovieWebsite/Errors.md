
=> Đây là hành vi bình thường của NestJS vì app đặt global prefix `/api`.
=> Swagger UI đã được bật tại: http://localhost:3001/api/docs
=> Root route `/` trả về 404 — dùng `http://localhost:3001/api` để test.

- Khi tôi đăng kí tài khoản mới thì nhận thông báo "đăng kí thất bại", trên console hiện thông báo: 
  POST http://localhost:3001/api/auth/register 400 (Bad Request)

=> Nguyên nhân: Frontend cho phép password < 8 ký tự, nhưng backend yêu cầu tối thiểu 8 ký tự.
=> Đã sửa validation frontend để match backend (min 8 chars, validate email/name format).


- Khi vào trang đăng nhập và nhấn nút đăng ký với google:

Sign in with Google
Access blocked: Authorization Error
The OAuth client was not found.

If you are a developer of this app, see error details: Error 401: invalid_client
Request details: flowName=GeneralOAuthLite

Error 401: invalid_client

=> Nguyên nhân: `GOOGLE_CLIENT_ID` và `GOOGLE_CLIENT_SECRET` trong `.env` đang là placeholder.
=> Đã cập nhật credentials thực từ file client secret JSON.