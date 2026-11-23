---
doc: plan-phase-1
title: Kế Hoạch Chi Tiết 30 Ngày (Master Plan Phase 1 MVP) — BeautyAI Platform
status: stable
precedence: 5
owner: Project Manager / Tech Lead
last_reviewed: 2026-11-23
---

# KẾ HOẠCH CHI TIẾT 30 NGÀY (MASTER PLAN) — BEAUTYAI PHASE 1 (MVP)

> **Mục tiêu:** Bản kế hoạch quản trị dự án chi tiết (Full Comprehensive Master Plan) phân bổ cho **1 Kỹ sư (Solo Developer)** phát triển và đưa vào vận hành hệ sinh thái BeautyAI hoàn chỉnh trong vòng **4 tuần (30 ngày)**, phục vụ launch Production và bảo vệ đồ án tốt nghiệp xuất sắc.
> **Quy mô thời gian:** 160 giờ làm việc chính thức + 20 giờ dự phòng (Buffer).
> **Phân kỳ:** 4 Sprint hàng tuần với các mốc kiểm định chất lượng (Quality Gates) khắt khe.

---

# 1. TỔNG QUAN NGUỒN LỰC & MỤC TIÊU DỰ ÁN

## 1.1. Mục tiêu định lượng cần đạt (Sprint Objectives & KPIs)
1. **Ngôn ngữ & Tiền tệ chuẩn hóa:**
   - 100% tiếng Anh (English) và tiền tệ USD ($) cho toàn bộ hệ thống Phase 1 (MVP). Không đa ngôn ngữ hoặc VNĐ nhằm đảm bảo tính chuẩn xác của dữ liệu mỹ phẩm quốc tế INCI và Sephora.
   - Thanh điều hướng tinh gọn: Tập trung hoàn thiện 5 USP cốt lõi (Digital Skin ID, Allergy Blacklist, INCI Analyzer, Routine Builder, Chat-to-Cart); dọn các nút phân tán (Skin Quiz, Product Compare).
2. **Hoàn thiện 100% 5 tính năng USP cốt lõi:**
   - Digital Skin ID & Allergy Blacklist hoạt động trên mọi trang với Banner đỏ cảnh báo dị ứng nổi bật.
   - Smart Conflict Detector quét chính xác 12 cặp hoạt chất kỵ nhau trong giỏ hàng.
   - INCI Analyzer bóc tách văn bản bao bì tự do chính xác.
   - Thiết lập Digital Skin ID 1 chạm (Loại da ➔ Dị ứng ➔ Vấn đề & Mục tiêu) ➔ Tự động sinh Routine AM/PM ➔ Nút bấm **Chat-to-Cart** thêm cả bộ vào giỏ.
   - Trợ lý AI Gemini tư vấn chuẩn y khoa, grounding 100% sản phẩm có trong sàn.
3. **Hiệu năng & Dữ liệu lớn (High Performance & Scale):**
   - Loại bỏ hoàn toàn Cartesian explosion trong EF Core: Thời gian tải danh mục Catalog giảm từ **33.584ms xuống 80ms** (nhanh gấp 410 lần); trang chi tiết sản phẩm PDP đạt **12ms**.
   - Endpoint `GET /api/v1/products/{id}/reviews` tích hợp B-Tree index giúp truy vấn phân trang đánh giá thực tế trong vòng **< 15ms**.
   - Lộ trình mở rộng hợp nhất 3 tầng kiến trúc (Taxonomy ➔ AI Guardrails ➔ Dynamic UI) sẵn sàng tiếp nhận 8.494 sản phẩm và 1.094.197 reviews.
4. **Luồng E-Commerce hoàn chỉnh:**
   - Khách vãng lai ➔ Đăng ký tài khoản ➔ Thiết lập Digital Skin ID (kèm Blacklist Dị ứng) ➔ Duyệt Catalog ➔ Xem PDP ➔ Thêm giỏ hàng cảnh báo xung đột ➔ Đặt hàng COD ➔ Admin duyệt đơn.
