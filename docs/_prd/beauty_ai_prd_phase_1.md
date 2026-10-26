---
doc: prd-phase-1
title: Product Requirements Document (PRD) — BeautyAI Phase 1 (MVP Launch)
status: stable
precedence: 3
owner: BA / Product Owner
last_reviewed: 2026-10-26
---

# PRODUCT REQUIREMENTS DOCUMENT (PRD) — BEAUTYAI PHASE 1 (MVP)

> **Mục tiêu:** Định nghĩa phạm vi chức năng, yêu cầu nghiệp vụ và điều kiện nghiệm thu cho **Phase 1 MVP (30 ngày)**, phục vụ ra mắt hệ sinh thái thương mại điện tử mỹ phẩm & AI da liễu hoàn chỉnh, sẵn sàng launch Production và bảo vệ đồ án tốt nghiệp xuất sắc.
> **Mô hình vận hành:** Solo Developer (1 kỹ sư đảm nhận toàn trình) kết hợp AI Coding Agent (Antigravity).

---

## 1. Tầm Nhìn & Chiến Lược Cắt Gọt Phạm Vi (Scope Strategy)

### 1.1. Mục tiêu cốt lõi của Phase 1 MVP
1. **Làm nổi bật tuyệt đối 5 tính năng USP (Unique Selling Propositions):**
   - **Digital Skin ID & Allergy Blacklist:** Hồ sơ da cá nhân hóa và cảnh báo dị ứng xuyên suốt.
   - **Smart Conflict Detector:** Phát hiện xung đột hoạt chất trong giỏ hàng và chu trình routine.
   - **INCI Analyzer:** Công cụ phân tích thành phần tự do qua sao chép bao bì.
   - **Skin Quiz & Routine Builder (Chat-to-Cart):** Chẩn đoán da 4 bước và tạo chu trình AM/PM thêm cả bộ vào giỏ.
   - **Trợ lý AI Gemini:** Tư vấn mỹ phẩm dựa trên hồ sơ da và grounding sản phẩm thực tế.
2. **Khai thác tối đa tài nguyên có sẵn:**
   - Tập dữ liệu **1 triệu đánh giá (1M Reviews)**: Lọc đánh giá theo loại da của người dùng.
   - Giao diện **React sẵn có** (`docs/_ui-ux_design/phase_1/frontend/`): Trang so sánh sản phẩm, Wishlist, giỏ hàng.
