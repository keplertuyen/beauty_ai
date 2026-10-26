---
doc: playbook-phase-1
title: Sổ Tay Thực Thi 30 Ngày (Execution Playbook) — BeautyAI Phase 1 (MVP)
status: stable
precedence: 6
owner: Delivery Lead / Solo Dev
last_reviewed: 2026-10-26
---

# SỔ TAY THỰC THI 30 NGÀY (EXECUTION PLAYBOOK) — BEAUTYAI PHASE 1 (MVP)

> **Mục tiêu:** Hướng dẫn chi tiết từng bước (Step-by-Step Execution Guide) phân rã thành 16 nhiệm vụ thực chiến cho **Solo Developer** hoàn thành hệ thống BeautyAI trong 4 tuần (30 ngày).

---

## TUẦN 1: CSDL, DỮ LIỆU LỚN & XÁC THỰC (NGÀY 1 – 7)

### ▸ Task 1.1 — Khởi tạo PostgreSQL Schema & Seed Data Mỹ Phẩm
- **Mục tiêu:** Tạo 10 bảng CSDL cốt lõi và nạp 50 sản phẩm mẫu + 150 thành phần INCI + 12 cặp xung đột.
- **Các bước thực hiện:**
  1. Viết file migration SQL tại `docs/db-schema/schema_phase_1.sql` dựa theo thiết kế trong Technical Solutions Phase 1.
  2. Tạo DbContext trong `BeautyAI.Infrastructure` và cấu hình thực thi migration vào PostgreSQL Docker.
  3. Viết script seed dữ liệu C# hoặc SQL nạp:
     - 10 danh mục & 10 thương hiệu nổi tiếng (The Ordinary, Paula's Choice, La Roche-Posay, Cerave, v.v.).
     - 50 sản phẩm thực tế có đầy đủ bảng chuỗi thành phần INCI.
     - 150 hoạt chất trong bảng `ingredients`.
     - 12 cặp quy tắc xung đột hoạt chất trong bảng `conflict_rules`.
- **Kiểm chứng:**
  ```bash
  docker compose exec -T postgres psql -U beautyai -d beautyai -c "SELECT count(*) FROM products; SELECT count(*) FROM ingredients; SELECT count(*) FROM conflict_rules;"
  ```
- **Xong khi:** Cả 3 bảng đều có dữ liệu và truy vấn trả về kết quả chính xác.

---

### ▸ Task 1.2 — Xử lý & Đánh Chỉ Mục Tập Mẫu 1 Triệu Đánh Giá (1M Reviews)
- **Mục tiêu:** Nạp tập dữ liệu đánh giá lớn vào bảng `reviews` và đánh chỉ mục tối ưu.
- **Các bước thực hiện:**
  1. Đọc dữ liệu từ file processed CSV tại `docs/_data/processed/`.
  2. Viết console script hoặc endpoint batch insert nạp vào bảng `reviews`.
  3. Tạo B-Tree composite index trên `(product_id, skin_type)` và `(product_id, rating)`.
- **Kiểm chứng:**
  ```bash
  docker compose exec -T postgres psql -U beautyai -d beautyai -c "EXPLAIN ANALYZE SELECT * FROM reviews WHERE product_id = 1 AND skin_type = 'Oily' LIMIT 10;"
  ```
- **Xong khi:** Thời gian thực thi truy vấn (Execution time) dưới **50ms**.

---

### ▸ Task 1.3 — Xây dựng Backend Auth & Digital Skin ID API
- **Mục tiêu:** Triển khai các API Đăng ký, Đăng nhập, Profile, Digital Skin ID và Allergy Blacklist.
- **Các bước thực hiện:**
  1. Xây dựng AuthService trong `BeautyAI.Application`: băm mật khẩu PBKDF2 và sinh JWT Token an toàn.
  2. Xây dựng Endpoints: `POST /api/v1/auth/register`, `POST /api/v1/auth/login`, `GET /api/v1/auth/me`.
  3. Xây dựng SkinProfile Endpoints:
     - `PUT /api/v1/skin-profile`: Cập nhật loại da (`Oily`, `Dry`...), da nhạy cảm, mảng vấn đề da.
     - `GET /api/v1/skin-profile/allergies`: Lấy danh sách chất dị ứng.
     - `POST /api/v1/skin-profile/allergies`: Thêm chất dị ứng vào blacklist.
     - `DELETE /api/v1/skin-profile/allergies/{id}`: Gỡ bỏ chất dị ứng.
- **Kiểm chứng:** Gọi thử nghiệm đăng ký tài khoản mới và thêm 2 chất dị ứng (ví dụ: `Fragrance`, `Alcohol Denat`) qua Swagger/Postman ➔ Status 200 OK.

---

## TUẦN 2: GHÉP GIAO DIỆN REACT & TRÍ TUỆ INCI (NGÀY 8 – 15)

### ▸ Task 2.1 — Tích hợp Mã Nguồn React Frontend & Cấu hình API Client
- **Mục tiêu:** Đưa toàn bộ các màn hình giao diện từ `docs/_ui-ux_design/phase_1/frontend/` vào `src/frontend` và kết nối API.
- **Các bước thực hiện:**
  1. Sao chép các components và pages vào `src/frontend/src/`.
  2. Cấu hình base URL kết nối tới API backend (.NET 10 tại cổng 5000/5001).
  3. Chạy `npm run build` và `npm run test` để đảm bảo không lỗi cú pháp.
- **Xong khi:** Mở trình duyệt tại `http://localhost:5173` hiển thị trang chủ BeautyAI sắc nét.

---

### ▸ Task 2.2 — Hoàn thiện Catalog & Bộ Lọc "An Toàn Cho Da Tôi" (USP)
- **Mục tiêu:** Hiển thị danh mục sản phẩm, bộ lọc loại da và công tắc ẩn chất dị ứng.
- **Các bước thực hiện:**
  1. Xây dựng API `GET /api/v1/products`: nhận tham số `page`, `pageSize`, `skinType`, `minPrice`, `maxPrice`, `safeForMe=true`.
  2. Logic `safeForMe=true`: Nếu user đăng nhập, truy vấn loại trừ tất cả các sản phẩm có thành phần nằm trong `user_allergies` của user đó.
  3. Kết nối với component `Products.jsx` trên frontend.
- **Kiểm chứng:** Khi bật công tắc *"An toàn cho da tôi"*, các sản phẩm chứa hoạt chất trong Blacklist lập tức biến mất khỏi danh mục.

---

### ▸ Task 2.3 — Hoàn thiện Trang PDP, Bảng INCI & Cảnh Báo Dị Ứng Đỏ
- **Mục tiêu:** Hiển thị chi tiết sản phẩm, bóc tách bảng thành phần có màu sắc và banner cảnh báo đỏ.
- **Các bước thực hiện:**
  1. Xây dựng API `GET /api/v1/products/{slug}`: trả về thông tin chi tiết, danh sách thành phần INCI kèm nhóm công năng, và trường `hasAllergyWarning` (boolean).
  2. Trên frontend `ProductDetail.jsx`:
     - Nếu `hasAllergyWarning == true`, hiển thị Banner màu đỏ rực: *"CẢNH BÁO: Sản phẩm này chứa [Tên hoạt chất] nằm trong danh sách dị ứng của bạn!"*.
     - Render bảng thành phần phân màu: Xanh lá (An toàn/Dưỡng), Vàng (Hoạt chất), Đỏ (Cồn/Hương liệu).
     - Render biểu đồ Donut Chart phân bổ tỷ lệ công năng.
- **Kiểm chứng:** Đăng nhập tài khoản có dị ứng `Alcohol Denat`, mở sản phẩm có cồn khô ➔ Banner đỏ xuất hiện ngay lập tức.

---

### ▸ Task 2.4 — Hoàn thiện Công Cụ Phân Tích INCI Tự Do & So Sánh / Wishlist
- **Mục tiêu:** Hoàn thiện trang dán phân tích thành phần tự do và ghép trang So sánh, Wishlist.
- **Các bước thực hiện:**
  1. Xây dựng API `POST /api/v1/tools/analyze-inci`: nhận chuỗi thô người dùng dán vào, bóc tách theo dấu phẩy, tra cứu từ điển CSDL và trả về danh sách chi tiết các chất.
  2. Ghép nối giao diện `IngredientAnalyzer.jsx` hiển thị kết quả phân tích trực quan.
  3. Hoàn thiện trang `Compare.jsx` (so sánh song song bảng thông số & Match Score) và `Wishlist.jsx`.
- **Kiểm chứng:** Copy một bảng thành phần từ bao bì bất kỳ trên mạng, dán vào tool ➔ Hệ thống bóc tách thành công danh sách từng chất.

---

## TUẦN 3: GIỎ HÀNG, PHÁT HIỆN XUNG ĐỘT & THANH TOÁN (NGÀY 16 – 22)

### ▸ Task 3.1 — Hoàn thiện Giỏ Hàng & Smart Conflict Detector (Core USP)
- **Mục tiêu:** Phát hiện tự động các sản phẩm kỵ nhau trong giỏ hàng và đưa ra lời khuyên khoa học.
- **Các bước thực hiện:**
  1. Xây dựng thuật toán kiểm tra xung đột tại Domain service: Kiểm tra các sản phẩm trong giỏ hàng xem có chứa cặp hoạt chất nào trong `conflict_rules` không.
  2. Xây dựng API `POST /api/v1/tools/check-conflict`: nhận mảng `productIds`, trả về danh sách các cảnh báo xung đột (nếu có).
  3. Trên giao diện `Cart.jsx`:
     - Nếu phát hiện cặp kỵ nhau (vd Retinol + BHA), hiển thị Box cảnh báo viền cam nổi bật ngay đầu giỏ hàng.
     - Hiển thị thông điệp giải thích cơ chế và phương án chia lịch dùng luân phiên (Sáng/Tối hoặc Cách ngày).
     - Cung cấp checkbox *"Tôi đã hiểu cảnh báo và vẫn muốn tiếp tục mua"*.
- **Kiểm chứng:** Thêm 1 lọ Serum BHA và 1 lọ Kem Retinol vào giỏ hàng ➔ Cảnh báo xung đột lập tức xuất hiện trên trang Giỏ hàng.

---

### ▸ Task 3.2 — Luồng Thanh Toán COD & Quản Lý Đơn Hàng Cá Nhân
- **Mục tiêu:** Cho phép khách hàng nhập thông tin nhận hàng, áp dụng voucher và đặt hàng COD.
- **Các bước thực hiện:**
  1. Xây dựng API `POST /api/v1/orders`: Tạo mã đơn hàng (ví dụ: `BA-20261026-001`), lưu thông tin nhận hàng, phương thức thanh toán COD, trừ tồn kho.
  2. Hỗ trợ mã voucher cơ bản (`BEAUTYAI10` giảm 10%, `FREESHIP`).
  3. Hiển thị màn hình Thank You với tóm tắt đơn hàng.
  4. Xây dựng API `GET /api/v1/orders/my-orders` và hiển thị lịch sử đơn hàng tại trang `Profile.jsx`.
- **Kiểm chứng:** Đặt hàng thành công 1 đơn COD ➔ Đơn hàng xuất hiện trong CSDL và hiển thị trong danh sách đơn của tôi.

---

### ▸ Task 3.3 — Tích Hợp Lọc Đánh Giá Theo Loại Da Trên Trang PDP (Dataset 1M)
- **Mục tiêu:** Khai thác tập dữ liệu 1 triệu review để hiển thị đánh giá phân loại theo loại da người xem.
- **Các bước thực hiện:**
  1. Xây dựng API `GET /api/v1/products/{id}/reviews`: nhận tham số `skinType`.
  2. Trên trang PDP `ProductDetail.jsx`:
     - Hiển thị tab lọc review: *Tất cả*, *Da dầu*, *Da khô*, *Da hỗn hợp*, *Da nhạy cảm*.
     - Nếu người dùng đã có Skin Profile, tự động ưu tiên load review của nhóm cùng loại da lên đầu.
- **Kiểm chứng:** Chọn filter "Da dầu" ➔ Danh sách review chuyển sang toàn bộ các bài đánh giá từ người dùng da dầu.

---

## TUẦN 4: TRỢ LÝ AI, SKIN QUIZ, ADMIN & TỔNG DUYỆT DEMO (NGÀY 23 – 30)

### ▸ Task 4.1 — Skin Quiz 4 Bước & Tính Năng "Chat-to-Cart" Routine
- **Mục tiêu:** Chẩn đoán tình trạng da và sinh chu trình Routine AM/PM thêm cả bộ vào giỏ hàng với 1 click.
- **Các bước thực hiện:**
  1. Triển khai component `SkinQuiz.jsx` với 4 câu hỏi trực quan.
  2. Xây dựng thuật toán sinh chu trình Routine trong Domain layer:
     - Phân loại bước: Làm sạch, Đặc trị, Dưỡng ẩm, Chống nắng.
     - Kiểm tra không trùng chất dị ứng và không xung đột giữa các bước.
  3. Tạo nút **Chat-to-Cart**: Nhấn nút sẽ đưa toàn bộ 3–5 sản phẩm trong chu trình vào giỏ hàng trong 1 lần gọi API.
- **Kiểm chứng:** Làm xong Quiz ➔ Màn hình hiện chu trình AM/PM ➔ Bấm "Thêm cả bộ vào giỏ" ➔ Giỏ hàng có đủ các sản phẩm của routine.

---

### ▸ Task 4.2 — Tích hợp Trợ Lý Da Liễu AI (Google Gemini API)
- **Mục tiêu:** Cung cấp chatbot tư vấn làm đẹp cá nhân hóa theo hồ sơ da và grounding danh mục sản phẩm.
- **Các bước thực hiện:**
  1. Tạo `GeminiProvider` trong `BeautyAI.Infrastructure.Providers` kế thừa `IAiProvider`.
  2. Nạp API Key qua biến môi trường `GEMINI_API_KEY`.
  3. Xây dựng endpoint `POST /api/v1/ai/consult`:
     - Ghép System Prompt với hồ sơ da người dùng và danh mục các sản phẩm nổi bật của sàn.
     - Cài đặt Guardrail y tế nghiêm cấm chẩn đoán bệnh da liễu nặng.
  4. Kết nối giao diện chat tại `ExpertConsult.jsx`.
- **Kiểm chứng:** Hỏi chatbot: *"Da tôi nhiều mụn ẩn và dị ứng cồn thì nên dùng sản phẩm nào?"* ➔ Chatbot trả lời chuẩn xác, gợi ý sản phẩm không cồn đang có bán trên web kèm link.

---

### ▸ Task 4.3 — Admin Dashboard Tinh Gọn
- **Mục tiêu:** Cung cấp trang quản trị cho Admin quản lý sản phẩm và xử lý đơn hàng.
- **Các bước thực hiện:**
  1. Xây dựng API Admin:
     - `GET /api/v1/admin/kpis`: Trả về tổng sản phẩm, tổng đơn, doanh thu.
     - `POST /api/v1/admin/products`: Form thêm sản phẩm mới kèm nhập danh sách thành phần INCI thô.
     - `PATCH /api/v1/admin/orders/{id}/status`: Cập nhật trạng thái đơn (`Pending` ➔ `Delivering` ➔ `Completed`).
  2. Kết nối giao diện `AdminDashboard.jsx`.
- **Kiểm chứng:** Đăng nhập tài khoản `admin@beautyai.vn`, thêm thử 1 sản phẩm mới và duyệt đổi trạng thái 1 đơn hàng thành công.

---

### ▸ Task 4.4 — Tổng Duyệt Kịch Bản Demo & Đóng Gói Launch Production
- **Mục tiêu:** Chạy thông suốt kịch bản thuyết trình bảo vệ đồ án và kiểm tra toàn diện chất lượng hệ thống.
- **Các bước thực hiện:**
  1. Chạy `./syntheprise gate` và `./scripts/test` kiểm tra XANH 100%.
  2. Chạy thử nghiệm kịch bản Happy Path Demo từ A đến Z:
     - Khách đăng ký tài khoản ➔ Làm Skin Quiz xác định Da dầu nhạy cảm, Dị ứng cồn (`Alcohol Denat`).
     - Vào Catalog bật toggle *"An toàn cho da tôi"* ➔ Sản phẩm cồn bị ẩn.
     - Xem PDP ➔ Xem phân tích INCI và lọc review từ những người Da dầu.
     - Dán bao bì vào công cụ Phân tích INCI tự do.
     - Thêm 2 sản phẩm kỵ nhau vào giỏ ➔ Smart Conflict Detector cảnh báo viền cam và hướng dẫn chia lịch.
     - Hỏi Trợ lý AI Gemini xin lời khuyên làm đẹp.
     - Tiến hành đặt hàng COD ➔ Đăng nhập Admin duyệt đơn sang `Delivering`.
- **Xong khi:** Kịch bản demo chạy trơn tru, không phát sinh lỗi ngoại lệ, hệ thống sẵn sàng bàn giao và bảo vệ đồ án đạt điểm tối đa.