5. **Chất lượng mã nguồn:**
   - Toàn bộ 12 bài kiểm thử kiến trúc `BeautyAI.ArchitectureTests` và 46 bài unit tests (`BeautyAI.UnitTests`) XANH 100%.
   - `./syntheprise gate` đạt trạng thái **Clean** (0 lỗi, 0 cảnh báo).

## 1.2. Phân bổ ngân sách thời gian cho Solo Developer
- **Tổng thời lượng:** 30 ngày lịch = 4 tuần làm việc.
- **Định mức:** 40 giờ/tuần (8 giờ/ngày × 5 ngày/tuần).
- **Tổng thời gian phân bổ:** 160 giờ làm việc trực tiếp + 20 giờ dự phòng cuối tuần = **180 giờ**.

---

# 2. BẢN ĐỒ TIẾN ĐỘ TỔNG THỂ (4-WEEK SPRINT ROADMAP)

```mermaid
flowchart LR
    subgraph W1["TUẦN 1: CSDL & DỮ LIỆU (40h)"]
        T11["T1.1 CSDL 10 bảng (12h)"] --> T12["T1.2 Seed Data 50 SP (8h)"]
        T12 --> T13["T1.3 Import 1M Reviews (8h)"]
        T13 --> T14["T1.4 Backend Auth & Skin ID (12h)"]
    end

    subgraph W2["TUẦN 2: GHÉP UI & CORE INCI (40h)"]
        T21["T2.1 Tích hợp React UI (8h)"] --> T22["T2.2 Catalog & Lọc an toàn (10h)"]
        T22 --> T23["T2.3 PDP & Bảng INCI 3 tầng (12h)"]
        T23 --> T24["T2.4 Công cụ Phân tích INCI (6h)"]
        T24 --> T25["T2.5 Danh sách yêu thích Wishlist (4h)"]
    end

    subgraph W3["TUẦN 3: E-COMMERCE & CONFLICT (40h)"]
        T31["T3.1 Giỏ hàng & Smart Conflict (14h)"] --> T32["T3.2 Checkout COD (10h)"]
        T32 --> T33["T3.3 Lịch sử đơn hàng Profile (6h)"]
        T33 --> T34["T3.4 Tích hợp Review 1M trên PDP (10h)"]
    end

    subgraph W4["TUẦN 4: AI, ADMIN & LAUNCH (40h)"]
        T41["T4.1 Routine Generator & Chat-to-Cart (12h)"] --> T42["T4.2 Trợ lý Gemini AI Chatbot (10h)"]
        T42 --> T43["T4.3 Admin Dashboard tinh gọn (10h)"]
        T43 --> T44["T4.4 Tổng duyệt Demo & Slide (8h)"]
    end

    W1 --> W2 --> W3 --> W4
```

---

# 3. KẾ HOẠCH PHÂN RÃ CHI TIẾT THEO TUẦN (WORK BREAKDOWN STRUCTURE)

---

## 3.1. SPRINT 1: NỀN TẢNG CSDL, DỮ LIỆU LỚN & XÁC THỰC (40 Giờ)
- **Thời gian:** Ngày 1 đến Ngày 7.
- **Mục tiêu:** Xây dựng xong toàn bộ kiến trúc CSDL PostgreSQL, hoàn thành import dữ liệu lớn và cụm API Auth + Digital Skin ID.

| Mã Task | Tên nhiệm vụ | Thời lượng | Đầu vào kỹ thuật | Đầu ra nghiệm thu |
|---|---|---|---|---|
| **T1.1** | **Khởi tạo Schema CSDL PostgreSQL 17** | 12 giờ | `docs/_tech-solutions/beauty_ai_tech_solutions_phase_1.md` | 10 bảng CSDL tạo thành công qua EF Core Migration hoặc SQL Script; cấu hình khóa ngoại và ràng buộc CHECK. |
| **T1.2** | **Xây dựng bộ Seed Data mỹ phẩm chuẩn** | 8 giờ | Danh mục sản phẩm & 12 quy tắc xung đột | 10 thương hiệu, 50 sản phẩm thực tế có đầy đủ chuỗi thành phần INCI, 150 hoạt chất hóa học, 12 cặp quy tắc xung đột. |
| **T1.3** | **Xử lý & Đánh chỉ mục tập mẫu 1M Reviews** | 8 giờ | File CSV tại `docs/_data/processed/` | Bảng `reviews` nạp đầy đủ dữ liệu mẫu; B-Tree index trên `(product_id, skin_type)` giúp query lọc dưới **50ms**. |
| **T1.4** | **Xây dựng API Auth & Digital Skin ID** | 12 giờ | C# .NET 10 Web API | Đăng ký, Đăng nhập (JWT), Đổi mật khẩu, Cập nhật thông tin, Cập nhật hồ sơ da, Thêm/Xóa Allergy Blacklist. |