3. **Cắt giảm tối đa tải phụ trợ (Chuyển sang Phase 2):**
   - Không tích hợp Zalo OA, không gửi email SMTP (thay bằng thông báo tức thời trên UI).
   - Không đa tiền tệ (chốt chuẩn duy nhất VNĐ).
   - Không mạng xã hội OAuth (dùng Email/Password chuẩn).
   - Không Redis/Hangfire/Message Queue phức tạp (áp dụng [ADR-009](file:///Users/trucuyen/Documents/beauty_ai/docs/adr/ADR-009-no-redis-mq-hangfire-tier1.md)).

---

## 2. Danh Sách Chi Tiết 14 Module Chức Năng Phase 1 (MVP)

### Module 01: Tài Khoản & Xác Thực (Authentication & RBAC)
- **FR-AUTH-01 (Đăng ký tài khoản):** Người dùng đăng ký bằng Email, Mật khẩu (tối thiểu 8 ký tự), Họ tên, Số điện thoại.
- **FR-AUTH-02 (Đăng nhập):** Xác thực Email/Mật khẩu. Sử dụng JWT hoặc HTTP-only Cookie an toàn.
- **FR-AUTH-03 (Đăng xuất):** Hủy phiên đăng nhập.
- **FR-AUTH-04 (Đổi mật khẩu):** Cho phép người dùng đổi mật khẩu khi đã xác thực mật khẩu cũ.
- **FR-AUTH-05 (Hồ sơ người dùng):** Xem và cập nhật thông tin cá nhân (Họ tên, SĐT, Ngày sinh, Địa chỉ giao hàng).
- **FR-AUTH-06 (Phân quyền RBAC):** 2 vai trò chuẩn: `CUSTOMER` (khách hàng mua sắm) và `ADMIN` (quản trị sàn). Chặn truy cập trái phép bằng Authorization Middleware.

### Module 02: Danh Mục, Tìm Kiếm & Bộ Lọc Thông Minh (Catalog & Smart Filter)
- **FR-CAT-01 (Duyệt danh mục):** Cây danh mục 2 cấp (Chăm sóc da ➔ Làm sạch, Dưỡng ẩm, Đặc trị, Chống nắng).
- **FR-CAT-02 (Tìm kiếm đa năng):** Tìm kiếm theo tên sản phẩm, thương hiệu hoặc từ khóa hoạt chất (ví dụ: "Niacinamide", "BHA").
- **FR-CAT-03 (Bộ lọc cơ bản):** Lọc theo loại da (Dầu, Khô, Hỗn hợp, Nhạy cảm) và thanh trượt khoảng giá VNĐ.
- **FR-CAT-04 (Sắp xếp sản phẩm):** Sắp xếp theo giá tăng/giảm, điểm đánh giá sao cao nhất, độ phổ biến.
- **FR-CAT-05 (Quản lý Chip lọc):** Hiển thị danh sách các điều kiện lọc đang chọn, cho phép xóa từng chip hoặc "Xóa tất cả".
- **FR-CAT-06 (Bộ lọc độc quyền "An toàn cho da tôi" - USP):** Công tắc toggle chỉ hiển thị với user đã đăng nhập có Digital Skin ID. Khi bật, tự động ẩn tất cả sản phẩm chứa thành phần trong `Allergy Blacklist` của họ.

### Module 03: Trang Chi Tiết Sản Phẩm (PDP) & Phân Tích INCI
- **FR-PDP-01 (Thông tin sản phẩm):** Tên, thương hiệu, hình ảnh, giá niêm yết, mô tả chi tiết, dung tích, tình trạng tồn kho.
- **FR-PDP-02 (Bảng thành phần INCI chuẩn hóa):** Danh sách thành phần theo thứ tự nồng độ, kèm nhãn công năng tiếng Việt (Dưỡng ẩm, Phục hồi, Tẩy da chết, Chống oxy hóa).
- **FR-PDP-03 (Điểm tương thích Match Score):** Tính toán độ phù hợp theo % (0–100%) giữa sản phẩm và Digital Skin ID của người xem.
- **FR-PDP-04 (Biểu đồ tỷ lệ công năng):** Hiển thị trực quan tỷ lệ % các nhóm công dụng của sản phẩm (Donut Chart / Progress Bar).
- **FR-PDP-05 (Cảnh báo dị ứng cá nhân trên PDP - USP):** Nếu sản phẩm chứa chất trong Allergy Blacklist của user, hiển thị ngay banner đỏ cảnh báo nổi bật: *"Sản phẩm chứa [Tên hoạt chất] nằm trong danh sách dị ứng của bạn"*.
- **FR-PDP-06 (Hướng dẫn sử dụng & Routine Slot):** Gợi ý dùng buổi Sáng (AM) hay Tối (PM), thứ tự bước trong chu trình.
- **FR-PDP-07 (Tương tác nhanh):** Nút Thêm vào giỏ, nút Lưu Wishlist và nút Đưa vào khay So sánh.
- **FR-PDP-08 (Sản phẩm tương tự):** Gợi ý 4 sản phẩm cùng phân loại/công dụng.

### Module 04: Digital Skin ID & Quản Lý Dị Ứng (Core USP)
- **FR-SKIN-01 (Thiết lập hồ sơ da):** Người dùng chọn Loại da chính (`Dầu`, `Khô`, `Hỗn hợp`, `Thường`), Công tắc `Da nhạy cảm`, và tối đa 5 Vấn đề da (`Mụn`, `Thâm sạm`, `Lỗ chân lông`, `Lão hóa`, `Mất nước`).
- **FR-SKIN-02 (Allergy Blacklist):** Ô tìm kiếm hoạt chất có auto-suggest từ từ điển INCI. Cho phép thêm/xóa các chất gây dị ứng vào danh sách đen cá nhân.
- **FR-SKIN-03 (Cảnh báo dị ứng xuyên suốt):** Đồng bộ trạng thái cảnh báo trên Product Card, PDP, Giỏ hàng, Kết quả Quiz và AI Chatbot.
- **FR-SKIN-04 (Gợi ý sản phẩm thay thế):** Nút *"Tìm sản phẩm thay thế"* tự động chuyển sang trang Catalog lọc các sản phẩm tương đương không chứa chất dị ứng.

### Module 05: Skin Quiz & Routine Builder (Chat-to-Cart) (Core USP)
- **FR-QUIZ-01 (Chẩn đoán da 4 bước):**
  - Bước 1: Cảm giác da sau khi rửa mặt 30 phút.
  - Bước 2: Vấn đề da ưu tiên cải thiện nhất.
  - Bước 3: Mức độ nhạy cảm và phản ứng với mỹ phẩm.
  - Bước 4: Khoảng ngân sách dự kiến.
- **FR-QUIZ-02 (Tạo chu trình Routine AM/PM):**
  - **AM:** Sữa rửa mặt ➔ Cân bằng/Serum ➔ Kem dưỡng ẩm ➔ **Kem chống nắng (Bắt buộc)**.
  - **PM:** Tẩy trang ➔ Sữa rửa mặt ➔ Serum đặc trị ➔ Kem khóa ẩm.
- **FR-QUIZ-03 (Kiểm tra xung đột nội tại Routine):** Đảm bảo các sản phẩm gợi ý trong cùng buổi không có hoạt chất tương xung.
- **FR-QUIZ-04 (Chat-to-Cart - Tính năng Wow):** Nút bấm *"Thêm toàn bộ Routine vào giỏ"* (đưa cả 3–5 sản phẩm vào giỏ hàng chỉ với 1 cú click).
- **FR-QUIZ-05 (Lưu Routine):** Lưu chu trình đã gợi ý vào trang cá nhân của người dùng.

### Module 06: Công Cụ Phân Tích Thành Phần Tự Do (INCI Analyzer)
- **FR-INCI-01 (Dán văn bản thành phần):** Ô Textarea cho phép người dùng dán toàn bộ văn bản in trên bao bì của bất kỳ sản phẩm nào.
- **FR-INCI-02 (Bóc tách & Tra cứu):** Bóc tách danh sách thành phần theo dấu phẩy, tra cứu từ điển CSDL thành phần INCI.
- **FR-INCI-03 (Đánh giá mức độ lành tính):** Đánh dấu màu Xanh lá (An toàn/Dưỡng chất), Vàng (Hoạt chất mạnh cần lưu ý), Đỏ (Cồn khô, hương liệu, nguy cơ kích ứng cao), cảnh báo bít tắc lỗ chân lông (Comedogenic).
- **FR-INCI-04 (Đối chiếu Allergy Blacklist):** Báo động ngay nếu bảng thành phần vừa dán chứa chất trong danh sách dị ứng của người dùng.

### Module 07: Phát Hiện Xung Đột Hoạt Chất (Smart Conflict Detector) (Core USP)
- **FR-CONF-01 (Quét xung đột trong giỏ hàng):** Tự động phát hiện khi giỏ hàng chứa từ 2 sản phẩm trở lên có hoạt chất kỵ nhau theo bảng 12 quy tắc khoa học (như `Retinol` + `AHA/BHA`, `Benzoyl Peroxide` + `Retinoid`, `Vitamin C` + `Niacinamide nồng độ cao`).
- **FR-CONF-02 (Cảnh báo & Lời khuyên chia lịch):** Khung cảnh báo viền vàng/cam giải thích cơ chế xung đột (nguy cơ kích ứng, triệt tiêu công năng) và đề xuất phương án dùng luân phiên (ví dụ: dùng BHA tối 2-4-6, Retinol tối 3-5-7).
- **FR-CONF-03 (Quyền tiếp tục mua hàng):** Không cấm mua, người dùng tick chọn *"Tôi đã hiểu cảnh báo"* để tiếp tục thanh toán.

### Module 08: So Sánh Sản Phẩm (Product Comparison)
- **FR-COMP-01 (Khay so sánh Drawer):** Chọn tối đa 3-4 sản phẩm cùng loại vào thanh ghim đáy màn hình.
- **FR-COMP-02 (Bảng so sánh chi tiết):** So sánh giá bán, thể tích, thành phần hoạt chất chính, điểm Match Score theo hồ sơ da.
- **FR-COMP-03 (Điểm nhấn cảnh báo):** Đánh dấu đỏ trực tiếp lên cột sản phẩm nếu chứa chất dị ứng của người xem.

### Module 09: Danh Sách Yêu Thích (Wishlist)
- **FR-WISH-01 (Lưu yêu thích):** Thả tim sản phẩm từ trang Danh mục hoặc PDP.
- **FR-WISH-02 (Quản lý Wishlist):** Trang `/wishlist` hiển thị danh sách sản phẩm đã lưu, tình trạng giá và tồn kho.
- **FR-WISH-03 (Chuyển vào giỏ):** Thêm nhanh từng sản phẩm từ Wishlist vào giỏ hàng.

### Module 10: Giỏ Hàng & Thanh Toán COD (Cart & Checkout)
- **FR-CART-01 (Quản lý giỏ hàng):** Tăng/giảm số lượng, xóa sản phẩm, tính tổng tiền hàng.
- **FR-CART-02 (Áp dụng mã giảm giá):** Ô nhập mã voucher đơn giản (hỗ trợ mã cố định như `BEAUTYAI10`, `FREESHIP`).
- **FR-CART-03 (Thanh toán COD):** Form nhập thông tin nhận hàng (Họ tên, SĐT, Địa chỉ, Ghi chú), chọn phương thức Thanh toán khi nhận hàng (COD).
- **FR-CART-04 (Tạo đơn hàng & Thank You Page):** Sinh mã đơn hàng, ghi nhận vào CSDL, hiển thị trang tóm tắt đơn đặt hàng.
- **FR-CART-05 (Lịch sử đơn hàng cá nhân):** Người dùng xem lại các đơn hàng đã đặt và trạng thái giao dịch (`Chờ xử lý`, `Đang giao`, `Hoàn thành`).

### Module 11: Trợ Lý Da Liễu AI (AI Skincare Assistant)
- **FR-AI-01 (Giao diện Chat):** Khung chat widget nổi tại trang chủ hoặc trang `/chat`.
- **FR-AI-02 (Tích hợp Google Gemini API):** Kết nối Gemini 1.5/2.5 Flash API với độ trễ thấp (< 2 giây).
- **FR-AI-03 (Grounding danh mục sản phẩm):** Khi đề xuất sản phẩm, AI chỉ đưa ra các sản phẩm thực tế có trong CSDL sàn kèm hình ảnh và link.
- **FR-AI-04 (Cá nhân hóa hồ sơ da):** AI tự động đọc Digital Skin ID và Allergy Blacklist của người dùng để loại bỏ sản phẩm kỵ.
- **FR-AI-05 (Guardrail an toàn y tế):** System prompt nghiêm cấm chẩn đoán bệnh da liễu nặng (viêm da mủ, chàm, vảy nến), bắt buộc khuyên người dùng đi khám bác sĩ chuyên khoa nếu phát hiện dấu hiệu bệnh lý.

### Module 12: Đánh Giá & Khai Thác Dataset 1 Triệu Reviews
- **FR-REV-01 (Hiển thị đánh giá trên PDP):** Điểm trung bình sao (1–5) và danh sách reviews từ tập mẫu dataset 1 triệu records.
- **FR-REV-02 (Lọc review theo loại da - Tính năng giá trị):** Cho phép người xem lọc reviews: *"Chỉ xem đánh giá từ người có DA DẦU"* hoặc *"DA NHẠY CẢM"*.
- **FR-REV-03 (Ưu tiên hiển thị review cùng nền da):** Tự động đẩy các review của người có cùng loại da với người đăng nhập lên đầu trang.
- **FR-REV-04 (Gửi đánh giá mới):** Form đánh giá sản phẩm (số sao, nhận xét, loại da của người viết).

### Module 13: Quản Trị Sàn Tinh Gọn (Admin Dashboard)
- **FR-ADM-01 (Thống kê tổng quan):** Thẻ KPI: Tổng số sản phẩm, tổng đơn hàng, doanh thu thực tế, số tài khoản người dùng.
- **FR-ADM-02 (Quản lý sản phẩm CRUD):** Thêm mới, chỉnh sửa thông tin sản phẩm, cập nhật giá, hình ảnh, phân loại và nhập danh sách thành phần INCI.
- **FR-ADM-03 (Quản lý đơn hàng):** Xem danh sách đơn và cập nhật trạng thái đơn hàng (`Chờ xử lý` ➔ `Đang giao hàng` ➔ `Hoàn thành` / `Hủy đơn`).
- **FR-ADM-04 (Quản lý danh mục & thương hiệu):** Thêm/sửa danh mục và thương hiệu.

### Module 14: Trang Tĩnh & Thông Tin Bổ Trợ
- **FR-STA-01:** Trang FAQ & Hướng dẫn tra cứu thành phần.
- **FR-STA-02:** Trang Phương pháp tính điểm khoa học (Match Score methodology).
- **FR-STA-03:** Trang Chính sách bảo mật thông tin hồ sơ da & Điều khoản dịch vụ.
- **FR-STA-04:** Trang 404 thân thiện.

---

## 3. Ma Trận Tính Năng Phase 1 (MVP) vs Phase 2 (Future Scope)

| Hạng mục | Phase 1 (MVP 30 ngày — Hoàn thiện PROD) | Phase 2 (Lộ trình 6 tháng tương lai) |
|---|---|---|
| **Xác thực** | Email/Mật khẩu chuẩn, JWT / Cookie, RBAC | Social OAuth (Google, Facebook), Quên mật khẩu qua email token |
| **Thanh toán** | Thanh toán COD (Tiền mặt khi nhận hàng) | Cổng thanh toán trực tuyến (VNPay, MoMo, VietQR tự động) |
| **Giao hàng** | Địa chỉ nhận hàng chuẩn, phí ship cố định | Tích hợp API đối tác vận chuyển (GHN, GHTK tính phí thời gian thực) |
| **Tiền tệ** | Duy nhất **VNĐ** | Đa tiền tệ (USD/VNĐ) và API tỷ giá tự động |
| **Thông báo** | Banner cảnh báo trực tiếp trên giao diện | Email thông báo tự động (SMTP), Push Notification, Zalo OA |
| **AI / ML** | Gemini API (Grounding + Guardrail), Thuật toán Rule-based | Mô hình ML Recommendation tự học trên hành vi người dùng |
| **Dị ứng / Xung đột** | Quét giỏ hàng & Routine (12 cặp quy tắc y văn cố định) | Admin UI tạo quy tắc tùy biến, quét sản phẩm đang dùng ở nhà |
| **Mobile App** | Web Responsive hoàn hảo trên điện thoại | React Native Mobile App chính thức trên iOS & Android |

---

## 4. Tiêu Chuẩn Nghiệm Thu & Định Nghĩa Hoàn Thành (Definition of Done)

Một chức năng trong Phase 1 được coi là **DONE** khi và chỉ khi:
1. Giao diện người dùng trên web hoạt động mượt mà, không vỡ layout trên cả Desktop và Mobile.
2. API .NET 10 xử lý trả dữ liệu chính xác, có kiểm soát validation đầu vào.
3. Bộ test kiến trúc (`BeautyAI.ArchitectureTests`) không bị vi phạm (đặc biệt là bất biến **INV-01**: không tồn tại `SafetyScore`).
4. Không phát sinh cảnh báo bí mật (Secret leak) hoặc lỗi chất lượng (`./syntheprise gate` báo Clean).
5. Kịch bản thuyết trình demo (Happy Path) chạy thông suốt từ Đăng ký ➔ Chẩn đoán da ➔ Chọn sản phẩm ➔ Phân tích INCI ➔ Cảnh báo dị ứng ➔ Giỏ hàng phát hiện xung đột ➔ Đặt hàng COD ➔ Admin duyệt đơn.
