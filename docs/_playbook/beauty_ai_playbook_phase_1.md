---
doc: playbook-phase-1
title: Sổ Tay Thực Thi 30 Ngày (Execution Playbook) — BeautyAI Phase 1 (MVP)
status: stable
precedence: 6
owner: Delivery Lead / Solo Dev
last_reviewed: 2026-10-26
---

# SỔ TAY THỰC THI CHI TIẾT 30 NGÀY (EXECUTION PLAYBOOK) — BEAUTYAI PHASE 1 (MVP)

> **Mục tiêu:** Cẩm nang thực thi kỹ thuật chi tiết từng bước (Step-by-Step Practical Playbook) dành riêng cho **Solo Developer** hoàn thành trọn vẹn dự án BeautyAI trong 4 tuần (30 ngày).
> Mỗi nhiệm vụ đều bao gồm: Bối cảnh, các bước code C#/.NET và React cụ thể, điều kiện nghiệm thu, lệnh kiểm chứng dòng lệnh và những điều TUYỆT ĐỐI KHÔNG ĐƯỢC LÀM.

---

# TUẦN 1: NỀN TẢNG CSDL, DỮ LIỆU LỚN & XÁC THỰC (NGÀY 1 – 7)

---

## ▸ Nhiệm vụ 1.1 — Khởi tạo PostgreSQL Schema & Nạp Dữ Liệu Sản Phẩm Mỹ Phẩm

- **Mục tiêu:** Thiết lập 10 bảng CSDL trong PostgreSQL 17 (chuẩn hóa cột `code` ánh xạ Sephora) và nạp dữ liệu danh mục, thương hiệu, sản phẩm mỹ phẩm từ dataset có sẵn kèm 12 cặp quy tắc xung đột.
- **Tệp liên quan:**
  - `docs/db-schema/schema_phase_1.sql`
  - `docs/_data/cleaned/products_cleaned.csv` (8.495 sản phẩm Sephora thật)
  - `src/BeautyAI.Infrastructure/Persistence/AppDbContext.cs`
  - `src/BeautyAI.Infrastructure/Persistence/DbInitializer.cs` hoặc `scripts/seed_products.py`

### Các bước thực hiện chi tiết:
1. Tạo tệp migration SQL `docs/db-schema/schema_phase_1.sql` chứa toàn bộ 10 bảng CSDL đã được cập nhật cột `code VARCHAR(50) UNIQUE` trong bảng `products` và `product_code VARCHAR(50)` trong bảng `reviews`.
2. Thực thi script tạo bảng vào PostgreSQL Docker đang chạy trên máy Mac:
   ```bash
   docker compose exec -T postgres psql -U beautyai -d beautyai -f /dev/stdin < docs/db-schema/schema_phase_1.sql
   ```
