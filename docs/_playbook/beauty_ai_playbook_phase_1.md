---
doc: playbook-beautyai-phase1
title: Developer Operational Playbook — BeautyAI Phase 1 MVP (30-Day Solo Sprint)
status: stable
precedence: 6
owner: Delivery Lead / Solo Dev
last_reviewed: 2026-10-26
---

# SỔ TAY THỰC THI & PHÂN RÃ TÁC VỤ — BEAUTYAI PHASE 1 (MVP)

> **Dành riêng cho Phase 1 MVP:** 30 ngày thực chiến theo chế độ **Solo Developer**.
> **Mục tiêu:** Cung cấp hướng dẫn từng bước cụ thể, rõ ràng, có tiêu chí "Xong khi" (DoD) và "Kiểm chứng" cho từng tác vụ trong 4 tuần làm việc.

---

## 1. NGUYÊN TẮC VẬN HÀNH DÀNH CHO SOLO DEVELOPER

- **Chế độ Solo Fast-Lane:** Áp dụng quy chuẩn [Solo Fast-Lane](file:///Users/trucuyen/Documents/beauty_ai/docs/_guides/91-beautyai-change-policy.md). Mỗi tính năng lớn chỉ cần tạo 1 change folder FASTLANE gọn nhẹ, tập trung 90% thời gian vào viết code và test chạy thật.
- **Quy tắc kiểm thử trước (Test-First Thinking):** Luôn xác định rõ *"Hành động gì -> Kết quả mong đợi là gì"* trước khi bắt tay viết code.
- **Không vướng vào Dependency Hell:** Giữ nguyên các thư viện đã được phê duyệt trong `docs/tech-stack.md` (chỉ dùng EF Core 10, Dapper, JWT, xUnit, openapi-fetch). Tuyệt đối không cài thêm các thư viện cồng kềnh.

---

## 2. PHÂN RÃ CHI TIẾT 24 TÁC VỤ TRỌNG TÂM TRONG 4 TUẦN

### TUẦN 1: CSDL, DỮ LIỆU & NỀN TẢNG BACKEND

#### ▸ TASK-P1-01: Thiết lập CSDL PostgreSQL 17 & Migration 10 bảng
- **Mục tiêu:** Tạo toàn bộ lược đồ CSDL chuẩn theo thiết kế `beauty_ai_tech_solutions_phase_1.md`.
- **Thực hiện:**
  - Viết Entity và `DbContextModelSnapshot` trong `BeautyAI.Infrastructure`.
  - Thực thi migration tạo 10 bảng: `users`, `skin_profiles`, `categories`, `brands`, `products`, `ingredients`, `product_ingredients`, `conflict_rules`, `orders`, `order_items`, `reviews`.
- **Xong khi:**
  - `docker compose up -d postgres` chạy sạch sẽ.
  - Chạy `psql` xác nhận 10 bảng tồn tại với đầy đủ khóa ngoại và ràng buộc `CHECK`.

#### ▸ TASK-P1-02: Seed Dữ liệu từ điển 300+ INCI & 15 Cặp Xung Đột
- **Mục tiêu:** Chuẩn bị sẵn tri thức khoa học da liễu trong CSDL.
- **Thực hiện:**
  - Viết script `DbInitializer.cs` nạp 300+ hoạt chất mỹ phẩm thông dụng (Hyaluronic Acid, Niacinamide, Retinol, Salicylic Acid, Glycolic Acid, BHA, AHA, Ceramide, Centella Asiatica, Cồn khô Alcohol Denat, Hương liệu Fragrance...).
  - Nạp 15 bộ quy tắc xung đột hoạt chất (Retinol kỵ BHA/AHA, Benzoyl Peroxide kỵ Retinoid, Vitamin C kỵ Niacinamide nồng độ cao...).
- **Kiểm chứng:** `SELECT count(*) FROM ingredients;` trả về >= 300; `SELECT count(*) FROM conflict_rules;` trả về >= 15.

#### ▸ TASK-P1-03: Seed 60 Sản phẩm mỹ phẩm mẫu & Mẫu tập 1M Review
- **Mục tiêu:** Tạo kho hàng thực tế có bảng thành phần bóc tách và nạp dữ liệu review.
- **Thực hiện:**
  - Seed 50–70 sản phẩm mỹ phẩm phổ biến (Sữa rửa mặt Cetaphil, CeraVe, SVR, La Roche-Posay; Serum The Ordinary Niacinamide, BHA Paula's Choice, Retinol Obagi, Kem chống nắng Anessa...).
  - Mỗi sản phẩm được gắn liên kết từ 10–25 thành phần INCI tương ứng vào bảng `product_ingredients`.
  - Trích xuất tập mẫu 10.000–50.000 review thực tế từ file dataset `docs/_data/processed/`, import vào bảng `reviews` kèm gán nhãn `user_skin_type`.
- **Kiểm chứng:** Query `SELECT * FROM products p JOIN product_ingredients pi ON p.id = pi.product_id` trả về danh sách thành phần đầy đủ.

#### ▸ TASK-P1-04: Backend Auth JWT & Phân quyền RBAC
- **Mục tiêu:** Hệ thống đăng ký, đăng nhập an toàn, bảo vệ route.
- **Thực hiện:**
  - Cài đặt `Pbkdf2PasswordHasher` để băm mật khẩu.
  - Cài đặt `JwtTokenService` sinh token có chứa Claim `sub`, `email`, `role` (`CUSTOMER` hoặc `ADMIN`).
  - Viết API `/api/v1/auth/register`, `/api/v1/auth/login`, `/api/v1/auth/me`.
  - Đăng ký `[Authorize(Roles = "ADMIN")]` cho các route quản trị.
- **Kiểm chứng:** Đăng ký tài khoản mới -> Đăng nhập thành công nhận JWT -> Dùng JWT truy cập `/api/v1/auth/me` trả về 200 OK.

#### ▸ TASK-P1-05: Backend Digital Skin ID & Allergy Blacklist API
- **Mục tiêu:** Quản lý hồ sơ da và danh sách chất dị ứng cá nhân.
- **Thực hiện:**
  - Viết API `GET /api/v1/skin-profile` và `PUT /api/v1/skin-profile`.
  - Hỗ trợ lưu trữ: `skin_type`, `is_sensitive`, `skin_concerns` (mảng chuỗi), và `allergy_ingredients` (mảng tên chất).
  - Viết API tìm kiếm nhanh thành phần `GET /api/v1/ingredients/search?q=...` phục vụ auto-suggest cho Allergy Blacklist.
- **Kiểm chứng:** Tạo hồ sơ da dầu + nhạy cảm + dị ứng "Alcohol Denat" -> Lưu vào DB và đọc lại chính xác.

---

### TUẦN 2: FRONTEND REACT & CÁC TÍNH NĂNG INCI CỐT LÕI

#### ▸ TASK-P1-06: Tích hợp Frontend React & Cấu hình API Client
- **Mục tiêu:** Đưa toàn bộ UI từ `docs/_ui-ux_design/phase_1/` vào hoạt động với .NET backend.
- **Thực hiện:**
  - Đồng bộ các component, styles, pages vào `src/frontend/`.
  - Cấu hình file `src/services/api.js` hoặc `openapi-fetch` trỏ về backend `http://localhost:5000/api/v1`.
  - Lưu JWT vào localStorage hoặc Cookie và tự động đính kèm header `Authorization: Bearer <token>`.
- **Kiểm chứng:** `npm run dev` chạy mượt mà trên port 5173, gọi thử API `/health` trả về status 200.

#### ▸ TASK-P1-07: Ghép Giao diện Trang chủ, Đăng ký / Đăng nhập & Profile
- **Mục tiêu:** Người dùng có thể đăng ký, đăng nhập và quản lý thông tin ngay trên web.
- **Thực hiện:**
  - Ghép `AuthModal.jsx` với API login/register.
  - Trang `Home.jsx`: Hiển thị banner, cam kết khoa học, top sản phẩm gợi ý.
  - Trang `Profile.jsx`: Form cập nhật họ tên, SĐT, địa chỉ nhận hàng.
- **Kiểm chứng:** Đăng ký tài khoản trên giao diện -> Modal tự động đăng nhập -> Header hiển thị tên người dùng.

#### ▸ TASK-P1-08: Giao diện Thiết lập Digital Skin ID & Allergy Blacklist
- **Mục tiêu:** Màn hình quản lý hồ sơ da trực quan trong trang Profile.
- **Thực hiện:**
  - Form chọn 1 trong 4 loại da (Dầu, Khô, Hỗn hợp, Thường) bằng card radio có hình minh họa.
  - Công tắc bật/tắt "Da nhạy cảm".
  - Bộ chip chọn tối đa 5 vấn đề da (Mụn, Thâm, Lão hóa, Lỗ chân lông, Dầu thừa).
  - Ô tìm kiếm chất dị ứng: Khi gõ tên chất, hiển thị dropdown gợi ý -> Bấm chọn để thêm vào danh sách chip bên dưới có nút `x` để xóa.
- **Kiểm chứng:** Thêm 2 chất dị ứng "Fragrance" và "Paraben" -> Bấm "Lưu hồ sơ" -> Tải lại trang thấy thông tin vẫn giữ nguyên.

#### ▸ TASK-P1-09: Trang Catalog, Tìm kiếm & Công tắc "An toàn cho da tôi"
- **Mục tiêu:** Khách hàng tìm kiếm mỹ phẩm và lọc loại trừ dị ứng tự động.
- **Thực hiện:**
  - Trang `Products.jsx`: Grid hiển thị sản phẩm dạng thẻ `ProductCard`.
  - Bộ lọc sidebar: Cây danh mục, lọc theo loại da, khoảng giá VND.
  - **Công tắc USP: "An toàn cho da tôi":** Khi người dùng bật switch, frontend truyền tham số `?safeForMySkin=true`. Backend tự động đọc Allergy Blacklist của user và loại bỏ các sản phẩm chứa hoạt chất dị ứng đó.
- **Kiểm chứng:** Người dùng dị ứng "Alcohol Denat" bật công tắc -> Mọi sản phẩm có cồn biến mất khỏi danh sách kết quả.

#### ▸ TASK-P1-10: Trang Chi tiết sản phẩm (PDP) & Bảng phân tích INCI
- **Mục tiêu:** Trang PDP khoa học, có điểm tương thích và cảnh báo dị ứng.
- **Thực hiện:**
  - Trang `ProductDetail.jsx`: Hiển thị ảnh, giá, mô tả, dung tích.
  - Hiển thị bảng thành phần INCI bóc tách: Phân loại nhãn công năng bằng màu sắc (Dưỡng ẩm, Làm dịu, Chống oxy hóa...).
  - Biểu đồ phân bổ tỷ lệ công năng thành phần (Donut chart hoặc thanh tiến trình).
  - Tính toán và hiển thị điểm phù hợp **Match Score (0–100%)**.
  - **Banner cảnh báo dị ứng màu đỏ:** Nếu sản phẩm có chứa chất trong Allergy Blacklist của khách -> Hiển thị hộp thông báo màu đỏ nổi bật ngay dưới tên sản phẩm: *"Cảnh báo: Sản phẩm chứa [Tên chất] có trong danh sách dị ứng của bạn"*.
- **Kiểm chứng:** Mở 1 sản phẩm chứa cồn bằng tài khoản dị ứng cồn -> Thấy banner đỏ cảnh báo xuất hiện rõ ràng.

#### ▸ TASK-P1-11: Trang Công cụ Dán & Phân tích INCI tự do
- **Mục tiêu:** Khách hàng có thể kiểm tra độ an toàn của bất kỳ chai mỹ phẩm nào họ đang có ở nhà.
- **Thực hiện:**
  - Trang `IngredientAnalyzer.jsx`: Textarea lớn cho phép paste toàn bộ đoạn text thành phần in trên vỏ hộp.
  - Backend API `/api/v1/inci/analyze` bóc tách từng chất, đối chiếu từ điển INCI và trả về kết quả.
  - Hiển thị danh sách hoạt chất kèm mã màu an toàn (Xanh: Lành tính, Vàng: Cần lưu ý liều lượng, Đỏ: Tiềm ẩn nguy cơ kích ứng).
  - Cảnh báo tức thì nếu chuỗi vừa dán chứa chất trong Blacklist của khách.
- **Kiểm chứng:** Paste đoạn text: *"Water, Glycerin, Niacinamide, Alcohol Denat, Fragrance"* -> Hệ thống phân loại chính xác cồn và hương liệu vào nhóm cảnh báo đỏ.

#### ▸ TASK-P1-12: Ghép Giao diện Bảng So sánh sản phẩm (Compare) & Wishlist
- **Mục tiêu:** Khai thác tối đa UI React đã có sẵn cho tính năng So sánh và Yêu thích.
- **Thực hiện:**
  - Kích hoạt nút icon so sánh trên `ProductCard` -> Thêm sản phẩm vào thanh `CompareBar` ghim ở chân trang (tối đa 4 sản phẩm).
  - Bấm "So sánh ngay" -> Mở trang `Compare.jsx`: Bảng so sánh side-by-side các thông số, giá bán, hoạt chất chính và điểm Match Score. Cột nào dính chất dị ứng được viền đỏ nổi bật.
  - Kích hoạt icon trái tim -> Thêm/xóa sản phẩm vào trang `Wishlist.jsx`. Nút "Thêm nhanh vào giỏ" trên từng thẻ wishlist.
- **Kiểm chứng:** Chọn 2 chai kem chống nắng -> Xem bảng so sánh thấy rõ sự khác biệt về thành phần và giá cả.

---

### TUẦN 3: GIỎ HÀNG, PHÁT HIỆN XUNG ĐỘT & ĐƠN HÀNG COD

#### ▸ TASK-P1-13: Giỏ hàng & Thuật toán Smart Conflict Detector
- **Mục tiêu:** Phát hiện và cảnh báo các cặp hoạt chất kỵ nhau trong giỏ hàng.
- **Thực hiện:**
  - Trang `Cart.jsx`: Quản lý danh sách món, nút tăng/giảm số lượng, nút xóa.
  - Khi giỏ hàng thay đổi, frontend gọi API `POST /api/v1/cart/conflicts`.
  - Backend rà soát các cặp sản phẩm đối chiếu với 15 bộ quy tắc `conflict_rules`.
  - Nếu phát hiện xung đột: Hiển thị Hộp thông báo màu vàng/cam nổi bật ngay đầu giỏ hàng:
    - Nêu rõ 2 sản phẩm kỵ nhau (Ví dụ: Serum A chứa Retinol và Toner B chứa BHA).
    - Giải thích nguyên nhân y khoa (Gây quá tải tẩy da chết, đỏ rát, bong tróc).
    - Hướng dẫn giải pháp giãn cữ: *"Khuyên dùng: Dùng Toner B vào buổi sáng, Serum A vào buổi tối"* hoặc *"Dùng xen kẽ cách ngày"*.
  - Khách hàng có thể tick chọn *"Tôi đã hiểu cảnh báo"* và tiếp tục thanh toán (không chặn quyền mua).
- **Kiểm chứng:** Thêm 1 sản phẩm chứa Retinol và 1 sản phẩm chứa BHA vào giỏ -> Hộp cảnh báo xung đột vàng cam lập tức xuất hiện.

#### ▸ TASK-P1-14: Trang Checkout COD & Áp dụng Mã giảm giá
- **Mục tiêu:** Luồng thanh toán đơn giản, phù hợp thói quen người tiêu dùng Việt Nam.
- **Thực hiện:**
  - Trang `Checkout.jsx`: Form nhập họ tên người nhận, số điện thoại (bắt buộc 10 chữ số), địa chỉ giao hàng chi tiết, ghi chú đơn hàng.
  - Tự động điền dữ liệu nếu khách đã lưu trong Profile.
  - Ô nhập mã giảm giá: Nhập `BEAUTYAI10` giảm ngay 10% tổng đơn hàng; nhập `FREESHIP` giảm 30.000₫ phí ship.
  - Phương thức thanh toán: Chọn mặc định **COD (Thanh toán tiền mặt khi nhận hàng)**.
- **Kiểm chứng:** Điền đầy đủ form -> Bấm "Xác nhận đặt hàng" -> Gọi API tạo đơn hàng thành công.

#### ▸ TASK-P1-15: Lưu Đơn hàng DB & Trang Xác nhận Đơn (Thank You)
- **Mục tiêu:** Ghi nhận đơn hàng vào CSDL và phản hồi cho khách hàng.
- **Thực hiện:**
  - Backend lưu thông tin vào 2 bảng `orders` và `order_items` trong một Database Transaction duy nhất.
  - Sinh mã đơn hàng chuẩn định dạng `ORD-YYYYMMDD-XXXX`.
  - Xóa sạch giỏ hàng sau khi đặt thành công.
  - Điều hướng người dùng đến trang Thank You: Hiển thị mã đơn, thông tin người nhận, số tiền cần thanh toán cho shipper khi nhận hàng và thông báo giao dự kiến 2–4 ngày.
- **Kiểm chứng:** Vào pgAdmin/psql kiểm tra bảng `orders` thấy xuất hiện đơn hàng mới với trạng thái `PENDING`.

#### ▸ TASK-P1-16: Lịch sử đơn hàng cá nhân trong Profile
- **Mục tiêu:** Khách hàng theo dõi tình trạng các đơn hàng của mình.
- **Thực hiện:**
  - API `GET /api/v1/orders/my-orders`: Trả về danh sách các đơn hàng của user đăng nhập.
  - Trang `Profile.jsx` tab "Đơn hàng của tôi": Hiển thị danh sách đơn dạng card, ngày đặt, tổng tiền, danh sách món và badge trạng thái (`Chờ xử lý`, `Đang giao hàng`, `Đã giao`).
- **Kiểm chứng:** Khách hàng vừa đặt đơn COD xong, vào mục Profile thấy ngay đơn hàng vừa tạo ở trạng thái `Chờ xử lý`.

#### ▸ TASK-P1-17: Tích hợp Đánh giá trên PDP: Lọc theo Loại da (Dataset 1M)
- **Mục tiêu:** Trải nghiệm đọc đánh giá cá nhân hóa từ tập dữ liệu lớn.
- **Thực hiện:**
  - Trang `ProductDetail.jsx` tab "Đánh giá": Hiển thị điểm trung bình và biểu đồ phân bổ sao.
  - **Bộ lọc Loại da:** Dropdown hoặc các nút bấm: *Tất cả*, *Da dầu*, *Da khô*, *Da nhạy cảm*, *Da hỗn hợp*.
  - Khi chọn lọc: Gọi API truy vấn bảng `reviews` có điều kiện `user_skin_type = '...'` (tận dụng index đã đánh ở Tuần 1, phản hồi < 30ms).
  - Tự động ưu tiên đưa các review của người có cùng loại da với khách lên đầu danh sách.
- **Kiểm chứng:** Chọn lọc "Chỉ xem Da dầu" -> Danh sách chỉ hiển thị các bình luận từ người có làn da dầu.

#### ▸ TASK-P1-18: Form Viết Đánh giá cho Sản phẩm
- **Mục tiêu:** Khách hàng có thể để lại nhận xét sau khi trải nghiệm sản phẩm.
- **Thực hiện:**
  - Component form đánh giá: Chọn số sao (1–5 sao), nhập nội dung bình luận, chọn loại da hiện tại của mình.
  - API `POST /api/v1/reviews` lưu đánh giá vào CSDL và tự động tính toán lại điểm rating trung bình của sản phẩm.
- **Kiểm chứng:** Gửi 1 review 5 sao kèm nhận xét "Dùng rất êm, kiềm dầu tốt" -> Review xuất hiện ngay trong danh sách đánh giá của sản phẩm.

---

### TUẦN 4: GEMINI AI, SKIN QUIZ, ADMIN DASHBOARD & TỔNG DUYỆT

#### ▸ TASK-P1-19: Backend Gateway tích hợp Google Gemini API
- **Mục tiêu:** Xây dựng cổng AI thông minh, an toàn y khoa.
- **Thực hiện:**
  - Viết `GeminiApiClient` trong `BeautyAI.Infrastructure/Providers/` kết nối Google Gemini API (model `gemini-2.5-flash`).
  - Nạp System Prompt định danh chuyên gia chăm sóc sắc đẹp BeautyAI.
  - Áp dụng Guardrails y khoa: Cấm chẩn đoán bệnh lý da liễu nặng (viêm da, chàm, vảy nến), từ chối câu hỏi ngoài luồng.
  - Grounding: Tự động đính kèm danh sách top 30 sản phẩm của sàn vào ngữ cảnh prompt để AI giới thiệu sản phẩm có thật kèm giá và link.
- **Kiểm chứng:** Gửi câu hỏi "Da tôi bị viêm da mủ có dùng được BHA không?" -> AI trả lời từ chối chẩn đoán bệnh và khuyên đến bệnh viện da liễu khám ngay.

#### ▸ TASK-P1-20: Giao diện Trợ lý AI Skincare Chatbot
- **Mục tiêu:** Widget chat thân thiện, cá nhân hóa theo Skin ID.
- **Thực hiện:**
  - Widget chat nổi ở góc dưới bên phải toàn bộ website và trang tư vấn chuyên sâu `/expert-consult`.
  - Khung chat hiển thị tin nhắn người dùng và AI, hiệu ứng đang suy nghĩ (typing indicator).
  - Tự động nạp Digital Skin ID và Allergy Blacklist vào câu hỏi chat để AI chào hỏi thân thiện và né các chất dị ứng của khách.
  - Tin nhắn AI giới thiệu sản phẩm có kèm thẻ sản phẩm nhỏ có nút "Xem chi tiết" và "Thêm vào giỏ".
- **Kiểm chứng:** Chatbot chào đúng tên người dùng và nhắc nhở: *"Chào Lan, tôi thấy bạn có làn da dầu mụn và dị ứng với Cồn, tôi sẽ chỉ gợi ý các sản phẩm không chứa cồn nhé"*.

#### ▸ TASK-P1-21: Tính năng Skin Quiz 4 câu hỏi -> Routine Builder -> Chat-to-Cart
- **Mục tiêu:** Trải nghiệm chẩn đoán da và mua cả bộ sản phẩm trong 1 nốt nhạc.
- **Thực hiện:**
  - Trang `SkinQuiz.jsx`: 4 bước trắc nghiệm trực quan:
    1. Cảm giác da sau rửa mặt (xác định loại da).
    2. Mức độ nhạy cảm (da nhạy cảm hay khỏe).
    3. Mục tiêu cải thiện da lớn nhất (Mụn, Thâm sạm, Lão hóa, Lỗ chân lông).
    4. Ngân sách dự kiến.
  - Backend tính toán sinh Routine AM/PM tối ưu, kiểm tra chéo không có cặp kỵ nhau.
  - Hiển thị kết quả Routine 2 buổi AM và PM trực quan (hình ảnh từng chai mỹ phẩm theo thứ tự bước).
  - **Nút bấm Chat-to-Cart:** 1 click duy nhất đưa toàn bộ 4–6 sản phẩm của cả routine vào giỏ hàng.
- **Kiểm chứng:** Hoàn thành quiz -> Bấm "Thêm toàn bộ Routine vào giỏ" -> Mở giỏ hàng thấy đầy đủ cả bộ sản phẩm đã được thêm vào.

#### ▸ TASK-P1-22: Admin Dashboard Tinh gọn (Product CRUD & Đơn hàng)
- **Mục tiêu:** Trang quản trị sàn cơ bản dành cho Admin.
- **Thực hiện:**
  - Trang `AdminDashboard.jsx` (được bảo vệ chỉ cho phép role `ADMIN`):
    - Thẻ thống kê: Tổng sản phẩm, Tổng đơn hàng, Doanh thu VND, Tổng người dùng.
    - Quản lý sản phẩm: Bảng danh sách, form thêm mới/chỉnh sửa sản phẩm, nhập chuỗi INCI để hệ thống tự phân tích.
    - Quản lý đơn hàng: Xem danh sách đơn COD mới, nút bấm đổi trạng thái đơn sang `SHIPPING` (Đang giao hàng) hoặc `DELIVERED` (Đã giao thành công).
- **Kiểm chứng:** Đăng nhập tài khoản admin -> Vào `/admin` -> Thêm 1 sản phẩm mới -> Ra trang chủ thấy sản phẩm xuất hiện ngay.

#### ▸ TASK-P1-23: Đóng gói Docker Compose & Diễn tập Kịch bản Thuyết trình
- **Mục tiêu:** Đảm bảo hệ thống triển khai mượt mà và sẵn sàng cho buổi bảo vệ đồ án.
- **Thực hiện:**
  - Kiểm tra script `./scripts/deploy-test` khởi chạy toàn bộ Backend .NET API, Frontend React và PostgreSQL trên Docker Compose.
  - Chạy `./scripts/test` và `./syntheprise gate` đạt 100% XANH.
  - Diễn tập kịch bản demo Happy Path 15 phút (xem Mục 3 dưới đây).
- **Kiểm chứng:** Mở máy mới, chạy `./scripts/deploy-test`, truy cập `http://localhost:5173` toàn bộ website hoạt động trơn tru.

#### ▸ TASK-P1-24: Đóng băng Mã nguồn, Gắn Tag Release & Bàn giao
- **Mục tiêu:** Hoàn tất trọn vẹn Phase 1 MVP.
- **Thực hiện:**
  - Tạo tag Git release chính thức: `v1.0.0-phase1-mvp`.
  - Push toàn bộ code và tài liệu lên repository [GitHub keplertuyen/beauty_ai](https://github.com/keplertuyen/beauty_ai).
  - Chuẩn bị slide báo cáo và video quay lại toàn bộ tính năng hoạt động.
- **Kiểm chứng:** Toàn bộ 5 job GitHub Actions trên remote XANH hoàn toàn.

---

## 3. KỊCH BẢN THUYẾT TRÌNH BẢO VỆ ĐỒ ÁN (15-MINUTE HAPPY PATH WALKTHROUGH)

Khi trình bày cho Hội đồng giám khảo hoặc Khách hàng, thực hiện tuần tự theo 8 bước kịch bản sau để thể hiện trọn vẹn sức mạnh của BeautyAI:

| Bước | Thời lượng | Thao tác thực hiện trên màn hình | Điểm nhấn cần thuyết minh (Talking Points) |
|---|---|---|---|
| **1. Mở đầu & Trang chủ** | 2 phút | Mở trang chủ BeautyAI. Lướt qua Hero banner, cam kết khoa học và danh mục sản phẩm nổi bật. | Nêu bật sự khác biệt: BeautyAI không phải sàn bán lẻ thông thường, mà là nền tảng e-commerce kết hợp phân tích da liễu thông minh. |
| **2. Digital Skin ID** | 2 phút | Đăng nhập tài khoản -> Vào Profile -> Thiết lập hồ sơ: Da dầu, Nhạy cảm, Vấn đề Mụn -> Thêm chất dị ứng "Alcohol Denat" vào Allergy Blacklist. | Nhấn mạnh tính cá nhân hóa: Mỗi người dùng có một "chứng minh thư làn da" số hóa, đồng bộ xuyên suốt hệ thống. |
| **3. Catalog & Smart Filter** | 2 phút | Vào trang Products -> Bật công tắc USP **"An toàn cho da tôi"** -> Danh sách sản phẩm tự động lọc bỏ các chai có chứa cồn. | Tính năng độc quyền giúp người dùng không bao giờ mua nhầm sản phẩm chứa chất mình bị dị ứng. |
| **4. PDP & Bảng INCI** | 2 phút | Bấm vào 1 sản phẩm -> Xem Bảng thành phần INCI, Biểu đồ công năng, Match Score (85%) -> Xem banner đỏ cảnh báo nếu cố tình chọn chai có cồn. | Phân tích thành phần minh bạch, nhãn công năng tiếng Việt dễ hiểu, tuân thủ bất biến khoa học INV-01. |
| **5. Skin Quiz & Chat-to-Cart** | 3 phút | Làm Quiz 4 câu hỏi -> Nhận Routine sáng/tối AM/PM tối ưu ngân sách -> Bấm nút **"Chat-to-Cart"** thêm cả bộ vào giỏ. | Giải quyết bài toán bối rối của người mới skincare: Đề xuất chu trình chuẩn khoa học và đưa cả bộ vào giỏ hàng trong 1 click. |
| **6. Conflict Detector & Giỏ hàng** | 2 phút | Vào Giỏ hàng -> Thêm thử 1 chai Retinol và 1 chai BHA -> Xem **Hộp cảnh báo xung đột vàng cam** xuất hiện kèm lời khuyên chia buổi AM/PM. | Tính năng bảo vệ sức khỏe người dùng: Ngăn ngừa kích ứng trước khi khách hàng thanh toán. |
| **7. Review theo da & Checkout COD** | 2 phút | Xem review trên PDP có lọc "Chỉ xem Da dầu" -> Tiến hành Checkout COD -> Nhận mã đơn hàng thành công. | Khai thác tập dữ liệu lớn 1 triệu review thực tế; phương thức thanh toán COD thân thiện với người tiêu dùng Việt Nam. |
| **8. Trợ lý AI Gemini & Admin** | 2 phút | Mở widget chat AI -> Hỏi "Da tôi mụn ẩn dùng gì?" -> AI đọc Skin ID, né cồn và giới thiệu đồ sàn -> Mở trang Admin xem đơn hàng vừa tạo. | Ứng dụng mô hình AI tạo sinh (LLM) có grounding dữ liệu sản phẩm sàn và kiểm soát an toàn y khoa nghiêm ngặt. |