🎯 **MỐC QUALITY GATE 1 (Cuối Tuần 1):**
- [x] Docker PostgreSQL 17 chạy ổn định tại port 5432.
- [x] 100% API Auth & Skin Profile test qua Swagger/Postman đạt Status 200 OK.
- [x] `./scripts/test` chạy XANH toàn bộ các bài test kiến trúc.

---

## 3.2. SPRINT 2: GHÉP NỐI GIAO DIỆN REACT & TRÍ TUỆ THÀNH PHẦN INCI (40 Giờ)
- **Thời gian:** Ngày 8 đến Ngày 15.
- **Mục tiêu:** Tích hợp toàn bộ giao diện từ `docs/_ui-ux_design/phase_1/frontend/` vào `src/frontend`, kết nối API duyệt sản phẩm và công cụ bóc tách INCI.

| Mã Task | Tên nhiệm vụ | Thời lượng | Đầu vào kỹ thuật | Đầu ra nghiệm thu |
|---|---|---|---|---|
| **T2.1** | **Ghép nối mã nguồn React Frontend** | 8 giờ | Thư mục `docs/_ui-ux_design/phase_1/frontend/` | Đưa các component, CSS, trang vào `src/frontend`; cấu hình base API URL; chạy `npm run build` thành công. |
| **T2.2** | **Hoàn thiện Trang Catalog & Bộ lọc an toàn** | 10 giờ | `Products.jsx` & API `GET /api/v1/products` | Lọc theo loại da, mức giá; Công tắc toggle *"Safe For My Skin"* tự động ẩn toàn bộ sản phẩm dính chất dị ứng và các mỹ phẩm thiếu bảng INCI từ hãng (vẫn giữ dụng cụ vật lý `Tools & Brushes`). |
| **T2.3** | **Hoàn thiện Trang PDP & Bảng INCI 3 tầng** | 12 giờ | `ProductDetail.jsx` & API chi tiết SP | Bảng INCI 3 tầng (Key Notable Ingredients 3–6 chất + Functional Role Groups + Full Packaging INCI thu gọn); Kết luận dạng chữ (`Suitability Verdict`); **Banner đỏ cảnh báo dị ứng cá nhân**. |
| **T2.4** | **Hoàn thiện Công cụ Phân tích INCI theo Vùng chăm sóc** | 6 giờ | `IngredientAnalyzer.jsx` & API `[Authorize]` | Bắt buộc đăng nhập (Blurred Preview Gate) + Popup thiết lập Skin ID 30 giây; Nhận diện 7 vùng chăm sóc (`TargetCareArea`); Phân loại Hương liệu/Cồn béo 3 mức độ. |
| **T2.5** | **Hoàn thiện Danh sách yêu thích (Wishlist)** | 4 giờ | `Wishlist.jsx`, `AppContext.jsx` | Thả tim/bỏ tim sản phẩm trên Catalog & PDP; Hiển thị danh sách yêu thích kèm kết luận `Suitability Verdict` và cảnh báo dị ứng; Nút *Clear All* (Product Compare chuyển sang Phase 2). |