3. Tạo class `DbInitializer.cs` hoặc script ETL đọc trực tiếp từ `docs/_data/cleaned/products_cleaned.csv` để nạp:
   - Các thương hiệu nổi tiếng (Paula's Choice, The Ordinary, La Roche-Posay, CeraVe, Klairs, Cosrx, Some By Mi, v.v.).
   - 100 - 500 sản phẩm mỹ phẩm Skincare phổ biến nhất có chuỗi thành phần `ingredient_list_raw` chuẩn thật, giữ nguyên giá gốc USD (`price_usd`).
   - Bóc tách chuỗi thành phần INCI nạp vào bảng `ingredients` và `product_ingredients`.
   - 12 cặp quy tắc xung đột hoạt chất trong bảng `conflict_rules` (Retinol + BHA, Benzoyl Peroxide + Retinol, v.v.).
   - Nạp 1 tài khoản Admin (`admin@beautyai.vn` / `Admin@123456`) và 3 Persona khách hàng mẫu có Digital Skin ID thiết lập sẵn.

### ✅ Xong khi:
- [x] 10 bảng CSDL được tạo thành công với đầy đủ khóa chính, khóa ngoại, ràng buộc CHECK và giá trị mặc định.
- [x] Bảng `products` có tối thiểu 100 bản ghi sản phẩm thật từ dataset kèm mã `code` (đã nạp 300 sản phẩm Skincare).
- [x] Bảng `conflict_rules` có đủ 12 cặp quy tắc y khoa.

### 🔍 Lệnh kiểm chứng:
```bash
docker compose exec -T postgres psql -U beautyai -d beautyai -c "
SELECT 'products' as tbl, count(*) FROM products UNION ALL
SELECT 'ingredients', count(*) FROM ingredients UNION ALL
SELECT 'conflict_rules', count(*) FROM conflict_rules;"
```

### ⛔ Tuyệt đối không:
- Tạo bảng mà không có ràng buộc khóa ngoại (Foreign Keys) hay ràng buộc `CHECK (price_usd >= 0)`.
- Đưa bất kỳ cột nào có tên `safety_score` hay `hazard_score` vào bảng CSDL (vi phạm bất biến **INV-01**).

---

## ▸ Nhiệm vụ 1.2 — Xử lý & Đánh Chỉ Mục Tập Mẫu 1 Triệu Đánh Giá (1M Reviews)

- **Mục tiêu:** Nạp tập dữ liệu đánh giá sản phẩm lớn từ file dataset thật vào bảng `reviews` và đánh chỉ mục kép B-Tree đảm bảo truy vấn lọc theo loại da dưới **50ms**.
- **Tệp liên quan:**
  - `docs/_data/cleaned/reviews_cleaned.csv` (1.094.197 dòng đánh giá thật)
  - `scripts/import_reviews.py` hoặc console command C#.

### Các bước thực hiện chi tiết:
1. Đọc tệp đánh giá nguồn tại `docs/_data/cleaned/reviews_cleaned.csv`.
2. Tạo script import dữ liệu sử dụng lệnh `COPY` của PostgreSQL hoặc batch insert (5.000 records/lần) để nạp dữ liệu vào bảng `reviews`:
   - Các cột: `product_id` (ánh xạ qua `products.code`), `product_code`, `author_name`, `rating`, `skin_type` (chuẩn hóa sang `Combination`, `Dry`, `Oily`, `Normal`, `Unknown`), `content`, `created_at`.
3. Đánh chỉ mục kép B-Tree trên bảng `reviews`:
   ```sql
   CREATE INDEX IF NOT EXISTS idx_reviews_product_skin ON reviews(product_id, skin_type);
   CREATE INDEX IF NOT EXISTS idx_reviews_product_rating ON reviews(product_id, rating);
   CREATE INDEX IF NOT EXISTS idx_reviews_product_code ON reviews(product_code);
   ```

### ✅ Xong khi:
- [x] Bảng `reviews` nạp đầy đủ các bản ghi đánh giá tương ứng với các sản phẩm có trong hệ thống (518.771 bản ghi).
- [x] Chỉ mục B-Tree được tạo và kích hoạt thành công (`idx_reviews_product_skin`, `idx_reviews_product_rating`, `idx_reviews_product_code`).
- [x] Thời gian truy vấn kiểm chứng đạt 1.398 ms (vượt xa chuẩn < 50ms).

### 🔍 Lệnh kiểm chứng:
```bash
docker compose exec -T postgres psql -U beautyai -d beautyai -c "
EXPLAIN ANALYZE 
SELECT id, author_name, rating, content 
FROM reviews 
WHERE product_id = 1 AND skin_type = 'Oily' 
ORDER BY created_at DESC 
LIMIT 10;"
```
*Kết quả `Execution Time` bắt buộc phải nhỏ hơn 50.000 ms (thường đạt từ 1–10ms nhờ B-Tree Index).*

---

## ▸ Nhiệm vụ 1.3 — Xây dựng Backend Auth & Digital Skin ID API Thống Nhất

- **Mục tiêu:** Xây dựng toàn bộ các API xác thực, phân quyền RBAC và quản lý hồ sơ Digital Skin ID thống nhất theo thứ tự y khoa: 1. Loại da ➔ 2. Blacklist Dị ứng ➔ 3. Vấn đề da & Mục tiêu.
- **Tệp liên quan:**
  - `src/BeautyAI.Application/DTOs/SkinProfileDto.cs`
  - `src/BeautyAI.Application/Services/IAuthService.cs`
  - `src/BeautyAI.Application/Services/ISkinProfileService.cs`
  - `src/BeautyAI.Infrastructure/Services/AuthService.cs`
  - `src/BeautyAI.Infrastructure/Services/SkinProfileService.cs`
  - `src/BeautyAI.Api/Controllers/AuthController.cs`
  - `src/BeautyAI.Api/Controllers/SkinProfileController.cs`

### Các bước thực hiện chi tiết:
1. Cài đặt thuật toán băm mật khẩu an toàn PBKDF2 (HMAC-SHA256, 600,000 vòng lặp) kèm Salt ngẫu nhiên trong `AuthService.cs`.
2. Viết logic sinh và xác thực JSON Web Token (JWT) chứa Claim `NameIdentifier`, `Email`, `Role`.
3. Cài đặt các API Auth:
   - `POST /api/v1/auth/register`: Đăng ký, băm mật khẩu, lưu CSDL, trả về Token và Profile.
   - `POST /api/v1/auth/login`: Xác thực thông tin đăng nhập, trả về Token.
   - `GET /api/v1/auth/me`: Lấy thông tin tài khoản hiện tại kèm Digital Skin ID thống nhất.
   - `PUT /api/v1/auth/profile`: Cập nhật họ tên, số điện thoại, địa chỉ nhận hàng.
4. Cài đặt các API Digital Skin ID Thống Nhất:
   - `GET /api/v1/skin-profile`: Lấy trọn bộ hồ sơ Digital Skin ID bao gồm Loại da, Blacklist Dị ứng, Vấn đề da, Mục tiêu và Ngân sách.
   - `PUT /api/v1/skin-profile`: Cập nhật đồng bộ toàn bộ hồ sơ Digital Skin ID trong 1 transaction.
   - `POST /api/v1/skin-profile/allergies`: Thêm nhanh một thành phần vào Allergy Blacklist kèm ghi chú triệu chứng.
   - `DELETE /api/v1/skin-profile/allergies/{id}`: Gỡ bỏ thành phần khỏi Blacklist.

### ✅ Xong khi:
- [ ] Test đăng ký tài khoản mới thành công qua Swagger UI hoặc Postman.
- [ ] Thêm được chất dị ứng vào Blacklist và xem lại danh sách trả về đúng mã HTTP 200/201.
- [ ] Mật khẩu trong bảng `users` được băm kín, không thể dịch ngược.

### 🔍 Lệnh kiểm chứng:
```bash
./scripts/build && ./scripts/test
```

---

# TUẦN 2: GHÉP UI REACT & TRÍ TUỆ THÀNH PHẦN INCI (NGÀY 8 – 15)

---

## ▸ Nhiệm vụ 2.1 — Tích hợp Mã Nguồn React Frontend & Cấu hình API Client

- **Mục tiêu:** Đưa toàn bộ các component, trang giao diện và style từ `docs/_ui-ux_design/phase_1/frontend/` vào `src/frontend` và kết nối với Backend API.
- **Tệp liên quan:**
  - `src/frontend/src/App.jsx`
  - `src/frontend/src/context/AppContext.jsx`
  - `src/frontend/src/services/api.js`

### Các bước thực hiện chi tiết:
1. Sao chép các tệp trang (`Home.jsx`, `Products.jsx`, `ProductDetail.jsx`, `Cart.jsx`, `SkinQuiz.jsx`, `IngredientAnalyzer.jsx`, `Compare.jsx`, `Wishlist.jsx`, `Profile.jsx`, `AdminDashboard.jsx`) vào `src/frontend/src/pages/`.
2. Sao chép các component (`Navbar.jsx`, `Footer.jsx`, `ProductCard.jsx`, `AuthModal.jsx`) vào `src/frontend/src/components/`.
3. Trong `src/frontend/src/services/api.js`, cấu hình Axios hoặc Fetch trỏ tới `http://localhost:5000/api/v1` (sử dụng biến môi trường `VITE_API_BASE_URL`).
4. Khởi chạy thử nghiệm và kiểm tra build:
   ```bash
   cd src/frontend && npm install && npm run build
   ```

### ✅ Xong khi:
- [ ] Lệnh `npm run build` chạy thành công không báo lỗi TypeScript/JSX.
- [ ] Mở trình duyệt `http://localhost:5173` hiển thị trang chủ BeautyAI hoàn chỉnh với đầy đủ thanh điều hướng và chân trang.

---

## ▸ Nhiệm vụ 2.2 — Hoàn thiện Trang Catalog & Bộ Lọc "An Toàn Cho Da Tôi" (USP)

- **Mục tiêu:** Hiển thị danh mục sản phẩm, bộ lọc loại da, mức giá và công tắc loại trừ chất dị ứng.
- **Tệp liên quan:**
  - `src/BeautyAI.Api/Controllers/ProductsController.cs`
  - `src/frontend/src/pages/Products.jsx`

### Các bước thực hiện chi tiết:
1. Xây dựng endpoint `GET /api/v1/products`:
   - Tham số: `page=1`, `pageSize=16`, `skinType`, `minPrice`, `maxPrice`, `sortBy`, `safeForMe=false`.
   - Khi `safeForMe = true` và người dùng đã đăng nhập:
     ```sql
     -- Truy vấn loại bỏ sản phẩm chứa chất trong Allergy Blacklist của người dùng
     AND p.id NOT IN (
         SELECT pi.product_id 
         FROM product_ingredients pi 
         JOIN user_allergies ua ON pi.ingredient_id = ua.ingredient_id 
         WHERE ua.user_id = @CurrentUserId
     )
     ```
2. Kết nối giao diện `Products.jsx`:
   - Hiển thị công tắc Toggle: *"🛡️ An toàn cho da tôi (Tự động ẩn chất dị ứng)"*.
   - Hiển thị thẻ Chip lọc đang áp dụng và thanh trượt giá.

### ✅ Xong khi:
- [ ] Chọn filter "Da dầu" chỉ hiển thị các sản phẩm kiềm dầu/trị mụn.
- [ ] Bật toggle *"An toàn cho da tôi"*, các sản phẩm chứa thành phần dị ứng trong hồ sơ cá nhân lập tức biến mất khỏi màn hình.

---

## ▸ Nhiệm vụ 2.3 — Hoàn thiện Trang PDP, Bảng INCI & Cảnh Báo Dị Ứng Đỏ

- **Mục tiêu:** Hiển thị chi tiết sản phẩm, bảng thành phần phân loại màu, tính điểm Match Score và hiển thị banner đỏ cảnh báo dị ứng.
- **Tệp liên quan:**
  - `src/BeautyAI.Domain/Services/SuitabilityScoreCalculator.cs`
  - `src/frontend/src/pages/ProductDetail.jsx`

### Các bước thực hiện chi tiết:
1. Cài đặt thuật toán `SuitabilityScoreCalculator` trong Domain theo công thức đặc tả ở Technical Solutions Phase 1:
   - Nếu sản phẩm chứa chất dị ứng của người dùng ➔ `MatchScore = 0`, `HasAllergyWarning = true`.
   - Ngược lại ➔ Tính điểm tương thích từ 0–100% dựa trên loại da và mối quan tâm da.
2. Xây dựng endpoint `GET /api/v1/products/{slug}` trả về `ProductDetailDto`.
3. Trên giao diện `ProductDetail.jsx`:
   - Render Banner màu đỏ rực ngay phía trên nút mua hàng nếu `hasAllergyWarning == true`:
     > *"⚠️ CẢNH BÁO DỊ ỨNG: Sản phẩm này chứa **[Tên chất]** nằm trong danh sách dị ứng của bạn. Khuyến nghị không nên sử dụng!"*
   - Kèm nút bấm: *"Tìm sản phẩm thay thế an toàn"*.
   - Render bảng thành phần phân màu: Xanh lá (Dưỡng ẩm, phục hồi), Vàng (Hoạt chất mạnh), Đỏ (Cồn, hương liệu).
   - Render biểu đồ Donut Chart phân bổ tỷ lệ công năng.

### ✅ Xong khi:
- [ ] Truy cập sản phẩm có chứa chất dị ứng của tài khoản đang đăng nhập ➔ Banner đỏ xuất hiện nổi bật ngay lập tức.
- [ ] Điểm Match Score % hiển thị đúng theo loại da của người xem.

---

## ▸ Nhiệm vụ 2.4 — Hoàn thiện Công Cụ Phân Tích INCI Tự Do & So Sánh / Wishlist

- **Mục tiêu:** Cho phép người dùng dán chuỗi thành phần bao bì bất kỳ để phân tích và hoàn thiện tính năng so sánh, wishlist.
- **Tệp liên quan:**
  - `src/BeautyAI.Api/Controllers/ToolsController.cs`
  - `src/frontend/src/pages/IngredientAnalyzer.jsx`
  - `src/frontend/src/pages/Compare.jsx`
  - `src/frontend/src/pages/Wishlist.jsx`

### Các bước thực hiện chi tiết:
1. Xây dựng endpoint `POST /api/v1/tools/analyze-inci`:
   - Nhận chuỗi văn bản người dùng dán vào ô Textarea.
   - Bóc tách theo dấu phẩy, tra cứu từ điển bảng `ingredients`.
   - Trả về danh sách phân tích: Tên chất, nhãn công năng, chỉ số kích ứng, chỉ số bít tắc và cờ cảnh báo nếu trùng chất trong Allergy Blacklist.
2. Kết nối giao diện `IngredientAnalyzer.jsx` hiển thị kết quả trực quan.
3. Ghép nối thanh Drawer so sánh đáy màn hình và trang `/compare` hiển thị bảng so sánh song song 2-4 sản phẩm.
4. Hoàn thiện trang `/wishlist` lưu các sản phẩm đã thả tim.

### ✅ Xong khi:
- [ ] Dán một đoạn text thành phần bất kỳ (ví dụ: *"Water, Glycerin, Niacinamide, Alcohol Denat"*) ➔ Phân tích chính xác từng chất.
- [ ] Bảng so sánh hiển thị đầy đủ thông số và cảnh báo dị ứng trên từng cột sản phẩm.

---

# TUẦN 3: GIỎ HÀNG, PHÁT HIỆN XUNG ĐỘT & REVIEW (NGÀY 16 – 22)

---

## ▸ Nhiệm vụ 3.1 — Hoàn thiện Giỏ Hàng & Smart Conflict Detector (Core USP)

- **Mục tiêu:** Tự động phát hiện các cặp hoạt chất kỵ nhau trong giỏ hàng và đưa ra lời khuyên chia lịch sử dụng an toàn.
- **Tệp liên quan:**
  - `src/BeautyAI.Domain/Services/ConflictDetectorService.cs`
  - `src/BeautyAI.Api/Controllers/ToolsController.cs`
  - `src/frontend/src/pages/Cart.jsx`

### Các bước thực hiện chi tiết:
1. Cài đặt `ConflictDetectorService` trong Domain layer:
   - Lấy danh sách thành phần của tất cả sản phẩm trong giỏ.
   - Quét đối chiếu với 12 quy tắc trong bảng `conflict_rules`.
   - Trả về danh sách các cặp xung đột kèm giải thích khoa học và lời khuyên dùng luân phiên.
2. Xây dựng endpoint `POST /api/v1/tools/check-conflict` nhận danh sách `productIds`.
3. Trên giao diện `Cart.jsx`:
   - Khi có sản phẩm xung đột (ví dụ: Retinol + BHA), hiển thị **Khung cảnh báo viền cam nổi bật** ở đầu trang giỏ hàng.
   - Hiển thị chi tiết: Tên 2 sản phẩm, 2 hoạt chất kỵ nhau, nguy cơ tổn thương da và khuyến nghị chia lịch dùng (ví dụ: BHA tối 2-4-6, Retinol tối 3-5-7).
   - Hiển thị checkbox xác nhận: *"Tôi đã đọc và hiểu khuyến cáo sử dụng luân phiên các hoạt chất này"*.

### ✅ Xong khi:
- [ ] Thêm 1 lọ BHA và 1 lọ Retinol vào giỏ hàng ➔ Mở giỏ hàng lập tức thấy khung cảnh báo xung đột viền cam.
- [ ] Tick chọn checkbox xác nhận ➔ Nút thanh toán được kích hoạt cho phép mua hàng tiếp.

---

## ▸ Nhiệm vụ 3.2 — Luồng Thanh Toán COD & Quản Lý Đơn Hàng Cá Nhân

- **Mục tiêu:** Cho phép khách hàng nhập thông tin nhận hàng, áp dụng voucher và đặt hàng COD thành công.
- **Tệp liên quan:**
  - `src/BeautyAI.Api/Controllers/OrdersController.cs`
  - `src/frontend/src/pages/Checkout.jsx`
  - `src/frontend/src/pages/Profile.jsx`

### Các bước thực hiện chi tiết:
1. Xây dựng endpoint `POST /api/v1/orders`:
   - Kiểm tra tồn kho sản phẩm.
   - Áp dụng mã voucher nếu có (`BEAUTYAI10` giảm 10%, `FREESHIP` giảm phí ship).
   - Tạo mã đơn hàng dạng `BA-YYYYMMDD-XXXX`.
   - Lưu vào bảng `orders` và `order_items` với trạng thái `Pending`.
   - Trừ tồn kho trong bảng `products`.
2. Kết nối giao diện `Checkout.jsx`:
   - Form nhập Họ tên, SĐT, Địa chỉ nhận hàng, Ghi chú.
   - Phương thức thanh toán cố định là COD.
   - Bấm xác nhận ➔ Chuyển sang trang cảm ơn Thank You tóm tắt đơn hàng.
3. Xây dựng endpoint `GET /api/v1/orders/my-orders` và kết nối tab Đơn hàng trong trang `Profile.jsx`.

### ✅ Xong khi:
- [ ] Đặt hàng thành công 1 đơn COD ➔ Đơn xuất hiện trong CSDL và hiển thị trong lịch sử đơn hàng của người dùng.

---

## ▸ Nhiệm vụ 3.3 — Tích Hợp Lọc Đánh Giá Theo Loại Da Trên Trang PDP (Dataset 1M)

- **Mục tiêu:** Khai thác dữ liệu 1 triệu review để hiển thị đánh giá phân loại theo loại da người xem.
- **Tệp liên quan:**
  - `src/BeautyAI.Api/Controllers/ProductsController.cs`
  - `src/frontend/src/pages/ProductDetail.jsx`

### Các bước thực hiện chi tiết:
1. Xây dựng endpoint `GET /api/v1/products/{id}/reviews`:
   - Tham số: `skinType` (`Oily`, `Dry`...), `page=1`, `pageSize=10`.
   - Thực thi câu lệnh SQL tối ưu qua Dapper dựa trên index `idx_reviews_product_skin`.
2. Trên giao diện `ProductDetail.jsx`:
   - Hiển thị tab lọc review: *Tất cả*, *Da dầu*, *Da khô*, *Da hỗn hợp*, *Da nhạy cảm*.
   - Nếu người dùng đã có Digital Skin ID, tự động ưu tiên load review của nhóm cùng loại da lên đầu trang kèm huy hiệu: *"Người có làn da giống bạn nói gì"*.

### ✅ Xong khi:
- [ ] Bấm tab "Da dầu" ➔ Danh sách chuyển sang toàn bộ các bài đánh giá của người da dầu trong tích tắc (< 50ms).

---

# TUẦN 4: TRỢ LÝ AI GEMINI, ROUTINE GENERATOR, ADMIN & LAUNCH (NGÀY 23 – 30)

---

## ▸ Nhiệm vụ 4.1 — Sinh Chu Trình Routine AM/PM & Tính Năng "Chat-to-Cart"

- **Mục tiêu:** Tự động sinh chu trình Routine AM/PM dựa trên Digital Skin ID và hỗ trợ thêm cả chu trình vào giỏ hàng chỉ với 1 click.
- **Tệp liên quan:**
  - `src/BeautyAI.Domain/Services/RoutineGeneratorService.cs`
  - `src/BeautyAI.Api/Controllers/RoutineController.cs`
  - `src/frontend/src/pages/RoutineView.jsx`

### Các bước thực hiện chi tiết:
1. Cài đặt `RoutineGeneratorService` trong Domain layer:
   - Nhận thông tin từ Digital Skin ID (Loại da, Blacklist dị ứng, Vấn đề da, Ngân sách).
   - Sinh chu trình AM: Làm sạch ➔ Dưỡng ẩm ➔ **Kem chống nắng (Bắt buộc)**.
   - Sinh chu trình PM: Tẩy trang ➔ Sữa rửa mặt ➔ Serum đặc trị ➔ Kem khóa ẩm.
   - Đảm bảo 100% sản phẩm không chứa chất dị ứng và không xung đột nhau.
2. Xây dựng endpoint `POST /api/v1/routines/generate` trả về chu trình Routine.
3. Trên giao diện `RoutineView.jsx`:
   - Màn hình kết quả hiển thị chu trình AM/PM phân tầng rõ ràng.
   - Tạo nút bấm nổi bật: *"🛒 Thêm toàn bộ chu trình vào giỏ hàng"*. Bấm nút sẽ đưa trọn bộ các sản phẩm vào giỏ hàng ngay lập tức.
   - Cung cấp nút *"Lưu chu trình này"* vào CSDL bảng `saved_routines`.

### ✅ Xong khi:
- [ ] Chu trình AM/PM được sinh tự động chuẩn xác, có kem chống nắng buổi sáng và không chứa hoạt chất trong Blacklist.
- [ ] Bấm *"Thêm toàn bộ chu trình vào giỏ hàng"* ➔ Giỏ hàng có đủ các sản phẩm của chu trình.

---

## ▸ Nhiệm vụ 4.2 — Tích Hợp Trợ Lý Da Liễu AI Gemini

- **Mục tiêu:** Chatbot AI tư vấn chăm sóc da dựa trên hồ sơ cá nhân và grounding sản phẩm thực tế của sàn.
- **Tệp liên quan:**
  - `src/BeautyAI.Infrastructure/Providers/GeminiSkincareProvider.cs`
  - `src/BeautyAI.Api/Controllers/AiController.cs`
  - `src/frontend/src/pages/ExpertConsult.jsx`

### Các bước thực hiện chi tiết:
1. Cài đặt `GeminiSkincareProvider.cs` trong `BeautyAI.Infrastructure.Providers`:
   - Gọi REST API Google Gemini 1.5/2.5 Flash qua `HttpClient`.
   - Nạp API Key từ biến môi trường `GEMINI_API_KEY`.
2. Xây dựng endpoint `POST /api/v1/ai/consult`:
   - Ghép nối System Prompt với thông tin Skin ID của khách và danh mục sản phẩm nổi bật của sàn.
   - Cài đặt rào chắn y tế: Nếu phát hiện câu hỏi về bệnh da liễu nặng (chàm, vảy nến, viêm mủ), AI từ chối kê đơn và khuyên đi khám bác sĩ.
3. Kết nối giao diện chat tại `ExpertConsult.jsx` hoặc khung chat widget nổi.

### ✅ Xong khi:
- [ ] Chat thử với AI ➔ Phản hồi trong vòng dưới 3 giây.
- [ ] Sản phẩm AI gợi ý có thật trong sàn kèm link bấm mở chi tiết.
- [ ] Hỏi về bệnh chàm/vảy nến ➔ AI từ chối và khuyên đi bệnh viện da liễu.

---

## ▸ Nhiệm vụ 4.3 — Admin Dashboard Tinh Gọn

- **Mục tiêu:** Cung cấp giao diện quản trị cho Admin theo dõi chỉ số, quản lý sản phẩm và xử lý đơn hàng.
- **Tệp liên quan:**
  - `src/BeautyAI.Api/Controllers/AdminController.cs`
  - `src/frontend/src/pages/AdminDashboard.jsx`

### Các bước thực hiện chi tiết:
1. Xây dựng các API Admin:
   - `GET /api/v1/admin/kpis`: Trả về tổng sản phẩm, tổng đơn, doanh thu và số người dùng.
   - `POST /api/v1/admin/products`: Form thêm sản phẩm mới kèm ô dán chuỗi INCI thô.
   - `PATCH /api/v1/admin/orders/{id}/status`: Đổi trạng thái đơn (`Pending` ➔ `Delivering` ➔ `Completed`).
2. Kết nối giao diện `AdminDashboard.jsx`.
3. Bảo vệ toàn bộ route `/admin` bằng Authorization middleware kiểm tra role `ADMIN`.

### ✅ Xong khi:
- [ ] Đăng nhập tài khoản Admin vào được `/admin`.
- [ ] Thêm thử 1 sản phẩm mới thành công và đổi được trạng thái đơn hàng.

---

## ▸ Nhiệm vụ 4.4 — Tổng Duyệt Demo & Launch Production

- **Mục tiêu:** Đảm bảo toàn bộ kịch bản thuyết trình bảo vệ đồ án diễn ra hoàn hảo từ đầu đến cuối (Happy Path).
- **Các bước thực hiện:**
  1. Chạy toàn bộ các bài test và kiểm tra quality gate:
     ```bash
     ./scripts/build && ./scripts/test && ./syntheprise gate
     ```
  2. Thực hiện kịch bản demo mẫu từ A đến Z:
     - Bước 1: Khách hàng đăng ký tài khoản mới.
     - Bước 2: Thiết lập Digital Skin ID thống nhất: 1. Chọn Da dầu ➔ 2. Thêm Alcohol Denat vào Blacklist dị ứng ➔ 3. Chọn vấn đề Mụn & Ngân sách.
     - Bước 3: Xem Routine AM/PM tự động được sinh ra (chuẩn y khoa, né hoàn toàn cồn khô) ➔ Bấm Chat-to-Cart.
     - Bước 4: Ra Catalog bật toggle *"An toàn cho da tôi"* ➔ Sản phẩm có cồn lập tức bị ẩn.
     - Bước 5: Xem PDP ➔ Thấy bảng thành phần có màu sắc và lọc review từ những người Da dầu.
     - Bước 6: Mở công cụ Phân tích INCI tự do dán bảng thành phần bao bì bất kỳ.
     - Bước 7: Thêm 1 sản phẩm Retinol và 1 sản phẩm BHA vào giỏ ➔ Khung cảnh báo viền cam Smart Conflict Detector xuất hiện.
     - Bước 8: Mở Trợ lý AI hỏi tư vấn chu trình trị thâm ➔ AI trả lời chuẩn y khoa và gợi ý sản phẩm sàn.
     - Bước 9: Đặt hàng COD thành công.
     - Bước 10: Đăng nhập Admin duyệt đơn hàng sang `Delivering`.
  3. Chuẩn bị slide thuyết trình và đóng gói Docker Compose theo hướng dẫn.

### ✅ Xong khi:
- [ ] Kịch bản demo 10 bước chạy trơn tru, không có bất kỳ lỗi console hay crash hệ thống nào.
- [ ] Dự án sẵn sàng bảo vệ đồ án đạt kết quả xuất sắc nhất!