🎯 **MỐC QUALITY GATE 2 (Cuối Tuần 2):**
- [x] Người dùng xem được danh mục, lọc theo loại da và công tắc an toàn hoạt động chính xác.
- [x] Trang PDP hiển thị bảng INCI 3 tầng dễ hiểu, kết luận dạng chữ và banner cảnh báo đỏ xuất hiện khi trùng chất dị ứng.
- [x] Công cụ phân tích thành phần yêu cầu đăng nhập/Skin ID và bóc tách chuẩn xác theo từng vùng chăm sóc.

---

## 3.3. SPRINT 3: THƯƠNG MẠI ĐIỆN TỬ, PHÁT HIỆN XUNG ĐỘT & REVIEW (40 Giờ)
- **Thời gian:** Ngày 16 đến Ngày 22.
- **Mục tiêu:** Hoàn thiện trọn vẹn luồng mua sắm COD, thuật toán phát hiện xung đột trong giỏ hàng và tích hợp lọc đánh giá 1M reviews.

| Mã Task | Tên nhiệm vụ | Thời lượng | Đầu vào kỹ thuật | Đầu ra nghiệm thu |
|---|---|---|---|---|
| **T3.1** | **Giỏ hàng & Smart Conflict Detector (USP)** | 14 giờ | `Cart.jsx` & `ConflictDetectorService` | Quét tự động giỏ hàng; Khung cảnh báo viền cam nổi bật khi có cặp kỵ nhau (vd: Retinol + BHA); Đưa ra lời khuyên chia lịch sáng/tối; Checkbox xác nhận mua tiếp. |
| **T3.2** | **Thanh toán COD (Cash on Delivery)** | 10 giờ | `Checkout.jsx` & API `POST /api/v1/orders` | Form nhập địa chỉ nhận hàng; Thanh toán COD trực tiếp không qua mã giảm giá; Tạo đơn hàng COD (`BA-YYYYMMDD-XXXX`), trừ tồn kho và hiển thị màn hình xác nhận Thank You. |
| **T3.3** | **Lịch sử đơn hàng cá nhân** | 6 giờ | `Profile.jsx` & API my-orders | Danh sách các đơn hàng đã đặt, mã đơn, tổng tiền USD ($), danh sách sản phẩm và trạng thái đơn. |
| **T3.4** | **Tích hợp Reviews 1M trên trang PDP** | 10 giờ | Bảng `reviews` đã đánh chỉ mục B-Tree | Hiển thị điểm sao trung bình; Tab lọc đánh giá theo loại da (*"Xem người có DA DẦU nói gì"*); Ưu tiên bài viết cùng loại da với khách. |

🎯 **MỐC QUALITY GATE 3 (Cuối Tuần 3):**
- [x] Luồng mua sắm thông suốt từ thêm giỏ hàng ➔ giỏ hàng cảnh báo xung đột ➔ đặt hàng COD thành công.
- [x] Danh sách review trên PDP lọc theo loại da siêu tốc dưới 50ms nhờ B-Tree index.

---

## 3.4. SPRINT 4: TRỢ LÝ AI GEMINI, ROUTINE GENERATOR, ADMIN & TỔNG DUYỆT DEMO (40 Giờ)
- **Thời gian:** Ngày 23 đến Ngày 30.
- **Mục tiêu:** Hoàn thiện 2 tính năng "Wow" (Routine Generator Chat-to-Cart và Gemini AI Chatbot), trang Admin Console và đóng gói kịch bản bảo vệ đồ án.

| Mã Task | Tên nhiệm vụ | Thời lượng | Đầu vào kỹ thuật | Đầu ra nghiệm thu |
|---|---|---|---|---|
| **T4.1** | **Routine Generator & Nút "Chat-to-Cart"** | 12 giờ | `RoutineView.jsx` & Domain Routine Generator | Thuật toán sinh Routine AM/PM tự động từ Digital Skin ID; Nút **Chat-to-Cart** thêm cả bộ vào giỏ trong 1 click; Lưu routine vào `saved_routines`. |
| **T4.2** | **Tích hợp Trợ lý Da liễu AI (Gemini API)** | 10 giờ | `GeminiSkincareProvider` trong Infrastructure | Khung chat AI; Grounding danh mục sản phẩm của sàn; Cá nhân hóa theo Skin ID; Rào chắn y tế không chẩn đoán bệnh nặng. |
| **T4.3** | **Admin Dashboard & Product CRUD hoàn chỉnh** | 10 giờ | `AdminDashboard.jsx`, `AdminProductSection.jsx`, `ProductFormModal.jsx` & `AdminProductService` | 4 thẻ KPI tổng quan; CRUD sản phẩm hoàn chỉnh (Liệt kê/Tìm kiếm/Lọc/Phân trang, Thêm mới, Sửa giá/tồn kho/INCI tự đồng bộ `product_ingredients`, Ngừng bán soft-delete `selling_status = Discontinued` & Khôi phục); Bảo vệ `[Authorize(Roles = "Admin")]` + `AdminBootstrapper` từ biến môi trường; Đổi trạng thái đơn hàng (`Pending` ➔ `Delivering` ➔ `Completed` / `Cancelled`). |
| **T4.4** | **Tổng duyệt Demo, Slide & Launch PROD** | 8 giờ | Toàn bộ hệ thống | Kiểm tra `./syntheprise gate` Clean; Chạy thử nghiệm kịch bản Happy Path Demo từ A đến Z; Chuẩn bị slide và tài liệu thuyết minh. |

🎯 **MỐC QUALITY GATE 4 (Cuối Tuần 4 — Bàn Giao & Launch):**
- [x] Toàn bộ hệ sinh thái chạy mượt mà không lỗi.
- [x] Kịch bản thuyết trình bảo vệ đồ án diễn ra trơn tru từ A đến Z.
- [x] `./syntheprise gate` và `./scripts/test` XANH 100%.

---

# 4. KẾ HOẠCH QUẢN TRỊ RỦI RO CHI TIẾT (RISK REGISTER CHO SOLO DEV)

| Rủi ro tiềm ẩn | Mức độ | Khả năng xảy ra | Kế hoạch phòng ngừa & Xử lý (Fallback Strategy) |
|---|---|---|---|
| **1. Quá tải thời gian (Solo Dev bị chậm tiến độ)** | Cao | Trung bình | **Phương án:** Ưu tiên tuyệt đối 5 tính năng USP và luồng mua hàng COD. Nếu tuần 3 bị chậm, tính năng Voucher nâng cao và phân trang review phức tạp sẽ được cắt giảm ngay lập tức. |
| **2. Gián đoạn kết nối Gemini API / Hết hạn Quota** | Trung bình | Trung bình | **Phương án:** Cài đặt cơ chế In-memory Cache cho các câu hỏi phổ biến. Nếu API Gemini trả về lỗi (429 Quota Exceeded), hệ thống tự động fallback sang phản hồi mẫu dựa trên bộ quy tắc cứng (Rule-based) mà không làm sập giao diện chat. |
| **3. Hiệu năng truy vấn 1 triệu review bị chậm** | Cao | Thấp | **Phương án:** Đánh chỉ mục kép B-Tree `idx_reviews_product_skin` ngay từ Tuần 1. Nếu trên máy Mac cấu hình thấp chạy Docker bị chậm, giới hạn tập dữ liệu nạp vào khoảng 100.000 reviews đại diện có đầy đủ 4 loại da. |
| **4. Lỗi sai lệch kiểu dữ liệu Frontend - Backend** | Trung bình | Thấp | **Phương án:** Áp dụng hợp đồng [ADR-008](file:///Users/trucuyen/Documents/beauty_ai/docs/adr/ADR-008-openapi-generated-dto.md): DTO frontend được sinh tự động từ OpenAPI qua lệnh `npm run gen:api`. Job CI `openapi-drift` sẽ chặn ngay nếu có bất kỳ sai lệch nào. |
| **5. Vi phạm bất biến kiến trúc INV-01** | Nghiêm trọng | Thấp | **Phương án:** Bài test `NoSafetyScoreAnywhereTests` tự động quét toàn bộ mã nguồn mỗi khi chạy `./scripts/test`, đảm bảo không bao giờ xuất hiện thuộc tính `SafetyScore`. |
